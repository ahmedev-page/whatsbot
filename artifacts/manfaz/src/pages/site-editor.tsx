import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  ExternalLink,
  HelpCircle,
  ImagePlus,
  LayoutGrid,
  Loader2,
  MessageCircle,
  Palette,
  Phone,
  Plus,
  Quote,
  RefreshCw,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  Type,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Card } from '@/components/account-ui';
import {
  ApiError,
  compressImage,
  DEFAULT_SURVEY_QUESTIONS,
  getActiveSiteUsername,
  setActiveSiteUsername,
  siteUrl,
  slugifyUsername,
  uploadImage,
  useAccount,
  useDeleteSite,
  useSaveSite,
  useSiteDocument,
  type SiteDocument,
  type SiteStyle,
  type SiteSubmission,
} from '@/lib/account';
import {
  STUDIO_PANEL_META,
  type StudioActivePanel,
} from '@/lib/conversational-creator';

type Json = Record<string, unknown>;
interface Draft {
  username: string;
  siteName: string;
  templateId: string;
  themeColor: string;
  structure: Json;
}

interface FieldDef {
  keys: string[];
  label: string;
  kind?: 'text' | 'textarea' | 'image' | 'select';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  half?: boolean;
}
interface CollectionDef {
  key: 'items' | 'services' | 'projects';
  title: string;
  singular: string;
  fields: FieldDef[];
}

const SURVEY_QUESTION_TYPES: Array<{ value: string; label: string }> = [
  { value: 'choice', label: 'اختيار واحد من متعدد (Single Choice)' },
  { value: 'multi', label: 'اختيار متعدد (Multiple Checkboxes)' },
  { value: 'rating', label: 'تقييم بالنجوم 1 إلى 5 (Star Rating)' },
  { value: 'nps', label: 'مقياس رقمي 1 إلى 10 (NPS Scale)' },
  { value: 'yesno', label: 'نعم / لا / ربما (Yes / No)' },
  { value: 'text', label: 'إجابة نصية مفتوحة (Open Text)' },
];

const NAME: FieldDef = { keys: ['name', 'title'], label: 'الاسم', placeholder: 'مثال: قهوة مختصة' };
const DESC: FieldDef = {
  keys: ['description'],
  label: 'الوصف',
  kind: 'textarea',
  placeholder: 'سطر أو سطرين يعرّفون بها',
};
const IMAGE: FieldDef = { keys: ['image'], label: 'الصورة', kind: 'image' };

const COLLECTIONS: Record<string, CollectionDef> = {
  store: {
    key: 'items',
    title: 'المنتجات',
    singular: 'منتج',
    fields: [
      NAME,
      { keys: ['price'], label: 'السعر', placeholder: '25 ر.س', half: true },
      { keys: ['category'], label: 'التصنيف', placeholder: 'مثال: مشروبات ساخنة', half: true },
      DESC,
      IMAGE,
    ],
  },
  restaurant: {
    key: 'items',
    title: 'قائمة الطعام',
    singular: 'طبق',
    fields: [
      NAME,
      { keys: ['price'], label: 'السعر', placeholder: '25 ر.س', half: true },
      { keys: ['category'], label: 'القسم / التصنيف', placeholder: 'مثال: الأطباق الرئيسية', half: true },
      DESC,
      IMAGE,
    ],
  },
  services: {
    key: 'services',
    title: 'الخدمات والباقات',
    singular: 'خدمة',
    fields: [
      NAME,
      { keys: ['price'], label: 'السعر أو الباقة', placeholder: '250 ر.س', half: true },
      { keys: ['category'], label: 'التصنيف', placeholder: 'مثال: باقات الأعمال', half: true },
      DESC,
      IMAGE,
    ],
  },
  booking: {
    key: 'services',
    title: 'الخدمات القابلة للحجز',
    singular: 'خدمة',
    fields: [
      NAME,
      { keys: ['price'], label: 'السعر / الرسوم', placeholder: '150 ر.س', half: true },
      { keys: ['duration'], label: 'المدة', placeholder: '45 دقيقة', half: true },
      DESC,
    ],
  },
  portfolio: {
    key: 'projects',
    title: 'المشاريع والأعمال',
    singular: 'مشروع',
    fields: [
      { ...NAME, keys: ['title', 'name'] },
      { keys: ['category'], label: 'مجال المشروع', placeholder: 'مثال: تصميم هوية بصرية', half: true },
      DESC,
      IMAGE,
    ],
  },
  survey: {
    key: 'items',
    title: 'أسئلة الاستبيان المتنوعة',
    singular: 'سؤال',
    fields: [
      { keys: ['name', 'title'], label: 'نص السؤال *', placeholder: 'مثال: كيف تقيّم جودة الخدمة وسرعة التجاوب؟' },
      {
        keys: ['duration', 'type'],
        label: 'نوع السؤال وطريقة الإجابة',
        kind: 'select',
        options: SURVEY_QUESTION_TYPES,
        half: true,
      },
      {
        keys: ['category'],
        label: 'خيارات الإجابة (افصل بفاصلة)',
        placeholder: 'ممتاز، جيد جداً، جيد، مقبول',
        half: true,
      },
      {
        keys: ['description'],
        label: 'توضيح إضافي تحت السؤال (اختياري)',
        kind: 'textarea',
        placeholder: 'وصف مختصر يساعد المشارك على الإجابة بدقة',
      },
    ],
  },
  vcard: {
    key: 'items',
    title: 'الروابط والقنوات المميزة',
    singular: 'رابط',
    fields: [
      {
        keys: ['name', 'title'],
        label: 'عنوان الرابط أو الزر',
        placeholder: 'مثال: حسابنا على إنستقرام أو ملف الأعمال',
      },
      {
        keys: ['price'],
        label: 'الرابط (URL) أو المعرّف',
        placeholder: 'https://...',
      },
      {
        keys: ['description'],
        label: 'وصف مختصر',
        placeholder: 'يظهر أسفل عنوان الرابط',
      },
    ],
  },
  rsvp: {
    key: 'items',
    title: 'فقرات وبرنامج الفعالية',
    singular: 'فقرة',
    fields: [
      {
        keys: ['name', 'title'],
        label: 'عنوان الفقرة',
        placeholder: 'مثال: استقبال الضيوف والتسجيل',
      },
      {
        keys: ['price'],
        label: 'التوقيت',
        placeholder: '07:30 م',
        half: true,
      },
      {
        keys: ['description'],
        label: 'التفاصيل أو المتحدث',
        kind: 'textarea',
        placeholder: 'تفاصيل إضافية عن الفقرة',
      },
    ],
  },
  invoice: {
    key: 'services',
    title: 'الباقات وبنود عرض السعر',
    singular: 'باقة',
    fields: [
      {
        keys: ['name', 'title'],
        label: 'اسم الباقة أو البند',
        placeholder: 'مثال: باقة النمو المتكاملة',
      },
      {
        keys: ['price'],
        label: 'السعر',
        placeholder: '2,500 ر.س',
        half: true,
      },
      {
        keys: ['duration'],
        label: 'الدورية أو الوسم',
        placeholder: 'دفعة واحدة / شهرياً',
        half: true,
      },
      {
        keys: ['description'],
        label: 'المميزات المشمولة في الباقة',
        kind: 'textarea',
        placeholder: 'اكتب ما تشمله هذه الباقة',
      },
    ],
  },
};

const STYLE_INFO: Record<SiteStyle, { title: string; desc: string }> = {
  classic: { title: 'كلاسيكي', desc: 'أنيق وهادئ، يناسب أي نشاط' },
  modern: { title: 'عصري', desc: 'شبابي بتخطيط مختلف' },
  cinematic: { title: 'سينمائي فاخر', desc: 'داكن وفخم مع حركة عند التمرير' },
  app: { title: 'تطبيق جوال', desc: 'شريط تنقل وبحث كتطبيق حقيقي' },
};

const COLOR_PRESETS = [
  '#1D4ED8',
  '#0B132B',
  '#0284C7',
  '#4338CA',
  '#059669',
  '#0F766E',
  '#6D28D9',
  '#BE123C',
];

const inputClass =
  'w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#0F172A] outline-none transition-all placeholder:text-[#64748B] focus:border-[#2563EB] focus:bg-white disabled:opacity-60';

const readField = (item: Json, keys: string[]): string => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' || typeof value === 'number') return String(value);
  }
  return '';
};
const writeField = (item: Json, keys: string[], value: string): Json => ({
  ...item,
  [keys.find((key) => key in item) ?? keys[0]]: value,
});
const asList = (value: unknown): Json[] =>
  Array.isArray(value)
    ? (value as unknown[]).filter((entry): entry is Json => !!entry && typeof entry === 'object')
    : [];
