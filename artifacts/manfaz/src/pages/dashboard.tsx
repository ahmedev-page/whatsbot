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
import { useQueryClient } from '@tanstack/react-query';
import {
  accountQueryKey,
  createWebsiteInPlatform,
  getLocalAccount,
  siteQueryKey,
  siteUrl,
  slugifyUsername,
  useAccount,
  useAccountMessages,
  useLogout,
  useSendAssistantCommand,
  useSiteDocument,
  type Account,
  type InitialCollectionItemInput,
  type SiteDocument,
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

interface SubServiceItem {
  id: string;
  icon: LucideIcon;
  title: string;
  shortLabel: string;
  desc: string;
  templateBadge: string;
  tone: Tone;
  keywords: string;
  templateId: string;
}

interface ConsolidatedGroup {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  items: SubServiceItem[];
}

const CONSOLIDATED_GROUPS: ConsolidatedGroup[] = [
  {
    id: 'websites',
    badge: 'القسم الأول · 01',
    title: 'خدمات المواقع والواجهات الرقمية',
    subtitle: 'مواقع متكاملة للمتاجر والمطاعم والشركات والصفحات الشخصية والبطاقات الرقمية',
    items: [
      {
        id: 'store',
        icon: ShoppingBag,
        title: 'متجر إلكتروني وسلة طلبات',
        shortLabel: 'متجر إلكتروني',
        desc: 'عرض المنتجات بالتصنيفات والأسعار مع سلة شراء ذكية ترسل الطلب لواتساب.',
        templateBadge: 'قالب المتجر والسلة',
        tone: 'emerald',
        keywords: 'متجر بيع منتجات سلة تسوق',
        templateId: 'store',
      },
      {
        id: 'restaurant',
        icon: UtensilsCrossed,
        title: 'منيو مطعم أو كافيه رقمي QR',
        shortLabel: 'مطعم / كافيه',
        desc: 'قائمة طعام ومشروبات مقسمة بالأصناف والأسعار والصور مع طلب مباشر.',
        templateBadge: 'قالب المنيو الرقمي',
        tone: 'teal',
        keywords: 'منيو قائمة مطعم كافيه طاولة',
        templateId: 'restaurant',
      },
      {
        id: 'services',
        icon: Globe,
        title: 'موقع شركة أو مؤسسة خدمية',
        shortLabel: 'شركة / مؤسسة',
        desc: 'واجهة رسمية للشركات والمؤسسات تستعرض الخدمات، فريق العمل، وبيانات التواصل.',
        templateBadge: 'قالب الشركات والخدمات',
        tone: 'blue',
        keywords: 'شركة مؤسسة موقع رسمي خدمات',
        templateId: 'services',
      },
      {
        id: 'portfolio',
        icon: Sparkles,
        title: 'صفحة شخصية ومعرض أعمال (Portfolio)',
        shortLabel: 'صفحة شخصية',
        desc: 'معرض مشاريع ومهارات وسيرة مهنية للمصممين والمستقلين والخبراء.',
        templateBadge: 'قالب معرض الأعمال',
        tone: 'indigo',
        keywords: 'بورتفوليو معرض أعمال صفحة شخصية مستقل',
        templateId: 'portfolio',
      },
      {
        id: 'vcard',
        icon: User,
        title: 'بطاقة تواصل رقمية وروابط (Bio Links)',
        shortLabel: 'بطاقة رقمية وروابط',
        desc: 'صفحة روابط موحدة تجمع حساباتك، أرقامك، وروابطك المهمة في واجهة جوال.',
        templateBadge: 'قالب البطاقة والروابط',
        tone: 'violet',
        keywords: 'بطاقة روابط بايو تواصل تعريفية',
        templateId: 'vcard',
      },
    ],
  },
  {
    id: 'tools',
    badge: 'القسم الثاني · 02',
    title: 'الخدمات التفاعلية والأدوات الذكية',
    subtitle: 'أدوات تفاعلية مستقلة للاستبيانات وحجز المواعيد والدعوات وعروض الأسعار',
    items: [
      {
        id: 'survey',
        icon: ClipboardList,
        title: 'استبيان واستطلاع رأي العملاء',
        shortLabel: 'استبيان وتقييم',
        desc: 'نموذج استبيان تفاعلي مستقل بتقييم النجوم والأسئلة المتعددة وملخص الردود.',
        templateBadge: 'قالب الاستبيان التفاعلي',
        tone: 'violet',
        keywords: 'استبيان استطلاع تقييم أسئلة رأي',
        templateId: 'survey',
      },
      {
        id: 'booking',
        icon: CalendarCheck,
        title: 'نظام حجز المواعيد والاستشارات',
        shortLabel: 'حجز المواعيد',
        desc: 'قالب حجوزات مخصص باختيار الخدمة والتاريخ والوقت وتأكيد الموعد مباشرة.',
        templateBadge: 'قالب جدول الحجوزات',
        tone: 'blue',
        keywords: 'حجز موعد عيادة صالون استشارة',
        templateId: 'booking',
      },
      {
        id: 'rsvp',
        icon: CalendarDays,
        title: 'دعوة فعالية وتأكيد حضور (RSVP)',
        shortLabel: 'دعوة وتأكيد حضور',
        desc: 'بطاقة دعوة رسمية للمناسبات والفعاليات مع برنامج الحفل ونموذج تأكيد الحضور.',
        templateBadge: 'قالب الدعوات وتأكيد الحضور',
        tone: 'rose',
        keywords: 'دعوة فعالية حفل مناسبة حضور',
        templateId: 'rsvp',
      },
      {
        id: 'invoice',
        icon: Briefcase,
        title: 'باقات الأسعار وحاسبة عروض الخدمات',
        shortLabel: 'باقات وعروض أسعار',
        desc: 'قالب تفاعلي يتيح للعميل تحديد الباقات المطلوبة وحساب التكلفة الإجمالية فوراً.',
        templateBadge: 'قالب حاسبة الباقات',
        tone: 'emerald',
        keywords: 'باقات تسعير عروض أسعار فاتورة',
        templateId: 'invoice',
      },
    ],
  },
];

const TEMPLATE_NAMES: Record<string, string> = {
  store: 'متجر إلكتروني',
  restaurant: 'مطعم ومقهى',
  services: 'شركة وخدمات',
  portfolio: 'صفحة شخصية وأعمال',
  vcard: 'بطاقة رقمية وروابط',
  survey: 'استبيان واستطلاع رأي',
  booking: 'حجز مواعيد',
  rsvp: 'دعوة وتأكيد حضور',
  invoice: 'باقات وعروض أسعار',
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
// In-Platform Site Creator Modal — Complete Parameter Collection
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
  onSuccess: (created: SiteDocument) => void;
}) {
  const [siteName, setSiteName] = useState('');
  const [username, setUsername] = useState('');
  const [templateId, setTemplateId] = useState(initialTemplate);
  const [templateStyle, setTemplateStyle] = useState<SiteStyle>('modern');
  const [themeColor, setThemeColor] = useState('#1D4ED8');
  const [darkMode, setDarkMode] = useState(false);
  const [tagline, setTagline] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [whatsapp, setWhatsapp] = useState(defaultPhone || '');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [snapchat, setSnapchat] = useState('');
  const [hours, setHours] = useState<Array<{ day: string; time: string }>>([]);
  const [initialItems, setInitialItems] = useState<InitialCollectionItemInput[]>([]);
  const [skillsText, setSkillsText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTemplateId(initialTemplate);
  }, [initialTemplate]);

  useEffect(() => {
    if (defaultPhone) {
      setPhone((prev) => prev || defaultPhone);
      setWhatsapp((prev) => prev || defaultPhone);
    }
  }, [defaultPhone]);

  if (!open) return null;

  const itemNoun =
    templateId === 'restaurant'
      ? 'طبق / صنف'
      : templateId === 'services' || templateId === 'booking'
      ? 'خدمة'
      : templateId === 'invoice'
      ? 'باقة'
      : templateId === 'survey'
      ? 'سؤال استبيان'
      : templateId === 'vcard'
      ? 'رابط'
      : templateId === 'rsvp'
      ? 'فقرة برنامج'
      : templateId === 'portfolio'
      ? 'مشروع / عمل'
      : 'منتج';

  const isSingleStyleTemplate = ['booking', 'survey', 'rsvp', 'invoice', 'vcard'].includes(
    templateId
  );

  const previewSlug = slugifyUsername(username.trim() || siteName.trim() || 'my-site');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) return;
    setSubmitting(true);

    try {
      const parsedSkills = skillsText
        .split(/[,،\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await createWebsiteInPlatform({
        siteName: siteName.trim(),
        username: username.trim() || undefined,
        templateId,
        templateStyle,
        themeColor,
        darkMode,
        tagline: tagline.trim() || undefined,
        headline: headline.trim() || undefined,
        description: description.trim() || undefined,
        ctaLabel: ctaLabel.trim() || undefined,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        socialLinks: {
          instagram: instagram.trim() || undefined,
          twitter: twitter.trim() || undefined,
          tiktok: tiktok.trim() || undefined,
          snapchat: snapchat.trim() || undefined,
        },
        hours: hours.filter((h) => h.day.trim() || h.time.trim()),
        initialItems: initialItems.filter((item) => item.name?.trim() || item.title?.trim()),
        skills: parsedSkills.length > 0 ? parsedSkills : undefined,
      });

      setSubmitting(false);
      onSuccess(created);
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
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#CBD5E1] bg-white p-6 text-[#0F172A] shadow-2xl sm:p-8"
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
              إنشاء خدمة أو موقع جديد وحفظه في قاعدة البيانات
            </h2>
            <p className="text-xs font-medium text-[#475569]" style={{ color: '#475569' }}>
              أدخل بيانات نشاطك الفعلية والمنتجات ومعلومات التواصل دون أي بيانات وهمية
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="mt-6 space-y-5">
          {/* 1. Template Type Grouped by Category */}
          <div className="space-y-3">
            <label
              className="block text-xs font-extrabold text-[#0F172A]"
              style={{ color: '#0F172A' }}
            >
              نوع الخدمة والقالب المخصص *
            </label>
            {CONSOLIDATED_GROUPS.map((grp) => (
              <div
                key={grp.id}
                className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
              >
                <p
                  className="mb-2 text-[11px] font-black text-[#475569]"
                  style={{ color: '#475569' }}
                >
                  {grp.title}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {grp.items.map(({ templateId: id, shortLabel, icon: Icon }) => {
                    const active = templateId === id;
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => setTemplateId(id)}
                        data-testid={`modal-template-${id}`}
                        className="flex items-center gap-2 rounded-xl border p-2.5 text-right text-xs font-bold transition-all"
                        style={
                          active
                            ? {
                                backgroundColor: '#0B132B',
                                borderColor: '#0B132B',
                                color: '#FFFFFF',
                              }
                            : {
                                backgroundColor: '#FFFFFF',
                                borderColor: '#CBD5E1',
                                color: '#334155',
                              }
                        }
                      >
                        <Icon size={15} style={{ color: active ? '#38BDF8' : '#1D4ED8' }} />
                        <span className="truncate">{shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 2. Site Name & Custom Username Slug */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                placeholder="مثال: مخبز رغيف وسمسم، استوديو أفق"
                className="mt-1.5 h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                data-testid="input-site-name"
              />
            </div>

            <div>
              <label
                className="block text-xs font-extrabold text-[#0F172A]"
                style={{ color: '#0F172A' }}
              >
                الرابط المخصص للموقع (Username)
              </label>
              <input
                type="text"
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={previewSlug}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 text-left font-mono text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                data-testid="input-site-username"
              />
              <p dir="ltr" className="mt-1 text-right font-mono text-[11px] font-bold text-[#1D4ED8]" style={{ color: '#1D4ED8' }}>
                {siteUrl(previewSlug)}
              </p>
            </div>
          </div>

          {/* 3. Tagline, Headline, Description, CTA */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-extrabold text-[#0F172A]" style={{ color: '#0F172A' }}>
                العبارة الترحيبية العلوية (Tagline)
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="مثال: جودة أصيلة منذ 2018"
                className="mt-1.5 h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#0F172A]" style={{ color: '#0F172A' }}>
                العنوان الرئيسي البارز (Headline)
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={siteName.trim() || 'عنوان واجهة الموقع'}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-extrabold text-[#0F172A]"
              style={{ color: '#0F172A' }}
            >
              نبذة ووصف النشاط التجاري
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ما الذي تقدمه لعملائك؟ اكتب وصفاً حقيقياً يظهر لزوار موقعك."
              className="mt-1.5 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-sm font-medium text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
            />
          </div>

          {/* 4. Style, CTA Label, Theme Color, Dark Mode */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                className="block text-xs font-extrabold text-[#0F172A]"
                style={{ color: '#0F172A' }}
              >
                {isSingleStyleTemplate ? 'نوع القالب التفاعلي' : 'نمط التصميم المفضل'}
              </label>
              {isSingleStyleTemplate ? (
                <div
                  className="mt-1.5 flex h-11 items-center rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 text-xs font-extrabold text-[#1D4ED8]"
                  style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                >
                  قالب تفاعلي مستقل مخصص لـ «{TEMPLATE_NAMES[templateId] || templateId}»
                </div>
              ) : (
                <select
                  value={templateStyle}
                  onChange={(e) => {
                    const nextStyle = e.target.value as SiteStyle;
                    setTemplateStyle(nextStyle);
                    if (nextStyle === 'cinematic') setDarkMode(true);
                  }}
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                >
                  <option value="modern">عصري فائق (Modern)</option>
                  <option value="classic">كلاسيكي هادئ (Classic)</option>
                  <option value="cinematic">سينمائي فاخر (Cinematic)</option>
                  <option value="app">تطبيق جوال تفاعلي (App UI)</option>
                </select>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-extrabold text-[#0F172A]"
                style={{ color: '#0F172A' }}
              >
                نص زر الإجراء الرئيسي (CTA)
              </label>
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder={
                  templateId === 'booking'
                    ? 'احجز الآن'
                    : templateId === 'survey'
                    ? 'إرسال التقييم'
                    : templateId === 'rsvp'
                    ? 'تأكيد الحضور'
                    : templateId === 'invoice'
                    ? 'طلب عرض السعر'
                    : templateId === 'restaurant'
                    ? 'شاهد المنيو واطلب'
                    : 'تواصل واطلب الآن'
                }
                className="mt-1.5 h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
            <div>
              <label
                className="block text-xs font-extrabold text-[#0F172A]"
                style={{ color: '#0F172A' }}
              >
                لون الهوية المميز
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setThemeColor(color)}
                    className={`grid size-8 place-items-center rounded-full transition-transform ${
                      themeColor === color
                        ? 'scale-110 ring-2 ring-[#0F172A] ring-offset-2'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color, color: '#FFFFFF' }}
                    aria-label={color}
                  >
                    {themeColor === color && <Check size={13} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs font-extrabold text-[#0F172A]" style={{ color: '#0F172A' }}>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                className="size-4 accent-[#1D4ED8]"
              />
              <span>تفعيل الوضع الداكن افتراضياً</span>
            </label>
          </div>

          {/* 5. Contact Information (Saved inside json_structure.contact) */}
          <div className="rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 space-y-3" style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}>
            <p className="text-xs font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
              بيانات التواصل والعنوان
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-[#334155]" style={{ color: '#334155' }}>
                  رقم واتساب للطلبات المباشرة
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  dir="ltr"
                  placeholder="9665XXXXXXXX"
                  className="mt-1 h-10 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-left font-mono text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#334155]" style={{ color: '#334155' }}>
                  رقم الجوال للاتصال
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  placeholder="9665XXXXXXXX"
                  className="mt-1 h-10 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-left font-mono text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#334155]" style={{ color: '#334155' }}>
                  البريد الإلكتروني (اختياري)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  placeholder="info@example.com"
                  className="mt-1 h-10 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-left font-mono text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#334155]" style={{ color: '#334155' }}>
                  العنوان أو المدينة (اختياري)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: الرياض - حي العليا"
                  className="mt-1 h-10 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                />
              </div>
            </div>
          </div>

          {/* 6. Initial Products / Dishes / Services / Projects */}
          <div className="rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 space-y-3" style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
                  العناصر المبدئية ({itemNoun})
                </p>
                <p className="text-[11px] font-medium text-[#475569]" style={{ color: '#475569' }}>
                  أضف منتجاتك أو خدماتك الحقيقية الآن أو لاحقاً من المحرر
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setInitialItems((prev) => [
                    ...prev,
                    { name: '', price: '', category: '', description: '' },
                  ])
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1E40AF]"
                style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
                data-testid="button-modal-add-item"
              >
                <Plus size={14} />
                <span>إضافة {itemNoun}</span>
              </button>
            </div>

            {initialItems.length > 0 && (
              <div className="space-y-2.5">
                {initialItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2 rounded-xl border border-[#CBD5E1] bg-white p-3 sm:grid-cols-12"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                  >
                    <input
                      type="text"
                      value={item.name || ''}
                      onChange={(e) =>
                        setInitialItems((prev) =>
                          prev.map((entry, i) => (i === idx ? { ...entry, name: e.target.value } : entry))
                        )
                      }
                      placeholder={
                        templateId === 'survey'
                          ? 'نص السؤال (مثال: كيف تقيّم الخدمة؟) *'
                          : templateId === 'vcard'
                          ? 'عنوان الرابط (مثال: حسابنا في إنستقرام) *'
                          : templateId === 'rsvp'
                          ? 'عنوان الفقرة (مثال: استقبال الضيوف) *'
                          : `اسم الـ${itemNoun} *`
                      }
                      className="h-9 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 text-xs font-bold text-[#0F172A] sm:col-span-4"
                      style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                    />
                    {templateId === 'survey' ? (
                      <input
                        type="text"
                        value={item.category || ''}
                        onChange={(e) =>
                          setInitialItems((prev) =>
                            prev.map((entry, i) =>
                              i === idx ? { ...entry, category: e.target.value } : entry
                            )
                          )
                        }
                        placeholder="الخيارات بفاصلة (ممتاز، جيد، مقبول)"
                        className="h-9 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 text-xs font-bold text-[#0F172A] sm:col-span-4"
                        style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                      />
                    ) : (
                      templateId !== 'portfolio' && (
                        <input
                          type="text"
                          value={item.price || ''}
                          onChange={(e) =>
                            setInitialItems((prev) =>
                              prev.map((entry, i) =>
                                i === idx ? { ...entry, price: e.target.value } : entry
                              )
                            )
                          }
                          placeholder={
                            templateId === 'vcard'
                              ? 'الرابط https://...'
                              : templateId === 'rsvp'
                              ? 'التوقيت (مثال: 08:00 م)'
                              : 'السعر (مثال: 45 ر.س)'
                          }
                          className="h-9 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 text-xs font-bold text-[#0F172A] sm:col-span-3"
                          style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                        />
                      )
                    )}
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) =>
                        setInitialItems((prev) =>
                          prev.map((entry, i) =>
                            i === idx ? { ...entry, description: e.target.value } : entry
                          )
                        )
                      }
                      placeholder={
                        templateId === 'survey' ? 'توضيح إضافي (اختياري)' : 'وصف مختصر'
                      }
                      className={`h-9 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 text-xs font-medium text-[#0F172A] ${
                        templateId === 'portfolio'
                          ? 'sm:col-span-7'
                          : templateId === 'survey'
                          ? 'sm:col-span-3'
                          : 'sm:col-span-4'
                      }`}
                      style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                    />
                    <button
                      type="button"
                      onClick={() => setInitialItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="grid h-9 place-items-center rounded-lg border border-[#FECDD3] bg-[#FFF1F2] text-[#BE123C] sm:col-span-1"
                      style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#BE123C' }}
                      aria-label="حذف العنصر"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {templateId === 'portfolio' && (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-[#334155]" style={{ color: '#334155' }}>
                  المهارات والتخصصات (افصل بينها بفاصلة)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="مثال: تصميم الهوية، واجهات المستخدم، تطوير الويب"
                  className="mt-1 h-10 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-xs font-bold text-[#0F172A]"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                />
              </div>
            )}
          </div>

          {/* 7. Working Hours & Social Links (Optional Collapsible Details) */}
          <details className="rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-4" style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}>
            <summary className="cursor-pointer text-xs font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
              ساعات العمل وحسابات التواصل الاجتماعي (اختياري)
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#334155]" style={{ color: '#334155' }}>
                    أوقات الدوام
                  </span>
                  <button
                    type="button"
                    onClick={() => setHours((prev) => [...prev, { day: '', time: '' }])}
                    className="rounded-lg border border-[#CBD5E1] bg-white px-2.5 py-1 text-[11px] font-bold text-[#1D4ED8]"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#1D4ED8' }}
                  >
                    + إضافة فترة دوام
                  </button>
                </div>
                {hours.map((row, idx) => (
                  <div key={idx} className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={row.day}
                      onChange={(e) =>
                        setHours((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, day: e.target.value } : r))
                        )
                      }
                      placeholder="الأيام (مثال: السبت - الخميس)"
                      className="h-9 flex-1 rounded-lg border border-[#CBD5E1] bg-white px-2.5 text-xs font-bold text-[#0F172A]"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                    />
                    <input
                      type="text"
                      value={row.time}
                      onChange={(e) =>
                        setHours((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, time: e.target.value } : r))
                        )
                      }
                      placeholder="الوقت (مثال: 9 ص - 10 م)"
                      className="h-9 flex-1 rounded-lg border border-[#CBD5E1] bg-white px-2.5 text-xs font-bold text-[#0F172A]"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                    />
                    <button
                      type="button"
                      onClick={() => setHours((prev) => prev.filter((_, i) => i !== idx))}
                      className="grid size-9 place-items-center rounded-lg border border-[#FECDD3] bg-[#FFF1F2] text-[#BE123C]"
                      style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#BE123C' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  dir="ltr"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Instagram (@username)"
                  className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-3 text-left font-mono text-xs font-bold text-[#0F172A]"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                />
                <input
                  type="text"
                  dir="ltr"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="X / Twitter (@username)"
                  className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-3 text-left font-mono text-xs font-bold text-[#0F172A]"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                />
                <input
                  type="text"
                  dir="ltr"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="TikTok (@username)"
                  className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-3 text-left font-mono text-xs font-bold text-[#0F172A]"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                />
                <input
                  type="text"
                  dir="ltr"
                  value={snapchat}
                  onChange={(e) => setSnapchat(e.target.value)}
                  placeholder="Snapchat (@username)"
                  className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-3 text-left font-mono text-xs font-bold text-[#0F172A]"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                />
              </div>
            </div>
          </details>

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
// ---------------------------------------------------------------------------
// Consolidated 2-Group Services Catalog Component (Zero Filler)
// ---------------------------------------------------------------------------
function ConsolidatedServicesCatalog({
  query = '',
  onOpenCreate,
}: {
  query?: string;
  onOpenCreate: (templateId: string) => void;
}) {
  const normalized = query.trim().toLowerCase();
  const matches = (item: SubServiceItem) =>
    !normalized ||
    `${item.title} ${item.shortLabel} ${item.desc} ${item.keywords}`
      .toLowerCase()
      .includes(normalized);

  return (
    <div className="space-y-6">
      {CONSOLIDATED_GROUPS.map((group) => {
        const items = group.items.filter(matches);
        if (items.length === 0) return null;

        return (
          <Card
            key={group.id}
            className="overflow-hidden border border-[#CBD5E1] p-6"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
            data-testid={`dashboard-group-${group.id}`}
          >
            {/* Consolidated Group Header */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4"
              style={{ borderColor: '#E2E8F0' }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-lg bg-[#0B132B] px-2.5 py-0.5 font-mono text-[11px] font-extrabold text-[#38BDF8]"
                    style={{ backgroundColor: '#0B132B', color: '#38BDF8' }}
                  >
                    {group.badge}
                  </span>
                  <span
                    className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-0.5 text-[11px] font-extrabold text-[#1D4ED8]"
                    style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                  >
                    {items.length} قوالب مستقلة
                  </span>
                </div>
                <h2
                  className="mt-2 text-lg font-black text-[#0F172A]"
                  style={{ color: '#0F172A' }}
                >
                  {group.title}
                </h2>
                <p
                  className="mt-0.5 text-xs font-medium text-[#475569]"
                  style={{ color: '#475569' }}
                >
                  {group.subtitle}
                </p>
              </div>
            </div>

            {/* Organized Sub-Services Grid */}
            <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((service) => {
                const Icon = service.icon;
                const tone = TONE_STYLES[service.tone];
                return (
                  <div
                    key={service.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 transition-all duration-200 hover:border-[#2563EB] hover:bg-white hover:shadow-sm"
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderColor: '#CBD5E1',
                      color: '#0F172A',
                    }}
                    data-testid={`service-item-${service.id}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="grid size-10 shrink-0 place-items-center rounded-xl border"
                          style={{
                            backgroundColor: tone.bg,
                            borderColor: tone.border,
                            color: tone.text,
                          }}
                        >
                          <Icon size={19} />
                        </span>
                        <span
                          className="rounded-lg border px-2.5 py-0.5 text-[11px] font-extrabold"
                          style={{
                            backgroundColor: tone.bg,
                            borderColor: tone.border,
                            color: tone.text,
                          }}
                        >
                          {service.templateBadge}
                        </span>
                      </div>

                      <h3
                        className="mt-3 text-sm font-black text-[#0F172A]"
                        style={{ color: '#0F172A' }}
                      >
                        {service.title}
                      </h3>
                      <p
                        className="mt-1 text-xs font-medium leading-5 text-[#475569]"
                        style={{ color: '#475569' }}
                      >
                        {service.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-2">
                      <button
                        type="button"
                        onClick={() => onOpenCreate(service.templateId)}
                        data-testid={`button-launch-${service.templateId}`}
                        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0B132B] text-xs font-bold text-white transition-colors hover:bg-[#1D4ED8]"
                        style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
                      >
                        <Plus size={14} />
                        <span>إنشاء بـ {service.templateBadge}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
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

  return (
    <div className="space-y-7">
      {/* Executive Royal Sapphire Hero Welcome Banner */}
      <div
        className="relative overflow-hidden rounded-3xl border border-[#1E293B] bg-[#0B132B] px-6 py-7 text-white shadow-[0_24px_60px_-24px_rgba(6,11,24,0.45)] sm:px-9 sm:py-9"
        style={{
          background: 'linear-gradient(155deg, #060B18 0%, #0B132B 55%, #111E42 100%)',
          backgroundColor: '#0B132B',
          borderColor: '#1E293B',
          color: '#FFFFFF',
        }}
      >
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className="text-xs font-extrabold tracking-wide text-[#38BDF8]"
              style={{ color: '#38BDF8' }}
            >
              {greeting()} · استوديو ORxai السحابي
            </p>
            <h1
              className="mt-1.5 text-[clamp(1.5rem,3.2vw,2.15rem)] font-black leading-tight tracking-tight text-white"
              style={{ color: '#FFFFFF' }}
            >
              إدارة المواقع والخدمات التفاعلية
            </h1>
            <p
              className="mt-1.5 max-w-xl text-xs font-medium leading-relaxed text-[#CBD5E1] sm:text-sm"
              style={{ color: '#CBD5E1' }}
            >
              قسمان منظمان بدون حشو: خدمات المواقع والواجهات الرقمية، والخدمات التفاعلية (الاستبيان، الحجز، الدعوات، الباقات) — لكل خدمة قالبها المخصص.
            </p>
          </div>

          <button
            onClick={() => onOpenCreate('store')}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#1D4ED8] sm:text-sm"
            style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
            data-testid="button-create-service-header"
          >
            <Plus size={17} />
            <span>إنشاء خدمة / موقع جديد</span>
          </button>
        </div>

        {/* High-Contrast Search Bar */}
        <div className="relative z-10 mt-5 max-w-xl">
          <Search
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: '#475569' }}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث: متجر، مطعم، استبيان، حجز مواعيد، دعوة، باقات..."
            className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-4 pr-11 text-xs font-semibold text-[#0F172A] shadow-xs outline-none transition-all focus:border-[#38BDF8] sm:text-sm"
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
          className="overflow-hidden border-[#93C5FD] p-5"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)',
            backgroundColor: '#FFFFFF',
            borderColor: '#93C5FD',
            color: '#0F172A',
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-xs"
                style={{ backgroundColor: website.themeColor || '#1D4ED8', color: '#FFFFFF' }}
              >
                <Globe size={22} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className="text-base font-black text-[#0F172A]"
                    style={{ color: '#0F172A' }}
                  >
                    {website.siteName}
                  </h3>
                  <span
                    className="rounded-md border border-[#BFDBFE] bg-white px-2 py-0.5 text-[11px] font-extrabold text-[#1D4ED8]"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                  >
                    {TEMPLATE_NAMES[website.templateId] ?? website.templateId}
                  </span>
                  <span
                    className="text-xs font-extrabold"
                    style={{ color: '#059669' }}
                  >
                    ● منشور
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

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/site"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#1E40AF]"
                style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
              >
                <Pencil size={14} />
                <span>تخصيص القالب</span>
              </Link>
              <a
                href={siteUrl(website.username)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B132B] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#1E293B]"
                style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
              >
                <ExternalLink size={14} />
                <span>معاينة حية</span>
              </a>
              <CopyLinkButton url={siteUrl(website.username)} />
            </div>
          </div>
        </Card>
      ) : null}

      {/* Consolidated 2-Group Services Catalog */}
      <ConsolidatedServicesCatalog query={query} onOpenCreate={onOpenCreate} />
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
            يمكنك تعديل العناصر والأسئلة والباقات والروابط بالكامل من محرر الاستوديو، أو تغيير نوع القالب من الأقسام المجمّعة أدناه.
          </div>
        </Card>
      ) : null}

      <ConsolidatedServicesCatalog onOpenCreate={onOpenCreate} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: WhatsApp Companion Assistant (Connected to Database)
// ---------------------------------------------------------------------------
function AssistantSection({ account, botNumber }: { account: Account; botNumber: string }) {
  const historyQuery = useAccountMessages();
  const sendMutation = useSendAssistantCommand();
  const [localTranscript, setLocalTranscript] = useState<
    Array<{ sender: 'user' | 'bot'; text: string; time: string }>
  >([]);
  const [input, setInput] = useState('');

  const serverMessages = (historyQuery.data ?? []).map((msg) => ({
    sender: (msg.direction === 'inbound' ? 'user' : 'bot') as 'user' | 'bot',
    text: msg.content,
    time: new Intl.DateTimeFormat('ar-SA', { timeStyle: 'short' }).format(
      new Date(msg.createdAt)
    ),
  }));

  const welcomeMessage = {
    sender: 'bot' as const,
    text: account.website
      ? `مرحباً بك! موقعك المتصل في قاعدة البيانات هو «${account.website.siteName}».\nيمكنك إرسال أوامر مباشرة لإضافة منتجات، تعديل ساعات العمل، أو الاستعلام عن الزيارات الحقيقية.`
      : 'مرحباً بك في المساعد السريع المتصل بقاعدة البيانات! أنشئ موقعك أولاً من قسم «خدماتي وموقعي» ثم استخدم الأوامر السريعة هنا أو عبر واتساب.',
    time: 'متصل',
  };

  const displayedMessages =
    serverMessages.length > 0
      ? [...serverMessages, ...localTranscript]
      : [welcomeMessage, ...localTranscript];

  const sendCommand = (cmd: string) => {
    const cleanCmd = cmd.trim();
    if (!cleanCmd || sendMutation.isPending) return;
    const nowTime = new Intl.DateTimeFormat('ar-SA', { timeStyle: 'short' }).format(new Date());
    setLocalTranscript((prev) => [...prev, { sender: 'user', text: cleanCmd, time: nowTime }]);
    sendMutation.mutate(cleanCmd, {
      onSuccess: (res) => {
        setLocalTranscript((prev) => [
          ...prev,
          { sender: 'bot', text: res.reply, time: nowTime },
        ]);
      },
    });
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
          متصل مباشرة بقاعدة بيانات موقعك لتنفيذ التعديلات النصية اللحظية وعرض الإحصائيات الفعلية.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Capabilities Card */}
        <Card className="space-y-5 p-6">
          <h2 className="text-base font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
            مهام المساعد السريع في واتساب والمنصة
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
                  1. التحقق الآمن لمرة واحدة لكل جهاز
                </h3>
                <p
                  className="mt-1 text-xs font-medium leading-5 text-[#475569]"
                  style={{ color: '#475569' }}
                >
                  يوثّق ملكية رقمك في أول مرة فقط ويحفظ معرّف جهازك في قاعدة البيانات للدخول الفوري لاحقاً.
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
                  2. تعديلات مباشرة في قاعدة البيانات
                </h3>
                <p
                  className="mt-1 text-xs font-medium leading-5 text-[#475569]"
                  style={{ color: '#475569' }}
                >
                  أرسل: «أضف منتج: قهوة مختصة 25 ر.س» أو «أوقات العمل: 9ص - 11م» ليتم حفظها فوراً في موقعك المنشور.
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
                  3. إحصائيات الزيارات الحقيقية
                </h3>
                <p
                  className="mt-1 text-xs font-medium leading-5 text-[#475569]"
                  style={{ color: '#475569' }}
                >
                  اكتب: «كم زائر اليوم؟» ليعرض لك العدد الفعلي المسجل في جدول الزيارات بقاعدة البيانات.
                </p>
              </div>
            </div>
          </div>

          {botNumber && (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E293B] bg-[#0B132B] p-4 text-white"
              style={{ backgroundColor: '#0B132B', borderColor: '#1E293B', color: '#FFFFFF' }}
            >
              <div>
                <p className="text-xs font-bold text-[#93C5FD]" style={{ color: '#93C5FD' }}>
                  رقم بوت واتساب الرسمي المتصل:
                </p>
                <p
                  dir="ltr"
                  className="mt-0.5 text-right font-mono text-sm font-black text-white"
                  style={{ color: '#FFFFFF' }}
                >
                  +{botNumber.replace(/[^\d]/g, '')}
                </p>
              </div>
              <a
                href={`https://wa.me/${botNumber.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1D4ED8]"
                style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
              >
                <MessageCircle size={15} />
                <span>فتح محادثة البوت</span>
              </a>
            </div>
          )}
        </Card>

        {/* Live Database-Backed Assistant Console */}
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
                وحدة أوامر المساعد السريع المتصلة بالموقع
              </p>
              <p className="text-[11px] font-medium text-[#93C5FD]" style={{ color: '#93C5FD' }}>
                أي أمر هنا يحدّث موقعك ويحفظ في سجل المحادثات
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            className="flex-1 space-y-3 overflow-y-auto bg-[#F1F5F9] p-4"
            style={{ backgroundColor: '#F1F5F9' }}
          >
            {displayedMessages.map((msg, idx) => (
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
              'أضف منتج: قهوة مختصة 25 ر.س',
              'أوقات العمل: السبت - الخميس 9ص إلى 11م',
            ].map((cmd) => (
              <button
                key={cmd}
                type="button"
                disabled={sendMutation.isPending}
                onClick={() => sendCommand(cmd)}
                className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-bold text-[#334155] transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] disabled:opacity-50"
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
              placeholder="اكتب أمراً (مثال: أضف منتج: عسل سدر 120 ر.س)..."
              className="h-10 flex-1 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 text-xs font-medium text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
            />
            <button
              type="submit"
              disabled={sendMutation.isPending || !input.trim()}
              className="grid size-10 place-items-center rounded-xl bg-[#1D4ED8] text-white transition-transform hover:bg-[#1E40AF] disabled:opacity-50"
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
// Section: Analytics (100% Real Database Metrics — Zero Fake Numbers)
// ---------------------------------------------------------------------------
function AnalyticsSection({ account }: { account: Account }) {
  const website = account.website;
  const siteDoc = useSiteDocument();
  const doc = siteDoc.data;
  const collectionKey = doc?.collectionKey || 'items';
  const rawList = doc?.jsonStructure?.[collectionKey];
  const publishedItemsCount = Array.isArray(rawList) ? rawList.length : 0;
  const visitsToday = website?.visitsToday ?? 0;
  const visitsTotal = website?.visitsTotal ?? 0;
  const remainingMessages = Math.max(0, account.freeMessagesLimit - account.freeMessagesUsed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
          لوحة الإحصائيات والتحليلات الفعليّة
        </h1>
        <p className="mt-1 text-sm font-medium text-[#475569]" style={{ color: '#475569' }}>
          جميع الأرقام أدناه مسجلة فعلياً من قاعدة البيانات (جدول الزيارات وعناصر موقعك المنشورة) دون أي بيانات وهمية.
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
            data-testid="stat-visits-today"
          >
            {visitsToday}
          </p>
          <p className="mt-1 text-xs font-bold text-[#475569]" style={{ color: '#475569' }}>
            زيارات اليوم الفعليّة
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
            data-testid="stat-visits-total"
          >
            {visitsTotal}
          </p>
          <p className="mt-1 text-xs font-bold text-[#475569]" style={{ color: '#475569' }}>
            إجمالي الزيارات الكلي
          </p>
        </Card>

        <Card className="p-6">
          <span
            className="grid size-11 place-items-center rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]"
            style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' }}
          >
            <ShoppingBag size={20} />
          </span>
          <p
            className="mt-4 font-mono text-3xl font-black tabular-nums text-[#0F172A]"
            style={{ color: '#0F172A' }}
            data-testid="stat-published-items"
          >
            {publishedItemsCount}
          </p>
          <p className="mt-1 text-xs font-bold text-[#475569]" style={{ color: '#475569' }}>
            العناصر والخدمات المنشورة بالموقع
          </p>
        </Card>

        <Card className="p-6">
          <span
            className="grid size-11 place-items-center rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]"
            style={{ backgroundColor: '#F5F3FF', borderColor: '#DDD6FE', color: '#6D28D9' }}
          >
            <MessageCircle size={20} />
          </span>
          <p
            className="mt-4 font-mono text-3xl font-black tabular-nums text-[#0F172A]"
            style={{ color: '#0F172A' }}
            data-testid="stat-remaining-messages"
          >
            {remainingMessages}
          </p>
          <p className="mt-1 text-xs font-bold text-[#475569]" style={{ color: '#475569' }}>
            الرصيد المتبقي من رسائل المساعد
          </p>
        </Card>
      </div>

      <Card
        className="border-[#1E293B] bg-[#0B132B] p-6 text-white"
        style={{ backgroundColor: '#0B132B', borderColor: '#1E293B', color: '#FFFFFF' }}
      >
        <h3 className="text-sm font-black text-[#38BDF8]" style={{ color: '#38BDF8' }}>
          كيف يتم احتساب الزيارات؟
        </h3>
        <p className="mt-2 text-xs font-medium leading-6 text-[#CBD5E1]" style={{ color: '#CBD5E1' }}>
          يتم تسجيل كل زيارة حقيقية لموقعك المنشور تلقائياً في جدول <code className="font-mono text-white">site_visits</code> داخل قاعدة البيانات عند فتح الزوار لرابط موقعك.
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
  const queryClient = useQueryClient();
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === '1') {
      const tpl = params.get('template') || 'store';
      setSelectedTemplate(tpl);
      setCreateModalOpen(true);
    }
  }, []);

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
        onSuccess={(createdDoc) => {
          const updatedAccount = getLocalAccount();
          if (updatedAccount) {
            queryClient.setQueryData(accountQueryKey, updatedAccount);
          }
          queryClient.setQueryData(siteQueryKey, createdDoc);
          navigate('/dashboard/site');
        }}
      />
    </div>
  );
}
