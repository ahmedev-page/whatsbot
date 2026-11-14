import { safeSessionStorage } from '@/lib/safe-storage';

// Thin fetch helper for admin endpoints the generated client does not cover
// (announcements, plan changes). Same auth as the rest of the admin panel: the
// token kept in sessionStorage plus the session cookie.
export class AdminApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function adminFetch<T>(path: string, init: RequestInit & { rawBody?: Blob } = {}): Promise<T> {
  const base = (import.meta.env.VITE_API_URL as string | undefined) || '';
  const token = safeSessionStorage.getItem('manfaz-admin-token');
  const { rawBody, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${base}${path}`, {
      ...rest,
      body: rawBody ?? rest.body,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        ...(rawBody ? { 'Content-Type': rawBody.type } : rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) throw new AdminApiError(response.status, body.error || 'تعذّر تنفيذ الطلب.');
    return body as T;
  } catch (error) {
    if (controller.signal.aborted) throw new AdminApiError(504, 'انتهت مهلة الاتصال.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
