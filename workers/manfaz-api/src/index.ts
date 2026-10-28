import { clearUserSessionCookie, encryptSecret, getUserIdFromRequest, isAdminRequest, sessionCookie, userSessionCookie } from "./crypto";
import { getMetaPhoneNumber, sendTextMessage, sendTypingIndicator, verifyMetaSignature } from "./meta";
import { processIncomingMessage } from "./message-handler";
import {
  addConversationMessage,
  consumeLoginChallenge,
  createLoginChallenge,
  getConversationMessagesPage,
  getLatestWebsite,
  getLoginChallengeById,
  getSettings,
  getUserById,
  getVisitStats,
  getUnreadMessageCounts,
  getWebsiteByPublicId,
  listWebsitesForAdmin,
  markConversationMessagesRead,
  recordVisit,
  supabaseRequest,
  updateUserBlocked,
  updateWebsiteBranding,
  updateWebsiteIfUnchanged,
  uploadImageToStorage,
} from "./supabase";
import {
  imageSupportByStyle,
  isHexColor,
  matchesImageSignature,
  MAX_UPLOAD_BYTES,
  cleanString,
  collectImageUrls,
  filterSupportedStructureFields,
  sanitizeStructure,
  STYLES,
  templateCollection,
  UPLOAD_TYPES,
} from "./site-schema";
import type { WebsiteWithOwner } from "./supabase";
import type {
  ApiKeyRow,
  ConversationMessageRow,
  Env,
  IncomingMessage,
  PlatformSettingRow,
  UserRow,
  WebsiteRow,
} from "./types";

const memoryLoginAttempts = new Map<string, { count: number; resetAt: number }>();
const loginWindowSeconds = 15 * 60;
const loginMaxAttempts = 5;

function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

function corsHeaders(env: Env, request: Request): Record<string, string> {
  const origin = request.headers.get("Origin");
  const allowed = (env.FRONTEND_URL || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return {
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "Content-Type",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,OPTIONS",
    ...(origin && allowed.includes(origin) ? { "access-control-allow-origin": origin } : {}),
  };
}

function isAllowedOrigin(env: Env, request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  return (env.FRONTEND_URL || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean)
    .includes(origin);
}

function withCors(response: Response, env: Env, request: Request): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(env, request))) headers.set(key, value);
  return new Response(response.body, { status: response.status, headers });
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = (await request.json()) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}

async function rateLimitLogin(env: Env, address: string): Promise<{
  limited: boolean;
  retryAfter?: number;
}> {
  const now = Math.floor(Date.now() / 1000);
  const key = `login:${address}`;
  let current: { count: number; resetAt: number } | null = null;
  if (env.MANFAZ_RATE_LIMIT) {
    current = await env.MANFAZ_RATE_LIMIT.get<{ count: number; resetAt: number }>(key, "json");
  } else {
    current = memoryLoginAttempts.get(address) ?? null;
  }
  if (current && current.resetAt > now && current.count >= loginMaxAttempts) {
    return { limited: true, retryAfter: current.resetAt - now };
  }
  return { limited: false };
}

async function recordLoginFailure(env: Env, address: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const key = `login:${address}`;
  const existing = env.MANFAZ_RATE_LIMIT
    ? await env.MANFAZ_RATE_LIMIT.get<{ count: number; resetAt: number }>(key, "json")
    : memoryLoginAttempts.get(address);
  const record =
    existing && existing.resetAt > now
      ? { count: existing.count + 1, resetAt: existing.resetAt }
      : { count: 1, resetAt: now + loginWindowSeconds };
  if (env.MANFAZ_RATE_LIMIT) {
    await env.MANFAZ_RATE_LIMIT.put(key, JSON.stringify(record), {
      expirationTtl: loginWindowSeconds,
    });
  } else {
    memoryLoginAttempts.set(address, record);
  }
}

