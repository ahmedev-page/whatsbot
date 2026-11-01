import type { SiteStyle } from './account.ts';

export type ServiceCategory = 'all' | 'presence' | 'commerce' | 'engagement';

export type ServiceVisualKind =
  | 'website'
  | 'store'
  | 'menu'
  | 'booking'
  | 'profile'
  | 'services_pkg'
  | 'loyalty'
  | 'reviews'
  | 'survey'
  | 'quiz'
  | 'poll'
  | 'invite';

export interface PlatformServiceItem {
  id: ServiceVisualKind;
  index: string;
  category: Exclude<ServiceCategory, 'all'>;
  categoryLabel: string;
  title: string;
  summary: string;
  templateId: string;
  accentFrom: string;
  accentTo: string;
  featuredSpan?: boolean;
}

export const PLATFORM_SERVICES: PlatformServiceItem[] = [
  {
    id: 'website',
    index: '01',
    category: 'presence',
    categoryLabel: 'الواجهات الرقمية',
    title: 'موقع رسمي متكامل',
    summary: 'واجهة مؤسسية فاخرة لشركتك أو علامتك التجارية بهوية بصرية متكاملة.',
    templateId: 'services',
    accentFrom: '#2563EB',
    accentTo: '#0EA5E9',
    featuredSpan: true,
  },
  {
    id: 'store',
    index: '02',
    category: 'commerce',
    categoryLabel: 'التجارة والمبيعات',
    title: 'متجر إلكتروني وسلة شراء',
    summary: 'عرض المنتجات وإدارة الطلبات والفواتير بخطوات شراء سريعة.',
    templateId: 'store',
    accentFrom: '#4F46E5',
    accentTo: '#818CF8',
    featuredSpan: true,
  },
  {
    id: 'menu',
    index: '03',
    category: 'commerce',
    categoryLabel: 'التجارة والمبيعات',
    title: 'قائمة طعام رقمية QR',
    summary: 'منيو تفاعلي للمطاعم والمقاهي مع طلب فوري للطاولات.',
    templateId: 'restaurant',
    accentFrom: '#0284C7',
    accentTo: '#38BDF8',
  },
  {
    id: 'booking',
    index: '04',
    category: 'commerce',
    categoryLabel: 'التجارة والمبيعات',
    title: 'نظام حجز المواعيد',
    summary: 'جدولة المواعيد والاستشارات للعيادات والمكاتب تلقائياً.',
    templateId: 'booking',
    accentFrom: '#0D9488',
    accentTo: '#2DD4BF',
  },
  {
    id: 'profile',
    index: '05',
    category: 'presence',
    categoryLabel: 'الواجهات الرقمية',
    title: 'البطاقة التعريفية والروابط',
    summary: 'هويتك الرقمية وجميع قنوات تواصلك الرسمية في رابط واحد.',
    templateId: 'portfolio',
    accentFrom: '#3B82F6',
    accentTo: '#60A5FA',
  },
  {
    id: 'services_pkg',
    index: '06',
    category: 'presence',
    categoryLabel: 'الواجهات الرقمية',
    title: 'معرض الأعمال والباقات',
    summary: 'استعراض المشاريع السابقة وجداول تسعير الباقات بأسلوب بصري.',
    templateId: 'portfolio',
    accentFrom: '#6366F1',
    accentTo: '#A855F7',
  },
  {
    id: 'loyalty',
    index: '07',
    category: 'commerce',
    categoryLabel: 'التجارة والمبيعات',
    title: 'برنامج الولاء والأختام',
    summary: 'بطاقة ولاء رقمية لمكافأة عملائك الدائمين ورفع تكرار الشراء.',
    templateId: 'store',
    accentFrom: '#6D28D9',
    accentTo: '#8B5CF6',
  },
  {
    id: 'reviews',
    index: '08',
    category: 'commerce',
    categoryLabel: 'التجارة والمبيعات',
    title: 'بوابة تقييمات Google',
    summary: 'رفع تصنيف منشأتك عبر توجيه العملاء للتقييم الفوري.',
    templateId: 'services',
    accentFrom: '#1D4ED8',
    accentTo: '#3B82F6',
  },
  {
    id: 'survey',
    index: '09',
    category: 'engagement',
    categoryLabel: 'التفاعل والولاء',
    title: 'استطلاعات رأي العملاء',
    summary: 'قياس رضا العملاء وتحليل النتائج في لوحة تقارير موحدة.',
    templateId: 'services',
    accentFrom: '#0284C7',
    accentTo: '#38BDF8',
  },
  {
    id: 'quiz',
    index: '10',
    category: 'engagement',
    categoryLabel: 'التفاعل والولاء',
    title: 'الاختبارات التفاعلية',
    summary: 'تقييمات ذكية للجمهور مع احتساب فوري للنتائج والنقاط.',
    templateId: 'portfolio',
    accentFrom: '#7C3AED',
    accentTo: '#C084FC',
  },
  {
    id: 'poll',
    index: '11',
    category: 'engagement',
    categoryLabel: 'التفاعل والولاء',
    title: 'التصويت والاستفتاء الحي',
    summary: 'استفتاءات مباشرة للجمهور بنسب مئوية ورسوم بيانية لحظية.',
    templateId: 'services',
    accentFrom: '#059669',
    accentTo: '#34D399',
  },
  {
    id: 'invite',
    index: '12',
    category: 'engagement',
    categoryLabel: 'التفاعل والولاء',
    title: 'بطاقات الدعوة وتأكيد الحضور',
    summary: 'دعوات رسمية للمؤتمرات والمناسبات بباركود دخول ذكي.',
    templateId: 'booking',
    accentFrom: '#1E40AF',
    accentTo: '#3B82F6',
  },
];

