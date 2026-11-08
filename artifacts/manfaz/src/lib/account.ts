import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getConversationalServiceOption,
  resolveMultiServiceCommand,
  type MultiServiceCommandResolution,
  type PendingAssistantDisambiguation,
} from '@/lib/conversational-creator';

// Platform-account API (sign-in via WhatsApp verification, "who am I", sign
// out). Hand-written rather than orval-generated: these endpoints are
// cookie-session based and live beside, not inside, the admin/public spec.

export interface SiteSubmissionAnswer {
  question: string;
  questionType?: string;
  type?: string;
  answer: string;
}

export interface SiteSubmission {
  id: string;
  type: 'survey' | 'booking' | 'rsvp' | 'invoice' | 'order' | 'contact' | string;
  respondentName?: string;
  respondentPhone?: string;
  rating?: number;
  overallRating?: number;
  nps?: number;
  serviceName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  attending?: string;
  guests?: string;
  answers?: SiteSubmissionAnswer[];
  details?: Record<string, unknown>;
  notes?: string;
  createdAt: string;
}

export interface SubmissionInput {
  type: 'survey' | 'booking' | 'rsvp' | 'invoice' | 'order' | 'contact' | string;
  respondentName?: string;
  respondentPhone?: string;
  name?: string;
  phone?: string;
  rating?: number;
  overallRating?: number;
  nps?: number;
  serviceName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  attending?: string;
  guests?: string;
  answers?: SiteSubmissionAnswer[];
  details?: Record<string, unknown>;
  notes?: string;
}

export interface AccountWebsite {
  id: string;
  username: string;
  siteName: string;
  templateId: string;
  themeColor: string;
  templateStyle: string;
  showBranding: boolean;
  createdAt: string;
  updatedAt: string;
  visitsToday: number;
  visitsTotal: number;
  submissionsCount?: number;
}

export interface Account {
  id: string;
  phoneNumber: string;
  freeMessagesUsed: number;
  freeMessagesLimit: number;
  createdAt: string;
  website: AccountWebsite | null;
  websites?: AccountWebsite[];
}

export interface LoginChallenge {
  id: string;
  code: string;
  expiresAt: string;
  whatsappNumber: string;
}

export type LoginStatus = 'pending' | 'authenticated' | 'expired';

export class AuthRequiredError extends Error {
  constructor() {
    super('Sign in required');
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function apiBase(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) || '';
}

const LOCAL_ACCOUNT_KEY = 'orxai_workspace_account';
const LOCAL_SITES_KEY = 'orxai_workspace_sites';
const LOCAL_LATEST_SITE_KEY = 'orxai_latest_site';
const ACTIVE_SITE_USERNAME_KEY = 'orxai_active_site_username';
const SESSION_TOKEN_KEY = 'orxai_session_token';
const DEVICE_ID_KEY = 'orxai_device_id';
const TRUSTED_DEVICES_KEY = 'orxai_trusted_device_accounts';
const LAST_VERIFIED_PHONE_KEY = 'orxai_last_verified_phone';
const EXPLICIT_LOGOUT_KEY = 'orxai_explicit_logout';
const PENDING_PHONE_KEY = 'orxai_pending_phone';
const PENDING_CHALLENGE_KEY = 'orxai_pending_challenge';
const VERIFIED_CHALLENGES_KEY = 'orxai_verified_challenges';

const ARABIC_TO_LATIN: Record<string, string> = {
  ا: 'a', أ: 'a', إ: 'i', آ: 'a', ء: '',
  ب: 'b', ت: 't', ث: 'th', ج: 'j', ح: 'h', خ: 'kh',
  د: 'd', ذ: 'dh', ر: 'r', ز: 'z', س: 's', ش: 'sh',
  ص: 's', ض: 'd', ط: 't', ظ: 'z', ع: 'a', غ: 'gh',
  ف: 'f', ق: 'q', ك: 'k', ل: 'l', م: 'm', ن: 'n',
  ه: 'h', ة: 'a', و: 'w', ؤ: 'u', ي: 'y', ى: 'a', ئ: 'i',
};

export function slugifyUsername(raw: string): string {
  const transliterated = Array.from(raw.trim().toLowerCase())
    .map((ch) => (ch in ARABIC_TO_LATIN ? ARABIC_TO_LATIN[ch] : ch))
    .join('');
  return (
    transliterated
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || `site-${Date.now().toString(36)}`
  );
}

export function normalizePhoneNumber(raw: string): string {
  let cleaned = raw.replace(/[^\d]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    cleaned = '966' + cleaned.slice(1);
  } else if (cleaned.startsWith('5') && cleaned.length === 9) {
    cleaned = '966' + cleaned;
  }
  return cleaned;
}

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'srv_device';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function saveSessionToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (!token) {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    return;
  }
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

function getTrustedAccountsMap(): Record<string, Account> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(TRUSTED_DEVICES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Account>) : {};
  } catch {
    return {};
  }
}

export function saveTrustedDeviceAccount(account: Account): void {
  if (typeof window === 'undefined' || !account?.phoneNumber) return;
  const cleanPhone = normalizePhoneNumber(account.phoneNumber);
  const normalizedAccount: Account = { ...account, phoneNumber: cleanPhone };
  const map = getTrustedAccountsMap();
  map[cleanPhone] = normalizedAccount;
  localStorage.setItem(TRUSTED_DEVICES_KEY, JSON.stringify(map));
  localStorage.setItem(LAST_VERIFIED_PHONE_KEY, cleanPhone);
  localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
}

export function getLastVerifiedPhone(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_VERIFIED_PHONE_KEY);
}

export function isPhoneVerifiedOnDevice(phoneInput: string): boolean {
  if (typeof window === 'undefined') return false;
  const cleanPhone = normalizePhoneNumber(phoneInput);
  if (!cleanPhone) return false;
  const map = getTrustedAccountsMap();
  return Boolean(map[cleanPhone]);
}

export function loginWithTrustedDevice(phoneInput?: string): Account | null {
  if (typeof window === 'undefined') return null;
  const targetPhone = phoneInput ? normalizePhoneNumber(phoneInput) : getLastVerifiedPhone();
  if (!targetPhone) return null;
  const map = getTrustedAccountsMap();
  const trusted = map[targetPhone];
  if (!trusted) return null;
  localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
  saveLocalAccount(trusted);
  if (!getSessionToken()) {
    saveSessionToken(`dev_tok_${getOrCreateDeviceId()}`);
  }
  return trusted;
}

