import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BadgeCheck, BarChart3, Briefcase, CalendarCheck, CalendarDays, Check, ClipboardList, Copy, ExternalLink, Eye, Gift,
  Globe, Home, LayoutGrid, ListChecks, LogOut, MessageCircle, Pencil, Rocket, Search, Settings, ShoppingBag, Sparkles, Star,
  User, UtensilsCrossed, type LucideIcon,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { getGetPublicWhatsappQueryKey, useGetPublicWhatsapp } from '@workspace/api-client-react';
import { Brand } from '@/components/brand';
import { Card } from '@/components/account-ui';
import SiteEditor from '@/pages/site-editor';
import { AuthRequiredError, siteUrl, useAccount, useLogout, type Account } from '@/lib/account';

// ---------------------------------------------------------------------------
// Service catalog — the single source for what the platform offers. "live" is
// only ever set for things that genuinely work today; everything else is
// honestly marked "soon" rather than faked.
// ---------------------------------------------------------------------------
type Tone = 'green' | 'blue' | 'amber' | 'violet' | 'rose' | 'teal';
interface Service { id: string; group: string; icon: LucideIcon; title: string; desc: string; tone: Tone; live: boolean; keywords: string }

const TONES: Record<Tone, string> = {
  green: 'bg-[#e6f4ec] text-[#158C46]',
  blue: 'bg-[#e8f0fe] text-[#1a56db]',
  amber: 'bg-[#fff4e0] text-[#c26d00]',
  violet: 'bg-[#f1ebfe] text-[#6d3fd6]',
  rose: 'bg-[#fde8ee] text-[#c0275a]',
  teal: 'bg-[#e1f5f4] text-[#0b7f7a]',
};

const GROUPS = [
  { id: 'site', title: 'مواقع وحضور', hint: 'واجهتك أمام العالم' },
  { id: 'collect', title: 'جمع الردود والتفاعل', hint: 'اسمع جمهورك' },
  { id: 'sell', title: 'بيع وخدمة العملاء', hint: 'حوّل الزوار إلى عملاء' },
];

const SERVICES: Service[] = [
  { id: 'website', group: 'site', icon: Globe, title: 'موقع نشاط', desc: 'متجر أو مطعم أو خدمات أو بورتفوليو — بأربعة أنماط.', tone: 'green', live: true, keywords: 'موقع صفحة متجر مطعم بورتفوليو نشاط' },
  { id: 'profile', group: 'site', icon: User, title: 'صفحة تعريفية', desc: 'كل روابطك وبطاقتك في صفحة واحدة مع QR.', tone: 'blue', live: false, keywords: 'بروفايل تعريفية روابط بطاقة' },
  { id: 'survey', group: 'collect', icon: ClipboardList, title: 'استبيان', desc: 'أسئلة متنوعة وملخص الردود يصلك على واتساب.', tone: 'violet', live: false, keywords: 'استبيان استطلاع أسئلة' },
  { id: 'quiz', group: 'collect', icon: ListChecks, title: 'اختبار', desc: 'تصحيح تلقائي ونتيجة فورية لكل مشارك.', tone: 'amber', live: false, keywords: 'اختبار مسابقة كويز' },
  { id: 'poll', group: 'collect', icon: BarChart3, title: 'تصويت', desc: 'صوت واحد لكل جهاز ونتائج حيّة.', tone: 'teal', live: false, keywords: 'تصويت استفتاء' },
  { id: 'giveaway', group: 'collect', icon: Gift, title: 'سحب', desc: 'سحب عشوائي شفاف بين المشاركين.', tone: 'rose', live: false, keywords: 'سحب جائزة هدية' },
  { id: 'invite', group: 'collect', icon: CalendarDays, title: 'دعوة وتأكيد حضور', desc: 'دعوة أنيقة وعدّاد للمؤكدين مع QR للدخول.', tone: 'violet', live: false, keywords: 'دعوة زواج مناسبة حضور حفل' },
  { id: 'store', group: 'sell', icon: ShoppingBag, title: 'متجر إلكتروني', desc: 'سلة طلبات يصلك كل طلب منها على واتساب.', tone: 'green', live: false, keywords: 'متجر بيع منتجات سلة' },
  { id: 'menu', group: 'sell', icon: UtensilsCrossed, title: 'منيو QR', desc: 'الطلب من الطاولة يصل للمطعم مباشرة.', tone: 'amber', live: false, keywords: 'منيو قائمة مطعم كافيه طاولة' },
  { id: 'booking', group: 'sell', icon: CalendarCheck, title: 'حجز مواعيد', desc: 'مواعيد مرتبة وتذكيرات تلقائية للعملاء.', tone: 'blue', live: false, keywords: 'حجز موعد عيادة صالون' },
  { id: 'loyalty', group: 'sell', icon: BadgeCheck, title: 'بطاقة ولاء', desc: 'ختم لكل زيارة، والعاشرة مجانية.', tone: 'rose', live: false, keywords: 'ولاء ختم نقاط' },
  { id: 'reviews', group: 'sell', icon: Star, title: 'جامع التقييمات', desc: 'يوجّه التقييم العالي لخرائط قوقل.', tone: 'teal', live: false, keywords: 'تقييم تقييمات مراجعات قوقل' },
];

