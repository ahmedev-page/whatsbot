import type {
  CreateInPlatformInput,
  InitialCollectionItemInput,
  SiteStyle,
} from '@/lib/account';

export interface TemplateVisualCardSpec {
  id: string;
  style: SiteStyle;
  title: string;
  badge: string;
  previewHeadlineEn: string;
  previewSubEn: string;
  surfaceBg: string;
  cardBg: string;
  textPrimary: string;
  accentColor: string;
  isDarkPreview: boolean;
}

export interface ConversationalServiceOption {
  templateId: string;
  groupId: 'websites' | 'tools';
  shortLabel: string;
  title: string;
  desc: string;
  userIntentPhrase: string;
  botPraisePhrase: string;
  nameQuestion: string;
  templateGalleryPrompt: string;
  colorQuestion: string;
  defaultSampleName: string;
  itemNoun: string;
  ctaPlaceholder: string;
  keywords: string[];
  visualCards: TemplateVisualCardSpec[];
}

export interface ChatColorSwatch {
  hex: string;
  label: string;
  ringColor: string;
}

export const CHAT_COLOR_SWATCHES: ChatColorSwatch[] = [
  { hex: '#1D4ED8', label: 'أزرق ملكي', ringColor: '#38BDF8' },
  { hex: '#6D28D9', label: 'بنفسجي فاخر', ringColor: '#A78BFA' },
  { hex: '#059669', label: 'زمردي أصيل', ringColor: '#34D399' },
  { hex: '#D97706', label: 'ذهبي دافئ', ringColor: '#FBBF24' },
  { hex: '#94A3B8', label: 'فضي بلاتيني', ringColor: '#E2E8F0' },
  { hex: '#0284C7', label: 'سماوي مضيء', ringColor: '#38BDF8' },
  { hex: '#0F766E', label: 'تركواز عميق', ringColor: '#2DD4BF' },
  { hex: '#BE123C', label: 'ياقوتي', ringColor: '#FB7185' },
  { hex: '#0B132B', label: 'كحلي ليلي', ringColor: '#60A5FA' },
];

