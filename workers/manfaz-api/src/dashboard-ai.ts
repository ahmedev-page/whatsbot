import { cleanString, isHexColor, STYLES, templateCollection, VALID_TEMPLATES } from "./site-schema";

// Dashboard assistant: the user edits an in-browser draft card, so Gemini does
// not return a whole site. It returns a short reply plus a list of small,
// validated operations that the browser applies to the draft (with undo). Nothing
// here writes to the database — saving stays an explicit user action.

export interface DraftContext {
  siteName: string;
  templateId: string;
  themeColor: string;
  structure: Record<string, unknown>;
}

export type AiItem = Partial<Record<"name" | "title" | "price" | "duration" | "description" | "category", string>>;

export type AiOp =
  | { op: "set"; field: "siteName" | "headline" | "description" | "ctaLabel"; value: string }
  | { op: "color"; hex: string }
  | { op: "style"; style: string }
  | { op: "addItem"; item: AiItem; section?: string }
  | { op: "updateItem"; index: number; patch: AiItem }
  | { op: "removeItem"; index: number }
  | { op: "renameSection"; from: string; to: string }
  | { op: "removeSection"; name: string }
  | { op: "hours"; hours: Array<{ day: string; time: string }> }
  | { op: "contact"; patch: Partial<Record<"phone" | "whatsapp" | "email" | "address", string>> };

export interface AiCreate {
  templateId: string;
  siteName: string;
  headline: string;
  description: string;
  themeColor?: string;
  templateStyle?: string;
  items: AiItem[];
}

export interface AiResult {
  reply: string;
  ops: AiOp[];
  create: AiCreate | null;
}

const ITEM_LIMITS: Record<keyof AiItem, number> = { name: 120, title: 120, price: 40, duration: 40, description: 500, category: 80 };
const MAX_OPS = 40;
const MAX_ITEMS_SHOWN = 80;

const asObject = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

function text(v: unknown, max: number): string {
  return typeof v === "string" || typeof v === "number" ? cleanString(String(v)).slice(0, max).trim() : "";
}

function cleanItem(v: unknown): AiItem {
  const src = asObject(v);
  const out: AiItem = {};
  if (!src) return out;
  for (const key of Object.keys(ITEM_LIMITS) as Array<keyof AiItem>) {
    const value = text(src[key], ITEM_LIMITS[key]);
    if (value) out[key] = value;
  }
  return out;
}

const hasName = (item: AiItem) => !!(item.name || item.title);

function cleanIndex(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 1000 ? v : null;
}

export function normalizeOps(raw: unknown): AiOp[] {
  if (!Array.isArray(raw)) return [];
  const ops: AiOp[] = [];
  for (const entry of raw.slice(0, MAX_OPS)) {
    const o = asObject(entry);
    if (!o || typeof o.op !== "string") continue;
    switch (o.op) {
      case "set": {
        const field = o.field;
        if (field !== "siteName" && field !== "headline" && field !== "description" && field !== "ctaLabel") break;
        const value = text(o.value, field === "description" ? 400 : 120);
        if (value) ops.push({ op: "set", field, value });
        break;
      }
      case "color":
        if (isHexColor(o.hex)) ops.push({ op: "color", hex: o.hex.toUpperCase() });
        break;
      case "style":
        if (typeof o.style === "string" && (STYLES as readonly string[]).includes(o.style)) ops.push({ op: "style", style: o.style });
        break;
      case "addItem": {
        const item = cleanItem(o.item);
        if (hasName(item)) ops.push({ op: "addItem", item, section: text(o.section, 80) || undefined });
        break;
      }
      case "updateItem": {
        const index = cleanIndex(o.index);
        const patch = cleanItem(o.patch);
        if (index !== null && Object.keys(patch).length) ops.push({ op: "updateItem", index, patch });
        break;
      }
      case "removeItem": {
        const index = cleanIndex(o.index);
        if (index !== null) ops.push({ op: "removeItem", index });
        break;
      }
      case "renameSection": {
        const from = text(o.from, 80);
        const to = text(o.to, 80);
        if (from && to) ops.push({ op: "renameSection", from, to });
        break;
      }
      case "removeSection": {
        const name = text(o.name, 80);
        if (name) ops.push({ op: "removeSection", name });
        break;
      }
      case "hours": {
        if (!Array.isArray(o.hours)) break;
        const hours = o.hours
          .slice(0, 14)
          .map((h) => ({ day: text(asObject(h)?.day, 40), time: text(asObject(h)?.time, 60) }))
          .filter((h) => h.day && h.time);
        if (hours.length) ops.push({ op: "hours", hours });
        break;
      }
      case "contact": {
        const src = asObject(o.patch);
        if (!src) break;
        const patch: Partial<Record<"phone" | "whatsapp" | "email" | "address", string>> = {};
        for (const key of ["phone", "whatsapp", "email", "address"] as const) {
          const value = text(src[key], 160);
          if (value) patch[key] = value;
        }
        if (Object.keys(patch).length) ops.push({ op: "contact", patch });
        break;
      }
    }
  }
  return ops;
}

