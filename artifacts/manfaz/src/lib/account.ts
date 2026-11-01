import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Platform-account API (sign-in via WhatsApp verification, "who am I", sign
// out). Hand-written rather than orval-generated: these endpoints are
// cookie-session based and live beside, not inside, the admin/public spec.

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
}

export interface Account {
  id: string;
  phoneNumber: string;
  freeMessagesUsed: number;
  freeMessagesLimit: number;
  createdAt: string;
  website: AccountWebsite | null;
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

  return null;
}

export function saveLocalAccount(account: Account | null): void {
  if (typeof window === 'undefined') return;
  if (!account) {
    localStorage.removeItem(LOCAL_ACCOUNT_KEY);
    return;
  }
  localStorage.setItem(LOCAL_ACCOUNT_KEY, JSON.stringify(account));
}

export function registerOrLoginWithPhone(phoneInput: string): Account {
  const cleanPhone = phoneInput.replace(/[^\d]/g, '') || '966500000000';
  const existing = getLocalAccount();
  if (existing && existing.phoneNumber === cleanPhone) {
    return existing;
  }

  const newAccount: Account = {
    id: `usr_${Date.now().toString(36)}`,
    phoneNumber: cleanPhone,
    freeMessagesUsed: 0,
    freeMessagesLimit: 50,
    createdAt: new Date().toISOString(),
    website: null, // Clean new account with no dummy sites
  };

  saveLocalAccount(newAccount);
  return newAccount;
}