export const CONVERSATION_SERVICE_OPTIONS: ConversationalServiceOption[] = [
  {
    templateId: 'store',
    groupId: 'websites',
    shortLabel: 'متجر إلكتروني',
    title: 'متجر إلكتروني وسلة طلبات',
    desc: 'عرض المنتجات بالتصنيفات والأسعار مع سلة شراء ذكية ترسل الطلب لواتساب.',
    userIntentPhrase: 'أريد إنشاء متجر إلكتروني',
    botPraisePhrase: 'رائع! متجر إلكتروني هو اختيار ممتاز 👍',
    nameQuestion: 'ما اسم متجرك؟',
    templateGalleryPrompt: 'ممتاز! الآن اختر قالباً يناسب متجرك:',
    colorQuestion: 'ما لون هوية متجرك؟',
    defaultSampleName: 'دار آروما',
    itemNoun: 'منتج',
    ctaPlaceholder: 'تواصل واطلب الآن',
    keywords: ['متجر', 'سلة', 'تسوق', 'منتجات', 'بيع', 'تجارة'],
    visualCards: [
      {
        id: 'store-classic',
        style: 'classic',
        title: 'قالب القهوة الفاخر',
        badge: 'كلاسيكي أنيق',
        previewHeadlineEn: 'Dar Aroma\nSpecial Coffee',
        previewSubEn: 'Artisanal Roastery & Blends',
        surfaceBg: '#EAE0D5',
        cardBg: '#F6F1EB',
        textPrimary: '#2C1E16',
        accentColor: '#7C4D2B',
        isDarkPreview: false,
      },
      {
        id: 'store-modern',
        style: 'modern',
        title: 'قالب عصري مميز',
        badge: 'عصري فائق',
        previewHeadlineEn: 'Dar Aroma\nCoffee',
        previewSubEn: 'Specialty Beans & Espresso',
        surfaceBg: '#1E120B',
        cardBg: '#2C1A10',
        textPrimary: '#FFFFFF',
        accentColor: '#C88A56',
        isDarkPreview: true,
      },
      {
        id: 'store-app',
        style: 'app',
        title: 'قالب بسيط وأنيق',
        badge: 'تطبيق جوال',
        previewHeadlineEn: 'Good Coffee\nBetter Mood',
        previewSubEn: 'Fresh Daily Selection',
        surfaceBg: '#F4EFEA',
        cardBg: '#FFFFFF',
        textPrimary: '#1F1712',
        accentColor: '#8C5836',
        isDarkPreview: false,
      },
      {
        id: 'store-cinematic',
        style: 'cinematic',
        title: 'قالب سينمائي فاخر',
        badge: 'سينمائي فاخر',
        previewHeadlineEn: 'Luxury Edition\nShowcase',
        previewSubEn: 'VIP Collection & Box',
        surfaceBg: '#090D16',
        cardBg: '#111827',
        textPrimary: '#F8FAFC',
        accentColor: '#38BDF8',
        isDarkPreview: true,
      },
    ],
  },
  {
    templateId: 'restaurant',
    groupId: 'websites',
    shortLabel: 'مطعم / كافيه',
    title: 'منيو مطعم أو كافيه رقمي QR',
    desc: 'قائمة طعام ومشروبات مقسمة بالأصناف والأسعار والصور مع طلب مباشر.',
    userIntentPhrase: 'أريد إنشاء منيو مطعم أو كافيه رقمي',
    botPraisePhrase: 'رائع! منيو المطعم والكافيه الرقمي خيار ممتاز 👍',
    nameQuestion: 'ما اسم مطعمك أو مقهاك؟',
    templateGalleryPrompt: 'ممتاز! الآن اختر قالباً يناسب قائمة مطعمك:',
    colorQuestion: 'ما لون هوية مطعمك؟',
    defaultSampleName: 'دار آروما كافيه',
    itemNoun: 'طبق / صنف',
    ctaPlaceholder: 'شاهد المنيو واطلب',
    keywords: ['مطعم', 'منيو', 'كافيه', 'مقهى', 'طعام', 'قهوة', 'وجبات'],
    visualCards: [
      {
        id: 'rest-classic',
        style: 'classic',
        title: 'قالب الضيافة الفاخر',
        badge: 'كلاسيكي أنيق',
        previewHeadlineEn: 'Fine Dining\nSignature Menu',
        previewSubEn: 'Chef Curated Dishes',
        surfaceBg: '#EFE7DD',
        cardBg: '#FAF6F0',
        textPrimary: '#2A1B12',
        accentColor: '#8B4513',
        isDarkPreview: false,
      },
      {
        id: 'rest-modern',
        style: 'modern',
        title: 'قالب عصري مميز',
        badge: 'عصري فائق',
        previewHeadlineEn: 'Specialty\nRoast & Kitchen',
        previewSubEn: 'Order Direct from Table',
        surfaceBg: '#1A110B',
        cardBg: '#2A1B12',
        textPrimary: '#FFFFFF',
        accentColor: '#D97706',
        isDarkPreview: true,
      },
      {
        id: 'rest-app',
        style: 'app',
        title: 'قالب بسيط وأنيق',
        badge: 'منيو سريع QR',
        previewHeadlineEn: 'Fresh Taste\nEvery Day',
        previewSubEn: 'Instant Table Menu',
        surfaceBg: '#F8FAFC',
        cardBg: '#FFFFFF',
        textPrimary: '#0F172A',
        accentColor: '#0F766E',
        isDarkPreview: false,
      },
      {
        id: 'rest-cinematic',
        style: 'cinematic',
        title: 'قالب لاونج سينمائي',
        badge: 'سينمائي فاخر',
        previewHeadlineEn: 'Night Lounge\nTasting Menu',
        previewSubEn: 'Artisanal Drinks & Bites',
        surfaceBg: '#090D16',
        cardBg: '#131C2E',
        textPrimary: '#FFFFFF',
        accentColor: '#38BDF8',
        isDarkPreview: true,
      },
    ],
  },
  {
    templateId: 'services',
    groupId: 'websites',
    shortLabel: 'شركة / مؤسسة',
    title: 'موقع شركة أو مؤسسة خدمية',
    desc: 'واجهة رسمية للشركات والمؤسسات تستعرض الخدمات، فريق العمل، وبيانات التواصل.',
    userIntentPhrase: 'أريد إنشاء موقع شركة أو مؤسسة خدمية',
    botPraisePhrase: 'رائع! موقع رسمي للشركة خطوة احترافية ممتازة 👍',
    nameQuestion: 'ما اسم شركتك أو مؤسستك؟',
    templateGalleryPrompt: 'ممتاز! الآن اختر قالباً يناسب واجهة شركتك:',
    colorQuestion: 'ما لون هوية شركتك؟',
    defaultSampleName: 'آفاق الحلول المتقدمة',
    itemNoun: 'خدمة',
    ctaPlaceholder: 'تواصل واطلب الآن',
    keywords: ['شركة', 'مؤسسة', 'مكتب', 'استشارات', 'مقاولات', 'وكالة'],
    visualCards: [
      {
        id: 'srv-classic',
        style: 'classic',
        title: 'قالب الشركات الرسمي',
        badge: 'كلاسيكي أنيق',
        previewHeadlineEn: 'Executive\nAdvisory Group',
        previewSubEn: 'Trusted Corporate Partner',
        surfaceBg: '#E2E8F0',
        cardBg: '#FFFFFF',
        textPrimary: '#0F172A',
        accentColor: '#1D4ED8',
        isDarkPreview: false,
      },
      {
        id: 'srv-modern',
        style: 'modern',
        title: 'قالب عصري مميز',
        badge: 'عصري فائق',
        previewHeadlineEn: 'Future Vision\nEnterprise',
        previewSubEn: 'Digital & Business Solutions',
        surfaceBg: '#0B132B',
        cardBg: '#162447',
        textPrimary: '#FFFFFF',
        accentColor: '#38BDF8',
        isDarkPreview: true,
      },
      {
        id: 'srv-app',
        style: 'app',
        title: 'قالب بسيط وأنيق',
        badge: 'تطبيق خدمات',
        previewHeadlineEn: 'Smart Service\nRequest Hub',
        previewSubEn: 'Fast Client Onboarding',
        surfaceBg: '#F1F5F9',
        cardBg: '#FFFFFF',
        textPrimary: '#0F172A',
        accentColor: '#2563EB',
        isDarkPreview: false,
      },
      {
        id: 'srv-cinematic',
        style: 'cinematic',
        title: 'قالب سينمائي تنفيذي',
        badge: 'سينمائي فاخر',
        previewHeadlineEn: 'Global Scale\nArchitecture',
        previewSubEn: 'Premier Consulting Studio',
        surfaceBg: '#050814',
        cardBg: '#0F172A',
        textPrimary: '#F8FAFC',
        accentColor: '#60A5FA',
        isDarkPreview: true,
      },
    ],
  },
  {
    templateId: 'portfolio',
    groupId: 'websites',
    shortLabel: 'صفحة شخصية',
    title: 'صفحة شخصية ومعرض أعمال (Portfolio)',
    desc: 'معرض مشاريع ومهارات وسيرة مهنية للمصممين والمستقلين والخبراء.',
    userIntentPhrase: 'أريد إنشاء صفحة شخصية ومعرض أعمال',
    botPraisePhrase: 'رائع! معرض الأعمال الشخصي يبرز احترافيتك بذكاء 👍',
    nameQuestion: 'ما الاسم الذي سيظهر في معرض أعمالك؟',
    templateGalleryPrompt: 'ممتاز! الآن اختر قالباً يناسب معرض أعمالك:',
    colorQuestion: 'ما لون هويتك الشخصية؟',
    defaultSampleName: 'استوديو راكان للتصميم',
    itemNoun: 'مشروع / عمل',
    ctaPlaceholder: 'تواصل معي',
    keywords: ['بورتفوليو', 'معرض أعمال', 'صفحة شخصية', 'مصمم', 'مستقل', 'خبير'],
    visualCards: [
      {
        id: 'port-classic',
        style: 'classic',
        title: 'قالب السيرة الإبداعية',
        badge: 'كلاسيكي أنيق',
        previewHeadlineEn: 'Creative\nPortfolio Studio',
        previewSubEn: 'Selected Works & Bio',
        surfaceBg: '#ECE8E1',
        cardBg: '#FAF8F5',
        textPrimary: '#1E1B18',
        accentColor: '#4338CA',
        isDarkPreview: false,
      },
      {
        id: 'port-modern',
        style: 'modern',
        title: 'قالب عصري مميز',
        badge: 'عصري فائق',
        previewHeadlineEn: 'Digital Product\nArt Direction',
        previewSubEn: 'Case Studies & Design',
        surfaceBg: '#0D1326',
        cardBg: '#17213E',
        textPrimary: '#FFFFFF',
        accentColor: '#6366F1',
        isDarkPreview: true,
      },
      {
        id: 'port-app',
        style: 'app',
        title: 'قالب بسيط وأنيق',
        badge: 'واجهة تفاعلية',
        previewHeadlineEn: 'Minimalist\nCreator Hub',
        previewSubEn: 'Projects & Direct Hire',
        surfaceBg: '#F8FAFC',
        cardBg: '#FFFFFF',
        textPrimary: '#0F172A',
        accentColor: '#0284C7',
        isDarkPreview: false,
      },
      {
        id: 'port-cinematic',
        style: 'cinematic',
        title: 'قالب استوديو سينمائي',
        badge: 'سينمائي فاخر',
        previewHeadlineEn: 'Visual Craft\nExhibition',
        previewSubEn: 'Award-Winning Showcase',
        surfaceBg: '#060913',
        cardBg: '#111827',
        textPrimary: '#FFFFFF',
        accentColor: '#38BDF8',
        isDarkPreview: true,
      },
    ],
  },
  {
    templateId: 'vcard',
    groupId: 'websites',
    shortLabel: 'بطاقة رقمية وروابط',
    title: 'بطاقة تواصل رقمية وروابط (Bio Links)',
    desc: 'صفحة روابط موحدة تجمع حساباتك، أرقامك، وروابطك المهمة في واجهة جوال.',
    userIntentPhrase: 'أريد إنشاء بطاقة تواصل رقمية وروابط',
    botPraisePhrase: 'رائع! البطاقة الرقمية الموحدة مثالية للمشاركة السريعة 👍',
    nameQuestion: 'ما الاسم الذي سيظهر في بطاقتك الرقمية؟',
    templateGalleryPrompt: 'ممتاز! الآن اختر قالباً يناسب بطاقتك الرقمية:',
    colorQuestion: 'ما لون هوية بطاقتك؟',
    defaultSampleName: 'أحمد العتيبي',
    itemNoun: 'رابط',
    ctaPlaceholder: 'تواصل مباشر',
    keywords: ['بطاقة', 'روابط', 'بايو', 'تواصل', 'كرت'],
    visualCards: [
      {
        id: 'vcard-classic',
        style: 'classic',
        title: 'قالب البطاقة التنفيذية',
        badge: 'كلاسيكي أنيق',
        previewHeadlineEn: 'Executive\nDigital Card',
        previewSubEn: 'Verified Contact & Links',
        surfaceBg: '#EAE6DF',
        cardBg: '#FFFFFF',
        textPrimary: '#1E293B',
        accentColor: '#4F46E5',
        isDarkPreview: false,
      },
      {
        id: 'vcard-modern',
        style: 'modern',
        title: 'قالب عصري مميز',
        badge: 'عصري فائق',
        previewHeadlineEn: 'Smart Bio\nCreator Hub',
        previewSubEn: 'All Channels in One Tap',
        surfaceBg: '#0F172A',
        cardBg: '#1E293B',
        textPrimary: '#FFFFFF',
        accentColor: '#38BDF8',
        isDarkPreview: true,
      },
      {
        id: 'vcard-app',
        style: 'app',
        title: 'قالب بسيط وأنيق',
        badge: 'تطبيق جوال',
        previewHeadlineEn: 'Quick Connect\nProfile',
        previewSubEn: 'Save vCard & Socials',
        surfaceBg: '#F1F5F9',
        cardBg: '#FFFFFF',
        textPrimary: '#0F172A',
        accentColor: '#1D4ED8',
        isDarkPreview: false,
      },
    ],
  },
  {
    templateId: 'survey',
    groupId: 'tools',
    shortLabel: 'استبيان وتقييم',
    title: 'استبيان واستطلاع رأي العملاء',
    desc: 'نموذج استبيان تفاعلي مستقل بتقييم النجوم والأسئلة المتعددة وملخص الردود.',
    userIntentPhrase: 'أريد إنشاء استبيان واستطلاع رأي',
    botPraisePhrase: 'رائع! الاستبيان التفاعلي أداة ذكية لقياس رضا عملائك 👍',
    nameQuestion: 'ما عنوان الاستبيان أو اسم جهتك؟',
    templateGalleryPrompt: 'ممتاز! الآن اختر قالباً يناسب استبيانك:',
    colorQuestion: 'ما لون هوية الاستبيان؟',
    defaultSampleName: 'استطلاع تجربة عملاء دار آروما',
    itemNoun: 'سؤال استبيان',
    ctaPlaceholder: 'إرسال التقييم',
    keywords: ['استبيان', 'استطلاع', 'تقييم', 'أسئلة', 'رأي', 'رضا'],
    visualCards: [
      {
        id: 'srv-q-classic',
        style: 'classic',
        title: 'قالب التقييم الاحترافي',
        badge: 'تقييم النجوم',
        previewHeadlineEn: 'Customer Voice\nFeedback Form',
        previewSubEn: '5-Star & NPS Insights',
        surfaceBg: '#EDE9FE',
        cardBg: '#FFFFFF',
        textPrimary: '#1E1B4B',
        accentColor: '#6D28D9',
        isDarkPreview: false,
      },
      {
        id: 'srv-q-modern',
        style: 'modern',
        title: 'قالب عصري مميز',
        badge: 'استبيان ذكي',
        previewHeadlineEn: 'Interactive\nExperience Survey',
        previewSubEn: 'Live Response Analytics',
        surfaceBg: '#0F172A',
        cardBg: '#1E293B',
        textPrimary: '#FFFFFF',
        accentColor: '#38BDF8',
        isDarkPreview: true,
      },
      {
        id: 'srv-q-app',
        style: 'app',
        title: 'قالب بسيط وأنيق',
        badge: 'خطوات سريعة',
        previewHeadlineEn: 'Quick Pulse\nCheck-In',
        previewSubEn: 'One-Minute Rating Flow',
        surfaceBg: '#F8FAFC',
        cardBg: '#FFFFFF',
        textPrimary: '#0F172A',
        accentColor: '#2563EB',
        isDarkPreview: false,
      },
    ],
  },
  {
    templateId: 'booking',
    groupId: 'tools',
    shortLabel: 'حجز المواعيد',
    title: 'نظام حجز المواعيد والاستشارات',
    desc: 'قالب حجوزات مخصص باختيار الخدمة والتاريخ والوقت وتأكيد الموعد مباشرة.',
    userIntentPhrase: 'أريد إنشاء نظام حجز مواعيد',
    botPraisePhrase: 'رائع! نظام حجز المواعيد ينظم حجوزات عملائك تلقائياً 👍',
    nameQuestion: 'ما اسم المركز أو العيادة أو النشاط؟',
    templateGalleryPrompt: 'ممتاز! الآن اختر قالباً يناسب صفحة الحجوزات:',
    colorQuestion: 'ما لون هوية صفحة الحجز؟',
    defaultSampleName: 'عيادات سمايا التخصصية',
    itemNoun: 'خدمة',
    ctaPlaceholder: 'احجز الآن',
    keywords: ['حجز', 'مواعيد', 'موعد', 'عيادة', 'صالون', 'استشارة'],
    visualCards: [
      {
        id: 'book-classic',
        style: 'classic',
        title: 'قالب العيادات والمراكز',
        badge: 'جدول مواعيد',
        previewHeadlineEn: 'Priority\nAppointment Desk',
        previewSubEn: 'Select Date & Specialist',
        surfaceBg: '#E0F2FE',
        cardBg: '#FFFFFF',
        textPrimary: '#0C4A6E',
        accentColor: '#0284C7',
        isDarkPreview: false,
      },
      {
        id: 'book-modern',
        style: 'modern',
        title: 'قالب عصري مميز',
        badge: 'حجز فوري',
        previewHeadlineEn: 'Smart Booking\nCalendar',
        previewSubEn: 'Instant Slot Confirmation',
        surfaceBg: '#0B132B',
        cardBg: '#162447',
        textPrimary: '#FFFFFF',
        accentColor: '#38BDF8',
        isDarkPreview: true,
      },
      {
        id: 'book-app',
        style: 'app',
        title: 'قالب بسيط وأنيق',
        badge: 'واجهة تطبيق',
        previewHeadlineEn: 'Easy Reserve\nMobile Flow',
        previewSubEn: '3-Step Time Picker',
        surfaceBg: '#F8FAFC',
        cardBg: '#FFFFFF',
        textPrimary: '#0F172A',
        accentColor: '#1D4ED8',
        isDarkPreview: false,
      },
    ],
  },
  {
    templateId: 'rsvp',
    groupId: 'tools',
    shortLabel: 'دعوة وتأكيد حضور',
    title: 'دعوة فعالية وتأكيد حضور (RSVP)',
    desc: 'بطاقة دعوة رسمية للمناسبات والفعاليات مع برنامج الحفل ونموذج تأكيد الحضور.',
    userIntentPhrase: 'أريد إنشاء دعوة فعالية وتأكيد حضور',
    botPraisePhrase: 'رائع! بطاقة الدعوة التفاعلية تمنح ضيوفك تجربة راقية 👍',
    nameQuestion: 'ما اسم الفعالية أو المناسبة؟',
    templateGalleryPrompt: 'ممتاز! الآن اختر قالباً يناسب بطاقة الدعوة:',
    colorQuestion: 'ما لون هوية الدعوة؟',
    defaultSampleName: 'ملتقى الرواد السنوي',
    itemNoun: 'فقرة برنامج',
    ctaPlaceholder: 'تأكيد الحضور',
    keywords: ['دعوة', 'فعالية', 'حفل', 'مناسبة', 'حضور', 'مؤتمر'],
    visualCards: [
      {
        id: 'rsvp-classic',
        style: 'classic',
        title: 'قالب الدعوة الملكية',
        badge: 'كلاسيكي فاخر',
        previewHeadlineEn: 'Royal Gala\nInvitation',
        previewSubEn: 'VIP Agenda & RSVP Pass',
        surfaceBg: '#F5EFE6',
        cardBg: '#FFFFFF',
        textPrimary: '#2C1E14',
        accentColor: '#B45309',
        isDarkPreview: false,
      },
      {
        id: 'rsvp-modern',
        style: 'modern',
        title: 'قالب عصري مميز',
        badge: 'عصري فائق',
        previewHeadlineEn: 'Annual Summit\nEvent Pass',
        previewSubEn: 'Confirm Attendance Live',
        surfaceBg: '#111827',
        cardBg: '#1F2937',
        textPrimary: '#FFFFFF',
        accentColor: '#38BDF8',
        isDarkPreview: true,
      },
      {
        id: 'rsvp-app',
        style: 'app',
        title: 'قالب بسيط وأنيق',
        badge: 'بطاقة ذكية',
        previewHeadlineEn: 'Special Event\nDigital Pass',
        previewSubEn: 'One-Tap Guest Check-In',
        surfaceBg: '#FFF1F2',
        cardBg: '#FFFFFF',
        textPrimary: '#881337',
        accentColor: '#BE123C',
        isDarkPreview: false,
      },
    ],
  },
  {
    templateId: 'invoice',
    groupId: 'tools',
    shortLabel: 'باقات وعروض أسعار',
    title: 'باقات الأسعار وحاسبة عروض الخدمات',
    desc: 'قالب تفاعلي يتيح للعميل تحديد الباقات المطلوبة وحساب التكلفة الإجمالية فوراً.',
    userIntentPhrase: 'أريد إنشاء صفحة باقات وعروض أسعار',
    botPraisePhrase: 'رائع! حاسبة الباقات وعروض الأسعار تسهل اعتماد طلبات عملائك 👍',
    nameQuestion: 'ما اسم شركتك أو مشروعك لعروض الأسعار؟',
    templateGalleryPrompt: 'ممتاز! الآن اختر قالباً يناسب باقات الأسعار:',
    colorQuestion: 'ما لون هوية صفحة الباقات؟',
    defaultSampleName: 'باقات استوديو نماء الرقمي',
    itemNoun: 'باقة',
    ctaPlaceholder: 'طلب عرض السعر',
    keywords: ['باقات', 'تسعير', 'عروض أسعار', 'فاتورة', 'حاسبة', 'تكلفة'],
    visualCards: [
      {
        id: 'inv-classic',
        style: 'classic',
        title: 'قالب الباقات التنفيذي',
        badge: 'جدول باقات',
        previewHeadlineEn: 'Enterprise\nService Tiers',
        previewSubEn: 'Transparent Pricing Plans',
        surfaceBg: '#ECFDF5',
        cardBg: '#FFFFFF',
        textPrimary: '#064E3B',
        accentColor: '#059669',
        isDarkPreview: false,
      },
      {
        id: 'inv-modern',
        style: 'modern',
        title: 'قالب عصري مميز',
        badge: 'حاسبة ذكية',
        previewHeadlineEn: 'Interactive\nQuote Builder',
        previewSubEn: 'Instant Package Estimate',
        surfaceBg: '#0B132B',
        cardBg: '#162447',
        textPrimary: '#FFFFFF',
        accentColor: '#10B981',
        isDarkPreview: true,
      },
      {
        id: 'inv-app',
        style: 'app',
        title: 'قالب بسيط وأنيق',
        badge: 'تطبيق تسعير',
        previewHeadlineEn: 'Custom Plan\nSelector',
        previewSubEn: 'Compare & Request Quote',
        surfaceBg: '#F8FAFC',
        cardBg: '#FFFFFF',
        textPrimary: '#0F172A',
        accentColor: '#1D4ED8',
        isDarkPreview: false,
      },
    ],
  },
];