export interface StudioPresetItem {
  name: string;
  meta: string;
  price: string;
  tag: string;
}

export interface StudioPresetConfig {
  id: 'store' | 'restaurant' | 'booking' | 'services';
  label: string;
  badge: string;
  defaultTitle: string;
  subtitle: string;
  cta: string;
  kpiLabel: string;
  kpiValue: string;
  growthDelta: string;
  sparkline: number[];
  items: StudioPresetItem[];
}

export const STUDIO_PRESETS: Record<StudioPresetConfig['id'], StudioPresetConfig> = {
  store: {
    id: 'store',
    label: 'متجر إلكتروني',
    badge: 'تجارة إلكترونية متكاملة',
    defaultTitle: 'دار أروما للقهوة المختصة',
    subtitle: 'محاصيل مختصة محمصة بعناية وأدوات ترشيح احترافية',
    cta: 'تصفح المتجر الآن',
    kpiLabel: 'معدل إتمام الشراء',
    kpiValue: '98.4%',
    growthDelta: '+34% هذا الشهر',
    sparkline: [38, 52, 49, 68, 74, 89, 98],
    items: [
      {
        name: 'محصول إثيوبيا الملكي — 250g',
        meta: 'حمص فلتر · إيحاءات الياسمين والتوت',
        price: '68 ر.س',
        tag: 'الأكثر مبيعاً',
      },
      {
        name: 'محصول كولومبيا سوبريمو — 250g',
        meta: 'إسبريسو فاخر · قوام غني ومتوازن',
        price: '59 ر.س',
        tag: 'تحميص اليوم',
      },
      {
        name: 'مجموعة التقطير النحاسية V60',
        meta: 'إصدار خاص · شامل إبريق الترشيح والميزان',
        price: '240 ر.س',
        tag: 'باقة متكاملة',
      },
    ],
  },
  restaurant: {
    id: 'restaurant',
    label: 'منيو مطعم QR',
    badge: 'قائمة تفاعلية ذكية',
    defaultTitle: 'أوليڤيا لاونج — القائمة الرقمية',
    subtitle: 'مطبخ متوسطي معاصر للطلب المباشر من الطاولة',
    cta: 'استعراض القائمة',
    kpiLabel: 'متوسط زمن الطلب',
    kpiValue: '18 ثانية',
    growthDelta: '+42% دوران الطاولات',
    sparkline: [42, 48, 61, 65, 79, 86, 95],
    items: [
      {
        name: 'ترافل ريزوتو الإيطالي الفاخر',
        meta: 'أطباق رئيسية · جبن بارميزان معتق وفطر بري',
        price: '95 ر.س',
        tag: 'توصية الشيف',
      },
      {
        name: 'سالمون نرويجي مشوي على الحطب',
        meta: 'مأكولات بحرية · يقدم مع صوص الليمون والأعشاب',
        price: '125 ر.س',
        tag: 'طازج يومياً',
      },
      {
        name: 'تيراميسو الفستق الصقلي',
        meta: 'حلويات خاصة · تحضير منزلي يومي',
        price: '52 ر.س',
        tag: 'حصري',
      },
    ],
  },
  booking: {
    id: 'booking',
    label: 'حجز مواعيد',
    badge: 'جدولة مواعيد تلقائية',
    defaultTitle: 'مركز سمايا الطبي التخصصي',
    subtitle: 'حجز المواعيد والاستشارات الطبية بتأكيد فوري',
    cta: 'احجز موعدك الآن',
    kpiLabel: 'نسبة التزام المواعيد',
    kpiValue: '99.2%',
    growthDelta: '+51% حجوزات أونلاين',
    sparkline: [50, 58, 66, 73, 81, 90, 99],
    items: [
      {
        name: 'استشارة تجميل وتصميم الابتسامة',
        meta: 'د. فيصل العتيبي · مدة الجلسة 45 دقيقة',
        price: '300 ر.س',
        tag: 'متاح اليوم',
      },
      {
        name: 'جلسة الليزر التجميلي المتقدم',
        meta: 'د. سارة المنصور · شاملة المتابعة المجانية',
        price: '750 ر.س',
        tag: 'حجز فوري',
      },
      {
        name: 'الفحص الدوري الشامل للأسنان',
        meta: 'أشعة بانورامية وتقرير علاجي متكامل',
        price: '250 ر.س',
        tag: 'باقة العناية',
      },
    ],
  },
  services: {
    id: 'services',
    label: 'واجهة شركات',
    badge: 'حضور مؤسسي رسمي',
    defaultTitle: 'مجموعة آفاق للاستشارات المالية',
    subtitle: 'حلول استراتيجية وهيكلة مالية وإدارة أصول للشركات',
    cta: 'طلب استشارة تنفيذية',
    kpiLabel: 'المنشآت المخدومة',
    kpiValue: '+420 شركة',
    growthDelta: '99.8% رضا العملاء',
    sparkline: [35, 49, 60, 72, 80, 88, 97],
    items: [
      {
        name: 'باقة التأسيس والحوكمة المؤسسية',
        meta: 'هيكلة مالية وقانونية شاملة للشركات الصاعدة',
        price: '4,500 ر.س',
        tag: 'باقة الأعمال',
      },
      {
        name: 'الإدارة المالية التنفيذية CFO',
        meta: 'تقارير ربع سنوية وتخطيط التدفقات النقدية',
        price: '8,200 ر.س',
        tag: 'الأكثر طلباً',
      },
      {
        name: 'تقييم المخاطر والامتثال النظامي',
        meta: 'مراجعة معتمدة وتقرير لمجلس الإدارة',
        price: '12,000 ر.س',
        tag: 'كبار العملاء',
      },
    ],
  },
};

