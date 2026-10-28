import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowRight, ArrowUp, Award, Briefcase, Check, ChevronDown, Clock3, ExternalLink, HelpCircle,
  ImagePlus, LayoutGrid, Loader2, Palette, Phone, Plus, Quote, RefreshCw, Smartphone, Trash2, Type, Users, X,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'wouter';
import { Card } from '@/components/account-ui';
import {
  ApiError, compressImage, siteUrl, uploadImage, useSaveSite, useSiteDocument,
  type SiteDocument, type SiteStyle,
} from '@/lib/account';

type Json = Record<string, unknown>;
interface Draft { siteName: string; themeColor: string; structure: Json }

// ---------------------------------------------------------------------------
// Declarative schema: what each template's collection looks like in the editor
// ---------------------------------------------------------------------------
interface FieldDef { keys: string[]; label: string; kind?: 'text' | 'textarea' | 'image'; placeholder?: string; half?: boolean }
interface CollectionDef { key: 'items' | 'services' | 'projects'; title: string; singular: string; fields: FieldDef[] }

const NAME: FieldDef = { keys: ['name', 'title'], label: 'الاسم', placeholder: 'مثال: قهوة مختصة' };
const DESC: FieldDef = { keys: ['description'], label: 'الوصف', kind: 'textarea', placeholder: 'سطر أو سطرين يعرّفون بها' };
const IMAGE: FieldDef = { keys: ['image'], label: 'الصورة', kind: 'image' };

const COLLECTIONS: Record<string, CollectionDef> = {
  store: { key: 'items', title: 'المنتجات', singular: 'منتج', fields: [NAME, { keys: ['price'], label: 'السعر', placeholder: '25 ريال', half: true }, DESC, IMAGE] },
  restaurant: { key: 'items', title: 'قائمة الطعام', singular: 'طبق', fields: [NAME, { keys: ['price'], label: 'السعر', placeholder: '25 ريال', half: true }, DESC, IMAGE] },
  services: { key: 'services', title: 'الخدمات', singular: 'خدمة', fields: [NAME, DESC, IMAGE] },
  // The booking template never shows per-service photos, so it isn't offered.
  booking: { key: 'services', title: 'الخدمات القابلة للحجز', singular: 'خدمة', fields: [NAME, DESC] },
  portfolio: { key: 'projects', title: 'المشاريع', singular: 'مشروع', fields: [{ ...NAME, keys: ['title', 'name'] }, DESC, IMAGE] },
};

const STYLE_INFO: Record<SiteStyle, { title: string; desc: string }> = {
  classic: { title: 'كلاسيكي', desc: 'أنيق وهادئ، يناسب أي نشاط' },
  modern: { title: 'عصري', desc: 'شبابي بتخطيط مختلف' },
  cinematic: { title: 'سينمائي فاخر', desc: 'داكن وفخم مع حركة عند التمرير' },
  app: { title: 'تطبيق جوال', desc: 'شريط تنقل وبحث كتطبيق حقيقي' },
};

const COLOR_PRESETS = ['#158C46', '#1b2735', '#caa46a', '#1a56db', '#c0275a', '#6d3fd6', '#c26d00', '#0b7f7a'];

const inputClass =
  'w-full rounded-2xl border border-[#dbe2e9] bg-white px-4 py-3 text-[15px] outline-none transition-all placeholder:text-[#a3adb6] focus:border-[#158C46] focus:shadow-[0_0_0_4px_rgba(21,140,70,.12)] disabled:opacity-60';

const readField = (item: Json, keys: string[]): string => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' || typeof value === 'number') return String(value);
  }
  return '';
};
// Write back to whichever key the item already uses (older data may say "title", newer "name").
const writeField = (item: Json, keys: string[], value: string): Json => ({ ...item, [keys.find((key) => key in item) ?? keys[0]]: value });
const asList = (value: unknown): Json[] => (Array.isArray(value) ? (value as unknown[]).filter((entry): entry is Json => !!entry && typeof entry === 'object') : []);
const toDraft = (doc: SiteDocument): Draft => ({ siteName: doc.siteName, themeColor: doc.themeColor, structure: JSON.parse(JSON.stringify(doc.jsonStructure)) as Json });