export async function loginWithTrustedDeviceServer(phoneInput?: string): Promise<Account | null> {
  const targetPhone = phoneInput ? normalizePhoneNumber(phoneInput) : getLastVerifiedPhone();
  if (!targetPhone) return null;
  const deviceId = getOrCreateDeviceId();
  try {
    const res = await accountFetch<{
      status: LoginStatus;
      sessionToken?: string;
      account?: Account;
    }>('/api/auth/device', {
      method: 'POST',
      body: JSON.stringify({ phone: targetPhone, deviceId }),
    });
    if (res.status === 'authenticated' && res.account) {
      if (res.sessionToken) {
        saveSessionToken(res.sessionToken);
      }
      saveLocalAccount(res.account);
      return res.account;
    }
  } catch {
    // Fallback to local trusted device record if offline or backend not yet deployed
  }
  return loginWithTrustedDevice(targetPhone);
}

export function getLocalAccount(): Account | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = localStorage.getItem(LOCAL_ACCOUNT_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Account;
      if (parsed && parsed.phoneNumber) {
        return parsed;
      }
    } catch {
      // ignore corrupted data
    }
  }

  // If the user has verified on this device before and did not explicitly log out,
  // automatically recognize the device and restore their session.
  if (localStorage.getItem(EXPLICIT_LOGOUT_KEY) !== '1') {
    const lastPhone = getLastVerifiedPhone();
    if (lastPhone) {
      const map = getTrustedAccountsMap();
      if (map[lastPhone]) {
        localStorage.setItem(LOCAL_ACCOUNT_KEY, JSON.stringify(map[lastPhone]));
        return map[lastPhone];
      }
    }
  }

  return null;
}

export function saveLocalAccount(account: Account | null): void {
  if (typeof window === 'undefined') return;
  if (!account) {
    localStorage.removeItem(LOCAL_ACCOUNT_KEY);
    return;
  }
  const normalized: Account = {
    ...account,
    phoneNumber: normalizePhoneNumber(account.phoneNumber) || account.phoneNumber,
  };
  localStorage.setItem(LOCAL_ACCOUNT_KEY, JSON.stringify(normalized));
  localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
  saveTrustedDeviceAccount(normalized);
}

export function registerOrLoginWithPhone(phoneInput: string): Account {
  const cleanPhone = normalizePhoneNumber(phoneInput) || '966500000000';
  const existing = getLocalAccount();
  if (existing && normalizePhoneNumber(existing.phoneNumber) === cleanPhone) {
    saveLocalAccount(existing);
    return existing;
  }

  const trustedMap = getTrustedAccountsMap();
  if (trustedMap[cleanPhone]) {
    saveLocalAccount(trustedMap[cleanPhone]);
    return trustedMap[cleanPhone];
  }

  const newAccount: Account = {
    id: `usr_${Date.now().toString(36)}`,
    phoneNumber: cleanPhone,
    freeMessagesUsed: 0,
    freeMessagesLimit: 40,
    createdAt: new Date().toISOString(),
    website: null,
  };

  saveLocalAccount(newAccount);
  return newAccount;
}

export function getActiveSiteUsername(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_SITE_USERNAME_KEY);
  } catch {
    return null;
  }
}

export function setActiveSiteUsername(username: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (username && username.trim()) {
      localStorage.setItem(ACTIVE_SITE_USERNAME_KEY, username.trim());
    } else {
      localStorage.removeItem(ACTIVE_SITE_USERNAME_KEY);
    }
  } catch {
    // ignore
  }
}

export function getAllLocalSiteDocuments(): SiteDocument[] {
  if (typeof window === 'undefined') return [];
  const storedSites = localStorage.getItem(LOCAL_SITES_KEY);
  if (!storedSites) return [];
  try {
    const sites = JSON.parse(storedSites) as Record<string, SiteDocument>;
    return Object.values(sites)
      .filter((doc): doc is SiteDocument => Boolean(doc && doc.username))
      .sort(
        (a, b) =>
          Date.parse(b.updatedAt || b.createdAt || '') -
          Date.parse(a.updatedAt || a.createdAt || '')
      );
  } catch {
    return [];
  }
}

export function toAccountWebsiteSummary(
  doc: SiteDocument,
  prev?: AccountWebsite | null
): AccountWebsite {
  const submissionsCount = Array.isArray(doc.jsonStructure?.submissions)
    ? (doc.jsonStructure.submissions as unknown[]).length
    : prev?.submissionsCount ?? 0;
  return {
    id: doc.id,
    username: doc.username,
    siteName: doc.siteName,
    templateId: doc.templateId,
    themeColor: doc.themeColor,
    templateStyle: (doc.jsonStructure?.templateStyle as string) || 'modern',
    showBranding: doc.showBranding,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt || new Date().toISOString(),
    visitsToday: prev?.visitsToday ?? 0,
    visitsTotal: prev?.visitsTotal ?? 0,
    submissionsCount,
  };
}

export function getLocalSiteDocument(targetUsername?: string | null): SiteDocument | null {
  if (typeof window === 'undefined') return null;
  const account = getLocalAccount();
  const desired = targetUsername?.trim() || getActiveSiteUsername() || '';

  const storedSites = localStorage.getItem(LOCAL_SITES_KEY);
  if (storedSites) {
    try {
      const sites = JSON.parse(storedSites) as Record<string, SiteDocument>;
      if (desired && sites[desired]) {
        return sites[desired];
      }
      if (desired) {
        const byId = Object.values(sites).find((s) => s.id === desired);
        if (byId) return byId;
      }
      if (account?.website?.username && sites[account.website.username]) {
        return sites[account.website.username];
      }
      const latestRaw = localStorage.getItem(LOCAL_LATEST_SITE_KEY);
      if (latestRaw) {
        const latest = JSON.parse(latestRaw) as SiteDocument;
        if (latest && latest.username) return sites[latest.username] || latest;
      }
      const allSites = Object.values(sites);
      if (allSites.length > 0) {
        return allSites[allSites.length - 1];
      }
    } catch {
      // ignore
    }
  }

  const latestRaw = localStorage.getItem(LOCAL_LATEST_SITE_KEY);
  if (latestRaw) {
    try {
      const latest = JSON.parse(latestRaw) as SiteDocument;
      if (latest && latest.username) return latest;
    } catch {
      // ignore
    }
  }

  return null;
}

