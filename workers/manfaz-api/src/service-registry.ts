import type { WebsiteRow } from "./types";

// One registry of "what services does this person have", used by BOTH the
// platform dashboard chat and the WhatsApp bot. Everything here is pure and
// deterministic on purpose: working out *which* service a message is about,
// whether a plan allows another one, and reading its bookings/orders needs no
// AI at all — so Gemini is only spent on actually understanding free-form edits.

export type ServiceKind = "site" | "service";

// A "site" is a public website. A "service" is a dedicated interactive
// template that collects data from visitors.
export const SITE_TEMPLATES = ["store", "restaurant", "services", "portfolio"] as const;
export const SERVICE_TEMPLATES = ["booking", "survey", "vcard", "rsvp", "invoice"] as const;

export function kindOf(templateId: string): ServiceKind {
  return (SERVICE_TEMPLATES as readonly string[]).includes(templateId) ? "service" : "site";
}

export const TYPE_LABELS: Record<string, string> = {
  store: "متجر إلكتروني",
  restaurant: "مطعم / كافيه",
  services: "شركة / مؤسسة",
  portfolio: "صفحة شخصية",
  booking: "حجز مواعيد",
  survey: "استبيان",
  vcard: "بطاقة تعريفية",
  rsvp: "دعوة وتأكيد حضور",
  invoice: "عروض أسعار",
};

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export interface PlanLimits {
  sites: number; // published websites at the same time
  perServiceType: number; // interactive services of each type
}

const UNLIMITED = 999;
export const FREE_LIMITS: PlanLimits = { sites: 1, perServiceType: 1 };

// 'free' (or a missing value, e.g. before migration 018) gets the free limits.
// Any other plan name is treated as paid and unrestricted until the product
// defines tiers.
export function limitsForPlan(plan?: string | null): PlanLimits {
  return !plan || plan === "free" ? FREE_LIMITS : { sites: UNLIMITED, perServiceType: UNLIMITED };
}

