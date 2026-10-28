import { askGemini } from "./gemini";
import { downloadMedia, markMessageRead, sendButtonMessage, sendListMessage, sendTextMessage } from "./meta";
import {
  claimProcessedMessage,
  consumeMessageQuota,
  createWebsite,
  deleteWebsite,
  ensureUser,
  failProcessedMessage,
  finishProcessedMessage,
  getLatestWebsite,
  getWebsiteByPublicId,
  getSettings,
  getVisitStats,
  addConversationMessage,
  getConversationMessages,
  setPendingBuildRequest,
  setPendingFlow,
  setPendingImage,
  setPendingImageNewKey,
  setPendingImages,
  clearAllPendingImageState,
  updateWebsite,
  uploadImageToStorage,
  verifyLoginChallengeByCode,
} from "./supabase";
import type { Env, IncomingMessage, PendingImage, UserRow, WebsiteRow } from "./types";
import { filterSupportedStructureFields, separateDashboardOnlyChanges, supportsCollectionImages, templateCollection } from "./site-schema";

const templates = new Set(["store", "restaurant", "services", "portfolio", "booking"]);

// Words that clearly mean "remove/delete" — used only as a safety guard against
// accidental data loss when the model forgets to echo back an existing list.
const deletionPattern = /(احذف|احذفي|امسح|أزل|ازل|شيل|شيلي|حذف)/i;

// Bare greetings — matched only when the WHOLE message is one of these (after
// trimming trailing punctuation), so "مرحبا اضف خدمة" still goes through
// normal handling. Used to show a button menu instead of calling Gemini.
const GREETINGS = new Set([
  "مرحبا", "مرحباً", "اهلا", "أهلا", "هلا", "هاي", "hi", "hello", "hey",
  "السلام عليكم", "سلام", "صباح الخير", "مساء الخير", "كيف الحال", "كيفك", "شلونك", "وش اخبارك",
]);

// Used inside the step-by-step add/edit item flow — typing this instead of
// tapping the "تخطي" button also skips the current optional step (price or
// image), same effect either way.
const skipPattern = /^(تخطي|تخطى|بدون|لا يوجد|مافي|ما فيه|ما فيه شي)[!.؟?،, ]*$/i;
// Same idea for "إلغاء" — someone mid-flow shouldn't have to notice the
// button specifically; typing what they mean works too.
const cancelPattern = /^(إلغاء|الغاء|الغِ|إلغِ|كنسل|توقف|رجوع|خلاص|لا تكمل|بطل)[!.؟?،, ]*$/i;