const PLACEHOLDER_IDEAS = ['استبيان لعملائي', 'متجر عطور', 'دعوة زواج', 'قائمة مطعم', 'سحب على جائزة', 'حجز مواعيد عيادة'];

const TEMPLATE_NAMES: Record<string, string> = { store: 'متجر', restaurant: 'مطعم', services: 'خدمات', portfolio: 'بورتفوليو', booking: 'حجوزات' };
const STYLE_NAMES: Record<string, string> = { classic: 'كلاسيكي', modern: 'عصري', cinematic: 'سينمائي', app: 'تطبيق جوال' };

const NAV = [
  { href: '/dashboard', key: 'home', label: 'الرئيسية', icon: Home },
  { href: '/dashboard/services', key: 'services', label: 'خدماتي', icon: LayoutGrid },
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
// Small building blocks
// ---------------------------------------------------------------------------
function ProgressRing({ value, total }: { value: number; total: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative grid size-[68px] shrink-0 place-items-center">
      <svg viewBox="0 0 60 60" className="absolute inset-0 -rotate-90">
        <circle cx="30" cy="30" r={radius} fill="none" stroke="#e3e8ee" strokeWidth="5" />
        <circle cx="30" cy="30" r={radius} fill="none" stroke="#158C46" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / total)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <span className="text-[13px] font-bold tabular-nums">{value}/{total}</span>
    </div>
  );
}