export interface ExecutiveColorTheme {
  hex: string;
  secondaryHex: string;
  name: string;
}

export const EXECUTIVE_THEMES: ExecutiveColorTheme[] = [
  { hex: '#2563EB', secondaryHex: '#0EA5E9', name: 'ياقوتي ملكي' },
  { hex: '#4F46E5', secondaryHex: '#818CF8', name: 'نيلي تنفيذي' },
  { hex: '#0D9488', secondaryHex: '#14B8A6', name: 'زمردي سيادي' },
  { hex: '#6D28D9', secondaryHex: '#8B5CF6', name: 'بنفسجي ملكي' },
];

export const STYLE_MODES: { id: SiteStyle; name: string; desc: string }[] = [
  { id: 'cinematic', name: 'ملكي داكن', desc: 'تباين عميق وفخامة عالية' },
  { id: 'modern', name: 'معماري حديث', desc: 'مساحات مضيئة وخطوط حادة' },
  { id: 'classic', name: 'كلاسيكي رسمي', desc: 'طابع مصرفي ومؤسسي رصين' },
  { id: 'app', name: 'واجهة تطبيق', desc: 'تجربة جوال تفاعلية سريعة' },
];

export interface BotPillarItem {
  id: 'auth' | 'edit' | 'analytics';
  index: string;
  title: string;
  desc: string;
  command: string;
  reply: string;
  badge: string;
  highlightLabel: string;
  highlightValue: string;
}