// A short, deliberate gap between two automated messages sent back to back.
// WhatsApp can flag or throttle a business number that bursts messages with
// zero delay between them, so every spot in this file that sends more than
// one message for a single event (a text reply followed by a menu, etc.)
// waits here in between.
function pace(ms = 2600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBareGreeting(text: string): boolean {
  const normalized = text.trim().replace(/[!.؟?،,]+$/g, "").trim().toLowerCase();
  return GREETINGS.has(normalized);
}

// "Send me my site link" is one of the most common repeated asks
// and needs zero understanding — just look up the link.
function isShowSiteRequest(text: string): boolean {
  return /رابط/.test(text) && /موقع/.test(text);
}

function textFromMessage(message: IncomingMessage): string {
  return message.text?.body?.trim() ?? "";
}

async function recordConversation(
  env: Env,
  userId: string,
  direction: "inbound" | "outbound",
  content: string,
): Promise<void> {
  try {
    await addConversationMessage(env, userId, direction, content);
  } catch (error) {
    // Conversation history is telemetry. A temporary database issue must not
    // turn a message that was already handled into the generic error reply.
    console.error("Conversation history write failed", error);
  }
}

async function frontendBaseUrl(env: Env): Promise<string> {
  if (env.FRONTEND_URL) return env.FRONTEND_URL.replace(/\/$/, "");
  const settings = await getSettings(env);
  return (settings.frontend_url || "https://orxai.pages.dev").replace(/\/$/, "");
}

// Check if tokens match keywords after removing prefixes/suffixes
function hasStandaloneKeyword(text: string, keywords: string[]): boolean {
  const tokens = text.split(/\s+/);
  for (const rawToken of tokens) {
    let token = rawToken.replace(/[^\u0600-\u06FF]/g, "");
    if (!token) continue;
    token = token.replace(/^(بال|كال|فال|وال|لل|ال|و|ف|ب|ك|ل)/, "");
    token = token.replace(/(ها|هم|كم|نا|ي|ك)$/, "");
    if (keywords.includes(token)) return true;
  }
  return false;
}

// "أنشئ موقع" or "نعم اريد ابني موقع لي" trigger the build flow but carry
// zero actual business content — Gemini then has nothing to generate from,
// which is a likely cause of repeated "تعذّر إنشاء الموقع" failures, not
// just API flakiness. Strip the trigger/filler words and require some real
// content to remain before treating the message as a usable description.
const BUILD_FILLER_WORDS = /أنشئ|انشئ|ابني|ابنِ|ابنى|اصنع|سوي|سو|موقع|مواقع|اريد|أريد|أبغى|ابغى|ابغا|أبي|ابي|حاب|حابة|لي\b|لى\b|من فضلك|يا ريت|ممكن|رجاء|نعم|تمام|اوك|أوك/g;
function isVagueBuildRequest(text: string): boolean {
  const stripped = text
    .replace(BUILD_FILLER_WORDS, "")
    .replace(/[^\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s]/g, "")
    .trim();
  return stripped.length < 12;
}

function buildPrompt(text: string, forced?: { templateId?: string; templateStyle?: string }): string {
  const forcedParts: string[] = [];
  if (forced?.templateId) forcedParts.push(`templateId="${forced.templateId}"`);
  if (forced?.templateStyle) forcedParts.push(`templateStyle="${forced.templateStyle}"`);
  const forcedLine = forcedParts.length
    ? `\nالعميل اختار بنفسه من قائمة: ${forcedParts.join(" و")}. التزم بهذا الاختيار حرفيًا ولا تغيّره مهما بدا كلامه${forced?.templateId ? "، واملأ محتوى jsonStructure المناسب لهذا القالب تحديدًا" : ""}.`
    : "";
  return `أنت ORxai، مساعد ذكي لإنشاء المواقع عبر واتساب. مهمتك الأساسية فهم هدف صاحب العمل وتحويله إلى موقع عربي عملي، ثم تعديل الموقع نفسه في الرسائل اللاحقة. لا تنشئ موقعًا ثانيًا للمستخدم نفسه، ولا تطلب اسم مستخدم جديدًا إذا كان لديه موقع محفوظ.${forcedLine}
أنت مولد مواقع عربية. حوّل طلب صاحب العمل التالي إلى JSON فقط، دون markdown، وفق هذا الشكل (املأ فقط الحقول التي يدعمها كلام العميل، واحذف الباقي بدل تركه فارغًا وهميًا):
{
  "siteName": "اسم الموقع",
  "templateId": "store|restaurant|services|portfolio|booking",
  "themeColor": "#hex",
  "jsonStructure": {
    "tagline": "جملة تعريفية",
    "description": "وصف قصير",
    "ctaLabel": "زر الإجراء",
    "templateStyle": "classic أو modern أو cinematic أو app (اختر modern إذا شعر الطلب بطابع عصري/شبابي، cinematic إذا طلب طابعًا سينمائيًا/فاخرًا/متحركًا مع التمرير أو خلفية داكنة فخمة، app إذا طلب أن يكون الموقع أو يشبه تطبيق جوال حقيقي (تطبيق موبايل/أبلكيشن)، وإلا classic)",
    "darkMode": false,
    "items": [{"name":"","description":"","price":""}],
    "services": [{"name":"","description":""}],
    "projects": [{"title":"","description":""}],
    "hours": [{"day":"","time":""}],
    "contact": {"phone":"","whatsapp":"","email":"","address":""},
    "socialLinks": {"instagram":"","twitter":"","facebook":"","tiktok":"","snapchat":""},
    "team": [{"name":"","role":"","bio":""}],
    "testimonials": [{"name":"","quote":""}],
    "faq": [{"question":"","answer":""}],
    "skills": ["فقط لقالب portfolio — قائمة مهارات قصيرة"],
    "experience": [{"role":"","company":"","period":"","description":""}],
    "certifications": [{"name":"","issuer":"","year":""}]
  }
}
املأ الحقول المناسبة فقط، واجعل النصوص عربية${forced?.templateId ? "" : "، واختر القالب الأنسب (استخدم booking لعمل يعتمد على حجز موعد كعيادة أو صالون أو مستشار، ويستخدم booking حقل services كخدمات قابلة للحجز)"}. عند اختيار templateStyle="cinematic" اجعل darkMode=true افتراضيًا ما لم يطلب العميل خلاف ذلك، فالتصميم السينمائي مصمم للوضع الداكن أساسًا. حقول skills وexperience وcertifications خاصة بقالب portfolio فقط — لا تستخدمها مع أي قالب آخر. استخدم فقط أسماء الحقول أعلاه بالضبط دون اختراع حقول جديدة، لأن الموقع لا يعرض إلا هذه الحقول. طلب العميل: ${text}`;
}

function buildAssistantPrompt(params: {
  text: string;
  website: WebsiteRow;
  historyText: string;
}): string {
  const { text, website, historyText } = params;
  const currentStyle = typeof website.json_structure.templateStyle === "string" ? website.json_structure.templateStyle : "classic";
  const { label } = templateCollection(website.template_id);
  const imageFact = supportsCollectionImages(website.template_id, currentStyle)
    ? `شكل الموقع الحالي (${currentStyle}) يعرض صورة لكل ${label} فعليًا.`
    : `تنبيه مهم: شكل الموقع الحالي (${currentStyle}) لقالب ${website.template_id} لا يعرض صورة لكل ${label} على حدة إطلاقًا (فقط templateStyle="cinematic" أو "app" يعرضان ذلك لهذا النوع). إذا سأل العميل عن صورة لم تظهر لعنصر، أو طلب إضافة صورة له، اشرح له هذا صراحة باستخدام intent="chat" واقترح تغيير templateStyle إلى cinematic أو app إذا أراد الصور، بدل الادعاء بأن الصورة ستظهر.`;
  return `أنت ORxai، مساعد ذكي لإدارة مواقع واتساب لأصحاب الأعمال. هذا المستخدم لديه موقع محفوظ بالفعل، ومهمتك في كل رسالة أن تحدد أولًا نوعها:
- "update": أي رسالة جوهرها طلب تغيير أو تنفيذ شيء في الموقع (لون، اسم، نص، خدمة، منتج، مشروع، ساعات عمل، عنوان، تواصل، فريق، قالب...) حتى لو صيغت كسؤال ("تقدر تغير اللون؟") أو احتوت كلامًا زائدًا حولها.
- "chat": أي رسالة أخرى — سؤال عام، استفسار عن خدمات المنصة، تحية، أو رسالة غير واضحة لا تحدد تغييرًا فعليًا، أو طلب شيء خارج قدرات المنصة (انظر القائمة أدناه).

${imageFact}

قاعدة مهمة: إضافة أو تعديل أو حذف المنتجات والأطباق والخدمات والمشاريع وأعضاء الفريق، ورفع الصور (الشعار والصورة الرئيسية وصور العناصر) لا تتم من هذه المحادثة بل من لوحة التحكم في المنصة. إذا طلب المستخدم شيئًا منها فاجعل intent="chat" ووجّهه بلطف إلى لوحة التحكم، ولا تُرجع هذه الحقول في jsonStructure. المسموح هنا: النصوص (الاسم، العبارة التعريفية، الوصف، نص الزر، التواصل، ساعات العمل، الأسئلة الشائعة، آراء العملاء)، والألوان، وشكل القالب، والوضع الداكن.

القدرات المدعومة فعليًا في الموقع (كل ما هو خارج هذه القائمة يجب أن ترفضه بصراحة ولا تدّعي تنفيذه):
- اسم الموقع، القالب (store/restaurant/services/portfolio/booking)، شكل القالب (templateStyle: classic أو modern أو cinematic — تصميم سينمائي داكن فاخر بنصوص متحركة مع التمرير — أو app — تصميم يشبه تطبيق جوال حقيقي بالكامل: شريط تنقل سفلي، بطاقات ملء الشاشة، بحث وتصنيفات، وصفحة تفاصيل مستقلة لكل عنصر؛ booking له تصميم واحد فقط، تجاهل templateStyle له)، اللون الرئيسي، الوضع الداكن (darkMode).
- اختر templateId="booking" لأعمال تعتمد على حجز موعد (عيادة، صالون، مركز تجميل، مستشار، مدرّب) بدل "services"؛ يستخدم نفس حقل services (خدمات قابلة للحجز، لكل خدمة name وdescription وprice ومدة اختيارية duration)، ويعرض ساعات العمل (hours) بشكل بارز كمواعيد متاحة. هذا لا يعني نظام حجز تفاعلي حقيقي (انظر "غير مدعوم" أدناه) — فقط صفحة تعرض الخدمات وتوجّه العميل لتأكيد الموعد عبر واتساب.
- العنوان الرئيسي (headline) والوصف (description) والجملة التعريفية (tagline) ونص زر الإجراء (ctaLabel).
- قوائم عناصر حسب القالب: services (خدمات — تُستخدم أيضًا كخدمات قابلة للحجز في قالب booking)، items (منتجات/قائمة مطعم)، projects (أعمال بورتفوليو) — إضافة/تعديل/حذف عناصر فردية.
- ساعات العمل (hours): قائمة أيام وأوقات.
- معلومات التواصل (contact): هاتف، واتساب، بريد إلكتروني، العنوان الفعلي.
- روابط التواصل الاجتماعي (socialLinks): إنستقرام، تويتر/X، فيسبوك، تيك توك، سناب شات.
- فريق العمل (team): قائمة أشخاص باسم ومنصب ونبذة قصيرة.
- آراء العملاء (testimonials): قائمة اسم + تعليق.
- الأسئلة الشائعة (faq): قائمة سؤال + جواب.
- خاصة بقالب البورتفوليو (portfolio) فقط — تجاهلها لأي قالب آخر: المهارات (skills: قائمة نصوص قصيرة)، الخبرات العملية (experience: قائمة role/company/period/description)، الشهادات (certifications: قائمة name/issuer/year).

غير مدعوم إطلاقًا (اشرح للمستخدم بلطف ماذا يمكنك تقديمه بدلاً منه، ولا تقل "تم" أبدًا لهذه الطلبات): نظام حجز مواعيد تفاعلي حقيقي، بوابة دفع إلكتروني، تسجيل دخول للمستخدمين، تطبيقات جوال، تكامل مع أنظمة خارجية، صفحات متعددة منفصلة.

الصور (مهم): المنصة تدعم فعليًا صور حقيقية (شعار، صورة رئيسية، صور لأفراد الفريق، صور للمنتجات/الخدمات/الأعمال) — لكن الرفع يتم فقط بإرسال الصورة مباشرة بواتساب (يوصل المستخدم بعدها بقائمة اختيار مكانها)، وليس عبر النص. إذا طلب المستخدم بالنص "أضف صورة" أو "غيّر الصورة" ونحوها، اجعل intent="chat" واطلب منه إرسال الصورة مباشرة بدل الكتابة. أما طلب حذف صورة موجودة بالنص (مثل "احذف الشعار" أو "شيل صورة فلان من الفريق")، فهذا مدعوم فعلاً كـ intent="update": اجعل حقل الصورة المطلوب (logo أو heroImage أو image داخل عنصر الفريق/القائمة المقصود) نصًا فارغًا "" مع إبقاء كل شيء آخر كما هو.

إذا سأل المستخدم من طوّرك، من صنعك، من المبرمج، من مطورك، أو أي سؤال مشابه عن هوية المطور خلف هذه المنصة: اجعل intent="chat" ورد بأن بإمكانه التواصل مع المطور عبر البريد dev.ahmed2003@gmail.com، بأسلوب ودود ومختصر.

سياق آخر رسائل المحادثة (الأقدم أولًا):
${historyText || "(لا يوجد سياق سابق)"}

الحالة الحالية لموقع المستخدم:
- اسم الموقع: ${website.site_name}
- القالب: ${website.template_id}
- لون الموقع: ${website.theme_color}
- محتوى الموقع (JSON): ${JSON.stringify(website.json_structure)}

رسالة المستخدم الحالية: "${text}"

أعد JSON فقط، دون markdown، بالضبط بهذا الشكل (احذف أي حقل غير منطبق بدل تركه فارغًا وهميًا):
{
  "intent": "update" أو "chat",
  "reply": "نص الرد بالعربية إذا كان intent=chat، وإلا اتركه نصًا فارغًا",
  "siteName": "...",
  "templateId": "store|restaurant|services|portfolio|booking",
  "themeColor": "#hex",
  "jsonStructure": {
    "tagline": "",
    "description": "",
    "ctaLabel": "",
    "templateStyle": "classic أو modern أو cinematic أو app",
    "darkMode": true أو false,
    "items": [{"name":"","description":"","price":""}],
    "services": [{"name":"","description":""}],
    "projects": [{"title":"","description":""}],
    "hours": [{"day":"","time":""}],
    "contact": {"phone":"","whatsapp":"","email":"","address":""},
    "socialLinks": {"instagram":"","twitter":"","facebook":"","tiktok":"","snapchat":""},
    "team": [{"name":"","role":"","bio":""}],
    "testimonials": [{"name":"","quote":""}],
    "faq": [{"question":"","answer":""}],
    "skills": ["فقط لقالب portfolio"],
    "experience": [{"role":"","company":"","period":"","description":""}],
    "certifications": [{"name":"","issuer":"","year":""}]
  }
}

قواعد إلزامية:
- إذا كان intent="update": أعد siteName و templateId و themeColor و jsonStructure كاملة تعكس حالة الموقع بعد تطبيق التغيير المطلوب فقط. أي حقل أو عنصر في jsonStructure لم يطلب المستخدم تغييره يجب نسخها كما هي تمامًا من "محتوى الموقع" أعلاه دون حذف أو تفريغ. عند طلب إضافة عنصر إلى قائمة (خدمة/منتج/مشروع/فريق/رأي عميل/سؤال شائع)، أعد نفس القائمة القديمة كاملة مع إضافة العنصر الجديد إليها، لا تستبدلها بعنصر واحد فقط. عند طلب إضافة معلومة تواصل واحدة (مثل رقم فقط)، أعد كائن contact كاملاً مع دمج القيمة الجديدة مع القيم القديمة الموجودة فيه، لا تحذف القيم الأخرى.
- كل قالب متاح بأربع نسخ: "classic" (كلاسيكية)، "modern" (عصرية بتصميم وتخطيط مختلف)، "cinematic" (سينمائية داكنة فاخرة بنصوص متحركة مع التمرير — قسم رئيسي بخلفية كاملة الشاشة)، و"app" (يشبه تطبيق جوال حقيقي بالكامل: شريط تنقل سفلي، شريط علوي به بحث ومشاركة، بطاقات ملء الشاشة، تصنيفات قابلة للتصفح، وصفحة تفاصيل مستقلة لكل منتج/طبق/خدمة). إذا طلب المستخدم "شكل عصري"، "غيّر التصميم"، "قالب مختلف لنفس النوع"، "شكل سينمائي/فاخر/متحرك مع السكرول"، أو "خليه يشبه تطبيق موبايل/أبلكيشن حقيقي" ونحوها، غيّر templateStyle فقط دون تغيير templateId (اختر cinematic للطلبات السينمائية/الفاخرة/المتحركة، واختر app لمن يطلب شكل تطبيق جوال/أبلكيشن تحديدًا). إذا طلب "الوضع الداكن" أو "خلفية سوداء للموقع كامل"، اجعل darkMode=true؛ ولإلغائه اجعله false. لا تخلط بين darkMode (خلفية الموقع كاملة) وthemeColor (لون العناصر والأزرار البارزة).
- استخدم فقط أسماء الحقول المذكورة أعلاه بالضبط (contact, socialLinks, team, testimonials, faq, hours...) ولا تخترع أسماء حقول جديدة، لأن الموقع لن يعرض أي حقل غير هذه الأسماء مهما كانت قيمته. skills وexperience وcertifications خاصة بقالب portfolio فقط. إذا طلب المستخدم قسمًا أو محتوى لا يقابله أي حقل من هذه القائمة (أو طلب واحدًا من الحقول الخاصة بـ portfolio وموقعه ليس من هذا القالب)، اجعل intent="chat" وقل له بصراحة إن هذا القسم غير متوفر حاليًا في هذا القالب، ولا تحاول تمثيله بحقل مختلف أو اختراع اسم جديد له.
- إذا كان طلب المستخدم يقع ضمن "غير مدعوم" أعلاه، أو كانت الرسالة غامضة ولا تستطيع تحديد تغيير واضح منها، اجعل intent="chat" واشرح بصراحة في "reply" ماذا لا يمكنك تنفيذه ولماذا، واقترح بديلاً مدعومًا فعليًا إن وجد. لا تجعل intent="update" أبدًا لطلب لا يمكنك تمثيله فعليًا في jsonStructure.
- إذا كان intent="chat": أعد فقط {"intent":"chat","reply":"..."}، ولا تكتب siteName ولا templateId ولا themeColor ولا jsonStructure إطلاقًا (اتركها بدون ذكر). النظام سيحتفظ بحالة الموقع كما هي تلقائيًا، فلا داعي لنسخها أو تكرارها.`;
}

function normalizeGenerated(raw: unknown) {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const siteName =
    typeof value.siteName === "string" && value.siteName.trim()
      ? value.siteName.trim().slice(0, 120)
      : "موقع جديد";
  const templateId =
    typeof value.templateId === "string" && templates.has(value.templateId)
      ? value.templateId
      : "services";
  const themeColor =
    typeof value.themeColor === "string" && /^#[0-9a-f]{6}$/i.test(value.themeColor)
      ? value.themeColor
      : "#e56b4e";
  const jsonStructure =
    value.jsonStructure &&
    typeof value.jsonStructure === "object" &&
    !Array.isArray(value.jsonStructure)
      ? (value.jsonStructure as Record<string, unknown>)
      : Object.fromEntries(
          ["tagline", "description", "ctaLabel", "phone", "items", "services", "projects", "hours", "address", "experience", "experiences", "offerings", "menu", "menuItems"]
            .filter((key) => key in value)
            .map((key) => [key, value[key]]),
        );
  return { siteName, templateId, themeColor, jsonStructure };
}

function normalizeAssistantResponse(
  raw: unknown,
  website: WebsiteRow,
): {
  intent: "chat" | "update";
  reply: string;
  siteName: string;
  templateId: string;
  themeColor: string;
  jsonStructure: Record<string, unknown>;
} {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const intent = value.intent === "update" ? "update" : "chat";
  const reply =
    typeof value.reply === "string" && value.reply.trim()
      ? value.reply.trim()
      : "وصلت رسالتك. كيف أقدر أساعدك في موقعك؟";
  const siteName =
    typeof value.siteName === "string" && value.siteName.trim()
      ? value.siteName.trim().slice(0, 120)
      : website.site_name;
  const templateId =
    typeof value.templateId === "string" && templates.has(value.templateId)
      ? value.templateId
      : website.template_id;
  const themeColor =
    typeof value.themeColor === "string" && /^#[0-9a-f]{6}$/i.test(value.themeColor)
      ? value.themeColor
      : website.theme_color;
  const jsonStructure =
    value.jsonStructure && typeof value.jsonStructure === "object" && !Array.isArray(value.jsonStructure)
      ? (value.jsonStructure as Record<string, unknown>)
      : website.json_structure;
  return { intent, reply, siteName, templateId, themeColor, jsonStructure };
}

function safeMergeJsonStructure(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
  userText: string,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...current, ...incoming };
  const allowShrink = deletionPattern.test(userText);
  const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === "object" && !Array.isArray(value);

  for (const key of Object.keys(merged)) {
    const currentValue = current[key];
    const mergedValue = merged[key];
    if (Array.isArray(currentValue) && Array.isArray(mergedValue) && !allowShrink) {
      if (mergedValue.length < currentValue.length) {
        merged[key] = currentValue;
      }
    }
    if (isPlainObject(currentValue) && isPlainObject(mergedValue)) {
      merged[key] = { ...currentValue, ...mergedValue };
    }
  }
  return merged;
}

function normalizeTemplateFields(
  structure: Record<string, unknown>,
  templateId: string,
): Record<string, unknown> {
  const normalized = { ...structure };
  if (normalized.services === undefined) {
    const services = normalized.offerings ?? normalized.experiences;
    if (services !== undefined && (templateId === "services" || templateId === "booking")) normalized.services = services;
  }
  if (normalized.projects === undefined) {
    const projects = normalized.experiences;
    if (projects !== undefined && templateId === "portfolio") normalized.projects = projects;
  }
  if (normalized.items === undefined) {
    const items = normalized.menu ?? normalized.menuItems;
    if (items !== undefined && (templateId === "store" || templateId === "restaurant")) normalized.items = items;
  }
  return normalized;
}

function templateArabicName(templateId: string): string {
  switch (templateId) {
    case "store": return "المتجر";
    case "restaurant": return "المطعم";
    case "services": return "الخدمات";
    case "portfolio": return "البورتفوليو";
    case "booking": return "الحجوزات";
    default: return "الموقع";
  }
}

function availableSectionsText(templateId: string): string {
  const { label } = templateCollection(templateId);
  const base = `${label}ات، معلومات التواصل، ساعات العمل، الفريق، آراء العملاء، الأسئلة الشائعة`;
  return templateId === "portfolio" ? `${base}، المهارات، الخبرات، الشهادات` : base;
}

