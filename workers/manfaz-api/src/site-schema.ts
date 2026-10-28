// Single source of truth for what a generated website may contain and what
// each template can actually render. Shared by the WhatsApp bot (AI edits are
// filtered through it) and the dashboard editor API (user edits are
// sanitized through it) — so the two can never disagree.

export const STYLES = ["classic", "modern", "cinematic", "app"] as const;
export type SiteStyle = (typeof STYLES)[number];

export function templateCollection(templateId: string): { key: string; label: string } {
  if (templateId === "services" || templateId === "booking") return { key: "services", label: "خدمة" };
  if (templateId === "portfolio") return { key: "projects", label: "مشروع" };
  if (templateId === "restaurant") return { key: "items", label: "طبق" };
  return { key: "items", label: "منتج" };
}

// Ground truth for whether the live templates render a photo per
// item/dish/service/project — audited against public-website.tsx.
//   store:      classic ✓  modern ✓  cinematic ✓  app ✓
//   restaurant: classic ✗  modern ✗  cinematic ✓  app ✓  (menu lists are text-only)
//   services:   classic ✗  modern ✗  cinematic ✓  app ✓
//   portfolio:  classic ✓  modern ✗  cinematic ✓  app ✓
//   booking:    single style, no per-service photos at all
export function supportsCollectionImages(templateId: string, templateStyle: string | undefined): boolean {
  const style = templateStyle || "classic";
  if (style === "cinematic" || style === "app") return true;
  if (templateId === "booking") return false;
  if (templateId === "store") return true;
  if (templateId === "portfolio") return style === "classic";
  return false;
}

export function imageSupportByStyle(templateId: string): Record<SiteStyle, boolean> {
  return Object.fromEntries(STYLES.map((style) => [style, supportsCollectionImages(templateId, style)])) as Record<SiteStyle, boolean>;
}

// Every jsonStructure key any template component actually reads (plus the
// aliases they fall back to). Anything else is dropped before it is saved, so
// an invented field can never end up persisted-but-invisible.
const GENERAL_STRUCTURE_KEYS = new Set([
  "tagline", "description", "intro", "about", "ctaLabel", "templateStyle", "darkMode", "themeColor", "accent",
  "headline", "title", "heroTitle", "rating", "eyebrow", "quote", "heroQuote", "projectsCount", "stat", "reviewsCount",
  "items", "services", "projects", "hours", "workingHours", "team", "staff", "testimonials", "reviews", "faq", "faqs",
  "products", "featuredProducts", "menu", "menuItems", "offerings", "work", "process", "steps",
  "contact", "socialLinks", "logo", "heroImage",
]);
const PORTFOLIO_ONLY_KEYS = new Set(["skills", "experience", "certifications"]);

export function filterSupportedStructureFields(
  structure: Record<string, unknown>,
  templateId: string,
): { structure: Record<string, unknown>; dropped: string[] } {
  const allowed = templateId === "portfolio" ? new Set([...GENERAL_STRUCTURE_KEYS, ...PORTFOLIO_ONLY_KEYS]) : GENERAL_STRUCTURE_KEYS;
  const result: Record<string, unknown> = {};
  const dropped: string[] = [];
  for (const [key, value] of Object.entries(structure)) {
    if (allowed.has(key)) result[key] = value;
    else dropped.push(key);
  }
  return { structure: result, dropped };
}

// --- Sanitization of user-supplied content ---------------------------------

const IMAGE_KEYS = new Set(["image", "logo", "heroImage"]);
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_STRING = 4000;
const MAX_ARRAY = 200;
const MAX_KEYS = 60;
const MAX_DEPTH = 5;
const SOCIAL_HANDLE = /^@?[\w.]{1,60}$/;
const SCHEMELESS_LINK = /^(?:www\.)?[a-z0-9-]+\.[a-z]{2,}\/\S*$/i;

export function cleanString(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, MAX_STRING);
}

export function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export interface SanitizeContext {
  // New images are only accepted under this prefix (this site's own storage folder)...
  imagePrefix: string;
  // ...but an image URL already stored on the site is kept as-is, so the first
  // dashboard save of an older site never blanks pictures that predate this
  // check (they came from the DB, not from the request).
  existingImages?: Set<string>;
}

