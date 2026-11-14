import { useState, type ReactNode } from 'react';
import {
  BarChart3,
  Bell,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Inbox,
  LayoutGrid,
  LogOut,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { AdCarousel } from './ad-carousel';
import {
  accountQueryKey,
  setServicePublished,
  siteUrl,
  trackAnnouncement,
  useActivity,
  useAnnouncements,
  type Account,
  type AccountWebsite,
  type ActivityEvent,
} from '@/lib/account';
import { getTemplate, remainingSlots } from '@/lib/studio';
import {
  AccountMenu,
  BLUE,
  BottomNav,
  INK,
  LogoMark,
  MUTED,
  ServiceThumb,
  iconFor,
  relativeTime,
  useNewSubmissions,
  type DashTab,
} from './primitives';

// ---------------------------------------------------------------------------
// Frame shared by home / services / settings
// ---------------------------------------------------------------------------

function Screen({
  tab,
  account,
  onLogout,
  newCount = 0,
  onBell,
  children,
}: {
  tab: DashTab;
  account: Account;
  onLogout: () => void;
  newCount?: number;
  onBell?: () => void;
  children: ReactNode;
}) {
  const [, navigate] = useLocation();
  return (
    <div dir="rtl" className="dash-bg min-h-[100dvh] pb-24 font-sans" style={{ color: INK }}>
      <header className="sticky top-0 z-20 border-b bg-white/95" style={{ borderColor: '#E6ECF7' }}>
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <AccountMenu phone={account.phoneNumber} plan={account.plan ?? 'free'} onLogout={onLogout}>
            <button
              type="button"
              role="menuitem"
              onClick={() => navigate('/dashboard/settings')}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold hover:bg-[#F1F5F9]"
            >
              الإعدادات
            </button>
          </AccountMenu>
          <LogoMark />
          <button
            type="button"
            onClick={onBell}
            disabled={!onBell}
            aria-label={newCount ? `${newCount} إشعارات جديدة` : 'الإشعارات'}
            className="relative grid size-10 place-items-center rounded-full hover:bg-[#EAF0FD] disabled:opacity-60"
          >
            <Bell size={22} style={{ color: '#1E3A8A' }} />
            {newCount > 0 && (
              <span className="absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-[#EF4444] px-1 text-[10px] font-black leading-[18px] text-white">
                {newCount > 9 ? '9+' : newCount}
              </span>
            )}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-5">{children}</main>
      <BottomNav active={tab} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Service card
// ---------------------------------------------------------------------------

export function ServiceRow({ site, newCount }: { site: AccountWebsite; newCount: number }) {
  const [, navigate] = useLocation();
  const [stats, setStats] = useState(false);
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const published = site.published !== false;
  const tpl = getTemplate(site.templateId);
  const url = siteUrl(site.username);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt('انسخ الرابط', url);
    }
    setMenu(false);
  };
  const edit = () => navigate(`/dashboard/chat?service=${encodeURIComponent(site.username)}`);
  // Pausing frees the plan slot and hides the service from visitors; resuming is
  // refused (with the reason) when the slot has been taken by another service.
  const togglePublished = async () => {
    setMenu(false);
    setBusy(true);
    setNotice('');
    try {
      await setServicePublished(site.username, !published);
      await queryClient.invalidateQueries({ queryKey: accountQueryKey });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'تعذّر تنفيذ الطلب.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="dash-card p-3.5">
      <div className="flex items-start gap-3">
        <button type="button" onClick={edit} aria-label={`تعديل ${site.siteName}`} className="shrink-0">
          <ServiceThumb templateId={site.templateId} color={site.themeColor || BLUE} size={64} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button type="button" onClick={edit} className="min-w-0 text-right">
              <h3 className="truncate text-[17px] font-black" style={{ color: INK }}>{site.siteName}</h3>
              <p className="truncate text-xs font-semibold" style={{ color: MUTED }}>{tpl.label}</p>
            </button>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold"
              style={published ? { backgroundColor: '#E7F8EE', color: '#15803D' } : { backgroundColor: '#F1F5F9', color: '#64748B' }}
            >
              <span className="size-1.5 rounded-full" style={{ backgroundColor: published ? '#16A34A' : '#94A3B8' }} />
              {published ? 'منشور' : 'متوقف'}
            </span>
          </div>
          {newCount > 0 && (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-extrabold" style={{ color: '#1D4ED8' }}>
              <Inbox size={12} />
              {newCount} جديد
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={edit}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-extrabold text-white"
          style={{ backgroundColor: BLUE }}
        >
          <Pencil size={15} />
          تعديل
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border bg-white px-3.5 text-[13px] font-bold"
          style={{ borderColor: '#D5DEEE', color: INK }}
        >
          <Eye size={15} />
          معاينة
        </a>
        <button
          type="button"
          onClick={() => setStats((v) => !v)}
          aria-expanded={stats}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border bg-white px-3 text-[13px] font-bold"
          style={{ borderColor: '#D5DEEE', color: INK }}
        >
          <BarChart3 size={15} />
          <span className="hidden min-[370px]:inline">إحصائيات</span>
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-label="المزيد"
            aria-expanded={menu}
            className="grid size-10 place-items-center rounded-xl border bg-white"
            style={{ borderColor: '#D5DEEE', color: INK }}
          >
            <MoreHorizontal size={17} />
          </button>
          {menu && (
            <div role="menu" className="absolute left-0 top-[calc(100%+6px)] z-20 w-44 rounded-xl border bg-white p-1.5 shadow-xl" style={{ borderColor: '#E6ECF7' }}>
              <button type="button" role="menuitem" onClick={copy} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold hover:bg-[#F1F5F9]">
                {copied ? <Check size={14} className="text-[#16A34A]" /> : <Copy size={14} />}
                نسخ الرابط
              </button>
              <a href={url} target="_blank" rel="noreferrer" role="menuitem" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold hover:bg-[#F1F5F9]">
                <ExternalLink size={14} />
                فتح الموقع
              </a>
              <button type="button" role="menuitem" onClick={() => void togglePublished()} disabled={busy} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold hover:bg-[#F1F5F9] disabled:opacity-50">
                {published ? <Pause size={14} /> : <Play size={14} />}
                {published ? 'إيقاف النشر' : 'إعادة النشر'}
              </button>
            </div>
          )}
        </div>
      </div>

      {notice && (
        <p role="alert" className="mt-3 rounded-xl bg-[#FFF7ED] px-3 py-2.5 text-xs font-bold leading-relaxed" style={{ color: '#9A3412' }}>
          {notice}
        </p>
      )}
      {!published && !notice && (
        <p className="mt-3 rounded-xl bg-[#F8FAFC] px-3 py-2.5 text-xs font-semibold leading-relaxed" style={{ color: MUTED }}>
          الخدمة متوقفة: بياناتها محفوظة ولا يراها زوارك، ولا تحتسب من خطتك. استعمل «⋯ ← إعادة النشر» لإظهارها.
        </p>
      )}
      {stats && (
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            ['زيارات اليوم', site.visitsToday],
            ['إجمالي الزيارات', site.visitsTotal],
            ['الطلبات والردود', site.submissionsCount ?? 0],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl bg-[#F4F7FD] px-2 py-2.5">
              <dd className="text-lg font-black" style={{ color: INK }}>{value}</dd>
              <dt className="text-[11px] font-bold" style={{ color: MUTED }}>{label}</dt>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

function CreateCard({ account }: { account: Account }) {
  const [, navigate] = useLocation();
  const slots = remainingSlots(account.usage);
  const full = !!slots && slots.sites === 0 && slots.services === 0;
  return (
    <button
      type="button"
      onClick={() => !full && navigate('/dashboard/chat?new=1')}
      disabled={full}
      className="flex w-full flex-col items-center gap-1.5 rounded-[20px] border-2 border-dashed px-4 py-6 text-center disabled:cursor-not-allowed"
      style={{ borderColor: full ? '#CBD5E1' : '#9DB6F2', backgroundColor: full ? '#F8FAFC' : '#F2F6FF' }}
    >
      <span className="grid size-10 place-items-center rounded-full text-white" style={{ backgroundColor: full ? '#94A3B8' : BLUE }}>
        {full ? <Check size={20} /> : <Plus size={22} />}
      </span>
      <span className="text-[17px] font-black" style={{ color: full ? MUTED : '#1E3A8A' }}>
        {full ? 'اكتملت خدمات خطتك المجانية' : 'إنشاء خدمة جديدة'}
      </span>
      <span className="text-xs font-semibold" style={{ color: MUTED }}>
        {full
          ? 'عدّل خدماتك الحالية، أو احذف إحداها لتنشئ بدلاً منها.'
          : slots
            ? `المتاح في خطتك: ${slots.sites} موقع · ${slots.services} نوع خدمة تفاعلية`
            : 'ابدأ بإنشاء موقع أو خدمة تفاعلية'}
      </span>
    </button>
  );
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const Icon = event.type === 'published' ? Sparkles : iconFor(event.templateId);
  return (
    <li className="flex items-center gap-3 px-3.5 py-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#EAF0FD]" style={{ color: BLUE }}>
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold" style={{ color: INK }}>{event.title}</p>
        <p className="truncate text-xs font-semibold" style={{ color: MUTED }}>
          {event.serviceName}{event.detail ? ` · ${event.detail}` : ''}
        </p>
      </div>
      <time className="shrink-0 text-[11px] font-bold" style={{ color: MUTED }}>{relativeTime(event.at)}</time>
    </li>
  );
}

function ActivitySheet({ events, onClose }: { events: ActivityEvent[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F172A]/50 sm:items-center" role="dialog" aria-modal="true" aria-label="الأنشطة" onClick={onClose}>
      <div className="max-h-[80dvh] w-full max-w-lg overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: '#E6ECF7' }}>
          <h2 className="text-base font-black">آخر الأنشطة</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="grid size-9 place-items-center rounded-xl hover:bg-[#F1F5F9]">
            <X size={18} />
          </button>
        </div>
        <ul className="dash-scroll max-h-[calc(80dvh-56px)] divide-y overflow-y-auto" style={{ borderColor: '#EEF2F9' }}>
          {events.length ? events.map((e) => <ActivityRow key={e.id} event={e} />) : (
            <li className="px-4 py-10 text-center text-sm font-semibold" style={{ color: MUTED }}>لا توجد أنشطة بعد.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

export function HomeView({ account, sites, onLogout }: { account: Account; sites: AccountWebsite[]; onLogout: () => void }) {
  const [, navigate] = useLocation();
  const activity = useActivity();
  const { perSite, total: newTotal, markAllSeen } = useNewSubmissions(sites);
  const [sheet, setSheet] = useState(false);
  const ads = useAnnouncements();
  const events = activity.data ?? [];
  const visitsToday = sites.reduce((n, s) => n + (s.visitsToday ?? 0), 0);
  const visitsTotal = sites.reduce((n, s) => n + (s.visitsTotal ?? 0), 0);

  const stats = [
    { icon: Users, value: visitsToday, label: 'زيارات اليوم', color: '#6D5AE6' },
    { icon: Inbox, value: newTotal, label: 'طلب جديد', color: '#0EA67A' },
    { icon: LayoutGrid, value: sites.length, label: 'خدمة نشطة', color: BLUE },
    { icon: TrendingUp, value: visitsTotal, label: 'إجمالي الزيارات', color: '#F59E0B' },
  ];

  return (
    <Screen
      tab="home"
      account={account}
      onLogout={onLogout}
      newCount={newTotal}
      onBell={() => {
        setSheet(true);
        markAllSeen();
      }}
    >
      <section
        className="relative overflow-hidden rounded-[22px] px-5 py-6 text-white"
        style={{ background: 'linear-gradient(135deg,#0A2463 0%,#1D4ED8 100%)' }}
      >
        <div className="pointer-events-none absolute -left-10 -top-10 size-44 rounded-full bg-white/10" aria-hidden />
        <div className="pointer-events-none absolute -bottom-14 left-14 size-40 rounded-full bg-white/[0.07]" aria-hidden />
        <div className="relative max-w-[78%]">
          <h1 className="text-[22px] font-black leading-snug">
            مرحباً بك في <span style={{ color: '#7DD3FC' }} className="font-mono">ORxai</span>
          </h1>
          <p className="mt-1.5 text-[13px] font-semibold leading-relaxed text-white/85">منصة واحدة .. لإطلاق أفكارك الرقمية</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/chat?new=1')}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold"
            style={{ color: '#0A2463' }}
          >
            إنشاء خدمة جديدة
            <Plus size={17} />
          </button>
        </div>
      </section>

      {!!ads.data?.length && (
        <AdCarousel ads={ads.data} onView={(id) => trackAnnouncement(id, 'view')} onClick={(id) => trackAnnouncement(id, 'click')} />
      )}

      <section aria-label="ملخص" className="grid grid-cols-4 gap-2">
        {stats.map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="dash-card flex flex-col items-center px-1 py-3 text-center">
            <Icon size={22} style={{ color }} strokeWidth={2.1} />
            <p className="mt-1.5 text-xl font-black leading-none" style={{ color: INK }}>{value.toLocaleString('en')}</p>
            <p className="mt-1.5 text-[10.5px] font-bold leading-tight" style={{ color: MUTED }}>{label}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="my-services" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="my-services" className="flex items-center gap-2 text-lg font-black">
            <LayoutGrid size={19} style={{ color: BLUE }} />
            خدماتي
          </h2>
          {sites.length > 0 && (
            <button type="button" onClick={() => navigate('/dashboard/services')} className="text-xs font-extrabold" style={{ color: BLUE }}>
              عرض الكل
            </button>
          )}
        </div>
        {sites.slice(0, 2).map((site) => (
          <ServiceRow key={site.username} site={site} newCount={perSite[site.username] ?? 0} />
        ))}
        <CreateCard account={account} />
      </section>

      <section aria-labelledby="recent" className="space-y-3">
        <h2 id="recent" className="flex items-center gap-2 text-lg font-black">
          <Clock size={19} style={{ color: BLUE }} />
          آخر الأنشطة
        </h2>
        <ul className="dash-card divide-y overflow-hidden" style={{ borderColor: '#EEF2F9' }}>
          {events.slice(0, 3).map((event) => <ActivityRow key={event.id} event={event} />)}
          {!events.length && (
            <li className="px-4 py-7 text-center text-sm font-semibold" style={{ color: MUTED }}>
              {activity.isLoading ? 'جارٍ التحميل…' : 'لا توجد أنشطة بعد — شارك رابط خدمتك لتبدأ الطلبات بالوصول.'}
            </li>
          )}
        </ul>
      </section>

      {sheet && <ActivitySheet events={events} onClose={() => setSheet(false)} />}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(1, max)) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-bold">
        <span style={{ color: INK }}>{label}</span>
        <span style={{ color: used >= max ? '#B45309' : MUTED }}>{used} / {max >= 999 ? '∞' : max}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#E8EEFA]" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: used >= max ? '#F59E0B' : BLUE }} />
      </div>
    </div>
  );
}

function PlanCard({ account }: { account: Account }) {
  const usage = account.usage;
  if (!usage) return null;
  return (
    <section className="dash-card space-y-3 p-4" aria-label="خطتك">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black">{usage.plan === 'free' ? 'الخطة المجانية' : `خطة ${usage.plan}`}</h2>
        <span className="rounded-full bg-[#EAF0FD] px-2.5 py-1 text-[11px] font-extrabold" style={{ color: '#1D4ED8' }}>
          موقع واحد + خدمة من كل نوع
        </span>
      </div>
      <UsageBar label="المواقع المنشورة" used={usage.sites.used} max={usage.sites.max} />
      <div className="grid grid-cols-1 gap-2.5">
        {Object.entries(usage.services).map(([id, s]) => (
          <UsageBar key={id} label={s.label} used={s.used} max={s.max} />
        ))}
      </div>
    </section>
  );
}

export function ServicesView({ account, sites, onLogout }: { account: Account; sites: AccountWebsite[]; onLogout: () => void }) {
  const { perSite, total, markAllSeen } = useNewSubmissions(sites);
  const [sheet, setSheet] = useState(false);
  const activity = useActivity();
  return (
    <Screen
      tab="services"
      account={account}
      onLogout={onLogout}
      newCount={total}
      onBell={() => {
        setSheet(true);
        markAllSeen();
      }}
    >
      <h1 className="flex items-center gap-2 text-xl font-black">
        <LayoutGrid size={21} style={{ color: BLUE }} />
        خدماتي
      </h1>
      <PlanCard account={account} />
      {sites.length ? (
        sites.map((site) => <ServiceRow key={site.username} site={site} newCount={perSite[site.username] ?? 0} />)
      ) : (
        <p className="dash-card px-4 py-8 text-center text-sm font-semibold" style={{ color: MUTED }}>لم تنشئ أي خدمة بعد.</p>
      )}
      <CreateCard account={account} />
      {sheet && <ActivitySheet events={activity.data ?? []} onClose={() => setSheet(false)} />}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function SettingsView({ account, onLogout }: { account: Account; onLogout: () => void }) {
  const remaining = Math.max(0, account.freeMessagesLimit - account.freeMessagesUsed);
  return (
    <Screen tab="settings" account={account} onLogout={onLogout}>
      <h1 className="text-xl font-black">الإعدادات</h1>
      <section className="dash-card divide-y" style={{ borderColor: '#EEF2F9' }} aria-label="الحساب">
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm font-bold" style={{ color: MUTED }}>رقم الواتساب</span>
          <span dir="ltr" className="font-mono text-sm font-extrabold">+{account.phoneNumber}</span>
        </div>
        <div className="space-y-2 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: MUTED }}>رصيد المساعد الذكي</span>
            <span className="text-sm font-extrabold" style={{ color: BLUE }}>{remaining} رسالة</span>
          </div>
          <UsageBar label="المستخدَم" used={account.freeMessagesUsed} max={account.freeMessagesLimit} />
        </div>
      </section>
      <PlanCard account={account} />
      <button
        type="button"
        onClick={onLogout}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border bg-white text-sm font-extrabold text-[#BE123C]"
        style={{ borderColor: '#F3C4CC' }}
      >
        <LogOut size={17} />
        تسجيل الخروج
      </button>
    </Screen>
  );
}