function structuresEqual(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function nameOf(entry: unknown, fallback: string): string {
  const record = entry && typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};
  const value = record.name ?? record.title;
  const str = typeof value === "string" && value.trim() ? value.trim() : fallback;
  return str.length > 24 ? str.slice(0, 21) + "..." : str;
}

type ImageTarget = 
  | { kind: "logo" } 
  | { kind: "hero" } 
  | { kind: "team"; index: number; key: string } 
  | { kind: "item"; index: number; key: string };

function parseImageTargetId(id: string): ImageTarget | null {
  if (id === "img_logo") return { kind: "logo" };
  if (id === "img_hero") return { kind: "hero" };
  const teamMatch = id.match(/^img_team:(\d+)$/);
  if (teamMatch) return { kind: "team", index: Number(teamMatch[1]), key: "team" };
  const itemMatch = id.match(/^img_item:(\d+):(.+)$/);
  if (itemMatch) return { kind: "item", index: Number(itemMatch[1]), key: itemMatch[2] };
  return null;
}

function applyImageToStructure(
  structure: Record<string, unknown>,
  target: ImageTarget,
  url: string,
): Record<string, unknown> {
  const updated = { ...structure };
  if (target.kind === "logo") {
    updated.logo = url;
    return updated;
  }
  if (target.kind === "hero") {
    updated.heroImage = url;
    return updated;
  }
  
  if (target.kind === "team" || target.kind === "item") {
    const list = Array.isArray(updated[target.key]) ? (updated[target.key] as Array<Record<string, unknown>>).slice() : [];
    if (!list[target.index]) return updated;
    list[target.index] = { ...list[target.index], image: url };
    updated[target.key] = list;
  }
  
  return updated;
}

function collectionSectionTitle(label: string): string {
  if (label === "منتج") return "المنتجات";
  if (label === "خدمة") return "الخدمات";
  if (label === "مشروع") return "الأعمال";
  return "القائمة";
}

// --- Multiple pending images, placed in one shot -------------------------
//
// The common case (one photo, then pick where it goes) is untouched above.
// This only kicks in once a *second* photo arrives before the first is
// placed: instead of asking "where does this go?" over and over, every
// pending photo gets a number and the user places all of them with a single
// free-text message, e.g. "1 شعار، 2 قهوة عربية، 3 عضو جديد اسمه سارة".

function buildImagePlacementPrompt(website: WebsiteRow, pendingCount: number, text: string): string {
  const structure = website.json_structure;
  const team = Array.isArray(structure.team) ? (structure.team as unknown[]) : [];
  const { key: collectionKey, label } = templateCollection(website.template_id);
  const collection = Array.isArray(structure[collectionKey]) ? (structure[collectionKey] as unknown[]) : [];

  const teamList = team.map((member, index) => `  - index ${index}: ${nameOf(member, `فرد ${index + 1}`)}`).join("\n") || "  (لا يوجد أعضاء بعد)";
  const collectionList = collection.map((entry, index) => `  - index ${index}: ${nameOf(entry, `${label} ${index + 1}`)}`).join("\n") || "  (لا توجد عناصر بعد)";

  return `أرسل المستخدم ${pendingCount} صور مرقّمة بالترتيب (1 إلى ${pendingCount})، وأرسل بعدها رسالة نصية يوضح فيها مكان كل صورة.
موقعه فيه هذه العناصر حاليًا (استخدم index الموجود بالضبط عند الإشارة لعنصر قائم):
فريق العمل:
${teamList}
${label}ات:
${collectionList}

رسالة المستخدم: "${text}"

لكل رقم صورة من 1 إلى ${pendingCount}، حدد وجهتها من هذه الخيارات فقط:
- "logo" (الشعار)
- "hero" (الصورة الرئيسية)
- {"team_index": N} لعضو فريق موجود برقم index أعلاه
- {"team_new": "اسم العضو الجديد"} لعضو فريق جديد
- {"item_index": N} لعنصر ${label} موجود برقم index أعلاه
- {"item_new": "اسم العنصر الجديد"} لعنصر ${label} جديد
- null إذا ما قدرت تحدد وجهة هذه الصورة من كلام المستخدم

أعد JSON فقط بهذا الشكل بالضبط، بدون أي شرح: {"placements": {"1": <وجهة>, "2": <وجهة>, ...}}`;
}

type BatchTargetRaw =
  | "logo"
  | "hero"
  | { team_index: number }
  | { team_new: string }
  | { item_index: number }
  | { item_new: string }
  | null;

function applyBatchPlacements(
  structure: Record<string, unknown>,
  templateId: string,
  images: PendingImage[],
  placements: Record<string, BatchTargetRaw>,
): { structure: Record<string, unknown>; summary: string[]; unresolved: PendingImage[] } {
  let updated = { ...structure };
  const summary: string[] = [];
  const unresolved: PendingImage[] = [];
  const { key: collectionKey } = templateCollection(templateId);

  images.forEach((image, i) => {
    const raw = placements[String(i + 1)];
    if (raw === "logo") {
      updated.logo = image.url;
      summary.push(`صورة ${i + 1} ← الشعار`);
    } else if (raw === "hero") {
      updated.heroImage = image.url;
      summary.push(`صورة ${i + 1} ← الصورة الرئيسية`);
    } else if (raw && typeof raw === "object" && "team_new" in raw && typeof raw.team_new === "string" && raw.team_new.trim()) {
      const list = Array.isArray(updated.team) ? (updated.team as Array<Record<string, unknown>>).slice() : [];
      list.push({ name: raw.team_new.trim(), image: image.url });
      updated.team = list;
      summary.push(`صورة ${i + 1} ← عضو فريق جديد: ${raw.team_new.trim()}`);
    } else if (raw && typeof raw === "object" && "item_new" in raw && typeof raw.item_new === "string" && raw.item_new.trim()) {
      const list = Array.isArray(updated[collectionKey]) ? (updated[collectionKey] as Array<Record<string, unknown>>).slice() : [];
      list.push({ name: raw.item_new.trim(), image: image.url });
      updated[collectionKey] = list;
      summary.push(`صورة ${i + 1} ← عنصر جديد: ${raw.item_new.trim()}`);
    } else if (raw && typeof raw === "object" && "team_index" in raw && typeof raw.team_index === "number" && Number.isInteger(raw.team_index)) {
      updated = applyImageToStructure(updated, { kind: "team", index: raw.team_index, key: "team" }, image.url);
      summary.push(`صورة ${i + 1} ← عضو الفريق ${raw.team_index + 1}`);
    } else if (raw && typeof raw === "object" && "item_index" in raw && typeof raw.item_index === "number" && Number.isInteger(raw.item_index)) {
      updated = applyImageToStructure(updated, { kind: "item", index: raw.item_index, key: collectionKey }, image.url);
      summary.push(`صورة ${i + 1} ← عنصر ${raw.item_index + 1} في القائمة`);
    } else {
      unresolved.push(image);
    }
  });

  return { structure: updated, summary, unresolved };
}

async function sendImageTargetPicker(env: Env, from: string, website: WebsiteRow, offset = 0): Promise<void> {
  const structure = website.json_structure;
  const team = Array.isArray(structure.team) ? (structure.team as unknown[]) : [];
  const { key: collectionKey, label } = templateCollection(website.template_id);
  const collection = Array.isArray(structure[collectionKey]) ? (structure[collectionKey] as unknown[]) : [];

  const generalRows = [
    { id: "img_logo", title: "شعار 🏷️" },
    { id: "img_hero", title: "صورة رئيسية 🖼️" },
  ];

  if (team.length === 0 && collection.length === 0) {
    await sendButtonMessage(env, from, "وصلت الصورة. وين تحطها؟", generalRows);
    return;
  }

  const teamShown = team.slice(0, 3);
  const teamRows = [
    ...teamShown.map((member, index) => ({
      id: `img_team:${index}`,
      title: nameOf(member, `فرد ${index + 1}`),
      description: "صورة فريق العمل",
    })),
    { id: "img_new:team", title: "➕ عضو جديد بصورته", description: "إضافة فرد جديد للفريق" },
  ];

  const budgetLeft = Math.max(0, 10 - generalRows.length - teamRows.length);
  const willPaginate = collection.length > offset + Math.max(0, budgetLeft - 1);
  const pageSize = Math.max(0, budgetLeft - 1 - (willPaginate ? 1 : 0));
  const pageItems = collection.slice(offset, offset + pageSize);
  const collectionRows = [
    ...pageItems.map((entry, i) => {
      const index = offset + i;
      return { id: `img_item:${index}:${collectionKey}`, title: nameOf(entry, `${label} ${index + 1}`), description: `صورة ${label}` };
    }),
    { id: `img_new:${collectionKey}`, title: `➕ ${label} جديد بصورته`, description: `إضافة ${label} جديد` },
    ...(willPaginate ? [{ id: `img_more:${offset + pageSize}`, title: "التالي ⏭️", description: `باقي ${label}ات الموقع` }] : []),
  ];

  await sendListMessage(env, from, "وصلت الصورة. اختر وين تحطها بالضبط:", "اختيار الموضع", [
    { title: "عام", rows: generalRows },
    { title: "الفريق", rows: teamRows },
    { title: collectionSectionTitle(label), rows: collectionRows },
  ]);
}

// --- Dashboard menus -------------------------------------------------------
//
// The main menu is a *list* message rather than 3 reply buttons: WhatsApp
// caps interactive buttons at 3 (see sendButtonMessage above), which isn't
// enough room for "add / manage / view / stats / help" side by side. A list
// gives the person the same tap-don't-type experience with up to 10 rows.

function itemAddTitle(label: string): string {
  // "منتج"/"طبق"/"مشروع" all read naturally as "إضافة <label>"; "خدمة"
  // (services + booking) reads better as "إضافة خدمة" too — same pattern.
  return `إضافة ${label} ➕`;
}

async function sendMainMenu(env: Env, from: string, website: WebsiteRow): Promise<void> {
  await sendListMessage(env, from, `للتعديل السريع اكتب طلبك مباشرة (مثل: "غيّر لون الموقع للأزرق" أو "عدّل الوصف")، وللمنتجات والصور افتح لوحة التحكم.`, "القائمة", [
    {
      title: "القائمة الرئيسية",
      rows: [
        { id: "menu_dashboard", title: "لوحة التحكم 🖥️", description: `المنتجات والصور والمحتوى` },
        { id: "menu_view_site", title: "عرض الموقع 🌐", description: "افتح رابط موقعك" },
        { id: "menu_stats", title: "الإحصائيات 📊", description: "عدد زوار موقعك" },
        { id: "menu_help", title: "مساعدة ❓", description: "ماذا يقدر يفعل ORxai" },
        { id: "menu_delete_site", title: "حذف الموقع 🗑️", description: "حذف نهائي، وبناء موقع جديد من الصفر" },
      ],
    },
  ]);
}

// Shown after any completed operation (add/edit/delete an item, place an
// image...) so the person can immediately jump to the next thing instead of
// typing again. This fits in 3 reply buttons, so plain buttons work here.
async function sendSuccessMenu(env: Env, from: string, website: WebsiteRow, message: string): Promise<void> {
  const { label } = templateCollection(website.template_id);
  await sendTextMessage(env, from, message);
  await pace();
  await sendButtonMessage(env, from, "ماذا تحب تفعل الآن؟", [
    { id: "flow_start_add", title: itemAddTitle(label) },
    { id: "menu_manage_items", title: "إدارة ⚙️" },
    { id: "menu_view_site", title: "عرض الموقع 🌐" },
  ]);
}

// Every reply sent once a website exists ends with this same "إدارة الموقع"
// button, so no message — success, error, or "not found" — is ever a dead
// end the person has to type their way out of. Skip it only for messages
// immediately followed by a fuller menu (sendMainMenu/sendSuccessMenu
// already offer their own next steps) or sent before a website exists.
async function replyToUser(env: Env, from: string, userId: string, text: string, website: WebsiteRow | null): Promise<void> {
  if (website) {
    await sendButtonMessage(env, from, text, [{ id: "open_main_menu", title: "إدارة الموقع ⚙️" }]);
  } else {
    await sendTextMessage(env, from, text);
  }
  await recordConversation(env, userId, "outbound", text);
}

function priceOrNote(entry: unknown): string | undefined {
  const record = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
  if (typeof record.price === "string" && record.price.trim()) return record.price.trim();
  if (typeof record.description === "string" && record.description.trim()) return record.description.trim();
  return undefined;
}

