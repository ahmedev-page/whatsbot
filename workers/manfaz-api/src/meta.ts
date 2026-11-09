import type { Env } from "./types";

const META_TIMEOUT_MS = 15_000;

function graphVersion(env: Env): string {
  return env.META_GRAPH_VERSION || "v20.0";
}

// Meta's error body looks like {"error":{"message","type","code","error_subcode"}}.
// Keeping code/subcode lets the admin panel say *why* a send failed instead of
// a generic "check your WhatsApp setup".
export class MetaError extends Error {
  constructor(
    public status: number,
    public code: number | null,
    public subcode: number | null,
    public metaMessage: string,
    raw: string,
  ) {
    super(`Meta send failed with status ${status}: ${raw}`);
  }
}

export async function metaErrorFrom(response: Response): Promise<MetaError> {
  const raw = (await response.text()).slice(0, 500);
  let code: number | null = null;
  let subcode: number | null = null;
  let message = "";
  try {
    const body = JSON.parse(raw) as { error?: { message?: string; code?: number; error_subcode?: number } };
    code = typeof body.error?.code === "number" ? body.error.code : null;
    subcode = typeof body.error?.error_subcode === "number" ? body.error.error_subcode : null;
    message = body.error?.message ?? "";
  } catch {
    // Non-JSON body: keep the raw text only.
  }
  return new MetaError(response.status, code, subcode, message, raw);
}

// Arabic, actionable explanation of the most common Cloud API failures.
export function explainMetaError(error: unknown): string {
  if (!(error instanceof MetaError)) return "تعذّر الاتصال بخوادم Meta. حاول مرة أخرى.";
  const { status, code, subcode, metaMessage } = error;
  if (code === 190 || status === 401)
    return "رمز واتساب (META_WHATSAPP_TOKEN) منتهي أو غير صحيح. الرموز المؤقتة تنتهي خلال 24 ساعة — أنشئ رمزاً دائماً من System User في Meta وحدّثه في أسرار الـ Worker.";
  if (code === 131030)
    return "رقم المستلم غير مضاف في قائمة الأرقام المسموحة لرقم الاختبار. أضفه من Meta ← WhatsApp ← API Setup، أو انتقل لرقم تجاري حقيقي.";
  if (code === 131047 || code === 131051)
    return "مرّت أكثر من 24 ساعة على آخر رسالة من هذا المستخدم، فلا يمكن إرسال نص حر. يجب أن يراسل البوت أولاً أو تُستخدم رسالة قالب.";
  if (code === 131042 || code === 131031)
    return "حساب واتساب للأعمال متوقف أو لا توجد وسيلة دفع مفعّلة. راجع Meta Business ← Billing.";
  if (code === 100 || subcode === 33 || /does not exist|unknown path/i.test(metaMessage))
    return "META_PHONE_NUMBER_ID غير صحيح. يجب أن يكون «Phone number ID» (وليس WhatsApp Business Account ID) من صفحة API Setup.";
  if (code === 10 || code === 200 || code === 3)
    return "الرمز لا يملك صلاحية whatsapp_business_messaging. أعد إنشاء الرمز مع إعطاء الصلاحية للتطبيق.";
  if (code === 4 || code === 80007 || status === 429) return "تجاوز حد الإرسال لدى Meta مؤقتاً. حاول بعد قليل.";
  return `رفضت Meta الإرسال (رمز ${code ?? status}): ${metaMessage || "سبب غير معروف"}`;
}

async function fetchMeta(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("Meta request timed out"), META_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendTextMessage(env: Env, to: string, body: string): Promise<void> {
  const response = await fetchMeta(
    `https://graph.facebook.com/${graphVersion(env)}/${encodeURIComponent(env.META_PHONE_NUMBER_ID)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.META_WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: true, body },
      }),
    },
  );
  if (!response.ok) throw await metaErrorFrom(response);
}

// Interactive reply buttons — WhatsApp allows at most 3, each title capped at
// 20 chars. Used for menu-style choices (greeting, create/edit/view) so those
// common taps resolve with zero Gemini calls instead of going through the AI.
export async function sendButtonMessage(
  env: Env,
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
): Promise<void> {
  const response = await fetchMeta(
    `https://graph.facebook.com/${graphVersion(env)}/${encodeURIComponent(env.META_PHONE_NUMBER_ID)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.META_WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: bodyText },
          action: {
            buttons: buttons.slice(0, 3).map((button) => ({
              type: "reply",
              reply: { id: button.id, title: button.title.slice(0, 20) },
            })),
          },
        },
      }),
    },
  );
  if (!response.ok) throw await metaErrorFrom(response);
}