export function normalizeCreate(raw: unknown): AiCreate | null {
  const o = asObject(raw);
  if (!o) return null;
  const templateId = typeof o.templateId === "string" ? o.templateId : "";
  if (!(VALID_TEMPLATES as readonly string[]).includes(templateId)) return null;
  const items = (Array.isArray(o.items) ? o.items : []).slice(0, 30).map(cleanItem).filter(hasName);
  const create: AiCreate = {
    templateId,
    siteName: text(o.siteName, 80),
    headline: text(o.headline, 120),
    description: text(o.description, 400),
    items,
  };
  if (isHexColor(o.themeColor)) create.themeColor = o.themeColor.toUpperCase();
  if (typeof o.templateStyle === "string" && (STYLES as readonly string[]).includes(o.templateStyle)) create.templateStyle = o.templateStyle;
  return create.siteName ? create : null;
}

export function normalizeAiResult(raw: Record<string, unknown>): AiResult {
  const create = normalizeCreate(raw.create);
  return {
    reply: text(raw.reply, 600),
    // A "create" replaces the whole draft, so loose edit ops beside it are noise.
    ops: create ? [] : normalizeOps(raw.ops),
    create,
  };
}

export function sanitizeHistory(raw: unknown): Array<{ role: "user" | "bot"; text: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-6)
    .map((m) => ({ role: asObject(m)?.role === "user" ? ("user" as const) : ("bot" as const), text: text(asObject(m)?.text, 300) }))
    .filter((m) => m.text);
}

export function sanitizeDraftContext(raw: unknown): DraftContext | null {
  const o = asObject(raw);
  if (!o) return null;
  const templateId = typeof o.templateId === "string" ? o.templateId : "";
  if (!(VALID_TEMPLATES as readonly string[]).includes(templateId)) return null;
  const structure = asObject(o.structure) ?? {};
  if (JSON.stringify(structure).length > 60_000) return null;
  return {
    siteName: text(o.siteName, 120),
    templateId,
    themeColor: isHexColor(o.themeColor) ? o.themeColor : "#2563EB",
    structure,
  };
}