// "إدارة المنتجات/الخدمات/..." — one list message with an "add new" row up
// top and one row per existing item, offset-paginated exactly like
// sendImageTargetPicker's collection rows (same 10-row ceiling).
async function sendManageList(env: Env, from: string, website: WebsiteRow, offset = 0): Promise<void> {
  const { key, label } = templateCollection(website.template_id);
  const collection = Array.isArray(website.json_structure[key]) ? (website.json_structure[key] as unknown[]) : [];

  if (collection.length === 0) {
    await sendButtonMessage(env, from, `ما فيه ${label}ات بموقعك بعد. ابدأ بإضافة أول واحد.`, [
      { id: "flow_start_add", title: itemAddTitle(label) },
    ]);
    return;
  }

  const pageSize = 8;
  const willPaginate = collection.length > offset + pageSize;
  const pageItems = collection.slice(offset, offset + pageSize);
  const rows = [
    { id: "flow_start_add", title: `➕ ${label} جديد` },
    ...pageItems.map((entry, i) => {
      const index = offset + i;
      const note = priceOrNote(entry);
      return {
        id: `manage_item:${key}:${index}`,
        title: nameOf(entry, `${label} ${index + 1}`),
        ...(note ? { description: note } : {}),
      };
    }),
    ...(willPaginate ? [{ id: `manage_more:${key}:${offset + pageSize}`, title: "التالي ⏭️" }] : []),
  ];

  await sendListMessage(env, from, `اختر ${label} من ${collectionSectionTitle(label)}، أو أضف واحدًا جديدًا:`, "اختيار", [
    { title: collectionSectionTitle(label), rows },
  ]);
}

async function sendItemActionButtons(env: Env, from: string, key: string, index: number, name: string): Promise<void> {
  await sendButtonMessage(env, from, `ماذا تحب تفعل بـ "${name}"؟`, [
    { id: `item_edit:${key}:${index}`, title: "تعديل ✏️" },
    { id: `item_delete:${key}:${index}`, title: "حذف 🗑️" },
    { id: `item_view:${key}:${index}`, title: "عرض 👁️" },
  ]);
}

// --- Step-by-step add/edit item flow ---------------------------------------
//
// A lightweight state machine stored on the user row (pending_flow +
// pending_flow_data — see migrations/015_pending_flow.sql). Deliberately
// bypasses Gemini entirely: name/price/image are the three fields every
// template's items actually use, so there's nothing here for the model to
// interpret. This is the common "أضف منتج" case; free-text edits with more
// nuance still go through buildAssistantPrompt as before.

const skipCancelButtons = [
  { id: "flow_skip", title: "تخطي ⏭️" },
  { id: "flow_cancel", title: "إلغاء ❌" },
];
const skipCancelManageButtons = [
  { id: "flow_skip", title: "تخطي ⏭️" },
  { id: "flow_cancel", title: "إلغاء ❌" },
  { id: "open_main_menu", title: "إدارة الموقع ⚙️" },
];

function flowSummaryLines(data: Record<string, unknown>): string[] {
  const lines = [`الاسم: ${typeof data.name === "string" ? data.name : "—"}`];
  if (typeof data.price === "string" && data.price) lines.push(`السعر: ${data.price}`);
  lines.push(typeof data.image === "string" && data.image ? "الصورة: مرفقة 📷" : "الصورة: بدون صورة");
  return lines;
}

async function sendFlowConfirmation(env: Env, from: string, mode: "add" | "edit", data: Record<string, unknown>): Promise<void> {
  const lines = ["مراجعة أخيرة قبل الحفظ:", ...flowSummaryLines(data)];
  await sendButtonMessage(env, from, lines.join("\n"), [
    { id: mode === "add" ? "flow_save_add" : "flow_save_edit", title: "حفظ ✅" },
    { id: "flow_cancel", title: "إلغاء ❌" },
  ]);
}

// Wraps setPendingFlow for the writes that ARE the point of the action (e.g.
// starting a flow) — if this fails, the feature genuinely didn't work, so
// the person needs a specific, honest message rather than the generic
// catch-all one. The most common real cause: migrations/015_pending_flow.sql
// hasn't been applied yet, so the pending_flow/pending_flow_data columns
// don't exist — Supabase then rejects the write outright.
async function setPendingFlowOrNotify(
  env: Env,
  from: string,
  userId: string,
  flow: string | null,
  data: Record<string, unknown> = {},
): Promise<boolean> {
  try {
    await setPendingFlow(env, userId, flow, data);
    return true;
  } catch (error) {
    console.error(
      "setPendingFlow failed — if this is a column-not-found error, migrations/015_pending_flow.sql hasn't been applied to this database yet",
      error,
    );
    await sendTextMessage(
      env,
      from,
      "تعذّر بدء هذه الخطوة بسبب خلل بقاعدة البيانات. أبلغ فريق التطوير — الأرجح إن قاعدة البيانات تحتاج تحديثًا (migration) لم يُطبّق بعد.",
    );
    return false;
  }
}

// Wraps setPendingFlow for pure cleanup writes — clearing the flow state
// after the real action (a save, a delete, a cancel) already happened. That
// real action must not be masked by a scary generic error just because this
// bookkeeping write failed; log it and move on.
async function clearPendingFlowQuietly(env: Env, userId: string): Promise<void> {
  await setPendingFlow(env, userId, null, {}).catch((error) => console.error("Clearing pending_flow failed (non-fatal)", error));
}

async function cancelFlow(env: Env, user: UserRow, from: string, website: WebsiteRow | null): Promise<void> {
  await clearPendingFlowQuietly(env, user.id);
  await sendTextMessage(env, from, "تم الإلغاء ❌");
  if (website) {
    await pace();
    await sendMainMenu(env, from, website);
  }
}

// Advances the flow by exactly one step given whatever the person just sent
// (typed text, a tapped "تخطي", or an uploaded image's storage URL).
async function advanceFlow(
  env: Env,
  user: UserRow,
  website: WebsiteRow,
  from: string,
  input: { text?: string; skip?: boolean; imageUrl?: string; priceHint?: string },
): Promise<void> {
  const flow = user.pending_flow;
  const data = { ...(user.pending_flow_data as Record<string, unknown>) };
  const { label } = templateCollection(website.template_id);

  if (flow === "add_item_name" || flow === "edit_item_name") {
    if (!input.skip) {
      const name = (input.text ?? "").trim();
      if (!name) {
        await sendButtonMessage(env, from, `أرسل اسم ال${label} كنص، أو اضغط إلغاء.`, [{ id: "flow_cancel", title: "إلغاء ❌" }, { id: "open_main_menu", title: "إدارة الموقع ⚙️" }]);
        return;
      }
      data.name = name.slice(0, 80);
      if (input.priceHint) data.price = input.priceHint.slice(0, 40);
    } else if (typeof data.name !== "string") {
      // Name is required — "تخطي" only applies to the optional steps below.
      await sendButtonMessage(env, from, `لازم اسم لل${label}. أرسله كنص، أو اضغط إلغاء.`, [{ id: "flow_cancel", title: "إلغاء ❌" }, { id: "open_main_menu", title: "إدارة الموقع ⚙️" }]);
      return;
    }
    // Understood the price straight from the name message (see the Gemini
    // extraction in handleMessage) — no reason to ask again.
    if (input.priceHint) {
      const next = flow === "add_item_name" ? "add_item_image" : "edit_item_image";
      if (!(await setPendingFlowOrNotify(env, from, user.id, next, data))) return;
      await sendButtonMessage(env, from, `تمام، فهمت: "${data.name}" بسعر ${input.priceHint}.\nأرسل صورة الآن، أو اضغط تخطي.`, skipCancelManageButtons);
      return;
    }
    const next = flow === "add_item_name" ? "add_item_price" : "edit_item_price";
    if (!(await setPendingFlowOrNotify(env, from, user.id, next, data))) return;
    await sendButtonMessage(env, from, `كم سعر ${label === "مشروع" ? "المشروع" : "ال" + label}؟ (اضغط تخطي إذا ما يوجد سعر ثابت)`, skipCancelManageButtons);
    return;
  }

  if (flow === "add_item_price" || flow === "edit_item_price") {
    if (!input.skip) data.price = (input.text ?? "").trim().slice(0, 40);
    const next = flow === "add_item_price" ? "add_item_image" : "edit_item_image";
    if (!(await setPendingFlowOrNotify(env, from, user.id, next, data))) return;
    await sendButtonMessage(env, from, `أرسل صورة ل${label === "مشروع" ? "لمشروع" : "ل" + label} الآن، أو اضغط تخطي.`, skipCancelManageButtons);
    return;
  }

  if (flow === "add_item_image" || flow === "edit_item_image") {
    if (input.imageUrl) data.image = input.imageUrl;
    const mode = flow === "add_item_image" ? "add" : "edit";
    if (!(await setPendingFlowOrNotify(env, from, user.id, mode === "add" ? "confirm_add_item" : "confirm_edit_item", data))) return;
    await sendFlowConfirmation(env, from, mode, data);
    return;
  }
}

// Gemini's one job during the flow: when someone answers the "ما الاسم؟"
// step with a full sentence that also happens to mention a price ("قهوة
// عربية بخمسة عشر ريال"), split that into a clean name and a price so the
// flow can skip asking for the price again — the flow's own state machine
// still does the actual save. Only called when the text has a digit in it;
// a plain name never reaches Gemini at all.
async function extractNameAndPrice(env: Env, rawText: string, label: string): Promise<{ name: string; price?: string } | null> {
  try {
    const raw = (await askGemini(
      env,
      `مستخدم يكتب اسم ${label} جديد لموقعه، وربما ذكر السعر ضمن نفس الرسالة.
رسالته: "${rawText}"
أعد JSON فقط بهذا الشكل: {"name": "...", "price": "..." أو null}
- name: اسم ${label} فقط، منظّف من أي ذكر للسعر أو كلام إضافي.
- price: السعر بصيغته إن ذكره المستخدم صراحة (مثال: "15 ريال")، وإلا null.`,
      true,
    )) as Record<string, unknown> | null;
    const name = typeof raw?.name === "string" ? raw.name.trim() : "";
    if (!name) return null;
    const price = typeof raw?.price === "string" && raw.price.trim() ? raw.price.trim() : undefined;
    return { name, price };
  } catch (error) {
    console.error("Name/price extraction failed", error);
    return null;
  }
}

async function handleFlowImage(env: Env, user: UserRow, from: string, message: IncomingMessage): Promise<void> {
  const website = await getLatestWebsite(env, user.id);
  if (!website) {
    await clearPendingFlowQuietly(env, user.id);
    return;
  }
  const mediaId = message.image?.id;
  if (!mediaId) return;
  try {
    const { bytes, mimeType } = await downloadMedia(env, mediaId);
    const extension = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
    const path = `${website.id}/${crypto.randomUUID()}.${extension}`;
    const url = await uploadImageToStorage(env, path, bytes, mimeType);
    await advanceFlow(env, user, website, from, { imageUrl: url });
    await recordConversation(env, user.id, "outbound", "[صورة العنصر ضمن خطوات الإضافة/التعديل]");
  } catch (error) {
    console.error("Flow image upload failed", error);
    await sendTextMessage(env, from, "صار خطأ أثناء رفع الصورة. جرّب ترسلها مرة ثانية أو اضغط تخطي.");
  }
}

// Persists the confirmed add/edit — the only two ids handleSelection routes
// here are flow_save_add and flow_save_edit, both only reachable once
// pending_flow is already the matching confirm_* step.
async function saveConfirmedFlow(env: Env, user: UserRow, from: string, mode: "add" | "edit"): Promise<void> {
  const website = await getLatestWebsite(env, user.id);
  const data = user.pending_flow_data as Record<string, unknown>;
  if (!website || typeof data.name !== "string") {
    await clearPendingFlowQuietly(env, user.id);
    await sendTextMessage(env, from, "ما فيه عملية بانتظار الحفظ حاليًا.");
    return;
  }
  const { key } = templateCollection(website.template_id);
  const list = Array.isArray(website.json_structure[key]) ? [...(website.json_structure[key] as Array<Record<string, unknown>>)] : [];
  const entry: Record<string, unknown> = { name: data.name };
  if (typeof data.price === "string" && data.price) entry.price = data.price;
  if (typeof data.image === "string" && data.image) entry.image = data.image;

  if (mode === "add") {
    list.push(entry);
  } else {
    const index = Number(data.index);
    if (!Number.isInteger(index) || !list[index]) {
      await clearPendingFlowQuietly(env, user.id);
      await sendTextMessage(env, from, "تعذّر العثور على العنصر لتعديله. جرّب فتح قائمة الإدارة مرة أخرى.");
      return;
    }
    list[index] = { ...list[index], ...entry };
  }

  await updateWebsite(env, website.id, {
    site_name: website.site_name,
    template_id: website.template_id,
    theme_color: website.theme_color,
    json_structure: { ...website.json_structure, [key]: list },
  });
  // The save above already succeeded — this is just bookkeeping, so a
  // failure here must never turn into an error that hides that success.
  await clearPendingFlowQuietly(env, user.id);
  await sendSuccessMenu(env, from, website, mode === "add" ? `تمت إضافة "${data.name}" بنجاح ✅` : `تم حفظ التعديلات على "${data.name}" بنجاح ✅`);
}