async function clearLoginFailures(env: Env, address: string): Promise<void> {
  if (env.MANFAZ_RATE_LIMIT) await env.MANFAZ_RATE_LIMIT.delete(`login:${address}`);
  else memoryLoginAttempts.delete(address);
}

async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  if (!isAllowedOrigin(env, request)) return json({ error: "Invalid request origin" }, 403);
  if (!await isAdminRequest(request, env.SESSION_SECRET)) {
    return json({ error: "Admin authentication required" }, 401);
  }
  return null;
}

function publicUser(user: UserRow, websiteCount: number, unreadMessages = 0) {
  return {
    id: user.id,
    phoneNumber: user.phone_number,
    freeMessagesUsed: user.free_messages_used,
    freeMessagesLimit: user.free_messages_limit,
    websiteCount,
    blocked: user.blocked,
    unreadMessages,
    createdAt: user.created_at,
  };
}

function publicMessage(message: ConversationMessageRow) {
  return {
    id: message.id,
    direction: message.direction,
    content: message.content,
    isRead: message.is_read,
    createdAt: message.created_at,
  };
}

function maskKey(value: string): string {
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}${"•".repeat(12)}${value.slice(-4)}`;
}

function publicKey(key: ApiKeyRow) {
  return {
    id: key.id,
    provider: key.provider,
    maskedKey: maskKey(key.key_string),
    status: key.status,
    lastUsedAt: key.last_used_at,
  };
}

function publicWebsite(website: WebsiteWithOwner) {
  return {
    id: website.id,
    publicId: website.public_id,
    siteName: website.site_name,
    templateId: website.template_id,
    themeColor: website.theme_color,
    showBranding: website.show_branding,
    ownerPhone: website.users?.phone_number ?? null,
    createdAt: website.created_at,
    updatedAt: website.updated_at,
  };
}

async function handlePublic(request: Request, env: Env, pathname: string): Promise<Response> {
  if (pathname === "/api/public/settings/whatsapp" && request.method === "GET") {
    const settings = await getSettings(env);
    let whatsappNumber = settings.whatsapp_number || "";
    if (!whatsappNumber && env.META_WHATSAPP_TOKEN && env.META_PHONE_NUMBER_ID) {
      whatsappNumber = await getMetaPhoneNumber(env);
    }
    return json({
      whatsappNumber,
      frontendUrl: settings.frontend_url || env.FRONTEND_URL || "http://localhost",
    });
  }

  const websiteMatch = pathname.match(/^\/api\/public\/websites\/([^/]+)$/);
  if (websiteMatch && request.method === "GET") {
    const website = await getWebsiteByPublicId(env, websiteMatch[1]);
    const noStore = { "cache-control": "no-store, must-revalidate" };
    if (!website) return json({ error: "Website not found" }, 404, noStore);
    return json(
      {
        id: website.id,
        publicId: website.public_id,
        username: website.username,
        siteName: website.site_name,
        templateId: website.template_id,
        themeColor: website.theme_color,
        jsonStructure: website.json_structure,
        showBranding: website.show_branding,
        createdAt: website.created_at,
        updatedAt: website.updated_at,
      },
      200,
      noStore,
    );
  }

  const visitMatch = pathname.match(/^\/api\/public\/websites\/([^/]+)\/visit$/);
  if (visitMatch && request.method === "POST") {
    const website = await getWebsiteByPublicId(env, visitMatch[1]);
    if (!website) return json({ error: "Website not found" }, 404);
    await recordVisit(env, website.id);
    return json({ recorded: true });
  }

  return json({ error: "Not found" }, 404);
}

async function handleAdmin(request: Request, env: Env, pathname: string): Promise<Response> {
  if (pathname === "/api/admin/login" && request.method === "POST") {
    const address = request.headers.get("CF-Connecting-IP") || "unknown";
    const limit = await rateLimitLogin(env, address);
    if (limit.limited) {
      return json({ error: "Too many login attempts. Try again later." }, 429, {
        "retry-after": String(limit.retryAfter),
      });
    }
    const body = await readJson(request);
    const password = typeof body.password === "string" ? body.password : "";
    if (!password || password !== env.ADMIN_PASSWORD) {
      await recordLoginFailure(env, address);
      return json({ error: "Invalid admin password" }, 401);
    }
    await clearLoginFailures(env, address);
    return json({ authenticated: true }, 200, {
      "set-cookie": await sessionCookie(env.SESSION_SECRET, "none"),
    });
  }

  const authenticationError = await requireAdmin(request, env);
  if (authenticationError) return authenticationError;

  if (pathname === "/api/admin/summary" && request.method === "GET") {
    const [users, websites, keys, settings] = await Promise.all([
      supabaseRequest<UserRow[]>(env, "users?select=id,free_messages_used"),
      supabaseRequest<WebsiteRow[]>(env, "websites?select=id"),
      supabaseRequest<ApiKeyRow[]>(env, "api_keys?status=eq.active&select=id"),
      getSettings(env),
    ]);
    return json({
      totalUsers: users.length,
      totalWebsites: websites.length,
      messagesUsed: users.reduce((sum, user) => sum + Number(user.free_messages_used), 0),
      activeApiKeys: keys.length,
      whatsappConfigured: Boolean(settings.whatsapp_number),
    });
  }

  if (pathname === "/api/admin/whatsapp/status" && request.method === "GET") {
    const settings = await getSettings(env);
    const phoneNumberId = env.META_PHONE_NUMBER_ID || settings.meta_phone_number_id || null;
    if (!phoneNumberId || !env.META_WHATSAPP_TOKEN) {
      return json({
        connected: false,
        phoneNumberId,
        displayName: null,
        message: "أضف بيانات Meta Cloud API في متغيرات البيئة.",
      });
    }
    const response = await fetch(
      `https://graph.facebook.com/${env.META_GRAPH_VERSION || "v20.0"}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name`,
      { headers: { Authorization: `Bearer ${env.META_WHATSAPP_TOKEN}` } },
    );
    if (!response.ok) {
      return json({
        connected: false,
        phoneNumberId,
        displayName: null,
        message: "تعذر الاتصال بـ Meta Cloud API.",
      });
    }
    const data = (await response.json()) as { display_phone_number?: string; verified_name?: string };
    return json({
      connected: true,
      phoneNumberId,
      displayName: data.verified_name || data.display_phone_number || null,
      message: "متصل وجاهز لاستقبال الرسائل.",
    });
  }

  if (pathname === "/api/admin/users" && request.method === "GET") {
    const [users, websites, unreadCounts] = await Promise.all([
      supabaseRequest<UserRow[]>(env, "users?select=* &order=created_at.desc".replace(" ", "")),
      supabaseRequest<WebsiteRow[]>(env, "websites?select=id,user_id"),
      getUnreadMessageCounts(env),
    ]);
    const counts = new Map<string, number>();
    for (const website of websites) counts.set(website.user_id, (counts.get(website.user_id) || 0) + 1);
    return json(users.map((user) => publicUser(user, counts.get(user.id) || 0, unreadCounts.get(user.id) || 0)));
  }

  const blockMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/blocked$/);
  if (blockMatch && request.method === "PATCH") {
    const body = await readJson(request);
    if (typeof body.blocked !== "boolean") return json({ error: "Invalid blocked value" }, 400);
    const updated = await updateUserBlocked(env, blockMatch[1], body.blocked);
    if (!updated) return json({ error: "User not found" }, 404);
    const websites = await supabaseRequest<WebsiteRow[]>(
      env,
      `websites?user_id=eq.${encodeURIComponent(blockMatch[1])}&select=id`,
    );
    return json(publicUser(updated, websites.length));
  }

  // Paginated inbox for one user, newest-first, 5 per page by default —
  // "عرض السابق" passes ?before=<oldest id shown so far> to load one more
  // page. Fetching a page marks exactly those inbound messages as read, so
  // opening a thread never bulk-marks messages nobody has actually seen.
  const messagesMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/messages$/);
  if (messagesMatch && request.method === "GET") {
    const params = new URL(request.url).searchParams;
    const before = params.get("before");
    const page = await getConversationMessagesPage(env, messagesMatch[1], {
      before: before ? Number(before) : undefined,
      limit: 5,
    });
    const unreadIds = page.filter((message) => message.direction === "inbound" && !message.is_read).map((m) => m.id);
    await markConversationMessagesRead(env, unreadIds);
    return json({
      messages: page.map((message) => publicMessage({ ...message, is_read: unreadIds.includes(message.id) ? true : message.is_read })),
      hasMore: page.length === 5,
    });
  }

  const sendMessageMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/message$/);
  if (sendMessageMatch && request.method === "POST") {
    const body = await readJson(request);
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 4096) return json({ error: "Invalid message" }, 400);
    const users = await supabaseRequest<UserRow[]>(
      env,
      `users?id=eq.${encodeURIComponent(sendMessageMatch[1])}&select=*`,
    );
    const user = users[0];
    if (!user) return json({ error: "User not found" }, 404);
    try {
      await sendTextMessage(env, user.phone_number, message);
    } catch (error) {
      console.error("Admin send-message failed", error);
      return json({ error: "Failed to deliver the message via WhatsApp" }, 502);
    }
    // Telemetry only — the message already sent, so a history-write hiccup
    // shouldn't turn a successful send into an error response.
    await addConversationMessage(env, user.id, "outbound", message).catch((error) =>
      console.error("Conversation history write failed", error),
    );
    return json({ sent: true });
  }

  const quotaMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/quota$/);
  if (quotaMatch && request.method === "PATCH") {
    const body = await readJson(request);
    const delta = typeof body.delta === "number" && Number.isInteger(body.delta) ? body.delta : NaN;
    if (!Number.isInteger(delta) || delta < -1000 || delta > 1000) {
      return json({ error: "Invalid quota delta" }, 400);
    }
    const users = await supabaseRequest<UserRow[]>(
      env,
      `users?id=eq.${encodeURIComponent(quotaMatch[1])}&select=*`,
    );
    if (!users[0]) return json({ error: "User not found" }, 404);
    const nextLimit = Math.max(0, users[0].free_messages_limit + delta);
    const updated = await supabaseRequest<UserRow[]>(
      env,
      `users?id=eq.${encodeURIComponent(quotaMatch[1])}`,
      { method: "PATCH", body: JSON.stringify({ free_messages_limit: nextLimit }) },
    );
    const websites = await supabaseRequest<WebsiteRow[]>(
      env,
      `websites?user_id=eq.${encodeURIComponent(quotaMatch[1])}&select=id`,
    );
    return json(publicUser(updated[0] || { ...users[0], free_messages_limit: nextLimit }, websites.length));
  }

  if (pathname === "/api/admin/api-keys" && request.method === "GET") {
    const keys = await supabaseRequest<ApiKeyRow[]>(env, "api_keys?select=*&order=id.desc");
    return json(keys.map(publicKey));
  }
  if (pathname === "/api/admin/api-keys" && request.method === "POST") {
    const body = await readJson(request);
    if (typeof body.key !== "string" || body.key.length < 10) return json({ error: "Invalid API key" }, 400);
    const keys = await supabaseRequest<ApiKeyRow[]>(env, "api_keys", {
      method: "POST",
      body: JSON.stringify({ key_string: await encryptSecret(env.SESSION_SECRET, body.key) }),
    });
    return json(publicKey(keys[0]), 201);
  }

  const keyMatch = pathname.match(/^\/api\/admin\/api-keys\/([^/]+)$/);
  if (keyMatch && request.method === "PATCH") {
    const body = await readJson(request);
    if (body.status !== "active" && body.status !== "disabled") return json({ error: "Invalid key status" }, 400);
    const keys = await supabaseRequest<ApiKeyRow[]>(
      env,
      `api_keys?id=eq.${encodeURIComponent(keyMatch[1])}`,
      { method: "PATCH", body: JSON.stringify({ status: body.status }) },
    );
    if (!keys[0]) return json({ error: "API key not found" }, 404);
    return json(publicKey(keys[0]));
  }

  if (pathname === "/api/admin/websites" && request.method === "GET") {
    const websites = await listWebsitesForAdmin(env);
    return json(websites.map(publicWebsite));
  }

  const brandingMatch = pathname.match(/^\/api\/admin\/websites\/([^/]+)\/branding$/);
  if (brandingMatch && request.method === "PATCH") {
    const body = await readJson(request);
    if (typeof body.showBranding !== "boolean") return json({ error: "Invalid showBranding value" }, 400);
    const website = await updateWebsiteBranding(env, brandingMatch[1], body.showBranding);
    if (!website) return json({ error: "Website not found" }, 404);
    return json(publicWebsite(website));
  }

  if (pathname === "/api/admin/settings" && request.method === "GET") {
    const settings = await supabaseRequest<PlatformSettingRow[]>(
      env,
      "platform_settings?select=key,value&order=key.asc",
    );
    return json(settings.map(({ key, value }) => ({ key, value })));
  }
  if (pathname === "/api/admin/settings" && request.method === "PUT") {
    const body = await readJson(request);
    if (!Array.isArray(body.settings)) return json({ error: "Invalid settings" }, 400);
    for (const setting of body.settings) {
      if (!setting || typeof setting !== "object" || typeof setting.key !== "string" || typeof setting.value !== "string") {
        return json({ error: "Invalid setting" }, 400);
      }
      await supabaseRequest(env, "platform_settings?on_conflict=key", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({ key: setting.key, value: setting.value }),
      });
    }
    const settings = await supabaseRequest<PlatformSettingRow[]>(
      env,
      "platform_settings?select=key,value&order=key.asc",
    );
    return json(settings.map(({ key, value }) => ({ key, value })));
  }

  return json({ error: "Not found" }, 404);
}

