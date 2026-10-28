import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowUpLeft,
  CalendarCheck,
  Check,
  Globe,
  MessageCircle,
  Palette,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  UtensilsCrossed,
  WandSparkles,
  Zap,
} from 'lucide-react';
import { Link } from 'wouter';
import { Brand } from '@/components/brand';
import { OrxaiMark } from '@/components/orxai-mark';
import { BrandSplash, useEntrySplash } from '@/components/brand-splash';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Registration happens on the platform itself (WhatsApp only verifies the
// number), so every "start" call-to-action leads to the sign-in page.
function WhatsAppLink({ children, className = '' }: { number?: string; children: ReactNode; className?: string }) {
  return (
    <Link href="/login" className={className} data-testid="link-start-whatsapp">
      {children}
    </Link>
  );
}

// Plain, verifiable product facts — no fabricated customer counts or logos,
// just what the platform itself actually does.
const CAPABILITIES = [
  { icon: Globe, label: 'رابط وموقع خاص بمشروعك' },
  { icon: ShieldCheck, label: 'متصل رسمياً بواتساب بزنس' },
  { icon: Zap, label: 'تحديثات فورية بلا انتظار' },
  { icon: Smartphone, label: 'يعمل بسلاسة على كل الأجهزة' },
];

// The template categories the bot actually supports today — an honest
// "what we cover" strip, not a browsable demo.
const TEMPLATES = [
  { icon: Store, label: 'متجر' },
  { icon: UtensilsCrossed, label: 'مطعم' },
  { icon: WandSparkles, label: 'خدمات' },
  { icon: Palette, label: 'بورتفوليو' },
  { icon: CalendarCheck, label: 'حجز مواعيد' },
];

const FAQ = [
  { q: 'هل أحتاج خبرة تقنية أو تصميم؟', a: 'لا شيء إطلاقاً. تتحدث مع ORxai على واتساب كما تتحدث مع أي شخص، وهو يتولى التصميم والبناء.' },
  { q: 'كم يستغرق إنشاء الموقع؟', a: 'دقائق معدودة من أول رسالة، حسب وضوح تفاصيل مشروعك.' },
  { q: 'هل أقدر أعدّل الموقع بعد إنشائه؟', a: 'نعم، بلا حدود — أرسل رسالة بما تريد تغييره وقتما شئت، ويُحدَّث موقعك فوراً.' },
  { q: 'هل الاستضافة والرابط مجانيان؟', a: 'نعم، تحصل على رابط ومساحة استضافة لموقعك دون أي تكلفة إضافية.' },
  { q: 'أي نوع مشاريع يدعمها ORxai؟', a: 'متاجر، مطاعم، خدمات، أعمال (بورتفوليو)، وحجز مواعيد — ويختار البوت القالب الأنسب لمشروعك تلقائياً من وصفك له.' },
  { q: 'ماذا يحدث بعد الرسائل المجانية؟', a: 'تواصل معنا على واتساب وسنوضح لك خيارات الاستمرار المناسبة لمشروعك.' },
];

export default function Landing() {
  const showSplash = useEntrySplash();

  if (showSplash) return <BrandSplash show />;

  return (
    <main className="grain landing-shell min-h-[100dvh] overflow-hidden bg-[#faf8f4] text-[#14171a]">
      {/* NAV — sticky glass, one clear CTA. */}
      <nav className="landing-nav sticky top-0 z-30 border-b border-[#14171a]/[0.08] bg-[#faf8f4]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-10">
          <Brand />
          <div className="hidden items-center gap-8 text-sm font-semibold text-[#14171a]/55 md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-[#14171a]" data-testid="link-how-it-works">كيف يعمل؟</a>
            <a href="#why-manfaz" className="transition-colors hover:text-[#14171a]" data-testid="link-why-manfaz">المزايا</a>
            <a href="#faq" className="transition-colors hover:text-[#14171a]" data-testid="link-faq">الأسئلة الشائعة</a>
          </div>
          <WhatsAppLink className="group hidden items-center gap-2 rounded-full bg-[#1DA851] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_#1DA851] transition-all hover:-translate-y-0.5 md:inline-flex">
            <MessageCircle size={16} />
            ابدأ الآن
          </WhatsAppLink>
        </div>
      </nav>

      {/* HERO */}
      <section className="landing-hero relative">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center">
          <div className="h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(202,164,106,.22),transparent_70%)] blur-2xl" />
        </div>
        <div aria-hidden className="landing-hero-grid pointer-events-none absolute inset-0 -z-10" />
        <OrxaiMark aria-hidden className="pointer-events-none absolute -left-16 top-10 hidden h-[420px] w-auto text-[#14171a] opacity-[0.035] md:block" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 pb-20 pt-14 md:grid-cols-[1fr_1fr] md:px-10 md:pb-28 md:pt-20">
          <div className="relative z-10 max-w-xl">
            <div className="rise-in mb-7 inline-flex items-center gap-2 rounded-full border border-[#14171a]/10 bg-[#14171a]/[0.03] px-3.5 py-2 text-xs font-bold backdrop-blur">
              <span className="pulse-soft size-2 rounded-full bg-[#1DA851]" />
              مدعوم بالذكاء الاصطناعي · عبر واتساب
            </div>
            <h1 className="rise-in rise-in-delay-1 font-serif text-[clamp(2.6rem,6vw,4.6rem)] font-bold leading-[1.12] tracking-[-.03em]">
              حوّل واتسابك<br /><span className="text-[#a9793a]">إلى موقع احترافي.</span>
            </h1>
            <p className="rise-in rise-in-delay-2 mt-7 max-w-lg text-lg leading-9 text-[#14171a]/60">
              ORxai يحوّل حديثك على واتساب إلى موقع إلكتروني جاهز، بتصميم أنيق واستضافة مجانية — بدون أكواد، وبدون تعقيد.
            </p>
            <div className="rise-in rise-in-delay-3 mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <WhatsAppLink className="group flex items-center gap-3 rounded-2xl bg-[#1DA851] px-6 py-4 font-bold text-white shadow-[0_20px_45px_-15px_#1DA851] transition-all hover:-translate-y-1 active:translate-y-0">
                <MessageCircle size={21} />
                ابدأ مجانًا
                <ArrowLeft className="transition-transform group-hover:-translate-x-1" size={18} />
              </WhatsAppLink>
              <span className="text-xs font-medium text-[#14171a]/40">دخول بدون كلمة مرور — تأكيد واحد عبر واتساب</span>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[#14171a]/55">
              <span className="flex items-center gap-2"><Check size={15} className="text-[#158C46]" /> بدون بطاقة بنكية</span>
              <span className="flex items-center gap-2"><Check size={15} className="text-[#158C46]" /> استضافة مجانية</span>
              <span className="flex items-center gap-2"><Check size={15} className="text-[#158C46]" /> جاهز للمشاركة فوراً</span>
            </div>
          </div>

          <div className="landing-stage relative min-h-[440px] md:min-h-[560px]">
            <div aria-hidden className="absolute right-0 top-4 h-[360px] w-[360px] rounded-full bg-[#caa46a]/14 blur-3xl md:h-[460px] md:w-[460px]" />
            <div aria-hidden className="absolute -left-8 bottom-10 h-64 w-64 rounded-full bg-[#1DA851]/12 blur-3xl" />
            <div className="landing-phone-card absolute right-2 top-2 z-10 flex w-[min(100%,400px)] flex-col rounded-[26px] border border-white/10 bg-[#131619] p-5 shadow-[0_1px_2px_rgba(0,0,0,.3),0_30px_60px_-24px_rgba(0,0,0,.7)] md:right-6 md:top-8">
              <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
                <span className="grid size-10 place-items-center rounded-xl bg-[#1DA851]/15 text-[#3fcf78]"><MessageCircle size={19} /></span>
                <div><div className="text-sm font-bold text-white">ORxai</div><div className="text-[11px] text-white/40">متصل الآن</div></div>
                <span className="mr-auto size-2 rounded-full bg-[#1DA851]" />
              </div>
              <div className="self-start max-w-[86%] rounded-2xl rounded-tr-sm bg-white/[0.06] px-4 py-3 text-sm leading-7 text-white/80">أهلاً! أريد موقعاً لمخبزي<br />بألوان دافئة وبسيطة.</div>
              <div className="mt-3 self-end max-w-[86%] rounded-2xl rounded-tl-sm bg-[#1DA851]/15 px-4 py-3 text-sm leading-7 text-[#c9f0d7]">فكرة جميلة. ما اسم المخبز؟<br />وما الذي تحب أن يعرفه عملاؤك؟</div>
              <div className="mt-3 self-start max-w-[86%] rounded-2xl rounded-tr-sm bg-white/[0.06] px-4 py-3 text-sm leading-7 text-white/80">رغيف وسمسم. نخبز كل صباح<br />بمكونات من مزارعنا المحلية.</div>
              <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs font-semibold text-[#3fcf78]"><Sparkles size={14} /> جارٍ تجهيز موقعك...</div>
            </div>
            <div className="landing-preview-card drift absolute bottom-2 left-0 z-20 w-[min(76%,320px)] rounded-[24px] border border-white/10 bg-[#0a0c0f] p-3 shadow-[0_1px_2px_rgba(0,0,0,.4),0_25px_55px_-15px_rgba(0,0,0,.8)] md:bottom-0 md:left-6">
              <div className="rounded-[16px] bg-[#131619] p-4">
                <div className="flex items-center justify-between"><span className="font-serif text-lg font-bold text-white">رغيف وسمسم</span><span className="grid size-7 place-items-center rounded-full bg-[#caa46a] text-[#0a0c0f]"><ArrowUpLeft size={15} /></span></div>
                <div className="mt-4 h-24 rounded-2xl bg-gradient-to-br from-[#1DA851]/15 to-[#caa46a]/15" />
                <div className="mt-3 flex items-center justify-between text-[10px] text-white/40"><span>خبز اليوم</span><span className="font-bold text-[#caa46a]">اكتشف القائمة</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITY STRIP — factual product capabilities, not fabricated stats. */}
      <section className="landing-proof-strip border-y border-[#14171a]/[0.08] bg-[#f3efe6]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4 md:px-10">
          {CAPABILITIES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#14171a]/[0.05] text-[#a9793a]"><Icon size={18} /></span>
              <span className="text-sm font-semibold text-[#14171a]/70">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="landing-section px-5 py-20 md:px-10 md:py-28" id="how-it-works">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-sm font-bold text-[#a9793a]">ثلاث خطوات فقط</p>
              <h2 className="font-serif text-3xl font-bold tracking-tight md:text-5xl">خلّ الباقي علينا.</h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-[#14171a]/50">لا قوالب معقدة ولا لوحة تحكم مربكة. تحدث مع ORxai كأنك تتحدث مع فريق تصميم محترف.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { n: '٠١', icon: MessageCircle, title: 'احكِ فكرتك', body: 'أرسل رسالة على واتساب: اسم مشروعك، خدماتك، وما تريد أن يراه عملاؤك.' },
              { n: '٠٢', icon: WandSparkles, title: 'عدّل براحتك', body: 'اطلب تغيير الألوان أو النصوص، أو أرسل صورة مباشرة ليضعها ORxai في مكانها.' },
              { n: '٠٣', icon: Store, title: 'شارك موقعك', body: 'تحصل على رابط خاص بمشروعك، جاهز للمشاركة في كل حساباتك ومنصاتك.' },
            ].map(({ n, icon: Icon, title, body }) => (
               <div key={n} className="landing-luxe-card group relative overflow-hidden rounded-[28px] border border-[#14171a]/[0.07] p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-[#a9793a]/30 hover:shadow-[0_30px_60px_-24px_rgba(184,135,63,.22)]" data-testid={`card-step-${n}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#a9793a]">{n}</span>
                  <span className="grid size-11 place-items-center rounded-2xl bg-[#14171a]/[0.04] text-[#a9793a] transition-colors group-hover:bg-[#caa46a]/15"><Icon size={20} /></span>
                </div>
                <h3 className="mt-10 font-serif text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#14171a]/50">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEMPLATES — an honest "what we cover" strip, not a browsable demo. */}
      <section className="landing-section border-y border-[#14171a]/[0.08] bg-[#f3efe6] px-5 py-16 md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="mb-8 text-center text-sm font-bold text-[#a9793a]">قوالب تناسب كل نوع مشروع</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {TEMPLATES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-full border border-[#14171a]/10 bg-white px-5 py-3 text-sm font-bold shadow-[0_1px_2px_rgba(20,23,26,.04)] transition-colors hover:border-[#a9793a]/35" data-testid={`chip-template-${label}`}>
                <Icon size={16} className="text-[#a9793a]" /> {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="landing-section px-5 py-20 md:px-10 md:py-28" id="why-manfaz">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-[.7fr_1.3fr] md:items-center">
            <div>
              <p className="mb-4 text-sm font-bold text-[#a9793a]">صُمّم لك</p>
              <h2 className="font-serif text-3xl font-bold leading-[1.4] tracking-tight md:text-5xl">مشروعك يستحق<br /><span className="text-[#a9793a]">حضوراً عالمياً.</span></h2>
              <p className="mt-6 max-w-md leading-8 text-[#14171a]/55">ORxai يمنح أصحاب المشاريع الصغيرة أدوات كانت حكراً على الشركات الكبرى: موقع أنيق، هوية واضحة، ومكان واحد يجمع كل شيء.</p>
              <WhatsAppLink className="mt-8 inline-flex items-center gap-2 font-bold text-[#a9793a] underline decoration-[#a9793a]/40 decoration-2 underline-offset-8 transition-colors hover:text-[#14171a]">جرّبها الآن <ArrowLeft size={17} /></WhatsAppLink>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
               <div className="landing-luxe-card rounded-[28px] border border-[#14171a]/[0.07] p-7 sm:translate-y-6"><Sparkles className="mb-12 text-[#a9793a]" size={25} /><h3 className="font-serif text-xl font-bold">صوتك أولاً</h3><p className="mt-3 text-sm leading-7 text-[#14171a]/50">نكتب معك، لا بدلاً منك. موقعك يحتفظ بلهجتك وروح مشروعك.</p></div>
               <div className="landing-luxe-card rounded-[28px] border border-[#14171a]/[0.07] p-7"><Palette className="mb-12 text-[#a9793a]" size={25} /><h3 className="font-serif text-xl font-bold">تصميم يواكب علامتك</h3><p className="mt-3 text-sm leading-7 text-[#14171a]/50">قوالب عصرية تدعم الصور والشعارات، بألوان تختارها أنت.</p></div>
               <div className="landing-luxe-card rounded-[28px] border border-[#14171a]/[0.07] p-7"><Check className="mb-12 text-[#a9793a]" size={25} /><h3 className="font-serif text-xl font-bold">جاهز للنمو</h3><p className="mt-3 text-sm leading-7 text-[#14171a]/50">ابدأ بصفحة واحدة، ثم طوّرها كلما كبر مشروعك.</p></div>
               <div className="landing-luxe-card rounded-[28px] border border-[#1DA851]/25 bg-[#1DA851]/[0.06] p-7 sm:translate-y-6"><Globe className="mb-12 text-[#158C46]" size={25} /><h3 className="font-serif text-xl font-bold">لك رابطك الخاص</h3><p className="mt-3 text-sm leading-7 text-[#14171a]/60">موقع مستقل تستطيع إرساله بثقة في كل مكان.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section border-t border-[#14171a]/[0.08] bg-[#f3efe6] px-5 py-20 md:px-10 md:py-28" id="faq">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-bold text-[#a9793a]">أسئلة شائعة</p>
            <h2 className="font-serif text-3xl font-bold tracking-tight md:text-5xl">كل ما تحتاج معرفته.</h2>
          </div>
          <Accordion type="single" collapsible className="rounded-[28px] border border-[#14171a]/[0.08] bg-white px-6 shadow-[0_1px_2px_rgba(20,23,26,.04)]">
            {FAQ.map(({ q, a }, index) => (
              <AccordionItem key={q} value={`item-${index}`} className="border-[#14171a]/[0.08]">
                <AccordionTrigger className="text-right font-serif text-base font-bold hover:no-underline" data-testid={`button-faq-${index}`}>{q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-7 text-[#14171a]/55" data-testid={`text-faq-${index}`}>{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA banner — the one deliberate dark, high-contrast band before the footer. */}
      <section className="landing-cta relative overflow-hidden bg-[#131619] px-5 py-20 text-white md:px-10 md:py-28">
        <div aria-hidden className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#1DA851]/15 blur-3xl" />
        <div aria-hidden className="absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-[#caa46a]/15 blur-3xl" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="mb-4 text-sm font-bold text-[#3fcf78]">الخطوة الأولى تبدأ برسالة</p>
            <h2 className="max-w-2xl font-serif text-3xl font-bold leading-[1.5] md:text-5xl">جاهز تخلي الناس<br />تلقى مشروعك؟</h2>
          </div>
          <WhatsAppLink className="group flex shrink-0 items-center gap-3 rounded-2xl bg-[#1DA851] px-6 py-4 font-bold text-white shadow-[0_20px_45px_-15px_#1DA851] transition-all hover:-translate-y-1">
            <MessageCircle size={20} /> ابدأ مجانًا <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          </WhatsAppLink>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-5 py-10 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-[#14171a]/[0.08] pt-8 md:flex-row md:items-center md:justify-between">
          <Brand />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-[#14171a]/55">
            <a href="#how-it-works" className="transition-colors hover:text-[#14171a]">كيف يعمل؟</a>
            <a href="#why-manfaz" className="transition-colors hover:text-[#14171a]">المزايا</a>
            <a href="#faq" className="transition-colors hover:text-[#14171a]">الأسئلة الشائعة</a>
            <Link href="/admin" className="transition-colors hover:text-[#14171a]" data-testid="link-footer-admin">الإدارة</Link>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-7xl text-xs text-[#14171a]/35">ORxai — حضورك الرقمي يبدأ ببساطة.</p>
      </footer>
    </main>
  );
}