export function getConversationalServiceOption(templateId: string): ConversationalServiceOption {
  return (
    CONVERSATION_SERVICE_OPTIONS.find((item) => item.templateId === templateId) ??
    CONVERSATION_SERVICE_OPTIONS[0]
  );
}

export interface SmartChatParseResult {
  action:
    | 'select_template'
    | 'set_site_name'
    | 'set_contact_phone'
    | 'set_description'
    | 'add_item'
    | 'launch_request';
  templateId?: string;
  siteName?: string;
  phone?: string;
  description?: string;
  item?: InitialCollectionItemInput;
  botReply: string;
}

export function parseSmartChatInput(
  rawText: string,
  currentState: {
    templateId: string;
    siteName: string;
  }
): SmartChatParseResult {
  const text = rawText.trim();
  const currentOption = getConversationalServiceOption(currentState.templateId);

  // 1. Check if user is asking to launch/publish now
  if (/^(انشر|إطلاق|اطلاق|اعتماد|حفظ|تفعيل|انشئ الموقع الآن)$/i.test(text)) {
    return {
      action: 'launch_request',
      botReply: currentState.siteName.trim()
        ? `جاري إطلاق وتفعيل «${currentState.siteName.trim()}» الآن في المنصة... 🚀`
        : `من فضلك اكتب اسم المشروع أولاً (${currentOption.nameQuestion}) حتى أتمكن من إطلاقه لك فوراً.`,
    };
  }

  // 2. Check if user is explicitly adding an item (e.g. "أضف: قهوة مختصة - 25 ر.س")
  const addItemMatch = text.match(/^(?:أضف|اضف|منتج|صنف|خدمة|سؤال|باقة)\s*[:：-]\s*(.+)$/i);
  if (addItemMatch) {
    const rawItem = addItemMatch[1].trim();
    const parts = rawItem.split(/[-–—|،,]/).map((p) => p.trim()).filter(Boolean);
    const name = parts[0] || rawItem;
    const price = parts[1] || '';
    return {
      action: 'add_item',
      item: {
        name,
        price,
        duration: currentState.templateId === 'survey' ? 'choice' : '',
        category: currentState.templateId === 'survey' ? 'ممتاز، جيد جداً، جيد، مقبول' : '',
        description: parts[2] || '',
      },
      botReply: `تمت إضافة الـ${currentOption.itemNoun} «${name}» بنجاح إلى قائمة عناصر مشروعك ✨`,
    };
  }

  // 3. Check if user is providing a description explicitly ("وصف: ...")
  const descMatch = text.match(/^(?:وصف|نبذة|عن المشروع)\s*[:：-]\s*(.+)$/i);
  if (descMatch) {
    const description = descMatch[1].trim();
    return {
      action: 'set_description',
      description,
      botReply: 'ممتاز! تم حفظ وصف النشاط التجاري ليظهر في واجهة موقعك 👍',
    };
  }

  // 4. Check if user typed a phone / WhatsApp number
  const digitsOnly = text.replace(/[^\d+]/g, '');
  if (/^(?:\+?9665\d{8}|05\d{8}|\+?\d{10,15})$/.test(digitsOnly) && text.length <= 20) {
    const normalizedPhone = digitsOnly.replace(/^\+/, '').replace(/^05/, '9665');
    return {
      action: 'set_contact_phone',
      phone: normalizedPhone,
      botReply: `تم تحديث رقم التواصل وواتساب الطلبات إلى +${normalizedPhone} بنجاح 📱`,
    };
  }

  // 5. Check if user is requesting a specific service type by intent phrase ("أريد إنشاء ...")
  if (/^(?:أريد|اريد|ابغى|أبغى|انشئ|أنشئ|تغيير الخدمة|قالب)(?:\s|$)/i.test(text)) {
    for (const option of CONVERSATION_SERVICE_OPTIONS) {
      if (option.keywords.some((kw) => text.includes(kw))) {
        return {
          action: 'select_template',
          templateId: option.templateId,
          botReply: `${option.botPraisePhrase}\n${option.nameQuestion}`,
        };
      }
    }
  }

  // 6. Default: treat as project name if short or if siteName is empty, or update siteName
  if (!currentState.siteName.trim() || text.length <= 42) {
    return {
      action: 'set_site_name',
      siteName: text,
      botReply: `رائع! اسم «${text}» مميز جداً ✨ اختر الآن القالب ولون الهوية المفضل لك أو اضغط على زر الإطلاق بالأسفل.`,
    };
  }

  // 7. Longer text when siteName already exists -> treat as description
  return {
    action: 'set_description',
    description: text,
    botReply: 'تم اعتماد هذا النص كنبذة تعريفية لمشروعك في الواجهة الرئيسية ✨',
  };
}

export const WEBSITE_TEMPLATE_IDS = [
  'store',
  'restaurant',
  'services',
  'portfolio',
  'vcard',
] as const;

export const TOOL_TEMPLATE_IDS = ['survey', 'booking', 'rsvp', 'invoice'] as const;

export const MAX_WEBSITES_PER_USER = 1;
export const MAX_TOOLS_PER_USER = 2;

export function isWebsiteTemplate(templateId: string): boolean {
  return (WEBSITE_TEMPLATE_IDS as readonly string[]).includes(templateId);
}

export function isInteractiveToolTemplate(templateId: string): boolean {
  return (TOOL_TEMPLATE_IDS as readonly string[]).includes(templateId);
}

export function getServiceCategoryLabel(templateId: string): string {
  return isInteractiveToolTemplate(templateId) ? 'أداة تفاعلية' : 'موقع رقمي';
}

export interface ServiceQuotaStatus {
  websiteCount: number;
  maxWebsites: number;
  canCreateWebsite: boolean;
  toolCount: number;
  maxTools: number;
  canCreateTool: boolean;
  totalCount: number;
  maxTotal: number;
  canCreateAny: boolean;
  existingWebsiteUsername?: string;
  existingWebsiteName?: string;
}

export function isValidServiceTemplateId(templateId: string): boolean {
  if (!templateId || typeof templateId !== 'string') return false;
  return CONVERSATION_SERVICE_OPTIONS.some((opt) => opt.templateId === templateId.trim());
}

export function computeServiceQuotaStatus(
  services: ReadonlyArray<{ templateId: string; username?: string; siteName?: string }>
): ServiceQuotaStatus {
  const websites = services.filter((s) => isWebsiteTemplate(s.templateId));
  const tools = services.filter((s) => isInteractiveToolTemplate(s.templateId));

  const websiteCount = websites.length;
  const toolCount = tools.length;
  const totalCount = websiteCount + toolCount;
  const maxTotal = MAX_WEBSITES_PER_USER + MAX_TOOLS_PER_USER;
  const canCreateAny = totalCount < maxTotal;
  const canCreateWebsite = canCreateAny && websiteCount < maxTotal;
  const canCreateTool = canCreateAny && toolCount < maxTotal;

  return {
    websiteCount,
    maxWebsites: Math.max(MAX_WEBSITES_PER_USER, websiteCount),
    canCreateWebsite,
    toolCount,
    maxTools: Math.max(MAX_TOOLS_PER_USER, toolCount),
    canCreateTool,
    totalCount,
    maxTotal,
    canCreateAny,
    existingWebsiteUsername: websites[0]?.username,
    existingWebsiteName: websites[0]?.siteName,
  };
}

export function canCreateServiceWithTemplate(
  templateId: string,
  quota: ServiceQuotaStatus
): { allowed: boolean; reason?: string } {
  if (!isValidServiceTemplateId(templateId)) {
    return {
      allowed: false,
      reason: 'يرجى اختيار نوع خدمة صالح للمتابعة.',
    };
  }

  if (!quota.canCreateAny || quota.totalCount >= quota.maxTotal) {
    return {
      allowed: false,
      reason: `وصلت للحد الأقصى المسموح من الخدمات (${quota.totalCount}/${quota.maxTotal} خدمات). يمكنك إدارة وتعديل خدماتك الحالية أو حذف إحداها لإنشاء خدمة جديدة.`,
    };
  }

  return { allowed: true };
}

export type CreationStepId =
  | 'service_type'
  | 'project_name'
  | 'template_style'
  | 'brand_color'
  | 'content_items'
  | 'preview_publish';

export const CREATION_STEPS_ORDER: readonly CreationStepId[] = [
  'service_type',
  'project_name',
  'template_style',
  'brand_color',
  'content_items',
  'preview_publish',
] as const;

export const CREATION_STEP_LABELS: Record<CreationStepId, string> = {
  service_type: 'فكرة المشروع ونوع الخدمة',
  project_name: 'اسم الخدمة والرابط',
  template_style: 'اختيار القالب',
  brand_color: 'لون الهوية',
  content_items: 'المحتوى والعناصر والتواصل',
  preview_publish: 'المعاينة والنشر',
};

