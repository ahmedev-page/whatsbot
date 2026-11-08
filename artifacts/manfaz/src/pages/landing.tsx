import { useState } from 'react';
import { Link } from 'wouter';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Cloud,
  ExternalLink,
  Globe,
  Layers,
  LogIn,
  Menu,
  MessageSquare,
  Palette,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { OrxaiMark } from '@/components/orxai-mark';
import {
  BotVisualAttachment,
  CategoryHexGlobeIcon,
  CategoryStackedLayersIcon,
  HeroIsometricBrowserShowcase,
  HeroOrbitalBackdrop,
  InfinityPedestalVisual,
  StudioHeroBannerArt,
} from '@/components/landing-visuals';
import { useAccount, type SiteStyle } from '@/lib/account';
import {
  BOT_PILLARS,
  EXECUTIVE_THEMES,
  SERVICE_GROUPS,
  STUDIO_PRESETS,
  STYLE_MODES,
  resolveStudioPreviewState,
  type StudioPresetConfig,
} from '@/lib/landing-data';

const FAQ_ITEMS = [
  {
    q: 'هل كل قالب في ORxai يعمل بنظام مستقل ومخصص؟',
    a: 'نعم، كل خدمة تمتلك واجهة وقسم تحكم مخصصين لطبيعتها: المتجر بسلة طلبات، المنيو بأصناف الطاولات، الحجوزات بجدول مواعيد، والاستبيان بأسئلة وتقييمات تفاعلية.',
  },
  {
    q: 'كيف يعمل المساعد الذكي عبر واتساب؟',
    a: 'يرتبط بحسابك لتوثيق الدخول السريع (OTP)، إجراء التعديلات النصية الفورية على موقعك المنشور، وطلب ملخص الزيارات والطلبات اليومية برسالة واحدة.',
  },
  {
    q: 'هل أحتاج إلى خبرة تقنية لإطلاق موقعي أو أداتي التفاعلية؟',
    a: 'لا على الإطلاق؛ اختر القالب المناسب، أدخل اسم مشروعك وهويتك اللونية، وانشر رابطك الرسمي فوراً من لوحة التحكم.',
  },
];

