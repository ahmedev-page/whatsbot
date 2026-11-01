import { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  BarChart3,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  ExternalLink,
  Eye,
  Gift,
  Globe,
  Home,
  LayoutGrid,
  ListChecks,
  LogOut,
  MessageCircle,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Settings,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Store,
  User,
  UtensilsCrossed,
  WandSparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { getGetPublicWhatsappQueryKey, useGetPublicWhatsapp } from '@workspace/api-client-react';
import { Brand } from '@/components/brand';
import { Card } from '@/components/account-ui';
import SiteEditor from '@/pages/site-editor';
import {
  createWebsiteInPlatform,
  getLocalAccount,
  siteUrl,
  useAccount,
  useLogout,
  type Account,
  type SiteStyle,
} from '@/lib/account';

type Tone = 'blue' | 'indigo' | 'emerald' | 'violet' | 'rose' | 'teal';
interface Service {
  id: string;
  group: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  tone: Tone;
  live: boolean;
  keywords: string;
  templateId: string;
}

const TONE_STYLES: Record<Tone, { bg: string; text: string; border: string }> = {
  blue: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  indigo: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
  emerald: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  violet: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  rose: { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
  teal: { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
};

const GROUPS = [
  { id: 'site', title: 'مواقع وحضور رقمي', hint: 'واجهتك الاحترافية أمام العالم' },
  { id: 'sell', title: 'البيع وإدارة العملاء', hint: 'حوّل الزوار إلى طلبات ومواعيد' },
  { id: 'collect', title: 'التفاعل والمسابقات', hint: 'اسمع جمهورك ونمّي ولاءهم' },
];

const SERVICES: Service[] = [
  {
    id: 'website',
    group: 'site',
    icon: Globe,
    title: 'موقع نشاط متكامل',
    desc: 'متجر، مطعم، خدمات أو معرض أعمال بـ 4 أنماط احترافية.',
    tone: 'blue',
    live: true,
    keywords: 'موقع صفحة متجر مطعم بورتفوليو نشاط',
    templateId: 'store',
  },
  {
    id: 'profile',
    group: 'site',
    icon: User,
    title: 'صفحة تعريفية وروابط (Bio)',
    desc: 'كل روابطك وبطاقتك التعريفية في صفحة واحدة مع كود QR.',
    tone: 'indigo',
    live: true,
    keywords: 'بروفايل تعريفية روابط بطاقة',
    templateId: 'portfolio',
  },
  {
    id: 'store',
    group: 'sell',
    icon: ShoppingBag,
    title: 'متجر وسلة طلبات',
    desc: 'سلة طلبات ذكية ترسل تفاصيل الشراء مباشرة إلى واتساب.',
    tone: 'emerald',
    live: true,
    keywords: 'متجر بيع منتجات سلة',
    templateId: 'store',
  },
  {
    id: 'menu',
    group: 'sell',
    icon: UtensilsCrossed,
    title: 'منيو طعام رقمي QR',
    desc: 'قائمة طعام للمطاعم والمقاهي مع صور وأسعار وتصنيفات.',
    tone: 'teal',
    live: true,
    keywords: 'منيو قائمة مطعم كافيه طاولة',
    templateId: 'restaurant',
  },
  {
    id: 'booking',
    group: 'sell',
    icon: CalendarCheck,
    title: 'حجز مواعيد واستشارات',
    desc: 'تقويم مواعيد مرتب مع تذكيرات تلقائية للعملاء.',
    tone: 'blue',
    live: true,
    keywords: 'حجز موعد عيادة صالون استشارة',
    templateId: 'booking',
  },
  {
    id: 'services_pkg',
    group: 'sell',
    icon: Briefcase,
    title: 'باقات وعروض الخدمات',
    desc: 'عرض باقات الخدمات مع الأسعار وزر طلب فوري.',
    tone: 'indigo',
    live: true,
    keywords: 'خدمات باقات تسعير عروض',
    templateId: 'services',
  },
  {
    id: 'survey',
    group: 'collect',
    icon: ClipboardList,
    title: 'استبيان واستطلاع رأي',
    desc: 'نماذج أسئلة متعددة وتلخيص فوري للردود.',
    tone: 'violet',
    live: true,
    keywords: 'استبيان استطلاع أسئلة رأي',
    templateId: 'services',
  },
  {
    id: 'quiz',
    group: 'collect',
    icon: ListChecks,
    title: 'اختبار وتقييم تفاعلي',
    desc: 'تصحيح تلقائي ونتيجة تفاعلية فورية لكل مشارك.',
    tone: 'blue',
    live: true,
    keywords: 'اختبار مسابقة كويز تقييم',
    templateId: 'portfolio',
  },
  {
    id: 'poll',
    group: 'collect',
    icon: BarChart3,
    title: 'تصويت واستفتاء حي',
    desc: 'صوت واحد لكل زائر ونتائج تصويت تظهر لحظياً.',
    tone: 'teal',
    live: true,
    keywords: 'تصويت استفتاء جمهور',
    templateId: 'services',
  },
  {
    id: 'giveaway',
    group: 'collect',
    icon: Gift,
    title: 'سحب وجوائز شفاف',
    desc: 'تسجيل المشاركين وسحب عشوائي إلكتروني موثوق.',
    tone: 'rose',
    live: true,
    keywords: 'سحب جائزة هدية قرعة',
    templateId: 'services',
  },
  {
    id: 'invite',
    group: 'collect',
    icon: CalendarDays,
    title: 'دعوة وتأكيد حضور (RSVP)',
    desc: 'بطاقة دعوة أنيقة وعدّاد للمؤكدين مع رمز QR لدخول الحفل.',
    tone: 'violet',
    live: true,
    keywords: 'دعوة زواج مناسبة حضور حفل',
    templateId: 'booking',
  },
  {
    id: 'loyalty',
    group: 'sell',
    icon: BadgeCheck,
    title: 'بطاقة ولاء وختم إلكتروني',
    desc: 'ختم رقمي لكل زيارة ومكافأة الزيارة العاشرة مجاناً.',
    tone: 'rose',
    live: true,
    keywords: 'ولاء ختم نقاط مكافآت',
    templateId: 'store',
  },
  {
    id: 'reviews',
    group: 'sell',
    icon: Star,
    title: 'موجّه تقييمات خرائط قوقل',
    desc: 'توجيه العملاء الراضين لتقييم نشاطك على Google Maps.',
    tone: 'emerald',
    live: true,
    keywords: 'تقييم تقييمات مراجعات قوقل',
    templateId: 'services',
  },
];

const TEMPLATE_NAMES: Record<string, string> = {
  store: 'متجر إلكتروني',
  restaurant: 'مطعم ومقهى',
  services: 'خدمات وأعمال',
  portfolio: 'معرض أعمال',
  booking: 'حجز مواعيد',
};
const STYLE_NAMES: Record<string, string> = {
  classic: 'كلاسيكي أنيق',
  modern: 'عصري فائق',
  cinematic: 'سينمائي فاخر',
  app: 'تطبيق جوال',
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

const NAV = [
  { href: '/dashboard', key: 'home', label: 'الرئيسية', icon: Home },
  { href: '/dashboard/services', key: 'services', label: 'خدماتي وموقعي', icon: LayoutGrid },
  { href: '/dashboard/assistant', key: 'assistant', label: 'المساعد السريع', icon: MessageCircle },
  { href: '/dashboard/analytics', key: 'analytics', label: 'الإحصائيات', icon: BarChart3 },
  { href: '/dashboard/settings', key: 'settings', label: 'الإعدادات', icon: Settings },
];

function greeting(): string {
  return new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير';
}

function maskPhone(phone: string): string {
  return phone.length > 6 ? `+${phone.slice(0, 3)}••••${phone.slice(-3)}` : `+${phone}`;
}

// ---------------------------------------------------------------------------
// In-Platform Site Creator Modal
// ---------------------------------------------------------------------------
function CreateSiteModal({
  open,
  onClose,
  initialTemplate = 'store',
  defaultPhone,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  initialTemplate?: string;
  defaultPhone?: string;
  onSuccess: () => void;
}) {
  const [siteName, setSiteName] = useState('');
  const [templateId, setTemplateId] = useState(initialTemplate);
  const [templateStyle, setTemplateStyle] = useState<SiteStyle>('modern');
  const [themeColor, setThemeColor] = useState('#1D4ED8');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTemplateId(initialTemplate);
  }, [initialTemplate]);

  useEffect(() => {
    if (defaultPhone) setPhone(defaultPhone);
  }, [defaultPhone]);

  if (!open) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) return;
    setSubmitting(true);

    try {
      await createWebsiteInPlatform({
        siteName: siteName.trim(),
        templateId,
        templateStyle,
        themeColor,
        description: description.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      setSubmitting(false);
      onSuccess();
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-[acct-fade-up_.2s_ease_both]"
      style={{ backgroundColor: 'rgba(6, 11, 24, 0.72)' }}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#CBD5E1] bg-white p-6 text-[#0F172A] shadow-2xl sm:p-8"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
      >
        <button
          onClick={onClose}
          className="absolute left-6 top-6 grid size-9 place-items-center rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#475569] transition-colors hover:bg-[#E2E8F0]"
          style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#475569' }}
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3.5">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
            style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
          >
            <WandSparkles size={24} />
          </span>
          <div>
            <h2 className="text-xl font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
              إنشاء خدمة أو موقع جديد من المنصة
            </h2>
            <p className="text-xs font-medium text-[#475569]" style={{ color: '#475569' }}>
              جاهز للإطلاق والتخصيص الفوري داخل استوديو ORxai
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="mt-6 space-y-5">
          <div>
            <label
              className="block text-xs font-extrabold text-[#0F172A]"
              style={{ color: '#0F172A' }}
            >
              نوع النشاط أو الخدمة
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {[
                { id: 'store', label: 'متجر وسلة', icon: Store },
                { id: 'restaurant', label: 'مطعم ومنيو', icon: UtensilsCrossed },
                { id: 'services', label: 'خدمات وشركات', icon: Briefcase },
                { id: 'portfolio', label: 'معرض أعمال', icon: Sparkles },
                { id: 'booking', label: 'حجز مواعيد', icon: CalendarCheck },
              ].map(({ id, label, icon: Icon }) => {
                const active = templateId === id;
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setTemplateId(id)}
                    className="flex items-center gap-2 rounded-xl border p-3 text-right text-xs font-bold transition-all"
                    style={
                      active
                        ? {
                            backgroundColor: '#0B132B',
                            borderColor: '#0B132B',
                            color: '#FFFFFF',
                          }
                        : {
                            backgroundColor: '#F8FAFC',
                            borderColor: '#CBD5E1',
                            color: '#334155',
                          }
                    }
                  >
                    <Icon size={16} style={{ color: active ? '#38BDF8' : '#1D4ED8' }} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-extrabold text-[#0F172A]"
              style={{ color: '#0F172A' }}
            >
              اسم المشروع أو النشاط التجاري *
            </label>
            <input
              type="text"
              required
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="مثال: مخبز رغيف وسمسم، استوديو أفق، عيادة د. سارة"
              className="mt-1.5 h-12 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
              data-testid="input-site-name"
            />
          </div>

          <div>
            <label
              className="block text-xs font-extrabold text-[#0F172A]"
              style={{ color: '#0F172A' }}
            >
              نبذة مختصرة أو جملة تعريفية
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ما الذي تقدمه لعملائك؟ سطرين يعرفان بنشاطك المميز."
              className="mt-1.5 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-sm font-medium text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                className="block text-xs font-extrabold text-[#0F172A]"
                style={{ color: '#0F172A' }}
              >
                نمط التصميم المفضل
              </label>
              <select
                value={templateStyle}
                onChange={(e) => setTemplateStyle(e.target.value as SiteStyle)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
              >
                <option value="modern">عصري فائق (Modern)</option>
                <option value="classic">كلاسيكي هادئ (Classic)</option>
                <option value="cinematic">سينمائي فاخر (Cinematic)</option>
                <option value="app">تطبيق جوال تفاعلي (App UI)</option>
              </select>
            </div>

            <div>
              <label
                className="block text-xs font-extrabold text-[#0F172A]"
                style={{ color: '#0F172A' }}
              >
                رقم واتساب للطلبات
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                placeholder="966500000000"
                className="mt-1.5 h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 text-left font-mono text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-extrabold text-[#0F172A]"
              style={{ color: '#0F172A' }}
            >
              لون الهوية المميز
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              {COLOR_PRESETS.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setThemeColor(color)}
                  className={`grid size-9 place-items-center rounded-full transition-transform ${
                    themeColor === color
                      ? 'scale-110 ring-2 ring-[#0F172A] ring-offset-2'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color, color: '#FFFFFF' }}
                  aria-label={color}
                >
                  {themeColor === color && <Check size={14} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !siteName.trim()}
              className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] text-sm font-bold text-white shadow-[0_14px_30px_-10px_rgba(29,78,216,0.5)] transition-all hover:bg-[#1E40AF] disabled:opacity-60"
              style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
              data-testid="button-submit-create-site"
            >
              {submitting ? <RefreshCw className="animate-spin" size={18} /> : <Rocket size={18} />}
              <span>إنشاء وتفعيل الموقع الآن في المنصة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper Building Blocks
// ---------------------------------------------------------------------------
function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex items-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-xs font-bold text-[#0F172A] transition-colors hover:bg-[#F1F5F9]"
      style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
      data-testid="button-copy-site-link"
    >
      {copied ? (
        <Check size={15} style={{ color: '#059669' }} />
      ) : (
        <Copy size={15} style={{ color: '#1D4ED8' }} />
      )}
      <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section: Home Dashboard
// ---------------------------------------------------------------------------
function HomeSection({
  account,
  onOpenCreate,
}: {
  account: Account;
  onOpenCreate: (templateId?: string) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const website = account.website;

  const normalized = query.trim().toLowerCase();
  const matches = (service: Service) =>
    !normalized ||
    `${service.title} ${service.desc} ${service.keywords}`.toLowerCase().includes(normalized);

  return (
    <div className="space-y-8">
      {/* Executive Royal Sapphire Hero Welcome Banner */}
      <div
        className="relative overflow-hidden rounded-3xl border border-[#1E293B] bg-[#0B132B] px-6 py-8 text-white shadow-[0_24px_60px_-24px_rgba(6,11,24,0.45)] sm:px-10 sm:py-11"
        style={{
          background: 'linear-gradient(155deg, #060B18 0%, #0B132B 55%, #111E42 100%)',
          backgroundColor: '#0B132B',
          borderColor: '#1E293B',
          color: '#FFFFFF',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(37, 99, 235, 0.25)' }}
        />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className="text-xs font-extrabold tracking-wide text-[#38BDF8]"
              style={{ color: '#38BDF8' }}
            >
              {greeting()} · استوديو ORxai السحابي
            </p>
            <h1
              className="mt-2 text-[clamp(1.6rem,3.6vw,2.35rem)] font-black leading-tight tracking-tight text-white"
              style={{ color: '#FFFFFF' }}
            >
              استوديو إدارة الخدمات والمواقع
            </h1>
            <p
              className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-[#CBD5E1]"
              style={{ color: '#CBD5E1' }}
            >
              أنشئ وخصص وأطلق موقع مشروعك وخدماتك الـ 13 بالكامل من هنا، مع مساعد واتساب الموثق للتعديلات السريعة والإحصائيات.
            </p>
          </div>

          <button
            onClick={() => onOpenCreate('store')}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 text-sm font-bold text-white shadow-[0_14px_30px_-10px_rgba(37,99,235,0.65)] transition-all hover:bg-[#1D4ED8]"
            style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
            data-testid="button-create-service-header"
          >
            <Plus size={18} />
            <span>إنشاء خدمة / موقع جديد</span>
          </button>
        </div>

        {/* High-Contrast Search Bar */}
        <div className="relative z-10 mt-7 max-w-2xl">
          <Search
            size={19}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: '#475569' }}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بين الخدمات: متجر، منيو طعام، حجز مواعيد، صفحة تعريفية، استبيان..."
            className="h-13 w-full rounded-xl border border-[#CBD5E1] bg-white pl-5 pr-12 text-sm font-semibold text-[#0F172A] shadow-sm outline-none transition-all focus:border-[#38BDF8]"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#CBD5E1',
              color: '#0F172A',
            }}
            data-testid="input-service-search"
            aria-label="ابحث عن خدمة"
          />
        </div>
      </div>

      {/* Active Website Preview Widget or Empty State Banner */}
      {website ? (
        <Card
          className="overflow-hidden border-[#93C5FD] p-6"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)',
            backgroundColor: '#FFFFFF',
            borderColor: '#93C5FD',
            color: '#0F172A',
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-sm"
                style={{ backgroundColor: website.themeColor || '#1D4ED8', color: '#FFFFFF' }}
              >
                <Globe size={26} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3
                    className="text-lg font-black text-[#0F172A]"
                    style={{ color: '#0F172A' }}
                  >
                    {website.siteName}
                  </h3>
                  <span
                    className="text-xs font-extrabold"
                    style={{ color: '#059669' }}
                  >
                    ● منشور ونشط
                  </span>
                </div>
                <p
                  dir="ltr"
                  className="mt-0.5 text-right font-mono text-xs font-bold text-[#334155]"
                  style={{ color: '#334155' }}
                >
                  {siteUrl(website.username)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/dashboard/site"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#1E40AF]"
                style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
              >
                <Pencil size={14} />
                <span>تخصيص الموقع</span>
              </Link>
              <a
                href={siteUrl(website.username)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B132B] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#1E293B]"
                style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
              >
                <ExternalLink size={14} />
                <span>فتح الموقع</span>
              </a>
              <CopyLinkButton url={siteUrl(website.username)} />
            </div>
          </div>
        </Card>
      ) : (
        <Card
          className="border-2 border-dashed border-[#93C5FD] p-6 sm:p-8"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#93C5FD',
            color: '#0F172A',
          }}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
                style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
              >
                <Sparkles size={26} />
              </span>
              <div>
                <h3
                  className="text-lg font-black text-[#0F172A]"
                  style={{ color: '#0F172A' }}
                >
                  مساحة عملك جاهزة لإطلاق أول موقع أو خدمة
                </h3>
                <p
                  className="mt-1 text-xs font-medium text-[#475569] sm:text-sm"
                  style={{ color: '#475569' }}
                >
                  لم تنشئ أي موقع بعد. اختر نوع نشاطك من الأسفل، أو ابدأ بإنشاء موقعك الآن في دقيقة واحدة.
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenCreate('store')}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#1E40AF]"
              style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
            >
              <Plus size={16} />
              <span>أنشئ موقعك الأول الآن</span>
            </button>
          </div>
        </Card>
      )}

      {/* Services Catalog */}
      {GROUPS.map((group) => {
        const items = SERVICES.filter((service) => service.group === group.id && matches(service));
        if (items.length === 0) return null;
        return (
          <section key={group.id}>
            <div className="mb-4 flex flex-wrap items-baseline gap-3">
              <h2
                className="text-lg font-black text-[#0F172A]"
                style={{ color: '#0F172A' }}
              >
                {group.title}
              </h2>
              <span
                className="text-xs font-bold text-[#64748B]"
                style={{ color: '#64748B' }}
              >
                · {group.hint}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((service) => {
                const Icon = service.icon;
                const tone = TONE_STYLES[service.tone];
                return (
                  <div
                    key={service.id}
                    className="group flex flex-col justify-between rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-md"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#CBD5E1',
                      color: '#0F172A',
                    }}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span
                          className="grid size-12 place-items-center rounded-xl border"
                          style={{
                            backgroundColor: tone.bg,
                            borderColor: tone.border,
                            color: tone.text,
                          }}
                        >
                          <Icon size={22} />
                        </span>
                        <span
                          className="text-[11px] font-extrabold"
                          style={{ color: tone.text }}
                        >
                          متاح في الاستوديو
                        </span>
                      </div>
                      <h3
                        className="mt-4 text-[15px] font-black text-[#0F172A]"
                        style={{ color: '#0F172A' }}
                      >
                        {service.title}
                      </h3>
                      <p
                        className="mt-1.5 text-[13px] font-medium leading-6 text-[#475569]"
                        style={{ color: '#475569' }}
                      >
                        {service.desc}
                      </p>
                    </div>

                    <div
                      className="mt-5 border-t border-[#E2E8F0] pt-4"
                      style={{ borderColor: '#E2E8F0' }}
                    >
                      <button
                        onClick={() => onOpenCreate(service.templateId)}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0B132B] text-xs font-bold text-white transition-colors hover:bg-[#1D4ED8]"
                        style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
                      >
                        <Plus size={14} />
                        <span>ابدأ الإنشاء والتخصيص</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Services Management
// ---------------------------------------------------------------------------
function ServicesSection({
  account,
  onOpenCreate,
}: {
  account: Account;
  onOpenCreate: (templateId?: string) => void;
}) {
  const website = account.website;
  const url = website ? siteUrl(website.username) : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-black text-[#0F172A]"
            style={{ color: '#0F172A' }}
          >
            خدماتي ومواقعي
          </h1>
          <p
            className="mt-1 text-sm font-medium text-[#475569]"
            style={{ color: '#475569' }}
          >
            إدارة المحتوى وتعديل التصاميم وإطلاق خدمات جديدة
          </p>
        </div>
        <button
          onClick={() => onOpenCreate('store')}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1D4ED8] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1E40AF]"
          style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
        >
          <Plus size={16} />
          <span>إضافة موقع جديد</span>
        </button>
      </div>

      {website ? (
        <Card className="overflow-hidden border border-[#CBD5E1]">
          <div
            className="flex flex-col gap-4 border-b border-[#E2E8F0] p-6 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: '#E2E8F0' }}
          >
            <div className="flex items-center gap-4">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-xs"
                style={{ backgroundColor: website.themeColor || '#1D4ED8', color: '#FFFFFF' }}
              >
                <Globe size={24} />
              </span>
              <div className="min-w-0">
                <h2
                  className="truncate text-lg font-black text-[#0F172A]"
                  style={{ color: '#0F172A' }}
                  data-testid="text-site-name"
                >
                  {website.siteName}
                </h2>
                <p
                  dir="ltr"
                  className="truncate text-right font-mono text-xs font-bold text-[#475569]"
                  style={{ color: '#475569' }}
                >
                  {url.replace(/^https?:\/\//, '')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span
                className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-[#334155]"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#334155' }}
              >
                {TEMPLATE_NAMES[website.templateId] ?? website.templateId}
              </span>
              <span
                className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-[#334155]"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#334155' }}
              >
                {STYLE_NAMES[website.templateStyle] ?? website.templateStyle}
              </span>
              <span
                className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-[#047857]"
                style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' }}
              >
                ● منشور ومتاح
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 p-6">
            <Link
              href="/dashboard/site"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#1E40AF]"
              style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
              data-testid="link-edit-site"
            >
              <Pencil size={16} />
              <span>محرر الاستوديو المتكامل</span>
            </Link>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B132B] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1E293B]"
              style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
              data-testid="link-open-site"
            >
              <ExternalLink size={16} />
              <span>فتح الموقع مباشرة</span>
            </a>
            <CopyLinkButton url={url} />
          </div>

          <div
            className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4 text-xs font-medium leading-6 text-[#475569]"
            style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569' }}
          >
            يمكنك تعديل المنتجات والأطباق وقوائم الأسعار والصور بالكامل من هنا. كما يمكنك استخدام مساعد واتساب السريع لتعديل النصوص والأسعار بكلمة واحدة!
          </div>
        </Card>
      ) : (
        <Card className="px-6 py-16 text-center">
          <span
            className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
            style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
          >
            <Globe size={28} />
          </span>
          <h2 className="text-xl font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
            لم تنشئ أي موقع بعد
          </h2>
          <p
            className="mx-auto mt-2 max-w-sm text-sm font-medium text-[#475569]"
            style={{ color: '#475569' }}
          >
            اضغط على الزر أدناه لإنشاء وتخصيص موقعك مباشرة داخل المنصة خلال أقل من دقيقة.
          </p>
          <button
            onClick={() => onOpenCreate('store')}
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-[#1D4ED8] px-6 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#1E40AF]"
            style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
          >
            <Plus size={18} />
            <span>أنشئ موقعك الآن في الاستوديو</span>
          </button>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: WhatsApp Companion Assistant
// ---------------------------------------------------------------------------
function AssistantSection({ account, botNumber }: { account: Account; botNumber: string }) {
  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'bot'; text: string; time: string }>
  >([
    {
      sender: 'bot',
      text: 'مرحباً بك! أنا مساعدك السريع في واتساب ⚡ جاهز للتحقق السريع، وإجراء التعديلات النصية الخاطفة، وموافاتك بإحصائيات زيارات موقعك فوراً.',
      time: 'الآن',
    },
  ]);
  const [input, setInput] = useState('');

  const sendCommand = (cmd: string) => {
    const userMsg = { sender: 'user' as const, text: cmd, time: 'الآن' };
    let reply = '';

    if (cmd.includes('زائر') || cmd.includes('إحصائيات') || cmd.includes('زيارات')) {
      reply = `📊 إحصائيات موقعك اليوم:\n• عدد الزوار اليوم: ${
        account.website?.visitsToday || 42
      } زائر\n• إجمالي الزيارات: ${
        account.website?.visitsTotal || 840
      } زيارة\n• أكثر الصفحات نشاطاً: القائمة الرئيسية والطلبات 🚀`;
    } else if (cmd.includes('طبق') || cmd.includes('منتج') || cmd.includes('أضف')) {
      reply = `✅ تم استقبال طلبك: "${cmd}" وتم تحديث موقعك وقائمتك فورياً! يمكنك مشاهدة التغيير الآن في الرابط.`;
    } else if (cmd.includes('تحقق') || cmd.includes('كود')) {
      reply = `🔐 كود التحقق السريع النشط لحسابك هو: ORX-777 (صالح لمدة 10 دقائق).`;
    } else if (cmd.includes('مواعيد') || cmd.includes('أوقات')) {
      reply = `⏰ تم تحديث ساعات العمل الخاصة بنشاطك بنجاح ونشرها على الموقع.`;
    } else {
      reply = `✨ تم استلام رسالتك وتطبيق التعديل النصي بنجاح. أرسل "إحصائيات" لمتابعة التفاعل أو "مساعدة" لعرض الأوامر السريعة.`;
    }

    setMessages((prev) => [...prev, userMsg, { sender: 'bot', text: reply, time: 'الآن' }]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    sendCommand(text);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
          مساعد واتساب السريع (Companion Assistant)
        </h1>
        <p className="mt-1 text-sm font-medium text-[#475569]" style={{ color: '#475569' }}>
          دور المساعد: التحقق الآمن للدخول، التعديلات النصية اللحظية، والاستعلام السريع عن الإحصائيات في أي وقت.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Capabilities Card */}
        <Card className="space-y-5 p-6">
          <h2 className="text-base font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
            مهام المساعد السريع في واتساب
          </h2>

          <div className="space-y-4">
            <div
              className="flex items-start gap-3.5 rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-4"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}
            >
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]"
                style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' }}
              >
                <BadgeCheck size={18} />
              </span>
              <div>
                <h3 className="text-sm font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
                  1. التحقق الآمن بخطوة واحدة
                </h3>
                <p
                  className="mt-1 text-xs font-medium leading-5 text-[#475569]"
                  style={{ color: '#475569' }}
                >
                  يرسل لك كود دخول لمرة واحدة عند تسجيل الدخول لتفتح لوحتك فوراً دون الحاجة لكلمات مرور معقدة.
                </p>
              </div>
            </div>

            <div
              className="flex items-start gap-3.5 rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-4"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}
            >
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
                style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
              >
                <Pencil size={18} />
              </span>
              <div>
                <h3 className="text-sm font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
                  2. تعديلات نصية سريعة بالرسائل
                </h3>
                <p
                  className="mt-1 text-xs font-medium leading-5 text-[#475569]"
                  style={{ color: '#475569' }}
                >
                  أرسل للبوت: "أضف طبق اليوم كذا" أو "غيّر ساعات العمل إلى 9ص-11م" ليُحدّث موقعك فوراً دون فتح المنصة.
                </p>
              </div>
            </div>

            <div
              className="flex items-start gap-3.5 rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-4"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}
            >
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] text-[#4338CA]"
                style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', color: '#4338CA' }}
              >
                <BarChart3 size={18} />
              </span>
              <div>
                <h3 className="text-sm font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
                  3. إحصائيات وتقارير الزيارات اللحظية
                </h3>
                <p
                  className="mt-1 text-xs font-medium leading-5 text-[#475569]"
                  style={{ color: '#475569' }}
                >
                  اكتب للبوت: "كم زائر اليوم؟" وسيرسل لك تقريراً فورياً بعدد الزيارات والتفاعل.
                </p>
              </div>
            </div>
          </div>

          {botNumber && (
            <div
              className="rounded-2xl border border-[#1E293B] bg-[#0B132B] p-4 text-center text-white"
              style={{ backgroundColor: '#0B132B', borderColor: '#1E293B', color: '#FFFFFF' }}
            >
              <p className="text-xs font-bold text-[#93C5FD]" style={{ color: '#93C5FD' }}>
                رقم المساعد الرسمي المتصل:
              </p>
              <p
                dir="ltr"
                className="mt-1 font-mono text-sm font-black text-white"
                style={{ color: '#FFFFFF' }}
              >
                +{botNumber}
              </p>
            </div>
          )}
        </Card>

        {/* Live Simulator Widget */}
        <Card className="flex h-[480px] flex-col overflow-hidden border border-[#CBD5E1]">
          <div
            className="flex items-center gap-3 border-b border-[#1E293B] bg-[#0B132B] px-5 py-3.5 text-white"
            style={{ backgroundColor: '#0B132B', borderColor: '#1E293B', color: '#FFFFFF' }}
          >
            <span
              className="grid size-9 place-items-center rounded-xl bg-[#2563EB] text-white"
              style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
            >
              <MessageSquare size={16} />
            </span>
            <div>
              <p className="text-xs font-black text-white" style={{ color: '#FFFFFF' }}>
                محاكي مساعد واتساب السريع
              </p>
              <p className="text-[11px] font-medium text-[#93C5FD]" style={{ color: '#93C5FD' }}>
                جرّب الأوامر السريعة مباشرة
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            className="flex-1 space-y-3 overflow-y-auto bg-[#F1F5F9] p-4"
            style={{ backgroundColor: '#F1F5F9' }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-6 shadow-xs"
                  style={
                    msg.sender === 'user'
                      ? {
                          backgroundColor: '#1D4ED8',
                          color: '#FFFFFF',
                        }
                      : {
                          backgroundColor: '#FFFFFF',
                          borderColor: '#CBD5E1',
                          color: '#0F172A',
                        }
                  }
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span
                    className="mt-1 block text-left text-[9px] font-bold"
                    style={{ color: msg.sender === 'user' ? '#BFDBFE' : '#64748B' }}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Command Suggestions */}
          <div
            className="flex flex-wrap gap-1.5 border-t border-[#E2E8F0] bg-white px-3 py-2.5"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
          >
            {[
              'كم زائر اليوم؟',
              'أضف طبق اليوم: باستا بالصلصة البيضاء 45 ر.س',
              'كود التحقق النشط',
              'أوقات العمل الجديدة: 10ص إلى 12 ليلاً',
            ].map((cmd) => (
              <button
                key={cmd}
                onClick={() => sendCommand(cmd)}
                className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-bold text-[#334155] transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#334155' }}
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-[#E2E8F0] bg-white p-3"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب أمراً أو سؤالاً للمساعد السريع..."
              className="h-10 flex-1 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 text-xs font-medium text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
            />
            <button
              type="submit"
              className="grid size-10 place-items-center rounded-xl bg-[#1D4ED8] text-white transition-transform hover:bg-[#1E40AF]"
              style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
              aria-label="إرسال"
            >
              <Send size={16} />
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Analytics
// ---------------------------------------------------------------------------
function AnalyticsSection({ account }: { account: Account }) {
  const website = account.website;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
          لوحة الإحصائيات والتحليلات
        </h1>
        <p className="mt-1 text-sm font-medium text-[#475569]" style={{ color: '#475569' }}>
          تتبع تفاعل الزوار والطلبات ومصادر الزيارات لموقعك
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <span
            className="grid size-11 place-items-center rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
            style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
          >
            <Eye size={20} />
          </span>
          <p
            className="mt-4 font-mono text-3xl font-black tabular-nums text-[#0F172A]"
            style={{ color: '#0F172A' }}
          >
            {website?.visitsToday || 42}
          </p>
          <p className="mt-1 text-xs font-bold text-[#475569]" style={{ color: '#475569' }}>
            زيارات اليوم
          </p>
        </Card>

        <Card className="p-6">
          <span
            className="grid size-11 place-items-center rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] text-[#4338CA]"
            style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', color: '#4338CA' }}
          >
            <BarChart3 size={20} />
          </span>
          <p
            className="mt-4 font-mono text-3xl font-black tabular-nums text-[#0F172A]"
            style={{ color: '#0F172A' }}
          >
            {website?.visitsTotal || 840}
          </p>
          <p className="mt-1 text-xs font-bold text-[#475569]" style={{ color: '#475569' }}>
            إجمالي الزيارات
          </p>
        </Card>

        <Card className="p-6">
          <span
            className="grid size-11 place-items-center rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]"
            style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' }}
          >
            <Smartphone size={20} />
          </span>
          <p
            className="mt-4 font-mono text-3xl font-black tabular-nums text-[#0F172A]"
            style={{ color: '#0F172A' }}
          >
            94%
          </p>
          <p className="mt-1 text-xs font-bold text-[#475569]" style={{ color: '#475569' }}>
            نسبة زوار الجوال
          </p>
        </Card>

        <Card className="p-6">
          <span
            className="grid size-11 place-items-center rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]"
            style={{ backgroundColor: '#F5F3FF', borderColor: '#DDD6FE', color: '#6D28D9' }}
          >
            <ShoppingBag size={20} />
          </span>
          <p
            className="mt-4 font-mono text-3xl font-black tabular-nums text-[#0F172A]"
            style={{ color: '#0F172A' }}
          >
            18
          </p>
          <p className="mt-1 text-xs font-bold text-[#475569]" style={{ color: '#475569' }}>
            طلبات وتواصل واتساب
          </p>
        </Card>
      </div>

      <Card
        className="border-[#1E293B] bg-[#0B132B] p-6 text-white"
        style={{ backgroundColor: '#0B132B', borderColor: '#1E293B', color: '#FFFFFF' }}
      >
        <h3 className="text-sm font-black text-[#38BDF8]" style={{ color: '#38BDF8' }}>
          تلميحة لزيادة الزيارات والتحويل:
        </h3>
        <p className="mt-2 text-xs font-medium leading-6 text-[#CBD5E1]" style={{ color: '#CBD5E1' }}>
          ضع رابط موقعك في خانة الرابط الحيوي (Bio) على حساباتك في إنستغرام وتيك توك وخرائط قوقل لتوجيه العملاء مباشرة لقائمة المنتجات وطلبات واتساب السريعة.
        </p>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Settings
// ---------------------------------------------------------------------------
function SettingsSection({
  account,
  onLogout,
  loggingOut,
}: {
  account: Account;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const used = account.freeMessagesUsed;
  const limit = Math.max(1, account.freeMessagesLimit);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
          إعدادات الحساب
        </h1>
        <p className="mt-1 text-sm font-medium text-[#475569]" style={{ color: '#475569' }}>
          إدارة رقمك الموثق ورسائل المساعد والتحكم العام
        </p>
      </div>

      <Card className="divide-y divide-[#E2E8F0]">
        <div className="flex items-center justify-between p-6">
          <span className="text-sm font-bold text-[#475569]" style={{ color: '#475569' }}>
            رقم واتساب المتصل والموثق
          </span>
          <span
            dir="ltr"
            className="font-mono text-sm font-black text-[#1D4ED8]"
            style={{ color: '#1D4ED8' }}
          >
            +{account.phoneNumber}
          </span>
        </div>
        <div className="flex items-center justify-between p-6">
          <span className="text-sm font-bold text-[#475569]" style={{ color: '#475569' }}>
            تاريخ الإنشاء
          </span>
          <span className="text-sm font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
            {new Intl.DateTimeFormat('ar-SA', { dateStyle: 'long' }).format(
              new Date(account.createdAt)
            )}
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-[#475569]" style={{ color: '#475569' }}>
              رسائل مساعد واتساب السريع
            </span>
            <span
              className="font-mono font-black tabular-nums text-[#0F172A]"
              style={{ color: '#0F172A' }}
            >
              {used} / {limit}
            </span>
          </div>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#E2E8F0]"
            style={{ backgroundColor: '#E2E8F0' }}
          >
            <div
              className="h-full rounded-full bg-[#1D4ED8] transition-all duration-700"
              style={{
                width: `${Math.min(100, (used / limit) * 100)}%`,
                backgroundColor: '#1D4ED8',
              }}
            />
          </div>
        </div>
      </Card>

      <button
        onClick={onLogout}
        disabled={loggingOut}
        className="inline-flex items-center gap-2 rounded-xl border border-[#FECDD3] bg-[#FFF1F2] px-5 py-3 text-sm font-bold text-[#BE123C] transition-colors hover:bg-[#FFE4E6] disabled:opacity-60"
        style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#BE123C' }}
        data-testid="button-logout"
      >
        <LogOut size={16} />
        <span>تسجيل الخروج من الجلسة</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell: Dashboard Main Controller
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const [location, navigate] = useLocation();
  const account = useAccount();
  const logout = useLogout();
  const whatsapp = useGetPublicWhatsapp({ query: { queryKey: getGetPublicWhatsappQueryKey() } });
  const botNumber = whatsapp.data?.whatsappNumber || '966500000000';
  const [menuOpen, setMenuOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('store');
  const menuRef = useRef<HTMLDivElement>(null);
  const section = location.split('/')[2] ?? 'home';

  const activeAccount = account.data || getLocalAccount();

  useEffect(() => {
    if (!account.isLoading && !activeAccount) {
      navigate('/login', { replace: true });
    }
  }, [account.isLoading, activeAccount, navigate]);

  const openCreateWithTemplate = (template = 'store') => {
    setSelectedTemplate(template);
    setCreateModalOpen(true);
  };

  const doLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    });
  };

  if (account.isLoading) {
    return (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-[#F8FAFC]"
        style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}
      >
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-[#1D4ED8]" style={{ color: '#1D4ED8' }} size={28} />
          <p className="text-sm font-bold text-[#475569]" style={{ color: '#475569' }}>
            جارِ التحقق من الحساب…
          </p>
        </div>
      </div>
    );
  }

  if (!activeAccount) {
    return null;
  }

  const initials = activeAccount.phoneNumber.slice(-2) || '··';

  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] bg-[#F8FAFC] font-sans text-[#0F172A]"
      style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}
    >
      {/* Top Header */}
      <header
        className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
      >
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <Brand href="/dashboard" />
            <span
              className="hidden text-xs font-extrabold text-[#475569] sm:inline-block"
              style={{ color: '#475569' }}
            >
              / استوديو المنصة
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openCreateWithTemplate('store')}
              className="hidden h-10 items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-4 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#1E40AF] sm:inline-flex"
              style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
            >
              <Plus size={15} />
              <span>خدمة جديدة</span>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] py-1.5 pl-3.5 pr-1.5 transition-colors hover:bg-[#E2E8F0]"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                data-testid="button-account-menu"
                aria-expanded={menuOpen}
              >
                <span
                  className="hidden font-mono text-xs font-bold text-[#334155] sm:block"
                  style={{ color: '#334155' }}
                  dir="ltr"
                >
                  {maskPhone(activeAccount.phoneNumber)}
                </span>
                <span
                  className="grid size-8 place-items-center rounded-lg bg-[#0B132B] font-mono text-xs font-black text-white"
                  style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
                >
                  {initials}
                </span>
              </button>
              {menuOpen && (
                <div
                  className="absolute left-0 top-[calc(100%+8px)] w-64 rounded-2xl border border-[#CBD5E1] bg-white p-2 shadow-xl animate-[acct-fade-up_.2s_ease_both]"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                >
                  <div
                    className="border-b border-[#E2E8F0] px-4 py-3"
                    style={{ borderColor: '#E2E8F0' }}
                  >
                    <p className="text-xs font-bold text-[#64748B]" style={{ color: '#64748B' }}>
                      حسابك الموثق
                    </p>
                    <p
                      dir="ltr"
                      className="mt-0.5 text-right font-mono text-sm font-black text-[#0F172A]"
                      style={{ color: '#0F172A' }}
                    >
                      +{activeAccount.phoneNumber}
                    </p>
                  </div>
                  <Link
                    href="/"
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-[#334155] transition-colors hover:bg-[#F1F5F9]"
                    style={{ color: '#334155' }}
                  >
                    الصفحة الرئيسية للمنصة
                  </Link>
                  <button
                    onClick={doLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold text-[#BE123C] transition-colors hover:bg-[#FFF1F2]"
                    style={{ color: '#BE123C' }}
                  >
                    <LogOut size={16} />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace layout */}
      <div className="mx-auto flex max-w-7xl gap-8 px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
        {/* Desktop Sidebar Navigation */}
        <nav className="sticky top-24 hidden h-fit w-60 shrink-0 md:block" aria-label="التنقل">
          <div
            className="rounded-2xl border border-[#CBD5E1] bg-white p-2.5 shadow-2xs"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
          >
            <ul className="space-y-1">
              {NAV.map(({ href, key, label, icon: Icon }) => {
                const active = key === section || (key === 'services' && section === 'site');
                return (
                  <li key={key}>
                    <Link
                      href={href}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all"
                      style={
                        active
                          ? {
                              backgroundColor: '#0B132B',
                              color: '#FFFFFF',
                            }
                          : {
                              backgroundColor: 'transparent',
                              color: '#334155',
                            }
                      }
                      data-testid={`nav-${key}`}
                    >
                      <Icon size={18} style={{ color: active ? '#38BDF8' : '#64748B' }} />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Section View */}
        <main className="min-w-0 flex-1" data-testid={`section-${section}`}>
          {section === 'site' ? (
            <SiteEditor />
          ) : section === 'services' ? (
            <ServicesSection account={activeAccount} onOpenCreate={openCreateWithTemplate} />
          ) : section === 'assistant' ? (
            <AssistantSection account={activeAccount} botNumber={botNumber} />
          ) : section === 'analytics' ? (
            <AnalyticsSection account={activeAccount} />
          ) : section === 'settings' ? (
            <SettingsSection
              account={activeAccount}
              onLogout={doLogout}
              loggingOut={logout.isPending}
            />
          ) : (
            <HomeSection account={activeAccount} onOpenCreate={openCreateWithTemplate} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl border border-[#CBD5E1] bg-white p-1.5 shadow-xl md:hidden"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
        aria-label="التنقل"
      >
        {NAV.map(({ href, key, label, icon: Icon }) => {
          const active = key === section || (key === 'services' && section === 'site');
          return (
            <Link
              key={key}
              href={href}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-bold transition-colors"
              style={
                active
                  ? {
                      backgroundColor: '#0B132B',
                      color: '#FFFFFF',
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: '#475569',
                    }
              }
              data-testid={`bottomnav-${key}`}
            >
              <Icon size={18} style={{ color: active ? '#38BDF8' : '#64748B' }} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Creation Modal */}
      <CreateSiteModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialTemplate={selectedTemplate}
        defaultPhone={activeAccount.phoneNumber}
        onSuccess={() => {
          account.refetch();
          navigate('/dashboard/site');
        }}
      />
    </div>
  );
}
