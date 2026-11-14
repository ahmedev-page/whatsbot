import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FolderOpen,
  Globe,
  Home,
  LogOut,
  MessageCircle,
  PartyPopper,
  Palette,
  Settings,
  ShoppingBag,
  Tag,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'wouter';
import { OrxaiMark } from '@/components/orxai-mark';
import { safeLocalStorage } from '@/lib/safe-storage';
import type { AccountWebsite } from '@/lib/account';

// ---------------------------------------------------------------------------
// Shared visual vocabulary for every dashboard screen (home / chat / services /
// settings) so they read as one product.
// ---------------------------------------------------------------------------

export const INK = '#0F172A';
export const MUTED = '#64748B';
export const BLUE = '#2563EB';

export const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  store: ShoppingBag,
  restaurant: UtensilsCrossed,
  services: BriefcaseBusiness,
  portfolio: Palette,
  booking: CalendarDays,
  survey: ClipboardList,
  vcard: CreditCard,
  rsvp: PartyPopper,
  invoice: Tag,
};
export const iconFor = (templateId: string): LucideIcon => TEMPLATE_ICONS[templateId] ?? Globe;

export function ServiceThumb({ templateId, color, size = 56 }: { templateId: string; color: string; size?: number }) {
  const Icon = iconFor(templateId);
  return (
    <span
      className="grid shrink-0 place-items-center rounded-2xl text-white"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color} 55%, #0B1B4A) 100%)` }}
      aria-hidden
    >
      <Icon size={Math.round(size * 0.46)} strokeWidth={1.8} />
    </span>
  );
}

export function relativeTime(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const minutes = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.round(hours / 24);
  return days < 30 ? `منذ ${days} يوم` : new Date(t).toLocaleDateString('ar-SA');
}

// ---------------------------------------------------------------------------
// "New since you last looked": submissions per service vs. the count seen the
// last time the activity sheet was opened. Stored per device; no server state.
// ---------------------------------------------------------------------------

const SEEN_KEY = 'orxai-seen-submissions';

function readSeen(): Record<string, number> {
  try {
    const raw = safeLocalStorage.getItem(SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function useNewSubmissions(sites: AccountWebsite[]) {
  const [seen, setSeen] = useState<Record<string, number>>(readSeen);
  const perSite = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of sites) out[s.username] = Math.max(0, (s.submissionsCount ?? 0) - (seen[s.username] ?? 0));
    return out;
  }, [sites, seen]);
  const total = useMemo(() => Object.values(perSite).reduce((a, b) => a + b, 0), [perSite]);
  const markAllSeen = useCallback(() => {
    const next: Record<string, number> = {};
    for (const s of sites) next[s.username] = s.submissionsCount ?? 0;
    safeLocalStorage.setItem(SEEN_KEY, JSON.stringify(next));
    setSeen(next);
  }, [sites]);
  return { perSite, total, markAllSeen };
}

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2" dir="ltr">
      <span
        className="grid place-items-center rounded-xl"
        style={{ width: size, height: size, background: 'linear-gradient(135deg,#0B2A6F 0%,#2563EB 100%)', color: '#7DD3FC' }}
      >
        <OrxaiMark monochrome className="size-[58%] text-current" aria-hidden />
      </span>
      <span className="font-mono text-[22px] font-extrabold tracking-tight" style={{ color: '#0B2A6F' }}>
        ORxai
      </span>
    </span>
  );
}

export function UserAvatar({ phone, size = 40 }: { phone: string; size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-full font-mono text-xs font-black text-white"
      style={{ width: size, height: size, background: 'linear-gradient(135deg,#1E3A8A,#2563EB)' }}
      aria-hidden
    >
      {phone.slice(-2)}
    </span>
  );
}

export type DashTab = 'home' | 'chat' | 'services' | 'settings';

const TABS: Array<{ id: DashTab; label: string; href: string; icon: LucideIcon }> = [
  { id: 'home', label: 'الرئيسية', href: '/dashboard', icon: Home },
  { id: 'chat', label: 'الشات', href: '/dashboard/chat', icon: MessageCircle },
  { id: 'services', label: 'خدماتي', href: '/dashboard/services', icon: FolderOpen },
  { id: 'settings', label: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
];

export function BottomNav({ active }: { active: DashTab }) {
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-white dash-safe-bottom"
      style={{ borderColor: '#E6ECF7' }}
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-2 pt-1.5">
        {TABS.map(({ id, label, href, icon: Icon }) => {
          const on = id === active;
          return (
            <li key={id} className="flex-1">
              <Link
                href={href}
                aria-current={on ? 'page' : undefined}
                className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-bold"
                style={{ color: on ? BLUE : '#64748B' }}
              >
                <Icon size={22} strokeWidth={on ? 2.4 : 1.9} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AccountMenu({
  phone,
  plan,
  onLogout,
  children,
}: {
  phone: string;
  plan: string;
  onLogout: () => void;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="الحساب"
        className="flex items-center gap-1.5 rounded-full p-0.5 pe-2 hover:bg-[#EAF0FD]"
      >
        <UserAvatar phone={phone} size={38} />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-40 w-60 rounded-2xl border bg-white p-2 shadow-xl" style={{ borderColor: '#E6ECF7' }}>
          <p dir="ltr" className="px-3 pt-2 text-right font-mono text-xs font-bold" style={{ color: INK }}>
            +{phone}
          </p>
          <p className="px-3 pb-2 text-[11px] font-bold" style={{ color: MUTED }}>
            {plan === 'free' ? 'الخطة المجانية' : `خطة ${plan}`}
          </p>
          {children}
          <button type="button" role="menuitem" onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-[#BE123C] hover:bg-[#FEF2F2]">
            <LogOut size={15} />
            تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  );
}
