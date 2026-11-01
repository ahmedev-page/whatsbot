import type {
  ApiKeyRow,
  ConversationMessageRow,
  Env,
  PendingImage,
  PlatformSettingRow,
  UserRow,
  WebsiteRow,
} from "./types";

const SUPABASE_TIMEOUT_MS = 15_000;

function baseUrl(env: Env): string {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase Worker secrets are incomplete");
  }
  return env.SUPABASE_URL.replace(/\/$/, "");
}

async function fetchSupabase(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("Supabase request timed out"), SUPABASE_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function supabaseRequest<T>(
  env: Env,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetchSupabase(`${baseUrl(env)}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${errorText}`);
  }
  const body = await response.text();
  return (body ? JSON.parse(body) : []) as T;
}

export async function supabaseRpc<T>(
  env: Env,
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetchSupabase(`${baseUrl(env)}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase RPC failed (${response.status}): ${errorText}`);
  }
  const bodyText = await response.text();
  return (bodyText ? JSON.parse(bodyText) : []) as T;
}

export async function ensureUser(env: Env, phone: string): Promise<UserRow> {
  const existing = await supabaseRequest<UserRow[]>(
    env,
    `users?phone_number=eq.${encodeURIComponent(phone)}&select=*&limit=1`,
  );
  if (existing[0]) return existing[0];

  await supabaseRequest<UserRow[]>(
    env,
    "users?on_conflict=phone_number",
    {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({ phone_number: phone }),
    },
  );
  const created = await supabaseRequest<UserRow[]>(
    env,
    `users?phone_number=eq.${encodeURIComponent(phone)}&select=*&limit=1`,
  );
  if (!created[0]) throw new Error("Unable to create or load WhatsApp user");
  return created[0];
}

export async function consumeMessageQuota(env: Env, userId: string): Promise<UserRow | null> {
  const result = await supabaseRpc<UserRow[]>(env, "consume_message_quota", {
    p_user_id: userId,
  });
  return result[0] ?? null;
}

export async function getLatestWebsite(env: Env, userId: string): Promise<WebsiteRow | null> {
  const rows = await supabaseRequest<WebsiteRow[]>(
    env,
    `websites?user_id=eq.${encodeURIComponent(userId)}&select=*&order=updated_at.desc&limit=1`,
  );
  return rows[0] ?? null;
}

export async function getWebsiteByPublicId(
  env: Env,
  publicId: string,
): Promise<WebsiteRow | null> {
  const filter = /^[0-9a-f-]{36}$/i.test(publicId)
    ? `public_id=eq.${encodeURIComponent(publicId)}`
    : `username=eq.${encodeURIComponent(publicId)}`;
  const rows = await supabaseRequest<WebsiteRow[]>(
    env,
    `websites?${filter}&select=*&limit=1`,
  );
  return rows[0] ?? null;
}

export async function recordVisit(env: Env, websiteId: string): Promise<void> {
  await supabaseRequest(env, "site_visits", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ website_id: websiteId }),
  });
}

export async function getVisitStats(env: Env, websiteId: string): Promise<{ today: number; total: number }> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const [todayRows, totalRows] = await Promise.all([
    supabaseRequest<Array<{ count: number }>>(
      env,
      `site_visits?website_id=eq.${encodeURIComponent(websiteId)}&visited_at=gte.${encodeURIComponent(todayStart.toISOString())}&select=count()`,
    ),
    supabaseRequest<Array<{ count: number }>>(
      env,
      `site_visits?website_id=eq.${encodeURIComponent(websiteId)}&select=count()`,
    ),
  ]);
  return { today: Number(todayRows[0]?.count ?? 0), total: Number(totalRows[0]?.count ?? 0) };
}
// --- Platform sign-in challenges (see migrations/016_login_challenges.sql) ---

export interface LoginChallengeRow {
  id: string;
  code: string;
  status: "pending" | "verified" | "consumed";
  phone_number: string | null;
  user_id: string | null;
  created_at: string;
  expires_at: string;
  verified_at: string | null;
}