export function getStepLabelForTemplate(
  stepId: CreationStepId,
  templateId: string
): string {
  if (stepId === 'service_type') return 'فكرة المشروع';
  if (stepId === 'project_name') {
    if (templateId === 'survey') return 'عنوان الاستبيان والرابط';
    if (templateId === 'rsvp') return 'اسم المناسبة والرابط';
    if (templateId === 'vcard') return 'الاسم في البطاقة والرابط';
    if (templateId === 'portfolio') return 'الاسم المهني والرابط';
    return 'اسم الخدمة والرابط';
  }
  if (stepId === 'template_style') return 'اختيار القالب';
  if (stepId === 'brand_color') return 'لون الهوية';
  if (stepId === 'content_items') {
    switch (templateId) {
      case 'store':
        return 'المنتجات وواتساب الطلبات';
      case 'restaurant':
        return 'قائمة الطعام والتواصل';
      case 'services':
        return 'الخدمات وبيانات الشركة';
      case 'portfolio':
        return 'المهارات والأعمال المهنية';
      case 'vcard':
        return 'الحسابات والروابط الرقمية';
      case 'survey':
        return 'أسئلة الاستبيان والتقييم';
      case 'booking':
        return 'خدمات الحجز وأوقات الدوام';
      case 'rsvp':
        return 'تفاصيل المناسبة والبرنامج';
      case 'invoice':
        return 'باقات الأسعار والحاسبة';
      default:
        return 'المحتوى والعناصر والتواصل';
    }
  }
  return 'المعاينة والنشر';
}

export interface AdaptiveStepsContext {
  skipProjectName?: boolean;
  skipTemplateStyle?: boolean;
  skipBrandColor?: boolean;
}

export function getDynamicCreationSteps(
  templateId: string,
  ctx: AdaptiveStepsContext = {}
): CreationStepId[] {
  const steps: CreationStepId[] = ['service_type'];

  if (!ctx.skipProjectName) {
    steps.push('project_name');
  }

  if (!ctx.skipTemplateStyle) {
    steps.push('template_style');
  }

  // Interactive tools (survey, vcard, rsvp, invoice) integrate color selection directly into the template step
  // unless brand_color is explicitly visited, whereas full websites have a dedicated brand identity step
  // (which is also skipped if the user already specified their color in the initial prompt).
  const isCompactColorFlow = ['survey', 'vcard', 'rsvp', 'invoice'].includes(templateId);
  if (!isCompactColorFlow && !ctx.skipBrandColor) {
    steps.push('brand_color');
  }

  steps.push('content_items');
  steps.push('preview_publish');
  return steps;
}

export function getNextCreationStep(
  current: CreationStepId,
  activeSteps: readonly CreationStepId[] = CREATION_STEPS_ORDER
): CreationStepId {
  const idx = activeSteps.indexOf(current);
  if (idx < 0) {
    const fallbackIdx = CREATION_STEPS_ORDER.indexOf(current);
    for (let i = fallbackIdx + 1; i < CREATION_STEPS_ORDER.length; i++) {
      if (activeSteps.includes(CREATION_STEPS_ORDER[i])) {
        return CREATION_STEPS_ORDER[i];
      }
    }
    return 'preview_publish';
  }
  if (idx >= activeSteps.length - 1) {
    return 'preview_publish';
  }
  return activeSteps[idx + 1];
}

export function getPrevCreationStep(
  current: CreationStepId,
  activeSteps: readonly CreationStepId[] = CREATION_STEPS_ORDER
): CreationStepId {
  const idx = activeSteps.indexOf(current);
  if (idx < 0) {
    const fallbackIdx = CREATION_STEPS_ORDER.indexOf(current);
    for (let i = fallbackIdx - 1; i >= 0; i--) {
      if (activeSteps.includes(CREATION_STEPS_ORDER[i])) {
        return CREATION_STEPS_ORDER[i];
      }
    }
    return 'service_type';
  }
  if (idx <= 0) {
    return 'service_type';
  }
  return activeSteps[idx - 1];
}

export interface AnalyzedProjectRequest {
  templateId: string;
  matchedService: boolean;
  extractedSiteName?: string;
  extractedColor?: string;
  extractedColorLabel?: string;
  extractedStyle?: SiteStyle;
  extractedDarkMode?: boolean;
  extractedPhone?: string;
  extractedDescription?: string;
  nextStep: CreationStepId;
  skipProjectName: boolean;
  skipBrandColor: boolean;
  botReply: string;
}

export function analyzeUserProjectRequest(
  rawPrompt: string,
  quota?: ServiceQuotaStatus,
  fallbackTemplateId = 'store'
): AnalyzedProjectRequest {
  const text = rawPrompt.trim();

  // 1. Detect Service Type (templateId) from rich domain keywords
  const domainRules: Array<{ templateId: string; patterns: RegExp }> = [
    {
      templateId: 'restaurant',
      patterns:
        /مطعم|كافيه|مقهى|منيو|قائمة طعام|برجر|بيتزا|شاورما|مخبز|حلويات|حلا|مشروبات|عصائر|فطور|مطبخ|كوفي/i,
    },
    {
      templateId: 'survey',
      patterns: /استبيان|استطلاع|تقييم|آراء العملاء|اراء العملاء|رضا العملاء|تصويت|استمارة تقييم/i,
    },
    {
      templateId: 'booking',
      patterns: /حجز|مواعيد|موعد|عيادة|عيادات|طب|أسنان|اسنان|صالون|حلاقة|سبا|مركز تجميل|جلسات/i,
    },
    {
      templateId: 'rsvp',
      patterns: /دعوة|حفل|زواج|زفاف|مؤتمر|فعالية|ملتقى|ندوة|مناسبة|تأكيد حضور|بطاقة دعوة/i,
    },
    {
      templateId: 'invoice',
      patterns: /باقات|عروض أسعار|عروض اسعار|تسعير|حاسبة|فاتورة|خطط أسعار|تكلفة الخدمات/i,
    },
    {
      templateId: 'vcard',
      patterns: /بطاقة رقمية|بطاقة تواصل|كرت شخصي|بايو|صفحة روابط|روابطي|لينكات/i,
    },
    {
      templateId: 'portfolio',
      patterns:
        /معرض أعمال|معرض اعمال|بورتفوليو|صفحة شخصية|سيرة ذاتية|مصمم|مصور|مبرمج|مستقل|فريلانسر/i,
    },
    {
      templateId: 'services',
      patterns:
        /شركة|مؤسسة|مكتب|محاماة|مقاولات|عقارات|عقاري|وكالة|استشارات|تنظيف|صيانة|شحن|نقليات|خدمات/i,
    },
    {
      templateId: 'store',
      patterns:
        /متجر|سلة|تسوق|منتجات|بيع|تجارة|عطور|عود|بخور|ملابس|عبايات|أزياء|ازياء|تمور|عسل|قهوة|ورود|هدايا|إلكترونيات/i,
    },
  ];

  let detectedTemplateId = fallbackTemplateId;
  let matchedService = false;

  for (const rule of domainRules) {
    if (rule.patterns.test(text)) {
      detectedTemplateId = rule.templateId;
      matchedService = true;
      break;
    }
  }

  // Respect quota if provided
  if (quota) {
    const check = canCreateServiceWithTemplate(detectedTemplateId, quota);
    if (!check.allowed) {
      if (!quota.canCreateWebsite && quota.canCreateTool) {
        detectedTemplateId = 'survey';
      }
    }
  }

  const serviceOpt = getConversationalServiceOption(detectedTemplateId);

  // 2. Extract Color if mentioned
  let extractedColor: string | undefined;
  let extractedColorLabel: string | undefined;
  const colorRules: Array<{ regex: RegExp; hex: string; label: string }> = [
    { regex: /ذهبي|برتقالي|عنبري|نحاسي/i, hex: '#D97706', label: 'ذهبي دافئ' },
    { regex: /أخضر|اخضر|زمردي/i, hex: '#059669', label: 'زمردي أصيل' },
    { regex: /بنفسجي|موف/i, hex: '#6D28D9', label: 'بنفسجي فاخر' },
    { regex: /أحمر|احمر|ياقوتي|وردي|عنابي/i, hex: '#BE123C', label: 'ياقوتي' },
    { regex: /تركواز|سماوي|فيروزي/i, hex: '#0284C7', label: 'سماوي مضيء' },
    { regex: /كحلي|أسود|اسود/i, hex: '#0B132B', label: 'كحلي ليلي' },
    { regex: /فضي|رمادي/i, hex: '#94A3B8', label: 'فضي بلاتيني' },
    { regex: /أزرق|ازرق|ملكي/i, hex: '#1D4ED8', label: 'أزرق ملكي' },
  ];
  for (const cr of colorRules) {
    if (cr.regex.test(text)) {
      extractedColor = cr.hex;
      extractedColorLabel = cr.label;
      break;
    }
  }

  // 3. Extract Dark Mode & Style if mentioned
  let extractedDarkMode: boolean | undefined;
  if (/داكن|ليلي|أسود|اسود/i.test(text)) {
    extractedDarkMode = true;
  }

  let extractedStyle: SiteStyle | undefined;
  if (/كلاسيكي/i.test(text)) extractedStyle = 'classic';
  else if (/سينمائي/i.test(text)) {
    extractedStyle = 'cinematic';
    extractedDarkMode = true;
  } else if (/تطبيق/i.test(text)) extractedStyle = 'app';
  else if (/عصري/i.test(text)) extractedStyle = 'modern';

  // 4. Extract Phone if mentioned
  let extractedPhone: string | undefined;
  const phoneMatch = text.match(/(?:\+?9665\d{8}|05\d{8})/);
  if (phoneMatch) {
    extractedPhone = phoneMatch[0].replace(/^\+/, '').replace(/^05/, '9665');
  }

  // 5. Extract Project Name if mentioned
  let extractedSiteName: string | undefined;
  const quotedMatch = text.match(/[«"']([^»"'\n]{2,40})[»"']/);
  const namedByKeywordMatch = text.match(
    /(?:باسم|إسمه|اسمه|اسمها|بعنوان|لشركة|لمؤسسة|لمتجر|لمطعم|لكافيه|لمقهى|لعيادة|لعيادات|لمركز|لصالون)\s+([^،,.\n]{2,35}?)(?=\s+(?:باللون|لون|يتضمن|يحتوي|مع|رقمه|واتساب|ويكون|$)|[،,.]|$)/i
  );

  if (quotedMatch && quotedMatch[1].trim().length >= 2) {
    extractedSiteName = quotedMatch[1].trim();
  } else if (namedByKeywordMatch && namedByKeywordMatch[1].trim().length >= 2) {
    extractedSiteName = namedByKeywordMatch[1].trim();
  } else if (!matchedService && text.length >= 2 && text.length <= 32 && !/\d{8}/.test(text)) {
    // User typed a concise project name directly
    extractedSiteName = text;
  }

  // 6. Extract Description if the user wrote a detailed paragraph (> 35 chars)
  let extractedDescription: string | undefined;
  if (text.length > 35) {
    extractedDescription = text;
  }

  const skipProjectName = Boolean(extractedSiteName);
  const skipBrandColor = Boolean(extractedColor);

  const dynamicSteps = getDynamicCreationSteps(detectedTemplateId, {
    skipProjectName,
    skipBrandColor,
  });
  const nextStep = dynamicSteps[1] || 'project_name';

  const summaryParts: string[] = [`تم اختيار «${serviceOpt.shortLabel}»`];
  if (extractedSiteName) {
    summaryParts.push(`باسم «${extractedSiteName}»`);
  }
  if (extractedColorLabel) {
    summaryParts.push(`ولون الهوية (${extractedColorLabel})`);
  }

  const botReply =
    nextStep === 'project_name'
      ? `${serviceOpt.botPraisePhrase}\n${serviceOpt.nameQuestion}`
      : `${ summaryParts.join(' ')} ✨\n${serviceOpt.templateGalleryPrompt}`;

  return {
    templateId: detectedTemplateId,
    matchedService,
    extractedSiteName,
    extractedColor,
    extractedColorLabel,
    extractedStyle,
    extractedDarkMode,
    extractedPhone,
    extractedDescription,
    nextStep,
    skipProjectName,
    skipBrandColor,
    botReply,
  };
}