async function handleSelection(env: Env, from: string, selectionId: string): Promise<void> {
  let user = await ensureUser(env, from);
  const website = await getLatestWebsite(env, user.id);

  // Tapping anything other than the flow's own controls (skip/cancel/save)
  // abandons whatever step-by-step flow was pending, so a stale draft never
  // silently swallows an unrelated later reply.
  const flowContinuationIds = new Set(["flow_skip", "flow_cancel", "flow_save_add", "flow_save_edit"]);
  const isBuildChoiceId = selectionId.startsWith("build_type:") || selectionId.startsWith("build_style:") || selectionId === "retry_build";
  if (user.pending_flow && !flowContinuationIds.has(selectionId) && !isBuildChoiceId) {
    await clearPendingFlowQuietly(env, user.id);
    user = { ...user, pending_flow: null, pending_flow_data: {} };
  }
  // Same idea for the older single-image placement state: anything other
  // than that picker's own ids abandons it too, instead of leaving it to
  // silently intercept whatever the person taps or types next.
  const isImagePickerId = selectionId.startsWith("img_more:") || selectionId.startsWith("img_new:") || parseImageTargetId(selectionId) !== null;
  if (user.pending_image_url && !isImagePickerId) {
    await clearAllPendingImageState(env, user.id);
    user = { ...user, pending_image_url: null, pending_image_new_key: null, pending_images: [] };
  }

  const typeChoiceMatch = selectionId.match(/^build_type:(store|restaurant|services|portfolio|booking|auto)$/);
  if (typeChoiceMatch) {
    if (!user.pending_build_request || website || user.pending_flow !== "build_choose_type") {
      await sendTextMessage(env, from, "ما فيه طلب إنشاء موقع بانتظار هذا الاختيار حاليًا.");
      return;
    }
    const type = typeChoiceMatch[1] === "auto" ? undefined : typeChoiceMatch[1];
    // Carry the username forward — setPendingFlow REPLACES pending_flow_data
    // wholesale, it doesn't merge, so dropping the spread here would silently
    // lose the username collected one step earlier.
    if (!(await setPendingFlowOrNotify(env, from, user.id, "build_choose_style", { ...(user.pending_flow_data as Record<string, unknown>), templateId: type }))) return;
    await sendStyleChoices(env, from, type ?? "store");
    return;
  }

  const styleChoiceMatch = selectionId.match(/^build_style:(classic|modern|cinematic|app|auto)$/);
  if (styleChoiceMatch) {
    if (!user.pending_build_request || website || user.pending_flow !== "build_choose_style") {
      await sendTextMessage(env, from, "ما فيه طلب إنشاء موقع بانتظار هذا الاختيار حاليًا.");
      return;
    }
    const data = user.pending_flow_data as Record<string, unknown>;
    const templateId = typeof data.templateId === "string" ? data.templateId : undefined;
    const style = styleChoiceMatch[1] === "auto" ? undefined : styleChoiceMatch[1];
    await generateAndCreateSite(env, from, user, String(data.username ?? ""), { templateId, templateStyle: style });
    return;
  }

  if (selectionId === "retry_build") {
    if (!user.pending_build_request || website || user.pending_flow !== "build_choose_style") {
      await sendTextMessage(env, from, "ما فيه طلب إنشاء بانتظار إعادة المحاولة. أخبرني عن نشاطك التجاري من جديد.");
      return;
    }
    const data = user.pending_flow_data as Record<string, unknown>;
    const templateId = typeof data.templateId === "string" ? data.templateId : undefined;
    const templateStyle = typeof data.templateStyle === "string" ? data.templateStyle : undefined;
    await generateAndCreateSite(env, from, user, String(data.username ?? ""), { templateId, templateStyle });
    return;
  }

  const switchStyleMatch = selectionId.match(/^switch_style:(cinematic|app)$/);
  if (switchStyleMatch) {
    if (!website) return;
    const structure = { ...website.json_structure, templateStyle: switchStyleMatch[1], darkMode: switchStyleMatch[1] === "cinematic" ? true : website.json_structure.darkMode };
    await updateWebsite(env, website.id, {
      site_name: website.site_name,
      template_id: website.template_id,
      theme_color: website.theme_color,
      json_structure: structure,
    });
    await replyToUser(env, from, user.id, "تم ✅ بدّلت شكل موقعك ليعرض الصور. افتح نفس الرابط لرؤية التغييرات.", website);
    return;
  }

  if (selectionId === "menu_dashboard") {
    const baseUrl = await frontendBaseUrl(env);
    await replyToUser(env, from, user.id, `لوحة التحكم: ${baseUrl}/dashboard\nمن هناك تدير الصور والمنتجات وكل خدماتك.`, website);
    return;
  }

  if (selectionId === "open_main_menu") {
    if (website) await sendMainMenu(env, from, website);
    return;
  }

  if (selectionId === "menu_help") {
    const responseText = website
      ? `هذا دوري معك:\n\n✏️ التعديل السريع على النصوص والألوان والشكل — اكتب طلبك بكلامك العادي، مثل: "غيّر لون الموقع للأزرق"، "خلي التصميم يشبه تطبيق موبايل"، "عدّل الوصف".\n🖥️ المنتجات والأطباق والخدمات والصور وكل المحتوى — من لوحة التحكم في المنصة (زر "لوحة التحكم" في القائمة).\n🗑️ وأقدر أحذف موقعك وأبدأ معك من جديد.`
      : "ORxai يبني لك موقعًا احترافيًا من وصف بسيط لنشاطك — فقط أخبرني عنه، وبعدها تدير كل شيء من لوحة التحكم.";
    await sendTextMessage(env, from, responseText);
    await recordConversation(env, user.id, "outbound", responseText);
    if (website) {
      await pace();
      await sendMainMenu(env, from, website);
    }
    return;
  }

  if (selectionId === "flow_cancel") {
    await cancelFlow(env, user, from, website);
    return;
  }

  if (selectionId === "flow_skip") {
    if (!website || !user.pending_flow) {
      await replyToUser(env, from, user.id, "ما فيه خطوة بانتظار التخطي حاليًا.", website);
      return;
    }
    await advanceFlow(env, user, website, from, { skip: true });
    return;
  }

  if (selectionId === "flow_save_add" || selectionId === "flow_save_edit") {
    const expected = selectionId === "flow_save_add" ? "confirm_add_item" : "confirm_edit_item";
    if (!website || user.pending_flow !== expected) {
      await replyToUser(env, from, user.id, "ما فيه عملية بانتظار الحفظ حاليًا.", website);
      return;
    }
    await saveConfirmedFlow(env, user, from, selectionId === "flow_save_add" ? "add" : "edit");
    return;
  }

  if (selectionId === "flow_start_add") {
    if (!website) {
      await sendTextMessage(env, from, "ما عندك موقع بعد. اضغط 'إنشاء موقع' نبدأ.");
      return;
    }
    const { key, label } = templateCollection(website.template_id);
    if (!(await setPendingFlowOrNotify(env, from, user.id, "add_item_name", { key }))) return;
    const responseText = `تمام، لنضف ${label} جديد. ما اسمه؟`;
    await sendButtonMessage(env, from, responseText, [{ id: "flow_cancel", title: "إلغاء ❌" }, { id: "open_main_menu", title: "إدارة الموقع ⚙️" }]);
    await recordConversation(env, user.id, "outbound", responseText);
    return;
  }

  if (selectionId === "menu_manage_items") {
    if (!website) {
      await sendTextMessage(env, from, "ما عندك موقع بعد. اضغط 'إنشاء موقع' نبدأ.");
      return;
    }
    await sendManageList(env, from, website);
    return;
  }

  if (selectionId === "menu_delete_site") {
    if (!website) {
      await sendTextMessage(env, from, "ما عندك موقع بعد لحذفه.");
      return;
    }
    await sendButtonMessage(
      env,
      from,
      `⚠️ متأكد إنك تبي تحذف موقعك "${website.site_name}" بالكامل؟ هذا الإجراء نهائي ولا يمكن التراجع عنه. بعد الحذف مباشرة تقدر تبني موقعًا جديدًا من الصفر.`,
      [
        { id: "site_delete_confirm", title: "تأكيد الحذف نهائيًا ⚠️" },
        { id: "flow_cancel", title: "إلغاء ❌" },
      ],
    );
    return;
  }

  if (selectionId === "site_delete_confirm") {
    if (!website) {
      await sendTextMessage(env, from, "ما عندك موقع بعد لحذفه.");
      return;
    }
    await deleteWebsite(env, website.id);
    // The delete above is done and irreversible — nothing after this point
    // may turn into an error that leaves the person unsure whether it
    // actually happened.
    await clearPendingFlowQuietly(env, user.id);
    await clearAllPendingImageState(env, user.id).catch((error) => console.error("Clearing pending image state failed (non-fatal)", error));
    const responseText = `تم حذف موقعك "${website.site_name}" نهائيًا ✅\n\nجاهز نبني موقعًا جديدًا من الصفر — أخبرني عن نشاطك التجاري (اسمه، نوعه، خدماته).`;
    await sendTextMessage(env, from, responseText);
    await recordConversation(env, user.id, "outbound", responseText);
    return;
  }

  const manageMoreMatch = selectionId.match(/^manage_more:([a-zA-Z]+):(\d+)$/);
  if (manageMoreMatch) {
    if (!website) return;
    await sendManageList(env, from, website, Number(manageMoreMatch[2]));
    return;
  }

  const manageItemMatch = selectionId.match(/^manage_item:([a-zA-Z]+):(\d+)$/);
  if (manageItemMatch) {
    if (!website) return;
    const [, key, indexStr] = manageItemMatch;
    const index = Number(indexStr);
    const list = Array.isArray(website.json_structure[key]) ? (website.json_structure[key] as unknown[]) : [];
    const entry = list[index];
    if (!entry) {
      await replyToUser(env, from, user.id, "هذا العنصر لم يعد موجودًا. افتح قائمة الإدارة مرة أخرى.", website);
      return;
    }
    await sendItemActionButtons(env, from, key, index, nameOf(entry, "هذا العنصر"));
    return;
  }

  const itemViewMatch = selectionId.match(/^item_view:([a-zA-Z]+):(\d+)$/);
  if (itemViewMatch) {
    if (!website) return;
    const [, key, indexStr] = itemViewMatch;
    const entry = (website.json_structure[key] as unknown[] | undefined)?.[Number(indexStr)];
    if (!entry || typeof entry !== "object") {
      await replyToUser(env, from, user.id, "هذا العنصر لم يعد موجودًا.", website);
      return;
    }
    const record = entry as Record<string, unknown>;
    const lines = [`الاسم: ${nameOf(record, "—")}`];
    if (typeof record.price === "string" && record.price) lines.push(`السعر: ${record.price}`);
    if (typeof record.description === "string" && record.description) lines.push(`الوصف: ${record.description}`);
    lines.push(record.image ? "الصورة: مرفقة 📷" : "الصورة: بدون صورة");
    await sendButtonMessage(env, from, lines.join("\n"), [
      { id: `item_edit:${key}:${indexStr}`, title: "تعديل ✏️" },
      { id: `item_delete:${key}:${indexStr}`, title: "حذف 🗑️" },
      { id: "open_main_menu", title: "إدارة الموقع ⚙️" },
    ]);
    return;
  }

  const itemEditMatch = selectionId.match(/^item_edit:([a-zA-Z]+):(\d+)$/);
  if (itemEditMatch) {
    if (!website) return;
    const [, key, indexStr] = itemEditMatch;
    const index = Number(indexStr);
    const entry = (website.json_structure[key] as unknown[] | undefined)?.[index] as Record<string, unknown> | undefined;
    if (!entry) {
      await replyToUser(env, from, user.id, "هذا العنصر لم يعد موجودًا.", website);
      return;
    }
    const { label } = templateCollection(website.template_id);
    const started = await setPendingFlowOrNotify(env, from, user.id, "edit_item_name", {
      key,
      index,
      name: typeof entry.name === "string" ? entry.name : undefined,
      price: typeof entry.price === "string" ? entry.price : undefined,
      image: typeof entry.image === "string" ? entry.image : undefined,
    });
    if (!started) return;
    const responseText = `الاسم الحالي: "${nameOf(entry, label)}". أرسل الاسم الجديد، أو اضغط تخطي للإبقاء عليه.`;
    await sendButtonMessage(env, from, responseText, skipCancelManageButtons);
    await recordConversation(env, user.id, "outbound", responseText);
    return;
  }

  const itemDeleteMatch = selectionId.match(/^item_delete:([a-zA-Z]+):(\d+)$/);
  if (itemDeleteMatch) {
    if (!website) return;
    const [, key, indexStr] = itemDeleteMatch;
    const entry = (website.json_structure[key] as unknown[] | undefined)?.[Number(indexStr)];
    if (!entry) {
      await replyToUser(env, from, user.id, "هذا العنصر لم يعد موجودًا.", website);
      return;
    }
    await sendButtonMessage(env, from, `متأكد إنك تبي تحذف "${nameOf(entry, "هذا العنصر")}"؟ لا يمكن التراجع بعدها.`, [
      { id: `item_delete_confirm:${key}:${indexStr}`, title: "تأكيد الحذف ⚠️" },
      { id: "flow_cancel", title: "إلغاء ❌" },
    ]);
    return;
  }

  const itemDeleteConfirmMatch = selectionId.match(/^item_delete_confirm:([a-zA-Z]+):(\d+)$/);
  if (itemDeleteConfirmMatch) {
    if (!website) return;
    const [, key, indexStr] = itemDeleteConfirmMatch;
    const index = Number(indexStr);
    const list = Array.isArray(website.json_structure[key]) ? [...(website.json_structure[key] as unknown[])] : [];
    if (!list[index]) {
      await replyToUser(env, from, user.id, "هذا العنصر لم يعد موجودًا.", website);
      return;
    }
    const removedName = nameOf(list[index], "العنصر");
    list.splice(index, 1);
    await updateWebsite(env, website.id, {
      site_name: website.site_name,
      template_id: website.template_id,
      theme_color: website.theme_color,
      json_structure: { ...website.json_structure, [key]: list },
    });
    await sendSuccessMenu(env, from, website, `تم حذف "${removedName}" بنجاح ✅`);
    return;
  }

  if (selectionId === "menu_view_site") {
    if (!website) {
      await replyToUser(env, from, user.id, "ما عندك موقع بعد. اضغط 'إنشاء موقع' نبدأ.", null);
      return;
    }
    const baseUrl = await frontendBaseUrl(env);
    await replyToUser(env, from, user.id, `هذا رابط موقعك: ${baseUrl}/${website.username}`, website);
    return;
  }

  if (selectionId === "menu_edit_site") {
    if (!website) {
      await replyToUser(env, from, user.id, "ما عندك موقع بعد. اضغط 'إنشاء موقع' نبدأ.", null);
      return;
    }
    await replyToUser(env, from, user.id, "تمام، اكتب التعديل اللي تبيه (مثلاً: غيّر اللون، أضف خدمة، عدّل النص...).", website);
    return;
  }

  if (selectionId === "menu_create_site") {
    if (website) {
      await replyToUser(env, from, user.id, "عندك موقع بالفعل. تقدر تعدّله من القائمة، أو تحذفه لتبني موقعًا جديدًا.", website);
      return;
    }
    await sendTextMessage(env, from, "أخبرني عن نشاطك التجاري (اسم النشاط، نوعه، خدماتك)، وبعدها بطلب منك اسم المستخدم.");
    await recordConversation(env, user.id, "outbound", "أخبرني عن نشاطك التجاري (اسم النشاط، نوعه، خدماتك)، وبعدها بطلب منك اسم المستخدم.");
    return;
  }

  if (selectionId === "menu_stats") {
    if (!website) {
      await replyToUser(env, from, user.id, "ما عندك موقع بعد. اضغط 'إنشاء موقع' نبدأ.", null);
      return;
    }
    const stats = await getVisitStats(env, website.id);
    await replyToUser(env, from, user.id, `📊 إحصائيات موقعك:\nزوار اليوم: ${stats.today}\nإجمالي الزوار: ${stats.total}`, website);
    return;
  }

  const moreMatch = selectionId.match(/^img_more:(\d+)$/);
  if (moreMatch) {
    if (!website || !user.pending_image_url) {
      await replyToUser(env, from, user.id, "ما فيه صورة بانتظار وضعها حاليًا. أرسل الصورة مرة ثانية.", website);
      return;
    }
    await sendImageTargetPicker(env, from, website, Number(moreMatch[1]));
    return;
  }

  const newMatch = selectionId.match(/^img_new:(.+)$/);
  if (newMatch) {
    if (!website || !user.pending_image_url) {
      await replyToUser(env, from, user.id, "ما فيه صورة بانتظار وضعها حاليًا. أرسل الصورة مرة ثانية.", website);
      return;
    }
    await setPendingImageNewKey(env, user.id, newMatch[1]);
    const responseText = "تمام، أرسل الاسم بالنص الآن.";
    await sendTextMessage(env, from, responseText);
    await recordConversation(env, user.id, "outbound", responseText);
    return;
  }

  const target = parseImageTargetId(selectionId);
  if (target) {
    if (!website || !user.pending_image_url) {
      await replyToUser(env, from, user.id, "ما فيه صورة بانتظار وضعها حاليًا. أرسل الصورة مرة ثانية.", website);
      return;
    }
    const newStructure = applyImageToStructure(website.json_structure, target, user.pending_image_url);
    await updateWebsite(env, website.id, {
      site_name: website.site_name,
      template_id: website.template_id,
      theme_color: website.theme_color,
      json_structure: newStructure,
    });
    await setPendingImage(env, user.id, null);
    await replyToUser(env, from, user.id, "تم تحديث الصورة بنجاح. افتح نفس الرابط لرؤية التغييرات.", website);
  }
}

