import { createHmac, timingSafeEqual } from "node:crypto";
import { Router, type Request } from "express";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import {
  apiKeysTable,
  db,
  processedMessagesTable,
  usersTable,
  websitesTable,
  platformSettingsTable,
} from "@workspace/db";
import { logger } from "../lib/logger";
import { getMetaGraphVersion, sendTextMessage } from "../lib/meta";
import { decryptSecret } from "../lib/secret-box";

const router = Router();
const supportedTemplates = new Set(["store", "restaurant", "services", "portfolio"]);

type IncomingMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
};

type GeneratedSite = {
  siteName?: unknown;
  templateId?: unknown;
  themeColor?: unknown;
  jsonStructure?: unknown;
};

function rawBody(req: Request): Buffer | undefined {
  return (req as Request & { rawBody?: Buffer }).rawBody;
}

function isValidSignature(body: Buffer, signature: string | undefined): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const actual = signature.slice("sha256=".length);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

async function markMessageRead(messageId: string): Promise<void> {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return;

  await fetch(
    `https://graph.facebook.com/${getMetaGraphVersion()}/${encodeURIComponent(phoneNumberId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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

function extractGeminiText(body: unknown): string {
  const response = body as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return (
    response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? ""
  );
}

function parseGeminiJson(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Gemini did not return a JSON object");
  const value = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Gemini returned an invalid site object");
  }
  return value as Record<string, unknown>;
}

let geminiCursor = 0;

async function askGemini(prompt: string, json = false): Promise<string | Record<string, unknown>> {
  const keys = await db
    .select()
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.provider, "gemini"), eq(apiKeysTable.status, "active")))
    .orderBy(apiKeysTable.id);
  if (!keys.length) throw new Error("No active Gemini API keys configured");

  let lastError: Error | undefined;
  for (let attempt = 0; attempt < keys.length; attempt += 1) {
    const index = (geminiCursor + attempt) % keys.length;
    const key = keys[index];
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-1.5-flash"}:generateContent?key=${encodeURIComponent(decryptSecret(key.keyString))}`,
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
      geminiCursor = (index + 1) % keys.length;
      await db
        .update(apiKeysTable)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeysTable.id, key.id));
      const text = extractGeminiText(await response.json());
      return json ? parseGeminiJson(text) : text;
    }
    lastError = new Error(`Gemini request failed with status ${response.status}`);
    if (response.status !== 429) break;
  }
  throw lastError ?? new Error("Gemini request failed");
}

async function ensureUser(phoneNumber: string) {
  const [created] = await db
    .insert(usersTable)
    .values({ phoneNumber })
    .onConflictDoNothing({ target: usersTable.phoneNumber })
    .returning();
  if (created) return created;
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phoneNumber, phoneNumber));
  if (!existing) throw new Error("Unable to create or load WhatsApp user");
  return existing;
}

async function consumeMessage(userId: string) {
  const [updated] = await db
    .update(usersTable)
    .set({ freeMessagesUsed: sql`${usersTable.freeMessagesUsed} + 1` })
    .where(
      and(
        eq(usersTable.id, userId),
        lt(usersTable.freeMessagesUsed, usersTable.freeMessagesLimit),
      ),
    )
    .returning();
  return updated;
}

async function getLatestWebsite(userId: string) {
  const [website] = await db
    .select()
    .from(websitesTable)
    .where(eq(websitesTable.userId, userId))
    .orderBy(desc(websitesTable.updatedAt))
    .limit(1);
  return website;
}

function textFromMessage(message: IncomingMessage): string {
  return message.text?.body?.trim() ?? "";
}

function buildPrompt(text: string): string {
  return `أنت مولد مواقع عربية. حوّل طلب صاحب العمل التالي إلى JSON فقط، دون markdown، وفق هذا الشكل:
{
  "siteName": "اسم الموقع",
  "templateId": "store|restaurant|services|portfolio",
  "themeColor": "#hex",
  "jsonStructure": {
    "tagline": "جملة تعريفية",
    "description": "وصف قصير",
    "ctaLabel": "زر الإجراء",
    "phone": "",
    "items": [{"name":"","description":"","price":"","image":""}],
    "services": [{"name":"","description":""}],
    "projects": [{"title":"","description":"","image":""}],
    "hours": [{"day":"","time":""}],
    "address": ""
  }
}
املأ الحقول المناسبة فقط، واجعل النصوص عربية، واختر القالب الأنسب. طلب العميل: ${text}`;
}

function normalizeGenerated(value: Record<string, unknown>): {
  siteName: string;
  templateId: string;
  themeColor: string;
  jsonStructure: Record<string, unknown>;
} {
  const generated = value as GeneratedSite;
  const siteName =
    typeof generated.siteName === "string" && generated.siteName.trim()
      ? generated.siteName.trim().slice(0, 120)
      : "موقع جديد";
  const templateId =
    typeof generated.templateId === "string" && supportedTemplates.has(generated.templateId)
      ? generated.templateId
      : "services";
  const themeColor =
    typeof generated.themeColor === "string" && /^#[0-9a-f]{6}$/i.test(generated.themeColor)
      ? generated.themeColor
      : "#e56b4e";
  const jsonStructure =
    generated.jsonStructure &&
    typeof generated.jsonStructure === "object" &&
    !Array.isArray(generated.jsonStructure)
      ? (generated.jsonStructure as Record<string, unknown>)
      : {};
  return { siteName, templateId, themeColor, jsonStructure };
}

