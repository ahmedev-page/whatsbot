import { cleanString } from "./site-schema";

// Admin-authored announcement cards shown in the user dashboard. Everything that
// reaches the database or a user's screen goes through the functions here, so an
// admin typo (or a pasted `javascript:` link) can never become a broken or unsafe card.

export const AD_THEMES = ["blue", "navy", "emerald", "violet", "amber", "rose"] as const;
export const AD_AUDIENCES = ["all", "free", "paid"] as const;
export type AdTheme = (typeof AD_THEMES)[number];
export type AdAudience = (typeof AD_AUDIENCES)[number];

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  link_url: string | null;
  link_label: string;
  theme: AdTheme;
  audience: AdAudience;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  sort_order: number;
  views: number;
  clicks: number;
  created_at: string;
  updated_at: string;
}

export const LIMITS = { title: 80, body: 300, label: 30, url: 500 } as const;

// http(s) only: no javascript:, data:, intent: ... and no user:pass@ tricks.
export function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw || raw.length > LIMITS.url) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? cleanString(value).replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function parseDate(value: unknown): { ok: true; value: string | null } | { ok: false } {
  if (value === null || value === undefined || value === "") return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false };
  const t = Date.parse(value);
  return Number.isNaN(t) ? { ok: false } : { ok: true, value: new Date(t).toISOString() };
}

export type AnnouncementFields = Partial<
  Pick<AnnouncementRow, "title" | "body" | "image_url" | "link_url" | "link_label" | "theme" | "audience" | "starts_at" | "ends_at" | "is_active" | "sort_order">
>;

// `partial` = PATCH: only keys that are present are validated and returned.
export function normalizeAnnouncement(
  body: Record<string, unknown>,
  partial: boolean,
): { ok: true; value: AnnouncementFields } | { ok: false; error: string } {
  const out: AnnouncementFields = {};
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);

  if (!partial || has("title")) out.title = text(body.title, LIMITS.title);
  if (!partial || has("body")) out.body = text(body.body, LIMITS.body);

  if (!partial || has("image_url")) {
    const raw = body.image_url;
    if (raw === null || raw === undefined || raw === "") out.image_url = null;
    else {
      const url = safeUrl(raw);
      if (!url || !url.startsWith("https://")) return { ok: false, error: "رابط الصورة يجب أن يكون https صالحاً." };
      out.image_url = url;
    }
  }
  if (!partial || has("link_url")) {
    const raw = body.link_url;
    if (raw === null || raw === undefined || raw === "") out.link_url = null;
    else {
      const url = safeUrl(raw);
      if (!url) return { ok: false, error: "الرابط يجب أن يبدأ بـ https:// أو http://" };
      out.link_url = url;
    }
  }
  if (!partial || has("link_label")) out.link_label = text(body.link_label, LIMITS.label);

  if (!partial || has("theme")) {
    const theme = body.theme ?? "blue";
    if (typeof theme !== "string" || !(AD_THEMES as readonly string[]).includes(theme)) return { ok: false, error: "لون الإعلان غير صالح." };
    out.theme = theme as AdTheme;
  }
  if (!partial || has("audience")) {
    const audience = body.audience ?? "all";
    if (typeof audience !== "string" || !(AD_AUDIENCES as readonly string[]).includes(audience)) return { ok: false, error: "الفئة المستهدفة غير صالحة." };
    out.audience = audience as AdAudience;
  }
  if (!partial || has("starts_at")) {
    const d = parseDate(body.starts_at);
    if (!d.ok) return { ok: false, error: "تاريخ البداية غير صالح." };
    out.starts_at = d.value;
  }
  if (!partial || has("ends_at")) {
    const d = parseDate(body.ends_at);
    if (!d.ok) return { ok: false, error: "تاريخ الانتهاء غير صالح." };
    out.ends_at = d.value;
  }
  if (!partial || has("is_active")) {
    if (body.is_active !== undefined && typeof body.is_active !== "boolean") return { ok: false, error: "حالة التفعيل غير صالحة." };
    out.is_active = body.is_active === undefined ? true : (body.is_active as boolean);
  }
  if (!partial || has("sort_order")) {
    const n = body.sort_order;
    if (n !== undefined && (typeof n !== "number" || !Number.isInteger(n) || n < -1000 || n > 1000)) return { ok: false, error: "الترتيب غير صالح." };
    out.sort_order = typeof n === "number" ? n : 0;
  }

  if (out.starts_at && out.ends_at && Date.parse(out.ends_at) <= Date.parse(out.starts_at)) {
    return { ok: false, error: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية." };
  }
  // A card needs something to show — checked on create, and on edits that touch content.
  if (!partial) {
    if (!out.title && !out.body && !out.image_url) return { ok: false, error: "أضف نصاً أو صورة على الأقل." };
    if (out.link_url && !out.link_label) out.link_label = "اعرف المزيد";
  }
  return { ok: true, value: out };
}

export function isLiveNow(ad: Pick<AnnouncementRow, "is_active" | "starts_at" | "ends_at">, now = Date.now()): boolean {
  if (!ad.is_active) return false;
  if (ad.starts_at && Date.parse(ad.starts_at) > now) return false;
  if (ad.ends_at && Date.parse(ad.ends_at) <= now) return false;
  return true;
}

export function matchesAudience(audience: AdAudience, plan?: string | null): boolean {
  const paid = !!plan && plan !== "free";
  return audience === "all" || (audience === "paid" ? paid : !paid);
}

export interface PublicAnnouncement {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string;
  theme: AdTheme;
}

export function toPublicAnnouncement(ad: AnnouncementRow): PublicAnnouncement {
  return {
    id: ad.id,
    title: ad.title,
    body: ad.body,
    imageUrl: ad.image_url,
    linkUrl: ad.link_url,
    linkLabel: ad.link_label,
    theme: ad.theme,
  };
}

// What one person sees: live, for their audience, in the admin's order, capped
// so the home screen never turns into an ad wall.
export function selectForUser(rows: AnnouncementRow[], plan?: string | null, now = Date.now(), max = 5): PublicAnnouncement[] {
  return rows
    .filter((ad) => isLiveNow(ad, now) && matchesAudience(ad.audience, plan))
    .sort((a, b) => a.sort_order - b.sort_order || Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, max)
    .map(toPublicAnnouncement);
}