export interface ServiceRecord {
  id: string;
  username: string;
  name: string;
  templateId: string;
  kind: ServiceKind;
  typeLabel: string;
  submissions: number;
  // Paused services stay in the account but do not count against the plan.
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toServiceRecord(w: WebsiteRow): ServiceRecord {
  return {
    id: w.id,
    username: w.username,
    name: w.site_name,
    templateId: w.template_id,
    kind: kindOf(w.template_id),
    typeLabel: TYPE_LABELS[w.template_id] ?? w.template_id,
    submissions: Array.isArray(w.json_structure?.submissions) ? (w.json_structure.submissions as unknown[]).length : 0,
    published: w.is_published !== false,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

export interface PlanUsage {
  plan: string;
  sites: { used: number; max: number };
  // Keyed by template id, interactive services only.
  services: Record<string, { used: number; max: number; label: string }>;
}

export function usageFor(services: ServiceRecord[], plan?: string | null): PlanUsage {
  const limits = limitsForPlan(plan);
  const result: PlanUsage = {
    plan: plan || "free",
    sites: { used: services.filter((s) => s.kind === "site" && s.published).length, max: limits.sites },
    services: {},
  };
  for (const id of SERVICE_TEMPLATES) {
    result.services[id] = {
      used: services.filter((s) => s.templateId === id && s.published).length,
      max: limits.perServiceType,
      label: TYPE_LABELS[id],
    };
  }
  return result;
}

export type CreateCheck =
  | { ok: true }
  | { ok: false; code: "plan_limit"; message: string; existing: ServiceRecord };

// Only PUBLISHED services count: a paused one is a draft that keeps its data but
// holds no slot. Existing accounts already over the free limit are left alone —
// nothing is deleted; they simply cannot add or resume another one.
function slotCheck(services: ServiceRecord[], templateId: string, plan: string | null | undefined, verb: "create" | "publish"): CreateCheck {
  const limits = limitsForPlan(plan);
  const action = verb === "create" ? "تنشئ جديداً" : "تعيد نشر هذه الخدمة";
  if (kindOf(templateId) === "site") {
    const sites = services.filter((s) => s.kind === "site" && s.published);
    if (sites.length >= limits.sites) {
      const existing = sites[0];
      return {
        ok: false,
        code: "plan_limit",
        existing,
        message: `الخطة المجانية تسمح بموقع واحد منشور في الوقت نفسه، ولديك «${existing.name}». عدّله، أو أوقف نشره، أو احذفه لكي ${action}.`,
      };
    }
    return { ok: true };
  }
  const sameType = services.filter((s) => s.templateId === templateId && s.published);
  if (sameType.length >= limits.perServiceType) {
    const existing = sameType[0];
    return {
      ok: false,
      code: "plan_limit",
      existing,
      message: `الخطة المجانية تسمح بخدمة واحدة منشورة من كل نوع، ولديك «${existing.name}» (${existing.typeLabel}). عدّلها، أو أوقف نشرها، أو احذفها لكي ${action}.`,
    };
  }
  return { ok: true };
}

export function checkCanCreate(services: ServiceRecord[], templateId: string, plan?: string | null): CreateCheck {
  return slotCheck(services, templateId, plan, "create");
}

// Resuming a paused service needs a free slot, counting everyone else.
export function checkCanPublish(services: ServiceRecord[], target: ServiceRecord, plan?: string | null): CreateCheck {
  return slotCheck(services.filter((s) => s.id !== target.id), target.templateId, plan, "publish");
}

// ---------------------------------------------------------------------------
// Arabic matching: which service is a message about?
// ---------------------------------------------------------------------------

export function normalizeArabic(input: string): string {
  return input
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .toLowerCase();
}

// Words that appear in almost every message and say nothing about *which* service.
const STOPWORDS = new Set([
  "في", "من", "الي", "على", "عن", "مع", "هذا", "هذه", "ذلك", "كل", "لي", "لك", "ابي", "ابغي", "اريد", "ودي",
  "خدمه", "خدمتي", "موقع", "موقعي", "الخدمه", "الموقع", "صفحه", "الصفحه", "بتاعي", "حقي", "تبعي", "ما", "هل",
  "كم", "وش", "ايش", "شو", "عدل", "غير", "اضف", "اضافه", "احذف", "زد", "ازل",
]);

function tokens(text: string): string[] {
  return normalizeArabic(text)
    .split(/[^\p{L}\p{N}]+/u)
    .map((w) => (w.length > 3 && w.startsWith("ال") ? w.slice(2) : w))
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

const TYPE_KEYWORDS: Record<string, string[]> = {
  store: ["متجر", "منتجات", "متجري"],
  restaurant: ["منيو", "مطعم", "كافيه", "اطباق", "وجبات", "قهوه"],
  services: ["شركه", "مؤسسه", "خدمات"],
  portfolio: ["معرض", "اعمالي", "مشاريع", "سيره"],
  booking: ["حجز", "حجوزات", "مواعيد", "موعد"],
  survey: ["استبيان", "استطلاع", "تقييم", "ردود"],
  vcard: ["بطاقه", "كرت", "فيزيت"],
  rsvp: ["دعوه", "حضور", "ضيوف", "مدعوين", "حفل", "زفاف"],
  invoice: ["عرض سعر", "عروض اسعار", "عروض", "فاتوره", "باقات", "باقه"],
};

export interface ScoredService {
  service: ServiceRecord;
  score: number;
}

export function scoreServices(text: string, services: ServiceRecord[]): ScoredService[] {
  const norm = normalizeArabic(text);
  const words = new Set(tokens(text));
  const scored = services.map((service) => {
    let score = 0;
    // 1) The public link name is unambiguous.
    if (service.username && norm.includes(service.username.toLowerCase())) score = Math.max(score, 100);
    // 2) The service's own name.
    const nameTokens = tokens(service.name);
    if (nameTokens.length) {
      const hit = nameTokens.filter((t) => words.has(t) || norm.includes(t)).length;
      if (hit === nameTokens.length) score = Math.max(score, 90);
      else if (hit > 0) score = Math.max(score, Math.round(55 * (hit / nameTokens.length)) + 10);
    }
    // 3) Its type ("الحجز", "المنيو") — only decisive if it is the sole one of that type.
    const keywords = TYPE_KEYWORDS[service.templateId] ?? [];
    if (keywords.some((k) => norm.includes(k))) {
      const sameType = services.filter((s) => s.templateId === service.templateId).length;
      score = Math.max(score, sameType === 1 ? 60 : 30);
    }
    return { service, score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
}

export type Resolution =
  | { kind: "match"; service: ServiceRecord; score: number }
  | { kind: "ambiguous"; candidates: ServiceRecord[] }
  | { kind: "none" };

export function resolveService(text: string, services: ServiceRecord[]): Resolution {
  if (services.length === 0) return { kind: "none" };
  const ranked = scoreServices(text, services);
  if (ranked.length === 0) return { kind: "none" };
  const [top, second] = ranked;
  if (top.score >= 50 && (!second || top.score - second.score >= 15)) {
    return { kind: "match", service: top.service, score: top.score };
  }
  if (ranked.length > 1 || top.score < 50) {
    return { kind: "ambiguous", candidates: ranked.slice(0, 5).map((r) => r.service) };
  }
  return { kind: "match", service: top.service, score: top.score };
}

export type Decision =
  | { kind: "use"; service: ServiceRecord; via: "only" | "text" | "remembered"; switched: boolean }
  | { kind: "choose"; candidates: ServiceRecord[] };

// Which service does this message act on?
//  1) one service → that one;  2) the message names one → it (and remember it);
//  3) otherwise the one we were already working on;  4) otherwise ask.
export function decideService(text: string, services: ServiceRecord[], activeId?: string | null): Decision {
  if (services.length === 1) return { kind: "use", service: services[0], via: "only", switched: false };
  const resolution = resolveService(text, services);
  if (resolution.kind === "match") {
    return { kind: "use", service: resolution.service, via: "text", switched: resolution.service.id !== activeId };
  }
  const remembered = services.find((s) => s.id === activeId);
  if (remembered) return { kind: "use", service: remembered, via: "remembered", switched: false };
  return { kind: "choose", candidates: resolution.kind === "ambiguous" ? resolution.candidates : services };
}

export function wantsServiceList(text: string): boolean {
  return /^(?:خدماتي|قائمه الخدمات|قائمة الخدمات|غير الخدمه|غير الخدمة|بدل الخدمه|بدل الخدمة|اختار خدمه|اختر خدمة|اي خدمه|كل خدماتي)\s*$/i.test(normalizeArabic(text).trim()) ||
    /(?:اعرض|وريني|ورني|شوف|عرض)\s+(?:لي\s+)?(?:كل\s+)?خدماتي/.test(normalizeArabic(text));
}

// ---------------------------------------------------------------------------
// Bookings / orders / responses ("متابعة الطلبات")
// ---------------------------------------------------------------------------

export type SubmissionStatus = "new" | "confirmed" | "done" | "cancelled";
export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  new: "جديد",
  confirmed: "مؤكَّد ✅",
  done: "منجز 🎉",
  cancelled: "ملغي ❌",
};
export const isSubmissionStatus = (v: unknown): v is SubmissionStatus => typeof v === "string" && v in STATUS_LABELS;

export interface SubmissionView {
  id: string;
  status: SubmissionStatus;
  serviceId: string;
  serviceName: string;
  templateId: string;
  name: string;
  phone: string;
  summary: string;
  createdAt: string;
}

export function submissionNouns(templateId: string): { one: string; many: string } {
  switch (templateId) {
    case "booking": return { one: "حجز", many: "حجوزات" };
    case "survey": return { one: "رد", many: "ردود" };
    case "rsvp": return { one: "تأكيد حضور", many: "تأكيدات حضور" };
    case "invoice": return { one: "طلب عرض سعر", many: "طلبات عروض أسعار" };
    case "store":
    case "restaurant": return { one: "طلب", many: "طلبات" };
    default: return { one: "رسالة", many: "رسائل" };
  }
}

function str(v: unknown, max = 120): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function listSubmissions(website: WebsiteRow, limit = 10): SubmissionView[] {
  const raw = Array.isArray(website.json_structure?.submissions)
    ? (website.json_structure.submissions as Array<Record<string, unknown>>)
    : [];
  return raw.slice(0, limit).map((s) => {
    const details = s.details && typeof s.details === "object" ? Object.entries(s.details as Record<string, unknown>) : [];
    const answers = Array.isArray(s.answers) ? (s.answers as Array<Record<string, unknown>>) : [];
    const parts: string[] = [];
    for (const [k, v] of details.slice(0, 3)) if (typeof v === "string" && v) parts.push(`${k}: ${v}`);
    if (!parts.length && answers[0]) parts.push(`${str(answers[0].question, 40)}: ${str(answers[0].answer, 60)}`);
    if (typeof s.rating === "number") parts.push(`التقييم ${s.rating}/10`);
    if (!parts.length && str(s.notes)) parts.push(str(s.notes, 80));
    return {
      id: str(s.id, 64),
      status: isSubmissionStatus(s.status) ? s.status : "new",
      serviceId: website.id,
      serviceName: website.site_name,
      templateId: website.template_id,
      name: str(s.respondentName) || "بدون اسم",
      phone: str(s.respondentPhone, 40),
      summary: parts.join(" · "),
      createdAt: str(s.createdAt, 40),
    };
  });
}

export function wantsSubmissions(text: string): boolean {
  const norm = normalizeArabic(text);
  return (
    /(?:حجوزات|الحجوزات|طلبات|الطلبات|ردود|الردود|تسجيلات|التسجيلات|استفسارات|الاستفسارات|رسائل العملاء|الرسائل الوارده|اخر طلب|اخر حجز|جديد عندي|وش الجديد)/.test(norm) ||
    // singular, usually as a count question: "كم رد وصلني؟", "كم حجز اليوم"
    /كم\s+(?:رد|حجز|طلب|تسجيل|استفسار|رساله)(?![\p{L}])/u.test(norm) ||
    /(?:وصلني|وصلتني|وصلنا)\s+(?:شي|شيء|حجز|طلب|رد)/.test(norm)
  );
}

export function formatDateAr(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const minutes = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${Math.round(hours / 24)} يوم`;
}

// ---------------------------------------------------------------------------
// More deterministic bot intents (all free of AI) + small helpers
// ---------------------------------------------------------------------------

// Templates where "confirm / done / cancel" makes sense for an incoming entry.
export function supportsStatus(templateId: string): boolean {
  return ["booking", "invoice", "store", "restaurant"].includes(templateId);
}

// Customer phone → wa.me link so the owner can answer in one tap. Local Saudi
// numbers (05xxxxxxxx) become 9665xxxxxxxx.
export function waLink(phone: string): string | null {
  let digits = normalizeArabic(phone).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^05\d{8}$/.test(digits)) digits = `966${digits.slice(1)}`;
  return digits.length >= 9 && digits.length <= 15 ? `https://wa.me/${digits}` : null;
}

export function detectTemplateId(text: string): string | undefined {
  const norm = normalizeArabic(text);
  let best: { id: string; score: number } | undefined;
  for (const [id, words] of Object.entries(TYPE_KEYWORDS)) {
    const score = words.filter((w) => norm.includes(w)).length;
    if (score > 0 && (!best || score > best.score)) best = { id, score };
  }
  return best?.id;
}

// Which template types this person could still add right now.
export function creatableTypes(services: ServiceRecord[], plan?: string | null): string[] {
  return Object.keys(TYPE_LABELS).filter((id) => checkCanCreate(services, id, plan).ok);
}

const N = normalizeArabic;
export const wantsSummary = (t: string) => /(?:ملخص|تقرير|وش صار|شو صار|ماذا حدث|كيف الشغل|كيف الاعمال)/.test(N(t));
export const wantsNewService = (t: string) =>
  /(?:موقع|متجر|مطعم|استبيان|دعوه|بطاقه|حجز)\s*(?:جديد|ثاني)|خدمه\s*(?:اخري|ثانيه|تفاعليه)|(?:انشي?ئ?|اضف|ابغ[يىا]|ابي|اريد)\s+(?:لي\s+)?موقع\s+(?:جديد|ثاني)/.test(N(t));
export const wantsPause = (t: string) => /(?:اوقف|وقف|ايقاف|عطل|تعطيل|اخفي|اخف)\s*(?:ال)?(?:موقع|خدمه|نشر|موقعي|خدمتي)/.test(N(t));
export const wantsResume = (t: string) => /(?:اعد|فعل|شغل|ارجع|رجع)\s*(?:ال)?(?:نشر|موقع|خدمه|موقعي|خدمتي)|(?:انشر)\s*(?:ال)?(?:موقع|خدمه|موقعي|خدمتي)/.test(N(t));
export const wantsNotifyOff = (t: string) => /(?:اوقف|وقف|ايقاف|عطل|تعطيل|الغ|الغي)\s*(?:ال)?(?:اشعارات|تنبيهات|اشعار)/.test(N(t));
export const wantsNotifyOn = (t: string) => /(?:فعل|شغل|رجع)\s*(?:ال)?(?:اشعارات|تنبيهات|اشعار)/.test(N(t));
