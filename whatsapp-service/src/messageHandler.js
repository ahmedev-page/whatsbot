import { sendTextMessage, markMessageRead } from "./metaApi.js";
import {
  createWebsite,
  ensureUser,
  getLatestWebsite,
  getSettings,
  updateWebsite,
} from "./supabase.js";
import { askGemini } from "./gemini.js";
import { consumeMessage, remainingMessages } from "./quota.js";

const initialBuildPattern = /(أنشئ|انشئ|ابن[ِيى]|اصنع|سوي|سو[ِّي]|موقع)/i;
const updatePattern = /(عدّل|عدل|غيّر|غير|أضف|اضف|احذف|حسّن|حسن|تحديث)/i;

function textFromMessage(message) {
  return message?.text?.body?.trim() ?? "";
}

function buildPrompt(text) {
  return `أنت مولد مواقع عربية. حوّل طلب صاحب العمل التالي إلى JSON فقط، دون markdown، وفق هذا الشكل:
{
  "siteName": "اسم الموقع",
  "templateId": "store|restaurant|services|portfolio|booking",
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

export async function handleIncomingMessage(message) {
  const from = message?.from;
  const text = textFromMessage(message);
  if (!from || !text) return;

  await markMessageRead(message.id).catch(() => null);
  let user = await ensureUser(from);
  const remaining = remainingMessages(user);

  if (/تبق[تى]|المتبقي|رصيدي|كم.*رسالة/i.test(text)) {
    await sendTextMessage(from, `متبقي لك ${remaining} رسالة مجانية من أصل ${user.free_messages_limit}.`);
    return;
  }

  const website = await getLatestWebsite(user.id);
  const intent = website && updatePattern.test(text) ? "UPDATE" : initialBuildPattern.test(text) ? "INITIAL_BUILD" : "CHAT";

  if (intent === "CHAT") {
    const reply = await askGemini(`أجب بالعربية وباختصار وبأسلوب مساعد. رسالة العميل: ${text}`);
    await sendTextMessage(from, reply || "وصلت رسالتك. كيف أساعدك في موقعك؟");
    return;
  }

  if (intent === "INITIAL_BUILD") {
    const quota = await consumeMessage(user);
    if (!quota.allowed) {
      await sendTextMessage(from, "انتهت رسائلك المجانية. تواصل مع الإدارة لتوسيع حصتك.");
      return;
    }
    user = quota.user;
    await sendTextMessage(from, "جاري بناء موقعك الآن، أرسل لك الرابط فور اكتماله.");
    const generated = await askGemini(buildPrompt(text), { json: true });
    const created = await createWebsite({
      userId: user.id,
      siteName: generated.siteName,
      templateId: generated.templateId,
      themeColor: generated.themeColor,
      jsonStructure: generated.jsonStructure,
    });
    const settings = await getSettings();
    const baseUrl = (settings.frontend_url || process.env.FRONTEND_URL || "https://manfaz.pages.dev").replace(/\/$/, "");
    await sendTextMessage(from, `تم إنشاء موقعك بنجاح: ${baseUrl}/site/${created.public_id}`);
    return;
  }

  const updated = await askGemini(
    `عدّل JSON التالي حسب طلب العميل. أعد JSON كاملًا فقط مع الحفاظ على نفس البنية قدر الإمكان.
الطلب: ${text}
JSON الحالي: ${JSON.stringify(website.json_structure)}`,
    { json: true },
  );
  await updateWebsite(website.id, {
    siteName: website.site_name,
    templateId: website.template_id,
    themeColor: website.theme_color,
    jsonStructure: updated,
  });
  await sendTextMessage(from, "تم تحديث موقعك بنجاح. افتح نفس الرابط لرؤية التغييرات.");
}