export type StudioActivePanel =
  | 'template'
  | 'colors'
  | 'products'
  | 'content'
  | 'contact'
  | 'settings'
  | 'preview'
  | 'results';

export const STUDIO_PANEL_META: Record<
  StudioActivePanel,
  { title: string; subtitle: string; badge: string }
> = {
  template: {
    title: 'تعديل القالب ونمط التصميم',
    subtitle: 'اختر القالب المرئي ونمط العرض المناسب لخدمتك',
    badge: 'القالب والمظهر',
  },
  colors: {
    title: 'تعديل الألوان والشعار والغلاف',
    subtitle: 'لون الهوية الرئيسي، الوضع الداكن، الشعار، والصورة الرئيسية',
    badge: 'الألوان والهوية',
  },
  products: {
    title: 'إدارة المنتجات والعناصر',
    subtitle: 'إضافة وتعديل وترتيب وحذف العناصر والمنتجات والأسئلة',
    badge: 'المنتجات والعناصر',
  },
  content: {
    title: 'تعديل النصوص والمحتوى والأقسام',
    subtitle: 'العناوين، النبذة التعريفية، زر الإجراء، الفريق، الآراء، والأسئلة الشائعة',
    badge: 'النصوص والمحتوى',
  },
  contact: {
    title: 'بيانات التواصل وساعات العمل',
    subtitle: 'أرقام الجوال وواتساب، العنوان، حسابات التواصل، وأوقات الدوام',
    badge: 'التواصل والدوام',
  },
  settings: {
    title: 'إعدادات الخدمة والرابط المخصص',
    subtitle: 'تعديل اسم الخدمة، الرابط المخصص (Username)، أو حذف الخدمة',
    badge: 'الإعدادات',
  },
  preview: {
    title: 'المعاينة الحية والرابط العام',
    subtitle: 'تفاعل مع خدمتك مباشرة وانسخ رابط النشر لمشاركته مع عملائك',
    badge: 'المعاينة الحية',
  },
  results: {
    title: 'النتائج والردود والإحصائيات',
    subtitle: 'استعرض ردود الاستبيانات، الحجوزات، تأكيدات الحضور، وإحصائيات الزوار',
    badge: 'النتائج والردود',
  },
};

export interface StudioEditCommandResult {
  action:
    | 'open_panel'
    | 'close_panel'
    | 'set_theme_color'
    | 'set_template_style'
    | 'toggle_dark_mode'
    | 'save_changes'
    | 'forward_to_assistant';
  panel?: StudioActivePanel;
  themeColor?: string;
  templateStyle?: SiteStyle;
  darkMode?: boolean;
  botReply: string;
}

export function parseStudioEditCommand(
  rawText: string,
  serviceName: string
): StudioEditCommandResult {
  const text = rawText.trim();

  if (/^(?:رجوع|عودة|العودة للمحادثة|إغلاق|اغلاق|تم|انتهيت)$/i.test(text)) {
    return {
      action: 'close_panel',
      botReply: `عدنا إلى محادثة «${serviceName}» ✨ كيف يمكنني مساعدتك أيضاً؟`,
    };
  }

  if (/^(?:احفظ|حفظ|انشر|نشر|اعتماد التعديلات)$/i.test(text)) {
    return {
      action: 'save_changes',
      botReply: `جاري حفظ ونشر التعديلات على «${serviceName}» فوراً... ✅`,
    };
  }

  if (/معاينة|عرض الموقع|افتح الموقع|شكل الموقع/i.test(text)) {
    return {
      action: 'open_panel',
      panel: 'preview',
      botReply: `تفضل المعاينة الحية التفاعلية لـ «${serviceName}» 📱 بعد الانتهاء يمكنك العودة للمحادثة بضغطة زر.`,
    };
  }

  if (/نتائج|ردود|إحصائيات|احصائيات|زيارات|حجوزات|تقييمات/i.test(text)) {
    return {
      action: 'open_panel',
      panel: 'results',
      botReply: `تفضل واجهة النتائج والردود والإحصائيات الخاصة بـ «${serviceName}» 📊`,
    };
  }

  if (/قالب|قوالب|تغيير القالب|نمط التصميم|تعديل القالب|المظهر/i.test(text)) {
    return {
      action: 'open_panel',
      panel: 'template',
      botReply: `تفضل واجهة اختيار وتخصيص القالب لـ «${serviceName}» 🎨 اختر القالب المناسب ثم اضغط العودة للمحادثة.`,
    };
  }

  if (/الألوان|الالوان|تغيير اللون|تعديل اللون|الشعار|لوقو|صورة الغلاف|الصورة الرئيسية/i.test(text)) {
    return {
      action: 'open_panel',
      panel: 'colors',
      botReply: `تفضل واجهة تعديل الألوان والشعار والغلاف لـ «${serviceName}» 🌈`,
    };
  }

  if (
    /منتجات|المنتجات|أصناف|اصناف|قائمة الطعام|منيو|أسئلة|اسئلة|الباقات|باقات|فقرات|مشاريع|روابط|العناصر/i.test(
      text
    ) &&
    !/^أضف|^اضف/.test(text)
  ) {
    return {
      action: 'open_panel',
      panel: 'products',
      botReply: `تفضل واجهة إدارة المنتجات والعناصر الخاصة بـ «${serviceName}» 🛍️ بعد الانتهاء اضغط حفظ والعودة للمحادثة.`,
    };
  }

  if (
    /محتوى|المحتوى|نصوص|النصوص|العنوان|الوصف|نبذة|فريق|الفريق|آراء|اراء|الأسئلة الشائعة|مهارات|خبرات/i.test(
      text
    ) &&
    !/^وصف\s*[:：-]/.test(text)
  ) {
    return {
      action: 'open_panel',
      panel: 'content',
      botReply: `تفضل واجهة تعديل النصوص والمحتوى والأقسام لـ «${serviceName}» 📝`,
    };
  }

  if (
    /تواصل|التواصل|أرقام|ارقام|واتساب|انستقرام|إنستقرام|عنوان|ساعات العمل|الدوام|أوقات العمل/i.test(
      text
    ) &&
    !text.includes(':')
  ) {
    return {
      action: 'open_panel',
      panel: 'contact',
      botReply: `تفضل واجهة تعديل بيانات التواصل وساعات العمل لـ «${serviceName}» 📞`,
    };
  }

  if (/إعدادات|اعدادات|الرابط|اسم الموقع|حذف الموقع|حذف الخدمة/i.test(text)) {
    return {
      action: 'open_panel',
      panel: 'settings',
      botReply: `تفضل واجهة إعدادات الرابط والخدمة لـ «${serviceName}» ⚙️`,
    };
  }

  if (/وضع داكن|داكن|ليلي/i.test(text)) {
    const off = /إلغاء|الغاء|إيقاف|ايقاف|فاتح/i.test(text);
    return {
      action: 'toggle_dark_mode',
      darkMode: !off,
      botReply: !off
        ? `تم تفعيل الوضع الداكن لـ «${serviceName}» 🌙`
        : `تم التبديل إلى الوضع الفاتح لـ «${serviceName}» ☀️`,
    };
  }

  const colorMap: Array<{ keywords: string[]; hex: string; label: string }> = [
    { keywords: ['أزرق', 'ازرق', 'ملكي'], hex: '#1D4ED8', label: 'الأزرق الملكي' },
    { keywords: ['بنفسجي', 'موف'], hex: '#6D28D9', label: 'البنفسجي الفاخر' },
    { keywords: ['أخضر', 'اخضر', 'زمردي'], hex: '#059669', label: 'الأخضر الزمردي' },
    { keywords: ['ذهبي', 'برتقالي', 'بني'], hex: '#D97706', label: 'الذهبي الدافئ' },
    { keywords: ['أحمر', 'احمر', 'ياقوتي', 'وردي'], hex: '#BE123C', label: 'الياقوتي' },
    { keywords: ['تركواز', 'سماوي'], hex: '#0284C7', label: 'السماوي المضيء' },
    { keywords: ['كحلي', 'أسود', 'اسود'], hex: '#0B132B', label: 'الكحلي الليلي' },
  ];
  for (const entry of colorMap) {
    if (entry.keywords.some((kw) => text.includes(kw))) {
      return {
        action: 'set_theme_color',
        themeColor: entry.hex,
        botReply: `تم تغيير لون الهوية لـ «${serviceName}» إلى ${entry.label} 🎨`,
      };
    }
  }

  if (/كلاسيكي/i.test(text)) {
    return {
      action: 'set_template_style',
      templateStyle: 'classic',
      botReply: `تم اختيار النمط الكلاسيكي الأنيق لـ «${serviceName}» ✨`,
    };
  }
  if (/سينمائي/i.test(text)) {
    return {
      action: 'set_template_style',
      templateStyle: 'cinematic',
      botReply: `تم اختيار النمط السينمائي الفاخر لـ «${serviceName}» ✨`,
    };
  }
  if (/تطبيق جوال|تطبيق/i.test(text)) {
    return {
      action: 'set_template_style',
      templateStyle: 'app',
      botReply: `تم اختيار نمط تطبيق الجوال التفاعلي لـ «${serviceName}» 📱`,
    };
  }
  if (/عصري/i.test(text)) {
    return {
      action: 'set_template_style',
      templateStyle: 'modern',
      botReply: `تم اختيار النمط العصري الفائق لـ «${serviceName}» ✨`,
    };
  }

  return {
    action: 'forward_to_assistant',
    botReply: '',
  };
}