async function handleImageMessage(env: Env, from: string, message: IncomingMessage): Promise<void> {
  const user = await ensureUser(env, from);
  const website = await getLatestWebsite(env, user.id);
  if (!website) {
    const responseText = "لازم تنشئ موقعك أولًا قبل إضافة صور. أخبرني عن نشاطك التجاري.";
    await sendTextMessage(env, from, responseText);
    await recordConversation(env, user.id, "outbound", responseText);
    return;
  }
  const mediaId = message.image?.id;
  if (!mediaId) return;
  try {
    const { bytes, mimeType } = await downloadMedia(env, mediaId);
    const extension = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
    const path = `${website.id}/${crypto.randomUUID()}.${extension}`;
    const url = await uploadImageToStorage(env, path, bytes, mimeType);

    const alreadyPending = Boolean(user.pending_image_url) || user.pending_images.length > 0;
    if (!alreadyPending) {
      // Common case, exactly as before: one photo, one interactive picker.
      await setPendingImage(env, user.id, url);
      await sendImageTargetPicker(env, from, website);
      await recordConversation(env, user.id, "outbound", "[صورة بانتظار تحديد الموضع]");
      return;
    }

    // A second (or later) photo arrived before the first was placed — move
    // into batch mode: number every pending photo and let one follow-up
    // text message place all of them at once, instead of repeating the
    // picker for each one.
    const batch: PendingImage[] = user.pending_image_url
      ? [{ url: user.pending_image_url, receivedAt: new Date().toISOString() }, ...user.pending_images]
      : user.pending_images;
    batch.push({ url, receivedAt: new Date().toISOString() });
    if (user.pending_image_url) {
      // Switching out of single-image picker mode into batch mode.
      await clearAllPendingImageState(env, user.id);
    }
    await setPendingImages(env, user.id, batch);

    const responseText =
      batch.length === 2
        ? `وصلتني ${batch.length} صور 📸 أرسل صورًا إضافية إذا حاب، أو اكتب رسالة توضح مكان كل صورة برقمها، مثلاً:\n"1 شعار، 2 قهوة عربية"`
        : `استلمت الصورة رقم ${batch.length} 📸 أرسل المزيد أو اكتب الآن أين توضع كل صورة برقمها.`;
    await sendTextMessage(env, from, responseText);
    await recordConversation(env, user.id, "outbound", responseText);
  } catch (error) {
    console.error("Image upload failed", error);
    const responseText = "صار خطأ أثناء رفع الصورة. جرّب ترسلها مرة ثانية.";
    await sendTextMessage(env, from, responseText);
    await recordConversation(env, user.id, "outbound", responseText);
  }
}

// Short, hardcoded status lines sent while the site is actually being
// generated — from the code, not from Gemini (Gemini is busy with the real
// generation call and shouldn't be asked to also narrate its own progress).
// Fired in the background alongside the Gemini call (not awaited before it),
// then awaited once before the final "done" message so ordering stays
// correct even if Gemini responds unusually fast.
async function sendBuildProgressUpdates(env: Env, from: string): Promise<void> {
  const steps = [
    "جاري تجهيز موقعك... ⏳",
    "جاري إعداد التصميم والأقسام... 🎨",
    "جاري إضافة المحتوى والمنتجات... 📦",
  ];
  for (const step of steps) {
    await sendTextMessage(env, from, step).catch((error) => console.error("Progress message failed", error));
    await pace(2600);
  }
}

// Asked right after the username, before generating anything — the person
// picks the site type explicitly instead of the bot silently guessing it
// from free text.
async function sendTypeChoices(env: Env, from: string): Promise<void> {
  await sendListMessage(env, from, "أي نوع يناسب موقعك؟", "اختيار النوع", [
    {
      title: "نوع الموقع",
      rows: [
        { id: "build_type:store", title: "متجر 🛍️", description: "لبيع منتجات: ملابس، إكسسوارات، أي بضائع" },
        { id: "build_type:restaurant", title: "مطعم / مقهى 🍽️", description: "لعرض قائمة الأطعمة والمشروبات" },
        { id: "build_type:services", title: "خدمات 🧰", description: "تصميم، صيانة، استشارات، وغيرها" },
        { id: "build_type:portfolio", title: "بورتفوليو 🎨", description: "لعرض أعمالك ومشاريعك السابقة" },
        { id: "build_type:booking", title: "حجز مواعيد 📅", description: "عيادة، صالون، مستشار..." },
        { id: "build_type:auto", title: "اختر لي الأنسب ✨", description: "أدعك أقرر حسب وصفك" },
      ],
    },
  ]);
}

// Style support for per-item photos differs by choice (see
// supportsCollectionImages below) — the descriptions here flag that plainly
// so the choice itself is informed, not just aesthetic.
async function sendStyleChoices(env: Env, from: string, templateId: string): Promise<void> {
  const photoNote = templateId === "store" || templateId === "portfolio" ? " · يعرض صور" : " · بدون صور للعناصر";
  await sendListMessage(env, from, "وش الشكل اللي يعجبك لموقعك؟", "اختيار الشكل", [
    {
      title: "شكل التصميم",
      rows: [
        { id: "build_style:classic", title: "كلاسيكي ⚪", description: `أنيق وهادئ، يناسب أي نشاط${photoNote}` },
        { id: "build_style:modern", title: "عصري 🔷", description: `شبابي بتصميم مختلف${templateId === "portfolio" ? " · بدون صور للعناصر" : photoNote}` },
        { id: "build_style:cinematic", title: "سينمائي فاخر ⚫", description: "داكن وفخم، حركة عند التمرير · يعرض صور" },
        { id: "build_style:app", title: "تطبيق جوال 📱", description: "يشبه تطبيق حقيقي: شريط تنقل وبحث · يعرض صور" },
        { id: "build_style:auto", title: "اختر لي الأنسب ✨", description: "أدعك أقرر حسب وصفك" },
      ],
    },
  ]);
}

function matchTypeFromText(text: string): string | null {
  const normalized = text.trim();
  if (/متجر|محل|منتج/i.test(normalized)) return "store";
  if (/مطعم|مقهى|كافيه|كافي/i.test(normalized)) return "restaurant";
  if (/بورتفوليو|معرض أعمال|أعمالي/i.test(normalized)) return "portfolio";
  if (/حجز|موعد/i.test(normalized)) return "booking";
  if (/خدم/i.test(normalized)) return "services";
  return null;
}

function matchStyleFromText(text: string): string | null {
  const normalized = text.trim();
  if (/سينما|فخم|داكن/i.test(normalized)) return "cinematic";
  if (/تطبيق|موبايل|أبلكيشن|جوال/i.test(normalized)) return "app";
  if (/عصري|حديث/i.test(normalized)) return "modern";
  if (/كلاسيك/i.test(normalized)) return "classic";
  return null;
}