export function saveLocalSiteDocument(doc: SiteDocument, previousUsername?: string): void {
  if (typeof window === 'undefined') return;
  const storedSites = localStorage.getItem(LOCAL_SITES_KEY);
  let sites: Record<string, SiteDocument> = {};
  if (storedSites) {
    try {
      sites = JSON.parse(storedSites);
    } catch {
      sites = {};
    }
  }
  if (previousUsername && previousUsername !== doc.username) {
    delete sites[previousUsername];
  }
  sites[doc.username] = doc;
  localStorage.setItem(LOCAL_SITES_KEY, JSON.stringify(sites));
  localStorage.setItem(LOCAL_LATEST_SITE_KEY, JSON.stringify(doc));
  localStorage.setItem(ACTIVE_SITE_USERNAME_KEY, doc.username);

  let account = getLocalAccount();
  if (!account) {
    const contactObj = doc.jsonStructure?.contact as Record<string, unknown> | undefined;
    const fallbackPhone =
      getLastVerifiedPhone() ||
      (typeof contactObj?.whatsapp === 'string' && contactObj.whatsapp) ||
      (typeof contactObj?.phone === 'string' && contactObj.phone) ||
      '966500000000';
    account = registerOrLoginWithPhone(fallbackPhone);
  }

  const existingSummaries = new Map<string, AccountWebsite>();
  for (const w of account.websites ?? []) {
    if (previousUsername && w.username === previousUsername) continue;
    existingSummaries.set(w.username, w);
  }
  if (account.website && account.website.username !== previousUsername) {
    existingSummaries.set(account.website.username, account.website);
  }

  const currentSummary = toAccountWebsiteSummary(
    doc,
    existingSummaries.get(doc.username) ??
      (previousUsername ? existingSummaries.get(previousUsername) : null)
  );
  existingSummaries.set(doc.username, currentSummary);

  for (const localDoc of Object.values(sites)) {
    if (!localDoc?.username) continue;
    existingSummaries.set(
      localDoc.username,
      toAccountWebsiteSummary(localDoc, existingSummaries.get(localDoc.username))
    );
  }

  const allSummaries = Array.from(existingSummaries.values()).sort(
    (a, b) =>
      Date.parse(b.updatedAt || b.createdAt || '') -
      Date.parse(a.updatedAt || a.createdAt || '')
  );

  account.website = currentSummary;
  account.websites = allSummaries;
  saveLocalAccount(account);
}

export function clearLocalSiteDocument(targetUsername?: string): void {
  if (typeof window === 'undefined') return;
  const account = getLocalAccount();
  const usernameToDelete =
    targetUsername?.trim() ||
    getActiveSiteUsername() ||
    account?.website?.username ||
    '';

  const storedSites = localStorage.getItem(LOCAL_SITES_KEY);
  let remainingDocs: SiteDocument[] = [];
  if (storedSites) {
    try {
      const sites = JSON.parse(storedSites) as Record<string, SiteDocument>;
      if (usernameToDelete) {
        delete sites[usernameToDelete];
      }
      localStorage.setItem(LOCAL_SITES_KEY, JSON.stringify(sites));
      remainingDocs = Object.values(sites)
        .filter((d): d is SiteDocument => Boolean(d && d.username))
        .sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || ''));
    } catch {
      // ignore
    }
  }

  if (remainingDocs.length > 0) {
    const nextActive = remainingDocs[0];
    localStorage.setItem(LOCAL_LATEST_SITE_KEY, JSON.stringify(nextActive));
    localStorage.setItem(ACTIVE_SITE_USERNAME_KEY, nextActive.username);
  } else {
    localStorage.removeItem(LOCAL_LATEST_SITE_KEY);
    localStorage.removeItem(ACTIVE_SITE_USERNAME_KEY);
  }

  if (account) {
    const nextWebsites = (account.websites ?? []).filter((w) => w.username !== usernameToDelete);
    account.websites = nextWebsites;
    account.website =
      nextWebsites[0] ?? (remainingDocs[0] ? toAccountWebsiteSummary(remainingDocs[0]) : null);
    saveLocalAccount(account);
  }
}

export function getLocalWebsiteByUsername(username: string): SiteDocument | null {
  if (typeof window === 'undefined') return null;
  const storedSites = localStorage.getItem(LOCAL_SITES_KEY);
  if (!storedSites) return null;
  try {
    const sites = JSON.parse(storedSites) as Record<string, SiteDocument>;
    if (sites[username]) return sites[username];
    const byId = Object.values(sites).find((s) => s.id === username);
    return byId || null;
  } catch {
    return null;
  }
}

export async function submitPublicWebsiteResponse(
  usernameOrPublicId: string,
  input: SubmissionInput
): Promise<SiteSubmission> {
  const normalizedName = (input.respondentName || input.name || '').trim();
  const normalizedPhone = (input.respondentPhone || input.phone || '').trim();
  const fallbackSubmission: SiteSubmission = {
    id: `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    type: input.type,
    respondentName: normalizedName,
    respondentPhone: normalizedPhone,
    ...(input.rating !== undefined ? { rating: input.rating } : {}),
    ...(input.nps !== undefined ? { nps: input.nps } : {}),
    answers: input.answers ?? [],
    details: input.details ?? {},
    notes: input.notes?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  let savedSubmission = fallbackSubmission;
  try {
    const res = await fetch(
      `${apiBase()}/api/public/websites/${encodeURIComponent(usernameOrPublicId)}/submissions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          respondentName: normalizedName,
          respondentPhone: normalizedPhone,
        }),
      }
    );
    if (res.ok) {
      const data = (await res.json()) as { submission?: SiteSubmission };
      if (data.submission) {
        savedSubmission = data.submission;
      }
    }
  } catch {
    // Fallback to local storage persistence when offline/preview
  }

  if (typeof window !== 'undefined') {
    const doc = getLocalWebsiteByUsername(usernameOrPublicId);
    if (doc) {
      const existingList = Array.isArray(doc.jsonStructure?.submissions)
        ? (doc.jsonStructure.submissions as SiteSubmission[])
        : [];
      const alreadyExists = existingList.some((s) => s.id === savedSubmission.id);
      if (!alreadyExists) {
        const updatedDoc: SiteDocument = {
          ...doc,
          jsonStructure: {
            ...doc.jsonStructure,
            submissions: [savedSubmission, ...existingList].slice(0, 200),
          },
          updatedAt: new Date().toISOString(),
        };
        saveLocalSiteDocument(updatedDoc);
      }
    }
  }

  return savedSubmission;
}