// Unambiguous alphabet (no 0/O, 1/I/L) — the code is read off a screen and
// typed or tapped into a chat, so look-alike characters cost real people.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateLoginCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `ORX-${Array.from(bytes, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join("")}`;
}

export async function createLoginChallenge(env: Env, ttlSeconds: number): Promise<LoginChallengeRow> {
  const rows = await supabaseRequest<LoginChallengeRow[]>(env, "login_challenges", {
    method: "POST",
    body: JSON.stringify({
      code: generateLoginCode(),
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    }),
  });
  if (!rows[0]) throw new Error("Login challenge creation returned no row");
  return rows[0];
}

export async function getLoginChallengeById(env: Env, id: string): Promise<LoginChallengeRow | null> {
  const rows = await supabaseRequest<LoginChallengeRow[]>(
    env,
    `login_challenges?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  return rows[0] ?? null;
}

// Called by the bot when someone sends a code. The status=eq.pending filter
// makes the transition atomic: of two simultaneous sends of the same code,
// only one row update matches, so a challenge can never be bound twice.
export async function verifyLoginChallengeByCode(
  env: Env,
  code: string,
  phone: string,
  userId: string,
): Promise<boolean> {
  const rows = await supabaseRequest<LoginChallengeRow[]>(
    env,
    `login_challenges?code=eq.${encodeURIComponent(code)}&status=eq.pending&expires_at=gt.${encodeURIComponent(new Date().toISOString())}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "verified",
        phone_number: phone,
        user_id: userId,
        verified_at: new Date().toISOString(),
      }),
    },
  );
  return rows.length > 0;
}

// Called when the browser collects its session. Same atomic trick: only a
// still-'verified' row flips to 'consumed', so one verification yields
// exactly one session.
export async function consumeLoginChallenge(env: Env, id: string): Promise<LoginChallengeRow | null> {
  const rows = await supabaseRequest<LoginChallengeRow[]>(
    env,
    `login_challenges?id=eq.${encodeURIComponent(id)}&status=eq.verified`,
    { method: "PATCH", body: JSON.stringify({ status: "consumed" }) },
  );
  return rows[0] ?? null;
}

export async function getUserById(env: Env, id: string): Promise<UserRow | null> {
  const rows = await supabaseRequest<UserRow[]>(env, `users?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  return rows[0] ?? null;
}

export async function createWebsite(
  env: Env,
  data: Omit<WebsiteRow, "id" | "user_id" | "public_id" | "created_at" | "updated_at"> & {
    user_id: string;
  },
): Promise<WebsiteRow> {
  const rows = await supabaseRequest<WebsiteRow[]>(env, "websites", {
    method: "POST",
    body: JSON.stringify({
      user_id: data.user_id,
      username: data.username,
      site_name: data.site_name,
      template_id: data.template_id,
      theme_color: data.theme_color,
      json_structure: data.json_structure,
      show_branding: data.show_branding,
    }),
  });
  if (!rows[0]) throw new Error("Website creation returned no row");
  return rows[0];
}

export async function updateWebsite(
  env: Env,
  websiteId: string,
  data: Pick<WebsiteRow, "site_name" | "template_id" | "theme_color" | "json_structure">,
): Promise<WebsiteRow> {
  const rows = await supabaseRequest<WebsiteRow[]>(env, `websites?id=eq.${encodeURIComponent(websiteId)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }),
  });
  if (!rows[0]) throw new Error("Website update returned no row");
  return rows[0];
}

// Optimistic-concurrency update for the dashboard editor: the PATCH only
// matches if updated_at is still what the editor loaded, so a save can never
// silently overwrite an edit made meanwhile (e.g. through the WhatsApp bot).
// Returns null when nothing matched — the caller reports a conflict.
export async function updateWebsiteIfUnchanged(
  env: Env,
  websiteId: string,
  expectedUpdatedAt: string,
  data: Pick<WebsiteRow, "site_name" | "template_id" | "theme_color" | "json_structure">,
): Promise<WebsiteRow | null> {
  const rows = await supabaseRequest<WebsiteRow[]>(
    env,
    `websites?id=eq.${encodeURIComponent(websiteId)}&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`,
    { method: "PATCH", body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }) },
  );
  return rows[0] ?? null;
}

