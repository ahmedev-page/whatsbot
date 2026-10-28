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

async function accountFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
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
}

export const accountQueryKey = ['account', 'me'] as const;

export function useAccount() {
  return useQuery({
    queryKey: accountQueryKey,
    queryFn: () => accountFetch<Account>('/api/me'),
    retry: false,
    staleTime: 30_000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => accountFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
    onSettled: () => queryClient.removeQueries({ queryKey: accountQueryKey }),
  });
}

export function startLogin(): Promise<LoginChallenge> {
  return accountFetch<LoginChallenge>('/api/auth/start', { method: 'POST' });
}

export async function pollLogin(id: string): Promise<LoginStatus> {
  const result = await accountFetch<{ status: LoginStatus }>(`/api/auth/status?id=${encodeURIComponent(id)}`);
  return result.status;
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
    queryFn: () => accountFetch<SiteDocument>('/api/me/website'),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useSaveSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveSiteInput) =>
      accountFetch<SiteDocument & { droppedFields: string[] }>('/api/me/website', { method: 'PATCH', body: JSON.stringify(input) }),
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