export interface InitialCollectionItemInput {
  name?: string;
  title?: string;
  price?: string;
  duration?: string;
  category?: string;
  description?: string;
  image?: string;
}

export interface CreateInPlatformInput {
  siteName: string;
  username?: string;
  templateId: string;
  templateStyle?: SiteStyle;
  themeColor?: string;
  darkMode?: boolean;
  showBranding?: boolean;
  tagline?: string;
  headline?: string;
  description?: string;
  ctaLabel?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    snapchat?: string;
    facebook?: string;
  };
  hours?: Array<{ day: string; time: string }>;
  initialItems?: InitialCollectionItemInput[];
  skills?: string[];
  steps?: Array<{ title: string; description?: string }>;
  quote?: string;
  projectsCount?: string;
}

export function getCollectionKeyForTemplate(templateId: string): 'items' | 'services' | 'projects' {
  if (templateId === 'services' || templateId === 'booking' || templateId === 'invoice') {
    return 'services';
  }
  if (templateId === 'portfolio') {
    return 'projects';
  }
  return 'items';
}

export function getDefaultCtaForTemplate(templateId: string): string {
  switch (templateId) {
    case 'booking':
      return 'احجز موعدك الآن';
    case 'restaurant':
      return 'شاهد المنيو واطلب';
    case 'portfolio':
      return 'تواصل معي';
    case 'survey':
      return 'إرسال التقييم الآن';
    case 'rsvp':
      return 'تأكيد الحضور';
    case 'invoice':
      return 'اعتماد الباقة وطلب عرض السعر';
    case 'vcard':
      return 'تواصل مباشر';
    default:
      return 'تواصل واطلب الآن';
  }
}

export const DEFAULT_SURVEY_QUESTIONS: Array<Record<string, string>> = [
  {
    name: 'ما تقييمك لمستوى جودة الخدمة والاحترافية؟',
    duration: 'rating',
    category: '5 نجوم، 4 نجوم، 3 نجوم، نجمتان، نجمة واحدة',
    description: 'اختر عدد النجوم من 1 إلى 5 حسب تجربتك الفعلية',
  },
  {
    name: 'كيف تصف سرعة الاستجابة وإنجاز الطلب؟',
    duration: 'choice',
    category: 'سريع جداً ومميز، جيد، متوسط، يحتاج إلى تحسين',
    description: 'اختر خياراً واحداً يعبّر عن تجربتك',
  },
  {
    name: 'ما الجوانب التي أعجبتك أكثر في تعاملك معنا؟ (يمكنك اختيار أكثر من إجابة)',
    duration: 'multi',
    category: 'جودة المنتجات والخدمات، وضوح الأسعار، سهولة الطلب، رقي التعامل، سرعة التوصيل/التنفيذ',
    description: 'حدد جميع النقاط التي نالت استحسانك',
  },
  {
    name: 'هل تنصح أصدقاءك أو معارفك بالتعامل معنا؟',
    duration: 'yesno',
    category: 'نعم بالتأكيد، ربما مستقبلاً، لا',
    description: 'مؤشر الثقة والتوصية',
  },
  {
    name: 'ما اقتراحك الأهم لتطوير خدماتنا في الفترة القادمة؟',
    duration: 'text',
    category: '',
    description: 'سؤال مفتوح — اكتب رأيك أو مقترحك بحرية',
  },
];