// The actual generation step — reached only after both the type and style
// are settled (explicitly chosen or "auto"), whichever path got there.
async function generateAndCreateSite(
  env: Env,
  from: string,
  user: UserRow,
  username: string,
  forced?: { templateId?: string; templateStyle?: string },
): Promise<void> {
  // Belt-and-suspenders: a website created with an empty username produces
  // a broken link (baseUrl/ with nothing after it) — never let that happen
  // silently, whatever upstream state issue might cause it.
  if (!username.trim()) {
    console.error("generateAndCreateSite called with an empty username — pending_flow_data likely lost it");
    await clearPendingFlowQuietly(env, user.id);
    await sendTextMessage(env, from, "صار خلل بسيط وضاع اسم المستخدم. أرسل اسم المستخدم مرة أخرى بالإنجليزية، مثل: my-store");
    return;
  }
  // Checkpoint the resolved choice (not just raw ids) so a failed attempt
  // below can be retried with one tap — no re-asking type/style, no asking
  // to "resend the username" when the flow was never actually waiting on one.
  await setPendingFlow(env, user.id, "build_choose_style", {
    username,
    templateId: forced?.templateId,
    templateStyle: forced?.templateStyle,
  }).catch((error) => console.error("Checkpointing build choice failed (non-fatal)", error));

  const businessText = user.pending_build_request ?? "";
  const progress = sendBuildProgressUpdates(env, from);
  let generated: ReturnType<typeof normalizeGenerated>;
  try {
    generated = normalizeGenerated(await askGemini(env, buildPrompt(businessText, forced), true));
  } catch (error) {
    console.error("Site generation failed", error);
    await progress;
    // Nothing was charged for this attempt — the quota check happens only
    // after a successful generation below — and the choice is checkpointed,
    // so retrying is a single tap with no lost state.
    const responseText = "تعذّر إنشاء الموقع الآن بسبب انشغال مؤقت بخدمة الذكاء الاصطناعي. جرّب مرة ثانية بعد لحظات.";
    await sendButtonMessage(env, from, responseText, [{ id: "retry_build", title: "إعادة المحاولة 🔄" }]);
    await recordConversation(env, user.id, "outbound", responseText);
    return;
  }
  await progress;

  const quotaUser = await consumeMessageQuota(env, user.id);
  if (!quotaUser) {
    await sendTextMessage(env, from, "انتهت رسائلك المجانية. تواصل مع الإدارة لتوسيع حصتك.");
    return;
  }

  const created = await createWebsite(env, {
    user_id: user.id,
    username,
    site_name: generated.siteName,
    template_id: forced?.templateId || generated.templateId,
    theme_color: generated.themeColor,
    json_structure: forced?.templateStyle ? { ...generated.jsonStructure, templateStyle: forced.templateStyle } : generated.jsonStructure,
    show_branding: true,
  });
  await setPendingBuildRequest(env, user.id, null);
  await clearPendingFlowQuietly(env, user.id);
  const baseUrl = await frontendBaseUrl(env);
  const successText = `🎉 تم إنشاء موقعك بنجاح: ${baseUrl}/${created.username}\n\nمن الآن: للتعديل السريع على النصوص والألوان اكتب لي طلبك هنا، وللمنتجات والصور وكل المحتوى افتح لوحة التحكم 👇`;
  await pace();
  await sendTextMessage(env, from, successText);
  await recordConversation(env, user.id, "outbound", successText);
  await pace();
  await sendMainMenu(env, from, created);
}