export function buildDashboardPrompt(params: {
  message: string;
  draft: DraftContext | null;
  history: Array<{ role: "user" | "bot"; text: string }>;
  // The person's other saved services (from the shared registry), so the model
  // knows what exists instead of guessing.
  services?: Array<{ name: string; typeLabel: string }>;
}): string {
  const { message, draft, history } = params;
  const servicesText = params.services?.length
    ? params.services.map((s) => `«${s.name}» (${s.typeLabel})`).join("، ")
    : "(لا يوجد)";
  const historyText = history.map((m) => `${m.role === "user" ? "المستخدم" : "ORxai"}: ${m.text}`).join("\n") || "(لا يوجد)";

  let state = "لا توجد بطاقة مفتوحة حالياً — المستخدم لم يبدأ خدمة بعد.";
  if (draft) {
    const { key, label } = templateCollection(draft.templateId);
    const list = Array.isArray(draft.structure[key]) ? (draft.structure[key] as Array<Record<string, unknown>>) : [];
    const rows = list.slice(0, MAX_ITEMS_SHOWN).map((it, i) => ({
      i,
      name: it.name ?? it.title ?? "",
      price: it.price ?? "",
      category: it.category ?? "",
      duration: it.duration ?? "",
      description: typeof it.description === "string" ? it.description.slice(0, 80) : "",
    }));
    state = `بطاقة الخدمة المفتوحة الآن:
- اسم النشاط: ${draft.siteName}
- القالب: ${draft.templateId} (العناصر تسمى «${label}»)
- لون الهوية: ${draft.themeColor}
- النمط: ${String(draft.structure.templateStyle ?? "modern")}
- العنوان الرئيسي: ${String(draft.structure.headline ?? "")}
- الوصف: ${String(draft.structure.description ?? "")}
- ساعات العمل: ${JSON.stringify(draft.structure.hours ?? [])}
- التواصل: ${JSON.stringify(draft.structure.contact ?? {})}
- العناصر (i = رقم العنصر): ${JSON.stringify(rows)}`;
  }

  return `أنت ORxai، مساعد ذكي داخل لوحة تحكم منصة تبني مواقع صغيرة لأصحاب الأعمال. المستخدم يعدّل بطاقة معاينة حية، وأنت تحوّل كلامه (بأي لهجة عربية) إلى عمليات دقيقة على البطاقة. لا تحفظ شيئاً بنفسك؛ المستخدم يراجع التعديل ثم يضغط «حفظ».

${state}

خدمات المستخدم المحفوظة: ${servicesText}

سياق آخر الرسائل:
${historyText}

رسالة المستخدم: "${message.replace(/"/g, "'")}"

العمليات المتاحة (ops) — استخدم أقل عدد ممكن منها:
- {"op":"set","field":"siteName|headline|description|ctaLabel","value":"..."}
- {"op":"color","hex":"#RRGGBB"}
- {"op":"style","style":"classic|modern|cinematic|app"}
- {"op":"addItem","item":{"name":"","price":"15 ر.س","duration":"","description":"","category":"اسم القسم"}}   (للمحفظة والبورتفوليو استخدم title بدل name)
- {"op":"updateItem","index":رقم i,"patch":{"name":"","price":""}}
- {"op":"removeItem","index":رقم i}
- {"op":"renameSection","from":"","to":""} / {"op":"removeSection","name":""}   (القسم = قيمة category المشتركة بين العناصر)
- {"op":"hours","hours":[{"day":"السبت - الخميس","time":"9ص - 11م"}]}
- {"op":"contact","patch":{"phone":"","whatsapp":"","email":"","address":""}}

إذا طلب المستخدم إنشاء خدمة جديدة كاملة (مثل «أبغى منيو لمطعم شاورما اسمه الشام») فأعد حقل create بدل ops:
{"templateId":"store|restaurant|services|portfolio|booking|survey|rsvp|vcard|invoice","siteName":"","headline":"","description":"","themeColor":"#RRGGBB","items":[{"name":"","price":"","category":""}]}
ولّد محتوى واقعياً مناسباً للنشاط بالعربية (٦–١٢ عنصراً موزعة على ٢–٣ أقسام عند الاقتضاء) وأسعاراً معقولة بالريال بصيغة "15 ر.س". استعمل templateId="restaurant" للمطاعم والكافيهات، و"store" للمتاجر، و"booking" للمواعيد.

قواعد:
- نفّذ فقط ما يدعمه النظام أعلاه. لا تدّعِ تنفيذ حجز تفاعلي أو دفع إلكتروني أو تسجيل دخول أو تطبيقات أو أي شيء خارج القائمة؛ اشرح ذلك بلطف في reply.
- الصور لا تُضاف من الدردشة: وجّه المستخدم إلى الضغط على مربع الصورة بجانب العنصر (يظهر مع النمطين cinematic وapp للمتاجر والمطاعم).
- للأسعار استعمل صيغة "رقم ر.س". عند «زد الأسعار» أعد updateItem لكل عنصر له سعر بالقيمة الجديدة المحسوبة.
- استعمل أرقام i الحقيقية فقط؛ لا تخترع أرقاماً. وإن كان الطلب غامضاً أو سؤالاً عاماً أو خارج القدرات فاترك ops فارغة واجعل reply إجابة قصيرة مفيدة أو سؤالاً توضيحياً واحداً.
- إذا سأل المستخدم من طوّر المنصة أو من صنعها فرد بأن يتواصل مع المطور عبر dev.ahmed2003@gmail.com.
- reply: جملة أو جملتان بالعربية تصف ما فعلته أو تجيب، بلا markdown.

أعد JSON فقط بهذا الشكل بالضبط:
{"reply":"...","ops":[],"create":null}`;
}