function resolveUniqueLocalSlug(rawDesired: string): string {
  const base = slugifyUsername(rawDesired);
  const existing = getLocalWebsiteByUsername(base);
  if (!existing) return base;
  return `${base.slice(0, 26)}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createWebsiteInPlatform(input: CreateInPlatformInput): Promise<SiteDocument> {
  const slug = resolveUniqueLocalSlug(input.username?.trim() || input.siteName);

  const templateStyle = input.templateStyle || 'modern';
  const themeColor = input.themeColor || '#1D4ED8';
  const collectionKey = getCollectionKeyForTemplate(input.templateId);

  const activeWhatsapp =
    input.whatsapp?.trim() ||
    input.phone?.trim() ||
    getLocalAccount()?.phoneNumber ||
    getLastVerifiedPhone() ||
    '';
  const activePhone = input.phone?.trim() || activeWhatsapp;

  let cleanItems: Array<Record<string, string>> = (input.initialItems ?? [])
    .filter((item) => (item.name && item.name.trim()) || (item.title && item.title.trim()))
    .map((item) => {
      const label = (item.name || item.title || '').trim();
      if (input.templateId === 'portfolio') {
        return {
          title: label,
          ...(item.category?.trim() ? { category: item.category.trim() } : {}),
          ...(item.description?.trim() ? { description: item.description.trim() } : {}),
          ...(item.image?.trim() ? { image: item.image.trim() } : {}),
        };
      }
      return {
        name: label,
        ...(item.price?.trim() ? { price: item.price.trim() } : {}),
        ...(item.duration?.trim() ? { duration: item.duration.trim() } : {}),
        ...(item.category?.trim() ? { category: item.category.trim() } : {}),
        ...(item.description?.trim() ? { description: item.description.trim() } : {}),
        ...(item.image?.trim() ? { image: item.image.trim() } : {}),
      };
    });

  if (input.templateId === 'survey' && cleanItems.length === 0) {
    cleanItems = DEFAULT_SURVEY_QUESTIONS;
  }

  const cleanHours = (input.hours ?? []).filter(
    (entry) => entry.day.trim() || entry.time.trim()
  );

  const contact: Record<string, string> = {};
  if (activePhone) contact.phone = activePhone;
  if (activeWhatsapp) contact.whatsapp = activeWhatsapp;
  if (input.email?.trim()) contact.email = input.email.trim();
  if (input.address?.trim()) contact.address = input.address.trim();

  const socialLinks: Record<string, string> = {};
  if (input.socialLinks?.instagram?.trim()) socialLinks.instagram = input.socialLinks.instagram.trim();
  if (input.socialLinks?.twitter?.trim()) socialLinks.twitter = input.socialLinks.twitter.trim();
  if (input.socialLinks?.tiktok?.trim()) socialLinks.tiktok = input.socialLinks.tiktok.trim();
  if (input.socialLinks?.snapchat?.trim()) socialLinks.snapchat = input.socialLinks.snapchat.trim();
  if (input.socialLinks?.facebook?.trim()) socialLinks.facebook = input.socialLinks.facebook.trim();

  const defaultCta = getDefaultCtaForTemplate(input.templateId);

  const jsonStructure: Record<string, unknown> = {
    tagline: input.tagline?.trim() || input.description?.trim() || '',
    headline: input.headline?.trim() || input.siteName.trim(),
    description: input.description?.trim() || '',
    ctaLabel: input.ctaLabel?.trim() || defaultCta,
    templateStyle,
    darkMode: input.darkMode === true || templateStyle === 'cinematic',
    contact,
    socialLinks,
    hours: cleanHours,
    [collectionKey]: cleanItems,
    ...(input.templateId === 'portfolio' && input.skills && input.skills.length > 0
      ? { skills: input.skills.filter((s) => s.trim()) }
      : {}),
    ...(input.templateId === 'portfolio' && input.quote?.trim()
      ? { quote: input.quote.trim() }
      : {}),
    ...(input.templateId === 'portfolio' && input.projectsCount?.trim()
      ? { projectsCount: input.projectsCount.trim() }
      : {}),
    ...(input.templateId === 'booking' && input.steps && input.steps.length > 0
      ? { steps: input.steps.filter((s) => s.title.trim()) }
      : {}),
  };

  try {
    const serverCreated = await accountFetch<SiteDocument>('/api/me/website', {
      method: 'POST',
      body: JSON.stringify({
        siteName: input.siteName.trim(),
        username: slug,
        templateId: input.templateId,
        themeColor,
        showBranding: input.showBranding ?? true,
        jsonStructure,
      }),
    });
    saveLocalSiteDocument(serverCreated);
    return serverCreated;
  } catch {
    let account = getLocalAccount();
    if (!account) {
      account = registerOrLoginWithPhone(activeWhatsapp || '966500000000');
    }
    const doc: SiteDocument = {
      id: `site-${Date.now().toString(36)}`,
      username: slug,
      siteName: input.siteName.trim(),
      templateId: input.templateId,
      themeColor,
      jsonStructure,
      showBranding: input.showBranding ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collectionKey,
      imageSupport: { classic: true, modern: true, cinematic: true, app: true },
    };

    saveLocalSiteDocument(doc);
    return doc;
  }
}

async function accountFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const token = getSessionToken();
  const deviceId = getOrCreateDeviceId();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
      ...(token ? { Authorization: `Bearer ${token}`, 'X-Session-Token': token } : {}),
      ...((init.headers as Record<string, string>) ?? {}),
    };

    const response = await fetch(`${apiBase()}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new ApiError(502, 'Backend API not active');
    }

    if (response.status === 401) throw new AuthRequiredError();
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new ApiError(response.status, body.error || `Request failed (${response.status})`);
    }
    const parsed = (await response.json()) as Record<string, unknown>;
    if (parsed && parsed.standalone === true) {
      throw new ApiError(502, 'Backend API in standalone mode');
    }
    return parsed as unknown as T;
  } catch (err) {
    // When offline, cross-origin cookies blocked, or backend endpoint unavailable:
    if (path === '/api/me' && method === 'GET') {
      const local = getLocalAccount();
      if (!local) throw new AuthRequiredError();
      return local as unknown as T;
    }
    if (path.startsWith('/api/me/website') && method === 'GET') {
      const qIndex = path.indexOf('?');
      const params = qIndex >= 0 ? new URLSearchParams(path.slice(qIndex + 1)) : null;
      const target = params?.get('username') || params?.get('id');
      const doc = getLocalSiteDocument(target);
      if (!doc) throw new ApiError(404, 'No site found');
      return doc as unknown as T;
    }
    throw err;
  }
}

export const accountQueryKey = ['account', 'me'] as const;

export function useAccount() {
  return useQuery({
    queryKey: accountQueryKey,
    queryFn: async () => {
      try {
        const remote = await accountFetch<Account>('/api/me');
        const local = getLocalAccount();
        const localDocs = getAllLocalSiteDocuments();
        const summaryMap = new Map<string, AccountWebsite>();
        for (const w of local?.websites ?? []) summaryMap.set(w.username, w);
        for (const d of localDocs) summaryMap.set(d.username, toAccountWebsiteSummary(d, summaryMap.get(d.username)));
        for (const w of remote.websites ?? []) summaryMap.set(w.username, w);
        if (remote.website) summaryMap.set(remote.website.username, remote.website);

        const allWebsites = Array.from(summaryMap.values()).sort(
          (a, b) =>
            Date.parse(b.updatedAt || b.createdAt || '') -
            Date.parse(a.updatedAt || a.createdAt || '')
        );
        const activeUsername = getActiveSiteUsername();
        const activeWebsite =
          (activeUsername ? summaryMap.get(activeUsername) : null) ??
          remote.website ??
          allWebsites[0] ??
          null;

        const merged: Account = {
          ...remote,
          website: activeWebsite,
          websites: allWebsites,
        };
        saveLocalAccount(merged);
        return merged;
      } catch {
        const local = getLocalAccount();
        if (!local) return null;
        const localDocs = getAllLocalSiteDocuments();
        if (localDocs.length > 0 && (!local.websites || local.websites.length < localDocs.length)) {
          local.websites = localDocs.map((d) => toAccountWebsiteSummary(d));
          local.website = local.website ?? local.websites[0] ?? null;
          saveLocalAccount(local);
        }
        return local;
      }
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await accountFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(EXPLICIT_LOGOUT_KEY, '1');
      }
      saveSessionToken(null);
      saveLocalAccount(null);
      return { ok: true };
    },
    onSettled: () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(EXPLICIT_LOGOUT_KEY, '1');
      }
      saveSessionToken(null);
      saveLocalAccount(null);
      queryClient.setQueryData(accountQueryKey, null);
      queryClient.setQueryData(siteQueryKey, null);
      void queryClient.invalidateQueries({ queryKey: accountQueryKey });
    },
  });
}