export function buildCreateInPlatformPayload(state: {
  siteName: string;
  username: string;
  templateId: string;
  templateStyle: SiteStyle;
  themeColor: string;
  darkMode: boolean;
  tagline: string;
  headline: string;
  description: string;
  ctaLabel: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  twitter: string;
  tiktok: string;
  snapchat: string;
  hours: Array<{ day: string; time: string }>;
  initialItems: InitialCollectionItemInput[];
  skillsText: string;
}): CreateInPlatformInput {
  const parsedSkills = state.skillsText
    .split(/[,،\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    siteName: state.siteName.trim(),
    username: state.username.trim() || undefined,
    templateId: state.templateId,
    templateStyle: state.templateStyle,
    themeColor: state.themeColor,
    darkMode: state.darkMode,
    tagline: state.tagline.trim() || undefined,
    headline: state.headline.trim() || undefined,
    description: state.description.trim() || undefined,
    ctaLabel: state.ctaLabel.trim() || undefined,
    phone: state.phone.trim() || undefined,
    whatsapp: state.whatsapp.trim() || state.phone.trim() || undefined,
    email: state.email.trim() || undefined,
    address: state.address.trim() || undefined,
    socialLinks: {
      instagram: state.instagram.trim() || undefined,
      twitter: state.twitter.trim() || undefined,
      tiktok: state.tiktok.trim() || undefined,
      snapchat: state.snapchat.trim() || undefined,
    },
    hours: state.hours.filter((h) => h.day.trim() || h.time.trim()),
    initialItems: state.initialItems.filter((item) => item.name?.trim() || item.title?.trim()),
    skills: parsedSkills.length > 0 ? parsedSkills : undefined,
  };
}

// ===========================================================================
// MULTI-SERVICE DISAMBIGUATION & RESOLUTION FOR FAST ASSISTANT & WHATSAPP
// ===========================================================================

export interface AssistantServiceSummary {
  id?: string;
  username: string;
  siteName: string;
  templateId: string;
  themeColor?: string;
  visitsToday?: number;
  visitsTotal?: number;
  submissionsCount?: number;
}

export type AssistantCommandIntentType =
  | 'create_new_service'
  | 'change_hours'
  | 'add_item'
  | 'update_description'
  | 'change_color'
  | 'change_template'
  | 'change_contact'
  | 'query_stats'
  | 'open_panel'
  | 'general_edit';

export interface PendingAssistantDisambiguation {
  pendingCommand?: string;
  pendingIntent?: AssistantCommandIntentType;
  pendingActionLabel?: string;
  candidateServices?: ReadonlyArray<AssistantServiceSummary>;
  lockedTargetUsername?: string;
}

export interface MultiServiceCommandResolution {
  status:
    | 'no_services'
    | 'create_new_service'
    | 'resolved'
    | 'needs_disambiguation'
    | 'not_found';
  intent: AssistantCommandIntentType;
  actionLabel: string;
  targetService?: AssistantServiceSummary;
  candidateServices: AssistantServiceSummary[];
  extractedValue?: string;
  extractedItem?: InitialCollectionItemInput;
  extractedColor?: string;
  extractedColorLabel?: string;
  extractedStyle?: SiteStyle;
  extractedDarkMode?: boolean;
  targetPanel?: StudioActivePanel;
  newServiceTemplateId?: string;
  awaitingValueFollowUp?: boolean;
  pendingContext?: PendingAssistantDisambiguation;
  botReply: string;
}

export function normalizeArabicForMatch(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

const SERVICE_TYPE_PATTERNS: Record<string, { label: string; regex: RegExp }> = {
  store: {
    label: 'متجر إلكتروني',
    regex:
      /(?:^|\s|في|لـ|ل|على|بـ)(?:المتجر|متجر|متجري|متجر الكتروني|المتجر الإلكتروني|المتجر الالكتروني|السلة|سلة الطلبات)(?:\s|$|[،,.:؟!])/i,
  },
  restaurant: {
    label: 'مطعم / كافيه',
    regex:
      /(?:^|\s|في|لـ|ل|على|بـ)(?:المطعم|مطعم|مطعمي|الكافيه|كافيه|المقهى|مقهى|المنيو|منيو المطعم|قائمة الطعام)(?:\s|$|[،,.:؟!])/i,
  },
  services: {
    label: 'شركة / مؤسسة',
    regex:
      /(?:^|\s|في|لـ|ل|على|بـ)(?:الشركة|شركة|شركتي|المؤسسة|مؤسسة|مؤسستي|المكتب|مكتب|موقع الشركة)(?:\s|$|[،,.:؟!])/i,
  },
  portfolio: {
    label: 'صفحة شخصية',
    regex:
      /(?:^|\s|في|لـ|ل|على|بـ)(?:الصفحة الشخصية|صفحة شخصية|صفحتي الشخصية|معرض الأعمال|معرض الاعمال|معرض أعمالي|البورتفوليو|بورتفوليو)(?:\s|$|[،,.:؟!])/i,
  },
  vcard: {
    label: 'بطاقة رقمية وروابط',
    regex:
      /(?:^|\s|في|لـ|ل|على|بـ)(?:البطاقة الرقمية|بطاقة رقمية|البطاقة|بطاقتي|صفحة الروابط|الروابط|البايو)(?:\s|$|[،,.:؟!])/i,
  },
  survey: {
    label: 'استبيان وتقييم',
    regex:
      /(?:^|\s|في|لـ|ل|على|بـ)(?:الاستبيان|استبيان|استبياني|الاستطلاع|استطلاع الرأي)(?:\s|$|[،,.:؟!])/i,
  },
  booking: {
    label: 'حجز المواعيد',
    regex:
      /(?:^|\s|في|لـ|ل|على|بـ)(?:نظام الحجز|نظام حجز المواعيد|نظام الحجوزات|الحجوزات|حجز المواعيد|المواعيد|صفحة الحجز|العيادة|عيادة|عيادتي|الصالون|صالون)(?:\s|$|[،,.:؟!])/i,
  },
  rsvp: {
    label: 'دعوة وتأكيد حضور',
    regex:
      /(?:^|\s|في|لـ|ل|على|بـ)(?:الدعوة|دعوة الحضور|بطاقة الدعوة|الفعالية|الحفل|المناسبة)(?:\s|$|[،,.:؟!])/i,
  },
  invoice: {
    label: 'باقات وعروض أسعار',
    regex:
      /(?:^|\s|في|لـ|ل|على|بـ)(?:الباقات|صفحة الباقات|عروض الأسعار|عروض الاسعار|حاسبة الأسعار|الحاسبة|الفاتورة)(?:\s|$|[،,.:؟!])/i,
  },
};

const GENERIC_SITE_WORDS = new Set(
  [
    'متجر',
    'المتجر',
    'مطعم',
    'المطعم',
    'كافيه',
    'الكافيه',
    'مقهي',
    'المقهي',
    'شركه',
    'الشركه',
    'مؤسسه',
    'المؤسسه',
    'مكتب',
    'المكتب',
    'عياده',
    'العياده',
    'عيادات',
    'العيادات',
    'مركز',
    'المركز',
    'نظام',
    'حجز',
    'مواعيد',
    'استبيان',
    'تقييم',
    'دعوه',
    'باقات',
    'بطاقه',
    'صفحه',
    'موقع',
    'خدمه',
    'في',
    'من',
    'الي',
    'علي',
  ].map((w) => normalizeArabicForMatch(w))
);

export function identifyReferencedServices(
  rawMessage: string,
  userServices: ReadonlyArray<AssistantServiceSummary>
): {
  matched: AssistantServiceSummary[];
  explicitlyMentionedTypeLabel?: string;
} {
  const normMsg = normalizeArabicForMatch(rawMessage);
  if (!normMsg || userServices.length === 0) {
    return { matched: [] };
  }

  // 1. Check direct siteName or username match
  const byName: AssistantServiceSummary[] = [];
  for (const srv of userServices) {
    const normName = normalizeArabicForMatch(srv.siteName);
    const normUser = srv.username.trim().toLowerCase();

    if (normName && normName.length >= 2 && normMsg.includes(normName)) {
      byName.push(srv);
      continue;
    }
    if (normUser && normUser.length >= 3 && normMsg.includes(normUser)) {
      byName.push(srv);
      continue;
    }

    // Check distinctive brand tokens in siteName (e.g. "دار العود" -> "العود", "مذاق الشرق" -> "مذاق")
    const nameTokens = normName
      .split(' ')
      .map((t) => t.trim())
      .filter((t) => t.length >= 3 && !GENERIC_SITE_WORDS.has(t));
    if (
      nameTokens.length > 0 &&
      nameTokens.some((tok) => {
        const bareTok = tok.startsWith('ال') && tok.length >= 5 ? tok.slice(2) : tok;
        return normMsg.includes(tok) || (bareTok.length >= 3 && normMsg.includes(bareTok));
      })
    ) {
      byName.push(srv);
    }
  }

  if (byName.length > 0) {
    return { matched: byName };
  }

  // 2. Check explicit Service Type (templateId) reference in the message
  const matchedTemplateIds: string[] = [];
  let firstMentionedLabel: string | undefined;

  for (const [tplId, spec] of Object.entries(SERVICE_TYPE_PATTERNS)) {
    if (spec.regex.test(rawMessage)) {
      matchedTemplateIds.push(tplId);
      if (!firstMentionedLabel) {
        firstMentionedLabel = spec.label;
      }
    }
  }

  if (matchedTemplateIds.length > 0) {
    const byType = userServices.filter((s) => matchedTemplateIds.includes(s.templateId));
    return {
      matched: byType,
      explicitlyMentionedTypeLabel: firstMentionedLabel,
    };
  }

  return { matched: [] };
}

function stripServiceReferencesFromValue(raw: string, targetService?: AssistantServiceSummary): string {
  let cleaned = raw;
  if (targetService?.siteName) {
    const escaped = targetService.siteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`(?:في|لـ|ل|على)?\\s*${escaped}`, 'gi'), '');
  }
  cleaned = cleaned
    .replace(
      /(?:في|لـ|ل|على)\s+(?:المتجر الإلكتروني|المتجر الالكتروني|متجر إلكتروني|المتجر|متجري|متجر|المطعم|مطعمي|مطعم|الكافيه|كافيه|المقهى|مقهى|المنيو|الشركة|شركتي|شركة|المؤسسة|مؤسسة|الصفحة الشخصية|معرض الأعمال|البورتفوليو|البطاقة الرقمية|البطاقة|الاستبيان|استبيان|نظام حجز المواعيد|نظام الحجوزات|نظام الحجز|حجز المواعيد|الحجوزات|العيادة|عيادة|الدعوة|الفعالية|الباقات|عروض الأسعار|الحاسبة)(?=\s|$|[،,.:؟!])/gi,
      ''
    )
    .trim();
  return cleaned;
}

