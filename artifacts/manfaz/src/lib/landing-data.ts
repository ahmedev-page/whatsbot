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

export interface ServiceSubItem {
  id: string;
  templateId:
    | 'store'
    | 'restaurant'
    | 'services'
    | 'portfolio'
    | 'vcard'
    | 'survey'
    | 'booking'
    | 'rsvp'
    | 'invoice';
  visualKind: ServiceVisualKind;
  title: string;
  shortLabel: string;
  templateBadge: string;
  summary: string;
  features: string[];
  accentFrom: string;
  accentTo: string;
}

export interface ConsolidatedServiceGroup {
  id: 'websites' | 'tools';
  index: string;
  title: string;
  subtitle: string;
  badge: string;
  accentFrom: string;
  accentTo: string;
  items: ServiceSubItem[];
}

export const SERVICE_GROUPS: ConsolidatedServiceGroup[] = [
  {
    id: 'websites',
    index: '01',
    title: 'خدمات المواقع والواجهات الرقمية',
    subtitle: 'مواقع متكاملة بهوية مخصصة لكل نشاط (متجر، مطعم، شركة، صفحة شخصية، بطاقة رقمية).',
    badge: '5 قوالب مواقع مستقلة',
    accentFrom: '#2563EB',
    accentTo: '#0EA5E9',
    items: [
      {
        id: 'store',
        templateId: 'store',
        visualKind: 'store',
        title: 'متجر إلكتروني وسلة طلبات',
        shortLabel: 'متجر إلكتروني',
        templateBadge: 'قالب المتجر والسلة',
        summary: 'كتالوج منتجات بصور وأسعار وتصنيفات مع سلة شراء ترسل الطلب مباشرة إلى واتساب.',
        features: ['سلة شراء تفاعلية', 'تصنيفات وبحث فوري', 'إرسال الطلب لواتساب'],
        accentFrom: '#2563EB',
        accentTo: '#38BDF8',
      },
      {
        id: 'restaurant',
        templateId: 'restaurant',
        visualKind: 'menu',
        title: 'مطعم أو كافيه ومنيو QR',
        shortLabel: 'مطعم / كافيه',
        templateBadge: 'قالب المنيو الرقمي',
        summary: 'قائمة طعام ومشروبات مقسمة حسب الأصناف للطلب السريع من الطاولة أو التوصيل.',
        features: ['أقسام أطباق ومشروبات', 'مناسب لباركود الطاولات QR', 'طلب سريع عبر واتساب'],
        accentFrom: '#0284C7',
        accentTo: '#38BDF8',
      },
      {
        id: 'services',
        templateId: 'services',
        visualKind: 'website',
        title: 'موقع شركة أو مؤسسة خدمية',
        shortLabel: 'شركة / مؤسسة',
        templateBadge: 'قالب الشركات والخدمات',
        summary: 'واجهة رسمية تستعرض خدمات منشأتك، فريق العمل، آراء العملاء، وأسئلتهم الشائعة.',
        features: ['استعراض الخدمات والمميزات', 'قسم فريق العمل والآراء', 'بيانات تواصل وساعات عمل'],
        accentFrom: '#1D4ED8',
        accentTo: '#60A5FA',
      },
      {
        id: 'portfolio',
        templateId: 'portfolio',
        visualKind: 'quiz',
        title: 'صفحة شخصية ومعرض أعمال',
        shortLabel: 'صفحة شخصية / أعمال',
        templateBadge: 'قالب البورتفوليو والسيرة',
        summary: 'معرض أعمال احترافي للمستقلين والمبدعين يشمل المشاريع، المهارات، والخبرات العملية.',
        features: ['معرض مشاريع بصري', 'شريط المهارات والخبرات', 'الشهادات وطلب تواصل'],
        accentFrom: '#4F46E5',
        accentTo: '#818CF8',
      },
      {
        id: 'vcard',
        templateId: 'vcard',
        visualKind: 'profile',
        title: 'بطاقة تواصل رقمية وروابط (Bio)',
        shortLabel: 'بطاقة رقمية وروابط',
        templateBadge: 'قالب البطاقة والروابط',
        summary: 'صفحة روابط ذكية وبطاقة تعريفية تجمع كل حساباتك وقنوات تواصلك في رابط واحد.',
        features: ['أزرار روابط مخصصة', 'اتصال وواتساب بنقرة واحدة', 'حسابات التواصل الاجتماعي'],
        accentFrom: '#0D9488',
        accentTo: '#2DD4BF',
      },
    ],
  },
  {
    id: 'tools',
    index: '02',
    title: 'الخدمات التفاعلية والأدوات الذكية',
    subtitle: 'أدوات تفاعلية مستقلة بقوالب مخصصة (استبيان، حجز مواعيد، دعوات حضور، باقات أسعار).',
    badge: '4 قوالب أدوات تفاعلية',
    accentFrom: '#4F46E5',
    accentTo: '#0D9488',
    items: [
      {
        id: 'survey',
        templateId: 'survey',
        visualKind: 'survey',
        title: 'استبيان واستطلاع رأي العملاء',
        shortLabel: 'استبيان وتقييم',
        templateBadge: 'قالب الاستبيان التفاعلي',
        summary: 'نموذج استبيان مخصص بأسئلة تقييم واختيارات متعددة ومؤشر تقدم، مع إرسال الإجابات.',
        features: ['تقييم بالنجوم والاختيارات', 'مؤشر تقدم الأسئلة', 'ملخص فوري وإرسال الردود'],
        accentFrom: '#0284C7',
        accentTo: '#38BDF8',
      },
      {
        id: 'booking',
        templateId: 'booking',
        visualKind: 'booking',
        title: 'نظام حجز المواعيد والاستشارات',
        shortLabel: 'حجز المواعيد',
        templateBadge: 'قالب جدولة المواعيد',
        summary: 'صفحة حجز مخصصة للعيادات والصالونات والمستشارين لاختيار الخدمة والوقت وتأكيد الموعد.',
        features: ['اختيار الخدمة والمدة', 'تحديد التاريخ والوقت', 'تأكيد الحجز عبر واتساب'],
        accentFrom: '#0D9488',
        accentTo: '#2DD4BF',
      },
      {
        id: 'rsvp',
        templateId: 'rsvp',
        visualKind: 'invite',
        title: 'دعوة فعالية وتأكيد حضور (RSVP)',
        shortLabel: 'دعوة وتأكيد حضور',
        templateBadge: 'قالب الدعوات والفعاليات',
        summary: 'بطاقة دعوة رقمية للمناسبات والمؤتمرات تعرض جدول الفقرات ونموذج تأكيد الحضور.',
        features: ['جدول فقرات الفعالية والموقع', 'نموذج تأكيد أو اعتذار', 'بطاقة دخول رقمية للضيف'],
        accentFrom: '#4F46E5',
        accentTo: '#818CF8',
      },
      {
        id: 'invoice',
        templateId: 'invoice',
        visualKind: 'services_pkg',
        title: 'باقات الأسعار وعروض الخدمات',
        shortLabel: 'باقات وعروض أسعار',
        templateBadge: 'قالب الباقات وحاسبة السعر',
        summary: 'واجهة تسعير تفاعلية تتيح للعميل اختيار الباقات أو البنود وحساب التكلفة الإجمالية فوراً.',
        features: ['مقارنة الباقات والأسعار', 'حاسبة تكلفة تفاعلية', 'طلب عرض سعر رسمي'],
        accentFrom: '#6D28D9',
        accentTo: '#8B5CF6',
      },
    ],
  },
];

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
    categoryLabel: 'خدمات المواقع',
    title: 'موقع رسمي للشركات',
    summary: 'واجهة مؤسسية لشركتك أو علامتك التجارية.',
    templateId: 'services',
    accentFrom: '#2563EB',
    accentTo: '#0EA5E9',
    featuredSpan: true,
  },
  {
    id: 'store',
    index: '02',
    category: 'commerce',
    categoryLabel: 'خدمات المواقع',
    title: 'متجر إلكتروني وسلة طلبات',
    summary: 'عرض المنتجات وإدارة الطلبات بخطوات شراء سريعة.',
    templateId: 'store',
    accentFrom: '#4F46E5',
    accentTo: '#818CF8',
    featuredSpan: true,
  },
  {
    id: 'menu',
    index: '03',
    category: 'commerce',
    categoryLabel: 'خدمات المواقع',
    title: 'قائمة طعام رقمية QR',
    summary: 'منيو تفاعلي للمطاعم والمقاهي مع طلب فوري.',
    templateId: 'restaurant',
    accentFrom: '#0284C7',
    accentTo: '#38BDF8',
  },
  {
    id: 'booking',
    index: '04',
    category: 'commerce',
    categoryLabel: 'الخدمات التفاعلية',
    title: 'نظام حجز المواعيد',
    summary: 'جدولة المواعيد والاستشارات للعيادات والمكاتب.',
    templateId: 'booking',
    accentFrom: '#0D9488',
    accentTo: '#2DD4BF',
  },
  {
    id: 'profile',
    index: '05',
    category: 'presence',
    categoryLabel: 'خدمات المواقع',
    title: 'البطاقة الرقمية والروابط',
    summary: 'هويتك الرقمية وجميع قنوات تواصلك في رابط واحد.',
    templateId: 'vcard',
    accentFrom: '#3B82F6',
    accentTo: '#60A5FA',
  },
  {
    id: 'services_pkg',
    index: '06',
    category: 'presence',
    categoryLabel: 'الخدمات التفاعلية',
    title: 'باقات وعروض الأسعار',
    summary: 'جداول تسعير الباقات وحاسبة التكلفة التفاعلية.',
    templateId: 'invoice',
    accentFrom: '#6366F1',
    accentTo: '#A855F7',
  },
  {
    id: 'loyalty',
    index: '07',
    category: 'commerce',
    categoryLabel: 'خدمات المواقع',
    title: 'صفحة شخصية ومعرض أعمال',
    summary: 'استعراض المشاريع السابقة والمهارات والخبرات.',
    templateId: 'portfolio',
    accentFrom: '#6D28D9',
    accentTo: '#8B5CF6',
  },
  {
    id: 'reviews',
    index: '08',
    category: 'commerce',
    categoryLabel: 'الخدمات التفاعلية',
    title: 'استبيان تقييم الخدمة',
    summary: 'قياس رضا العملاء وتقييم جودة الخدمة مباشرة.',
    templateId: 'survey',
    accentFrom: '#1D4ED8',
    accentTo: '#3B82F6',
  },
  {
    id: 'survey',
    index: '09',
    category: 'engagement',
    categoryLabel: 'الخدمات التفاعلية',
    title: 'استطلاعات رأي العملاء',
    summary: 'نموذج استبيان مخصص بأسئلة وتقييمات تفاعلية.',
    templateId: 'survey',
    accentFrom: '#0284C7',
    accentTo: '#38BDF8',
  },
  {
    id: 'quiz',
    index: '10',
    category: 'engagement',
    categoryLabel: 'الخدمات التفاعلية',
    title: 'الاختبارات التفاعلية',
    summary: 'أسئلة تقييمية للجمهور مع احتساب فوري للنتيجة.',
    templateId: 'survey',
    accentFrom: '#7C3AED',
    accentTo: '#C084FC',
  },
  {
    id: 'poll',
    index: '11',
    category: 'engagement',
    categoryLabel: 'الخدمات التفاعلية',
    title: 'التصويت والاستفتاء الحي',
    summary: 'استفتاءات سريعة للجمهور بخيارات واضحة.',
    templateId: 'survey',
    accentFrom: '#059669',
    accentTo: '#34D399',
  },
  {
    id: 'invite',
    index: '12',
    category: 'engagement',
    categoryLabel: 'الخدمات التفاعلية',
    title: 'بطاقات الدعوة وتأكيد الحضور',
    summary: 'دعوات رسمية للمؤتمرات والمناسبات مع تسجيل الحضور.',
    templateId: 'rsvp',
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
  id: 'store' | 'restaurant' | 'booking' | 'services' | 'survey' | 'rsvp' | 'invoice' | 'vcard';
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
    badge: 'قالب المتجر والسلة',
    defaultTitle: 'دار أروما للقهوة المختصة',
    subtitle: 'محاصيل مختصة محمصة بعناية وأدوات ترشيح احترافية',
    cta: 'تصفح المتجر الآن',
    kpiLabel: 'معدل إتمام الطلب',
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
    badge: 'قالب المنيو الرقمي',
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
    badge: 'قالب جدولة المواعيد',
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
    badge: 'قالب الشركات والخدمات',
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
  survey: {
    id: 'survey',
    label: 'استبيان وتقييم',
    badge: 'قالب الاستبيان التفاعلي',
    defaultTitle: 'استبيان قياس تجربة الضيوف',
    subtitle: 'شاركنا رأيك في دقيقتين لنرتقي بجودة خدماتنا',
    cta: 'إرسال التقييم الآن',
    kpiLabel: 'مؤشر الرضا العام',
    kpiValue: '4.9 / 5',
    growthDelta: '+180 مشاركة جديدة',
    sparkline: [60, 68, 75, 82, 88, 94, 98],
    items: [
      {
        name: 'كيف تقيّم سرعة الاستقبال وجودة الضيافة؟',
        meta: 'سؤال تقييم نجوم · من 1 إلى 5 نجوم',
        price: '★★★★★',
        tag: 'سؤال 01',
      },
      {
        name: 'ما مدى رضاك عن جودة المنتجات والأسعار؟',
        meta: 'اختيار متعدد · ممتاز / جيد جداً / مقبول',
        price: 'ممتاز',
        tag: 'سؤال 02',
      },
      {
        name: 'هل توصي بخدماتنا لأصدقائك وزملائك؟',
        meta: 'مؤشر صافي الترويج NPS · بالتأكيد نعم',
        price: '10 / 10',
        tag: 'سؤال 03',
      },
    ],
  },
  rsvp: {
    id: 'rsvp',
    label: 'دعوة فعالية RSVP',
    badge: 'قالب الدعوات وتأكيد الحضور',
    defaultTitle: 'ملتقى الابتكار والتحول الرقمي 2026',
    subtitle: 'يسعدنا دعوتكم لحضور الأمسية السنوية وتأكيد بيانات الحضور',
    cta: 'تأكيد الحضور الآن',
    kpiLabel: 'الحضور المؤكد',
    kpiValue: '245 ضيفاً',
    growthDelta: 'اكتمال 88% من المقاعد',
    sparkline: [30, 45, 58, 70, 80, 85, 92],
    items: [
      {
        name: 'استقبال الضيوف والتسجيل',
        meta: 'البهو الرئيسي · قهوة سعودية وترحيب',
        price: '07:00 م',
        tag: 'فقرة 01',
      },
      {
        name: 'الكلمة الافتتاحية وعرض المشاريع',
        meta: 'القاعة الكبرى · كلمة رئيس مجلس الإدارة',
        price: '08:00 م',
        tag: 'فقرة 02',
      },
      {
        name: 'حفل العشاء والتواصل المهني',
        meta: 'صالة الضيافة الملكية · تكريم الشركاء',
        price: '09:30 م',
        tag: 'فقرة 03',
      },
    ],
  },
  invoice: {
    id: 'invoice',
    label: 'باقات وعروض أسعار',
    badge: 'قالب الباقات وحاسبة السعر',
    defaultTitle: 'باقات الهوية الرقمية والتسويق',
    subtitle: 'اختر الباقة المناسبة لمنشأتك أو اجمع البنود لحساب التكلفة فوراً',
    cta: 'طلب عرض السعر المعتمد',
    kpiLabel: 'معدل قبول العروض',
    kpiValue: '94.6%',
    growthDelta: 'تسعير فوري شفاف',
    sparkline: [45, 54, 63, 72, 81, 89, 95],
    items: [
      {
        name: 'باقة الانطلاق للمشاريع الناشئة',
        meta: 'شعار + هوية أساسية + موقع تعريفي',
        price: '2,500 ر.س',
        tag: 'دفعة واحدة',
      },
      {
        name: 'باقة النمو والتجارة المتكاملة',
        meta: 'متجر إلكتروني + ربط واتساب + إدارة محتوى',
        price: '4,800 ر.س',
        tag: 'الأكثر اختياراً',
      },
      {
        name: 'باقة الشركات والحلول المخصصة',
        meta: 'أنظمة حجز + استبيانات + دعم فني مخصص',
        price: '8,500 ر.س',
        tag: 'سنوياً',
      },
    ],
  },
  vcard: {
    id: 'vcard',
    label: 'بطاقة رقمية Bio',
    badge: 'قالب البطاقة والروابط',
    defaultTitle: 'م. طارق السديري — مستشار تقني',
    subtitle: 'جميع قنوات التواصل الرسمي والروابط المهنية في صفحة واحدة',
    cta: 'حفظ جهة الاتصال',
    kpiLabel: 'نقرات الروابط',
    kpiValue: '1,840',
    growthDelta: '+39% تفاعل مباشر',
    sparkline: [40, 52, 61, 70, 78, 86, 96],
    items: [
      {
        name: 'حجز استشارة تقنية مباشرة',
        meta: 'جلسة عبر Zoom أو حضورياً في الرياض',
        price: 'رابط مباشر',
        tag: 'مميز',
      },
      {
        name: 'ملف الأعمال والمشاريع المنفذة PDF',
        meta: 'استعراض أبرز 25 مشروعاً تقنياً',
        price: 'تحميل',
        tag: 'بورتفوليو',
      },
      {
        name: 'القناة الرسمية على LinkedIn و X',
        meta: 'مقالات أسبوعية في هندسة البرمجيات',
        price: 'متابعة',
        tag: 'تواصل',
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
    desc: 'تأكيد ملكية الرقم لمرة واحدة عبر البوت ثم حفظ جهازك الموثوق للدخول الفوري.',
    command: 'ORX-849201',
    reply: 'تم التحقق من ملكية الرقم بنجاح. جلستك وجهازك موثقان الآن في المنصة.',
    badge: 'توثيق لمرة واحدة',
    highlightLabel: 'حالة الجهاز',
    highlightValue: 'جهاز موثوق ومشفر (TLS 1.3)',
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
    desc: 'اطلب ملخص الزيارات والطلبات اليومية في أي لحظة مباشرة من المحادثة.',
    command: 'تقرير الأداء اليومي',
    reply: 'إجمالي الزيارات اليوم: 1,420 زيارة (+24%) · الطلبات المكتملة: 86 طلباً.',
    badge: 'إحصائيات حية وموثقة',
    highlightLabel: 'زيارات اليوم',
    highlightValue: '1,420 زيارة (+24%)',
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