export function getVerifiedChallenges(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(VERIFIED_CHALLENGES_KEY) || sessionStorage.getItem(VERIFIED_CHALLENGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function confirmBotVerification(challengeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const verified = getVerifiedChallenges();
    if (!verified.includes(challengeId)) {
      verified.push(challengeId);
      const serialized = JSON.stringify(verified);
      sessionStorage.setItem(VERIFIED_CHALLENGES_KEY, serialized);
      localStorage.setItem(VERIFIED_CHALLENGES_KEY, serialized);
    }
  } catch {
    // ignore
  }
}

export function isChallengeVerified(challengeId: string): boolean {
  return getVerifiedChallenges().includes(challengeId);
}

export function startLogin(phoneNumber?: string): Promise<LoginChallenge> {
  const cleanPhone = phoneNumber ? normalizePhoneNumber(phoneNumber) : '';
  const deviceId = getOrCreateDeviceId();
  if (cleanPhone && typeof window !== 'undefined') {
    sessionStorage.setItem(PENDING_PHONE_KEY, cleanPhone);
    localStorage.setItem(PENDING_PHONE_KEY, cleanPhone);
  }
  return accountFetch<LoginChallenge>('/api/auth/start', {
    method: 'POST',
    body: JSON.stringify({
      ...(cleanPhone ? { phone: cleanPhone } : {}),
      deviceId,
    }),
  }).catch(() => {
    // Fallback local challenge only when backend API is unconfigured (preview mode)
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const randChars = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    const challenge: LoginChallenge = {
      id: `ch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      code: `ORX-${randChars}`,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      whatsappNumber: '966500000000',
    };
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(PENDING_CHALLENGE_KEY, JSON.stringify(challenge));
    }
    return challenge;
  });
}

export async function pollLogin(id: string): Promise<LoginStatus> {
  const resolvePendingPhone = (): string => {
    if (typeof window === 'undefined') return '966500000000';
    return (
      sessionStorage.getItem(PENDING_PHONE_KEY) ||
      localStorage.getItem(PENDING_PHONE_KEY) ||
      getLastVerifiedPhone() ||
      getLocalAccount()?.phoneNumber ||
      '966500000000'
    );
  };

  // If challenge ID is a local preview challenge (starts with 'ch_'), verify via local bot confirmation
  if (id.startsWith('ch_')) {
    if (isChallengeVerified(id)) {
      const pendingPhone = resolvePendingPhone();
      const account = registerOrLoginWithPhone(pendingPhone);
      saveTrustedDeviceAccount(account);
      if (!getSessionToken()) {
        saveSessionToken(`dev_tok_${getOrCreateDeviceId()}`);
      }
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(PENDING_PHONE_KEY);
      }
      return 'authenticated';
    }
    return 'pending';
  }

  // Real production challenge (UUID from server)
  try {
    const result = await accountFetch<{
      status: LoginStatus;
      sessionToken?: string;
      account?: Account;
    }>(`/api/auth/status?id=${encodeURIComponent(id)}`);

    if (result.status === 'authenticated') {
      if (result.sessionToken) {
        saveSessionToken(result.sessionToken);
      } else if (!getSessionToken()) {
        saveSessionToken(`dev_tok_${getOrCreateDeviceId()}`);
      }

      if (result.account && result.account.phoneNumber) {
        const existingLocal = getLocalAccount();
        const merged: Account = {
          ...result.account,
          website: result.account.website ?? existingLocal?.website ?? null,
        };
        saveLocalAccount(merged);
      } else {
        const pendingPhone = resolvePendingPhone();
        const acct = registerOrLoginWithPhone(pendingPhone);
        saveTrustedDeviceAccount(acct);
      }

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(PENDING_PHONE_KEY);
      }
      return 'authenticated';
    }
    return result.status;
  } catch {
    return 'pending';
  }
}

// wa.me deep link with the code pre-filled, so the person only taps "send".
export function whatsappLoginUrl(number: string, code: string): string | null {
  const digits = number.replace(/[^\d]/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(`تسجيل الدخول ${code}`)}`;
}

export function siteUrl(username: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${window.location.origin}${base}/${username}`;
}

// --- Website editor ------------------------------------------------------------

export type SiteStyle = 'classic' | 'modern' | 'cinematic' | 'app';

export interface SiteDocument {
  id: string;
  username: string;
  siteName: string;
  templateId: string;
  themeColor: string;
  jsonStructure: Record<string, unknown>;
  showBranding: boolean;
  createdAt: string;
  updatedAt: string;
  collectionKey: string;
  // Whether each style renders a photo per item — decided by the server, the
  // single source of truth for what the templates can display.
  imageSupport: Record<SiteStyle, boolean>;
}

export interface SaveSiteInput {
  id?: string;
  baseUpdatedAt: string;
  username?: string;
  siteName?: string;
  templateId?: string;
  themeColor?: string;
  showBranding?: boolean;
  jsonStructure?: Record<string, unknown>;
}

export const siteQueryKey = ['account', 'website'] as const;

export function useSiteDocument(targetUsername?: string | null) {
  const activeUsername = targetUsername || getActiveSiteUsername() || '';
  return useQuery({
    queryKey: [...siteQueryKey, activeUsername] as const,
    queryFn: async () => {
      const querySuffix = activeUsername ? `?username=${encodeURIComponent(activeUsername)}` : '';
      try {
        const remote = await accountFetch<SiteDocument>(`/api/me/website${querySuffix}`);
        saveLocalSiteDocument(remote);
        return remote;
      } catch {
        return getLocalSiteDocument(activeUsername);
      }
    },
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useSaveSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveSiteInput) => {
      const current =
        (input.username ? getLocalSiteDocument(input.username) : null) ||
        (input.id ? getLocalSiteDocument(input.id) : null) ||
        getLocalSiteDocument();
      try {
        const res = await accountFetch<SiteDocument & { droppedFields: string[] }>('/api/me/website', {
          method: 'PATCH',
          body: JSON.stringify({
            ...input,
            id: input.id || current?.id,
          }),
        });
        saveLocalSiteDocument(res, current?.username);
        return res;
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) throw err;
        // Save locally when backend endpoint is unavailable
        if (!current) throw err;
        const nextTemplate = input.templateId || current.templateId;
        const nextCollectionKey = getCollectionKeyForTemplate(nextTemplate);
        const nextUsername = input.username?.trim()
          ? slugifyUsername(input.username)
          : current.username;
        const updated: SiteDocument = {
          ...current,
          username: nextUsername,
          siteName: input.siteName || current.siteName,
          templateId: nextTemplate,
          collectionKey: nextCollectionKey,
          themeColor: input.themeColor || current.themeColor,
          showBranding:
            typeof input.showBranding === 'boolean' ? input.showBranding : current.showBranding,
          jsonStructure: input.jsonStructure || current.jsonStructure,
          updatedAt: new Date().toISOString(),
        };
        saveLocalSiteDocument(updated, current.username);
        return { ...updated, droppedFields: [] };
      }
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(siteQueryKey, saved);
      queryClient.setQueryData([...siteQueryKey, saved.username], saved);
      const updatedAccount = getLocalAccount();
      if (updatedAccount) {
        queryClient.setQueryData(accountQueryKey, updatedAccount);
      }
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetUsernameOrId?: string) => {
      const current = getLocalSiteDocument(targetUsernameOrId);
      const target = targetUsernameOrId || current?.username || '';
      try {
        const suffix = target ? `?username=${encodeURIComponent(target)}` : '';
        await accountFetch<{ deleted: boolean }>(`/api/me/website${suffix}`, { method: 'DELETE' });
      } catch {
        // Proceed with local cleanup if backend unavailable
      }
      clearLocalSiteDocument(current?.username || target);
      return { deleted: true };
    },
    onSuccess: () => {
      const nextDoc = getLocalSiteDocument();
      queryClient.setQueryData(siteQueryKey, nextDoc);
      const updatedAccount = getLocalAccount();
      if (updatedAccount) {
        queryClient.setQueryData(accountQueryKey, updatedAccount);
      }
      void queryClient.invalidateQueries({ queryKey: accountQueryKey });
      void queryClient.invalidateQueries({ queryKey: siteQueryKey });
    },
  });
}

export interface AccountConversationMessage {
  id: number;
  direction: 'inbound' | 'outbound';
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const accountMessagesQueryKey = ['account', 'messages'] as const;

export function useAccountMessages() {
  return useQuery({
    queryKey: accountMessagesQueryKey,
    queryFn: async () => {
      try {
        const res = await accountFetch<{ messages: AccountConversationMessage[] }>('/api/me/messages');
        return res.messages;
      } catch {
        return [] as AccountConversationMessage[];
      }
    },
    retry: false,
    staleTime: 15_000,
  });
}

export function applyAssistantResolutionToLocalSite(
  targetUsername: string,
  resolution: MultiServiceCommandResolution
): { reply: string; website: SiteDocument | null } {
  const account = getLocalAccount();
  const doc = getLocalSiteDocument(targetUsername);
  if (!doc) {
    return { reply: resolution.botReply, website: null };
  }

  const serviceOpt = getConversationalServiceOption(doc.templateId);
  const serviceBadge = `«${doc.siteName}» (${serviceOpt.shortLabel})`;
  let updatedDoc: SiteDocument = doc;
  let reply = resolution.botReply;

  if (resolution.intent === 'change_hours' && resolution.extractedValue) {
    const nextHours = [{ day: 'أوقات العمل', time: resolution.extractedValue }];
    updatedDoc = {
      ...doc,
      jsonStructure: { ...doc.jsonStructure, hours: nextHours },
      updatedAt: new Date().toISOString(),
    };
    saveLocalSiteDocument(updatedDoc);
    reply = `⏰ تم تحديث أوقات العمل لخدمة ${serviceBadge} بنجاح إلى: ${resolution.extractedValue}`;
  } else if (resolution.intent === 'add_item' && resolution.extractedItem?.name) {
    const colKey = doc.collectionKey || getCollectionKeyForTemplate(doc.templateId);
    const existingList = Array.isArray(doc.jsonStructure?.[colKey])
      ? [...(doc.jsonStructure[colKey] as Array<Record<string, unknown>>)]
      : [];
    const itemName = resolution.extractedItem.name.trim();
    const itemPrice = resolution.extractedItem.price?.trim() || '';
    const newItem: Record<string, unknown> =
      doc.templateId === 'portfolio'
        ? { title: itemName, description: '' }
        : {
            name: itemName,
            ...(itemPrice ? { price: itemPrice } : {}),
            ...(doc.templateId === 'survey' ? { duration: 'rating' } : {}),
            description: '',
          };
    existingList.push(newItem);
    updatedDoc = {
      ...doc,
      jsonStructure: { ...doc.jsonStructure, [colKey]: existingList },
      updatedAt: new Date().toISOString(),
    };
    saveLocalSiteDocument(updatedDoc);
    reply = `✅ تم حفظ «${itemName}»${itemPrice ? ` (${itemPrice})` : ''} في خدمة ${serviceBadge} بنجاح!`;
  } else if (resolution.intent === 'update_description' && resolution.extractedValue) {
    const newDesc = resolution.extractedValue.trim();
    updatedDoc = {
      ...doc,
      jsonStructure: {
        ...doc.jsonStructure,
        description: newDesc,
        tagline: newDesc.slice(0, 120),
      },
      updatedAt: new Date().toISOString(),
    };
    saveLocalSiteDocument(updatedDoc);
    reply = `✨ تم تحديث الوصف والنبذة لخدمة ${serviceBadge} بنجاح.`;
  } else if (
    resolution.intent === 'change_color' &&
    (resolution.extractedColor || typeof resolution.extractedDarkMode === 'boolean')
  ) {
    updatedDoc = {
      ...doc,
      themeColor: resolution.extractedColor || doc.themeColor,
      jsonStructure: {
        ...doc.jsonStructure,
        ...(typeof resolution.extractedDarkMode === 'boolean'
          ? { darkMode: resolution.extractedDarkMode }
          : {}),
      },
      updatedAt: new Date().toISOString(),
    };
    saveLocalSiteDocument(updatedDoc);
  } else if (resolution.intent === 'change_template' && resolution.extractedStyle) {
    updatedDoc = {
      ...doc,
      jsonStructure: {
        ...doc.jsonStructure,
        templateStyle: resolution.extractedStyle,
        ...(resolution.extractedStyle === 'cinematic' ? { darkMode: true } : {}),
      },
      updatedAt: new Date().toISOString(),
    };
    saveLocalSiteDocument(updatedDoc);
  } else if (resolution.intent === 'change_contact' && resolution.extractedValue) {
    const prevContact = (doc.jsonStructure?.contact as Record<string, unknown>) || {};
    updatedDoc = {
      ...doc,
      jsonStructure: {
        ...doc.jsonStructure,
        contact: {
          ...prevContact,
          phone: resolution.extractedValue,
          whatsapp: resolution.extractedValue,
        },
      },
      updatedAt: new Date().toISOString(),
    };
    saveLocalSiteDocument(updatedDoc);
  } else if (resolution.intent === 'query_stats') {
    const colKey = doc.collectionKey || getCollectionKeyForTemplate(doc.templateId);
    const listCount = Array.isArray(doc.jsonStructure?.[colKey])
      ? (doc.jsonStructure[colKey] as unknown[]).length
      : 0;
    const subsCount = Array.isArray(doc.jsonStructure?.submissions)
      ? (doc.jsonStructure.submissions as unknown[]).length
      : 0;
    const siteSummary = account?.websites?.find((w) => w.username === doc.username);
    const today = siteSummary?.visitsToday ?? 0;
    const total = siteSummary?.visitsTotal ?? 0;
    const remaining = Math.max(
      0,
      (account?.freeMessagesLimit ?? 40) - (account?.freeMessagesUsed ?? 0)
    );
    reply = `📊 إحصائيات خدمة ${serviceBadge}:\n• زيارات اليوم: ${today} زيارة\n• إجمالي الزيارات الكلي: ${total} زيارة\n• عدد العناصر المنشورة: ${listCount}\n• الردود والطلبات المسجلة: ${subsCount}\n• الرصيد المتبقي من رسائل المساعد: ${remaining} رسالة.`;
  }

  return { reply, website: updatedDoc };
}

export interface SendAssistantCommandInput {
  message: string;
  targetUsername?: string;
  pendingContext?: PendingAssistantDisambiguation;
}

export function useSendAssistantCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: string | SendAssistantCommandInput) => {
      const message = typeof input === 'string' ? input : input.message;
      const explicitTargetUsername = typeof input === 'string' ? undefined : input.targetUsername;
      const pendingContext = typeof input === 'string' ? undefined : input.pendingContext;

      const account = getLocalAccount();
      const allLocalDocs = getAllLocalSiteDocuments();
      const allServices =
        account?.websites && account.websites.length > 0
          ? account.websites
          : allLocalDocs.map((d) => toAccountWebsiteSummary(d));

      // If user has multiple services and no explicit targetUsername was locked in,
      // resolve target service or trigger disambiguation before modifying anything!
      const candidatePool = explicitTargetUsername
        ? allServices.filter((s) => s.username === explicitTargetUsername)
        : allServices;

      const resolution = resolveMultiServiceCommand(
        message,
        candidatePool.length > 0 ? candidatePool : allServices,
        pendingContext
      );

      if (
        resolution.status === 'needs_disambiguation' ||
        resolution.status === 'create_new_service' ||
        resolution.status === 'no_services' ||
        resolution.status === 'not_found'
      ) {
        return {
          reply: resolution.botReply,
          message: null,
          website: null,
          resolution,
        };
      }

      const resolvedUsername =
        resolution.targetService?.username || explicitTargetUsername || allServices[0]?.username;

      try {
        const res = await accountFetch<{
          reply: string;
          message: AccountConversationMessage | null;
          website: SiteDocument | null;
        }>('/api/me/assistant', {
          method: 'POST',
          body: JSON.stringify({
            message,
            ...(resolvedUsername ? { username: resolvedUsername } : {}),
          }),
        });
        if (res.website) {
          saveLocalSiteDocument(res.website);
        }
        return { ...res, resolution };
      } catch {
        if (!resolvedUsername) {
          return {
            reply: resolution.botReply,
            message: null,
            website: null,
            resolution,
          };
        }
        const applied = applyAssistantResolutionToLocalSite(resolvedUsername, resolution);
        return {
          reply: applied.reply,
          message: null,
          website: applied.website,
          resolution,
        };
      }
    },
    onSuccess: (res) => {
      if (res.website) {
        queryClient.setQueryData(siteQueryKey, res.website);
        queryClient.setQueryData([...siteQueryKey, res.website.username], res.website);
        const updatedAccount = getLocalAccount();
        if (updatedAccount) {
          queryClient.setQueryData(accountQueryKey, updatedAccount);
        }
      }
      void queryClient.invalidateQueries({ queryKey: accountMessagesQueryKey });
    },
  });
}

const UPLOAD_ERRORS: Record<number, string> = {
  413: 'الصورة أكبر من 5 ميغابايت.',
  415: 'الملف ليس صورة صالحة — استخدم JPG أو PNG أو WebP.',
  429: 'رفعت صورًا كثيرة خلال وقت قصير. حاول بعد قليل.',
};

export async function uploadImage(blob: Blob): Promise<string> {
  const token = getSessionToken();
  const response = await fetch(`${apiBase()}/api/me/uploads`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': blob.type,
      ...(token ? { Authorization: `Bearer ${token}`, 'X-Session-Token': token } : {}),
    },
    body: blob,
  });
  if (response.status === 401) throw new AuthRequiredError();
  const body = (await response.json().catch(() => ({}))) as { url?: string };
  if (!response.ok || !body.url) throw new ApiError(response.status, UPLOAD_ERRORS[response.status] ?? 'تعذّر رفع الصورة. حاول مرة أخرى.');
  return body.url;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// Resizes before upload (longest side 1600px, WebP): phone photos are often
// 4-8 MB, and a site full of them is slow for every visitor. Transparent PNGs
// (logos) stay transparent because WebP keeps the alpha channel.
export async function compressImage(file: File, maxSide = 1600, quality = 0.84): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new ApiError(415, UPLOAD_ERRORS[415]);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new ApiError(415, UPLOAD_ERRORS[415]);
    }
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (webp && webp.type === 'image/webp' && webp.size > 0 && (webp.size < file.size || scale < 1)) return webp;
  if (file.size <= MAX_UPLOAD_BYTES) return file;
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (jpeg && jpeg.size <= MAX_UPLOAD_BYTES) return jpeg;
  throw new ApiError(413, UPLOAD_ERRORS[413]);
}