export default function LandingPage() {
  const account = useAccount();
  const currentUser = account.data;
  const primaryDestination = '/dashboard';

  // Mobile / Quick Drawer Menu state
  const [menuOpen, setMenuOpen] = useState(false);

  // Hero 3D Browser interactive tab (0..3)
  const [heroBrowserTab, setHeroBrowserTab] = useState(0);

  // Selected Category ('websites' | 'tools')
  const [activeCategoryId, setActiveCategoryId] = useState<'websites' | 'tools'>('websites');

  // Interactive Studio State
  const [studioPreset, setStudioPreset] = useState<StudioPresetConfig['id']>('store');
  const [studioTitle, setStudioTitle] = useState('');
  const [studioColor, setStudioColor] = useState(EXECUTIVE_THEMES[0].hex);
  const [studioStyle, setStudioStyle] = useState<SiteStyle>('cinematic');

  // WhatsApp Bot Pillar State
  const [activeBotPillar, setActiveBotPillar] = useState<'auth' | 'edit' | 'analytics'>('edit');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const previewState = resolveStudioPreviewState(
    studioPreset,
    studioTitle,
    studioColor,
    studioStyle,
  );

  const currentBot =
    BOT_PILLARS.find((item) => item.id === activeBotPillar) ?? BOT_PILLARS[1];

  const activeCategoryGroup =
    SERVICE_GROUPS.find((g) => g.id === activeCategoryId) ?? SERVICE_GROUPS[0];

  const heroTabPresets: StudioPresetConfig['id'][] = ['store', 'restaurant', 'services', 'booking'];
  const handleHeroTabSelect = (idx: number) => {
    setHeroBrowserTab(idx);
    const mapped = heroTabPresets[idx] ?? 'store';
    setStudioPreset(mapped);
  };

  const handleSelectCategory = (categoryId: 'websites' | 'tools', scroll = true) => {
    setActiveCategoryId(categoryId);
    const defaultPresetForCat = categoryId === 'websites' ? 'store' : 'survey';
    setStudioPreset(defaultPresetForCat);
    if (scroll) {
      document.getElementById('services-suite')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectSubService = (
    categoryId: 'websites' | 'tools',
    templateId: string,
    scroll = true,
  ) => {
    setActiveCategoryId(categoryId);
    const presetKey = (
      templateId in STUDIO_PRESETS ? templateId : 'store'
    ) as StudioPresetConfig['id'];
    setStudioPreset(presetKey);
    if (scroll) {
      document.getElementById('interactive-studio')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const launchHref = `/dashboard?create=1&template=${encodeURIComponent(
    studioPreset,
  )}&style=${encodeURIComponent(studioStyle)}${
    studioTitle.trim() ? `&name=${encodeURIComponent(studioTitle.trim())}` : ''
  }`;

  return (
    <div
      dir="rtl"
      style={{
        backgroundColor: '#030712',
        color: '#FFFFFF',
      }}
      className="relative min-h-screen overflow-x-hidden font-sans antialiased selection:bg-sky-500 selection:text-white"
    >
      {/* Ambient Deep Midnight Sapphire Backdrop (matching attached reference image) */}
      <HeroOrbitalBackdrop />

      {/* =====================================================================
          1. TOP HEADER BAR (Matches reference image: Left Hamburger + ORxai, Right Login Pill)
      ====================================================================== */}
      <header className="relative z-40 mx-auto max-w-6xl px-3.5 pt-3.5 sm:px-8 sm:pt-6">
        <div
          dir="ltr"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          {/* Left Side: Circular Glass Menu Button + ORxai Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <button
              type="button"
              aria-label="القائمة الرئيسية"
              data-testid="button-menu-toggle"
              onClick={() => setMenuOpen((prev) => !prev)}
              style={{
                width: '36px',
                height: '36px',
                minWidth: '36px',
                maxWidth: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                backgroundColor: 'rgba(10, 20, 48, 0.78)',
                borderColor: 'rgba(56, 189, 248, 0.26)',
                color: '#E2E8F0',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.14)',
              }}
              className="rounded-full border backdrop-blur-md transition-all duration-200 hover:border-sky-400/60 hover:text-white"
            >
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>

            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
              className="select-none focus:outline-none"
            >
              <svg
                viewBox="0 0 44 44"
                width="28"
                height="28"
                style={{ width: '28px', height: '28px', flexShrink: 0 }}
                fill="none"
                aria-hidden
              >
                <defs>
                  <linearGradient id="orx-hdr-x1" x1="6" y1="8" x2="38" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                  <linearGradient id="orx-hdr-x2" x1="38" y1="8" x2="6" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#7DD3FC" />
                    <stop offset="100%" stopColor="#0284C7" />
                  </linearGradient>
                </defs>
                <path
                  d="M8 10L17 10L36 34L27 34L8 10Z"
                  fill="url(#orx-hdr-x1)"
                />
                <path
                  d="M36 10L27 10L8 34L17 34L36 10Z"
                  fill="url(#orx-hdr-x2)"
                />
                <circle cx="22" cy="22" r="2.8" fill="#E0F2FE" />
              </svg>
              <span
                style={{
                  color: '#FFFFFF',
                  fontSize: 'clamp(1.15rem, 3vw, 1.5rem)',
                  fontWeight: 800,
                }}
                className="font-mono tracking-tight"
              >
                ORxai
              </span>
            </Link>
          </div>

          {/* Right Side: "دخول المنصة" Dark Glass Pill Button */}
          <Link
            href={primaryDestination}
            data-testid="link-header-primary-cta"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '9999px',
              padding: '6px 14px',
              backgroundImage:
                'linear-gradient(135deg, rgba(14, 28, 66, 0.88) 0%, rgba(7, 15, 36, 0.94) 100%)',
              borderColor: 'rgba(56, 189, 248, 0.32)',
              color: '#FFFFFF',
              boxShadow:
                '0 8px 22px -6px rgba(2, 6, 23, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.16)',
            }}
            className="rounded-full border text-xs sm:text-sm font-extrabold backdrop-blur-md transition-all duration-200 hover:border-sky-400/70 hover:bg-slate-900 whitespace-nowrap"
          >
            <span>{currentUser ? 'لوحة التحكم' : 'دخول المنصة'}</span>
            <LogIn size={14} className="text-sky-400" />
          </Link>
        </div>

        {/* Collapsible Glass Navigation Drawer when Hamburger is clicked */}
        {menuOpen && (
          <div
            dir="rtl"
            style={{
              backgroundColor: 'rgba(8, 16, 38, 0.96)',
              borderColor: 'rgba(56, 189, 248, 0.32)',
            }}
            className="mt-3 rounded-2xl border p-3.5 sm:p-5 shadow-2xl backdrop-blur-xl"
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <a
                href="#services-suite"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '9999px',
                  padding: '7px 14px',
                  backgroundColor: 'rgba(15, 29, 64, 0.75)',
                  borderColor: 'rgba(56, 189, 248, 0.25)',
                  color: '#FFFFFF',
                }}
                className="border text-xs font-bold transition hover:border-sky-400"
              >
                <span>مواقع وواجهات وأدوات</span>
                <ArrowLeft size={13} className="text-sky-400" />
              </a>
              <a
                href="#interactive-studio"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '9999px',
                  padding: '7px 14px',
                  backgroundColor: 'rgba(15, 29, 64, 0.75)',
                  borderColor: 'rgba(56, 189, 248, 0.25)',
                  color: '#FFFFFF',
                }}
                className="border text-xs font-bold transition hover:border-sky-400"
              >
                <span>استوديو التجربة الحية</span>
                <ArrowLeft size={13} className="text-sky-400" />
              </a>
              <a
                href="#whatsapp-assistant"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '9999px',
                  padding: '7px 14px',
                  backgroundColor: 'rgba(15, 29, 64, 0.75)',
                  borderColor: 'rgba(56, 189, 248, 0.25)',
                  color: '#FFFFFF',
                }}
                className="border text-xs font-bold transition hover:border-sky-400"
              >
                <span>مساعد واتساب الذكي</span>
                <ArrowLeft size={13} className="text-sky-400" />
              </a>
              <Link
                href={primaryDestination}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '9999px',
                  padding: '7px 14px',
                  backgroundImage: 'linear-gradient(90deg, #1D4ED8 0%, #0EA5E9 100%)',
                  color: '#FFFFFF',
                }}
                className="text-xs font-extrabold shadow-md"
              >
                <span>{currentUser ? 'لوحة التحكم' : 'ابدأ الآن مجاناً'}</span>
                <ArrowLeft size={13} />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          2. HERO SECTION + 2 CATEGORY CARDS + WHY ORXAI (Exact Match to Reference Image on Mobile & Desktop)
      ====================================================================== */}
      <main className="relative z-10 mx-auto max-w-6xl px-3.5 pt-4 pb-6 sm:px-8 sm:pt-10 sm:pb-14">
        {/* --- A. HERO SPLIT SECTION (Side-by-Side 2-Column on Mobile & Desktop like Reference Image) --- */}
        <section
          data-testid="landing-hero"
          style={{
            display: 'grid',
            gridTemplateColumns: '54% 46%',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {/* Right Column in RTL (First in DOM): Arabic Copy & Primary CTA */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'right',
              minWidth: 0,
            }}
          >
            {/* Top Kicker Pill: "منظومتك الرقمية المتكاملة" */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '9999px',
                padding: '3px 10px',
                backgroundColor: 'rgba(10, 22, 54, 0.85)',
                borderColor: 'rgba(56, 189, 248, 0.3)',
                color: '#E2E8F0',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.12)',
                fontSize: 'clamp(9.5px, 2.2vw, 12px)',
              }}
              className="border font-bold backdrop-blur-md whitespace-nowrap"
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  backgroundColor: '#38BDF8',
                  boxShadow: '0 0 8px #38BDF8',
                  flexShrink: 0,
                }}
              />
              <span>منظومتك الرقمية المتكاملة</span>
            </div>

            {/* Main 2-Line Headline (Single-line per row on mobile & desktop matching reference) */}
            <h1
              style={{
                fontSize: 'clamp(1.14rem, 4.9vw, 3.1rem)',
                lineHeight: 1.24,
                marginTop: 'clamp(10px, 2vw, 20px)',
              }}
              className="font-extrabold tracking-tight"
            >
              <span style={{ color: '#FFFFFF', display: 'block', whiteSpace: 'nowrap' }}>
                كل ما تَحتَاجه رقمياً.
              </span>
              <span
                style={{
                  color: '#38BDF8',
                  textShadow: '0 0 28px rgba(56, 189, 248, 0.28)',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  marginTop: '2px',
                }}
              >
                في مَكان واحد.
              </span>
            </h1>

            {/* Subtitle with glowing cyan underline accent under "أنشِئ." */}
            <p
              style={{
                color: '#E2E8F0',
                fontSize: 'clamp(10.5px, 2.6vw, 18px)',
                marginTop: 'clamp(8px, 1.8vw, 18px)',
                whiteSpace: 'nowrap',
              }}
              className="font-bold"
            >
              <span className="relative inline-block pb-0.5 sm:pb-1">
                أنشِئ.
                <svg
                  aria-hidden
                  viewBox="0 0 80 10"
                  className="pointer-events-none absolute right-0 -bottom-0.5 sm:-bottom-1 h-1.5 sm:h-2.5 w-full"
                  style={{ width: '100%', height: '6px' }}
                  fill="none"
                >
                  <path
                    d="M 4 7 Q 40 2 76 5"
                    stroke="#38BDF8"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{' '}
              أطلق. وأدر أعمالك بذكاء.
            </p>

            {/* Primary Pill CTA Button: "ابدأ الآن مجاناً" with compact glowing circular arrow */}
            <div style={{ marginTop: 'clamp(12px, 2.5vw, 26px)' }}>
              <Link
                href={primaryDestination}
                data-testid="button-hero-start"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '9999px',
                  padding: '4px 4px 4px 14px',
                  backgroundImage:
                    'linear-gradient(90deg, #1E40AF 0%, #2563EB 55%, #0EA5E9 100%)',
                  borderColor: 'rgba(125, 211, 252, 0.45)',
                  color: '#FFFFFF',
                  fontSize: 'clamp(11px, 2.5vw, 14px)',
                  boxShadow:
                    '0 10px 26px -6px rgba(14, 165, 233, 0.52), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                }}
                className="group border font-extrabold transition-all duration-300 hover:scale-[1.02] whitespace-nowrap"
              >
                {/* Glowing cyan circle with arrow on the right side in RTL */}
                <span
                  style={{
                    width: 'clamp(24px, 5vw, 34px)',
                    height: 'clamp(24px, 5vw, 34px)',
                    borderRadius: '9999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                    color: '#FFFFFF',
                    boxShadow: '0 0 12px rgba(56, 189, 248, 0.65)',
                    flexShrink: 0,
                  }}
                >
                  <ArrowRight size={14} />
                </span>
                <span>ابدأ الآن مجاناً</span>
              </Link>
            </div>
          </div>

          {/* Left Column in RTL (Second in DOM): 3D Tilted Isometric Browser Showcase */}
          <div style={{ minWidth: 0, width: '100%' }}>
            <HeroIsometricBrowserShowcase
              activeTab={heroBrowserTab}
              onSelectTab={handleHeroTabSelect}
              previewTitle={previewState.displayTitle}
              previewSubtitle={previewState.preset.subtitle}
              previewCta={previewState.preset.cta}
            />
          </div>
        </section>

        {/* --- B. TWO MAIN CATEGORY BENTO CARDS (2 Columns Side-by-Side on Mobile & Desktop matching Reference) --- */}
        <section
          aria-label="الأقسام الرئيسية"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 'clamp(10px, 2.2vw, 24px)',
            marginTop: 'clamp(20px, 4vw, 48px)',
          }}
        >
          {/* Card 1 (Right in RTL): مواقع وواجهات */}
          <button
            type="button"
            data-testid="card-category-websites"
            onClick={() => handleSelectCategory('websites')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              borderRadius: '20px',
              padding: 'clamp(12px, 2.5vw, 24px)',
              backgroundImage:
                activeCategoryId === 'websites'
                  ? 'linear-gradient(135deg, rgba(20, 42, 96, 0.92) 0%, rgba(8, 17, 42, 0.96) 100%)'
                  : 'linear-gradient(135deg, rgba(13, 27, 64, 0.84) 0%, rgba(6, 13, 32, 0.94) 100%)',
              borderColor:
                activeCategoryId === 'websites'
                  ? 'rgba(56, 189, 248, 0.65)'
                  : 'rgba(56, 189, 248, 0.28)',
              boxShadow:
                activeCategoryId === 'websites'
                  ? '0 18px 42px -14px rgba(14, 165, 233, 0.32), inset 0 1px 1px rgba(255, 255, 255, 0.22)'
                  : '0 16px 36px -16px rgba(2, 6, 23, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.14)',
            }}
            className="group relative cursor-pointer overflow-hidden border text-right transition-all duration-300 hover:border-sky-400/70"
          >
            {/* Ambient top-left blue light inside card */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-10 -left-10 h-24 w-24 sm:h-40 sm:w-40 rounded-full blur-2xl"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
              }}
            />

            {/* Right side of card (in RTL): Arabic Title & Subtitle */}
            <div className="relative z-10 min-w-0 text-right">
              <h2
                style={{
                  color: '#FFFFFF',
                  fontSize: 'clamp(13.5px, 3.2vw, 26px)',
                  whiteSpace: 'nowrap',
                }}
                className="font-extrabold tracking-tight"
              >
                مواقع وواجهات
              </h2>
              <p
                style={{
                  color: '#94A3B8',
                  fontSize: 'clamp(10px, 2.1vw, 14px)',
                  marginTop: '4px',
                  whiteSpace: 'nowrap',
                }}
                className="font-medium"
              >
                متاجر ومواقع أعمال
              </p>
            </div>

            {/* Left side of card (in RTL): 3D Hex Globe + Circular Arrow Button */}
            <div
              className="relative z-10 shrink-0"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <CategoryHexGlobeIcon />
              <span
                style={{
                  width: 'clamp(22px, 4vw, 30px)',
                  height: 'clamp(22px, 4vw, 30px)',
                  marginTop: '-6px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(17, 34, 82, 0.9)',
                  borderColor: 'rgba(56, 189, 248, 0.38)',
                  color: '#E0F2FE',
                }}
                className="border shadow-md transition-transform duration-200 group-hover:scale-110"
              >
                <ArrowRight size={12} />
              </span>
            </div>
          </button>

          {/* Card 2 (Left in RTL): أدوات تفاعلية */}
          <button
            type="button"
            data-testid="card-category-tools"
            onClick={() => handleSelectCategory('tools')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              borderRadius: '20px',
              padding: 'clamp(12px, 2.5vw, 24px)',
              backgroundImage:
                activeCategoryId === 'tools'
                  ? 'linear-gradient(135deg, rgba(20, 42, 96, 0.92) 0%, rgba(8, 17, 42, 0.96) 100%)'
                  : 'linear-gradient(135deg, rgba(13, 27, 64, 0.84) 0%, rgba(6, 13, 32, 0.94) 100%)',
              borderColor:
                activeCategoryId === 'tools'
                  ? 'rgba(56, 189, 248, 0.65)'
                  : 'rgba(56, 189, 248, 0.28)',
              boxShadow:
                activeCategoryId === 'tools'
                  ? '0 18px 42px -14px rgba(14, 165, 233, 0.32), inset 0 1px 1px rgba(255, 255, 255, 0.22)'
                  : '0 16px 36px -16px rgba(2, 6, 23, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.14)',
            }}
            className="group relative cursor-pointer overflow-hidden border text-right transition-all duration-300 hover:border-sky-400/70"
          >
            {/* Ambient top-left blue light inside card */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-10 -left-10 h-24 w-24 sm:h-40 sm:w-40 rounded-full blur-2xl"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
              }}
            />

            {/* Right side of card (in RTL): Arabic Title & Subtitle */}
            <div className="relative z-10 min-w-0 text-right">
              <h2
                style={{
                  color: '#FFFFFF',
                  fontSize: 'clamp(13.5px, 3.2vw, 26px)',
                  whiteSpace: 'nowrap',
                }}
                className="font-extrabold tracking-tight"
              >
                أدوات تفاعلية
              </h2>
              <p
                style={{
                  color: '#94A3B8',
                  fontSize: 'clamp(10px, 2.1vw, 14px)',
                  marginTop: '4px',
                  whiteSpace: 'nowrap',
                }}
                className="font-medium"
              >
                حجوزات واستبيانات وغيرها
              </p>
            </div>

            {/* Left side of card (in RTL): 3D Stacked Layers + Circular Arrow Button */}
            <div
              className="relative z-10 shrink-0"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <CategoryStackedLayersIcon />
              <span
                style={{
                  width: 'clamp(22px, 4vw, 30px)',
                  height: 'clamp(22px, 4vw, 30px)',
                  marginTop: '-6px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(17, 34, 82, 0.9)',
                  borderColor: 'rgba(56, 189, 248, 0.38)',
                  color: '#E0F2FE',
                }}
                className="border shadow-md transition-transform duration-200 group-hover:scale-110"
              >
                <ArrowRight size={12} />
              </span>
            </div>
          </button>
        </section>

        {/* --- C. "لماذا ORxai؟" SECTION (2-Column Side-by-Side on Mobile & Desktop matching Reference) --- */}
        <section
          aria-label="لماذا ORxai"
          style={{
            display: 'grid',
            gridTemplateColumns: '56% 44%',
            alignItems: 'center',
            gap: '8px',
            marginTop: 'clamp(24px, 5vw, 56px)',
          }}
        >
          {/* Right Column in RTL: Badge, 2-Line Headline, and 3 Feature Columns */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'right',
              minWidth: 0,
            }}
          >
            {/* Pill Badge: "لماذا ORxai؟" */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '9999px',
                padding: '3px 10px',
                backgroundColor: 'rgba(10, 22, 54, 0.85)',
                borderColor: 'rgba(56, 189, 248, 0.3)',
                color: '#E2E8F0',
                fontSize: 'clamp(9.5px, 2.2vw, 12px)',
              }}
              className="border font-bold whitespace-nowrap"
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  backgroundColor: '#38BDF8',
                  boxShadow: '0 0 8px #38BDF8',
                  flexShrink: 0,
                }}
              />
              <span>لماذا ORxai؟</span>
            </div>

            {/* 2-Line Headline */}
            <h2
              style={{
                fontSize: 'clamp(1rem, 4.1vw, 2.45rem)',
                lineHeight: 1.26,
                marginTop: 'clamp(8px, 1.8vw, 16px)',
              }}
              className="font-extrabold tracking-tight"
            >
              <span style={{ color: '#FFFFFF', display: 'block', whiteSpace: 'nowrap' }}>
                كل خدمة مستقلة ..
              </span>
              <span
                style={{
                  color: '#38BDF8',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  marginTop: '2px',
                }}
              >
                وكل شيء في مكان واحد.
              </span>
            </h2>

            {/* 3 Feature Columns with vertical dividers (Cloud, ShieldCheck, Zap) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                width: '100%',
                marginTop: 'clamp(14px, 3vw, 28px)',
              }}
              className="divide-x divide-x-reverse divide-slate-800/90"
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '0 4px',
                }}
              >
                <Cloud size={18} className="text-sky-400" strokeWidth={1.8} />
                <span
                  style={{
                    color: '#E2E8F0',
                    fontSize: 'clamp(8.5px, 2vw, 12px)',
                    marginTop: '6px',
                    whiteSpace: 'nowrap',
                  }}
                  className="font-bold leading-tight"
                >
                  سرعة وأداء فائق
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '0 4px',
                }}
              >
                <ShieldCheck size={18} className="text-sky-400" strokeWidth={1.8} />
                <span
                  style={{
                    color: '#E2E8F0',
                    fontSize: 'clamp(8.5px, 2vw, 12px)',
                    marginTop: '6px',
                    whiteSpace: 'nowrap',
                  }}
                  className="font-bold leading-tight"
                >
                  أمان وموثوقية
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '0 4px',
                }}
              >
                <Zap size={18} className="text-sky-400" strokeWidth={1.8} />
                <span
                  style={{
                    color: '#E2E8F0',
                    fontSize: 'clamp(8.5px, 2vw, 12px)',
                    marginTop: '6px',
                    whiteSpace: 'nowrap',
                  }}
                  className="font-bold leading-tight"
                >
                  إدارة سحابية سهلة
                </span>
              </div>
            </div>
          </div>

          {/* Left Column in RTL: 3D Sculpted Blue Infinity Symbol on Dark Pedestal */}
          <div style={{ minWidth: 0, width: '100%' }}>
            <InfinityPedestalVisual />
          </div>
        </section>

        {/* --- D. SCROLL INDICATOR PILL (Matches Bottom Center of Reference Image) --- */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: 'clamp(16px, 3vw, 32px)',
          }}
        >
          <span
            aria-hidden
            style={{
              width: '1px',
              height: '14px',
              backgroundColor: 'rgba(148, 163, 184, 0.2)',
            }}
          />
          <a
            href="#services-suite"
            aria-label="استعراض القوالب والاستوديو التفاعلي"
            style={{
              width: '24px',
              height: '38px',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(8, 17, 40, 0.85)',
              borderColor: 'rgba(56, 189, 248, 0.35)',
              color: '#93C5FD',
            }}
            className="border transition-all duration-300 hover:border-sky-400 hover:text-white"
          >
            <ArrowDown size={13} className="animate-bounce" />
          </a>
          <span
            aria-hidden
            style={{
              width: '1px',
              height: '14px',
              backgroundColor: 'rgba(148, 163, 184, 0.2)',
            }}
          />
        </div>
      </main>

      {/* Curved Glowing Horizon Wave Divider (Matches Bottom Wave of Reference Image) */}
      <div aria-hidden className="relative w-full overflow-hidden leading-none select-none">
        <svg
          viewBox="0 0 1440 84"
          fill="none"
          preserveAspectRatio="none"
          className="block h-7 w-full sm:h-14"
          style={{ width: '100%', height: '36px', display: 'block' }}
        >
          <path
            d="M 0 36 C 320 -8 580 78 920 56 C 1180 38 1320 14 1440 8 L 1440 84 L 0 84 Z"
            fill="#060E24"
          />
          <path
            d="M 0 36 C 320 -8 580 78 920 56 C 1180 38 1320 14 1440 8"
            stroke="rgba(56, 189, 248, 0.32)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* =====================================================================
          3. RETAINED ESSENTIAL INFORMATION (Compact, Dark Sapphire Theme, Zero Filler)
             - Interactive Template Selector & Live Studio Preview (#services-suite & #interactive-studio)
             - Compact WhatsApp Smart Assistant & FAQ (#whatsapp-assistant & #faq)
      ====================================================================== */}
      <div
        style={{
          backgroundImage: 'linear-gradient(180deg, #060E24 0%, #040918 100%)',
          backgroundColor: '#060E24',
          color: '#FFFFFF',
        }}
        className="relative z-10 pb-12 sm:pb-20"
      >
        <div className="mx-auto max-w-6xl space-y-8 sm:space-y-12 px-3.5 pt-4 sm:px-8 sm:pt-6">
          {/* --- SECTION 3A: INTERACTIVE TEMPLATES & STUDIO PREVIEWER --- */}
          <section
            id="services-suite"
            data-testid="services-suite"
            className="scroll-mt-6"
          >
            {/* Compact Header + Category Tabs */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
              className="border-b border-slate-800/80 pb-3.5 sm:pb-5"
            >
              <div>
                <span
                  style={{ color: '#38BDF8', fontSize: '11px' }}
                  className="font-extrabold tracking-wider uppercase"
                >
                  القوالب والاستوديو التفاعلي
                </span>
                <h2
                  style={{
                    color: '#FFFFFF',
                    fontSize: 'clamp(1rem, 2.8vw, 1.5rem)',
                  }}
                  className="mt-0.5 font-extrabold"
                >
                  اختر القالب وجرّب هويتك مباشرة
                </h2>
              </div>

              {/* Category Switcher Pills */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '9999px',
                  padding: '4px',
                  backgroundColor: 'rgba(10, 20, 48, 0.9)',
                  borderColor: 'rgba(56, 189, 248, 0.24)',
                }}
                className="border"
              >
                <button
                  type="button"
                  onClick={() => handleSelectCategory('websites', false)}
                  style={
                    activeCategoryId === 'websites'
                      ? {
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '9999px',
                          padding: '6px 12px',
                          backgroundImage: 'linear-gradient(90deg, #1D4ED8 0%, #0EA5E9 100%)',
                          backgroundColor: '#1D4ED8',
                          color: '#FFFFFF',
                          fontSize: '11px',
                        }
                      : {
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '9999px',
                          padding: '6px 12px',
                          backgroundImage: 'none',
                          backgroundColor: 'transparent',
                          color: '#94A3B8',
                          fontSize: '11px',
                        }
                  }
                  className="font-extrabold transition whitespace-nowrap"
                >
                  <Globe size={13} />
                  <span>مواقع وواجهات (5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectCategory('tools', false)}
                  style={
                    activeCategoryId === 'tools'
                      ? {
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '9999px',
                          padding: '6px 12px',
                          backgroundImage: 'linear-gradient(90deg, #1D4ED8 0%, #0EA5E9 100%)',
                          backgroundColor: '#1D4ED8',
                          color: '#FFFFFF',
                          fontSize: '11px',
                        }
                      : {
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderRadius: '9999px',
                          padding: '6px 12px',
                          backgroundImage: 'none',
                          backgroundColor: 'transparent',
                          color: '#94A3B8',
                          fontSize: '11px',
                        }
                  }
                  className="font-extrabold transition whitespace-nowrap"
                >
                  <Layers size={13} />
                  <span>أدوات تفاعلية (4)</span>
                </button>
              </div>
            </div>

            {/* Sleek Horizontal Pill Strip for Sub-service Templates (No boxy square buttons!) */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '6px',
                marginTop: '12px',
              }}
            >
              {activeCategoryGroup.items.map((item) => {
                const isSelected = studioPreset === item.templateId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`button-subservice-${item.id}`}
                    onClick={() =>
                      handleSelectSubService(activeCategoryGroup.id, item.templateId, false)
                    }
                    style={
                      isSelected
                        ? {
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '9999px',
                            padding: '6px 12px',
                            backgroundImage:
                              'linear-gradient(90deg, rgba(29, 78, 216, 0.55) 0%, rgba(14, 165, 233, 0.35) 100%)',
                            backgroundColor: 'rgba(15, 29, 68, 0.95)',
                            borderColor: '#38BDF8',
                            color: '#FFFFFF',
                            fontSize: '11.5px',
                          }
                        : {
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '9999px',
                            padding: '6px 12px',
                            backgroundImage: 'none',
                            backgroundColor: 'rgba(11, 22, 52, 0.72)',
                            borderColor: 'rgba(148, 163, 184, 0.22)',
                            color: '#CBD5E1',
                            fontSize: '11.5px',
                          }
                    }
                    className="border font-extrabold transition-all duration-200 hover:border-sky-400/60 whitespace-nowrap"
                  >
                    <span>{item.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Live Studio Box (#interactive-studio) */}
            <div
              id="interactive-studio"
              data-testid="interactive-studio"
              style={{
                backgroundImage:
                  'linear-gradient(145deg, rgba(12, 25, 58, 0.9) 0%, rgba(6, 13, 32, 0.96) 100%)',
                borderColor: 'rgba(56, 189, 248, 0.3)',
              }}
              className="mt-4 grid grid-cols-1 gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl border p-3.5 sm:p-6 lg:grid-cols-12"
            >
              {/* Controls Column (5 cols) */}
              <div className="flex flex-col justify-between space-y-3.5 lg:col-span-5">
                <div className="space-y-3">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Wand2 size={14} className="text-sky-400" />
                      <span
                        style={{ color: '#38BDF8', fontSize: '12px' }}
                        className="font-extrabold"
                      >
                        تخصيص فوري للقالب المختار
                      </span>
                    </div>
                    <span
                      style={{
                        borderRadius: '9999px',
                        padding: '2px 10px',
                        backgroundColor: 'rgba(37, 99, 235, 0.25)',
                        borderColor: 'rgba(56, 189, 248, 0.35)',
                        color: '#E0F2FE',
                        fontSize: '10px',
                      }}
                      className="border font-bold whitespace-nowrap"
                    >
                      {previewState.preset.label}
                    </span>
                  </div>

                  {/* Project Title Input */}
                  <div>
                    <label
                      htmlFor="studio-title-input"
                      style={{ color: '#CBD5E1', fontSize: '11px' }}
                      className="mb-1 block font-bold"
                    >
                      اسم مشروعك أو علامتك التجارية
                    </label>
                    <input
                      id="studio-title-input"
                      data-testid="input-wb-title"
                      type="text"
                      value={studioTitle}
                      onChange={(e) => setStudioTitle(e.target.value)}
                      placeholder={previewState.preset.defaultTitle}
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(7, 14, 34, 0.9)',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        color: '#FFFFFF',
                        fontSize: '12px',
                      }}
                      className="border font-bold placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                    />
                  </div>

                  {/* Color & Style Row */}
                  <div className="space-y-2.5">
                    <div>
                      <span
                        style={{
                          color: '#CBD5E1',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '6px',
                        }}
                        className="font-bold"
                      >
                        <Palette size={13} className="text-sky-400" />
                        <span>الهوية اللونية</span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {EXECUTIVE_THEMES.map((theme) => {
                          const active = studioColor === theme.hex;
                          return (
                            <button
                              key={theme.hex}
                              type="button"
                              title={theme.name}
                              onClick={() => setStudioColor(theme.hex)}
                              style={{
                                width: '22px',
                                height: '22px',
                                minWidth: '22px',
                                maxWidth: '22px',
                                borderRadius: '9999px',
                                backgroundColor: theme.hex,
                                borderColor: active ? '#FFFFFF' : 'transparent',
                              }}
                              className="border-2 transition-transform hover:scale-110"
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span
                        style={{
                          color: '#CBD5E1',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '6px',
                        }}
                        className="font-bold"
                      >
                        <Sparkles size={13} className="text-sky-400" />
                        <span>نمط العرض</span>
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        {STYLE_MODES.map((mode) => {
                          const active = studioStyle === mode.id;
                          return (
                            <button
                              key={mode.id}
                              type="button"
                              data-testid={`button-studio-style-${mode.id}`}
                              onClick={() => setStudioStyle(mode.id)}
                              style={
                                active
                                  ? {
                                      borderRadius: '9999px',
                                      padding: '5px 12px',
                                      backgroundColor: 'rgba(37, 99, 235, 0.35)',
                                      borderColor: '#38BDF8',
                                      color: '#FFFFFF',
                                      fontSize: '11px',
                                    }
                                  : {
                                      borderRadius: '9999px',
                                      padding: '5px 12px',
                                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                                      borderColor: 'rgba(148, 163, 184, 0.2)',
                                      color: '#94A3B8',
                                      fontSize: '11px',
                                    }
                              }
                              className="border font-bold whitespace-nowrap"
                            >
                              {mode.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                <Link
                  href={launchHref}
                  data-testid="link-wb-launch"
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '9999px',
                    padding: '9px 16px',
                    backgroundImage: 'linear-gradient(90deg, #1D4ED8 0%, #0EA5E9 100%)',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                  className="font-extrabold shadow-md transition hover:opacity-95"
                >
                  <span>إطلاق «{previewState.preset.label}» الآن</span>
                  <ExternalLink size={14} />
                </Link>
              </div>

              {/* Live Preview Canvas Column (7 cols) */}
              <div className="lg:col-span-7">
                <div
                  style={{
                    backgroundColor: previewState.isDarkCanvas ? '#070E22' : '#0F172A',
                    borderColor: 'rgba(56, 189, 248, 0.28)',
                  }}
                  className="overflow-hidden rounded-xl sm:rounded-2xl border p-3 sm:p-5"
                >
                  {/* Banner */}
                  <div
                    className="relative w-full overflow-hidden rounded-xl border border-slate-800"
                    style={{ height: '108px' }}
                  >
                    <StudioHeroBannerArt
                      presetId={previewState.preset.id}
                      primaryHex={previewState.theme.hex}
                      secondaryHex={previewState.theme.secondaryHex}
                    />
                    <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            borderRadius: '9999px',
                            padding: '2px 10px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            borderColor: 'rgba(56, 189, 248, 0.35)',
                            color: '#7DD3FC',
                            fontSize: '10px',
                          }}
                          className="border font-bold"
                        >
                          {previewState.preset.badge}
                        </span>
                        <span
                          style={{ color: '#34D399', fontSize: '11px' }}
                          className="font-mono font-extrabold"
                        >
                          {previewState.preset.growthDelta}
                        </span>
                      </div>
                      <div>
                        <h3
                          style={{ color: '#FFFFFF', fontSize: '15px' }}
                          className="font-extrabold"
                        >
                          {previewState.displayTitle}
                        </h3>
                        <p
                          style={{ color: '#CBD5E1', fontSize: '11px' }}
                          className="line-clamp-1"
                        >
                          {previewState.preset.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3 Preview Items (3 columns side by side on mobile & desktop) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: '8px',
                      marginTop: '10px',
                    }}
                  >
                    {previewState.preset.items.map((item) => (
                      <div
                        key={item.name}
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          borderColor: 'rgba(148, 163, 184, 0.16)',
                          borderRadius: '10px',
                          padding: '8px',
                        }}
                        className="flex flex-col justify-between border"
                      >
                        <div>
                          <span
                            style={{ color: '#38BDF8', fontSize: '9.5px' }}
                            className="font-bold"
                          >
                            {item.tag}
                          </span>
                          <p
                            style={{ color: '#FFFFFF', fontSize: '11px' }}
                            className="mt-0.5 line-clamp-1 font-extrabold"
                          >
                            {item.name}
                          </p>
                          <p
                            style={{ color: '#94A3B8', fontSize: '9.5px' }}
                            className="mt-0.5 line-clamp-1"
                          >
                            {item.meta}
                          </p>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '6px',
                            paddingTop: '6px',
                          }}
                          className="border-t border-slate-800"
                        >
                          <span
                            style={{ color: '#FFFFFF', fontSize: '10.5px' }}
                            className="font-mono font-extrabold"
                          >
                            {item.price}
                          </span>
                          <Check size={12} className="text-emerald-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* --- SECTION 3B: COMPACT WHATSAPP ASSISTANT & FAQ --- */}
          <section
            id="whatsapp-assistant"
            data-testid="whatsapp-assistant-section"
            className="grid grid-cols-1 gap-4 sm:gap-6 pt-2 lg:grid-cols-12"
          >
            {/* WhatsApp Executive Companion (7 cols) */}
            <div
              style={{
                backgroundImage:
                  'linear-gradient(145deg, rgba(12, 25, 58, 0.86) 0%, rgba(6, 13, 32, 0.94) 100%)',
                borderColor: 'rgba(56, 189, 248, 0.26)',
              }}
              className="rounded-2xl sm:rounded-3xl border p-4 sm:p-6 lg:col-span-7"
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(16, 185, 129, 0.16)',
                      borderColor: 'rgba(52, 211, 153, 0.4)',
                      color: '#34D399',
                      flexShrink: 0,
                    }}
                    className="border"
                  >
                    <Bot size={16} />
                  </span>
                  <div>
                    <h3
                      style={{ color: '#FFFFFF', fontSize: '14px' }}
                      className="font-extrabold"
                    >
                      مساعد ORxai الذكي عبر واتساب
                    </h3>
                    <p style={{ color: '#94A3B8', fontSize: '11px' }}>
                      توثيق الدخول، تعديل المحتوى برسالة، وتقارير الزيارات الحية
                    </p>
                  </div>
                </div>

                {/* 3 Scenario Pill Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {BOT_PILLARS.map((pillar) => {
                    const active = activeBotPillar === pillar.id;
                    return (
                      <button
                        key={pillar.id}
                        type="button"
                        data-testid={`button-bot-scenario-${pillar.id}`}
                        onClick={() => setActiveBotPillar(pillar.id)}
                        style={
                          active
                            ? {
                                borderRadius: '9999px',
                                padding: '5px 12px',
                                backgroundColor: '#2563EB',
                                borderColor: '#38BDF8',
                                color: '#FFFFFF',
                                fontSize: '11px',
                              }
                            : {
                                borderRadius: '9999px',
                                padding: '5px 12px',
                                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                borderColor: 'rgba(148, 163, 184, 0.2)',
                                color: '#CBD5E1',
                                fontSize: '11px',
                              }
                        }
                        className="border font-bold transition whitespace-nowrap"
                      >
                        {pillar.title.split(' ')[0]} {pillar.title.split(' ')[1]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Scenario Simulation */}
              <div
                style={{
                  backgroundColor: 'rgba(5, 11, 26, 0.85)',
                  borderColor: 'rgba(56, 189, 248, 0.18)',
                }}
                className="mt-3.5 rounded-xl sm:rounded-2xl border p-3 sm:p-4"
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ color: '#38BDF8' }} className="font-bold">
                    {currentBot.title}
                  </span>
                  <span
                    style={{ color: '#34D399', fontSize: '10px' }}
                    className="font-mono font-bold"
                  >
                    {currentBot.badge}
                  </span>
                </div>
                <p style={{ color: '#94A3B8', fontSize: '11px' }} className="mt-1">
                  {currentBot.desc}
                </p>

                <div className="mt-2.5 flex flex-col gap-1.5 text-[11px]">
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      alignSelf: 'flex-start',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      backgroundColor: 'rgba(37, 99, 235, 0.22)',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                      color: '#FFFFFF',
                    }}
                    className="border font-bold"
                  >
                    <MessageSquare size={12} className="text-sky-400" />
                    <span>{currentBot.command}</span>
                  </div>
                  <div
                    style={{
                      borderRadius: '8px',
                      padding: '6px 10px',
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(148, 163, 184, 0.2)',
                      color: '#E2E8F0',
                    }}
                    className="border"
                  >
                    {currentBot.reply}
                  </div>
                </div>

                <BotVisualAttachment pillarId={currentBot.id} />
              </div>
            </div>

            {/* Compact FAQ Column (5 cols) */}
            <div
              id="faq"
              style={{
                backgroundImage:
                  'linear-gradient(145deg, rgba(12, 25, 58, 0.86) 0%, rgba(6, 13, 32, 0.94) 100%)',
                borderColor: 'rgba(56, 189, 248, 0.26)',
              }}
              className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border p-4 sm:p-6 lg:col-span-5"
            >
              <div>
                <span
                  style={{ color: '#38BDF8', fontSize: '11px' }}
                  className="font-extrabold"
                >
                  معلومات سريعة
                </span>
                <h3
                  style={{ color: '#FFFFFF', fontSize: '14px' }}
                  className="mt-0.5 font-extrabold"
                >
                  الأسئلة الشائعة
                </h3>

                <div className="mt-3 space-y-2">
                  {FAQ_ITEMS.map((item, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div
                        key={item.q}
                        style={{
                          backgroundColor: 'rgba(7, 14, 34, 0.82)',
                          borderColor: isOpen
                            ? 'rgba(56, 189, 248, 0.4)'
                            : 'rgba(148, 163, 184, 0.16)',
                        }}
                        className="rounded-xl border transition"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                          style={{
                            display: 'flex',
                            width: '100%',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            padding: '10px 14px',
                            color: '#FFFFFF',
                            fontSize: '12px',
                          }}
                          className="text-right font-extrabold"
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            size={14}
                            className={`shrink-0 text-sky-400 transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <p
                            style={{ color: '#94A3B8', fontSize: '11px' }}
                            className="border-t border-slate-800/80 px-3.5 py-2.5 leading-relaxed"
                          >
                            {item.a}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Quick Action inside FAQ card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginTop: '16px',
                }}
                className="border border-sky-500/25 bg-sky-950/30"
              >
                <span style={{ color: '#E2E8F0', fontSize: '11px' }} className="font-bold">
                  جاهز لتدشين منصتك الرقمية؟
                </span>
                <Link
                  href={primaryDestination}
                  data-testid="link-footer-cta"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: '9999px',
                    padding: '5px 12px',
                    backgroundImage: 'linear-gradient(90deg, #1D4ED8 0%, #0EA5E9 100%)',
                    color: '#FFFFFF',
                    fontSize: '11px',
                  }}
                  className="font-extrabold shadow whitespace-nowrap"
                >
                  <span>ابدأ مجاناً</span>
                  <ArrowLeft size={12} />
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* Minimal Dark Footer */}
        <footer className="mx-auto mt-10 sm:mt-14 max-w-6xl border-t border-slate-800/80 px-3.5 pt-6 sm:px-8">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <OrxaiMark inverted className="size-5" />
              <span style={{ color: '#FFFFFF' }} className="font-mono font-extrabold">
                ORxai
              </span>
              <span style={{ color: '#64748B' }}>
                — منظومتك الرقمية المتكاملة للمواقع والأدوات التفاعلية
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#94A3B8' }}>
              <Link href="/login" className="hover:text-white">
                دخول المنصة
              </Link>
              <Link href="/dashboard" className="hover:text-white">
                لوحة التحكم
              </Link>
              <a href="#services-suite" className="hover:text-white">
                القوالب
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