async function handleWebhook(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET") {
    if (
      url.searchParams.get("hub.mode") === "subscribe" &&
      url.searchParams.get("hub.verify_token") === env.META_VERIFY_TOKEN
    ) {
      return new Response(url.searchParams.get("hub.challenge") || "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const body = await request.arrayBuffer();
  if (!await verifyMetaSignature(env, body, request.headers.get("x-hub-signature-256"))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const payload = JSON.parse(new TextDecoder().decode(body)) as {
    entry?: Array<{ changes?: Array<{ value?: { messages?: IncomingMessage[] } }> }>;
  };
  const messages = payload.entry?.flatMap((entry) =>
    entry.changes?.flatMap((change) => change.value?.messages || []) || [],
  ) || [];
  // A webhook should be acknowledged quickly. Waiting for Meta's typing
  // request here can make Meta retry the webhook while the real work is still
  // waiting in line.
  context.waitUntil(
    Promise.all(
      messages.map((message) =>
        message.id
          ? sendTypingIndicator(env, message.id).catch((error) => {
              console.error("Typing indicator failed", error);
            })
          : Promise.resolve(),
      ),
    ),
  );
  if (env.WHATSAPP_QUEUE) {
    context.waitUntil(
      Promise.all(
        messages.map((message) =>
          env.WHATSAPP_QUEUE!.send({ message }).catch((error) => {
            console.error("Unable to enqueue WhatsApp message", error);
            throw error;
          }),
        ),
      ),
    );
  } else {
    context.waitUntil(Promise.all(messages.map((message) => processIncomingMessage(env, message))));
  }
  return new Response("EVENT_RECEIVED", { status: 200 });
}

// --- Platform accounts ------------------------------------------------------
// Sign-in is "send this code to the bot from your WhatsApp": see
// migrations/016_login_challenges.sql. The bot binds the code to the sender's
// number (message-handler.ts); the browser polls /api/auth/status with the
// unguessable challenge id and, once verified, is handed its session cookie.

const challengeTtlSeconds = 10 * 60;
const memoryHits = new Map<string, { count: number; resetAt: number }>();

// Small fixed-window limiter (KV when bound, per-isolate memory otherwise).
async function tooManyHits(env: Env, key: string, max: number, windowSeconds: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const existing = env.MANFAZ_RATE_LIMIT
    ? await env.MANFAZ_RATE_LIMIT.get<{ count: number; resetAt: number }>(key, "json")
    : (memoryHits.get(key) ?? null);
  const record =
    existing && existing.resetAt > now
      ? { count: existing.count + 1, resetAt: existing.resetAt }
      : { count: 1, resetAt: now + windowSeconds };
  if (env.MANFAZ_RATE_LIMIT) await env.MANFAZ_RATE_LIMIT.put(key, JSON.stringify(record), { expirationTtl: windowSeconds });
  else memoryHits.set(key, record);
  return record.count > max;
}

// Same precedence as /api/public/settings/whatsapp: the admin-configured
// number first, the number Meta reports for the phone id as the fallback.
async function resolveBotNumber(env: Env): Promise<string> {
  try {
    const settings = await getSettings(env);
    if (settings.whatsapp_number) return settings.whatsapp_number;
    if (env.META_WHATSAPP_TOKEN && env.META_PHONE_NUMBER_ID) return await getMetaPhoneNumber(env);
  } catch (error) {
    console.error("Unable to resolve the bot WhatsApp number", error);
  }
  return "";
}

function publicAccountWebsite(website: WebsiteRow, visits: { today: number; total: number }) {
  return {
    id: website.id,
    username: website.username,
    siteName: website.site_name,
    templateId: website.template_id,
    themeColor: website.theme_color,
    templateStyle:
      typeof website.json_structure?.templateStyle === "string" ? website.json_structure.templateStyle : "classic",
    showBranding: website.show_branding,
    createdAt: website.created_at,
    updatedAt: website.updated_at,
    visitsToday: visits.today,
    visitsTotal: visits.total,
  };
}

function fullAccountWebsite(website: WebsiteRow) {
  return {
    id: website.id,
    username: website.username,
    siteName: website.site_name,
    templateId: website.template_id,
    themeColor: website.theme_color,
    jsonStructure: website.json_structure,
    showBranding: website.show_branding,
    createdAt: website.created_at,
    updatedAt: website.updated_at,
    collectionKey: templateCollection(website.template_id).key,
    // Whether each style actually renders a photo per item — the editor
    // shows this *before* the person picks a style, not after a photo vanishes.
    imageSupport: imageSupportByStyle(website.template_id),
  };
}

async function handleAccount(request: Request, env: Env, pathname: string): Promise<Response> {
  if (pathname === "/api/auth/start" && request.method === "POST") {
    if (!isAllowedOrigin(env, request)) return json({ error: "Invalid request origin" }, 403);
    const address = request.headers.get("CF-Connecting-IP") || "unknown";
    if (await tooManyHits(env, `auth-start:${address}`, 12, 15 * 60)) {
      return json({ error: "Too many sign-in attempts. Try again in a few minutes." }, 429);
    }
    const challenge = await createLoginChallenge(env, challengeTtlSeconds);
    return json(
      {
        id: challenge.id,
        code: challenge.code,
        expiresAt: challenge.expires_at,
        whatsappNumber: await resolveBotNumber(env),
      },
      200,
      { "cache-control": "no-store" },
    );
  }

  if (pathname === "/api/auth/status" && request.method === "GET") {
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ status: "expired" }, 200, { "cache-control": "no-store" });
    const noStore = { "cache-control": "no-store" };
    const challenge = await getLoginChallengeById(env, id);
    if (!challenge || challenge.status === "consumed") return json({ status: "expired" }, 200, noStore);
    if (challenge.status === "pending") {
      return Date.parse(challenge.expires_at) < Date.now()
        ? json({ status: "expired" }, 200, noStore)
        : json({ status: "pending" }, 200, noStore);
    }
    // Verified by the bot: hand out exactly one session.
    const consumed = await consumeLoginChallenge(env, id);
    if (!consumed?.user_id) return json({ status: "expired" }, 200, noStore);
    return json({ status: "authenticated" }, 200, {
      ...noStore,
      "set-cookie": await userSessionCookie(env.SESSION_SECRET, consumed.user_id),
    });
  }

  if (pathname === "/api/auth/logout" && request.method === "POST") {
    if (!isAllowedOrigin(env, request)) return json({ error: "Invalid request origin" }, 403);
    return json({ ok: true }, 200, { "set-cookie": clearUserSessionCookie() });
  }

  if (pathname === "/api/me" && request.method === "GET") {
    const userId = await getUserIdFromRequest(request, env.SESSION_SECRET);
    if (!userId) return json({ error: "Sign in required" }, 401, { "cache-control": "no-store" });
    const user = await getUserById(env, userId);
    if (!user) return json({ error: "Sign in required" }, 401, { "cache-control": "no-store" });
    const website = await getLatestWebsite(env, user.id);
    const visits = website ? await getVisitStats(env, website.id) : { today: 0, total: 0 };
    return json(
      {
        id: user.id,
        phoneNumber: user.phone_number,
        freeMessagesUsed: user.free_messages_used,
        freeMessagesLimit: user.free_messages_limit,
        createdAt: user.created_at,
        website: website ? publicAccountWebsite(website, visits) : null,
      },
      200,
      { "cache-control": "no-store" },
    );
  }

  if (pathname === "/api/me/website" && (request.method === "GET" || request.method === "PATCH")) {
    const userId = await getUserIdFromRequest(request, env.SESSION_SECRET);
    if (!userId) return json({ error: "Sign in required" }, 401, { "cache-control": "no-store" });
    const website = await getLatestWebsite(env, userId);
    if (!website) return json({ error: "No website yet" }, 404, { "cache-control": "no-store" });
    if (request.method === "GET") return json(fullAccountWebsite(website), 200, { "cache-control": "no-store" });

    if (!isAllowedOrigin(env, request)) return json({ error: "Invalid request origin" }, 403);
    const body = await readJson(request);
    const baseUpdatedAt = typeof body.baseUpdatedAt === "string" ? body.baseUpdatedAt : "";
    if (!baseUpdatedAt) return json({ error: "baseUpdatedAt is required" }, 400);

    let siteName = website.site_name;
    if (body.siteName !== undefined) {
      const value = typeof body.siteName === "string" ? cleanString(body.siteName).trim() : "";
      if (!value || value.length > 80) return json({ error: "Invalid site name" }, 400);
      siteName = value;
    }
    let themeColor = website.theme_color;
    if (body.themeColor !== undefined) {
      if (!isHexColor(body.themeColor)) return json({ error: "Invalid color" }, 400);
      themeColor = body.themeColor;
    }

    let structure = website.json_structure;
    let dropped: string[] = [];
    if (body.jsonStructure !== undefined) {
      if (!body.jsonStructure || typeof body.jsonStructure !== "object" || Array.isArray(body.jsonStructure)) {
        return json({ error: "Invalid content" }, 400);
      }
      const filtered = filterSupportedStructureFields(body.jsonStructure as Record<string, unknown>, website.template_id);
      dropped = filtered.dropped;
      // Images may only point into this site's own storage folder.
      const imagePrefix = `${env.SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/website-images/${website.id}/`;
      const clean = sanitizeStructure(filtered.structure, { imagePrefix, existingImages: collectImageUrls(website.json_structure) });
      if ("templateStyle" in clean && !(STYLES as readonly string[]).includes(String(clean.templateStyle))) delete clean.templateStyle;
      if ("darkMode" in clean) clean.darkMode = clean.darkMode === true;
      // Merge at the top level: keys the editor never touched (legacy aliases
      // etc.) are kept, and clearing a list means sending an explicit [].
      structure = { ...website.json_structure, ...clean };
    }
    if (JSON.stringify(structure).length > 400_000) return json({ error: "Content is too large" }, 413);

    const updated = await updateWebsiteIfUnchanged(env, website.id, baseUpdatedAt, {
      site_name: siteName,
      template_id: website.template_id,
      theme_color: themeColor,
      json_structure: structure,
    });
    if (!updated) {
      const latest = await getLatestWebsite(env, userId);
      return json({ error: "conflict", updatedAt: latest?.updated_at ?? null }, 409);
    }
    return json({ ...fullAccountWebsite(updated), droppedFields: dropped }, 200, { "cache-control": "no-store" });
  }

  if (pathname === "/api/me/uploads" && request.method === "POST") {
    if (!isAllowedOrigin(env, request)) return json({ error: "Invalid request origin" }, 403);
    const userId = await getUserIdFromRequest(request, env.SESSION_SECRET);
    if (!userId) return json({ error: "Sign in required" }, 401);
    const website = await getLatestWebsite(env, userId);
    if (!website) return json({ error: "Create your site before uploading images" }, 404);
    if (await tooManyHits(env, `upload:${userId}`, 60, 60 * 60)) {
      return json({ error: "Too many uploads. Try again later." }, 429);
    }
    const type = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const extension = UPLOAD_TYPES[type];
    if (!extension) return json({ error: "Only JPG, PNG or WebP images are accepted" }, 415);
    if (Number(request.headers.get("content-length") || 0) > MAX_UPLOAD_BYTES) return json({ error: "Image is larger than 5 MB" }, 413);
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength === 0) return json({ error: "Empty file" }, 400);
    if (bytes.byteLength > MAX_UPLOAD_BYTES) return json({ error: "Image is larger than 5 MB" }, 413);
    if (!matchesImageSignature(type, new Uint8Array(bytes.slice(0, 12)))) {
      return json({ error: "The file is not a valid image" }, 415);
    }
    const url = await uploadImageToStorage(env, `${website.id}/${crypto.randomUUID()}.${extension}`, bytes, type);
    return json({ url }, 201, { "cache-control": "no-store" });
  }

  return json({ error: "Not found" }, 404);
}

const worker = {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), env, request);
      if (url.pathname === "/webhook") return withCors(await handleWebhook(request, env, context), env, request);
      if (url.pathname === "/api/healthz") return withCors(json({ status: "ok" }), env, request);
      const response = url.pathname.startsWith("/api/admin/")
        ? await handleAdmin(request, env, url.pathname)
        : url.pathname.startsWith("/api/auth/") || url.pathname === "/api/me" || url.pathname.startsWith("/api/me/")
          ? await handleAccount(request, env, url.pathname)
          : await handlePublic(request, env, url.pathname);
      return withCors(response, env, request);
    } catch (error) {
      if (error instanceof Response) return withCors(error, env, request);
      console.error(error);
      return withCors(json({ error: "Internal server error" }, 500), env, request);
    }
  },

  async queue(batch: MessageBatch<{ message: IncomingMessage }>, env: Env): Promise<void> {
    for (const item of batch.messages) {
      try {
        await processIncomingMessage(env, item.body.message);
        item.ack();
      } catch (error) {
        console.error("Unhandled queue processing error", error);
        item.retry();
      }
    }
  },
};

export default worker;