export function detectAssistantCommandIntent(
  rawMessage: string,
  targetService?: AssistantServiceSummary
): {
  intent: AssistantCommandIntentType;
  actionLabel: string;
  extractedValue?: string;
  extractedItem?: InitialCollectionItemInput;
  extractedColor?: string;
  extractedColorLabel?: string;
  extractedStyle?: SiteStyle;
  extractedDarkMode?: boolean;
  targetPanel?: StudioActivePanel;
  newServiceTemplateId?: string;
} {
  const text = rawMessage.trim();

  // 1. New Service Creation Intent (must NOT mix with existing services)
  if (
    /^(?:أريد إنشاء|اريد انشاء|أبغى أنشئ|ابغى انشئ|أنشئ|انشئ|إنشاء|انشاء|إضافة خدمة جديدة|اضافة خدمة جديدة|خدمة جديدة|موقع جديد|متجر جديد|مطعم جديد|أداة جديدة)(?:\s|$)/i.test(
      text
    )
  ) {
    const analyzed = analyzeUserProjectRequest(text);
    return {
      intent: 'create_new_service',
      actionLabel: 'إنشاء خدمة جديدة',
      newServiceTemplateId: analyzed.matchedService ? analyzed.templateId : undefined,
    };
  }

  // 2. Working Hours Intent (تغيير أوقات العمل / الدوام)
  if (/أوقات العمل|اوقات العمل|ساعات العمل|ساعات الدوام|أوقات الدوام|اوقات الدوام|الدوام/i.test(text)) {
    const stripped = stripServiceReferencesFromValue(text, targetService)
      .replace(
        /^.*?(?:تغيير|غيّر|غير|تعديل|عدّل|عدل|تحديث|حدّث|حدث)?\s*(?:أوقات العمل الجديدة|أوقات العمل|اوقات العمل|ساعات العمل|ساعات الدوام|أوقات الدوام|الدوام)\s*(?:إلى|الى|لـ|:|هي)?\s*/i,
        ''
      )
      .trim();

    const hasTimeContent =
      stripped.length >= 3 &&
      /(?:\d|صباح|مساء|ظهر|ليل|ص\b|م\b|السبت|الأحد|الاحد|الاثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|يوميا|يومياً|مفتوح|24)/i.test(
        stripped
      );

    return {
      intent: 'change_hours',
      actionLabel: 'تغيير أوقات العمل',
      extractedValue: hasTimeContent ? stripped : undefined,
      targetPanel: 'contact',
    };
  }

  // 3. Add Item / Product / Dish / Service Intent
  if (
    /^(?:أضف|اضف|إضافة|اضافة)\s+(?:منتج|طبق|صنف|خدمة|سؤال|باقة|مشروع|رابط|عنصر)?/i.test(text) &&
    !/خدمة جديدة|موقع جديد/i.test(text)
  ) {
    const withoutService = stripServiceReferencesFromValue(text, targetService);
    const cleanedItemText = withoutService
      .replace(/^(?:أضف|اضف|إضافة|اضافة)\s*(?:طبق اليوم|طبق|منتج|صنف|خدمة|سؤال|باقة|مشروع|رابط|عنصر)?\s*[:：-]?\s*/i, '')
      .trim();

    if (cleanedItemText.length >= 2) {
      const priceMatch = cleanedItemText.match(/[-–—|،,]?\s*(\d+(?:\.\d+)?\s*(?:ر\.س|ريال|SAR|\$)?)$/i);
      const itemName = priceMatch
        ? cleanedItemText.slice(0, priceMatch.index).trim() || cleanedItemText
        : cleanedItemText;
      const itemPrice = priceMatch ? priceMatch[1].trim() : '';
      return {
        intent: 'add_item',
        actionLabel: 'إضافة عنصر جديد',
        extractedItem: {
          name: itemName,
          ...(itemPrice ? { price: itemPrice } : {}),
        },
        targetPanel: 'products',
      };
    }

    return {
      intent: 'add_item',
      actionLabel: 'إضافة عنصر جديد',
      targetPanel: 'products',
    };
  }

  // 4. Query Stats / Visits / Submissions Intent
  if (/كم زائر|زوار اليوم|إحصائيات|احصائيات|عدد الزيارات|الزيارات|النتائج|الردود/i.test(text)) {
    return {
      intent: 'query_stats',
      actionLabel: 'عرض الإحصائيات والنتائج',
      targetPanel: 'results',
    };
  }

  // 5. Update Description / Content Intent
  if (
    /^(?:وصف|نبذة|العنوان)\s*[:：-]/i.test(text) ||
    /تغيير الوصف|غيّر الوصف|غير الوصف|تعديل الوصف|تعديل النبذة|تعديل المحتوى|تعديل النصوص/i.test(text)
  ) {
    const withoutService = stripServiceReferencesFromValue(text, targetService);
    const explicitDescMatch = withoutService.match(/^(?:وصف|نبذة|العنوان)\s*[:：-]\s*(.+)$/i);
    const inlineDescMatch = withoutService.match(
      /(?:تغيير الوصف|غيّر الوصف|غير الوصف|تعديل الوصف|تعديل النبذة)\s+(?:إلى|الى|:)\s*(.+)$/i
    );
    const val = (explicitDescMatch?.[1] || inlineDescMatch?.[1] || '').trim();
    return {
      intent: 'update_description',
      actionLabel: 'تعديل الوصف والمحتوى',
      extractedValue: val || undefined,
      targetPanel: 'content',
    };
  }

  // 6. Change Color / Dark Mode Intent
  const colorRules: Array<{ regex: RegExp; hex: string; label: string }> = [
    { regex: /ذهبي|برتقالي|عنبري/i, hex: '#D97706', label: 'الذهبي الدافئ' },
    { regex: /أخضر|اخضر|زمردي/i, hex: '#059669', label: 'الأخضر الزمردي' },
    { regex: /بنفسجي|موف/i, hex: '#6D28D9', label: 'البنفسجي الفاخر' },
    { regex: /أحمر|احمر|ياقوتي|وردي/i, hex: '#BE123C', label: 'الياقوتي' },
    { regex: /تركواز|سماوي/i, hex: '#0284C7', label: 'السماوي المضيء' },
    { regex: /كحلي|أسود|اسود/i, hex: '#0B132B', label: 'الكحلي الليلي' },
    { regex: /أزرق|ازرق|ملكي/i, hex: '#1D4ED8', label: 'الأزرق الملكي' },
  ];
  const matchedColor = colorRules.find((c) => c.regex.test(text));
  const mentionsDarkMode = /وضع داكن|الوضع الداكن|داكن|ليلي/i.test(text);
  if (
    matchedColor ||
    mentionsDarkMode ||
    /الألوان|الالوان|تغيير اللون|غيّر اللون|غير اللون|تعديل اللون|لون الهوية/i.test(text)
  ) {
    const offDark = /إلغاء|الغاء|إيقاف|ايقاف|فاتح/i.test(text);
    return {
      intent: 'change_color',
      actionLabel: 'تعديل الألوان والمظهر',
      extractedColor: matchedColor?.hex,
      extractedColorLabel: matchedColor?.label,
      extractedDarkMode: mentionsDarkMode ? !offDark : undefined,
      targetPanel: 'colors',
    };
  }

  // 7. Change Template / Style Intent
  if (/قالب|القالب|نمط التصميم|كلاسيكي|سينمائي|عصري/i.test(text)) {
    let extractedStyle: SiteStyle | undefined;
    if (/كلاسيكي/i.test(text)) extractedStyle = 'classic';
    else if (/سينمائي/i.test(text)) extractedStyle = 'cinematic';
    else if (/تطبيق/i.test(text)) extractedStyle = 'app';
    else if (/عصري/i.test(text)) extractedStyle = 'modern';

    return {
      intent: 'change_template',
      actionLabel: 'تعديل القالب والمظهر',
      extractedStyle,
      targetPanel: 'template',
    };
  }

  // 8. Change Contact / Phone / WhatsApp / Address Intent
  if (/رقم التواصل|رقم واتساب|رقم الجوال|تغيير الرقم|غيّر الرقم|العنوان|بيانات التواصل/i.test(text)) {
    const phoneMatch = text.match(/(?:\+?9665\d{8}|05\d{8})/);
    const extractedPhone = phoneMatch
      ? phoneMatch[0].replace(/^\+/, '').replace(/^05/, '9665')
      : undefined;
    return {
      intent: 'change_contact',
      actionLabel: 'تعديل بيانات التواصل',
      extractedValue: extractedPhone,
      targetPanel: 'contact',
    };
  }

  // 9. Products / Items Management Panel Intent
  if (/منتجات|المنتجات|أصناف|اصناف|المنيو|قائمة الطعام|الباقات|العناصر/i.test(text)) {
    return {
      intent: 'open_panel',
      actionLabel: 'إدارة المنتجات والعناصر',
      targetPanel: 'products',
    };
  }

  // 10. Settings / Preview Fallback
  if (/إعدادات|اعدادات|الرابط|حذف/i.test(text)) {
    return {
      intent: 'open_panel',
      actionLabel: 'تعديل إعدادات الخدمة',
      targetPanel: 'settings',
    };
  }
  if (/معاينة|عرض الموقع/i.test(text)) {
    return {
      intent: 'open_panel',
      actionLabel: 'معاينة الخدمة',
      targetPanel: 'preview',
    };
  }

  return {
    intent: 'general_edit',
    actionLabel: 'تنفيذ التعديل المطلوب',
  };
}

function buildResolvedBotReply(
  targetService: AssistantServiceSummary,
  parsedIntent: ReturnType<typeof detectAssistantCommandIntent>
): { reply: string; awaitingValueFollowUp: boolean } {
  const serviceOpt = getConversationalServiceOption(targetService.templateId);
  const serviceBadge = `«${targetService.siteName}» (${serviceOpt.shortLabel})`;

  switch (parsedIntent.intent) {
    case 'change_hours': {
      if (parsedIntent.extractedValue) {
        return {
          reply: `⏰ تم تحديث أوقات العمل لخدمة ${serviceBadge} بنجاح إلى: ${parsedIntent.extractedValue}`,
          awaitingValueFollowUp: false,
        };
      }
      return {
        reply: `✅ تم التعرف على الخدمة المقصودة: ${serviceBadge} لتغيير أوقات العمل.\nأرسل الآن أوقات العمل الجديدة (مثال: السبت - الخميس 9 صباحاً - 11 مساءً) ليتم حفظها في ${serviceBadge} فقط.`,
        awaitingValueFollowUp: true,
      };
    }

    case 'add_item': {
      if (parsedIntent.extractedItem?.name) {
        const pricePart = parsedIntent.extractedItem.price
          ? ` (${parsedIntent.extractedItem.price})`
          : '';
        return {
          reply: `✅ تم حفظ «${parsedIntent.extractedItem.name}»${pricePart} في خدمة ${serviceBadge} بنجاح!`,
          awaitingValueFollowUp: false,
        };
      }
      return {
        reply: `✅ تم تحديد خدمة ${serviceBadge} لإضافة ${serviceOpt.itemNoun}.\nأرسل الآن اسم الـ${serviceOpt.itemNoun} والسعر (مثال: ${serviceOpt.itemNoun} جديد - 35 ر.س) ليتم إضافته في ${serviceBadge} فقط.`,
        awaitingValueFollowUp: true,
      };
    }

    case 'update_description': {
      if (parsedIntent.extractedValue) {
        return {
          reply: `✨ تم تحديث الوصف والنبذة لخدمة ${serviceBadge} بنجاح.`,
          awaitingValueFollowUp: false,
        };
      }
      return {
        reply: `✅ تم تحديد خدمة ${serviceBadge} لتعديل الوصف والمحتوى.\nأرسل الآن النص الجديد ليتم حفظه في ${serviceBadge} فقط.`,
        awaitingValueFollowUp: true,
      };
    }

    case 'change_color': {
      if (parsedIntent.extractedColor || typeof parsedIntent.extractedDarkMode === 'boolean') {
        const detail = parsedIntent.extractedColorLabel
          ? ` إلى ${parsedIntent.extractedColorLabel}`
          : '';
        return {
          reply: `🎨 تم تحديث لون الهوية والمظهر لخدمة ${serviceBadge}${detail} بنجاح.`,
          awaitingValueFollowUp: false,
        };
      }
      return {
        reply: `✅ تم تحديد خدمة ${serviceBadge} لتعديل الألوان والمظهر.\nاختر أو اكتب اللون المطلوب (مثال: ذهبي، أزرق ملكي، زمردي، بنفسجي).`,
        awaitingValueFollowUp: true,
      };
    }

    case 'change_template': {
      if (parsedIntent.extractedStyle) {
        return {
          reply: `✨ تم تحديث القالب ونمط التصميم لخدمة ${serviceBadge} بنجاح.`,
          awaitingValueFollowUp: false,
        };
      }
      return {
        reply: `✅ تم تحديد خدمة ${serviceBadge} لتعديل القالب ونمط التصميم.`,
        awaitingValueFollowUp: false,
      };
    }

    case 'change_contact': {
      if (parsedIntent.extractedValue) {
        return {
          reply: `📞 تم تحديث رقم التواصل وواتساب لخدمة ${serviceBadge} إلى +${parsedIntent.extractedValue} بنجاح.`,
          awaitingValueFollowUp: false,
        };
      }
      return {
        reply: `✅ تم تحديد خدمة ${serviceBadge} لتعديل بيانات التواصل.\nأرسل الآن رقم الجوال/واتساب الجديد ليتم حفظه في ${serviceBadge} فقط.`,
        awaitingValueFollowUp: true,
      };
    }

    case 'query_stats': {
      const today = targetService.visitsToday ?? 0;
      const total = targetService.visitsTotal ?? 0;
      const subs = targetService.submissionsCount ?? 0;
      return {
        reply: `📊 إحصائيات خدمة ${serviceBadge}:\n• زيارات اليوم الفعلية: ${today} زيارة\n• إجمالي الزيارات الكلي: ${total} زيارة\n• التفاعلات والردود المسجلة: ${subs}`,
        awaitingValueFollowUp: false,
      };
    }

    default:
      return {
        reply: `✅ تم تحديد خدمة ${serviceBadge} لتنفيذ طلبك (${parsedIntent.actionLabel}).`,
        awaitingValueFollowUp: false,
      };
  }
}