export function collectImageUrls(value: unknown, out = new Set<string>(), key = "", depth = 0): Set<string> {
  if (depth > MAX_DEPTH + 2) return out;
  if (typeof value === "string") {
    if (IMAGE_KEYS.has(key) && value) out.add(value);
  } else if (Array.isArray(value)) {
    for (const entry of value) collectImageUrls(entry, out, key, depth + 1);
  } else if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) collectImageUrls(childValue, out, childKey, depth + 1);
  }
  return out;
}

function sanitizeValue(value: unknown, key: string, parent: string, depth: number, ctx: SanitizeContext): unknown {
  if (depth > MAX_DEPTH) return undefined;
  if (typeof value === "string") {
    const text = cleanString(value).trim();
    if (IMAGE_KEYS.has(key)) return text === "" || text.startsWith(ctx.imagePrefix) || ctx.existingImages?.has(text) ? text : "";
    if (parent === "socialLinks") {
      if (!text) return "";
      // Any scheme other than http(s) (javascript:, data:, ...) is rejected;
      // a bare handle is kept and turned into a profile URL at render time.
      if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return safeHttpUrl(text) ?? "";
      // "instagram.com/abm" without a scheme is a link, not a handle.
      if (SCHEMELESS_LINK.test(text)) return safeHttpUrl(`https://${text}`) ?? "";
      return SOCIAL_HANDLE.test(text) ? text : "";
    }
    return text;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY)
      .map((entry) => sanitizeValue(entry, key, parent, depth + 1, ctx))
      .filter((entry) => entry !== undefined);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>).slice(0, MAX_KEYS)) {
      if (FORBIDDEN_KEYS.has(childKey)) continue;
      const cleaned = sanitizeValue(childValue, childKey, key, depth + 1, ctx);
      if (cleaned !== undefined) out[childKey] = cleaned;
    }
    return out;
  }
  return undefined;
}

export function sanitizeStructure(input: Record<string, unknown>, ctx: SanitizeContext): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input).slice(0, MAX_KEYS)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    const cleaned = sanitizeValue(value, key, "", 1, ctx);
    if (cleaned !== undefined) out[key] = cleaned;
  }
  return out;
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

// --- Uploads -----------------------------------------------------------------

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const UPLOAD_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Never trust the declared Content-Type alone: check the file's magic bytes.
export function matchesImageSignature(type: string, head: Uint8Array): boolean {
  if (type === "image/jpeg") return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (type === "image/png") return head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  if (type === "image/webp") {
    const tag = (from: number) => String.fromCharCode(head[from], head[from + 1], head[from + 2], head[from + 3]);
    return tag(0) === "RIFF" && tag(8) === "WEBP";
  }
  return false;
}

// --- What the WhatsApp bot may and may not change ----------------------------
// Product-like collections, team members and images are managed from the
// dashboard (a proper editor with uploads); chat is for quick text edits,
// deleting the site and similar. Enforced in code, not just in the prompt.
export const DASHBOARD_ONLY_KEYS = [
  "items", "services", "projects", "products", "featuredProducts", "menu", "menuItems", "offerings", "work",
  "team", "staff", "logo", "heroImage",
];

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

// Splits an AI-proposed update into the part chat may apply and the part that
// must go through the dashboard. A dashboard-only key that merely repeats what
// is already stored (models often echo the whole structure) is not a change.
export function separateDashboardOnlyChanges(
  incoming: Record<string, unknown>,
  existing: Record<string, unknown>,
): { textOnly: Record<string, unknown>; redirected: string[] } {
  const textOnly: Record<string, unknown> = { ...incoming };
  const redirected: string[] = [];
  for (const key of DASHBOARD_ONLY_KEYS) {
    if (!(key in textOnly)) continue;
    if (stableStringify(textOnly[key]) !== stableStringify(existing[key])) redirected.push(key);
    delete textOnly[key];
  }
  return { textOnly, redirected };
}