export const BOT_PILLARS: BotPillarItem[] = [
  {
    id: 'auth',
    index: '01',
    title: 'توثيق الدخول الأمني (OTP)',
    desc: 'لا دخول مباشر بدون كود التحقق المرسل لبوت واتساب لضمان أمان حسابك ومنشأتك.',
    command: 'ORX-849201',
    reply: 'تم التحقق من ملكية الرقم بنجاح. جلستك موثقة الآن في استوديو المنصة.',
    badge: 'حماية سيادية 100%',
    highlightLabel: 'حالة الجلسة',
    highlightValue: 'موثقة ومشفرة (TLS 1.3)',
  },
  {
    id: 'edit',
    index: '02',
    title: 'التعديلات النصية الفورية',
    desc: 'عدّل الأسعار، العناوين، أو ساعات العمل برسالة نصية واحدة أثناء تنقلك.',
    command: 'تحديث سعر محصول إثيوبيا إلى 64 ر.س',
    reply: 'تم تحديث السعر في موقعك الرسمي المنشور فوراً دون توقف الخدمة.',
    badge: 'مزامنة خلال 0.8 ثانية',
    highlightLabel: 'التحديث المباشر',
    highlightValue: '68 ر.س ← 64 ر.س (تم النشر)',
  },
  {
    id: 'analytics',
    index: '03',
    title: 'تقارير الأداء والزوار',
    desc: 'اطلب ملخص الزيارات والطلبات والمبيعات اليومية في أي لحظة مباشرة من المحادثة.',
    command: 'تقرير الأداء اليومي',
    reply: 'إجمالي الزيارات اليوم: 1,420 زيارة (+24%) · الطلبات المكتملة: 86 طلباً.',
    badge: 'إحصائيات حية وموثقة',
    highlightLabel: 'مبيعات اليوم',
    highlightValue: '14,850 ر.س (+24%)',
  },
];

export function filterServicesByCategory(category: ServiceCategory): PlatformServiceItem[] {
  if (category === 'all') {
    return PLATFORM_SERVICES;
  }
  return PLATFORM_SERVICES.filter((item) => item.category === category);
}

export function resolveStudioPreviewState(
  presetKey: string,
  customTitle: string,
  accentHex: string,
  styleMode: SiteStyle,
) {
  const preset =
    STUDIO_PRESETS[presetKey as StudioPresetConfig['id']] ?? STUDIO_PRESETS.store;
  const theme =
    EXECUTIVE_THEMES.find((t) => t.hex === accentHex) ?? EXECUTIVE_THEMES[0];
  const displayTitle = customTitle.trim().length > 0 ? customTitle.trim() : preset.defaultTitle;

  return {
    preset,
    theme,
    displayTitle,
    styleMode,
    isDarkCanvas: styleMode === 'cinematic',
  };
}