async function claimMessage(message: IncomingMessage): Promise<boolean> {
  if (!message.id) return false;
  const [claimed] = await db
    .insert(processedMessagesTable)
    .values({
      messageId: message.id,
      status: "processing",
      payload: message as Record<string, unknown>,
      attempts: 1,
    })
    .onConflictDoNothing({ target: processedMessagesTable.messageId })
    .returning();
  return Boolean(claimed);
}

async function finishMessage(messageId: string): Promise<void> {
  await db
    .update(processedMessagesTable)
    .set({ status: "processed", processedAt: new Date(), lastError: null })
    .where(eq(processedMessagesTable.messageId, messageId));
}

async function failMessage(messageId: string, error: unknown, attempts: number): Promise<void> {
  await db
    .update(processedMessagesTable)
    .set({
      status: attempts >= 3 ? "failed" : "processing",
      attempts,
      lastError: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
    })
    .where(eq(processedMessagesTable.messageId, messageId));
}

async function handleIncomingMessage(message: IncomingMessage): Promise<void> {
  const from = message.from;
  const text = textFromMessage(message);
  if (!from || !text || message.type !== "text" || !message.id) return;

  await markMessageRead(message.id);
  let user = await ensureUser(from);

  if (/تبق[تى]|المتبقي|رصيدي|كم.*رسالة/i.test(text)) {
    const remaining = Math.max(0, user.freeMessagesLimit - user.freeMessagesUsed);
    await sendTextMessage(from, `متبقي لك ${remaining} رسالة مجانية من أصل ${user.freeMessagesLimit}.`);
    return;
  }

  const quotaUser = await consumeMessage(user.id);
  if (!quotaUser) {
    await sendTextMessage(from, "انتهت رسائلك المجانية. تواصل مع الإدارة لتوسيع حصتك.");
    return;
  }
  user = quotaUser;

  const website = await getLatestWebsite(user.id);
  const updatePattern = /(عدّل|عدل|غيّر|غير|أضف|اضف|احذف|حسّن|حسن|تحديث)/i;
  const initialBuildPattern = /(أنشئ|انشئ|ابن[ِيى]|اصنع|سوي|سو[ِّي]|موقع)/i;
  const intent = website && updatePattern.test(text)
    ? "UPDATE"
    : initialBuildPattern.test(text)
      ? "INITIAL_BUILD"
      : "CHAT";

  if (intent === "CHAT") {
    const reply = await askGemini(`أجب بالعربية وباختصار وبأسلوب مساعد. رسالة العميل: ${text}`);
    await sendTextMessage(from, typeof reply === "string" ? reply : "وصلت رسالتك.");
    return;
  }

  if (intent === "INITIAL_BUILD") {
    await sendTextMessage(from, "جاري بناء موقعك الآن، أرسل لك الرابط فور اكتماله.");
    const generated = normalizeGenerated(
      (await askGemini(buildPrompt(text), true)) as Record<string, unknown>,
    );
    const [created] = await db
      .insert(websitesTable)
      .values({
        userId: user.id,
        siteName: generated.siteName,
        templateId: generated.templateId,
        themeColor: generated.themeColor,
        jsonStructure: generated.jsonStructure,
      })
      .returning();
    const settings = await db.select().from(platformSettingsTable);
    const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
    const baseUrl = (values.frontend_url || process.env.FRONTEND_URL || "https://manfaz.pages.dev").replace(/\/$/, "");
    await sendTextMessage(from, `تم إنشاء موقعك بنجاح: ${baseUrl}/site/${created.publicId}`);
    return;
  }

  if (!website) throw new Error("Cannot update a website that does not exist");
  const updated = normalizeGenerated(
    (await askGemini(
      `عدّل JSON التالي حسب طلب العميل. أعد JSON كاملًا فقط مع الحفاظ على نفس البنية قدر الإمكان.
الطلب: ${text}
JSON الحالي: ${JSON.stringify(website.jsonStructure)}`,
      true,
    )) as Record<string, unknown>,
  );
  await db
    .update(websitesTable)
    .set({
      siteName: updated.siteName,
      templateId: updated.templateId,
      themeColor: updated.themeColor,
      jsonStructure: updated.jsonStructure,
      updatedAt: new Date(),
    })
    .where(eq(websitesTable.id, website.id));
  await sendTextMessage(from, "تم تحديث موقعك بنجاح. افتح نفس الرابط لرؤية التغييرات.");
}

async function processMessages(messages: IncomingMessage[], request: Request): Promise<void> {
  for (const message of messages) {
    if (!message.id || !(await claimMessage(message))) continue;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await handleIncomingMessage(message);
        await finishMessage(message.id);
        break;
      } catch (error) {
        await failMessage(message.id, error, attempt);
        if (attempt === 3) {
          request.log.error(
            { err: error, messageId: message.id, attempts: attempt },
            "WhatsApp message processing failed after retries",
          );
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }
}

router.get("/webhook", (req, res): void => {
  const expectedToken = process.env.META_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === expectedToken &&
    typeof req.query["hub.challenge"] === "string"
  ) {
    res.status(200).send(req.query["hub.challenge"]);
    return;
  }
  res.sendStatus(403);
});

router.post("/webhook", (req, res): void => {
  const body = rawBody(req);
  if (!body || !isValidSignature(body, req.header("x-hub-signature-256"))) {
    res.sendStatus(401);
    return;
  }

  res.sendStatus(200);
  const messages: IncomingMessage[] = [];
  for (const entry of req.body?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) messages.push(message);
    }
  }
  void processMessages(messages, req).catch((error) => {
    logger.error({ err: error }, "WhatsApp webhook batch failed");
  });
});

export default router;