function ServiceCard({ service, index, action }: { service: Service; index: number; action?: ReactNode }) {
  const Icon = service.icon;
  return (
    <div
      className={`group relative flex h-full flex-col rounded-[24px] border border-[#e3e8ee] bg-white p-5 transition-all duration-300 animate-[acct-tile-in_.5s_cubic-bezier(.2,.8,.2,1)_both] ${service.live ? 'hover:-translate-y-1 hover:border-[#158C46]/40 hover:shadow-[0_24px_44px_-28px_rgba(21,140,70,.45)]' : 'hover:border-[#cfd8e1]'}`}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      data-testid={`card-service-${service.id}`}
    >
      <div className="flex items-start justify-between">
        <span className={`grid size-12 place-items-center rounded-2xl ${TONES[service.tone]} transition-transform duration-300 group-hover:scale-105`}><Icon size={22} /></span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${service.live ? 'bg-[#e6f4ec] text-[#0f6f37]' : 'bg-[#f0f3f6] text-[#7a8791]'}`}>{service.live ? 'متاح' : 'قريبًا'}</span>
      </div>
      <h3 className="mt-4 text-[15px] font-bold">{service.title}</h3>
      <p className="mt-1.5 flex-1 text-[13px] leading-6 text-[#5f6b76]">{service.desc}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ }
      }}
      className="inline-flex items-center gap-2 rounded-xl border border-[#e3e8ee] bg-white px-4 py-2.5 text-sm font-bold transition-colors hover:bg-[#f6f8fb]"
      data-testid="button-copy-site-link"
    >
      {copied ? <Check size={16} className="text-[#158C46]" /> : <Copy size={16} />} {copied ? 'تم النسخ' : 'نسخ الرابط'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------
function HomeSection({ account, botNumber }: { account: Account; botNumber: string }) {
  const [query, setQuery] = useState('');
  const [ideaIndex, setIdeaIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const website = account.website;

  useEffect(() => {
    const timer = window.setInterval(() => setIdeaIndex((current) => (current + 1) % PLACEHOLDER_IDEAS.length), 2600);
    return () => window.clearInterval(timer);
  }, []);

  // "/" jumps to search from anywhere on the page, like the tools people already know.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === '/' && target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const normalized = query.trim().toLowerCase();
  const matches = (service: Service) => !normalized || `${service.title} ${service.desc} ${service.keywords}`.toLowerCase().includes(normalized);
  const botCreateUrl = botNumber ? `https://wa.me/${botNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent('أبغى أنشئ موقع لنشاطي')}` : null;

  const steps = [
    { label: 'أكّد رقمك', done: true },
    { label: 'أنشئ أول خدمة', done: Boolean(website) },
    { label: 'شارك رابطك', done: (website?.visitsTotal ?? 0) > 0 },
  ];
  const doneCount = steps.filter((step) => step.done).length;

  const websiteAction = website ? (
    <Link href="/dashboard/site" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#158C46] hover:underline" data-testid="link-manage-site">تحرير موقعك ←</Link>
  ) : botCreateUrl ? (
    <a href={botCreateUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#158C46] hover:underline" data-testid="link-create-site-bridge">
      <MessageCircle size={15} /> أنشئه الآن عبر واتساب
    </a>
  ) : null;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[32px] border border-[#e3e8ee] bg-white px-6 py-9 sm:px-10 sm:py-12">
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-[#158C46]/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 right-10 size-64 rounded-full bg-[#caa46a]/20 blur-3xl" />
        <p className="relative text-sm font-bold text-[#158C46]">{greeting()} 👋</p>
        <h1 className="relative mt-2 text-[clamp(1.6rem,4vw,2.4rem)] font-bold leading-tight tracking-tight">وش تبي تنشئ اليوم؟</h1>
        <div className="relative mt-6 max-w-2xl">
          <Search size={20} className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#8a96a1]" />
          <input
            ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)}
            className="h-14 w-full rounded-full border border-[#dbe2e9] bg-[#f6f8fb] pl-16 pr-14 text-[15px] outline-none transition-all focus:border-[#158C46] focus:bg-white focus:shadow-[0_0_0_4px_rgba(21,140,70,.12)]"
            data-testid="input-service-search" aria-label="ابحث عن خدمة"
          />
          {!query && (
            <span key={ideaIndex} className="pointer-events-none absolute right-14 top-1/2 -translate-y-1/2 text-[15px] text-[#8a96a1] animate-[acct-fade-up_.45s_ease_both]">
              جرّب: {PLACEHOLDER_IDEAS[ideaIndex]}
            </span>
          )}
          <kbd className="absolute left-5 top-1/2 hidden -translate-y-1/2 rounded-md border border-[#dbe2e9] bg-white px-2 py-0.5 text-xs font-bold text-[#8a96a1] sm:block">/</kbd>
        </div>
      </div>

      {doneCount < 3 && !normalized && (
        <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-7">
          <ProgressRing value={doneCount} total={3} />
          <div className="flex-1">
            <h2 className="flex items-center gap-2 text-base font-bold"><Rocket size={17} className="text-[#158C46]" /> انطلق في ثلاث خطوات</h2>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {steps.map((step) => (
                <li key={step.label} className={`flex items-center gap-2 text-sm font-semibold ${step.done ? 'text-[#0f6f37]' : 'text-[#5f6b76]'}`}>
                  <span className={`grid size-5 place-items-center rounded-full ${step.done ? 'bg-[#158C46] text-white' : 'border-2 border-[#cfd8e1]'}`}>{step.done && <Check size={12} strokeWidth={3.5} />}</span>
                  {step.label}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {GROUPS.map((group) => {
        const items = SERVICES.filter((service) => service.group === group.id && matches(service));
        if (items.length === 0) return null;
        return (
          <section key={group.id}>
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="text-lg font-bold">{group.title}</h2>
              <span className="text-[13px] text-[#8a96a1]">{group.hint}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((service, index) => <ServiceCard key={service.id} service={service} index={index} action={service.id === 'website' ? websiteAction : undefined} />)}
            </div>
          </section>
        );
      })}

      {normalized && !SERVICES.some(matches) && (
        <Card className="px-6 py-14 text-center" data-testid="empty-search">
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-[#f0f3f6] text-[#8a96a1]"><Sparkles size={24} /></span>
          <p className="font-bold">ما لقينا خدمة بهذا الاسم</p>
          <p className="mt-1 text-sm text-[#5f6b76]">جرّب كلمة ثانية — أو أخبرنا بالخدمة اللي تتمناها.</p>
        </Card>
      )}
    </div>
  );
}

function ServicesSection({ account, botNumber }: { account: Account; botNumber: string }) {
  const website = account.website;
  if (!website) {
    const botUrl = botNumber ? `https://wa.me/${botNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent('أبغى أنشئ موقع لنشاطي')}` : null;
    return (
      <Card className="px-6 py-16 text-center" data-testid="empty-services">
        <span className="mx-auto mb-5 grid size-16 place-items-center rounded-[22px] bg-[#e6f4ec] text-[#158C46]"><Globe size={28} /></span>
        <h2 className="text-xl font-bold">ما أنشأت أي خدمة بعد</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-[#5f6b76]">ابدأ بموقع لنشاطك. معالج الإنشاء داخل المنصة قادم قريبًا، وحاليًا تقدر تبدأ مع البوت وتجد كل شيء هنا بعدها.</p>
        {botUrl && <a href={botUrl} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#158C46] px-6 py-3.5 text-sm font-bold text-white shadow-[0_16px_34px_-14px_#158C46]"><MessageCircle size={17} /> أنشئ موقعك عبر واتساب</a>}
      </Card>
    );
  }
  const url = siteUrl(website.username);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">خدماتي</h1>
      <Card className="overflow-hidden" >
        <div className="flex items-center gap-4 border-b border-[#e3e8ee] p-6">
          <span className="grid size-14 place-items-center rounded-2xl text-white" style={{ background: website.themeColor || '#158C46' }}><Globe size={24} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold" data-testid="text-site-name">{website.siteName}</h2>
            <p dir="ltr" className="truncate text-right text-sm text-[#5f6b76]">{url.replace(/^https?:\/\//, '')}</p>
          </div>
          <span className="hidden rounded-full bg-[#e6f4ec] px-3 py-1 text-xs font-bold text-[#0f6f37] sm:block">منشور</span>
        </div>
        <div className="flex flex-wrap gap-2 px-6 pt-5">
          <span className="rounded-full bg-[#f0f3f6] px-3 py-1 text-xs font-bold text-[#5f6b76]">{TEMPLATE_NAMES[website.templateId] ?? website.templateId}</span>
          <span className="rounded-full bg-[#f0f3f6] px-3 py-1 text-xs font-bold text-[#5f6b76]">{STYLE_NAMES[website.templateStyle] ?? website.templateStyle}</span>
        </div>
        <div className="flex flex-wrap gap-3 p-6">
          <Link href="/dashboard/site" className="inline-flex items-center gap-2 rounded-xl bg-[#158C46] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_26px_-12px_#158C46] transition-transform hover:-translate-y-0.5" data-testid="link-edit-site"><Pencil size={16} /> تحرير الموقع</Link>
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#1b2735] px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5" data-testid="link-open-site"><ExternalLink size={16} /> فتح الموقع</a>
          <CopyLinkButton url={url} />
        </div>
        <p className="border-t border-[#e3e8ee] bg-[#fafbfc] px-6 py-4 text-[13px] leading-6 text-[#5f6b76]">المنتجات والصور والمحتوى كله من هنا. وللتعديل السريع على النصوص والألوان تقدر تكتب للبوت في أي وقت.</p>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: Tone }) {
  return (
    <Card className="p-6">
      <span className={`grid size-11 place-items-center rounded-2xl ${TONES[tone]}`}><Icon size={20} /></span>
      <p className="mt-5 text-4xl font-bold tabular-nums tracking-tight">{value.toLocaleString('ar-EG')}</p>
      <p className="mt-1 text-sm font-semibold text-[#5f6b76]">{label}</p>
    </Card>
  );
}

function AnalyticsSection({ account }: { account: Account }) {
  const website = account.website;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">الإحصائيات</h1>
      {!website ? (
        <Card className="px-6 py-14 text-center"><p className="font-bold">لا توجد بيانات بعد</p><p className="mt-1 text-sm text-[#5f6b76]">تظهر الأرقام هنا بمجرد نشر أول خدمة.</p></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard icon={Eye} label="زيارات اليوم" value={website.visitsToday} tone="green" />
          <StatCard icon={BarChart3} label="إجمالي الزيارات" value={website.visitsTotal} tone="blue" />
        </div>
      )}
    </div>
  );
}

function SettingsSection({ account, onLogout, loggingOut }: { account: Account; onLogout: () => void; loggingOut: boolean }) {
  const used = account.freeMessagesUsed;
  const limit = Math.max(1, account.freeMessagesLimit);
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">الإعدادات</h1>
      <Card className="divide-y divide-[#e3e8ee]">
        <div className="flex items-center justify-between p-6"><span className="text-sm font-semibold text-[#5f6b76]">رقم واتساب</span><span dir="ltr" className="font-mono text-sm font-bold" data-testid="text-account-phone">+{account.phoneNumber}</span></div>
        <div className="flex items-center justify-between p-6"><span className="text-sm font-semibold text-[#5f6b76]">عضو منذ</span><span className="text-sm font-bold">{new Intl.DateTimeFormat('ar-SA', { dateStyle: 'long' }).format(new Date(account.createdAt))}</span></div>
        <div className="p-6">
          <div className="flex items-center justify-between text-sm"><span className="font-semibold text-[#5f6b76]">رسائل البوت المجانية</span><span className="font-bold tabular-nums">{used} / {limit}</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e3e8ee]"><div className="h-full rounded-full bg-[#158C46] transition-all duration-700" style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} /></div>
        </div>
      </Card>
      <button onClick={onLogout} disabled={loggingOut} className="inline-flex items-center gap-2 rounded-xl border border-[#e3e8ee] bg-white px-5 py-3 text-sm font-bold text-[#a3392b] transition-colors hover:bg-[#fdecea] disabled:opacity-60" data-testid="button-logout">
        <LogOut size={16} /> تسجيل الخروج
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const [location, navigate] = useLocation();
  const account = useAccount();
  const logout = useLogout();
  const whatsapp = useGetPublicWhatsapp({ query: { queryKey: getGetPublicWhatsappQueryKey() } });
  const botNumber = whatsapp.data?.whatsappNumber || '';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const section = location.split('/')[2] ?? 'home';

  useEffect(() => {
    if (account.error instanceof AuthRequiredError) navigate('/login', { replace: true });
  }, [account.error, navigate]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const doLogout = () => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) });
  const initials = useMemo(() => (account.data ? account.data.phoneNumber.slice(-2) : '··'), [account.data]);

  if (account.isLoading || account.error instanceof AuthRequiredError) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#f6f8fb]" aria-busy="true">
        <div className="flex flex-col items-center gap-4"><Brand /><div className="h-1.5 w-40 overflow-hidden rounded-full bg-[#e3e8ee]"><div className="h-full w-1/2 animate-[acct-slide_1.1s_ease-in-out_infinite] rounded-full bg-[#158C46]" /></div></div>
      </main>
    );
  }

  if (account.isError || !account.data) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#f6f8fb] px-5 font-sans">
        <Card className="max-w-sm px-8 py-10 text-center">
          <p className="font-bold">تعذّر تحميل لوحتك</p>
          <p className="mt-1 text-sm text-[#5f6b76]">تحقق من اتصالك وحاول مرة أخرى.</p>
          <button onClick={() => void account.refetch()} className="mt-6 rounded-xl bg-[#1b2735] px-5 py-2.5 text-sm font-bold text-white">إعادة المحاولة</button>
        </Card>
      </main>
    );
  }

  const data = account.data;
  return (
    <div className="min-h-[100dvh] bg-[#f6f8fb] font-sans text-[#1b2735]">
      <header className="sticky top-0 z-30 border-b border-[#e3e8ee] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link href="/dashboard" data-testid="link-dashboard-home"><Brand /></Link>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((open) => !open)} className="flex items-center gap-2.5 rounded-full border border-[#e3e8ee] bg-white py-1.5 pl-4 pr-1.5 transition-colors hover:bg-[#f6f8fb]" data-testid="button-account-menu" aria-expanded={menuOpen}>
              <span className="hidden text-[13px] font-semibold text-[#5f6b76] sm:block" dir="ltr">{maskPhone(data.phoneNumber)}</span>
              <span className="grid size-8 place-items-center rounded-full bg-[#158C46] text-xs font-bold text-white">{initials}</span>
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] w-64 rounded-3xl border border-[#e3e8ee] bg-white p-2 shadow-[0_24px_60px_-20px_rgba(27,39,53,.35)] animate-[acct-fade-up_.2s_ease_both]">
                <div className="px-4 py-3"><p className="text-xs font-semibold text-[#8a96a1]">مسجّل برقم</p><p dir="ltr" className="mt-0.5 text-right font-mono text-sm font-bold">+{data.phoneNumber}</p></div>
                <button onClick={doLogout} className="flex w-full items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-bold text-[#a3392b] transition-colors hover:bg-[#fdecea]"><LogOut size={16} /> تسجيل الخروج</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
        <nav className="sticky top-24 hidden h-fit w-56 shrink-0 md:block" aria-label="التنقل">
          <ul className="space-y-1">
            {NAV.map(({ href, key, label, icon: Icon }) => {
              const active = key === section || (key === 'services' && section === 'site');
              return (
                <li key={key}>
                  <Link href={href} className={`flex items-center gap-3 rounded-full px-5 py-3 text-sm font-bold transition-colors ${active ? 'bg-[#e6f4ec] text-[#0f6f37]' : 'text-[#5f6b76] hover:bg-white'}`} data-testid={`nav-${key}`}>
                    <Icon size={18} /> {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="min-w-0 flex-1" data-testid={`section-${section}`}>
          {section === 'site' ? <SiteEditor />
            : section === 'services' ? <ServicesSection account={data} botNumber={botNumber} />
            : section === 'analytics' ? <AnalyticsSection account={data} />
            : section === 'settings' ? <SettingsSection account={data} onLogout={doLogout} loggingOut={logout.isPending} />
            : <HomeSection account={data} botNumber={botNumber} />}
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-full border border-[#e3e8ee] bg-white/95 p-1.5 shadow-[0_18px_40px_-16px_rgba(27,39,53,.4)] backdrop-blur-md md:hidden" aria-label="التنقل">
        {NAV.map(({ href, key, label, icon: Icon }) => {
          const active = key === section || (key === 'services' && section === 'site');
          return (
            <Link key={key} href={href} className={`flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-bold transition-colors ${active ? 'bg-[#e6f4ec] text-[#0f6f37]' : 'text-[#7a8791]'}`} data-testid={`bottomnav-${key}`}>
              <Icon size={19} /> {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