// Interactive list — used when there are more than 3 named options to pick
// from (which team member, which product/service/project). WhatsApp allows
// up to 10 rows total across sections, and each row can carry a name +
// short description, so the person picks by NAME instead of guessing an
// index. Resolves with zero Gemini calls, same as sendButtonMessage.
export async function sendListMessage(
  env: Env,
  to: string,
  bodyText: string,
  buttonLabel: string,
  sections: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>,
): Promise<void> {
  const response = await fetchMeta(
    `https://graph.facebook.com/${graphVersion(env)}/${encodeURIComponent(env.META_PHONE_NUMBER_ID)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.META_WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
          type: "list",
          body: { text: bodyText },
          action: {
            button: buttonLabel.slice(0, 20),
            sections: sections
              .filter((section) => section.rows.length > 0)
              .map((section) => ({
                title: section.title.slice(0, 24),
                rows: section.rows.slice(0, 10).map((row) => ({
                  id: row.id,
                  title: row.title.slice(0, 24),
                  ...(row.description ? { description: row.description.slice(0, 72) } : {}),
                })),
              })),
          },
        },
      }),
    },
  );
  if (!response.ok) throw await metaErrorFrom(response);
}

export async function markMessageRead(env: Env, messageId: string): Promise<void> {
  await fetchMeta(
    `https://graph.facebook.com/${graphVersion(env)}/${encodeURIComponent(env.META_PHONE_NUMBER_ID)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.META_WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    },
  ).catch(() => undefined);
}

export async function getMetaPhoneNumber(env: Env): Promise<string> {
  const response = await fetchMeta(
    `https://graph.facebook.com/${graphVersion(env)}/${encodeURIComponent(env.META_PHONE_NUMBER_ID)}?fields=display_phone_number`,
    { headers: { Authorization: `Bearer ${env.META_WHATSAPP_TOKEN}` } },
  );
  if (!response.ok) return "";
  const body = (await response.json()) as { display_phone_number?: string };
  return body.display_phone_number || "";
}

export async function verifyMetaSignature(
  env: Env,
  body: ArrayBuffer,
  signature: string | null,
): Promise<boolean> {
  if (!signature?.startsWith("sha256=") || !env.META_APP_SECRET) return false;
  const actual = signature.slice("sha256=".length).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(actual)) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.META_APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, body));
  const expected = Array.from(digest, (value) => value.toString(16).padStart(2, "0")).join("");
  let difference = actual.length === expected.length ? 0 : 1;
  for (let index = 0; index < Math.min(actual.length, expected.length); index += 1) {
    difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

export async function sendTypingIndicator(env: Env, messageId: string): Promise<void> {
  const response = await fetchMeta(
    `https://graph.facebook.com/${graphVersion(env)}/${encodeURIComponent(env.META_PHONE_NUMBER_ID)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.META_WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
        typing_indicator: { type: "text" },
      }),
    },
  );
  if (!response.ok) {
    console.error(`Meta typing indicator failed with status ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
}

// Fetches the temporary media URL for an incoming image, then downloads the
// bytes — both steps require the same bearer token. The URL Meta returns is
// short-lived, so it must be fetched immediately rather than stored.
export async function downloadMedia(
  env: Env,
  mediaId: string,
): Promise<{ bytes: ArrayBuffer; mimeType: string }> {
  const metaResponse = await fetchMeta(
    `https://graph.facebook.com/${graphVersion(env)}/${encodeURIComponent(mediaId)}`,
    { headers: { Authorization: `Bearer ${env.META_WHATSAPP_TOKEN}` } },
  );
  if (!metaResponse.ok) {
    throw new Error(`Meta media lookup failed with status ${metaResponse.status}`);
  }
  const meta = (await metaResponse.json()) as { url?: string; mime_type?: string };
  if (!meta.url) throw new Error("Meta media lookup returned no URL");
  const fileResponse = await fetchMeta(meta.url, {
    headers: { Authorization: `Bearer ${env.META_WHATSAPP_TOKEN}` },
  });
  if (!fileResponse.ok) {
    throw new Error(`Meta media download failed with status ${fileResponse.status}`);
  }
  return { bytes: await fileResponse.arrayBuffer(), mimeType: meta.mime_type || "image/jpeg" };
}