// Each account has exactly one website (createWebsite is only ever called
// while getLatestWebsite(env, userId) is null — see message-handler.ts). This
// deletes that row outright so the same !website gate that guards creation
// reopens on the person's very next message, letting them start over.
export async function deleteWebsite(env: Env, websiteId: string): Promise<void> {
  await supabaseRequest(env, `websites?id=eq.${encodeURIComponent(websiteId)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

export type WebsiteWithOwner = WebsiteRow & { users: { phone_number: string } | null };

export async function listWebsitesForAdmin(env: Env): Promise<WebsiteWithOwner[]> {
  return supabaseRequest<WebsiteWithOwner[]>(
    env,
    "websites?select=id,public_id,site_name,template_id,theme_color,show_branding,created_at,updated_at,users(phone_number)&order=updated_at.desc",
  );
}

export async function updateWebsiteBranding(
  env: Env,
  websiteId: string,
  showBranding: boolean,
): Promise<WebsiteWithOwner | null> {
  const rows = await supabaseRequest<WebsiteWithOwner[]>(
    env,
    `websites?id=eq.${encodeURIComponent(websiteId)}&select=id,public_id,site_name,template_id,theme_color,show_branding,created_at,updated_at,users(phone_number)`,
    { method: "PATCH", body: JSON.stringify({ show_branding: showBranding }) },
  );
  return rows[0] ?? null;
}

export async function getActiveApiKeys(env: Env): Promise<ApiKeyRow[]> {
  return supabaseRequest<ApiKeyRow[]>(
    env,
    "api_keys?provider=eq.gemini&status=eq.active&select=*&order=id.asc",
  );
}

export async function markApiKeyUsed(env: Env, id: string): Promise<void> {
  await supabaseRequest(env, `api_keys?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ last_used_at: new Date().toISOString() }),
  });
}

export async function getSettings(env: Env): Promise<Record<string, string>> {
  const rows = await supabaseRequest<PlatformSettingRow[]>(
    env,
    "platform_settings?select=key,value",
  );
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function claimProcessedMessage(
  env: Env,
  messageId: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  return supabaseRpc<boolean>(env, "claim_processed_message", {
    p_message_id: messageId,
    p_payload: payload,
  });
}

export async function finishProcessedMessage(env: Env, messageId: string): Promise<void> {
  await supabaseRequest(env, `processed_messages?message_id=eq.${encodeURIComponent(messageId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "processed",
      processed_at: new Date().toISOString(),
      last_error: null,
    }),
  });
}

export async function failProcessedMessage(
  env: Env,
  messageId: string,
  error: unknown,
): Promise<void> {
  await supabaseRequest(env, `processed_messages?message_id=eq.${encodeURIComponent(messageId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "failed",
      last_error: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
    }),
  });
}

export async function setPendingBuildRequest(
  env: Env,
  userId: string,
  request: string | null,
): Promise<void> {
  await supabaseRequest(env, `users?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ pending_build_request: request }),
  });
}

export async function setPendingImage(env: Env, userId: string, url: string | null): Promise<void> {
  await supabaseRequest(env, `users?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ pending_image_url: url }),
  });
}

export async function setPendingImageNewKey(env: Env, userId: string, key: string | null): Promise<void> {
  await supabaseRequest(env, `users?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ pending_image_new_key: key }),
  });
}

// Batch-placement queue: extra images that arrived while an earlier one was
// still waiting on a placement choice. Stored as a plain jsonb array on the
// user row (small, short-lived — a handful of images at most), so a
// read-modify-write is simple and avoids adding a whole new table.
export async function setPendingImages(env: Env, userId: string, images: PendingImage[]): Promise<void> {
  await supabaseRequest(env, `users?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ pending_images: images }),
  });
}