export function resolveMultiServiceCommand(
  rawMessage: string,
  userServices: ReadonlyArray<AssistantServiceSummary>,
  pendingContext?: PendingAssistantDisambiguation
): MultiServiceCommandResolution {
  const text = rawMessage.trim();

  // ---------------------------------------------------------------------------
  // 1. Check if the user is answering a pending disambiguation question
  //    (e.g., Bot asked "لأي خدمة تريد تغيير أوقات العمل؟" and user replied "المطعم" or "2")
  // ---------------------------------------------------------------------------
  if (
    pendingContext?.pendingCommand &&
    pendingContext.candidateServices &&
    pendingContext.candidateServices.length > 0
  ) {
    const candidates = pendingContext.candidateServices;
    let chosen: AssistantServiceSummary | undefined;

    // Check 1-based index or Arabic ordinal
    const trimmedDigits = text.replace(/[^\d]/g, '');
    if (/^[1-9]$/.test(trimmedDigits) && text.length <= 3) {
      const idx = parseInt(trimmedDigits, 10) - 1;
      if (candidates[idx]) chosen = candidates[idx];
    } else if (/^(?:الأول|الاول|الأولى|الاولى)$/i.test(text)) {
      chosen = candidates[0];
    } else if (/^(?:الثاني|الثانية)$/i.test(text)) {
      chosen = candidates[1];
    } else if (/^(?:الثالث|الثالثة)$/i.test(text)) {
      chosen = candidates[2];
    }

    if (!chosen) {
      const refCheck = identifyReferencedServices(text, candidates);
      if (refCheck.matched.length === 1) {
        chosen = refCheck.matched[0];
      }
    }

    if (chosen) {
      const originalParsed = detectAssistantCommandIntent(pendingContext.pendingCommand, chosen);
      const { reply, awaitingValueFollowUp } = buildResolvedBotReply(chosen, originalParsed);
      return {
        status: 'resolved',
        intent: originalParsed.intent,
        actionLabel: originalParsed.actionLabel,
        targetService: chosen,
        candidateServices: [chosen],
        extractedValue: originalParsed.extractedValue,
        extractedItem: originalParsed.extractedItem,
        extractedColor: originalParsed.extractedColor,
        extractedColorLabel: originalParsed.extractedColorLabel,
        extractedStyle: originalParsed.extractedStyle,
        extractedDarkMode: originalParsed.extractedDarkMode,
        targetPanel: originalParsed.targetPanel,
        awaitingValueFollowUp,
        pendingContext: awaitingValueFollowUp
          ? {
              pendingCommand: pendingContext.pendingCommand,
              pendingIntent: originalParsed.intent,
              pendingActionLabel: originalParsed.actionLabel,
              lockedTargetUsername: chosen.username,
            }
          : undefined,
        botReply: reply,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Check if user is providing the follow-up value for an already locked service
  //    (e.g. User said "غيّر أوقات العمل في المطعم", then sent "9 صباحاً - 11 مساءً")
  // ---------------------------------------------------------------------------
  if (pendingContext?.lockedTargetUsername && pendingContext?.pendingIntent) {
    const lockedService = userServices.find(
      (s) => s.username === pendingContext.lockedTargetUsername
    );
    const refInNewMsg = identifyReferencedServices(text, userServices);
    const switchesToOther =
      refInNewMsg.matched.length === 1 &&
      refInNewMsg.matched[0].username !== pendingContext.lockedTargetUsername;

    if (lockedService && !switchesToOther) {
      if (pendingContext.pendingIntent === 'change_hours') {
        const hoursVal = stripServiceReferencesFromValue(text, lockedService)
          .replace(/^(?:أوقات العمل|اوقات العمل|ساعات العمل|الدوام)\s*[:：-]?\s*/i, '')
          .trim();
        if (hoursVal) {
          const parsed: ReturnType<typeof detectAssistantCommandIntent> = {
            intent: 'change_hours',
            actionLabel: 'تغيير أوقات العمل',
            extractedValue: hoursVal,
            targetPanel: 'contact',
          };
          const { reply } = buildResolvedBotReply(lockedService, parsed);
          return {
            status: 'resolved',
            intent: 'change_hours',
            actionLabel: 'تغيير أوقات العمل',
            targetService: lockedService,
            candidateServices: [lockedService],
            extractedValue: hoursVal,
            targetPanel: 'contact',
            awaitingValueFollowUp: false,
            botReply: reply,
          };
        }
      } else if (pendingContext.pendingIntent === 'add_item') {
        const itemText = text.replace(/^(?:أضف|اضف)\s*[:：-]?\s*/i, '').trim();
        const priceMatch = itemText.match(/[-–—|،,]?\s*(\d+(?:\.\d+)?\s*(?:ر\.س|ريال|SAR|\$)?)$/i);
        const itemName = priceMatch ? itemText.slice(0, priceMatch.index).trim() || itemText : itemText;
        const itemPrice = priceMatch ? priceMatch[1].trim() : '';
        const parsed: ReturnType<typeof detectAssistantCommandIntent> = {
          intent: 'add_item',
          actionLabel: 'إضافة عنصر جديد',
          extractedItem: { name: itemName, ...(itemPrice ? { price: itemPrice } : {}) },
          targetPanel: 'products',
        };
        const { reply } = buildResolvedBotReply(lockedService, parsed);
        return {
          status: 'resolved',
          intent: 'add_item',
          actionLabel: 'إضافة عنصر جديد',
          targetService: lockedService,
          candidateServices: [lockedService],
          extractedItem: parsed.extractedItem,
          targetPanel: 'products',
          awaitingValueFollowUp: false,
          botReply: reply,
        };
      } else if (pendingContext.pendingIntent === 'update_description') {
        const descVal = text.replace(/^(?:وصف|نبذة)\s*[:：-]?\s*/i, '').trim();
        const parsed: ReturnType<typeof detectAssistantCommandIntent> = {
          intent: 'update_description',
          actionLabel: 'تعديل الوصف والمحتوى',
          extractedValue: descVal,
          targetPanel: 'content',
        };
        const { reply } = buildResolvedBotReply(lockedService, parsed);
        return {
          status: 'resolved',
          intent: 'update_description',
          actionLabel: 'تعديل الوصف والمحتوى',
          targetService: lockedService,
          candidateServices: [lockedService],
          extractedValue: descVal,
          targetPanel: 'content',
          awaitingValueFollowUp: false,
          botReply: reply,
        };
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Detect Command Intent
  // ---------------------------------------------------------------------------
  const initialIntent = detectAssistantCommandIntent(text);

  if (initialIntent.intent === 'create_new_service') {
    const optLabel = initialIntent.newServiceTemplateId
      ? ` (${getConversationalServiceOption(initialIntent.newServiceTemplateId).shortLabel})`
      : '';
    return {
      status: 'create_new_service',
      intent: 'create_new_service',
      actionLabel: 'إنشاء خدمة جديدة',
      candidateServices: [],
      newServiceTemplateId: initialIntent.newServiceTemplateId,
      botReply: `سيتم بدء إنشاء خدمة جديدة ومستقلة${optLabel} دون خلطها مع خدماتك الحالية ✨`,
    };
  }

  if (userServices.length === 0) {
    return {
      status: 'no_services',
      intent: initialIntent.intent,
      actionLabel: initialIntent.actionLabel,
      candidateServices: [],
      botReply:
        'لا توجد لديك خدمات منشورة حالياً. أنشئ خدمتك الأولى من «إنشاء خدمة جديدة» ليتمكن المساعد من إدارتها.',
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Identify Which Service(s) the User Referenced
  // ---------------------------------------------------------------------------
  const refResult = identifyReferencedServices(text, userServices);

  // Case 4A: User explicitly mentioned a service type (e.g. "في المطعم") that they DO NOT own
  if (refResult.matched.length === 0 && refResult.explicitlyMentionedTypeLabel) {
    const existingList = userServices
      .map((s) => `«${s.siteName}» (${getConversationalServiceOption(s.templateId).shortLabel})`)
      .join('، ');
    return {
      status: 'not_found',
      intent: initialIntent.intent,
      actionLabel: initialIntent.actionLabel,
      candidateServices: [...userServices],
      botReply: `لم أجد خدمة من نوع «${refResult.explicitlyMentionedTypeLabel}» ضمن خدماتك الحالية (${existingList}). يرجى اختيار الخدمة المقصودة أو إنشاء خدمة جديدة:`,
    };
  }

  // Case 4B: Exactly ONE service matched explicitly (e.g. "غيّر أوقات العمل في المطعم")
  if (refResult.matched.length === 1) {
    const target = refResult.matched[0];
    const refinedIntent = detectAssistantCommandIntent(text, target);
    const { reply, awaitingValueFollowUp } = buildResolvedBotReply(target, refinedIntent);
    return {
      status: 'resolved',
      intent: refinedIntent.intent,
      actionLabel: refinedIntent.actionLabel,
      targetService: target,
      candidateServices: [target],
      extractedValue: refinedIntent.extractedValue,
      extractedItem: refinedIntent.extractedItem,
      extractedColor: refinedIntent.extractedColor,
      extractedColorLabel: refinedIntent.extractedColorLabel,
      extractedStyle: refinedIntent.extractedStyle,
      extractedDarkMode: refinedIntent.extractedDarkMode,
      targetPanel: refinedIntent.targetPanel,
      awaitingValueFollowUp,
      pendingContext: awaitingValueFollowUp
        ? {
            pendingCommand: text,
            pendingIntent: refinedIntent.intent,
            pendingActionLabel: refinedIntent.actionLabel,
            lockedTargetUsername: target.username,
          }
        : undefined,
      botReply: reply,
    };
  }

  // Case 4C: User has only 1 service total and did not name a non-existent service
  if (userServices.length === 1) {
    const singleTarget = userServices[0];
    const refinedIntent = detectAssistantCommandIntent(text, singleTarget);
    const { reply, awaitingValueFollowUp } = buildResolvedBotReply(singleTarget, refinedIntent);
    return {
      status: 'resolved',
      intent: refinedIntent.intent,
      actionLabel: refinedIntent.actionLabel,
      targetService: singleTarget,
      candidateServices: [singleTarget],
      extractedValue: refinedIntent.extractedValue,
      extractedItem: refinedIntent.extractedItem,
      extractedColor: refinedIntent.extractedColor,
      extractedColorLabel: refinedIntent.extractedColorLabel,
      extractedStyle: refinedIntent.extractedStyle,
      extractedDarkMode: refinedIntent.extractedDarkMode,
      targetPanel: refinedIntent.targetPanel,
      awaitingValueFollowUp,
      pendingContext: awaitingValueFollowUp
        ? {
            pendingCommand: text,
            pendingIntent: refinedIntent.intent,
            pendingActionLabel: refinedIntent.actionLabel,
            lockedTargetUsername: singleTarget.username,
          }
        : undefined,
      botReply: reply,
    };
  }

  // Case 4D: User has MULTIPLE services (2 or 3) and the request is ambiguous
  //          (matches 0 specific services or matches >1 services)
  const candidates =
    refResult.matched.length > 1 ? refResult.matched : [...userServices];

  const numberedOptions = candidates
    .map(
      (s, i) =>
        `${i + 1}. ${s.siteName} (${getConversationalServiceOption(s.templateId).shortLabel})`
    )
    .join('\n');

  return {
    status: 'needs_disambiguation',
    intent: initialIntent.intent,
    actionLabel: initialIntent.actionLabel,
    candidateServices: candidates,
    targetPanel: initialIntent.targetPanel,
    pendingContext: {
      pendingCommand: text,
      pendingIntent: initialIntent.intent,
      pendingActionLabel: initialIntent.actionLabel,
      candidateServices: candidates,
    },
    botReply: `لأي خدمة تريد ${initialIntent.actionLabel}؟ لديك أكثر من خدمة مستقلة، يرجى تحديد الخدمة المقصودة:\n${numberedOptions}`,
  };
}

