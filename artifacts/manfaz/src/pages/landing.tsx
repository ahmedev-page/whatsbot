import { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpLeft,
  BadgeCheck,
  BarChart3,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Globe,
  ListChecks,
  Menu,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  User,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'wouter';
import { Brand } from '@/components/brand';
import {
  BotVisualAttachment,
  HeroOrbitalBackdrop,
  SectionCurveDivider,
  ServiceCardVisual,
  StudioHeroBannerArt,
} from '@/components/landing-visuals';
import { useAccount, type SiteStyle } from '@/lib/account';
import {
  BOT_PILLARS,
  EXECUTIVE_THEMES,
  PLATFORM_SERVICES,
  STUDIO_PRESETS,
  STYLE_MODES,
  filterServicesByCategory,
  resolveStudioPreviewState,
  type ServiceCategory,
  type ServiceVisualKind,
} from '@/lib/landing-data';

const SERVICE_ICONS: Record<ServiceVisualKind, LucideIcon> = {
  website: Globe,
  store: ShoppingBag,
  menu: UtensilsCrossed,
  booking: CalendarCheck,
  profile: User,
  services_pkg: Briefcase,
  loyalty: BadgeCheck,
  reviews: Star,
  survey: ClipboardList,
  quiz: ListChecks,
  poll: BarChart3,
  invite: CalendarDays,
};

const PRESET_ICONS: Record<string, LucideIcon> = {
  store: Store,
  restaurant: UtensilsCrossed,
  booking: CalendarCheck,
  services: Briefcase,
};

const FAQ_LIST = [
  {
    q: 'أين يتم بناء المواقع والخدمات الـ 12؟',
    a: 'يتم بناء وتصميم وتخصيص جميع المواقع والخدمات الـ 12 بالكامل من داخل استوديو المنصة الرسمي عبر المتصفح بأدوات مرئية متكاملة.',
  },
  {
    q: 'ما هو دور بوت الواتساب في المنظومة؟',
    a: 'يعمل البوت كمساعد تنفيذي سريع لثلاث مهام محددة فقط: التحقق الأمني عند الدخول (OTP)، التعديلات النصية السريعة على الأسعار والعناوين، وإرسال تقارير الزوار والمبيعات.',
  },
  {
    q: 'هل يمكن الدخول بدون التحقق عبر البوت؟',
    a: 'لا، حفاظاً على أمان منشأتك يُشترط تأكيد ملكية رقم الجوال عبر إرسال كود التحقق لبوت واتساب قبل فتح لوحة التحكم.',
  },
];

const SMOOTH_SPRING = {
  type: 'spring' as const,
  stiffness: 360,
  damping: 30,
};

export default function Landing() {
  const account = useAccount();
  const isSignedIn = Boolean(account.data);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Studio State
  const [presetKey, setPresetKey] = useState<string>('store');
  const [styleMode, setStyleMode] = useState<SiteStyle>('cinematic');
  const [accentHex, setAccentHex] = useState<string>('#2563EB');
  const [customTitle, setCustomTitle] = useState<string>('');

  // Services Filter State
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory>('all');

  // Bot Pillar State
  const [activeBotId, setActiveBotId] = useState<'auth' | 'edit' | 'analytics'>('auth');

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const studioState = resolveStudioPreviewState(presetKey, customTitle, accentHex, styleMode);
  const activePreset = studioState.preset;
  const activeTheme = studioState.theme;
  const displayTitle = studioState.displayTitle;

  const visibleServices = filterServicesByCategory(categoryFilter);
  const activeBot = BOT_PILLARS.find((b) => b.id === activeBotId) || BOT_PILLARS[0];

  return (
    <div
      style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}
      className="min-h-screen overflow-x-hidden bg-[#F8FAFC] font-sans text-[#0F172A] antialiased selection:bg-blue-600 selection:text-white"
    >
      {/* =====================================================================
          STICKY FROSTED EXECUTIVE HEADER
          ===================================================================== */}
      <header
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          borderBottomColor: '#E2E8F0',
          color: '#0F172A',
        }}
        className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-all duration-300"
      >
        <div className="mx-auto flex h-20 max-w-[1380px] items-center justify-between gap-4 px-5 sm:gap-8 sm:px-10">
          {/* Zone 1: Brand */}
          <Brand href="/" />

          {/* Zone 2: 4 Navigation Links */}
          <nav
            aria-label="التنقل الرئيسي"
            style={{ color: '#334155' }}
            className="hidden md:flex items-center gap-9 text-base font-bold text-slate-700"
          >
            <a
              href="#interactive-studio"
              style={{ color: '#334155' }}
              className="relative py-1 whitespace-nowrap shrink-0 transition-colors duration-200 hover:text-blue-600"
            >
              استوديو المنصة
            </a>
            <a
              href="#services-suite"
              style={{ color: '#334155' }}
              className="relative py-1 whitespace-nowrap shrink-0 transition-colors duration-200 hover:text-blue-600"
            >
              الخدمات الـ 12
            </a>
            <a
              href="#whatsapp-assistant"
              style={{ color: '#334155' }}
              className="relative py-1 whitespace-nowrap shrink-0 transition-colors duration-200 hover:text-blue-600"
            >
              المساعد الذكي
            </a>
            <a
              href="#faq"
              style={{ color: '#334155' }}
              className="relative py-1 whitespace-nowrap shrink-0 transition-colors duration-200 hover:text-blue-600"
            >
              الأسئلة الشائعة
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center gap-2.5 shrink-0 sm:gap-3">
            <Link
              href={isSignedIn ? '/dashboard' : '/login'}
              style={{
                background: 'linear-gradient(135deg, #0B132B 0%, #1D4ED8 100%)',
                backgroundColor: '#0B132B',
                color: '#FFFFFF',
                borderColor: '#1E40AF',
              }}
              className="site-btn-shine inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold text-white shadow-md whitespace-nowrap shrink-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:h-12 sm:px-6 sm:text-sm"
              data-testid="link-header-primary-cta"
            >
              <span style={{ color: '#FFFFFF' }}>
                {isSignedIn ? 'لوحة التحكم' : 'دخول المنصة'}
              </span>
              <ArrowUpLeft size={16} style={{ color: '#38BDF8' }} />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              style={{
                backgroundColor: '#F1F5F9',
                borderColor: '#CBD5E1',
                color: '#0F172A',
              }}
              className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 text-slate-900 transition-colors hover:bg-slate-200 md:hidden"
              aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Animated Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                backgroundColor: '#FFFFFF',
                borderTopColor: '#E2E8F0',
                color: '#0F172A',
              }}
              className="overflow-hidden border-t border-slate-200 bg-white px-6 py-4 md:hidden"
            >
              <nav className="flex flex-col space-y-1.5 text-base font-bold text-slate-800">
                <a
                  href="#interactive-studio"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ color: '#0F172A' }}
                  className="rounded-xl px-4 py-3 transition-colors hover:bg-slate-100"
                >
                  استوديو المنصة
                </a>
                <a
                  href="#services-suite"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ color: '#0F172A' }}
                  className="rounded-xl px-4 py-3 transition-colors hover:bg-slate-100"
                >
                  الخدمات الـ 12
                </a>
                <a
                  href="#whatsapp-assistant"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ color: '#0F172A' }}
                  className="rounded-xl px-4 py-3 transition-colors hover:bg-slate-100"
                >
                  المساعد الذكي
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ color: '#0F172A' }}
                  className="rounded-xl px-4 py-3 transition-colors hover:bg-slate-100"
                >
                  الأسئلة الشائعة
                </a>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* =====================================================================
            HERO SECTION: Royal Midnight Sapphire & Sculpted 3D Showcase
            ===================================================================== */}
        <section
          data-testid="landing-hero"
          style={{
            background: 'linear-gradient(180deg, #060B18 0%, #0B132B 55%, #0F172A 100%)',
            backgroundColor: '#060B18',
            color: '#FFFFFF',
          }}
          className="relative overflow-hidden bg-[#060B18] text-white"
        >
          <HeroOrbitalBackdrop />

          <div className="relative mx-auto max-w-[1380px] px-5 pt-12 pb-16 sm:px-10 lg:pt-20 lg:pb-24">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
              {/* Right Column: Monumental Executive Statement (7 Cols) */}
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col justify-between lg:col-span-7"
              >
                <div>
                  <div
                    style={{ color: '#7DD3FC' }}
                    className="inline-flex items-center gap-3 text-xs font-bold tracking-wide sm:text-sm"
                  >
                    <span style={{ color: '#38BDF8' }} className="font-mono tabular-nums">
                      01
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>/</span>
                    <span style={{ color: '#BAE6FD' }}>
                      المنظومة السحابية المتكاملة لبناء المواقع والأعمال
                    </span>
                  </div>

                  <h1
                    style={{ color: '#FFFFFF' }}
                    className="mt-5 font-serif text-[clamp(2.05rem,4.2vw,4rem)] font-extrabold leading-[1.45] tracking-tight text-white sm:leading-[1.36]"
                  >
                    <span style={{ color: '#FFFFFF' }}>بوابتك الرقمية المتكاملة.</span>
                    <span
                      style={{ color: '#38BDF8' }}
                      className="mt-2 block py-1"
                    >
                      تُبنى في المنصة. وتُدار بذكاء.
                    </span>
                  </h1>

                  <p
                    style={{ color: '#CBD5E1' }}
                    className="mt-6 max-w-2xl text-lg leading-[1.85] text-slate-300 sm:text-xl"
                  >
                    صمّم وأطلق متجرك، موقعك الرسمي، وخدماتك الـ 12 مباشرة من استوديو المنصة،
                    مع مساعد واتساب الموثق للتحقق الأمني والتعديلات السريعة.
                  </p>
                </div>

                <div className="mt-10">
                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      href={isSignedIn ? '/dashboard' : '/login'}
                      style={{
                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        borderColor: 'rgba(147, 197, 253, 0.35)',
                      }}
                      className="site-btn-shine inline-flex h-14 items-center justify-center gap-3 rounded-2xl border px-8 text-base font-extrabold text-white shadow-xl whitespace-nowrap shrink-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                      data-testid="button-hero-start"
                    >
                      <span style={{ color: '#FFFFFF' }}>
                        {isSignedIn ? 'الدخول إلى لوحة التحكم' : 'ابدأ تأسيس منصتك الآن'}
                      </span>
                      <ArrowLeft size={18} style={{ color: '#BAE6FD' }} />
                    </Link>

                    <a
                      href="#interactive-studio"
                      style={{
                        backgroundColor: '#131F3A',
                        borderColor: '#334155',
                        color: '#FFFFFF',
                      }}
                      className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border px-7 text-base font-bold text-white whitespace-nowrap shrink-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400"
                      data-testid="link-hero-workbench"
                    >
                      <span style={{ color: '#FFFFFF' }}>تجربة الاستوديو التفاعلي</span>
                    </a>
                  </div>

                  {/* Clean unboxed trust strip */}
                  <div
                    style={{
                      borderTopColor: 'rgba(148, 163, 184, 0.2)',
                      color: '#CBD5E1',
                    }}
                    className="mt-10 flex flex-wrap items-center gap-y-2 border-t pt-6 text-sm font-semibold"
                  >
                    <span style={{ color: '#E2E8F0' }}>إنشاء متكامل داخل المنصة</span>
                    <span className="mx-3" style={{ color: '#38BDF8' }}>
                      ·
                    </span>
                    <span style={{ color: '#E2E8F0' }}>توثيق أمني إلزامي عبر البوت</span>
                    <span className="mx-3" style={{ color: '#34D399' }}>
                      ·
                    </span>
                    <span style={{ color: '#E2E8F0' }}>12 خدمة سحابية جاهزة</span>
                  </div>
                </div>
              </motion.div>

              {/* Left Column: Sculpted Multi-Layered Live Platform Window (5 Cols) */}
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex flex-col lg:col-span-5"
              >
                {/* Outer luminous glass frame */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, #0F172A 0%, #0B132B 100%)',
                    backgroundColor: '#0B132B',
                    borderColor: '#1E293B',
                    color: '#FFFFFF',
                  }}
                  className="relative overflow-hidden rounded-3xl border p-6 shadow-2xl sm:p-7"
                >
                  {/* Top Window Chrome */}
                  <div
                    style={{ borderBottomColor: '#1E293B' }}
                    className="flex items-center justify-between border-b pb-4"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: '#FB7185' }}
                      />
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: '#38BDF8' }}
                      />
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: '#34D399' }}
                      />
                      <span
                        dir="ltr"
                        style={{ color: '#94A3B8' }}
                        className="mr-2 font-mono text-xs font-semibold"
                      >
                        studio.orxai.app/{presetKey}
                      </span>
                    </div>
                    <span
                      style={{ color: '#34D399' }}
                      className="font-mono text-xs font-bold"
                    >
                      {activePreset.growthDelta}
                    </span>
                  </div>

                  {/* Interactive 4-Sector Switcher with Sliding Spring Pill */}
                  <LayoutGroup id="hero-sector-tabs">
                    <div
                      style={{
                        backgroundColor: '#060B18',
                        borderColor: '#1E293B',
                      }}
                      className="my-5 grid grid-cols-2 gap-2 rounded-2xl border p-1.5"
                    >
                      {Object.values(STUDIO_PRESETS).map((preset) => {
                        const Icon = PRESET_ICONS[preset.id] || Store;
                        const isSelected = presetKey === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setPresetKey(preset.id)}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: '#2563EB',
                                    color: '#FFFFFF',
                                  }
                                : {
                                    backgroundColor: 'transparent',
                                    color: '#CBD5E1',
                                  }
                            }
                            className="relative z-10 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-right text-xs font-bold whitespace-nowrap transition-colors duration-200 sm:text-sm"
                          >
                            {isSelected && (
                              <motion.span
                                layoutId="hero-preset-active-bg"
                                transition={SMOOTH_SPRING}
                                style={{
                                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                  backgroundColor: '#2563EB',
                                }}
                                className="absolute inset-0 -z-10 rounded-xl shadow-md"
                              />
                            )}
                            <Icon
                              size={16}
                              style={{ color: isSelected ? '#FFFFFF' : '#38BDF8' }}
                              className="shrink-0"
                            />
                            <span style={{ color: isSelected ? '#FFFFFF' : '#CBD5E1' }}>
                              {preset.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </LayoutGroup>

                  {/* Animated Morphing Stage Content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activePreset.id}
                      initial={{ opacity: 0, y: 12, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.985 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {/* Visual SVG Banner Header */}
                      <div
                        style={{
                          backgroundColor: '#060B18',
                          borderColor: '#1E293B',
                        }}
                        className="relative h-28 overflow-hidden rounded-2xl border"
                      >
                        <StudioHeroBannerArt
                          presetId={activePreset.id}
                          primaryHex="#38BDF8"
                          secondaryHex="#6366F1"
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-5">
                          <div>
                            <p
                              style={{ color: '#7DD3FC' }}
                              className="text-xs font-bold"
                            >
                              {activePreset.badge}
                            </p>
                            <h2
                              style={{ color: '#FFFFFF' }}
                              className="mt-1 font-serif text-lg font-extrabold sm:text-xl"
                            >
                              {activePreset.defaultTitle}
                            </h2>
                          </div>
                          <div className="text-left">
                            <span
                              style={{ color: '#38BDF8' }}
                              className="block font-mono text-2xl font-extrabold tabular-nums"
                            >
                              {activePreset.kpiValue}
                            </span>
                            <span
                              style={{ color: '#CBD5E1' }}
                              className="text-[11px] font-semibold"
                            >
                              {activePreset.kpiLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Featured Items List */}
                      <div className="mt-4 space-y-2.5">
                        {activePreset.items.slice(0, 2).map((item, idx) => (
                          <div
                            key={item.name}
                            style={{
                              backgroundColor: '#111C35',
                              borderColor: '#1E293B',
                              color: '#FFFFFF',
                            }}
                            className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 transition-colors hover:border-sky-400/40"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                style={{
                                  backgroundColor: 'rgba(14, 165, 233, 0.2)',
                                  color: '#7DD3FC',
                                }}
                                className="grid size-8 shrink-0 place-items-center rounded-lg font-mono text-xs font-extrabold tabular-nums"
                              >
                                0{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p
                                  style={{ color: '#FFFFFF' }}
                                  className="truncate text-sm font-bold sm:text-base"
                                >
                                  {item.name}
                                </p>
                                <p
                                  style={{ color: '#94A3B8' }}
                                  className="mt-0.5 truncate text-xs"
                                >
                                  {item.meta}
                                </p>
                              </div>
                            </div>
                            <span
                              style={{ color: '#38BDF8' }}
                              className="shrink-0 font-mono text-sm font-extrabold tabular-nums sm:text-base"
                            >
                              {item.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Bottom Bar with Live Sparkline */}
                  <div
                    style={{ borderTopColor: '#1E293B' }}
                    className="mt-5 flex items-center justify-between border-t pt-4 text-xs sm:text-sm"
                  >
                    <div className="flex items-end gap-1 h-5" aria-hidden>
                      {activePreset.sparkline.map((val, i) => (
                        <span
                          key={i}
                          className="w-1.5 rounded-t-xs transition-all duration-300"
                          style={{
                            height: `${Math.round((val / 100) * 20)}px`,
                            backgroundColor: '#38BDF8',
                          }}
                        />
                      ))}
                      <span
                        style={{ color: '#CBD5E1' }}
                        className="mr-2 font-semibold"
                      >
                        مزامنة حية مع البوت
                      </span>
                    </div>
                    <Link
                      href={`/dashboard?create=1&template=${presetKey}`}
                      style={{ color: '#38BDF8' }}
                      className="font-bold whitespace-nowrap shrink-0 transition-colors hover:text-sky-300"
                    >
                      اعتماد القالب ←
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Executive Architectural Metrics Strip */}
            <div
              style={{
                backgroundColor: '#0B132B',
                borderColor: '#1E293B',
                color: '#FFFFFF',
              }}
              className="mt-16 grid grid-cols-2 gap-4 rounded-3xl border p-6 sm:grid-cols-4 sm:gap-6 sm:p-8"
            >
              {[
                { num: '12', label: 'خدمة رقمية متكاملة داخل المنصة', hex: '#38BDF8' },
                { num: '100%', label: 'توثيق أمني معتمد عبر بوت واتساب', hex: '#34D399' },
                { num: '60s', label: 'سرعة إطلاق الموقع الرسمي', hex: '#38BDF8' },
                { num: '24/7', label: 'تعديلات نصية وإحصائيات فورية', hex: '#34D399' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{ borderRightColor: '#1E293B' }}
                  className="border-r pr-4 first:border-r-0 first:pr-0"
                >
                  <span
                    dir="ltr"
                    style={{ color: stat.hex }}
                    className="block font-mono text-3xl font-extrabold tabular-nums sm:text-4xl"
                  >
                    {stat.num}
                  </span>
                  <span
                    style={{ color: '#CBD5E1' }}
                    className="mt-1.5 block text-sm font-semibold sm:text-base"
                  >
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sculpted Wave Transition from Hero (#0F172A) to Studio (#EEF2F6) */}
          <SectionCurveDivider fromColor="#0F172A" toColor="#EEF2F6" />
        </section>

        {/* =====================================================================
            SECTION 2: EXECUTIVE INTERACTIVE STUDIO (#interactive-studio)
            ===================================================================== */}
        <section
          id="interactive-studio"
          data-testid="interactive-studio"
          style={{ backgroundColor: '#EEF2F6', color: '#0F172A' }}
          className="scroll-mt-20 bg-[#EEF2F6] py-20 lg:py-28"
        >
          <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              style={{ borderBottomColor: '#CBD5E1' }}
              className="flex flex-col justify-between gap-6 border-b pb-10 lg:flex-row lg:items-end"
            >
              <div>
                <p style={{ color: '#1D4ED8' }} className="text-sm font-bold">
                  02 / استوديو التصميم المعماري الحي
                </p>
                <h2
                  style={{ color: '#0F172A' }}
                  className="mt-2.5 font-serif text-[clamp(1.9rem,3.2vw,2.85rem)] font-extrabold leading-[1.35]"
                >
                  صمّم واجهة منشأتك وعاينها لحظياً
                </h2>
              </div>
              <p
                style={{ color: '#475569' }}
                className="max-w-md text-base leading-relaxed sm:text-lg"
              >
                اختر قطاع أعمالك، حدد الهوية اللونية والطابع البصري، وشاهد التحول الفوري
                لموقعك قبل اعتماده.
              </p>
            </motion.div>

            <div className="mt-12 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
              {/* Right Configurator Card (5 Columns) */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#CBD5E1',
                  color: '#0F172A',
                }}
                className="flex flex-col justify-between rounded-3xl border p-7 shadow-xl sm:p-9 lg:col-span-5"
              >
                <div className="space-y-7">
                  {/* 1. Sector Switcher */}
                  <div>
                    <label
                      style={{ color: '#0F172A' }}
                      className="block text-sm font-extrabold sm:text-base"
                    >
                      1. قطاع النشاط
                    </label>
                    <LayoutGroup id="studio-sector-tabs">
                      <div className="mt-3 grid grid-cols-2 gap-2.5">
                        {Object.values(STUDIO_PRESETS).map((tpl) => {
                          const Icon = PRESET_ICONS[tpl.id] || Store;
                          const active = presetKey === tpl.id;
                          return (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() => setPresetKey(tpl.id)}
                              style={
                                active
                                  ? {
                                      backgroundColor: '#0B132B',
                                      borderColor: '#1D4ED8',
                                      color: '#FFFFFF',
                                    }
                                  : {
                                      backgroundColor: '#F1F5F9',
                                      borderColor: '#CBD5E1',
                                      color: '#0F172A',
                                    }
                              }
                              className="relative z-10 flex items-center gap-2.5 rounded-xl border px-4 py-3.5 text-right text-sm font-bold whitespace-nowrap transition-colors duration-200"
                              data-testid={`button-wb-template-${tpl.id}`}
                            >
                              {active && (
                                <motion.span
                                  layoutId="studio-sector-pill"
                                  transition={SMOOTH_SPRING}
                                  style={{
                                    background: 'linear-gradient(135deg, #0B132B 0%, #1D4ED8 100%)',
                                    backgroundColor: '#0B132B',
                                  }}
                                  className="absolute inset-0 -z-10 rounded-xl shadow-md"
                                />
                              )}
                              <Icon
                                size={17}
                                style={{ color: active ? '#38BDF8' : '#2563EB' }}
                                className="shrink-0"
                              />
                              <span style={{ color: active ? '#FFFFFF' : '#0F172A' }}>
                                {tpl.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </LayoutGroup>
                  </div>

                  {/* 2. Brand Name Input */}
                  <div>
                    <label
                      htmlFor="wb-title-input"
                      style={{ color: '#0F172A' }}
                      className="block text-sm font-extrabold sm:text-base"
                    >
                      2. اسم المنشأة أو العلامة التجارية
                    </label>
                    <input
                      id="wb-title-input"
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder={activePreset.defaultTitle}
                      style={{
                        backgroundColor: '#F1F5F9',
                        borderColor: '#CBD5E1',
                        color: '#0F172A',
                      }}
                      className="mt-2.5 h-13 w-full rounded-xl border px-4 text-base font-bold outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
                      data-testid="input-wb-title"
                    />
                  </div>

                  {/* 3. Architectural Style */}
                  <div>
                    <label
                      style={{ color: '#0F172A' }}
                      className="block text-sm font-extrabold sm:text-base"
                    >
                      3. الطابع البصري
                    </label>
                    <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                      {STYLE_MODES.map((st) => {
                        const active = styleMode === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setStyleMode(st.id)}
                            style={
                              active
                                ? {
                                    backgroundColor: '#0B132B',
                                    borderColor: '#1D4ED8',
                                    color: '#FFFFFF',
                                  }
                                : {
                                    backgroundColor: '#F1F5F9',
                                    borderColor: '#CBD5E1',
                                    color: '#0F172A',
                                  }
                            }
                            className="rounded-xl border px-4 py-3 text-right transition-all duration-200"
                            data-testid={`button-wb-style-${st.id}`}
                          >
                            <span
                              style={{ color: active ? '#FFFFFF' : '#0F172A' }}
                              className="block text-sm font-extrabold"
                            >
                              {st.name}
                            </span>
                            <span
                              style={{ color: active ? '#7DD3FC' : '#475569' }}
                              className="mt-0.5 block text-[11px] font-medium"
                            >
                              {st.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Sovereign Color Theme */}
                  <div>
                    <label
                      style={{ color: '#0F172A' }}
                      className="block text-sm font-extrabold sm:text-base"
                    >
                      4. الهوية اللونية
                    </label>
                    <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                      {EXECUTIVE_THEMES.map((sw) => {
                        const active = accentHex === sw.hex;
                        return (
                          <button
                            key={sw.hex}
                            type="button"
                            onClick={() => setAccentHex(sw.hex)}
                            style={
                              active
                                ? {
                                    backgroundColor: '#0B132B',
                                    borderColor: '#1D4ED8',
                                    color: '#FFFFFF',
                                  }
                                : {
                                    backgroundColor: '#F1F5F9',
                                    borderColor: '#CBD5E1',
                                    color: '#0F172A',
                                  }
                            }
                            className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition-all duration-200"
                          >
                            <span
                              className="size-5 shrink-0 rounded-full border border-white/40 shadow-xs"
                              style={{
                                background: `linear-gradient(135deg, ${sw.hex}, ${sw.secondaryHex})`,
                                backgroundColor: sw.hex,
                              }}
                            />
                            <span style={{ color: active ? '#FFFFFF' : '#0F172A' }}>
                              {sw.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div
                  style={{ borderTopColor: '#E2E8F0' }}
                  className="mt-8 border-t pt-6"
                >
                  <Link
                    href={`/dashboard?create=1&template=${presetKey}`}
                    style={{
                      background: 'linear-gradient(135deg, #0B132B 0%, #1D4ED8 100%)',
                      backgroundColor: '#0B132B',
                      color: '#FFFFFF',
                    }}
                    className="site-btn-shine inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl px-6 text-base font-extrabold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                    data-testid="link-wb-launch"
                  >
                    <span style={{ color: '#FFFFFF' }}>
                      اعتماد التصميم وفتحه في الاستوديو
                    </span>
                    <ArrowLeft size={18} style={{ color: '#38BDF8' }} />
                  </Link>
                </div>
              </div>

              {/* Left Live Preview Stage (7 Columns) */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#CBD5E1',
                }}
                className="flex flex-col overflow-hidden rounded-3xl border shadow-xl lg:col-span-7"
              >
                {/* High-Contrast Executive Browser Frame Header */}
                <div
                  style={{
                    backgroundColor: '#0B132B',
                    borderBottomColor: '#1E293B',
                    color: '#FFFFFF',
                  }}
                  className="flex items-center justify-between border-b px-6 py-4 text-white"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: '#FB7185' }}
                    />
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: '#38BDF8' }}
                    />
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: '#34D399' }}
                    />
                    <span
                      dir="ltr"
                      style={{
                        backgroundColor: '#1E293B',
                        borderColor: '#334155',
                        color: '#BAE6FD',
                      }}
                      className="mr-2 rounded-lg border px-3 py-1 font-mono text-xs font-bold"
                    >
                      https://orxai.app/s/{presetKey}
                    </span>
                  </div>
                  <span
                    style={{ color: '#38BDF8' }}
                    className="text-xs font-extrabold sm:text-sm"
                  >
                    معاينة تفاعلية فورية
                  </span>
                </div>

                {/* Animated Live Canvas */}
                <div
                  style={
                    studioState.isDarkCanvas
                      ? {
                          background: 'linear-gradient(135deg, #070C1B 0%, #0F172A 60%, #1E293B 100%)',
                          backgroundColor: '#0F172A',
                          color: '#FFFFFF',
                        }
                      : styleMode === 'classic'
                        ? {
                            backgroundColor: '#E2E8F0',
                            color: '#0F172A',
                          }
                        : {
                            backgroundColor: '#F1F5F9',
                            color: '#0F172A',
                          }
                  }
                  className="relative flex flex-1 flex-col justify-between p-7 transition-colors duration-500 sm:p-10"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${presetKey}-${styleMode}-${accentHex}`}
                      initial={{ opacity: 0, y: 14, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.99 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="space-y-6"
                    >
                      {/* High-Contrast Executive Hero Banner inside Preview */}
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #0B132B 0%, #0F172A 60%, #1E293B 100%)',
                          backgroundColor: '#0B132B',
                          borderColor: '#1E293B',
                          color: '#FFFFFF',
                        }}
                        className="relative overflow-hidden rounded-2xl border p-6 text-white shadow-lg sm:p-7"
                      >
                        <div className="pointer-events-none absolute inset-0 opacity-75">
                          <StudioHeroBannerArt
                            presetId={activePreset.id}
                            primaryHex={activeTheme.hex}
                            secondaryHex={activeTheme.secondaryHex}
                          />
                        </div>

                        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                          <div>
                            <span
                              style={{ color: '#7DD3FC' }}
                              className="text-xs font-extrabold tracking-wide uppercase sm:text-sm"
                            >
                              {activePreset.badge} · {activePreset.kpiLabel}{' '}
                              <span
                                style={{ color: '#34D399' }}
                                className="font-mono"
                              >
                                {activePreset.kpiValue}
                              </span>
                            </span>
                            <h3
                              style={{ color: '#FFFFFF' }}
                              className="mt-2 font-serif text-2xl font-extrabold sm:text-3xl"
                            >
                              {displayTitle}
                            </h3>
                            <p
                              style={{ color: '#CBD5E1' }}
                              className="mt-1.5 text-sm sm:text-base"
                            >
                              {activePreset.subtitle}
                            </p>
                          </div>

                          <span
                            style={{
                              background: `linear-gradient(135deg, ${activeTheme.hex}, ${activeTheme.secondaryHex})`,
                              backgroundColor: activeTheme.hex,
                              color: '#FFFFFF',
                            }}
                            className="inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-extrabold text-white shadow-md whitespace-nowrap shrink-0"
                          >
                            {activePreset.cta}
                          </span>
                        </div>
                      </div>

                      {/* 3 Visual Items Grid/List */}
                      <div
                        className={
                          styleMode === 'app'
                            ? 'grid grid-cols-1 gap-3 sm:grid-cols-3'
                            : 'space-y-3.5'
                        }
                      >
                        {activePreset.items.map((item, idx) => (
                          <div
                            key={item.name}
                            style={
                              studioState.isDarkCanvas
                                ? {
                                    backgroundColor: '#111C35',
                                    borderColor: '#1E293B',
                                    color: '#FFFFFF',
                                  }
                                : {
                                    backgroundColor: '#FFFFFF',
                                    borderColor: '#CBD5E1',
                                    color: '#0F172A',
                                  }
                            }
                            className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all duration-300 sm:p-5 ${
                              styleMode === 'app' ? 'flex-col items-start' : ''
                            }`}
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <span
                                style={{
                                  background: `linear-gradient(135deg, ${activeTheme.hex}, ${activeTheme.secondaryHex})`,
                                  backgroundColor: activeTheme.hex,
                                  color: '#FFFFFF',
                                }}
                                className="grid size-10 shrink-0 place-items-center rounded-xl font-mono text-sm font-extrabold text-white shadow-xs tabular-nums"
                              >
                                0{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p
                                    style={{
                                      color: studioState.isDarkCanvas ? '#FFFFFF' : '#0F172A',
                                    }}
                                    className="truncate text-base font-extrabold sm:text-lg"
                                  >
                                    {item.name}
                                  </p>
                                  <span
                                    style={{
                                      color: studioState.isDarkCanvas ? '#7DD3FC' : '#1D4ED8',
                                    }}
                                    className="hidden text-xs font-bold sm:inline"
                                  >
                                    · {item.tag}
                                  </span>
                                </div>
                                <p
                                  style={{
                                    color: studioState.isDarkCanvas ? '#94A3B8' : '#475569',
                                  }}
                                  className="mt-0.5 truncate text-xs sm:text-sm"
                                >
                                  {item.meta}
                                </p>
                              </div>
                            </div>

                            <span
                              style={{
                                color: studioState.isDarkCanvas ? '#38BDF8' : activeTheme.hex,
                              }}
                              className="shrink-0 font-mono text-base font-extrabold tabular-nums sm:text-lg"
                            >
                              {item.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Preview Footer Bar */}
                  <div
                    style={{
                      borderTopColor: studioState.isDarkCanvas ? '#1E293B' : '#CBD5E1',
                      color: studioState.isDarkCanvas ? '#94A3B8' : '#475569',
                    }}
                    className="mt-8 flex items-center justify-between border-t pt-5 text-xs font-bold sm:text-sm"
                  >
                    <span>الطابع النشط: {STYLE_MODES.find((m) => m.id === styleMode)?.name}</span>
                    <span>استجابة فورية على الجوال وسطح المكتب</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sculpted Wave Divider from Studio (#EEF2F6) to Services (#FFFFFF) */}
        <SectionCurveDivider fromColor="#EEF2F6" toColor="#FFFFFF" />

        {/* =====================================================================
            SECTION 3: THE 12 SERVICES BENTO SUITE (#services-suite)
            ===================================================================== */}
        <section
          id="services-suite"
          data-testid="services-suite"
          style={{
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E2E8F0',
            color: '#0F172A',
          }}
          className="scroll-mt-20 border-t bg-white py-20 lg:py-28"
        >
          <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
            <div className="flex flex-col justify-between gap-8 pb-12 lg:flex-row lg:items-end">
              <div>
                <p style={{ color: '#1D4ED8' }} className="text-sm font-bold">
                  03 / منظومة الخدمات السحابية المتكاملة
                </p>
                <h2
                  style={{ color: '#0F172A' }}
                  className="mt-2.5 font-serif text-[clamp(1.9rem,3.2vw,2.85rem)] font-extrabold leading-[1.35]"
                >
                  12 خدمة رقمية متكاملة بأشكال وتجارب مخصصة
                </h2>
              </div>

              {/* Animated Segmented Category Filter */}
              <LayoutGroup id="services-filter-tabs">
                <div
                  role="tablist"
                  aria-label="تصفية الخدمات"
                  style={{
                    backgroundColor: '#F1F5F9',
                    borderColor: '#CBD5E1',
                  }}
                  className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border p-1.5 shrink-0"
                >
                  {[
                    { id: 'all' as const, label: 'جميع الخدمات · 12' },
                    { id: 'presence' as const, label: 'الواجهات · 03' },
                    { id: 'commerce' as const, label: 'التجارة · 05' },
                    { id: 'engagement' as const, label: 'التفاعل · 04' },
                  ].map((tab) => {
                    const active = categoryFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={active}
                        type="button"
                        onClick={() => setCategoryFilter(tab.id)}
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
                        className="relative z-10 rounded-xl px-5 py-2.5 text-sm font-bold whitespace-nowrap shrink-0 tabular-nums transition-colors duration-200"
                        data-testid={`button-filter-services-${tab.id}`}
                      >
                        {active && (
                          <motion.span
                            layoutId="service-filter-active-pill"
                            transition={SMOOTH_SPRING}
                            style={{
                              background: 'linear-gradient(135deg, #0B132B 0%, #1D4ED8 100%)',
                              backgroundColor: '#0B132B',
                            }}
                            className="absolute inset-0 -z-10 rounded-xl shadow-sm"
                          />
                        )}
                        <span style={{ color: active ? '#FFFFFF' : '#334155' }}>
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>
            </div>

            {/* Animated 12-Service Bento Grid with Custom SVG Visual Schematics */}
            <motion.div
              layout
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {visibleServices.map((service) => {
                  const Icon = SERVICE_ICONS[service.id] || Globe;
                  return (
                    <motion.article
                      layout
                      key={service.id}
                      initial={{ opacity: 0, y: 18, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderColor: '#CBD5E1',
                        color: '#0F172A',
                      }}
                      className="group flex flex-col justify-between rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500 hover:bg-white hover:shadow-xl sm:p-7"
                      data-testid={`card-service-${service.id}`}
                    >
                      <div>
                        {/* Top Visual Shape / Mini-UI Illustration */}
                        <ServiceCardVisual
                          kind={service.id}
                          accentFrom={service.accentFrom}
                          accentTo={service.accentTo}
                        />

                        {/* Index + Category + High-Contrast Solid Icon */}
                        <div className="mt-5 flex items-center justify-between">
                          <div
                            style={{ color: '#475569' }}
                            className="flex items-center gap-2 text-xs font-extrabold sm:text-sm"
                          >
                            <span
                              style={{
                                backgroundColor: '#EFF6FF',
                                borderColor: '#BFDBFE',
                                color: '#1D4ED8',
                              }}
                              className="rounded-md border px-2.5 py-0.5 font-mono text-xs font-extrabold tabular-nums"
                            >
                              {service.index}
                            </span>
                            <span style={{ color: '#94A3B8' }}>/</span>
                            <span style={{ color: '#475569' }}>{service.categoryLabel}</span>
                          </div>

                          <span
                            style={{
                              background: `linear-gradient(135deg, ${service.accentFrom}, ${service.accentTo})`,
                              backgroundColor: service.accentFrom,
                              color: '#FFFFFF',
                            }}
                            className="grid size-11 place-items-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110"
                          >
                            <Icon size={20} style={{ color: '#FFFFFF' }} />
                          </span>
                        </div>

                        <h3
                          style={{ color: '#0F172A' }}
                          className="mt-4 font-serif text-xl font-extrabold sm:text-2xl"
                        >
                          {service.title}
                        </h3>
                        <p
                          style={{ color: '#475569' }}
                          className="mt-2 text-sm leading-relaxed sm:text-base"
                        >
                          {service.summary}
                        </p>
                      </div>

                      <div
                        style={{ borderTopColor: '#E2E8F0' }}
                        className="mt-6 border-t pt-4"
                      >
                        <Link
                          href={`/dashboard?create=1&template=${service.templateId}`}
                          style={{ color: '#1D4ED8' }}
                          className="inline-flex items-center gap-2 text-sm font-extrabold transition-colors group-hover:text-blue-700"
                        >
                          <span>تفعيل وتخصيص الخدمة</span>
                          <ArrowLeft
                            size={16}
                            className="transition-transform duration-200 group-hover:-translate-x-1"
                          />
                        </Link>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        {/* Sculpted Wave Divider from Services (#FFFFFF) to WhatsApp Assistant (#070C1B) */}
        <SectionCurveDivider fromColor="#FFFFFF" toColor="#070C1B" flip />

        {/* =====================================================================
            SECTION 4: WHATSAPP EXECUTIVE COMPANION (#whatsapp-assistant)
            ===================================================================== */}
        <section
          id="whatsapp-assistant"
          data-testid="whatsapp-assistant-section"
          style={{
            backgroundColor: '#070C1B',
            color: '#FFFFFF',
          }}
          className="relative scroll-mt-20 overflow-hidden bg-[#070C1B] py-20 text-white lg:py-28"
        >
          <HeroOrbitalBackdrop />

          <div className="relative mx-auto max-w-[1380px] px-6 sm:px-10">
            <div
              style={{ borderBottomColor: '#1E293B' }}
              className="flex flex-col justify-between gap-6 border-b pb-12 lg:flex-row lg:items-end"
            >
              <div>
                <p style={{ color: '#38BDF8' }} className="text-sm font-bold">
                  04 / المساعد التنفيذي الموثق عبر واتساب
                </p>
                <h2
                  style={{ color: '#FFFFFF' }}
                  className="mt-3 font-serif text-[clamp(1.9rem,3.2vw,2.85rem)] font-extrabold leading-[1.35]"
                >
                  ثلاث مهام محددة لخدمتك بسرعة وأمان
                </h2>
              </div>
              <p
                style={{ color: '#CBD5E1' }}
                className="max-w-md text-base leading-relaxed sm:text-lg"
              >
                البناء الكامل يتم داخل المنصة، بينما يتولى بوت واتساب التحقق الأمني
                والتعديلات النصية وتقارير الزوار.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
              {/* Right Column: 3 Interactive Capability Pillars (6 Columns) */}
              <div className="flex flex-col justify-between gap-4 lg:col-span-6">
                {BOT_PILLARS.map((pillar) => {
                  const active = activeBotId === pillar.id;
                  return (
                    <button
                      key={pillar.id}
                      type="button"
                      onClick={() => setActiveBotId(pillar.id)}
                      style={
                        active
                          ? {
                              background:
                                'linear-gradient(135deg, #172554 0%, #0F172A 100%)',
                              backgroundColor: '#172554',
                              borderColor: '#38BDF8',
                              color: '#FFFFFF',
                            }
                          : {
                              backgroundColor: '#0B132B',
                              borderColor: '#1E293B',
                              color: '#FFFFFF',
                            }
                      }
                      className="group relative w-full overflow-hidden rounded-3xl border p-6 text-right transition-all duration-300 sm:p-7"
                      data-testid={`button-bot-scenario-${pillar.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          style={{ color: '#38BDF8' }}
                          className="font-mono text-sm font-extrabold tabular-nums"
                        >
                          {pillar.index} / 03
                        </span>
                        <span
                          style={{ color: '#34D399' }}
                          className="text-xs font-bold"
                        >
                          {pillar.badge}
                        </span>
                      </div>
                      <h3
                        style={{ color: '#FFFFFF' }}
                        className="mt-2.5 font-serif text-xl font-extrabold sm:text-2xl"
                      >
                        {pillar.title}
                      </h3>
                      <p
                        style={{ color: '#CBD5E1' }}
                        className="mt-2 text-sm leading-relaxed sm:text-base"
                      >
                        {pillar.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Left Column: Sculpted Executive Smartphone Mockup (6 Columns) */}
              <div className="flex items-center justify-center lg:col-span-6">
                <div
                  style={{
                    background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                  }}
                  className="w-full max-w-xl rounded-[2.25rem] border p-3 shadow-2xl"
                >
                  <div
                    style={{
                      backgroundColor: '#0B1222',
                      borderColor: '#1E293B',
                      color: '#FFFFFF',
                    }}
                    className="flex h-full flex-col justify-between rounded-[1.85rem] border p-6 sm:p-8"
                  >
                    {/* Smartphone Top Header */}
                    <div
                      style={{ borderBottomColor: '#1E293B' }}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #10B981, #0D9488)',
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                          }}
                          className="grid size-11 place-items-center rounded-2xl text-white shadow-md"
                        >
                          <MessageCircle size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              style={{ color: '#FFFFFF' }}
                              className="font-serif text-base font-extrabold sm:text-lg"
                            >
                              مساعد ORxai الموثق
                            </span>
                            <ShieldCheck size={17} style={{ color: '#34D399' }} />
                          </div>
                          <p style={{ color: '#94A3B8' }} className="text-xs">
                            قناة رسمية مشفرة ومرتبطة بحسابك
                          </p>
                        </div>
                      </div>
                      <span
                        style={{ color: '#38BDF8' }}
                        className="font-mono text-xs font-extrabold tabular-nums"
                      >
                        {activeBot.index} / 03
                      </span>
                    </div>

                    {/* Animated Chat Messages */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeBot.id}
                        initial={{ opacity: 0, y: 14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="my-6 space-y-4"
                      >
                        {/* Outgoing User Command Bubble */}
                        <div
                          style={{
                            backgroundColor: '#172554',
                            borderColor: 'rgba(59, 130, 246, 0.4)',
                            color: '#FFFFFF',
                          }}
                          className="mr-auto max-w-[88%] rounded-2xl rounded-tl-sm border p-4 text-right"
                        >
                          <span
                            style={{ color: '#7DD3FC' }}
                            className="block text-[11px] font-bold"
                          >
                            الأمر المرسل للبوت:
                          </span>
                          <p
                            style={{ color: '#FFFFFF' }}
                            className="mt-1 font-mono text-base font-extrabold sm:text-lg"
                          >
                            {activeBot.command}
                          </p>
                        </div>

                        {/* Incoming Bot Verified Response Bubble + Visual Card */}
                        <div
                          style={{
                            backgroundColor: '#111C35',
                            borderColor: '#1E293B',
                            color: '#FFFFFF',
                          }}
                          className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm border p-5 text-right"
                        >
                          <span
                            style={{ color: '#38BDF8' }}
                            className="block text-[11px] font-bold"
                          >
                            استجابة المنظومة الفورية:
                          </span>
                          <p
                            style={{ color: '#F1F5F9' }}
                            className="mt-1.5 text-sm leading-relaxed font-semibold sm:text-base"
                          >
                            {activeBot.reply}
                          </p>

                          {/* Dynamic Visual Shape Attachment per Bot Pillar */}
                          <BotVisualAttachment pillarId={activeBot.id} />
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Smartphone Bottom Status Strip */}
                    <div
                      style={{
                        borderTopColor: '#1E293B',
                        color: '#94A3B8',
                      }}
                      className="flex items-center justify-between border-t pt-4 text-xs font-bold"
                    >
                      <span>{activeBot.highlightLabel}</span>
                      <span style={{ color: '#34D399' }}>{activeBot.highlightValue}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sculpted Wave Divider from WhatsApp Assistant (#070C1B) to FAQ (#EEF2F6) */}
        <SectionCurveDivider fromColor="#070C1B" toColor="#EEF2F6" />

        {/* =====================================================================
            SECTION 5: FAQ & ROYAL CONVERSION BANNER (#faq)
            ===================================================================== */}
        <section
          id="faq"
          style={{ backgroundColor: '#EEF2F6', color: '#0F172A' }}
          className="scroll-mt-20 bg-[#EEF2F6] py-20 lg:py-28"
        >
          <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <p style={{ color: '#1D4ED8' }} className="text-sm font-bold">
                  05 / الأسئلة الشائعة
                </p>
                <h2
                  style={{ color: '#0F172A' }}
                  className="mt-3 font-serif text-[clamp(1.9rem,3vw,2.65rem)] font-extrabold leading-[1.35]"
                >
                  إجابات واضحة ومختصرة
                </h2>
                <p
                  style={{ color: '#475569' }}
                  className="mt-4 text-base leading-relaxed sm:text-lg"
                >
                  كل ما تحتاج معرفته حول آلية العمل المتكاملة بين استوديو المنصة ومساعد
                  واتساب الموثق.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#CBD5E1',
                  color: '#0F172A',
                }}
                className="divide-y divide-slate-200 overflow-hidden rounded-3xl border shadow-xl lg:col-span-7"
              >
                {FAQ_LIST.map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={item.q}
                      style={{
                        backgroundColor: isOpen ? '#F8FAFC' : '#FFFFFF',
                        borderColor: '#E2E8F0',
                      }}
                      className="p-6 transition-colors duration-200 sm:p-8"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        style={{ color: '#0F172A' }}
                        className="flex w-full items-center justify-between gap-4 text-right font-serif text-lg font-extrabold transition-colors hover:text-blue-600 sm:text-xl"
                      >
                        <span style={{ color: '#0F172A' }}>{item.q}</span>
                        <ChevronDown
                          size={22}
                          style={{ color: '#2563EB' }}
                          className={`shrink-0 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <p
                              style={{ color: '#334155' }}
                              className="pt-4 text-base leading-relaxed sm:text-lg"
                            >
                              {item.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Royal Conversion Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #060B18 0%, #0B132B 55%, #1E3A8A 100%)',
                backgroundColor: '#0B132B',
                borderColor: '#1E40AF',
                color: '#FFFFFF',
              }}
              className="relative mt-20 overflow-hidden rounded-3xl border p-10 text-white shadow-2xl sm:p-14 lg:p-16"
            >
              <HeroOrbitalBackdrop />
              <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
                <div className="max-w-2xl">
                  <p
                    style={{ color: '#38BDF8' }}
                    className="text-sm font-bold tracking-wider"
                  >
                    ORXAI CLOUD ENTERPRISE
                  </p>
                  <h2
                    style={{ color: '#FFFFFF' }}
                    className="mt-3 font-serif text-2xl font-extrabold leading-[1.35] sm:text-4xl"
                  >
                    ابدأ تأسيس حضورك الرقمي بمعايير الشركات الكبرى
                  </h2>
                </div>

                <Link
                  href={isSignedIn ? '/dashboard' : '/login'}
                  style={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    backgroundColor: '#2563EB',
                    borderColor: 'rgba(147, 197, 253, 0.35)',
                    color: '#FFFFFF',
                  }}
                  className="site-btn-shine inline-flex h-14 items-center justify-center gap-3 rounded-2xl border px-9 text-base font-extrabold text-white shadow-xl whitespace-nowrap shrink-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                  data-testid="link-footer-cta"
                >
                  <span style={{ color: '#FFFFFF' }}>
                    {isSignedIn ? 'فتح لوحة التحكم' : 'وثّق رقمك وابدأ الآن'}
                  </span>
                  <ArrowLeft size={18} style={{ color: '#BAE6FD' }} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          EXECUTIVE FOOTER
          ===================================================================== */}
      <footer
        style={{
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          color: '#475569',
        }}
        className="border-t bg-white py-12 text-sm"
      >
        <div className="mx-auto flex max-w-[1380px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center sm:px-10">
          <div className="flex items-center gap-4">
            <Brand href="/" />
            <span style={{ color: '#CBD5E1' }}>|</span>
            <span style={{ color: '#475569' }} className="font-semibold">
              المنظومة السحابية لبناء المواقع والخدمات الرقمية
            </span>
          </div>

          <div
            style={{ color: '#1E293B' }}
            className="flex flex-wrap items-center gap-8 font-bold"
          >
            <a
              href="#interactive-studio"
              style={{ color: '#1E293B' }}
              className="transition-colors hover:text-blue-600"
            >
              استوديو المنصة
            </a>
            <a
              href="#services-suite"
              style={{ color: '#1E293B' }}
              className="transition-colors hover:text-blue-600"
            >
              الخدمات الـ 12
            </a>
            <a
              href="#whatsapp-assistant"
              style={{ color: '#1E293B' }}
              className="transition-colors hover:text-blue-600"
            >
              المساعد الذكي
            </a>
            <Link
              href="/login"
              style={{ color: '#1E293B' }}
              className="transition-colors hover:text-blue-600"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
