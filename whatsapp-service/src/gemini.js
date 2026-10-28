import { getActiveApiKeys, markApiKeyUsed } from "./supabase.js";

let cursor = 0;

function extractText(body) {
  return body?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
}

function parseJson(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Gemini did not return a JSON object");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function askGemini(prompt, { json = false } = {}) {
  const keys = await getActiveApiKeys();
  if (!keys.length) throw new Error("No active Gemini API keys configured");

  let lastError;
  for (let attempt = 0; attempt < keys.length; attempt += 1) {
    const index = (cursor + attempt) % keys.length;
    const key = keys[index];
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key.key_string)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: json
            ? { responseMimeType: "application/json", temperature: 0.4 }
            : { temperature: 0.7 },
        }),
      },
    );
    if (response.ok) {
      cursor = (index + 1) % keys.length;
      await markApiKeyUsed(key.id);
      const text = extractText(await response.json());
      return json ? parseJson(text) : text;
    }
    lastError = new Error(`Gemini request failed (${response.status})`);
    if (response.status !== 429) break;
  }
  throw lastError ?? new Error("Gemini request failed");
}