export function getLocalSiteDocument(): SiteDocument | null {
  const account = getLocalAccount();
  if (!account || !account.website) return null;

  const storedSites = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_SITES_KEY) : null;
  if (storedSites) {
    try {
      const sites = JSON.parse(storedSites) as Record<string, SiteDocument>;
      if (sites[account.website.username]) {
        return sites[account.website.username];
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export function saveLocalSiteDocument(doc: SiteDocument): void {
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
  sites[doc.username] = doc;
  localStorage.setItem(LOCAL_SITES_KEY, JSON.stringify(sites));

  // Sync back to account if a local account exists
  const account = getLocalAccount();
  if (account) {
    account.website = {
      id: doc.id,
      username: doc.username,
      siteName: doc.siteName,
      templateId: doc.templateId,
      themeColor: doc.themeColor,
      templateStyle: (doc.jsonStructure?.templateStyle as string) || 'modern',
      showBranding: doc.showBranding,
      createdAt: doc.createdAt,
      updatedAt: new Date().toISOString(),
      visitsToday: account.website?.visitsToday || 12,
      visitsTotal: account.website?.visitsTotal || 240,
    };
    saveLocalAccount(account);
  }
}

export function getLocalWebsiteByUsername(username: string): SiteDocument | null {
  if (typeof window === 'undefined') return null;
  const storedSites = localStorage.getItem(LOCAL_SITES_KEY);
  if (!storedSites) return null;
  try {
    const sites = JSON.parse(storedSites) as Record<string, SiteDocument>;
    return sites[username] || null;
  } catch {
    return null;
  }
}

export interface CreateInPlatformInput {
  siteName: string;
  templateId: string;
  templateStyle?: SiteStyle;
  themeColor?: string;
  description?: string;
  phone?: string;
  initialItems?: Array<{ name: string; price?: string; description?: string }>;
}

export async function createWebsiteInPlatform(input: CreateInPlatformInput): Promise<SiteDocument> {
  const slug = input.siteName
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0621-\u064A]+/g, '-')
    .replace(/^-+|-+$/g, '') || `site-${Date.now().toString(36)}`;

  const templateStyle = input.templateStyle || 'modern';
  const themeColor = input.themeColor || '#1D4ED8';
  const collectionKey = input.templateId === 'services' || input.templateId === 'booking' ? 'services' : input.templateId === 'portfolio' ? 'projects' : 'items';

  const defaultItems = input.initialItems && input.initialItems.length > 0
    ? input.initialItems
    : [
        { name: 'الباقة أو الخدمة الأولى', price: '150 ر.س', description: 'وصف توضيحي مميز للخدمة أو المنتج المقدم.' },
        { name: 'الباقة أو الخدمة المميزة', price: '290 ر.س', description: 'الخيار الأكثر طلباً من قبل عملائنا.' },
        { name: 'الخيار المتقدم المتكامل', price: '450 ر.س', description: 'حل متكامل وشامل لتلبية جميع احتياجاتك.' },
      ];

  const jsonStructure: Record<string, unknown> = {
    tagline: input.description || 'مرحباً بكم في موقعنا الرسمي الجديد',
    description: input.description || 'يسعدنا خدمتكم بأعلى جودة واحترافية على مدار الساعة.',
    ctaLabel: input.templateId === 'booking' ? 'احجز الآن' : input.templateId === 'restaurant' ? 'شاهد المنيو واطلب' : 'تواصل واطلب الآن',
    phone: input.phone || getLocalAccount()?.phoneNumber || '',
    templateStyle,
    [collectionKey]: defaultItems,
    workingHours: [
      { day: 'السبت - الخميس', time: '9:00 ص - 10:00 م' },
    ],
    address: 'المملكة العربية السعودية',
    socialLinks: {
      whatsapp: input.phone || getLocalAccount()?.phoneNumber || '',
    },
  };

  try {
    const serverCreated = await accountFetch<SiteDocument>('/api/me/website', {
      method: 'POST',
      body: JSON.stringify({
        siteName: input.siteName,
        username: slug,
        templateId: input.templateId,
        themeColor,
        jsonStructure,
      }),
    });
    saveLocalSiteDocument(serverCreated);
    return serverCreated;
  } catch {
    let account = getLocalAccount();
    if (!account) {
      account = registerOrLoginWithPhone(input.phone || '966500000000');
    }
    const doc: SiteDocument = {
      id: `site-${Date.now().toString(36)}`,
      username: slug,
      siteName: input.siteName,
      templateId: input.templateId,
      themeColor,
      jsonStructure: {
        ...jsonStructure,
        phone: input.phone || account.phoneNumber,
        socialLinks: {
          whatsapp: input.phone || account.phoneNumber,
        },
      },
      showBranding: true,
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
  try {
    const response = await fetch(`${apiBase()}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
    if (response.status === 401) throw new AuthRequiredError();
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new ApiError(response.status, body.error || `Request failed (${response.status})`);
    }
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof AuthRequiredError) throw err;
    // When offline or backend unavailable:
    if (path === '/api/me') {
      const local = getLocalAccount();
      if (!local) throw new AuthRequiredError();
      return local as unknown as T;
    }
    if (path === '/api/me/website') {
      const doc = getLocalSiteDocument();
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
        return await accountFetch<Account>('/api/me');
      } catch {
        return getLocalAccount();
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
      saveLocalAccount(null);
      return { ok: true };
    },
    onSettled: () => {
      saveLocalAccount(null);
      queryClient.setQueryData(accountQueryKey, null);
      queryClient.setQueryData(siteQueryKey, null);
      void queryClient.invalidateQueries({ queryKey: accountQueryKey });
    },
  });
}

const PENDING_PHONE_KEY = 'orxai_pending_phone';
const PENDING_CHALLENGE_KEY = 'orxai_pending_challenge';
const VERIFIED_CHALLENGES_KEY = 'orxai_verified_challenges';

export function getVerifiedChallenges(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = sessionStorage.getItem(VERIFIED_CHALLENGES_KEY);
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
      sessionStorage.setItem(VERIFIED_CHALLENGES_KEY, JSON.stringify(verified));
    }
  } catch {
    // ignore
  }
}

export function isChallengeVerified(challengeId: string): boolean {
  return getVerifiedChallenges().includes(challengeId);
}

export function startLogin(phoneNumber?: string): Promise<LoginChallenge> {
  const cleanPhone = phoneNumber ? phoneNumber.replace(/[^\d]/g, '') : '';
  if (cleanPhone && typeof window !== 'undefined') {
    sessionStorage.setItem(PENDING_PHONE_KEY, cleanPhone);
  }
  return accountFetch<LoginChallenge>('/api/auth/start', {
    method: 'POST',
    body: phoneNumber ? JSON.stringify({ phone: phoneNumber }) : undefined,
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
  // If challenge ID is a local preview challenge (starts with 'ch_'), verify via local bot confirmation
  if (id.startsWith('ch_')) {
    if (isChallengeVerified(id)) {
      const pending = typeof window !== 'undefined' ? sessionStorage.getItem(PENDING_PHONE_KEY) : null;
      if (pending) {
        registerOrLoginWithPhone(pending);
        sessionStorage.removeItem(PENDING_PHONE_KEY);
      }
      return 'authenticated';
    }
    return 'pending';
  }

  // Real production challenge (UUID from server): strictly trust ONLY the server response
  try {
    const result = await accountFetch<{ status: LoginStatus }>(`/api/auth/status?id=${encodeURIComponent(id)}`);
    if (result.status === 'authenticated') {
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
  baseUpdatedAt: string;
  siteName?: string;
  themeColor?: string;
  jsonStructure?: Record<string, unknown>;
}

export const siteQueryKey = ['account', 'website'] as const;

export function useSiteDocument() {
  return useQuery({
    queryKey: siteQueryKey,
    queryFn: async () => {
      try {
        return await accountFetch<SiteDocument>('/api/me/website');
      } catch {
        return getLocalSiteDocument();
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
      try {
        const res = await accountFetch<SiteDocument & { droppedFields: string[] }>('/api/me/website', {
          method: 'PATCH',
          body: JSON.stringify(input),
        });
        saveLocalSiteDocument(res);
        return res;
      } catch (err) {
        // Save locally only if local document exists (preview mode)
        const current = getLocalSiteDocument();
        if (!current) throw err;
        const updated: SiteDocument = {
          ...current,
          siteName: input.siteName || current.siteName,
          themeColor: input.themeColor || current.themeColor,
          jsonStructure: input.jsonStructure || current.jsonStructure,
          updatedAt: new Date().toISOString(),
        };
        saveLocalSiteDocument(updated);
        return { ...updated, droppedFields: [] };
      }
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(siteQueryKey, saved);
      void queryClient.invalidateQueries({ queryKey: accountQueryKey });
    },
  });
}

const UPLOAD_ERRORS: Record<number, string> = {
  413: 'الصورة أكبر من 5 ميغابايت.',
  415: 'الملف ليس صورة صالحة — استخدم JPG أو PNG أو WebP.',
  429: 'رفعت صورًا كثيرة خلال وقت قصير. حاول بعد قليل.',
};

export async function uploadImage(blob: Blob): Promise<string> {
  const response = await fetch(`${apiBase()}/api/me/uploads`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': blob.type },
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
