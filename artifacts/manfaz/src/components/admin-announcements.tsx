import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, ImagePlus, Loader2, MousePointerClick, Pencil, Plus, Trash2, X } from 'lucide-react';
import { AD_THEMES, AdCard } from '@/components/dash/ad-carousel';
import { compressImage, type Announcement } from '@/lib/account';
import { adminFetch } from '@/lib/admin-api';

// Admin → Announcements. Everything shown on users' home screens is designed here
// with a live preview that uses the very same <AdCard> the users see.

interface AdminAd {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  link_url: string | null;
  link_label: string;
  theme: Announcement['theme'];
  audience: 'all' | 'free' | 'paid';
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  sort_order: number;
  views: number;
  clicks: number;
  created_at: string;
}

interface FormState {
  title: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
  theme: Announcement['theme'];
  audience: AdminAd['audience'];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const AUDIENCES: Array<{ id: AdminAd['audience']; label: string }> = [
  { id: 'all', label: 'كل المستخدمين' },
  { id: 'free', label: 'الخطة المجانية فقط' },
  { id: 'paid', label: 'الخطط المدفوعة فقط' },
];

const EMPTY: FormState = {
  title: '', body: '', imageUrl: '', linkUrl: '', linkLabel: '', theme: 'blue', audience: 'all', startsAt: '', endsAt: '', isActive: true,
};

// <input type="datetime-local"> works in local time; the API stores ISO.
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

function statusOf(ad: AdminAd): { label: string; color: string; bg: string } {
  const now = Date.now();
  if (!ad.is_active) return { label: 'متوقف', color: '#64748B', bg: '#F1F5F9' };
  if (ad.starts_at && Date.parse(ad.starts_at) > now) return { label: 'مجدول', color: '#1D4ED8', bg: '#EFF6FF' };
  if (ad.ends_at && Date.parse(ad.ends_at) <= now) return { label: 'منتهٍ', color: '#9A3412', bg: '#FFF7ED' };
  return { label: 'ظاهر الآن', color: '#15803D', bg: '#E7F8EE' };
}

function toForm(ad: AdminAd): FormState {
  return {
    title: ad.title, body: ad.body, imageUrl: ad.image_url ?? '', linkUrl: ad.link_url ?? '', linkLabel: ad.link_label,
    theme: ad.theme, audience: ad.audience, startsAt: toLocalInput(ad.starts_at), endsAt: toLocalInput(ad.ends_at), isActive: ad.is_active,
  };
}

const toPayload = (f: FormState) => ({
  title: f.title.trim(),
  body: f.body.trim(),
  image_url: f.imageUrl.trim() || null,
  link_url: f.linkUrl.trim() || null,
  link_label: f.linkLabel.trim(),
  theme: f.theme,
  audience: f.audience,
  starts_at: fromLocalInput(f.startsAt),
  ends_at: fromLocalInput(f.endsAt),
  is_active: f.isActive,
});

const field = 'w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#2563EB]';

function Editor({ initial, onClose, onSaved }: { initial: AdminAd | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(initial ? toForm(initial) : EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const blob = await compressImage(file);
      const { url } = await adminFetch<{ url: string }>('/api/admin/announcements/image', { method: 'POST', rawBody: blob });
      set('imageUrl', url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر رفع الصورة.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await adminFetch(initial ? `/api/admin/announcements/${initial.id}` : '/api/admin/announcements', {
        method: initial ? 'PATCH' : 'POST',
        body: JSON.stringify(toPayload(form)),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر الحفظ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" role="dialog" aria-modal="true" aria-label="تحرير الإعلان" onClick={onClose}>
      <div className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" dir="rtl" onClick={(e) => e.stopPropagation()} style={{ color: '#0F172A' }}>
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="text-base font-black">{initial ? 'تعديل الإعلان' : 'إعلان جديد'}</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="grid size-9 place-items-center rounded-xl hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 md:grid-cols-[1fr_340px]">
          <div className="space-y-3.5">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">العنوان ({form.title.length}/80)</span>
              <input className={field} maxLength={80} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثال: خصم 30% على الباقات" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">النص ({form.body.length}/300)</span>
              <textarea className={`${field} min-h-[84px] resize-y`} maxLength={300} value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="جملة أو جملتان تشرحان العرض" />
            </label>

            <div>
              <span className="mb-1 block text-xs font-bold text-slate-500">الصورة (اختيارية — يفضَّل 1200×600)</span>
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-3.5 text-sm font-bold hover:bg-slate-50 disabled:opacity-60">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                  {form.imageUrl ? 'استبدال الصورة' : 'رفع صورة'}
                </button>
                {form.imageUrl && (
                  <>
                    <img src={form.imageUrl} alt="" className="h-10 w-16 rounded-lg border object-cover" />
                    <button type="button" onClick={() => set('imageUrl', '')} className="text-xs font-bold text-rose-600">إزالة</button>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
            </div>

            <div className="grid grid-cols-[1fr_150px] gap-2.5">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-500">الرابط (اختياري)</span>
                <input dir="ltr" className={field} value={form.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} placeholder="https://..." />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-500">نص الزر</span>
                <input className={field} maxLength={30} value={form.linkLabel} onChange={(e) => set('linkLabel', e.target.value)} placeholder="اعرف المزيد" disabled={!form.linkUrl} />
              </label>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-bold text-slate-500">اللون</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="لون الإعلان">
                {(Object.keys(AD_THEMES) as Array<Announcement['theme']>).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={form.theme === t}
                    onClick={() => set('theme', t)}
                    className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold"
                    style={{ borderColor: form.theme === t ? AD_THEMES[t].swatch : '#E2E8F0', backgroundColor: form.theme === t ? '#F8FAFF' : '#fff' }}
                  >
                    <span className="size-4 rounded-full" style={{ backgroundColor: AD_THEMES[t].swatch }} />
                    {AD_THEMES[t].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-500">الفئة المستهدفة</span>
                <select className={field} value={form.audience} onChange={(e) => set('audience', e.target.value as FormState['audience'])}>
                  {AUDIENCES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-500">يبدأ في</span>
                <input type="datetime-local" className={field} value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-500">ينتهي في</span>
                <input type="datetime-local" className={field} value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
              </label>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold">
              <input type="checkbox" className="size-4 accent-[#2563EB]" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
              مفعّل (يظهر للمستخدمين ضمن الجدولة)
            </label>
          </div>

          <aside className="space-y-2.5 md:sticky md:top-0 md:self-start">
            <p className="text-xs font-bold text-slate-500">معاينة كما سيراها المستخدم</p>
            <div className="mx-auto w-full max-w-[340px] rounded-3xl bg-[#F4F7FD] p-3">
              {form.title || form.body || form.imageUrl ? (
                <AdCard preview ad={{ title: form.title, body: form.body, imageUrl: form.imageUrl || null, linkUrl: form.linkUrl || null, linkLabel: form.linkLabel, theme: form.theme }} />
              ) : (
                <p className="grid min-h-[172px] place-items-center text-center text-xs font-semibold text-slate-400">أضف نصاً أو صورة لتظهر المعاينة</p>
              )}
            </div>
          </aside>
        </div>
        <div className="flex items-center gap-3 border-t px-5 py-3.5">
          {error && <p role="alert" className="flex-1 text-xs font-bold text-rose-600">{error}</p>}
          <div className="ms-auto flex gap-2">
            <button type="button" onClick={onClose} className="h-11 rounded-xl border bg-white px-5 text-sm font-bold hover:bg-slate-50">إلغاء</button>
            <button type="button" onClick={() => void save()} disabled={saving || uploading} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-6 text-sm font-extrabold text-white disabled:opacity-60">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {initial ? 'حفظ التعديلات' : 'نشر الإعلان'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnnouncementsPanel() {
  const [ads, setAds] = useState<AdminAd[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminAd | 'new' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setAds(await adminFetch<AdminAd[]>('/api/admin/announcements'));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل الإعلانات.');
      setAds((prev) => prev ?? []);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    try {
      await adminFetch(`/api/admin/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر الحفظ.');
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (!ads) return;
    const target = index + direction;
    if (target < 0 || target >= ads.length) return;
    const order = [...ads];
    [order[index], order[target]] = [order[target], order[index]];
    try {
      // Re-number so two cards never share a position.
      await Promise.all(order.map((ad, i) => (ad.sort_order !== i * 10 ? adminFetch(`/api/admin/announcements/${ad.id}`, { method: 'PATCH', body: JSON.stringify({ sort_order: i * 10 }) }) : null)));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر إعادة الترتيب.');
    }
  };

  const remove = async (id: string) => {
    try {
      await adminFetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر الحذف.');
    }
  };

  return (
    <section className="space-y-4" aria-label="الإعلانات">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">الإعلانات</h2>
          <p className="text-xs font-semibold text-slate-500">بطاقات متحركة تظهر في الصفحة الرئيسية لكل مستخدم: نص أو صورة أو رابط أو كلها معاً.</p>
        </div>
        <button type="button" onClick={() => setEditing('new')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-5 text-sm font-extrabold text-white">
          <Plus size={17} />
          إعلان جديد
        </button>
      </div>

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
      {ads === null && <p className="py-10 text-center text-sm font-semibold text-slate-500">جارٍ التحميل…</p>}
      {ads?.length === 0 && !error && (
        <p className="rounded-2xl border border-dashed px-4 py-12 text-center text-sm font-semibold text-slate-500">لا توجد إعلانات بعد. أنشئ أول إعلان ليظهر للمستخدمين.</p>
      )}

      <ul className="grid gap-4 lg:grid-cols-2">
        {ads?.map((ad, i) => {
          const st = statusOf(ad);
          const ctr = ad.views ? Math.round((ad.clicks / ad.views) * 100) : 0;
          return (
            <li key={ad.id} className="space-y-3 rounded-2xl border bg-white p-3.5" style={{ color: '#0F172A' }}>
              <div className="rounded-2xl bg-[#F4F7FD] p-2.5">
                <AdCard preview ad={{ title: ad.title, body: ad.body, imageUrl: ad.image_url, linkUrl: ad.link_url, linkLabel: ad.link_label, theme: ad.theme }} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold">
                <span className="rounded-full px-2.5 py-1" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{AUDIENCES.find((a) => a.id === ad.audience)?.label}</span>
                {(ad.starts_at || ad.ends_at) && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                    {ad.starts_at ? new Date(ad.starts_at).toLocaleDateString('ar-SA') : '—'} ← {ad.ends_at ? new Date(ad.ends_at).toLocaleDateString('ar-SA') : '—'}
                  </span>
                )}
                <span className="ms-auto inline-flex items-center gap-3 text-slate-500">
                  <span className="inline-flex items-center gap-1"><Eye size={13} />{ad.views}</span>
                  <span className="inline-flex items-center gap-1"><MousePointerClick size={13} />{ad.clicks}{ad.views ? ` (${ctr}%)` : ''}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold">
                  <input type="checkbox" className="size-4 accent-[#2563EB]" checked={ad.is_active} onChange={(e) => void patch(ad.id, { is_active: e.target.checked })} />
                  مفعّل
                </label>
                <div className="ms-auto flex items-center gap-1">
                  <button type="button" onClick={() => void move(i, -1)} disabled={i === 0} aria-label="نقل للأعلى" className="grid size-9 place-items-center rounded-lg border hover:bg-slate-50 disabled:opacity-30"><ArrowUp size={15} /></button>
                  <button type="button" onClick={() => void move(i, 1)} disabled={i === (ads?.length ?? 0) - 1} aria-label="نقل للأسفل" className="grid size-9 place-items-center rounded-lg border hover:bg-slate-50 disabled:opacity-30"><ArrowDown size={15} /></button>
                  <button type="button" onClick={() => setEditing(ad)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold hover:bg-slate-50"><Pencil size={14} />تعديل</button>
                  <button
                    type="button"
                    onClick={() => (confirmDelete === ad.id ? void remove(ad.id) : setConfirmDelete(ad.id))}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                    {confirmDelete === ad.id ? 'تأكيد الحذف' : 'حذف'}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {editing && (
        <Editor
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </section>
  );
}