// ---------------------------------------------------------------------------
// Field components
// ---------------------------------------------------------------------------
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-[#3b4854]">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-5 text-[#8a96a1]">{hint}</span>}
    </label>
  );
}

function TextField({ label, value, onChange, placeholder, multiline, hint, ltr, max }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean; hint?: string; ltr?: boolean; max?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} maxLength={max ?? 4000} className={`${inputClass} resize-y leading-7`} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={max ?? 400} dir={ltr ? 'ltr' : undefined} className={`${inputClass} ${ltr ? 'text-right' : ''}`} />
      )}
    </Field>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (value: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div><p className="text-sm font-bold">{label}</p>{hint && <p className="mt-0.5 text-xs leading-5 text-[#8a96a1]">{hint}</p>}</div>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#158C46]' : 'bg-[#cfd8e1]'}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${checked ? 'right-1' : 'right-6'}`} />
      </button>
    </div>
  );
}

function ImageField({ value, onChange, label, note }: { value: string; onChange: (url: string) => void; label?: string; note?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const pick = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await uploadImage(await compressImage(file)));
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'تعذّر رفع الصورة. حاول مرة أخرى.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      {label && <span className="mb-1.5 block text-[13px] font-bold text-[#3b4854]">{label}</span>}
      <div className="flex items-center gap-4">
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); void pick(event.dataTransfer.files?.[0]); }}
          className={`relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${dragging ? 'border-[#158C46] bg-[#e6f4ec]' : 'border-[#cfd8e1] bg-[#f6f8fb]'}`}
        >
          {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImagePlus size={24} className="text-[#a3adb6]" />}
          {busy && <span className="absolute inset-0 grid place-items-center bg-white/80"><Loader2 size={22} className="animate-spin text-[#158C46]" /></span>}
        </div>
        <div className="flex flex-col items-start gap-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void pick(event.target.files?.[0])} data-testid="input-image-file" />
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="rounded-xl border border-[#dbe2e9] bg-white px-4 py-2 text-sm font-bold transition-colors hover:bg-[#f6f8fb] disabled:opacity-60">
            {busy ? 'جارٍ الرفع…' : value ? 'تغيير الصورة' : 'رفع صورة'}
          </button>
          {value && !busy && <button type="button" onClick={() => onChange('')} className="inline-flex items-center gap-1 text-xs font-bold text-[#a3392b] hover:underline"><X size={13} /> إزالة</button>}
        </div>
      </div>
      {note && <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-[#a2650f]"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> {note}</p>}
      {error && <p className="mt-2 text-xs font-semibold text-[#a3392b]" role="alert">{error}</p>}
    </div>
  );
}

function TagsField({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (values: string[]) => void; placeholder: string }) {
  const [text, setText] = useState('');
  const add = () => {
    const value = text.trim();
    if (value && !values.includes(value) && values.length < 60) onChange([...values, value.slice(0, 60)]);
    setText('');
  };
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#dbe2e9] bg-white p-2.5 focus-within:border-[#158C46] focus-within:shadow-[0_0_0_4px_rgba(21,140,70,.12)]">
        {values.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ec] px-3 py-1.5 text-sm font-bold text-[#0f6f37]">
            {tag}
            <button type="button" onClick={() => onChange(values.filter((value) => value !== tag))} aria-label={`حذف ${tag}`}><X size={13} /></button>
          </span>
        ))}
        <input value={text} onChange={(event) => setText(event.target.value)} onBlur={add}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',' || event.key === '،') { event.preventDefault(); add(); } }}
          placeholder={values.length ? '' : placeholder} className="min-w-32 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none" />
      </div>
      <span className="mt-1.5 block text-xs text-[#8a96a1]">اكتب المهارة ثم اضغط Enter.</span>
    </Field>
  );
}