// Step-by-step flow state (add item / edit item) — one column for "which
// step" and one small jsonb column for the draft being built across steps.
// Passing flow=null clears both, same shape as clearAllPendingImageState.
export async function setPendingFlow(
  env: Env,
  userId: string,
  flow: string | null,
  data: Record<string, unknown> = {},
): Promise<void> {
  await supabaseRequest(env, `users?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ pending_flow: flow, pending_flow_data: data }),
  });
}

export async function clearAllPendingImageState(env: Env, userId: string): Promise<void> {
  await supabaseRequest(env, `users?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ pending_image_url: null, pending_image_new_key: null, pending_images: [] }),
  });
}

export async function updateUserBlocked(env: Env, userId: string, blocked: boolean): Promise<UserRow | null> {
  const rows = await supabaseRequest<UserRow[]>(env, `users?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ blocked }),
  });
  return rows[0] ?? null;
}

// Uploads raw image bytes to the public "website-images" Storage bucket and
// returns the public URL. Uses the service-role key, which bypasses bucket
// RLS entirely, so this works regardless of the bucket's own policies.
export async function uploadImageToStorage(
  env: Env,
  path: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const response = await fetchSupabase(
    `${baseUrl(env)}/storage/v1/object/website-images/${path}?upsert=true`,
    {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": contentType,
      },
      body: bytes,
    },
  );
  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(`Supabase storage upload failed (${response.status}): ${details}`);
  }
  return `${baseUrl(env)}/storage/v1/object/public/website-images/${path}`;
}

export async function addConversationMessage(
  env: Env,
  userId: string,
  direction: "inbound" | "outbound",
  content: string,
): Promise<void> {
  await supabaseRequest(env, "conversation_messages", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      direction,
      content: content.slice(0, 4000),
      // Outbound (bot) messages don't need an unread state in the admin
      // inbox — only what the *user* sent needs an admin's attention.
      is_read: direction === "outbound",
      read_at: direction === "outbound" ? new Date().toISOString() : null,
    }),
  });
}

// Short recent history used purely as Gemini context — unrelated to the
// admin inbox's read/unread state below.
export async function getConversationMessages(env: Env, userId: string): Promise<Array<{
  direction: "inbound" | "outbound";
  content: string;
}>> {
  return supabaseRequest(env, `conversation_messages?user_id=eq.${encodeURIComponent(userId)}&select=direction,content&order=created_at.desc&limit=8`);
}

// Admin inbox — paginated, newest first, 5 at a time by default. Passing
// `before` (a message id) loads the page of messages older than that id, so
// "عرض السابق" only ever fetches one extra page instead of the whole thread.
export async function getConversationMessagesPage(
  env: Env,
  userId: string,
  options: { before?: number; limit?: number } = {},
): Promise<ConversationMessageRow[]> {
  const limit = Math.min(Math.max(options.limit ?? 5, 1), 50);
  const filters = [
    `user_id=eq.${encodeURIComponent(userId)}`,
    options.before ? `id=lt.${encodeURIComponent(String(options.before))}` : null,
    "select=*",
    "order=created_at.desc,id.desc",
    `limit=${limit}`,
  ].filter(Boolean);
  return supabaseRequest<ConversationMessageRow[]>(env, `conversation_messages?${filters.join("&")}`);
}

// Marks exactly the messages an admin just fetched as read — never a bulk
// "mark all read" — so opening one user's thread can't quietly clear unread
// counts for messages nobody actually looked at yet.
export async function markConversationMessagesRead(env: Env, ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await supabaseRequest(env, `conversation_messages?id=in.(${ids.join(",")})&is_read=eq.false`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ is_read: true, read_at: new Date().toISOString() }),
  });
}

// One cheap query for the admin users list, so it can show which users have
// a new message without opening each thread. Counted in the Worker rather
// than with a grouped SQL aggregate, since only the user_id column is
// fetched (small payload) and it avoids depending on a specific PostgREST
// version's grouping support.
export async function getUnreadMessageCounts(env: Env): Promise<Map<string, number>> {
  const rows = await supabaseRequest<Array<{ user_id: string }>>(
    env,
    "conversation_messages?direction=eq.inbound&is_read=eq.false&select=user_id",
  );
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  return counts;
}