async function handleMessage(env: Env, message: IncomingMessage): Promise<void> {
  const from = message.from;
  if (!from || !message.id) return;

  // A blocked user is fully ignored: no reply, no quota spent, no Gemini
  // call. Checked once here, ahead of every branch below (button taps,
  // images, and text), rather than inside each handler.
  const blockCheck = await ensureUser(env, from);
  if (blockCheck.blocked) return;

  const selectionId =
    message.type === "interactive"
      ? message.interactive?.button_reply?.id ?? message.interactive?.list_reply?.id
      : undefined;
  if (selectionId) {
    void markMessageRead(env, message.id).catch((error) => console.error("Mark read failed", error));
    await handleSelection(env, from, selectionId);
    return;
  }

  if (message.type === "image") {
    void markMessageRead(env, message.id).catch((error) => console.error("Mark read failed", error));
    const flowUser = await ensureUser(env, from);
    if (flowUser.pending_flow === "add_item_image" || flowUser.pending_flow === "edit_item_image") {
      await handleFlowImage(env, flowUser, from, message);
      return;
    }
    // Images are uploaded from the dashboard now (it knows the site's style
    // and shows the result immediately) — chat just points the way.
    const imageSite = await getLatestWebsite(env, flowUser.id);
    const imageBase = await frontendBaseUrl(env);
    await replyToUser(
      env,
      from,
      flowUser.id,
      imageSite
        ? `الصور تُرفع الآن من لوحة التحكم — أسهل وتشوف النتيجة مباشرة:\n${imageBase}/dashboard/site`
        : "أخبرني أولًا عن نشاطك لأبني موقعك، وبعدها ترفع الصور من لوحة التحكم.",
      imageSite,
    );
    return;
  }

  const text = textFromMessage(message);
  if (!text || message.type !== "text") return;

  void markMessageRead(env, message.id).catch((error) => console.error("Mark read failed", error));
  let user = await ensureUser(env, from);
  const [, website] = await Promise.all([
    recordConversation(env, user.id, "inbound", text),
    getLatestWebsite(env, user.id),
  ]);

  // Platform sign-in: the dashboard shows a one-time code (ORX-XXXXXX) and the
  // person sends it here from their own WhatsApp — that is the whole proof of
  // identity. Handled before any flow state so it works from any point.
  const loginMatch = text.toUpperCase().match(/\bORX-([A-HJKMNP-Z2-9]{6})\b/);
  if (loginMatch) {
    const bound = await verifyLoginChallengeByCode(env, `ORX-${loginMatch[1]}`, from, user.id).catch((error) => {
      console.error("Login verification failed", error);
      return false;
    });
    const responseText = bound
      ? "تم تأكيد دخولك ✅\nارجع الآن لصفحة المنصة — ستنتقل تلقائيًا إلى لوحة التحكم."
      : "هذا الكود غير صحيح أو منتهي. ارجع لصفحة الدخول في المنصة واطلب كودًا جديدًا.";
    await sendTextMessage(env, from, responseText);
    await recordConversation(env, user.id, "outbound", responseText);
    return;
  }

  if (website && user.pending_flow && cancelPattern.test(text)) {
    await cancelFlow(env, user, from, website);
    return;
  }

  if (website && (user.pending_flow === "confirm_add_item" || user.pending_flow === "confirm_edit_item")) {
    const affirmative = /^(نعم|ايوه|أيوه|اي|ايوا|تمام|اوك|أوكي|احفظ|احفظه|حفظ|موافق|yes|ok)[!.؟?،, ]*$/i.test(text);
    if (affirmative) {
      await saveConfirmedFlow(env, user, from, user.pending_flow === "confirm_add_item" ? "add" : "edit");
      return;
    }
    await sendButtonMessage(env, from, "اضغط \"حفظ ✅\" لتأكيد الحفظ، أو \"إلغاء ❌\" للتراجع عنه.", [
      { id: user.pending_flow === "confirm_add_item" ? "flow_save_add" : "flow_save_edit", title: "حفظ ✅" },
      { id: "flow_cancel", title: "إلغاء ❌" },
    ]);
    return;
  }

  if (website && (user.pending_flow === "add_item_name" || user.pending_flow === "edit_item_name")) {
    if (skipPattern.test(text)) {
      await advanceFlow(env, user, website, from, { skip: true });
      return;
    }
    // A name reply with digits in it might be "قهوة عربية 15 ريال" — let
    // Gemini split name from price so the flow can skip straight past the
    // price question instead of asking for something already given. A plain
    // name (no digits) never triggers this call at all.
    if (/\d/.test(text)) {
      const { label } = templateCollection(website.template_id);
      const extracted = await extractNameAndPrice(env, text, label);
      if (extracted) {
        await advanceFlow(env, user, website, from, { text: extracted.name, priceHint: extracted.price });
        return;
      }
    }
    await advanceFlow(env, user, website, from, { text });
    return;
  }

  if (website && (user.pending_flow === "add_item_price" || user.pending_flow === "edit_item_price")) {
    await advanceFlow(env, user, website, from, skipPattern.test(text) ? { skip: true } : { text });
    return;
  }

  if (website && (user.pending_flow === "add_item_image" || user.pending_flow === "edit_item_image")) {
    if (skipPattern.test(text)) {
      await advanceFlow(env, user, website, from, { skip: true });
      return;
    }
    await sendTextMessage(env, from, "أرسل صورة، أو اكتب \"تخطي\" لعدم إضافة صورة الآن.");
    return;
  }

  if (website && user.pending_image_new_key && user.pending_image_url) {
    try {
      const key = user.pending_image_new_key;
      const structure = { ...website.json_structure };
      const list = Array.isArray(structure[key]) ? (structure[key] as Array<Record<string, unknown>>).slice() : [];
      const newEntry: Record<string, unknown> = { name: text, image: user.pending_image_url };
      list.push(newEntry);
      structure[key] = list;
      await updateWebsite(env, website.id, {
        site_name: website.site_name,
        template_id: website.template_id,
        theme_color: website.theme_color,
        json_structure: structure,
      });
      await setPendingImage(env, user.id, null);
      await setPendingImageNewKey(env, user.id, null);
      const responseText = "تمام، أضفتها بصورتها. افتح نفس الرابط لرؤية التغييرات.";
      await sendTextMessage(env, from, responseText);
      await recordConversation(env, user.id, "outbound", responseText);
    } catch (error) {
      console.error("New-entry image placement failed", error);
      const responseText = "صار خطأ أثناء حفظ العنصر الجديد. جرّب مرة ثانية.";
      await sendTextMessage(env, from, responseText);
      await recordConversation(env, user.id, "outbound", responseText);
    }
    return;
  }

  if (website && user.pending_images.length > 0) {
    let raw: Record<string, unknown> | null;
    try {
      raw = (await askGemini(env, buildImagePlacementPrompt(website, user.pending_images.length, text), true)) as Record<string, unknown>;
    } catch (error) {
      console.error("Image placement parsing failed", error);
      raw = null;
    }
    const placements = (raw?.placements && typeof raw.placements === "object" ? raw.placements : {}) as Record<string, BatchTargetRaw>;

    try {
      const { structure, summary, unresolved } = applyBatchPlacements(
        website.json_structure,
        website.template_id,
        user.pending_images,
        placements,
      );

      if (summary.length === 0) {
        const responseText = 'ما قدرت أفهم مكان الصور من رسالتك. جرّب رقم كل صورة صراحة، مثلاً: "1 شعار، 2 صورة رئيسية".';
        await sendTextMessage(env, from, responseText);
        await recordConversation(env, user.id, "outbound", responseText);
        return;
      }

      await updateWebsite(env, website.id, {
        site_name: website.site_name,
        template_id: website.template_id,
        theme_color: website.theme_color,
        json_structure: structure,
      });
      await setPendingImages(env, user.id, unresolved);

      const lines = [`تم ✅\n${summary.join("\n")}`];
      if (unresolved.length > 0) {
        lines.push(`ما زال عندي ${unresolved.length} صورة بدون مكان واضح. وضّح مكانها في رسالة ثانية.`);
      } else {
        lines.push("افتح نفس الرابط لرؤية التغييرات.");
      }
      const responseText = lines.join("\n");
      await sendTextMessage(env, from, responseText);
      await recordConversation(env, user.id, "outbound", responseText);
    } catch (error) {
      console.error("Image placement application failed", error);
      const responseText = "تعذّر تحديد أماكن الصور من رسالتك. جرّب رقم كل صورة صراحة، مثلاً: \"1 شعار، 2 صورة رئيسية\".";
      await sendTextMessage(env, from, responseText);
      await recordConversation(env, user.id, "outbound", responseText);
    }
    return;
  }

  const buildKeywords = ["أنشئ", "انشئ", "ابني", "ابنِ", "ابنى", "اصنع", "سوي", "سو", "موقع"];

  if (user.pending_build_request && !website && user.pending_flow === "build_choose_type") {
    const type = matchTypeFromText(text);
    if (!type) {
      await sendTextMessage(env, from, "اختر نوعًا من القائمة فوق، أو اكتبه بكلمة وحدة مثل: متجر، مطعم، خدمات، بورتفوليو، حجز.");
      return;
    }
    if (!(await setPendingFlowOrNotify(env, from, user.id, "build_choose_style", { ...(user.pending_flow_data as Record<string, unknown>), templateId: type }))) return;
    await sendStyleChoices(env, from, type);
    return;
  }

  if (user.pending_build_request && !website && user.pending_flow === "build_choose_style") {
    const style = matchStyleFromText(text);
    if (!style) {
      await sendTextMessage(env, from, "اختر شكلًا من القائمة فوق، أو اكتبه بكلمة وحدة مثل: كلاسيكي، عصري، سينمائي، تطبيق.");
      return;
    }
    const data = user.pending_flow_data as Record<string, unknown>;
    const templateId = typeof data.templateId === "string" ? data.templateId : undefined;
    await generateAndCreateSite(env, from, user, String(data.username ?? ""), { templateId, templateStyle: style });
    return;
  }

  if (user.pending_build_request && !website) {
    const username = normalizeUsername(text);
    if (!username) {
      await sendTextMessage(env, from, "أرسل اسم المستخدم بالإنجليزية، من 3 إلى 30 حرفًا أو رقمًا، مثل: cafe-yemen");
      return;
    }
    if (await getWebsiteByPublicId(env, username)) {
      await sendTextMessage(env, from, "اسم المستخدم هذا مستخدم من قبل. أرسل اسمًا آخر مثل: my-store-2");
      return;
    }
    if (!(await setPendingFlowOrNotify(env, from, user.id, "build_choose_type", { username }))) return;
    await sendTypeChoices(env, from);
    return;
  }

  if (!website && user.pending_flow === "await_business_description") {
    // Second try — accept whatever comes back even if still short, so the
    // person isn't stuck in an endless clarification loop.
    if (!(await setPendingFlowOrNotify(env, from, user.id, null, {}))) return;
    await setPendingBuildRequest(env, user.id, text);
    await sendTextMessage(env, from, "ممتاز. سأبني لك موقعًا احترافيًا. أرسل اسم المستخدم الذي تريده للرابط، بالإنجليزية مثل: my-store");
    return;
  }

  if (!website && hasStandaloneKeyword(text, buildKeywords)) {
    if (isVagueBuildRequest(text)) {
      if (!(await setPendingFlowOrNotify(env, from, user.id, "await_business_description", {}))) return;
      const responseText = "حياك! قبل ما أبدأ، احكيلي عن نشاطك التجاري بشوي تفاصيل: شو اسمه؟ وش يبيع أو يقدّم؟ أي شي تحب يعرفه عملاؤك عنه؟";
      await sendTextMessage(env, from, responseText);
      await recordConversation(env, user.id, "outbound", responseText);
      return;
    }
    await setPendingBuildRequest(env, user.id, text);
    await sendTextMessage(env, from, "ممتاز. سأبني لك موقعًا احترافيًا. أرسل اسم المستخدم الذي تريده للرابط، بالإنجليزية مثل: my-store");
    return;
  }

  if (/تبق[تى]|المتبقي|رصيدي|كم.*رسالة/i.test(text)) {
    const remaining = Math.max(0, user.free_messages_limit - user.free_messages_used);
    await sendTextMessage(env, from, `متبقي لك ${remaining} رسالة مجانية من أصل ${user.free_messages_limit}.`);
    return;
  }

  // "الصورة ما ظهرت" and similar — answered from the real truth table
  // (supportsCollectionImages) instead of asking Gemini, so it's instant,
  // free, and never wrong about what the current style actually renders.
  const mentionsPhoto = /صور[ةه]?/i.test(text);
  const mentionsNotShowing = /(ما|لم|مو|مب|ماب|مب)\s*(ت?ظهر|بين|تبين|طلع|تطلع)|وين\s*(الصور|صورت)|ظهرت?\s*(ما|لا|مب)/i.test(text);
  if (website && mentionsPhoto && mentionsNotShowing) {
    const style = typeof website.json_structure.templateStyle === "string" ? website.json_structure.templateStyle : "classic";
    const supports = supportsCollectionImages(website.template_id, style);
    const { label } = templateCollection(website.template_id);
    if (!supports) {
      const styleArabic = style === "modern" ? "عصري" : "كلاسيكي";
      const responseText = `فهمت المشكلة: التصميم الحالي (${styleArabic}) لقالب ${templateArabicName(website.template_id)} ما يعرض صور لكل ${label} على حدة أصلًا — أي صورة ترسلها تُحفظ، بس ما تظهر بهذا الشكل. نمطا "سينمائي فاخر" و"تطبيق جوال" هما الوحيدين اللي يعرضان صور ${label}ات لهذا النوع من المواقع. تحب أبدّل الشكل لأحدهما؟`;
      await sendButtonMessage(env, from, responseText, [
        { id: "switch_style:cinematic", title: "سينمائي فاخر ⚫" },
        { id: "switch_style:app", title: "تطبيق جوال 📱" },
        { id: "flow_cancel", title: "خلها كذا" },
      ]);
      await recordConversation(env, user.id, "outbound", responseText);
      return;
    }
    const responseText = `التصميم الحالي (${style}) يدعم عرض صور ${label}ات، فالمفروض تظهر. جرّب تفتح رابط موقعك من جديد (تحديث الصفحة)، وإذا استمرت المشكلة قل لي اسم ${label} بالضبط وأتأكد منه.`;
    await sendTextMessage(env, from, responseText);
    await recordConversation(env, user.id, "outbound", responseText);
    return;
  }

  // Fast-path responses without consuming quota for greetings and simple link requests
  if (isBareGreeting(text)) {
    if (website) {
      await sendMainMenu(env, from, website);
    } else {
      await sendButtonMessage(env, from, "أهلاً بك! أنا ORxai، أساعدك تبني موقعك الاحترافي خلال دقائق.", [
        { id: "menu_create_site", title: "إنشاء موقع 🚀" },
      ]);
    }
    await recordConversation(env, user.id, "outbound", "[قائمة]");
    return;
  }

  if (website && isShowSiteRequest(text)) {
    const baseUrl = await frontendBaseUrl(env);
    const responseText = `هذا رابط موقعك: ${baseUrl}/${website.username}`;
    await sendTextMessage(env, from, responseText);
    await recordConversation(env, user.id, "outbound", responseText);
    return;
  }

  const [quotaUser, historyRows] = await Promise.all([
    consumeMessageQuota(env, user.id),
    getConversationMessages(env, user.id),
  ]);
  if (!quotaUser) {
    await sendTextMessage(env, from, "انتهت رسائلك المجانية. تواصل مع الإدارة لتوسيع حصتك.");
    return;
  }
  user = quotaUser;

  const historyText = historyRows
    .slice()
    .reverse()
    .map((item) => `${item.direction === "inbound" ? "المستخدم" : "البوت"}: ${item.content}`)
    .join("\n");

  if (!website) {
    const intentRaw = (await askGemini(
      env,
      `أنت ORxai، مساعد منصة لإنشاء مواقع عربية لأصحاب الأعمال عبر واتساب. هذا المستخدم ليس لديه موقع بعد.
حدد: هل رسالته تدل على رغبته ببناء موقع له (حتى لو ما ذكر كلمة "موقع" أو "أنشئ" صراحة — أي وصف لعمله أو خدماته أو منتجاته، أو طلب مساعدة تسويقية/بيع، يُعتبر نية بناء موقع)، أم أنها مجرد سؤال أو تحية عامة؟

سياق المحادثة:
${historyText || "(لا يوجد سياق سابق)"}

رسالة المستخدم الحالية: "${text}"

أعد JSON فقط بهذا الشكل: {"wantsWebsite": true أو false, "reply": "رد عربي مختصر"}
إذا wantsWebsite=true: اترك reply فارغًا — النظام سيطلب اسم المستخدم تلقائيًا. لا تقل أبدًا إن الموقع "جاهز" أو "تم إنشاؤه" هنا، فالإنشاء الفعلي يحدث فقط بعد إرسال اسم المستخدم لاحقًا.
إذا wantsWebsite=false: اكتب ردًا عربيًا مختصرًا مفيدًا في reply.`,
      true,
    )) as Record<string, unknown> | null;

    const wantsWebsite = intentRaw?.wantsWebsite === true;
    if (wantsWebsite) {
      const fullRequest = historyText ? `${historyText}\nالمستخدم: ${text}` : text;
      await setPendingBuildRequest(env, user.id, fullRequest);
      const responseText = "ممتاز. سأبني لك موقعًا احترافيًا. أرسل اسم المستخدم الذي تريده للرابط، بالإنجليزية مثل: my-store";
      await sendTextMessage(env, from, responseText);
      await recordConversation(env, user.id, "outbound", responseText);
      return;
    }
    const responseText =
      typeof intentRaw?.reply === "string" && intentRaw.reply.trim()
        ? intentRaw.reply.trim()
        : "وصلت رسالتك. أخبرني عن نشاطك التجاري وأقدر أبني لك موقعًا احترافيًا.";
    await sendTextMessage(env, from, responseText);
    await recordConversation(env, user.id, "outbound", responseText);
    return;
  }

  let aiResult: ReturnType<typeof normalizeAssistantResponse>;
  try {
    aiResult = normalizeAssistantResponse(
      await askGemini(env, buildAssistantPrompt({ text, website, historyText }), true),
      website,
    );
  } catch (error) {
    console.error("Update generation failed", error);
    const responseText = "تعذّر تنفيذ هذا التعديل بسبب ازدحام مؤقت. جرّب صياغة أبسط أو أعد المحاولة بعد قليل.";
    await sendTextMessage(env, from, responseText);
    await recordConversation(env, user.id, "outbound", responseText);
    return;
  }

  if (aiResult.intent === "chat") {
    await replyToUser(env, from, user.id, aiResult.reply, website);
    return;
  }

  const { structure: filteredIncoming, dropped } = filterSupportedStructureFields(aiResult.jsonStructure, aiResult.templateId);
  // Chat applies text edits only; products, team and images go through the dashboard.
  const { textOnly, redirected } = separateDashboardOnlyChanges(filteredIncoming, website.json_structure);
  const mergedStructure = normalizeTemplateFields(
    safeMergeJsonStructure(website.json_structure, textOnly, text),
    aiResult.templateId,
  );
  const dashboardUrl = `${await frontendBaseUrl(env)}/dashboard/site`;
  const dashboardNote = `المنتجات والأقسام والصور تُدار من لوحة التحكم:\n${dashboardUrl}`;

  const changed =
    !structuresEqual(website.json_structure, mergedStructure) ||
    aiResult.themeColor !== website.theme_color ||
    aiResult.siteName !== website.site_name ||
    aiResult.templateId !== website.template_id;

  const availableNote = `الأقسام المتاحة بقالب ${templateArabicName(aiResult.templateId)}: ${availableSectionsText(aiResult.templateId)}.`;

  if (!changed) {
    const clarify = redirected.length > 0
      ? `هذا التعديل يتم من لوحة التحكم، مو من المحادثة. ${dashboardNote}`
      : dropped.length > 0
      ? `هذا القسم غير متوفر حاليًا بهذا القالب. ${availableNote}`
      : "لم أفهم تغييرًا واضحًا من رسالتك. جرّب مثلًا: غيّر لون الموقع إلى الأسود، أو أضف خدمة تصميم الشعارات.";
    await replyToUser(env, from, user.id, clarify, website);
    return;
  }

  await updateWebsite(env, website.id, {
    site_name: aiResult.siteName,
    template_id: aiResult.templateId,
    theme_color: aiResult.themeColor,
    json_structure: mergedStructure,
  });
  const baseUrl = await frontendBaseUrl(env);
  const siteUrl = `${baseUrl}/${website.username}`;
  const responseText = redirected.length > 0
    ? `تم تنفيذ التعديلات النصية ✅\n(الجزء الخاص بالمنتجات أو الصور يتم من لوحة التحكم: ${dashboardUrl})\nشاهد النتيجة:\n${siteUrl}`
    : dropped.length > 0
    ? `تم تنفيذ الجزء الممكن من طلبك ✅ (فيه قسم آخر غير متوفر حاليًا بهذا القالب — ${availableNote})\nشاهد النتيجة من نفس الرابط:\n${siteUrl}`
    : `تم تحديث موقعك بنجاح ✅\nشاهد النتيجة من نفس الرابط:\n${siteUrl}`;
  await replyToUser(env, from, user.id, responseText, website);
}

// Site URLs live at the root (orxai.page/<username>), so a username must never
// shadow a platform route or an obvious system/impersonation name.
const RESERVED_USERNAMES = new Set([
  "login", "logout", "signin", "signup", "register", "dashboard", "admin", "api", "app", "www", "site",
  "settings", "account", "help", "support", "about", "pricing", "terms", "privacy", "contact", "static",
  "assets", "public", "orxai", "manfaz", "whatsapp", "webhook", "status", "docs", "blog",
]);

function normalizeUsername(value: string): string | null {
  const username = value.trim().replace(/^@/, "").toLowerCase();
  if (RESERVED_USERNAMES.has(username)) return null;
  return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(username) ? username : null;
}

export async function processIncomingMessage(env: Env, message: IncomingMessage): Promise<void> {
  if (!message.id || !(await claimProcessedMessage(env, message.id, message as Record<string, unknown>))) return;
  try {
    await handleMessage(env, message);
    try {
      await finishProcessedMessage(env, message.id);
    } catch (error) {
      // The user response has already been sent. Bookkeeping must not create
      // a second, misleading error reply.
      console.error("Unable to finalize processed WhatsApp message", {
        messageId: message.id,
        error,
      });
    }
  } catch (error) {
    console.error("handleMessage failed", {
      messageId: message.id,
      from: message.from,
      error,
    });
    if (message.from) {
      await Promise.allSettled([
        failProcessedMessage(env, message.id, error),
        sendTextMessage(
          env,
          message.from,
          "صار خطأ غير متوقع أثناء معالجة رسالتك. جرّب ترسلها مرة ثانية بعد قليل.",
        ),
      ]);
    } else {
      await failProcessedMessage(env, message.id, error).catch((failure) => {
        console.error("Unable to mark WhatsApp message as failed", failure);
      });
    }
  }
}