function Section({ icon: Icon, title, subtitle, badge, defaultOpen = false, children }: { icon: LucideIcon; title: string; subtitle: string; badge?: ReactNode; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center gap-4 p-5 text-right sm:p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e6f4ec] text-[#158C46]"><Icon size={20} /></span>
        <span className="min-w-0 flex-1"><span className="block font-bold">{title}</span><span className="block text-[13px] text-[#5f6b76]">{subtitle}</span></span>
        {badge}
        <ChevronDown size={18} className={`shrink-0 text-[#8a96a1] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="animate-[acct-fade-up_.25s_ease_both] space-y-5 border-t border-[#e3e8ee] p-5 sm:p-6">{children}</div>}
    </Card>
  );
}

function Repeater({ items, onChange, fields, singular, titleKeys, blank, max = 100, imageNote }: {
  items: Json[]; onChange: (items: Json[]) => void; fields: FieldDef[]; singular: string; titleKeys: string[]; blank: () => Json; max?: number; imageNote?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(items.length === 1 ? 0 : null);
  const [confirming, setConfirming] = useState<number | null>(null);
  useEffect(() => {
    if (confirming === null) return;
    const timer = window.setTimeout(() => setConfirming(null), 3000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  const update = (index: number, next: Json) => onChange(items.map((item, position) => (position === index ? next : item)));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setOpenIndex(target);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const open = openIndex === index;
        const title = readField(item, titleKeys) || `${singular} ${index + 1}`;
        const thumb = typeof item.image === 'string' ? item.image : '';
        return (
          <div key={index} className={`rounded-2xl border transition-colors ${open ? 'border-[#158C46]/40 bg-white' : 'border-[#e3e8ee] bg-[#fafbfc]'}`}>
            <div className="flex items-center gap-3 p-3">
              <button type="button" onClick={() => setOpenIndex(open ? null : index)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-right">
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#e6f4ec] text-sm font-bold text-[#158C46]">
                  {thumb ? <img src={thumb} alt="" className="size-full object-cover" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{title}</span>
                <ChevronDown size={16} className={`shrink-0 text-[#8a96a1] transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              <div className="flex shrink-0 items-center">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="تحريك للأعلى" className="grid size-8 place-items-center rounded-lg text-[#5f6b76] hover:bg-[#eef1f4] disabled:opacity-30"><ArrowUp size={15} /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="تحريك للأسفل" className="grid size-8 place-items-center rounded-lg text-[#5f6b76] hover:bg-[#eef1f4] disabled:opacity-30"><ArrowDown size={15} /></button>
                {confirming === index ? (
                  <button type="button" onClick={() => { onChange(items.filter((_, position) => position !== index)); setConfirming(null); setOpenIndex(null); }} className="rounded-lg bg-[#fdecea] px-2.5 py-1.5 text-xs font-bold text-[#a3392b]" data-testid="button-confirm-delete">تأكيد الحذف</button>
                ) : (
                  <button type="button" onClick={() => setConfirming(index)} aria-label="حذف" className="grid size-8 place-items-center rounded-lg text-[#a3392b] hover:bg-[#fdecea]"><Trash2 size={15} /></button>
                )}
              </div>
            </div>
            {open && (
              <div className="grid animate-[acct-fade-up_.2s_ease_both] gap-4 border-t border-[#e3e8ee] p-4 sm:grid-cols-2">
                {fields.map((field) => {
                  const wide = field.kind === 'textarea' || field.kind === 'image' || !field.half;
                  return (
                    <div key={field.keys[0]} className={wide && !field.half ? 'sm:col-span-2' : ''}>
                      {field.kind === 'image' ? (
                        <ImageField label={field.label} value={typeof item.image === 'string' ? item.image : ''} onChange={(url) => update(index, { ...item, image: url })} note={imageNote} />
                      ) : (
                        <TextField label={field.label} value={readField(item, field.keys)} placeholder={field.placeholder} multiline={field.kind === 'textarea'} onChange={(value) => update(index, writeField(item, field.keys, value))} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {items.length < max ? (
        <button type="button" onClick={() => { onChange([...items, blank()]); setOpenIndex(items.length); }} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#cfd8e1] py-3.5 text-sm font-bold text-[#158C46] transition-colors hover:border-[#158C46] hover:bg-[#e6f4ec]" data-testid="button-add-item">
          <Plus size={17} /> إضافة {singular}
        </button>
      ) : <p className="text-center text-xs text-[#8a96a1]">وصلت للحد الأقصى ({max}).</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The editor
// ---------------------------------------------------------------------------
function EditorForm({ initial, onReload }: { initial: SiteDocument; onReload: () => void }) {
  const save = useSaveSite();
  const [baseline, setBaseline] = useState<Draft>(() => toDraft(initial));
  const [draft, setDraft] = useState<Draft>(baseline);
  const [version, setVersion] = useState(initial.updatedAt);
  const [previewKey, setPreviewKey] = useState(() => Date.now());
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [draft, baseline]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const structure = draft.structure;
  const setKey = (key: string, value: unknown) => setDraft((current) => ({ ...current, structure: { ...current.structure, [key]: value } }));
  const text = (key: string) => (typeof structure[key] === 'string' ? (structure[key] as string) : '');
  const nested = (group: string, key: string) => {
    const value = (structure[group] as Json | undefined)?.[key];
    return typeof value === 'string' ? value : '';
  };
  const setNested = (group: string, key: string, value: string) => setKey(group, { ...((structure[group] as Json | undefined) ?? {}), [key]: value });

  const collection = COLLECTIONS[initial.templateId] ?? COLLECTIONS.store;
  const style = (['classic', 'modern', 'cinematic', 'app'].includes(text('templateStyle')) ? text('templateStyle') : 'classic') as SiteStyle;
  const showsPhotos = initial.imageSupport[style];
  const list = asList(structure[collection.key]);
  const hiddenPhotos = !showsPhotos && collection.fields.includes(IMAGE) ? list.filter((item) => typeof item.image === 'string' && item.image).length : 0;
  const isPortfolio = initial.templateId === 'portfolio';
  const isBooking = initial.templateId === 'booking';
  const imageNote = showsPhotos ? undefined : 'هذه الصورة لن تظهر بالنمط الحالي — اختر "سينمائي" أو "تطبيق جوال" لعرضها.';
  const nameOk = draft.siteName.trim().length > 0;

  const doSave = () => {
    if (!nameOk) { setError('اسم الموقع مطلوب.'); return; }
    setError('');
    setConflict(false);
    save.mutate(
      { baseUpdatedAt: version, siteName: draft.siteName, themeColor: draft.themeColor, jsonStructure: draft.structure },
      {
        onSuccess: (saved) => {
          const next = toDraft(saved);
          setVersion(saved.updatedAt);
          setBaseline(next);
          setDraft(next);
          setPreviewKey(Date.now());
          setSavedFlash(true);
          window.setTimeout(() => setSavedFlash(false), 2200);
        },
        onError: (failure) => {
          if (failure instanceof ApiError && failure.status === 409) setConflict(true);
          else setError(failure instanceof Error ? failure.message : 'تعذّر الحفظ. حاول مرة أخرى.');
        },
      },
    );
  };

  const url = siteUrl(initial.username);
  const stateLabel = save.isPending ? 'جارٍ الحفظ…' : savedFlash ? 'تم الحفظ ✓' : dirty ? 'تغييرات غير محفوظة' : 'كل شيء محفوظ';

  return (
    <div className="space-y-5">
      <div className="sticky top-16 z-20 -mx-1 flex flex-wrap items-center gap-3 rounded-[24px] border border-[#e3e8ee] bg-white/90 px-4 py-3 shadow-[0_10px_30px_-18px_rgba(27,39,53,.35)] backdrop-blur-md">
        <Link href="/dashboard/services" className="grid size-9 place-items-center rounded-full text-[#5f6b76] transition-colors hover:bg-[#f0f3f6]" aria-label="رجوع"><ArrowRight size={18} /></Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold">تحرير الموقع</p>
          <p className={`flex items-center gap-1.5 text-xs font-semibold ${dirty && !savedFlash ? 'text-[#a2650f]' : 'text-[#5f6b76]'}`} role="status" data-testid="text-save-state">
            {savedFlash && <Check size={13} className="text-[#158C46]" />} {stateLabel}
          </p>
        </div>
        <a href={url} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-[#5f6b76] hover:bg-[#f0f3f6] sm:inline-flex"><ExternalLink size={15} /> فتح الموقع</a>
        {dirty && <button type="button" onClick={() => { setDraft(baseline); setError(''); }} disabled={save.isPending} className="rounded-xl px-3 py-2 text-sm font-bold text-[#5f6b76] hover:bg-[#f0f3f6] disabled:opacity-50" data-testid="button-discard">تراجع</button>}
        <button type="button" onClick={doSave} disabled={!dirty || save.isPending} className="inline-flex items-center gap-2 rounded-xl bg-[#158C46] px-6 py-2.5 text-sm font-bold text-white shadow-[0_12px_26px_-12px_#158C46] transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:bg-[#cfd8e1] disabled:shadow-none" data-testid="button-save-site">
          {save.isPending && <Loader2 size={15} className="animate-spin" />} حفظ
        </button>
      </div>

      {conflict && (
        <Card className="flex flex-wrap items-center gap-4 border-[#f0c987] bg-[#fff8e8] p-5" role="alert" data-testid="banner-conflict">
          <AlertTriangle className="text-[#c26d00]" size={22} />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-6 text-[#7a4a06]">تغيّر موقعك من مكان آخر (ربما من البوت) بعد ما فتحت المحرر. حمّل آخر نسخة حتى لا تُكتب فوق التعديلات الجديدة.</p>
          <button type="button" onClick={onReload} className="inline-flex items-center gap-2 rounded-xl bg-[#1b2735] px-4 py-2.5 text-sm font-bold text-white"><RefreshCw size={15} /> تحميل آخر نسخة</button>
        </Card>
      )}
      {error && <Card className="border-[#f3c4be] bg-[#fdecea] p-4 text-sm font-semibold text-[#a3392b]" role="alert" data-testid="banner-error">{error}</Card>}

      <div className="flex items-start gap-8">
        <fieldset disabled={save.isPending} className="min-w-0 flex-1 space-y-4">
          <Section icon={Type} title="الأساسيات" subtitle="الاسم والعبارة التعريفية والوصف" defaultOpen>
            <TextField label="اسم الموقع" value={draft.siteName} onChange={(value) => setDraft((current) => ({ ...current, siteName: value }))} max={80} placeholder="مثال: متجر النور" />
            <TextField label="العبارة التعريفية" value={text('tagline')} onChange={(value) => setKey('tagline', value)} placeholder="جملة قصيرة تظهر أعلى الموقع" />
            <TextField label="الوصف" value={text('description')} onChange={(value) => setKey('description', value)} multiline placeholder="عرّف الزائر بنشاطك" />
            <TextField label="نص زر التواصل" value={text('ctaLabel')} onChange={(value) => setKey('ctaLabel', value)} placeholder="تواصل معنا" max={40} />
          </Section>

          <Section icon={Palette} title="المظهر" subtitle="الشكل والألوان والشعار" defaultOpen>
            {isBooking ? (
              <p className="rounded-2xl bg-[#f6f8fb] px-4 py-3 text-sm leading-6 text-[#5f6b76]">قالب الحجوزات له تصميم واحد، فلا يوجد اختيار للنمط.</p>
            ) : (
              <div>
                <span className="mb-2 block text-[13px] font-bold text-[#3b4854]">نمط التصميم</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(Object.keys(STYLE_INFO) as SiteStyle[]).map((key) => {
                    const active = style === key;
                    const photos = initial.imageSupport[key];
                    return (
                      <button type="button" key={key} onClick={() => { setKey('templateStyle', key); if (key === 'cinematic' && structure.darkMode !== true) setKey('darkMode', true); }}
                        className={`rounded-2xl border-2 p-4 text-right transition-all ${active ? 'border-[#158C46] bg-[#e6f4ec]/60' : 'border-[#e3e8ee] hover:border-[#cfd8e1]'}`} aria-pressed={active} data-testid={`style-${key}`}>
                        <span className="flex items-center justify-between"><span className="font-bold">{STYLE_INFO[key].title}</span>{active && <span className="grid size-5 place-items-center rounded-full bg-[#158C46] text-white"><Check size={12} strokeWidth={3.5} /></span>}</span>
                        <span className="mt-1 block text-[13px] text-[#5f6b76]">{STYLE_INFO[key].desc}</span>
                        <span className={`mt-2.5 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${photos ? 'bg-[#e6f4ec] text-[#0f6f37]' : 'bg-[#f0f3f6] text-[#7a8791]'}`}>{photos ? 'يعرض صور العناصر' : 'بدون صور للعناصر'}</span>
                      </button>
                    );
                  })}
                </div>
                {hiddenPhotos > 0 && (
                  <p className="mt-3 flex items-start gap-2 rounded-2xl bg-[#fff8e8] px-4 py-3 text-[13px] font-semibold leading-6 text-[#7a4a06]" data-testid="warning-hidden-photos">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {hiddenPhotos} صورة لن تظهر بهذا النمط. اختر "سينمائي" أو "تطبيق جوال" إذا تبي عرضها.
                  </p>
                )}
              </div>
            )}
            <div>
              <span className="mb-2 block text-[13px] font-bold text-[#3b4854]">اللون الرئيسي</span>
              <div className="flex flex-wrap items-center gap-2.5">
                {COLOR_PRESETS.map((color) => (
                  <button type="button" key={color} onClick={() => setDraft((current) => ({ ...current, themeColor: color }))} aria-label={color}
                    className={`grid size-9 place-items-center rounded-full ring-offset-2 transition-all ${draft.themeColor.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-[#1b2735]' : 'hover:scale-110'}`} style={{ background: color }}>
                    {draft.themeColor.toLowerCase() === color.toLowerCase() && <Check size={15} className="text-white" strokeWidth={3} />}
                  </button>
                ))}
                <label className="relative grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-[#cfd8e1] text-[#5f6b76]" aria-label="لون مخصص">
                  <Plus size={15} />
                  <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(draft.themeColor) ? draft.themeColor : '#158C46'} onChange={(event) => setDraft((current) => ({ ...current, themeColor: event.target.value }))} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
              </div>
            </div>
            <Toggle checked={structure.darkMode === true} onChange={(value) => setKey('darkMode', value)} label="الوضع الداكن" hint="يفتح الموقع بخلفية داكنة، والزائر يقدر يبدّل بنفسه." />
            <div className="grid gap-6 sm:grid-cols-2">
              <ImageField label="الشعار" value={text('logo')} onChange={(url) => setKey('logo', url)} />
              <ImageField label="الصورة الرئيسية" value={text('heroImage')} onChange={(url) => setKey('heroImage', url)} />
            </div>
          </Section>

          <Section icon={LayoutGrid} title={collection.title} subtitle={`أضف ${collection.singular} وعدّله ورتّبه`} defaultOpen badge={<span className="rounded-full bg-[#f0f3f6] px-2.5 py-1 text-xs font-bold text-[#5f6b76]">{list.length}</span>}>
            <Repeater items={list} onChange={(next) => setKey(collection.key, next)} fields={collection.fields} singular={collection.singular} titleKeys={collection.fields[0].keys} blank={() => ({ [collection.fields[0].keys[0]]: '' })} imageNote={imageNote} />
          </Section>

          <Section icon={Phone} title="التواصل" subtitle="الأرقام والعنوان وحسابات التواصل الاجتماعي">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="الجوال" value={nested('contact', 'phone')} onChange={(value) => setNested('contact', 'phone', value)} placeholder="9665XXXXXXXX" ltr />
              <TextField label="واتساب" value={nested('contact', 'whatsapp')} onChange={(value) => setNested('contact', 'whatsapp', value)} placeholder="9665XXXXXXXX" ltr hint="يستخدم للأزرار اللي تفتح محادثة مباشرة." />
              <TextField label="البريد الإلكتروني" value={nested('contact', 'email')} onChange={(value) => setNested('contact', 'email', value)} placeholder="name@example.com" ltr />
              <TextField label="العنوان" value={nested('contact', 'address')} onChange={(value) => setNested('contact', 'address', value)} placeholder="المدينة، الحي" />
            </div>
            <div className="grid gap-4 border-t border-[#e3e8ee] pt-5 sm:grid-cols-2">
              {(['instagram', 'twitter', 'facebook', 'tiktok', 'snapchat'] as const).map((platform) => (
                <TextField key={platform} label={{ instagram: 'إنستغرام', twitter: 'إكس (تويتر)', facebook: 'فيسبوك', tiktok: 'تيك توك', snapchat: 'سناب شات' }[platform]} value={nested('socialLinks', platform)} onChange={(value) => setNested('socialLinks', platform, value)} placeholder="رابط الحساب أو @اسم_الحساب" ltr />
              ))}
            </div>
          </Section>

          <Section icon={Clock3} title="ساعات العمل" subtitle="أيام وأوقات الدوام" badge={<span className="rounded-full bg-[#f0f3f6] px-2.5 py-1 text-xs font-bold text-[#5f6b76]">{asList(structure.hours).length}</span>}>
            <Repeater items={asList(structure.hours)} onChange={(next) => setKey('hours', next)} singular="يوم" titleKeys={['day']} blank={() => ({ day: '', time: '' })} max={14}
              fields={[{ keys: ['day'], label: 'اليوم', placeholder: 'السبت – الخميس', half: true }, { keys: ['time'], label: 'الوقت', placeholder: '9 ص – 10 م', half: true }]} />
          </Section>

          <Section icon={Users} title="الفريق" subtitle="عرّف الزائر بمن يقف خلف النشاط" badge={<span className="rounded-full bg-[#f0f3f6] px-2.5 py-1 text-xs font-bold text-[#5f6b76]">{asList(structure.team).length}</span>}>
            <Repeater items={asList(structure.team)} onChange={(next) => setKey('team', next)} singular="عضو" titleKeys={['name']} blank={() => ({ name: '', role: '' })} max={30}
              fields={[{ keys: ['name'], label: 'الاسم', half: true }, { keys: ['role'], label: 'المسمى', half: true }, { keys: ['bio'], label: 'نبذة', kind: 'textarea' }, IMAGE]} />
          </Section>

          <Section icon={Quote} title="آراء العملاء" subtitle="ثقة الزوار تبدأ من كلام عملائك" badge={<span className="rounded-full bg-[#f0f3f6] px-2.5 py-1 text-xs font-bold text-[#5f6b76]">{asList(structure.testimonials).length}</span>}>
            <Repeater items={asList(structure.testimonials)} onChange={(next) => setKey('testimonials', next)} singular="رأي" titleKeys={['name']} blank={() => ({ name: '', quote: '' })} max={30}
              fields={[{ keys: ['name'], label: 'اسم العميل' }, { keys: ['quote'], label: 'التعليق', kind: 'textarea' }]} />
          </Section>

          <Section icon={HelpCircle} title="الأسئلة الشائعة" subtitle="أجب مسبقًا عن أكثر ما يُسأل" badge={<span className="rounded-full bg-[#f0f3f6] px-2.5 py-1 text-xs font-bold text-[#5f6b76]">{asList(structure.faq).length}</span>}>
            <Repeater items={asList(structure.faq)} onChange={(next) => setKey('faq', next)} singular="سؤال" titleKeys={['question']} blank={() => ({ question: '', answer: '' })} max={30}
              fields={[{ keys: ['question'], label: 'السؤال' }, { keys: ['answer'], label: 'الجواب', kind: 'textarea' }]} />
          </Section>

          {isPortfolio && (
            <>
              <Section icon={Award} title="المهارات" subtitle="تظهر كوسوم في صفحة البورتفوليو">
                <TagsField label="مهاراتك" values={Array.isArray(structure.skills) ? (structure.skills as unknown[]).filter((value): value is string => typeof value === 'string') : []} onChange={(values) => setKey('skills', values)} placeholder="مثال: تصميم الهوية" />
              </Section>
              <Section icon={Briefcase} title="الخبرات والشهادات" subtitle="مسيرتك المهنية واعتماداتك" badge={<span className="rounded-full bg-[#f0f3f6] px-2.5 py-1 text-xs font-bold text-[#5f6b76]">{asList(structure.experience).length + asList(structure.certifications).length}</span>}>
                <p className="text-[13px] font-bold text-[#3b4854]">الخبرات العملية</p>
                <Repeater items={asList(structure.experience)} onChange={(next) => setKey('experience', next)} singular="خبرة" titleKeys={['role']} blank={() => ({ role: '', company: '' })} max={30}
                  fields={[{ keys: ['role'], label: 'المسمى', half: true }, { keys: ['company'], label: 'الجهة', half: true }, { keys: ['period'], label: 'الفترة', placeholder: '2021 – 2024', half: true }, { keys: ['description'], label: 'الوصف', kind: 'textarea' }]} />
                <p className="border-t border-[#e3e8ee] pt-5 text-[13px] font-bold text-[#3b4854]">الشهادات</p>
                <Repeater items={asList(structure.certifications)} onChange={(next) => setKey('certifications', next)} singular="شهادة" titleKeys={['name']} blank={() => ({ name: '', issuer: '' })} max={30}
                  fields={[{ keys: ['name'], label: 'اسم الشهادة' }, { keys: ['issuer'], label: 'الجهة المانحة', half: true }, { keys: ['year'], label: 'السنة', half: true }]} />
              </Section>
            </>
          )}
        </fieldset>

        <aside className="hidden w-[340px] shrink-0 xl:block" aria-label="معاينة">
          <div className="sticky top-40">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-[#5f6b76]"><Smartphone size={16} /> معاينة الموقع</p>
            <div className="mx-auto h-[620px] w-[312px] overflow-hidden rounded-[44px] border-[10px] border-[#1b2735] bg-white shadow-[0_40px_70px_-30px_rgba(27,39,53,.55)]">
              <iframe key={previewKey} src={`${url}?_=${previewKey}`} title="معاينة الموقع" className="size-full" loading="lazy" />
            </div>
            <p className="mt-3 text-center text-xs text-[#8a96a1]">تتحدث المعاينة بعد كل حفظ.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function SiteEditor() {
  const query = useSiteDocument();
  const [epoch, setEpoch] = useState(0);

  if (query.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-16 animate-pulse rounded-[24px] bg-white" />
        {[0, 1, 2].map((index) => <div key={index} className="h-24 animate-pulse rounded-[28px] bg-white" />)}
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <Card className="px-6 py-16 text-center" data-testid="editor-empty">
        <span className="mx-auto mb-5 grid size-16 place-items-center rounded-[22px] bg-[#f0f3f6] text-[#8a96a1]"><LayoutGrid size={28} /></span>
        <h2 className="text-xl font-bold">ما عندك موقع لتحريره</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-[#5f6b76]">أنشئ موقعك أولًا ثم ارجع هنا لإضافة المحتوى والصور.</p>
        <Link href="/dashboard/services" className="mt-6 inline-flex rounded-xl bg-[#1b2735] px-5 py-2.5 text-sm font-bold text-white">رجوع إلى خدماتي</Link>
      </Card>
    );
  }
  return (
    <EditorForm
      key={`${query.data.id}:${epoch}`}
      initial={query.data}
      onReload={() => { void query.refetch().then(() => setEpoch((value) => value + 1)); }}
    />
  );
}