const toDraft = (doc: SiteDocument): Draft => ({
  username: doc.username,
  siteName: doc.siteName,
  templateId: doc.templateId,
  themeColor: doc.themeColor,
  structure: JSON.parse(JSON.stringify(doc.jsonStructure)) as Json,
});

// ---------------------------------------------------------------------------
// Field components
// ---------------------------------------------------------------------------
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-xs font-extrabold text-[#0F172A]"
        style={{ color: '#0F172A' }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span
          className="mt-1.5 block text-xs font-medium leading-5 text-[#64748B]"
          style={{ color: '#64748B' }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  hint,
  ltr,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
  ltr?: boolean;
  max?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={max ?? 4000}
          className={`${inputClass} resize-y leading-7`}
          style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={max ?? 400}
          dir={ltr ? 'ltr' : undefined}
          className={`${inputClass} ${ltr ? 'text-right font-mono' : ''}`}
          style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
        />
      )}
    </Field>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
          {label}
        </p>
        {hint && (
          <p
            className="mt-0.5 text-xs font-medium leading-5 text-[#64748B]"
            style={{ color: '#64748B' }}
          >
            {hint}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
        style={{ backgroundColor: checked ? '#1D4ED8' : '#CBD5E1' }}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${
            checked ? 'right-1' : 'right-6'
          }`}
          style={{ backgroundColor: '#FFFFFF' }}
        />
      </button>
    </div>
  );
}

function ImageField({
  value,
  onChange,
  label,
  note,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  note?: string;
}) {
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
      setError(
        failure instanceof ApiError ? failure.message : 'تعذّر رفع الصورة. حاول مرة أخرى.'
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      {label && (
        <span
          className="mb-1.5 block text-xs font-extrabold text-[#0F172A]"
          style={{ color: '#0F172A' }}
        >
          {label}
        </span>
      )}
      <div className="flex items-center gap-4">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void pick(event.dataTransfer.files?.[0]);
          }}
          className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors"
          style={
            dragging
              ? { backgroundColor: '#EFF6FF', borderColor: '#2563EB' }
              : { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }
          }
        >
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus size={24} style={{ color: '#64748B' }} />
          )}
          {busy && (
            <span
              className="absolute inset-0 grid place-items-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
            >
              <Loader2 size={22} className="animate-spin" style={{ color: '#1D4ED8' }} />
            </span>
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => void pick(event.target.files?.[0])}
            data-testid="input-image-file"
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-[#0F172A] transition-colors hover:bg-[#F1F5F9] disabled:opacity-60"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
          >
            {busy ? 'جارٍ الرفع…' : value ? 'تغيير الصورة' : 'رفع صورة'}
          </button>
          {value && !busy && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#BE123C] hover:underline"
              style={{ color: '#BE123C' }}
            >
              <X size={13} /> إزالة
            </button>
          )}
        </div>
      </div>
      {note && (
        <p
          className="mt-2 flex items-start gap-1.5 text-xs font-bold leading-5 text-[#1D4ED8]"
          style={{ color: '#1D4ED8' }}
        >
          <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {note}
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs font-bold text-[#BE123C]" style={{ color: '#BE123C' }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function TagsField({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [text, setText] = useState('');
  const add = () => {
    const value = text.trim();
    if (value && !values.includes(value) && values.length < 60)
      onChange([...values, value.slice(0, 60)]);
    setText('');
  };
  return (
    <Field label={label}>
      <div
        className="flex flex-wrap gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2.5 focus-within:border-[#2563EB] focus-within:bg-white"
        style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}
      >
        {values.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#1D4ED8]"
            style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(values.filter((value) => value !== tag))}
              aria-label={`حذف ${tag}`}
            >
              <X size={13} />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={add}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',' || event.key === '،') {
              event.preventDefault();
              add();
            }
          }}
          placeholder={values.length ? '' : placeholder}
          className="min-w-32 flex-1 bg-transparent px-2 py-1 text-sm text-[#0F172A] outline-none"
          style={{ color: '#0F172A' }}
        />
      </div>
      <span className="mt-1.5 block text-xs font-medium text-[#64748B]" style={{ color: '#64748B' }}>
        اكتب المهارة ثم اضغط Enter.
      </span>
    </Field>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden border border-[#CBD5E1]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-5 text-right sm:p-6"
      >
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
          style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
        >
          <Icon size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
            {title}
          </span>
          <span className="block text-xs font-medium text-[#475569]" style={{ color: '#475569' }}>
            {subtitle}
          </span>
        </span>
        {badge}
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          style={{ color: '#64748B' }}
        />
      </button>
      {open && (
        <div
          className="animate-[acct-fade-up_.25s_ease_both] space-y-5 border-t border-[#E2E8F0] p-5 sm:p-6"
          style={{ borderColor: '#E2E8F0' }}
        >
          {children}
        </div>
      )}
    </Card>
  );
}

function Repeater({
  items,
  onChange,
  fields,
  singular,
  titleKeys,
  blank,
  max = 100,
  imageNote,
}: {
  items: Json[];
  onChange: (items: Json[]) => void;
  fields: FieldDef[];
  singular: string;
  titleKeys: string[];
  blank: () => Json;
  max?: number;
  imageNote?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(items.length === 1 ? 0 : null);
  const [confirming, setConfirming] = useState<number | null>(null);
  useEffect(() => {
    if (confirming === null) return;
    const timer = window.setTimeout(() => setConfirming(null), 3000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  const update = (index: number, next: Json) =>
    onChange(items.map((item, position) => (position === index ? next : item)));
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
          <div
            key={index}
            className="rounded-2xl border transition-colors"
            style={
              open
                ? { backgroundColor: '#FFFFFF', borderColor: '#2563EB' }
                : { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }
            }
          >
            <div className="flex items-center gap-3 p-3">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
                className="flex min-w-0 flex-1 items-center gap-3 text-right"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] font-mono text-xs font-black text-[#1D4ED8]"
                  style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                >
                  {thumb ? <img src={thumb} alt="" className="size-full object-cover" /> : index + 1}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-sm font-black text-[#0F172A]"
                  style={{ color: '#0F172A' }}
                >
                  {title}
                </span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                  style={{ color: '#64748B' }}
                />
              </button>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="تحريك للأعلى"
                  className="grid size-8 place-items-center rounded-lg text-[#475569] hover:bg-[#E2E8F0] disabled:opacity-30"
                  style={{ color: '#475569' }}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="تحريك للأسفل"
                  className="grid size-8 place-items-center rounded-lg text-[#475569] hover:bg-[#E2E8F0] disabled:opacity-30"
                  style={{ color: '#475569' }}
                >
                  <ArrowDown size={15} />
                </button>
                {confirming === index ? (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(items.filter((_, position) => position !== index));
                      setConfirming(null);
                      setOpenIndex(null);
                    }}
                    className="rounded-lg border border-[#FECDD3] bg-[#FFF1F2] px-2.5 py-1.5 text-xs font-bold text-[#BE123C]"
                    style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#BE123C' }}
                    data-testid="button-confirm-delete"
                  >
                    تأكيد الحذف
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(index)}
                    aria-label="حذف"
                    className="grid size-8 place-items-center rounded-lg text-[#BE123C] hover:bg-[#FFF1F2]"
                    style={{ color: '#BE123C' }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
            {open && (
              <div
                className="grid animate-[acct-fade-up_.2s_ease_both] gap-4 border-t border-[#E2E8F0] p-4 sm:grid-cols-2"
                style={{ borderColor: '#E2E8F0' }}
              >
                {fields.map((field) => {
                  const wide = field.kind === 'textarea' || field.kind === 'image' || !field.half;
                  return (
                    <div key={field.keys[0]} className={wide && !field.half ? 'sm:col-span-2' : ''}>
                      {field.kind === 'image' ? (
                        <ImageField
                          label={field.label}
                          value={typeof item.image === 'string' ? item.image : ''}
                          onChange={(url) => update(index, { ...item, image: url })}
                          note={imageNote}
                        />
                      ) : field.kind === 'select' && field.options ? (
                        <Field label={field.label}>
                          <select
                            value={readField(item, field.keys) || field.options[0]?.value || ''}
                            onChange={(e) =>
                              update(index, writeField(item, field.keys, e.target.value))
                            }
                            className={inputClass}
                            style={{
                              backgroundColor: '#F8FAFC',
                              borderColor: '#CBD5E1',
                              color: '#0F172A',
                            }}
                          >
                            {field.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                      ) : (
                        <TextField
                          label={field.label}
                          value={readField(item, field.keys)}
                          placeholder={field.placeholder}
                          multiline={field.kind === 'textarea'}
                          onChange={(value) => update(index, writeField(item, field.keys, value))}
                        />
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
        <button
          type="button"
          onClick={() => {
            onChange([...items, blank()]);
            setOpenIndex(items.length);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#93C5FD] bg-[#EFF6FF] py-3.5 text-sm font-bold text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE]"
          style={{ backgroundColor: '#EFF6FF', borderColor: '#93C5FD', color: '#1D4ED8' }}
          data-testid="button-add-item"
        >
          <Plus size={17} /> إضافة {singular}
        </button>
      ) : (
        <p className="text-center text-xs font-medium text-[#64748B]" style={{ color: '#64748B' }}>
          وصلت للحد الأقصى ({max}).
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results & Submissions Panel (Survey, Booking, RSVP, Package Quotes)
// ---------------------------------------------------------------------------
function SubmissionsPanel({
  templateId,
  submissions,
  questions,
  onDeleteSubmission,
  onClearSubmissions,
}: {
  templateId: string;
  submissions: SiteSubmission[];
  questions: Json[];
  onDeleteSubmission: (id: string) => void;
  onClearSubmissions: () => void;
}) {
  const isSurvey = templateId === 'survey';
  const isBooking = templateId === 'booking';
  const isRsvp = templateId === 'rsvp';

  const getSubRating = (s: SiteSubmission): number =>
    typeof s.rating === 'number' && s.rating > 0
      ? s.rating
      : typeof s.overallRating === 'number' && s.overallRating > 0
      ? s.overallRating
      : 0;

  const ratedSubmissions = submissions.filter((s) => getSubRating(s) > 0);
  const avgRating =
    ratedSubmissions.length > 0
      ? (
          ratedSubmissions.reduce((acc, s) => acc + getSubRating(s), 0) /
          ratedSubmissions.length
        ).toFixed(1)
      : '—';

  const typeLabel = isSurvey
    ? 'ردود الاستبيان وتقييمات العملاء'
    : isBooking
    ? 'طلبات حجز المواعيد الواردة'
    : isRsvp
    ? 'تأكيدات حضور الفعالية (RSVP)'
    : 'الردود والطلبات المسجلة من الزوار';

  return (
    <div className="space-y-5" data-testid="submissions-panel">
      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-[#CBD5E1] bg-white p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#475569]" style={{ color: '#475569' }}>
              إجمالي الردود المستلمة
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-[#EFF6FF] text-[#1D4ED8]" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
              <ClipboardList size={18} />
            </span>
          </div>
          <p className="mt-3 font-mono text-3xl font-black text-[#0F172A]" style={{ color: '#0F172A' }} data-testid="text-submissions-count">
            {submissions.length}
          </p>
          <p className="mt-1 text-xs font-bold text-[#059669]" style={{ color: '#059669' }}>
            ● محفوظة تلقائياً في قاعدة البيانات
          </p>
        </Card>

        <Card className="border border-[#CBD5E1] bg-white p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#475569]" style={{ color: '#475569' }}>
              {isSurvey ? 'متوسط التقييم العام' : isBooking ? 'حجوزات بانتظار التأكيد' : 'آخر تفاعل مستلم'}
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-[#FEF3C7] text-[#D97706]" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <Star size={18} />
            </span>
          </div>
          <p className="mt-3 font-mono text-3xl font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
            {isSurvey ? `${avgRating} / 5` : submissions.length}
          </p>
          <p className="mt-1 text-xs font-medium text-[#475569]" style={{ color: '#475569' }}>
            {ratedSubmissions.length > 0
              ? `بناءً على ${ratedSubmissions.length} تقييم`
              : 'يتم التحديث فور إرسال الزائر'}
          </p>
        </Card>

        <Card className="border border-[#CBD5E1] bg-white p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#475569]" style={{ color: '#475569' }}>
              {isSurvey ? 'عدد الأسئلة النشطة' : 'حالة استقبال الردود'}
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-[#ECFDF5] text-[#059669]" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
              <BarChart3 size={18} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
            {isSurvey ? `${questions.length} أسئلة` : 'نشط ومباشر'}
          </p>
          <p className="mt-1 text-xs font-medium text-[#475569]" style={{ color: '#475569' }}>
            تظهر النتائج هنا فور ضغط الزائر على إرسال
          </p>
        </Card>
      </div>

      {/* Survey Question-by-Question Breakdown */}
      {isSurvey && submissions.length > 0 && questions.length > 0 && (
        <Card className="border border-[#CBD5E1] bg-white p-6 space-y-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}>
          <div>
            <h3 className="text-base font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
              تحليل نتائج وإحصائيات الأسئلة
            </h3>
            <p className="text-xs font-medium text-[#475569]" style={{ color: '#475569' }}>
              نسبة وتوزيع إجابات المشاركين على كل سؤال في الاستبيان
            </p>
          </div>

          <div className="space-y-4">
            {questions.map((q, qIdx) => {
              const qTitle = readField(q, ['name', 'title']) || `السؤال ${qIdx + 1}`;
              const counts: Record<string, number> = {};
              let totalForQ = 0;

              for (const sub of submissions) {
                const matched = (sub.answers || []).find(
                  (a) => a.question === qTitle || a.question.includes(qTitle)
                );
                if (matched && matched.answer) {
                  const parts = matched.answer
                    .split('، ')
                    .map((p) => p.trim())
                    .filter(Boolean);
                  for (const part of parts) {
                    counts[part] = (counts[part] || 0) + 1;
                    totalForQ += 1;
                  }
                }
              }

              const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

              return (
                <div
                  key={qIdx}
                  className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
                      {qIdx + 1}. {qTitle}
                    </p>
                    <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-bold text-[#1D4ED8] border border-[#CBD5E1]">
                      {totalForQ} إجابة
                    </span>
                  </div>

                  {entries.length === 0 ? (
                    <p className="mt-2 text-xs font-medium text-[#64748B]">
                      لا توجد إجابات مسجلة لهذا السؤال بعد.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {entries.map(([ans, count]) => {
                        const pct = totalForQ > 0 ? Math.round((count / totalForQ) * 100) : 0;
                        return (
                          <div key={ans} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-[#0F172A]">{ans}</span>
                              <span className="font-mono text-[#1D4ED8]">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                              <div
                                className="h-full rounded-full bg-[#1D4ED8]"
                                style={{ width: `${pct}%`, backgroundColor: '#1D4ED8' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Individual Submissions List */}
      <Card className="border border-[#CBD5E1] bg-white p-6" style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div>
            <h3 className="text-base font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
              {typeLabel} ({submissions.length})
            </h3>
            <p className="text-xs font-medium text-[#475569]" style={{ color: '#475569' }}>
              تفاصيل كل رد مع وقت الإرسال وبيانات المشارك والعميل
            </p>
          </div>
          {submissions.length > 0 && (
            <button
              type="button"
              onClick={onClearSubmissions}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#FECDD3] bg-[#FFF1F2] px-3 py-2 text-xs font-bold text-[#BE123C] hover:bg-[#FFE4E6]"
              style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#BE123C' }}
              data-testid="button-clear-submissions"
            >
              <Trash2 size={14} /> مسح الكل وتصفير السجل
            </button>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="py-12 text-center" data-testid="submissions-empty">
            <span
              className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
              style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
            >
              <ClipboardList size={24} />
            </span>
            <p className="text-sm font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
              لا توجد ردود مسجلة حتى الآن
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs font-medium leading-6 text-[#475569]" style={{ color: '#475569' }}>
              افتح رابط موقعك العام وشارك في الاستبيان أو أرسل طلب حجز، وستظهر جميع الإجابات والإحصائيات هنا تلقائياً.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {submissions.map((sub, idx) => {
              const subRating = getSubRating(sub);
              const subService =
                sub.serviceName ||
                (typeof sub.details?.service === 'string' ? sub.details.service : '');
              const subDate =
                sub.appointmentDate ||
                (typeof sub.details?.date === 'string' ? sub.details.date : '');
              const subTime =
                sub.appointmentTime ||
                (typeof sub.details?.time === 'string' ? sub.details.time : '');
              return (
              <div
                key={sub.id || idx}
                className="rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 transition-colors"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}
                data-testid={`submission-card-${idx}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0B132B] font-mono text-xs font-black text-white"
                      style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
                    >
                      #{submissions.length - idx}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
                          {sub.respondentName || 'زائر بدون اسم'}
                        </p>
                        {subRating > 0 && (
                          <span
                            className="inline-flex items-center gap-1 rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-extrabold text-[#B45309]"
                            style={{ backgroundColor: '#FEF3C7', borderColor: '#FDE68A', color: '#B45309' }}
                          >
                            <Star size={12} fill="currentColor" /> {subRating} / 5
                          </span>
                        )}
                        {subService && (
                          <span
                            className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-0.5 text-xs font-extrabold text-[#1D4ED8]"
                            style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                          >
                            {subService}
                          </span>
                        )}
                        {sub.attending && (
                          <span
                            className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-0.5 text-xs font-extrabold text-[#047857]"
                            style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' }}
                          >
                            {sub.attending === 'yes'
                              ? `مؤكد الحضور (${sub.guests || '1'})`
                              : 'معتذر عن الحضور'}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] font-bold text-[#64748B]" style={{ color: '#64748B' }}>
                        {sub.createdAt
                          ? new Intl.DateTimeFormat('ar-SA', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            }).format(new Date(sub.createdAt))
                          : ''}
                        {sub.respondentPhone ? ` · الجوال: ${sub.respondentPhone}` : ''}
                        {subDate ? ` · التاريخ: ${subDate}` : ''}
                        {subTime ? ` · الوقت: ${subTime}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {sub.respondentPhone && (
                      <a
                        href={`https://wa.me/${sub.respondentPhone.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1.5 text-xs font-bold text-[#047857]"
                        style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' }}
                      >
                        <MessageCircle size={13} /> مراسلة واتساب
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteSubmission(sub.id)}
                      className="grid size-8 place-items-center rounded-lg border border-[#FECDD3] bg-white text-[#BE123C] hover:bg-[#FFF1F2]"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#FECDD3', color: '#BE123C' }}
                      aria-label="حذف الرد"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Answers Table */}
                {Array.isArray(sub.answers) && sub.answers.length > 0 && (
                  <div className="mt-3 grid gap-2 border-t border-[#E2E8F0] pt-3 sm:grid-cols-2">
                    {sub.answers.map((ans, aIdx) => (
                      <div
                        key={aIdx}
                        className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2"
                        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
                      >
                        <p className="text-[11px] font-bold text-[#64748B]" style={{ color: '#64748B' }}>
                          {ans.question}
                        </p>
                        <p className="mt-0.5 text-xs font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
                          {ans.answer || '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {sub.notes && (
                  <div
                    className="mt-3 rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                  >
                    <span className="font-extrabold text-[#475569]">ملاحظات إضافية: </span>
                    <span className="font-bold text-[#0F172A]">{sub.notes}</span>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The editor
// ---------------------------------------------------------------------------
function EditorForm({
  initial,
  onReload,
  forcedTab,
  focusedSection,
  onBackToChat,
  onDeleted,
}: {
  initial: SiteDocument;
  onReload: () => void;
  forcedTab?: 'editor' | 'results';
  focusedSection?: StudioActivePanel;
  onBackToChat?: (savedSectionLabel?: string) => void;
  onDeleted?: () => void;
}) {
  const [, navigate] = useLocation();
  const save = useSaveSite();
  const deleteSite = useDeleteSite();
  const [baseline, setBaseline] = useState<Draft>(() => toDraft(initial));
  const [draft, setDraft] = useState<Draft>(baseline);
  const [version, setVersion] = useState(initial.updatedAt);
  const [previewKey, setPreviewKey] = useState(() => Date.now());
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [confirmDeleteSite, setConfirmDeleteSite] = useState(false);
  const [showInlinePreview, setShowInlinePreview] = useState(false);
  const [studioTab, setStudioTab] = useState<'editor' | 'results'>(() => {
    if (focusedSection === 'results') return 'results';
    if (forcedTab) return forcedTab;
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search.includes('tab=results') || search.includes('tab=submissions')) {
        return 'results';
      }
    }
    return 'editor';
  });

  useEffect(() => {
    if (focusedSection === 'results') {
      setStudioTab('results');
    } else if (focusedSection) {
      setStudioTab('editor');
    } else if (forcedTab) {
      setStudioTab(forcedTab);
    }
  }, [forcedTab, focusedSection]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [draft, baseline]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const structure = draft.structure;
  const setKey = (key: string, value: unknown) =>
    setDraft((current) => ({ ...current, structure: { ...current.structure, [key]: value } }));
  const text = (key: string) =>
    typeof structure[key] === 'string' ? (structure[key] as string) : '';
  const nested = (group: string, key: string) => {
    const value = (structure[group] as Json | undefined)?.[key];
    return typeof value === 'string' ? value : '';
  };
  const setNested = (group: string, key: string, value: string) =>
    setKey(group, { ...((structure[group] as Json | undefined) ?? {}), [key]: value });

  const collection = COLLECTIONS[draft.templateId] ?? COLLECTIONS.store;
  const style = (
    ['classic', 'modern', 'cinematic', 'app'].includes(text('templateStyle'))
      ? text('templateStyle')
      : 'classic'
  ) as SiteStyle;
  const showsPhotos = initial.imageSupport?.[style] ?? false;
  const list = asList(structure[collection.key]);
  const submissions = useMemo<SiteSubmission[]>(() => {
    if (!Array.isArray(structure.submissions)) return [];
    return structure.submissions.filter(
      (item): item is SiteSubmission => Boolean(item && typeof item === 'object')
    );
  }, [structure.submissions]);
  const hiddenPhotos =
    !showsPhotos && collection.fields.includes(IMAGE)
      ? list.filter((item) => typeof item.image === 'string' && item.image).length
      : 0;
  const isPortfolio = draft.templateId === 'portfolio';
  const isBooking = draft.templateId === 'booking';
  const isSurvey = draft.templateId === 'survey';
  const isSingleLayoutTool = ['booking', 'survey', 'rsvp', 'invoice', 'vcard'].includes(
    draft.templateId
  );
  const imageNote = showsPhotos
    ? undefined
    : 'هذه الصورة لن تظهر بالنمط الحالي — اختر "سينمائي" أو "تطبيق جوال" لعرضها.';
  const nameOk = draft.siteName.trim().length > 0;

  const focusedMeta = focusedSection ? STUDIO_PANEL_META[focusedSection] : undefined;

  const doSave = (returnAfterSave = false) => {
    if (!nameOk) {
      setError('اسم الموقع مطلوب.');
      return;
    }
    if (!dirty && returnAfterSave) {
      onBackToChat?.(focusedMeta?.badge || 'التعديلات');
      return;
    }
    setError('');
    setConflict(false);
    save.mutate(
      {
        id: initial.id,
        baseUpdatedAt: version,
        username: slugifyUsername(draft.username.trim() || draft.siteName.trim()),
        siteName: draft.siteName,
        templateId: draft.templateId,
        themeColor: draft.themeColor,
        jsonStructure: draft.structure,
      },
      {
        onSuccess: (saved) => {
          const next = toDraft(saved);
          setVersion(saved.updatedAt);
          setBaseline(next);
          setDraft(next);
          setPreviewKey(Date.now());
          setSavedFlash(true);
          window.setTimeout(() => setSavedFlash(false), 2200);
          if (returnAfterSave) {
            onBackToChat?.(focusedMeta?.badge || 'التعديلات');
          }
        },
        onError: (failure) => {
          if (failure instanceof ApiError && failure.status === 409) {
            if (failure.message.includes('الرابط')) {
              setError(failure.message);
            } else {
              setConflict(true);
            }
          } else {
            setError(
              failure instanceof Error ? failure.message : 'تعذّر الحفظ. حاول مرة أخرى.'
            );
          }
        },
      }
    );
  };

  const url = siteUrl(baseline.username);
  const stateLabel = save.isPending
    ? 'جارٍ الحفظ…'
    : savedFlash
    ? 'تم الحفظ ✓'
    : dirty
    ? 'تغييرات غير محفوظة'
    : 'كل شيء محفوظ';

  // Visibility flags so only the requested part is rendered when focusedSection is active
  const showIdentityTexts = !focusedSection || focusedSection === 'content';
  const showSettingsFields = !focusedSection || focusedSection === 'settings';
  const showTemplateStyles = !focusedSection || focusedSection === 'template';
  const showColorsAndMedia = !focusedSection || focusedSection === 'colors';
  const showProductsCollection = !focusedSection || focusedSection === 'products';
  const showContactAndHours = !focusedSection || focusedSection === 'contact';
  const showExtraContentSections = !focusedSection || focusedSection === 'content';

  return (
    <div className="space-y-5" data-testid={focusedSection ? `focused-editor-${focusedSection}` : 'full-editor'}>
      {/* Top Studio Sticky Action Bar */}
      <div
        className="sticky top-28 z-20 -mx-1 flex flex-wrap items-center gap-3 rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 shadow-md"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
      >
        {onBackToChat ? (
          <button
            type="button"
            onClick={() => onBackToChat()}
            data-testid="button-back-to-chat"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-xs font-extrabold text-[#0F172A] transition-colors hover:bg-[#E2E8F0]"
            style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
          >
            <ArrowRight size={16} />
            <span>العودة للمحادثة</span>
          </button>
        ) : (
          <Link
            href="/dashboard/services"
            className="grid size-9 place-items-center rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] transition-colors hover:bg-[#E2E8F0]"
            style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
            aria-label="رجوع"
          >
            <ArrowRight size={18} />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[15px] font-black text-[#0F172A]"
            style={{ color: '#0F172A' }}
          >
            {focusedMeta ? focusedMeta.title : 'استوديو تحرير الموقع'}
          </p>
          <p
            className="flex items-center gap-1.5 text-xs font-bold"
            style={{ color: dirty && !savedFlash ? '#1D4ED8' : '#059669' }}
            role="status"
            data-testid="text-save-state"
          >
            {savedFlash && <Check size={13} style={{ color: '#059669' }} />} {stateLabel}
          </p>
        </div>

        {!focusedSection && (
          <button
            type="button"
            onClick={() => setShowInlinePreview((v) => !v)}
            data-testid="button-toggle-inline-preview"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 py-2 text-xs font-extrabold text-[#1D4ED8] hover:bg-[#DBEAFE]"
            style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
          >
            <Smartphone size={15} />
            <span>{showInlinePreview ? 'إخفاء المعاينة' : 'معاينة حية'}</span>
          </button>
        )}

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#E2E8F0]"
          style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
        >
          <ExternalLink size={15} /> فتح الموقع
        </a>

        {dirty && (
          <button
            type="button"
            onClick={() => {
              setDraft(baseline);
              setError('');
            }}
            disabled={save.isPending}
            className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-xs font-bold text-[#475569] hover:bg-[#E2E8F0] disabled:opacity-50"
            style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#475569' }}
            data-testid="button-discard"
          >
            تراجع
          </button>
        )}

        <button
          type="button"
          onClick={() => doSave(false)}
          disabled={!dirty || save.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1E40AF] disabled:bg-[#CBD5E1] disabled:text-[#64748B]"
          style={
            !dirty || save.isPending
              ? { backgroundColor: '#CBD5E1', color: '#475569' }
              : { backgroundColor: '#1D4ED8', color: '#FFFFFF' }
          }
          data-testid="button-save-site"
        >
          {save.isPending && <Loader2 size={14} className="animate-spin" />} حفظ التعديلات
        </button>

        {onBackToChat && (
          <button
            type="button"
            onClick={() => doSave(true)}
            disabled={save.isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#059669] px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-all hover:bg-[#047857] disabled:opacity-50"
            style={{ backgroundColor: '#059669', color: '#FFFFFF' }}
            data-testid="button-save-and-return"
          >
            <Check size={15} />
            <span>{dirty ? 'حفظ والعودة للمحادثة' : 'تم — العودة للمحادثة'}</span>
          </button>
        )}
      </div>

      {conflict && (
        <Card
          className="flex flex-wrap items-center gap-4 border-[#93C5FD] bg-[#EFF6FF] p-5"
          style={{ backgroundColor: '#EFF6FF', borderColor: '#93C5FD', color: '#0F172A' }}
          role="alert"
          data-testid="banner-conflict"
        >
          <AlertTriangle style={{ color: '#1D4ED8' }} size={22} />
          <p
            className="min-w-0 flex-1 text-sm font-bold leading-6 text-[#1E3A8A]"
            style={{ color: '#1E3A8A' }}
          >
            تغيّر موقعك من مكان آخر (ربما من البوت) بعد ما فتحت المحرر. حمّل آخر نسخة حتى لا تُكتب فوق التعديلات الجديدة.
          </p>
          <button
            type="button"
            onClick={onReload}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B132B] px-4 py-2.5 text-xs font-bold text-white"
            style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
          >
            <RefreshCw size={15} /> تحميل آخر نسخة
          </button>
        </Card>
      )}
      {error && (
        <Card
          className="border-[#FECDD3] bg-[#FFF1F2] p-4 text-sm font-bold text-[#BE123C]"
          style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#BE123C' }}
          role="alert"
          data-testid="banner-error"
        >
          {error}
        </Card>
      )}

      {showInlinePreview && !focusedSection && (
        <Card
          className="border border-[#93C5FD] bg-[#0B132B] p-4 text-white"
          style={{ backgroundColor: '#0B132B', borderColor: '#93C5FD', color: '#FFFFFF' }}
          data-testid="inline-live-preview-card"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs font-extrabold text-[#38BDF8]">
              <Smartphone size={16} />
              <span>معاينة حية تفاعلية لـ «{draft.siteName}» ({url})</span>
            </p>
            <button
              type="button"
              onClick={() => setPreviewKey(Date.now())}
              className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20"
            >
              <RefreshCw size={12} /> تحديث المعاينة
            </button>
          </div>
          <div
            className="mx-auto h-[540px] w-full max-w-[360px] overflow-hidden rounded-[32px] border-[6px] border-[#1E293B] bg-white shadow-2xl"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#1E293B' }}
          >
            <iframe
              key={`inline-${previewKey}`}
              src={`${url}?_=${previewKey}`}
              title="معاينة الموقع الحية"
              className="size-full"
              loading="lazy"
            />
          </div>
        </Card>
      )}

      {/* Studio Mode Tabs: Only shown when not in focused single-section mode */}
      {!focusedSection && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#CBD5E1] bg-white p-2"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStudioTab('editor')}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all sm:text-sm"
              style={
                studioTab === 'editor'
                  ? { backgroundColor: '#0B132B', color: '#FFFFFF' }
                  : { backgroundColor: '#F8FAFC', color: '#334155' }
              }
              data-testid="tab-studio-editor"
            >
              <LayoutGrid size={16} />
              <span>محرر المحتوى والتصميم</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioTab('results')}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all sm:text-sm"
              style={
                studioTab === 'results'
                  ? { backgroundColor: '#1D4ED8', color: '#FFFFFF' }
                  : { backgroundColor: '#EFF6FF', color: '#1D4ED8' }
              }
              data-testid="tab-studio-results"
            >
              <BarChart3 size={16} />
              <span>
                {isSurvey
                  ? 'نتائج الاستبيان والردود'
                  : isBooking
                  ? 'الحجوزات والمواعيد الواردة'
                  : 'النتائج والردود المستلمة'}
              </span>
              <span
                className="rounded-full px-2 py-0.5 font-mono text-xs font-black"
                style={
                  studioTab === 'results'
                    ? { backgroundColor: '#FFFFFF', color: '#1D4ED8' }
                    : { backgroundColor: '#1D4ED8', color: '#FFFFFF' }
                }
              >
                {submissions.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onReload}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-bold text-[#334155] hover:bg-[#E2E8F0]"
            style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#334155' }}
            data-testid="button-refresh-submissions"
          >
            <RefreshCw size={14} /> تحديث النتائج
          </button>
        </div>
      )}

      {studioTab === 'results' || focusedSection === 'results' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onReload}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9]"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
              data-testid="button-refresh-submissions"
            >
              <RefreshCw size={14} /> تحديث النتائج والردود
            </button>
          </div>
          <SubmissionsPanel
            templateId={draft.templateId}
            submissions={submissions}
            questions={list}
            onDeleteSubmission={(subId) => {
              const nextSubs = submissions.filter((s) => s.id !== subId);
              setKey('submissions', nextSubs);
            }}
            onClearSubmissions={() => {
              setKey('submissions', []);
            }}
          />
        </div>
      ) : (
        <div className="flex items-start gap-8">
          <fieldset disabled={save.isPending} className="min-w-0 flex-1 space-y-4">
            {/* 1. Content / Basic Identity Texts Section */}
            {showIdentityTexts && (
              <Section
                icon={Type}
                title="النصوص والعناوين الرئيسية"
                subtitle="اسم الخدمة، العبارة الترحيبية، العنوان الرئيسي، الوصف، وزر الإجراء"
                defaultOpen
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="اسم الموقع أو الخدمة *"
                    value={draft.siteName}
                    onChange={(value) => setDraft((current) => ({ ...current, siteName: value }))}
                    max={80}
                    placeholder="مثال: دار آروما"
                  />
                  <TextField
                    label="العبارة التعريفية العلوية (Tagline)"
                    value={text('tagline')}
                    onChange={(value) => setKey('tagline', value)}
                    placeholder="جملة قصيرة تظهر أعلى الموقع"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="العنوان الرئيسي البارز (Headline)"
                    value={text('headline')}
                    onChange={(value) => setKey('headline', value)}
                    placeholder={draft.siteName || 'عنوان واجهة الموقع'}
                  />
                  <TextField
                    label="نص زر الإجراء والتواصل (CTA)"
                    value={text('ctaLabel')}
                    onChange={(value) => setKey('ctaLabel', value)}
                    placeholder="تواصل معنا"
                    max={40}
                  />
                </div>

                <TextField
                  label="الوصف التفصيلي"
                  value={text('description')}
                  onChange={(value) => setKey('description', value)}
                  multiline
                  placeholder="عرّف الزائر بنشاطك وما يميز خدماتك"
                />
              </Section>
            )}

            {/* 2. Template & Layout Style Section */}
            {showTemplateStyles && (
              <Section
                icon={Palette}
                title="القالب ونمط التصميم"
                subtitle="اختر نمط تخطيط الواجهة والقالب المخصص لنشاطك"
                defaultOpen
              >
                {isSingleLayoutTool ? (
                  <p
                    className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm font-medium leading-6 text-[#475569]"
                    style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#475569' }}
                  >
                    قالب هذه الخدمة التفاعلية مصمم خصيصاً لطبيعتها ولا يحتاج لتغيير النمط.
                  </p>
                ) : (
                  <div>
                    <span
                      className="mb-2 block text-xs font-extrabold text-[#0F172A]"
                      style={{ color: '#0F172A' }}
                    >
                      نمط التصميم
                    </span>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(Object.keys(STYLE_INFO) as SiteStyle[]).map((key) => {
                        const active = style === key;
                        const photos = initial.imageSupport[key];
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => {
                              setKey('templateStyle', key);
                              if (key === 'cinematic' && structure.darkMode !== true)
                                setKey('darkMode', true);
                            }}
                            className="rounded-2xl border-2 p-4 text-right transition-all"
                            style={
                              active
                                ? {
                                    backgroundColor: '#EFF6FF',
                                    borderColor: '#1D4ED8',
                                    color: '#0F172A',
                                  }
                                : {
                                    backgroundColor: '#F8FAFC',
                                    borderColor: '#CBD5E1',
                                    color: '#0F172A',
                                  }
                            }
                            aria-pressed={active}
                            data-testid={`style-${key}`}
                          >
                            <span className="flex items-center justify-between">
                              <span className="font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
                                {STYLE_INFO[key].title}
                              </span>
                              {active && (
                                <span
                                  className="grid size-5 place-items-center rounded-full bg-[#1D4ED8] text-white"
                                  style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
                                >
                                  <Check size={12} strokeWidth={3.5} />
                                </span>
                              )}
                            </span>
                            <span
                              className="mt-1 block text-xs font-medium text-[#475569]"
                              style={{ color: '#475569' }}
                            >
                              {STYLE_INFO[key].desc}
                            </span>
                            <span
                              className="mt-2.5 inline-block text-[11px] font-extrabold"
                              style={{ color: photos ? '#059669' : '#64748B' }}
                            >
                              {photos ? '● يعرض صور العناصر' : '○ بدون صور للعناصر'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {hiddenPhotos > 0 && (
                      <p
                        className="mt-3 flex items-start gap-2 rounded-xl border border-[#93C5FD] bg-[#EFF6FF] px-4 py-3 text-xs font-bold leading-6 text-[#1E3A8A]"
                        style={{ backgroundColor: '#EFF6FF', borderColor: '#93C5FD', color: '#1E3A8A' }}
                        data-testid="warning-hidden-photos"
                      >
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {hiddenPhotos} صورة لن تظهر بهذا النمط. اختر "سينمائي" أو "تطبيق جوال" إذا تبي عرضها.
                      </p>
                    )}
                  </div>
                )}
              </Section>
            )}

            {/* 3. Colors, Dark Mode, Logo & Hero Image Section */}
            {showColorsAndMedia && (
              <Section
                icon={Palette}
                title="الألوان والشعار والغلاف"
                subtitle="لون الهوية الرئيسي، الوضع الداكن، الشعار، والصورة الرئيسية"
                defaultOpen
              >
                <div>
                  <span
                    className="mb-2 block text-xs font-extrabold text-[#0F172A]"
                    style={{ color: '#0F172A' }}
                  >
                    اللون الرئيسي
                  </span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setDraft((current) => ({ ...current, themeColor: color }))}
                        aria-label={color}
                        className={`grid size-9 place-items-center rounded-full ring-offset-2 transition-all ${
                          draft.themeColor.toLowerCase() === color.toLowerCase()
                            ? 'ring-2 ring-[#0F172A]'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color, color: '#FFFFFF' }}
                      >
                        {draft.themeColor.toLowerCase() === color.toLowerCase() && (
                          <Check size={15} className="text-white" strokeWidth={3} />
                        )}
                      </button>
                    ))}
                    <label
                      className="relative grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-[#CBD5E1] text-[#475569]"
                      style={{ borderColor: '#CBD5E1', color: '#475569' }}
                      aria-label="لون مخصص"
                    >
                      <Plus size={15} />
                      <input
                        type="color"
                        value={/^#[0-9a-fA-F]{6}$/.test(draft.themeColor) ? draft.themeColor : '#1D4ED8'}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, themeColor: event.target.value }))
                        }
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                  </div>
                </div>
                <Toggle
                  checked={structure.darkMode === true}
                  onChange={(value) => setKey('darkMode', value)}
                  label="الوضع الداكن"
                  hint="يفتح الموقع بخلفية داكنة، والزائر يقدر يبدّل بنفسه."
                />
                <div className="grid gap-6 sm:grid-cols-2">
                  <ImageField
                    label="الشعار"
                    value={text('logo')}
                    onChange={(url) => setKey('logo', url)}
                  />
                  <ImageField
                    label="الصورة الرئيسية"
                    value={text('heroImage')}
                    onChange={(url) => setKey('heroImage', url)}
                  />
                </div>
              </Section>
            )}

            {/* 4. Products / Items / Questions / Services Collection Section */}
            {showProductsCollection && (
              <Section
                icon={LayoutGrid}
                title={collection.title}
                subtitle={`أضف ${collection.singular} وعدّله ورتّبه`}
                defaultOpen
                badge={
                  <span
                    className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 font-mono text-xs font-black text-[#0F172A]"
                    style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                  >
                    {list.length}
                  </span>
                }
              >
                {isSurvey && (
                  <div
                    className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-3.5"
                    style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}
                  >
                    <div>
                      <p className="text-xs font-black text-[#1E3A8A]" style={{ color: '#1E3A8A' }}>
                        أنواع الأسئلة المتنوعة المتاحة في الاستبيان:
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-[#1D4ED8]" style={{ color: '#1D4ED8' }}>
                        اختيار واحد · اختيار متعدد · تقييم بالنجوم (1-5) · مقياس توصية رقمي (1-10) · نعم/لا · سؤال نصي مفتوح
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setKey(collection.key, [
                          ...list,
                          ...(DEFAULT_SURVEY_QUESTIONS as unknown as Json[]),
                        ]);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1E40AF]"
                      style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
                      data-testid="button-insert-preset-survey-questions"
                    >
                      <Sparkles size={14} /> إدراج 5 أسئلة متنوعة جاهزة
                    </button>
                  </div>
                )}
                <Repeater
                  items={list}
                  onChange={(next) => setKey(collection.key, next)}
                  fields={collection.fields}
                  singular={collection.singular}
                  titleKeys={collection.fields[0].keys}
                  blank={() =>
                    isSurvey
                      ? {
                          name: '',
                          duration: 'choice',
                          category: 'ممتاز، جيد جداً، جيد، مقبول',
                          description: '',
                        }
                      : { [collection.fields[0].keys[0]]: '' }
                  }
                  imageNote={imageNote}
                />
              </Section>
            )}

            {/* 5. Contact & Working Hours Section */}
            {showContactAndHours && (
              <>
                <Section
                  icon={Phone}
                  title="التواصل"
                  subtitle="الأرقام والعنوان وحسابات التواصل الاجتماعي"
                  defaultOpen={focusedSection === 'contact'}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="الجوال"
                      value={nested('contact', 'phone')}
                      onChange={(value) => setNested('contact', 'phone', value)}
                      placeholder="9665XXXXXXXX"
                      ltr
                    />
                    <TextField
                      label="واتساب"
                      value={nested('contact', 'whatsapp')}
                      onChange={(value) => setNested('contact', 'whatsapp', value)}
                      placeholder="9665XXXXXXXX"
                      ltr
                      hint="يستخدم للأزرار اللي تفتح محادثة مباشرة."
                    />
                    <TextField
                      label="البريد الإلكتروني"
                      value={nested('contact', 'email')}
                      onChange={(value) => setNested('contact', 'email', value)}
                      placeholder="name@example.com"
                      ltr
                    />
                    <TextField
                      label="العنوان"
                      value={nested('contact', 'address')}
                      onChange={(value) => setNested('contact', 'address', value)}
                      placeholder="المدينة، الحي"
                    />
                  </div>
                  <div
                    className="grid gap-4 border-t border-[#E2E8F0] pt-5 sm:grid-cols-2"
                    style={{ borderColor: '#E2E8F0' }}
                  >
                    {(['instagram', 'twitter', 'facebook', 'tiktok', 'snapchat'] as const).map(
                      (platform) => (
                        <TextField
                          key={platform}
                          label={
                            {
                              instagram: 'إنستغرام',
                              twitter: 'إكس (تويتر)',
                              facebook: 'فيسبوك',
                              tiktok: 'تيك توك',
                              snapchat: 'سناب شات',
                            }[platform]
                          }
                          value={nested('socialLinks', platform)}
                          onChange={(value) => setNested('socialLinks', platform, value)}
                          placeholder="رابط الحساب أو @اسم_الحساب"
                          ltr
                        />
                      )
                    )}
                  </div>
                </Section>

                <Section
                  icon={Clock3}
                  title="ساعات العمل"
                  subtitle="أيام وأوقات الدوام"
                  defaultOpen={focusedSection === 'contact'}
                  badge={
                    <span
                      className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 font-mono text-xs font-black text-[#0F172A]"
                      style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                    >
                      {asList(structure.hours).length}
                    </span>
                  }
                >
                  <Repeater
                    items={asList(structure.hours)}
                    onChange={(next) => setKey('hours', next)}
                    singular="يوم"
                    titleKeys={['day']}
                    blank={() => ({ day: '', time: '' })}
                    max={14}
                    fields={[
                      { keys: ['day'], label: 'اليوم', placeholder: 'السبت – الخميس', half: true },
                      { keys: ['time'], label: 'الوقت', placeholder: '9 ص – 10 م', half: true },
                    ]}
                  />
                </Section>
              </>
            )}

            {/* 6. Extra Content Sections (Team, Testimonials, FAQ, Booking Steps, Portfolio Skills) */}
            {showExtraContentSections && (
              <>
                <Section
                  icon={Users}
                  title="الفريق"
                  subtitle="عرّف الزائر بمن يقف خلف النشاط"
                  badge={
                    <span
                      className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 font-mono text-xs font-black text-[#0F172A]"
                      style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                    >
                      {asList(structure.team).length}
                    </span>
                  }
                >
                  <Repeater
                    items={asList(structure.team)}
                    onChange={(next) => setKey('team', next)}
                    singular="عضو"
                    titleKeys={['name']}
                    blank={() => ({ name: '', role: '' })}
                    max={30}
                    fields={[
                      { keys: ['name'], label: 'الاسم', half: true },
                      { keys: ['role'], label: 'المسمى', half: true },
                      { keys: ['bio'], label: 'نبذة', kind: 'textarea' },
                      IMAGE,
                    ]}
                  />
                </Section>

                <Section
                  icon={Quote}
                  title="آراء العملاء"
                  subtitle="ثقة الزوار تبدأ من كلام عملائك"
                  badge={
                    <span
                      className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 font-mono text-xs font-black text-[#0F172A]"
                      style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                    >
                      {asList(structure.testimonials).length}
                    </span>
                  }
                >
                  <Repeater
                    items={asList(structure.testimonials)}
                    onChange={(next) => setKey('testimonials', next)}
                    singular="رأي"
                    titleKeys={['name']}
                    blank={() => ({ name: '', quote: '' })}
                    max={30}
                    fields={[
                      { keys: ['name'], label: 'اسم العميل' },
                      { keys: ['quote'], label: 'التعليق', kind: 'textarea' },
                    ]}
                  />
                </Section>

                <Section
                  icon={HelpCircle}
                  title="الأسئلة الشائعة"
                  subtitle="أجب مسبقًا عن أكثر ما يُسأل"
                  badge={
                    <span
                      className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 font-mono text-xs font-black text-[#0F172A]"
                      style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                    >
                      {asList(structure.faq).length}
                    </span>
                  }
                >
                  <Repeater
                    items={asList(structure.faq)}
                    onChange={(next) => setKey('faq', next)}
                    singular="سؤال"
                    titleKeys={['question']}
                    blank={() => ({ question: '', answer: '' })}
                    max={30}
                    fields={[
                      { keys: ['question'], label: 'السؤال' },
                      { keys: ['answer'], label: 'الجواب', kind: 'textarea' },
                    ]}
                  />
                </Section>

                {isBooking && (
                  <Section
                    icon={Clock3}
                    title="خطوات الحجز"
                    subtitle="اشرح للعميل كيف يتم تأكيد موعده"
                    badge={
                      <span
                        className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 font-mono text-xs font-black text-[#0F172A]"
                        style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                      >
                        {asList(structure.steps).length}
                      </span>
                    }
                  >
                    <Repeater
                      items={asList(structure.steps)}
                      onChange={(next) => setKey('steps', next)}
                      singular="خطوة"
                      titleKeys={['title']}
                      blank={() => ({ title: '', description: '' })}
                      max={12}
                      fields={[
                        { keys: ['title'], label: 'عنوان الخطوة', placeholder: 'مثال: اختر الخدمة والوقت المناسب' },
                        { keys: ['description'], label: 'تفاصيل الخطوة', kind: 'textarea' },
                      ]}
                    />
                  </Section>
                )}

                {isPortfolio && (
                  <>
                    <Section icon={Award} title="المهارات والإنجازات" subtitle="تظهر كوسوم وإحصائيات في صفحة البورتفوليو">
                      <TagsField
                        label="مهاراتك"
                        values={
                          Array.isArray(structure.skills)
                            ? (structure.skills as unknown[]).filter(
                                (value): value is string => typeof value === 'string'
                              )
                            : []
                        }
                        onChange={(values) => setKey('skills', values)}
                        placeholder="مثال: تصميم الهوية"
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                          label="عدد المشاريع المنجزة"
                          value={text('projectsCount')}
                          onChange={(value) => setKey('projectsCount', value)}
                          placeholder="مثال: +45 مشروع ناجح"
                        />
                        <TextField
                          label="اقتباس أو فلسفة العمل"
                          value={text('quote')}
                          onChange={(value) => setKey('quote', value)}
                          placeholder="مثال: التصميم الجيد يجمع بين الجمال والوظيفة"
                        />
                      </div>
                    </Section>
                    <Section
                      icon={Briefcase}
                      title="الخبرات والشهادات"
                      subtitle="مسيرتك المهنية واعتماداتك"
                      badge={
                        <span
                          className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 font-mono text-xs font-black text-[#0F172A]"
                          style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                        >
                          {asList(structure.experience).length +
                            asList(structure.certifications).length}
                        </span>
                      }
                    >
                      <p
                        className="text-xs font-extrabold text-[#0F172A]"
                        style={{ color: '#0F172A' }}
                      >
                        الخبرات العملية
                      </p>
                      <Repeater
                        items={asList(structure.experience)}
                        onChange={(next) => setKey('experience', next)}
                        singular="خبرة"
                        titleKeys={['role']}
                        blank={() => ({ role: '', company: '' })}
                        max={30}
                        fields={[
                          { keys: ['role'], label: 'المسمى', half: true },
                          { keys: ['company'], label: 'الجهة', half: true },
                          { keys: ['period'], label: 'الفترة', placeholder: '2021 – 2024', half: true },
                          { keys: ['description'], label: 'الوصف', kind: 'textarea' },
                        ]}
                      />
                      <p
                        className="border-t border-[#E2E8F0] pt-5 text-xs font-extrabold text-[#0F172A]"
                        style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
                      >
                        الشهادات
                      </p>
                      <Repeater
                        items={asList(structure.certifications)}
                        onChange={(next) => setKey('certifications', next)}
                        singular="شهادة"
                        titleKeys={['name']}
                        blank={() => ({ name: '', issuer: '' })}
                        max={30}
                        fields={[
                          { keys: ['name'], label: 'اسم الشهادة' },
                          { keys: ['issuer'], label: 'الجهة المانحة', half: true },
                          { keys: ['year'], label: 'السنة', half: true },
                        ]}
                      />
                    </Section>
                  </>
                )}
              </>
            )}

            {/* 7. Settings: Custom Slug, Service Type, and Delete Service */}
            {showSettingsFields && (
              <>
                <Section
                  icon={Type}
                  title="إعدادات الخدمة والرابط المخصص"
                  subtitle="اسم الخدمة، الرابط المخصص (Username)، ونوع القالب"
                  defaultOpen
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="اسم الموقع *"
                      value={draft.siteName}
                      onChange={(value) => setDraft((current) => ({ ...current, siteName: value }))}
                      max={80}
                      placeholder="مثال: متجر النور"
                    />
                    <TextField
                      label="الرابط المخصص للموقع (Username)"
                      value={draft.username}
                      onChange={(value) => setDraft((current) => ({ ...current, username: value }))}
                      max={32}
                      ltr
                      placeholder="al-noor-store"
                      hint={siteUrl(slugifyUsername(draft.username.trim() || draft.siteName.trim()))}
                    />
                  </div>

                  <Field label="نوع النشاط / القالب المخصص">
                    <select
                      value={draft.templateId}
                      onChange={(e) =>
                        setDraft((current) => ({ ...current, templateId: e.target.value }))
                      }
                      className={inputClass}
                      style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                    >
                      <optgroup label="1. خدمات المواقع والواجهات الرقمية">
                        <option value="store">متجر إلكتروني وسلة طلبات (Store)</option>
                        <option value="restaurant">مطعم أو مقهى ومنيو رقمي (Restaurant)</option>
                        <option value="services">موقع شركة أو مؤسسة خدمية (Corporate)</option>
                        <option value="portfolio">صفحة شخصية ومعرض أعمال (Portfolio)</option>
                        <option value="vcard">بطاقة تواصل رقمية وروابط (Bio Links)</option>
                      </optgroup>
                      <optgroup label="2. الخدمات التفاعلية والأدوات الذكية">
                        <option value="survey">استبيان واستطلاع رأي تفاعلي (Survey)</option>
                        <option value="booking">نظام حجز مواعيد واستشارات (Booking)</option>
                        <option value="rsvp">دعوة فعالية وتأكيد حضور (RSVP)</option>
                        <option value="invoice">باقات الأسعار وحاسبة عروض (Packages)</option>
                      </optgroup>
                    </select>
                  </Field>
                </Section>

                <Card
                  className="flex flex-wrap items-center justify-between gap-4 border border-[#FECDD3] bg-[#FFF1F2] p-5"
                  style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#0F172A' }}
                >
                  <div>
                    <p className="text-sm font-black text-[#BE123C]" style={{ color: '#BE123C' }}>
                      حذف الموقع نهائياً
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-[#881337]" style={{ color: '#881337' }}>
                      سيتم حذف هذا الموقع من قاعدة البيانات وإلغاء نشر رابطه العام.
                    </p>
                  </div>
                  {confirmDeleteSite ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={deleteSite.isPending}
                        onClick={() => {
                          deleteSite.mutate(initial.username, {
                            onSuccess: () => {
                              if (onDeleted) {
                                onDeleted();
                              } else {
                                navigate('/dashboard');
                              }
                            },
                          });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#BE123C] px-4 py-2 text-xs font-bold text-white hover:bg-[#9F1239]"
                        style={{ backgroundColor: '#BE123C', color: '#FFFFFF' }}
                        data-testid="button-confirm-delete-site"
                      >
                        <Trash2 size={14} />
                        <span>{deleteSite.isPending ? 'جارٍ الحذف...' : 'نعم، احذف الموقع نهائياً'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSite(false)}
                        className="rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-bold text-[#334155]"
                        style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#334155' }}
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteSite(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#FECDD3] bg-white px-4 py-2 text-xs font-bold text-[#BE123C] hover:bg-[#FFE4E6]"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#FECDD3', color: '#BE123C' }}
                      data-testid="button-delete-site"
                    >
                      <Trash2 size={14} />
                      <span>حذف الموقع</span>
                    </button>
                  )}
                </Card>
              </>
            )}

            {/* Focused Mode Bottom Action Footer */}
            {onBackToChat && (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#CBD5E1] bg-white p-4 shadow-sm"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
              >
                <button
                  type="button"
                  onClick={() => onBackToChat()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-xs font-extrabold text-[#0F172A] hover:bg-[#E2E8F0]"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                >
                  <ArrowRight size={15} />
                  <span>العودة للمحادثة</span>
                </button>
                <button
                  type="button"
                  onClick={() => doSave(true)}
                  disabled={save.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#1E40AF] disabled:opacity-50"
                  style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
                  data-testid="button-footer-save-and-return"
                >
                  {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  <span>{dirty ? 'حفظ التعديلات والعودة للمحادثة' : 'انتهيت — العودة للمحادثة'}</span>
                </button>
              </div>
            )}
          </fieldset>

          {!focusedSection && (
            <aside className="hidden w-[348px] shrink-0 xl:block" aria-label="معاينة">
              <div
                className="sticky top-28 rounded-2xl border border-[#CBD5E1] bg-white p-4 shadow-md"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
              >
                <p
                  className="mb-3 flex items-center gap-2 text-xs font-black text-[#0F172A]"
                  style={{ color: '#0F172A' }}
                >
                  <Smartphone size={16} style={{ color: '#1D4ED8' }} /> معاينة الموقع الحية
                </p>
                <div
                  className="mx-auto h-[600px] w-[308px] overflow-hidden rounded-[40px] border-[8px] border-[#0B132B] bg-white shadow-xl"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#0B132B' }}
                >
                  <iframe
                    key={previewKey}
                    src={`${url}?_=${previewKey}`}
                    title="معاينة الموقع"
                    className="size-full"
                    loading="lazy"
                  />
                </div>
                <p
                  className="mt-3 text-center text-xs font-medium text-[#64748B]"
                  style={{ color: '#64748B' }}
                >
                  تتحدث المعاينة فورياً بعد كل حفظ.
                </p>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

export interface SiteEditorProps {
  forcedUsername?: string;
  forcedTab?: 'editor' | 'results';
  focusedSection?: StudioActivePanel;
  onBackToChat?: (savedSectionLabel?: string) => void;
  onDeleted?: () => void;
  hideSiteSwitcher?: boolean;
}

export default function SiteEditor({
  forcedUsername,
  forcedTab,
  focusedSection,
  onBackToChat,
  onDeleted,
  hideSiteSwitcher = false,
}: SiteEditorProps = {}) {
  const accountQuery = useAccount();
  const [selectedUsername, setSelectedUsername] = useState<string | undefined>(() =>
    forcedUsername || getActiveSiteUsername() || undefined
  );
  useEffect(() => {
    if (forcedUsername) {
      setSelectedUsername(forcedUsername);
    }
  }, [forcedUsername]);

  const effectiveUsername = forcedUsername || selectedUsername;
  const query = useSiteDocument(effectiveUsername);
  const [epoch, setEpoch] = useState(0);

  const allSites = accountQuery.data?.websites ?? (accountQuery.data?.website ? [accountQuery.data.website] : []);

  if (query.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div
          className="h-16 animate-pulse rounded-2xl border border-[#CBD5E1] bg-white"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
        />
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-[#CBD5E1] bg-white"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
          />
        ))}
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <Card className="px-6 py-16 text-center" data-testid="editor-empty">
        <span
          className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
          style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
        >
          <LayoutGrid size={28} />
        </span>
        <h2 className="text-xl font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
          لا يوجد موقع لتحريره حالياً
        </h2>
        <p
          className="mx-auto mt-2 max-w-sm text-sm font-medium leading-7 text-[#475569]"
          style={{ color: '#475569' }}
        >
          أنشئ موقعك أولاً من قسم الخدمات ثم ارجع هنا لإضافة المحتوى والصور وتخصيص المظهر.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#1D4ED8] px-5 text-sm font-bold text-white transition-colors hover:bg-[#1E40AF]"
          style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
        >
          رجوع إلى الاستوديو
        </Link>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {!hideSiteSwitcher && !focusedSection && allSites.length > 1 && (
        <Card
          className="flex flex-wrap items-center justify-between gap-3 border border-[#CBD5E1] bg-white px-4 py-3"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
          data-testid="studio-site-switcher"
        >
          <span className="text-xs font-extrabold text-[#0F172A]" style={{ color: '#0F172A' }}>
            اختر الموقع أو الخدمة للتحرير وعرض النتائج ({allSites.length} مواقع محفوظة):
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {allSites.map((site) => {
              const active = site.username === query.data.username;
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => {
                    setActiveSiteUsername(site.username);
                    setSelectedUsername(site.username);
                    setEpoch((v) => v + 1);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all"
                  style={
                    active
                      ? { backgroundColor: '#0B132B', borderColor: '#0B132B', color: '#FFFFFF' }
                      : { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }
                  }
                  data-testid={`switch-site-${site.username}`}
                >
                  <span>{site.siteName}</span>
                  {typeof site.submissionsCount === 'number' && site.submissionsCount > 0 && (
                    <span
                      className="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-black"
                      style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
                    >
                      {site.submissionsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}
      <EditorForm
        key={`${query.data.id}:${epoch}:${focusedSection || 'full'}`}
        initial={query.data}
        forcedTab={forcedTab}
        focusedSection={focusedSection}
        onBackToChat={onBackToChat}
        onDeleted={onDeleted}
        onReload={() => {
          void query.refetch().then(() => setEpoch((value) => value + 1));
        }}
      />
    </div>
  );
}
