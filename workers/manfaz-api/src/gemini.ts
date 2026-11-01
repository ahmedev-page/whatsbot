import { decryptSecret } from "./crypto";
import { getActiveApiKeys, markApiKeyUsed } from "./supabase";
import type { Env } from "./types";

let cursor = 0;
const GEMINI_TIMEOUT_MS = 30_000;

function extractText(body: unknown): string {
  const response = body as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
}

function parseJson(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Gemini did not return a JSON object");
  const value = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Gemini returned an invalid JSON object");
  }
  return value as Record<string, unknown>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Google's 429 body includes its own suggested wait, e.g. "Please retry in
// 21.13s". Free-tier quota is a sliding window, so honoring that hint (capped
// so one bad key can't stall a message for too long) turns most rate-limit
// errors into a short wait + success instead of an immediate failure.
function extractRetryDelayMs(details: string): number {
  const match = details.match(/retry in ([\d.]+)\s*s/i);
  const seconds = match ? parseFloat(match[1]) : 2;
  return Math.min(Math.max(seconds * 1000, 500), 15000);
}

async function callGemini(
  env: Env,
  prompt: string,
  json: boolean,
  apiKey: { id: string; key_string: string },
): Promise<{ ok: true; text: string } | { ok: false; status: number; details: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("Gemini request timed out"), GEMINI_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL || "gemini-3.6-flash"}:generateContent?key=${encodeURIComponent(await decryptSecret(env.SESSION_SECRET, apiKey.key_string))}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: json
          // JSON update/build calls are often asked to echo back a whole
          // site's content (every product/service/team member) — on a site
          // with a lot of items that response is long. Without an explicit
          // ceiling here, Gemini's default max is small enough to truncate
          // that output mid-object, which fails JSON.parse and used to
          // surface as a generic, unrecoverable error to the WhatsApp user.
          ? { responseMimeType: "application/json", temperature: 0.4, maxOutputTokens: 8192 }
          : { temperature: 0.7, maxOutputTokens: 2048 },
      }),
      signal: controller.signal,
    },
    );
  } finally {
    clearTimeout(timeout);
  }
  if (response.ok) {
    // Key telemetry must never turn a successful AI response into a failed
    // message. It is useful for the admin panel, but not part of the request.
    void markApiKeyUsed(env, apiKey.id).catch((error) => {
      console.error("Unable to record Gemini key usage", error);
    });
    return { ok: true, text: extractText(await response.json()) };
  }
  const details = (await response.text()).slice(0, 500);
  return { ok: false, status: response.status, details };
}

export async function askGemini(
  env: Env,
  prompt: string,
  json = false,
): Promise<string | Record<string, unknown>> {
  const keys = await getActiveApiKeys(env);
  if (!keys.length) throw new Error("No active Gemini API keys configured");

  let lastError: Error | undefined;
  // Two rounds through all keys: if every key comes back 429 in round one,
  // wait once (based on Google's own suggested delay) and try all keys again
  // before finally giving up. Any non-429 error still fails immediately.
  for (let round = 0; round < 2; round += 1) {
    let sawRateLimit = false;
    let retryDelayMs = 2000;
    for (let attempt = 0; attempt < keys.length; attempt += 1) {
      const index = (cursor + attempt) % keys.length;
      const apiKey = keys[index];
      const result = await callGemini(env, prompt, json, apiKey);
      if (result.ok) {
        if (!json) {
          cursor = (index + 1) % keys.length;
          return result.text;
        }
        // A malformed/truncated JSON reply is a generation glitch, not a
        // request problem — worth one retry (next key, or next round) rather
        // than failing the whole message outright, since it's the main
        // reason "modify my site" requests used to fail intermittently.
        try {
          const parsed = parseJson(result.text);
          cursor = (index + 1) % keys.length;
          return parsed;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          continue;
        }
      }
      lastError = new Error(`Gemini request failed with status ${result.status}: ${result.details}`);
      if (result.status === 429 || result.status === 503) {
        sawRateLimit = true;
        retryDelayMs = result.status === 429 ? extractRetryDelayMs(result.details) : 3000;
      } else {
        throw lastError;
      }
    }
    if (round === 0 && sawRateLimit) await sleep(retryDelayMs);
  }
  throw lastError ?? new Error("Gemini request failed");
}
