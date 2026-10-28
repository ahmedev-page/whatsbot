import type { Env } from "./types";

const META_TIMEOUT_MS = 15_000;

function graphVersion(env: Env): string {
  return env.META_GRAPH_VERSION || "v20.0";
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
  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(`Meta send failed with status ${response.status}: ${details}`);
  }
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
  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(`Meta send failed with status ${response.status}: ${details}`);
  }
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
  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(`Meta send failed with status ${response.status}: ${details}`);
  }
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