import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  CalendarCheck,
  Clock3,
  Facebook,
  Home,
  Info,
  Instagram,
  LayoutGrid,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  Phone,
  Quote,
  Search,
  Share2,
  ShoppingBag,
  Star,
  Sun,
  Twitter,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { OrxaiMark } from '@/components/orxai-mark';
import { useParams } from 'wouter';
import { getGetPublicWebsiteQueryKey, useGetPublicWebsite } from '@workspace/api-client-react';
import { useMinimumVisible } from '@/components/brand-splash';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export type Json = Record<string, unknown>;

export const asObject = (value: unknown): Json => (value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {});
export const text = (data: Json, keys: string[], fallback: string) => {
  for (const key of keys) if (typeof data[key] === 'string' && data[key]) return data[key] as string;
  return fallback;
};
export const items = (data: Json, keys: string[]) => {
  for (const key of keys) if (Array.isArray(data[key])) return data[key] as unknown[];
  return [];
};
export const money = (value: unknown) => typeof value === 'number' ? `${value.toLocaleString('ar-SA')} ر.س` : typeof value === 'string' && value ? value : 'اطلب السعر';
export const digitsOnly = (value: string) => value.replace(/[^\d+]/g, '');
export const whatsappUrl = (number: string, message?: string) => {
  const normalized = digitsOnly(number).replace(/^\+/, '');
  if (!normalized) return '#reach-us';
  return `https://wa.me/${normalized}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
};

// ---------------------------------------------------------------------------
// Design tokens: every color in this file is one of these CSS variables, so
// dark mode is a single palette swap instead of touching every component.
// ---------------------------------------------------------------------------
export function getPalette(accent: string, dark: boolean): CSSProperties {
  const palette = dark
    ? { bg: '#090a0b', ink: '#f5f5f1', muted: '#9a9d9f', soft: '#151617', card: '#101112', border: '#292b2d', line: '#202224' }
    : { bg: '#f7f7f3', ink: '#111315', muted: '#707477', soft: '#ecece7', card: '#ffffff', border: '#e3e4df', line: '#ecece8' };
  return {
    '--site-accent': accent,
    '--site-bg': palette.bg,
    '--site-ink': palette.ink,
    '--site-muted': palette.muted,
    '--site-soft': palette.soft,
    '--site-card': palette.card,
    '--site-border': palette.border,
    '--site-line': palette.line,
  } as CSSProperties;
}

// Fade-and-rise reveal used across every template for a consistent,
// professional motion language without pulling in an animation library.
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition-all duration-[900ms] ease-[cubic-bezier(.16,.8,.24,1)] ${visible ? 'translate-y-0 scale-100 opacity-100 blur-none' : 'translate-y-7 scale-[.98] opacity-0 blur-[2px]'} ${className}`}>{children}</div>;
}

// A photo the business owner uploaded straight through WhatsApp ("صورة
// رئيسية"). Every template renders it the moment it's set — a slow Ken
// Burns drift keeps it feeling alive without any extra JS.
export function HeroPhoto({ src, alt, className = '', imgClassName = '' }: { src: string; alt: string; className?: string; imgClassName?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src) return null;
  return <div className={`site-hero-photo overflow-hidden rounded-[28px] ${className}`}>
    {failed ? <div className="flex h-full min-h-48 items-end bg-[radial-gradient(circle_at_75%_25%,color-mix(in_srgb,var(--site-accent)_38%,transparent),transparent_34%),linear-gradient(145deg,var(--site-soft),var(--site-card))] p-6">
      <span className="font-serif text-4xl font-bold opacity-70">{alt.slice(0, 1)}</span>
    </div> : <img src={src} alt={alt} loading="eager" fetchPriority="high" decoding="async" onError={() => setFailed(true)} className={`h-full w-full object-cover ${imgClassName}`} data-testid="img-hero" />}
  </div>;
}

export function useSiteExtras(data: Json) {
  const contact = asObject(data.contact);
  const social = asObject(data.socialLinks);
  return {
    contact,
    social,
    logo: typeof data.logo === 'string' ? data.logo : '',
    heroImage: typeof data.heroImage === 'string' ? data.heroImage : '',
    hours: items(data, ['hours', 'workingHours']) as Array<Json>,
    team: items(data, ['team', 'staff']) as Array<Json>,
    testimonials: items(data, ['testimonials', 'reviews']) as Array<Json>,
    faq: items(data, ['faq', 'faqs']) as Array<Json>,
    // Portfolio-only — see SkillsSection/ExperienceSection/CertificationsSection.
    skills: items(data, ['skills']) as Array<Json | string>,
    experience: items(data, ['experience']) as Array<Json>,
    certifications: items(data, ['certifications']) as Array<Json>,
    ctaLabel: text(data, ['ctaLabel'], 'تواصل معنا'),
  };
}

export function LiveDot({ color }: { color: string }) {
  return <span className="relative flex h-1.5 w-1.5">
    <span className="absolute inline-flex h-full w-full rounded-full opacity-70 [animation:site-glow-pulse_2.4s_ease-in-out_infinite]" style={{ background: color }} />
    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: color }} />
  </span>;
}

export function SectionHeading({ eyebrow, title, light = false }: { eyebrow: string; title: string; light?: boolean }) {
  const accentColor = light ? 'color-mix(in srgb, var(--site-accent) 65%, white 35%)' : 'var(--site-accent)';
  return <Reveal className="mb-9">
    <span className="mb-3 inline-flex items-center gap-2.5 text-xs font-bold tracking-wide" style={{ color: accentColor }}>
      <LiveDot color={accentColor} />
      {eyebrow}
    </span>
    <h2 className="font-serif text-3xl font-bold md:text-4xl">{title}</h2>
    <span className="mt-3 block h-[3px] overflow-hidden rounded-full [animation:site-underline-grow_.9s_cubic-bezier(.2,.8,.2,1)_.15s_both]" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
  </Reveal>;
}

// lucide-react deliberately excludes brand logos (see lucide-icons/lucide#670),
// so tiktok/snapchat — both already collected in socialLinks — need their own
// small glyphs to actually be shown, matching the other icons' stroke weight.
function TiktokIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
  </svg>;
}
function SnapchatIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 3c2.76 0 5 2.24 5 5v2.2c0 .3.15.4.35.5.5.25 1.1.4 1.55.5.35.1.5.5.3.8-.2.3-.7.55-1.4.8.1.5.5.9 1.15 1.15.3.1.45.45.3.75-.2.4-.9.65-1.85.8-.05.25-.1.5-.2.7-.1.25-.35.35-.65.3-.55-.1-1.15-.05-1.65.15-.45.2-.85.55-1.3.9-.6.45-1.3.95-2.4.95h-.2c-1.1 0-1.8-.5-2.4-.95-.45-.35-.85-.7-1.3-.9-.5-.2-1.1-.25-1.65-.15-.3.05-.55-.05-.65-.3-.1-.2-.15-.45-.2-.7-.95-.15-1.65-.4-1.85-.8-.15-.3 0-.65.3-.75.65-.25 1.05-.65 1.15-1.15-.7-.25-1.2-.5-1.4-.8-.2-.3-.05-.7.3-.8.45-.1 1.05-.25 1.55-.5.2-.1.35-.2.35-.5V8c0-2.76 2.24-5 5-5Z" />
  </svg>;
}

// Social values are user-editable text that ends up in an href, so they are
// never used raw: an http(s) URL passes, a bare handle becomes a profile URL,
// and anything else (javascript:, data:, ...) yields '' and the icon is hidden.
const SOCIAL_BASES: Record<string, string> = {
  instagram: 'https://instagram.com/',
  twitter: 'https://x.com/',
  facebook: 'https://facebook.com/',
  tiktok: 'https://tiktok.com/@',
  snapchat: 'https://snapchat.com/add/',
};
export function socialUrl(platform: string, raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const value = raw.trim();
  if (!value) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
    } catch {
      return '';
    }
  }
  // "instagram.com/abm" without a scheme is a link, not a handle.
  if (/^(?:www\.)?[a-z0-9-]+\.[a-z]{2,}\/\S*$/i.test(value)) return socialUrl(platform, `https://${value}`);
  const handle = value.replace(/^@/, '');
  return /^[\w.]{1,60}$/.test(handle) && SOCIAL_BASES[platform] ? SOCIAL_BASES[platform] + handle : '';
}

export function ContactSection({ contact, social }: { contact: Json; social: Json }) {
  const phone = typeof contact.phone === 'string' ? contact.phone : '';
  const whatsapp = typeof contact.whatsapp === 'string' ? contact.whatsapp : phone;
  const email = typeof contact.email === 'string' ? contact.email : '';
  const address = typeof contact.address === 'string' ? contact.address : '';
  const socialLinks = [
    { key: 'instagram', icon: Instagram, value: social.instagram },
    { key: 'twitter', icon: Twitter, value: social.twitter },
    { key: 'facebook', icon: Facebook, value: social.facebook },
    { key: 'tiktok', icon: TiktokIcon, value: social.tiktok },
    { key: 'snapchat', icon: SnapchatIcon, value: social.snapchat },
  ].map((entry) => ({ ...entry, href: socialUrl(entry.key, entry.value) })).filter((entry) => entry.href);
  if (!phone && !whatsapp && !email && !address && socialLinks.length === 0) return null;
  const cardCls = 'site-card-lift flex items-center gap-3 rounded-2xl border p-5';
  const cardStyle: CSSProperties = { background: 'var(--site-card)', borderColor: 'var(--site-border)' };
  const iconWrap = 'grid size-11 shrink-0 place-items-center rounded-full';
  const iconStyle: CSSProperties = { background: 'var(--site-soft)', color: 'var(--site-accent)' };
  return <section id="reach-us" className="mx-auto max-w-6xl px-5 py-16 md:px-10">
    <SectionHeading eyebrow="تواصل معنا" title="نسعد بخدمتك" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {phone && <Reveal delay={0}><a href={`tel:${digitsOnly(phone)}`} className={cardCls} style={cardStyle} data-testid="link-contact-phone"><span className={iconWrap} style={iconStyle}><Phone size={18} /></span><div><p className="text-xs" style={{ color: 'var(--site-muted)' }}>اتصل بنا</p><p className="font-bold" dir="ltr">{phone}</p></div></a></Reveal>}
      {whatsapp && <Reveal delay={60}><a href={`https://wa.me/${digitsOnly(whatsapp).replace(/^\+/, '')}`} target="_blank" rel="noreferrer" className={cardCls} style={cardStyle} data-testid="link-contact-whatsapp"><span className={iconWrap} style={iconStyle}><MessageCircle size={18} /></span><div><p className="text-xs" style={{ color: 'var(--site-muted)' }}>واتساب</p><p className="font-bold" dir="ltr">{whatsapp}</p></div></a></Reveal>}
      {email && <Reveal delay={120}><a href={`mailto:${email}`} className={cardCls} style={cardStyle} data-testid="link-contact-email"><span className={iconWrap} style={iconStyle}><Mail size={18} /></span><div><p className="text-xs" style={{ color: 'var(--site-muted)' }}>البريد الإلكتروني</p><p className="font-bold" dir="ltr">{email}</p></div></a></Reveal>}
      {address && <Reveal delay={180}><div className={cardCls} style={cardStyle} data-testid="text-contact-address"><span className={iconWrap} style={iconStyle}><MapPin size={18} /></span><div><p className="text-xs" style={{ color: 'var(--site-muted)' }}>العنوان</p><p className="font-bold">{address}</p></div></div></Reveal>}
    </div>
    {socialLinks.length > 0 && <div className="mt-6 flex gap-3">{socialLinks.map(({ key, icon: Icon, href }) => <a key={key} href={href} target="_blank" rel="noreferrer" className="grid size-11 place-items-center rounded-full transition hover:text-white" style={{ background: 'var(--site-soft)', color: 'var(--site-accent)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--site-accent)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--site-soft)')} data-testid={`link-social-${key}`}><Icon size={18} /></a>)}</div>}
  </section>;
}

export function HoursSection({ hours }: { hours: Array<Json> }) {
  if (!hours.length) return null;
  return <section className="px-5 py-16 md:px-10" style={{ background: 'var(--site-soft)' }}>
    <div className="mx-auto max-w-3xl">
      <SectionHeading eyebrow="مواعيدنا" title="ساعات العمل" />
      <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--site-card)', borderColor: 'var(--site-border)' }}>
        {hours.map((raw, index) => { const row = asObject(raw); return <div key={index} className="flex items-center justify-between border-b px-6 py-4 text-sm last:border-0" style={{ borderColor: 'var(--site-line)' }} data-testid={`row-hours-${index}`}><span className="flex items-center gap-2 font-bold"><Clock3 size={15} style={{ color: 'var(--site-accent)' }} />{text(row, ['day'], '')}</span><span style={{ color: 'var(--site-muted)' }}>{text(row, ['time', 'hours'], '')}</span></div>; })}
      </div>
    </div>
  </section>;
}

export function TeamSection({ team }: { team: Array<Json> }) {
  if (!team.length) return null;
  return <section className="mx-auto max-w-6xl px-5 py-16 md:px-10">
    <SectionHeading eyebrow="فريقنا" title="الوجوه خلف العمل" />
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {team.map((raw, index) => { const member = asObject(raw); const photo = typeof member.image === 'string' ? member.image : (typeof member.photo === 'string' ? member.photo : ''); return <Reveal key={index} delay={index * 70}><div className="site-card-lift rounded-2xl border p-6" style={{ background: 'var(--site-card)', borderColor: 'var(--site-border)' }} data-testid={`card-team-${index}`}>{photo ? <img src={photo} alt={text(member, ['name'], '')} loading="lazy" className="mb-4 size-14 rounded-full object-cover" /> : <div className="mb-4 flex size-14 items-center justify-center rounded-full font-serif text-xl font-bold" style={{ background: 'var(--site-soft)', color: 'var(--site-accent)' }}>{text(member, ['name'], 'ع')[0]}</div>}<h3 className="font-bold">{text(member, ['name'], '')}</h3><p className="mt-1 text-xs font-bold" style={{ color: 'var(--site-accent)' }}>{text(member, ['role', 'title'], '')}</p><p className="mt-3 text-sm leading-6" style={{ color: 'var(--site-muted)' }}>{text(member, ['bio', 'description'], '')}</p></div></Reveal>; })}
    </div>
  </section>;
}

export function TestimonialsSection({ testimonials }: { testimonials: Array<Json> }) {
  if (!testimonials.length) return null;
  // Every color here is derived from the site's own tokens (--site-ink /
  // --site-accent), so this panel always matches whatever brand color the
  // merchant picked instead of a fixed dark-green-and-gold palette.
  const panelBg = 'color-mix(in srgb, var(--site-ink) 94%, var(--site-accent) 6%)';
  const panelText = 'color-mix(in srgb, var(--site-bg) 92%, white 8%)';
  const panelMuted = 'color-mix(in srgb, var(--site-bg) 70%, var(--site-ink) 30%)';
  const gold = 'color-mix(in srgb, var(--site-accent) 65%, white 35%)';
  return <section className="px-5 py-16 md:px-10" style={{ background: panelBg, color: panelText }}>
    <div className="mx-auto max-w-6xl">
      <SectionHeading eyebrow="آراء العملاء" title="ماذا يقولون عنا" light />
      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((raw, index) => { const item = asObject(raw); return <Reveal key={index} delay={index * 80}><div className="site-card-lift relative overflow-hidden rounded-2xl border p-6" style={{ background: 'color-mix(in srgb, white 6%, transparent)', borderColor: 'color-mix(in srgb, white 12%, transparent)' }} data-testid={`card-testimonial-${index}`}><Quote size={40} className="pointer-events-none absolute -right-2 -top-2 opacity-[0.12]" style={{ color: gold }} /><Quote size={20} style={{ color: gold }} /><p className="relative mt-4 text-sm leading-7" style={{ color: panelMuted }}>{text(item, ['quote', 'text'], '')}</p><div className="relative mt-5 flex items-center gap-2"><div className="flex" style={{ color: gold }}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}</div><span className="text-sm font-bold">{text(item, ['name'], '')}</span></div></div></Reveal>; })}
      </div>
    </div>
  </section>;
}

export function FaqSection({ faq }: { faq: Array<Json> }) {
  if (!faq.length) return null;
  return <section className="mx-auto max-w-3xl px-5 py-16 md:px-10">
    <SectionHeading eyebrow="أسئلة متكررة" title="قد يدور في ذهنك" />
    <Reveal><Accordion type="single" collapsible className="rounded-2xl border px-6" style={{ background: 'var(--site-card)', borderColor: 'var(--site-border)' }}>
      {faq.map((raw, index) => { const item = asObject(raw); return <AccordionItem key={index} value={`faq-${index}`} data-testid={`row-faq-${index}`}><AccordionTrigger className="text-right font-bold">{text(item, ['question', 'q'], '')}</AccordionTrigger><AccordionContent className="text-sm leading-7" style={{ color: 'var(--site-muted)' }}>{text(item, ['answer', 'a'], '')}</AccordionContent></AccordionItem>; })}
    </Accordion></Reveal>
  </section>;
}

// --- Portfolio-only sections -------------------------------------------
// skills/experience/certifications only ever render for templateId==='portfolio'
// (see the callers) — every other template has no use for a résumé section.

export function SkillsSection({ skills }: { skills: Array<Json | string> }) {
  const names = skills
    .map((raw) => (typeof raw === 'string' ? raw : text(asObject(raw), ['name', 'title'], '')))
    .filter(Boolean);
  if (names.length === 0) return null;
  return <section className="mx-auto max-w-6xl px-5 py-16 md:px-10">
    <SectionHeading eyebrow="القدرات" title="المهارات" />
    <div className="flex flex-wrap gap-2.5">
      {names.map((name, index) => <Reveal key={index} delay={index * 40}>
        <span className="site-pill" data-testid={`chip-skill-${index}`}>{name}</span>
      </Reveal>)}
    </div>
  </section>;
}

export function ExperienceSection({ experience }: { experience: Array<Json> }) {
  if (!experience.length) return null;
  return <section className="px-5 py-16 md:px-10" style={{ background: 'var(--site-soft)' }}>
    <div className="mx-auto max-w-3xl">
      <SectionHeading eyebrow="المسيرة" title="الخبرات العملية" />
      <div className="relative border-r-2 pr-8" style={{ borderColor: 'var(--site-border)' }}>
        {experience.map((raw, index) => {
          const row = asObject(raw);
          const period = text(row, ['period', 'year', 'duration'], '');
          const description = text(row, ['description'], '');
          return <Reveal key={index} delay={index * 70}>
            <div className="relative pb-10 last:pb-0" data-testid={`row-experience-${index}`}>
              <span className="absolute top-1.5 size-3 rounded-full" style={{ background: 'var(--site-accent)', right: 'calc(-2rem - 5px)' }} />
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-serif text-lg font-bold">{text(row, ['role', 'title', 'position'], '')}</h3>
                {period && <span className="text-xs font-bold" style={{ color: 'var(--site-accent)' }}>{period}</span>}
              </div>
              <p className="text-sm font-bold" style={{ color: 'var(--site-muted)' }}>{text(row, ['company', 'organization'], '')}</p>
              {description && <p className="mt-2 text-sm leading-7" style={{ color: 'var(--site-muted)' }}>{description}</p>}
            </div>
          </Reveal>;
        })}
      </div>
    </div>
  </section>;
}

export function CertificationsSection({ certifications }: { certifications: Array<Json> }) {
  if (!certifications.length) return null;
  return <section className="mx-auto max-w-6xl px-5 py-16 md:px-10">
    <SectionHeading eyebrow="الاعتماد" title="الشهادات" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {certifications.map((raw, index) => {
        const row = asObject(raw);
        const meta = [text(row, ['issuer', 'organization'], ''), text(row, ['year'], '')].filter(Boolean).join(' · ');
        return <Reveal key={index} delay={index * 60}>
          <div className="site-card-lift flex items-start gap-3 rounded-2xl border p-5" style={{ background: 'var(--site-card)', borderColor: 'var(--site-border)' }} data-testid={`card-certification-${index}`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ background: 'var(--site-soft)', color: 'var(--site-accent)' }}><BadgeCheck size={18} /></span>
            <div>
              <h3 className="text-sm font-bold leading-5">{text(row, ['name', 'title'], '')}</h3>
              {meta && <p className="mt-1 text-xs" style={{ color: 'var(--site-muted)' }}>{meta}</p>}
            </div>
          </div>
        </Reveal>;
      })}
    </div>
  </section>;
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return <button onClick={onToggle} aria-label="تبديل المظهر" className="grid size-10 place-items-center rounded-full border transition hover:-translate-y-0.5" style={{ borderColor: 'var(--site-border)', color: 'var(--site-accent)' }} data-testid="button-theme-toggle">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>;
}

function SiteShell({ children, siteName, logo, contact, social, ctaLabel, dark, onToggleDark, showBranding }: { children: ReactNode; siteName: string; logo?: string; contact: Json; social: Json; ctaLabel: string; dark: boolean; onToggleDark: () => void; showBranding: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const whatsapp = typeof contact.whatsapp === 'string' && contact.whatsapp ? contact.whatsapp : (typeof contact.phone === 'string' ? contact.phone : '');
  const actionHref = whatsappUrl(whatsapp);
  const phoneHref = typeof contact.phone === 'string' && contact.phone ? `tel:${digitsOnly(contact.phone)}` : '#reach-us';
  const instagramHref = socialUrl('instagram', social.instagram) || '#reach-us';
  const platformUrl = (import.meta.env.VITE_FRONTEND_URL as string | undefined) || 'https://orxai.pages.dev';
  return <div dir="rtl" className="site-public-shell grain relative min-h-[100dvh] transition-colors duration-300" style={{ background: 'var(--site-bg)', color: 'var(--site-ink)' }}>
    <header className="site-header-glass sticky top-0 z-30 border-b transition-colors duration-300" style={{ borderColor: 'color-mix(in srgb, var(--site-border) 55%, transparent)' }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-10 md:py-5">
        <a href="#top" className="flex items-center gap-2 font-serif text-xl font-bold tracking-tight" data-testid="link-site-top">{logo && <img src={logo} alt={siteName} className="size-9 rounded-full object-cover" />}{siteName}</a>
        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex" style={{ color: 'var(--site-muted)' }}>
          <a href="#top" className="transition-colors hover:opacity-70" data-testid="link-site-about">عنّا</a>
          <a href="#reach-us" className="transition-colors hover:opacity-70" data-testid="link-site-contact">تواصل</a>
          <ThemeToggle dark={dark} onToggle={onToggleDark} />
          <a href={actionHref} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="site-btn-shine rounded-full px-4 py-2 text-white shadow-[0_6px_16px_-6px_var(--site-accent)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-6px_var(--site-accent)]" style={{ background: 'var(--site-accent)' }} data-testid="link-site-action">{ctaLabel}</a>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <button onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={menuOpen} className="grid size-10 place-items-center rounded-full border transition hover:-translate-y-0.5" style={{ borderColor: 'var(--site-border)', color: 'var(--site-ink)' }} data-testid="button-mobile-menu">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <ThemeToggle dark={dark} onToggle={onToggleDark} />
          <a href={actionHref} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="grid size-10 place-items-center rounded-full text-white transition hover:-translate-y-0.5" style={{ background: 'var(--site-accent)' }} data-testid="link-site-contact-mobile"><MessageCircle size={18} /></a>
        </div>
      </div>
    </header>
    {menuOpen && <div className="site-mobile-menu md:hidden">
      <a href="#top" onClick={() => setMenuOpen(false)} data-testid="link-mobile-home">الرئيسية</a>
      <a href="#reach-us" onClick={() => setMenuOpen(false)} data-testid="link-mobile-contact">تواصل معنا</a>
      <a href={actionHref} target={whatsapp ? '_blank' : undefined} rel="noreferrer" onClick={() => setMenuOpen(false)} className="site-mobile-menu-cta" style={{ background: 'var(--site-accent)', color: '#fff' }} data-testid="link-mobile-action">{ctaLabel}</a>
    </div>}
    {children}
    <a href={actionHref} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="site-floating-cta fixed bottom-5 right-5 z-20 inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white transition duration-300 md:bottom-7 md:right-7" style={{ background: 'var(--site-accent)' }} data-testid="link-floating-whatsapp">
      <MessageCircle size={17} />
      <span className="hidden sm:inline">{ctaLabel}</span>
    </a>
    <footer id="contact" className="mt-4 border-t px-5 py-12 md:px-10" style={{ borderColor: 'var(--site-border)', background: 'var(--site-soft)' }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div><p className="font-serif text-lg font-bold">{siteName}</p><p className="mt-2 text-sm" style={{ color: 'var(--site-muted)' }}>نصنع تجربة تستحق أن تُحكى.</p></div>
        <div className="flex gap-3">
          <a href={phoneHref} className="grid size-10 place-items-center rounded-full" style={{ background: 'var(--site-card)', color: 'var(--site-accent)' }} data-testid="link-site-phone"><Phone size={17} /></a>
          <a href={instagramHref} target={instagramHref !== '#reach-us' ? '_blank' : undefined} rel="noreferrer" className="grid size-10 place-items-center rounded-full" style={{ background: 'var(--site-card)', color: 'var(--site-accent)' }} data-testid="link-site-social"><Instagram size={17} /></a>
        </div>
      </div>
      {showBranding && <div className="mx-auto mt-9 max-w-6xl border-t pt-5" style={{ borderColor: 'var(--site-border)' }}>
        <a href={platformUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold opacity-60 transition-opacity hover:opacity-100" style={{ color: 'var(--site-muted)' }} data-testid="link-orxai-badge">
          <OrxaiMark monochrome className="h-3 w-auto" /> تم الإنشاء بواسطة orxai
        </a>
      </div>}
    </footer>
  </div>;
}

export function EmptyCollection({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed px-6 py-12 text-center text-sm" style={{ borderColor: 'var(--site-border)', background: 'var(--site-soft)', color: 'var(--site-muted)' }}>{label}</div>;
}

export type TemplateProps = { data: Json; siteName: string; dark: boolean; onToggleDark: () => void; showBranding: boolean };

// ---------------------------------------------------------------------------
// STORE — classic (grid catalogue) and modern (editorial mosaic) variants.
// ---------------------------------------------------------------------------
function StoreClassic({ data, siteName, dark, onToggleDark, showBranding }: TemplateProps) {
  const products = items(data, ['products', 'items', 'featuredProducts']);
  const extras = useSiteExtras(data);
  const whatsapp = typeof extras.contact.whatsapp === 'string' && extras.contact.whatsapp ? extras.contact.whatsapp : (typeof extras.contact.phone === 'string' ? extras.contact.phone : '');
  const productHref = (name: string) => whatsappUrl(whatsapp, `مرحباً، أريد طلب المنتج: ${name}`);
  return <SiteShell siteName={siteName} logo={extras.logo} contact={extras.contact} social={extras.social} ctaLabel={extras.ctaLabel} dark={dark} onToggleDark={onToggleDark} showBranding={showBranding}>
    <section id="top" className="relative mx-auto grid max-w-6xl gap-12 overflow-hidden px-5 pb-10 pt-10 md:grid-cols-[1.1fr_.9fr] md:items-center md:px-10 md:pb-20 md:pt-16">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-[0.08] blur-3xl [animation:site-float_7s_ease-in-out_infinite]" style={{ background: 'var(--site-accent)' }} />
      <Reveal>
        <span className="site-pill mb-5"><LiveDot color="var(--site-accent)" />مختارات اليوم</span>
        <h1 className="font-serif text-4xl font-bold leading-[1.45] md:text-6xl">{text(data, ['headline', 'title', 'heroTitle'], `أهلاً بك في ${siteName}`)}</h1>
        <p className="mt-6 max-w-lg text-lg leading-8" style={{ color: 'var(--site-muted)' }}>{text(data, ['description', 'intro', 'about'], 'منتجات نختارها بعناية، لتصل إليك كما تحب.')}</p>
        <a href="#products" className="site-btn-shine mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-white shadow-[0_10px_24px_-10px_var(--site-accent)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_var(--site-accent)]" style={{ background: 'var(--site-accent)' }} data-testid="link-store-products">تصفّح المنتجات <ArrowLeft size={17} /></a>
      </Reveal>
      <Reveal delay={150} className="site-hero-frame relative min-h-[340px] overflow-hidden rounded-[32px] p-5">
        {extras.heroImage ? <div className="site-shadow-lux relative h-full min-h-[300px] overflow-hidden rounded-[24px]">
          <HeroPhoto src={extras.heroImage} alt={siteName} className="h-full" imgClassName="" />
          <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-t from-black/45 via-black/0 to-black/0" />
          <div className="site-glass absolute right-5 top-5 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold" data-testid="text-hero-badge"><Star size={12} fill="var(--site-accent)" style={{ color: 'var(--site-accent)' }} /> {text(data, ['rating'], '4.9')} تقييم العملاء</div>
          <div className="absolute bottom-5 right-5 rounded-full px-4 py-2 text-sm font-bold backdrop-blur" style={{ background: 'color-mix(in srgb, var(--site-bg) 85%, transparent)', color: 'var(--site-ink)' }}>{siteName}</div>
        </div> : <div className="h-full w-full rounded-[32px]" style={{ background: 'linear-gradient(135deg, var(--site-soft), var(--site-card))' }}><div className="relative h-full"><div className="absolute inset-8 rounded-[24px] border" style={{ borderColor: 'var(--site-border)', background: 'color-mix(in srgb, var(--site-card) 60%, transparent)' }} /><div className="absolute right-12 top-12 size-28 rounded-full opacity-80 [animation:site-float_6s_ease-in-out_infinite]" style={{ background: 'var(--site-accent)' }} /><div className="absolute bottom-10 left-10 h-32 w-44 rounded-[28px] bg-[#d4bc98] opacity-80" /><div className="absolute bottom-16 right-20 text-sm font-bold" style={{ color: 'var(--site-bg)' }}>{siteName}</div></div></div>}
      </Reveal>
    </section>
    <section id="products" className="mx-auto max-w-6xl px-5 py-12 md:px-10">
      <div className="mb-7 flex items-end justify-between"><h2 className="font-serif text-2xl font-bold">المنتجات</h2><span className="text-xs" style={{ color: 'var(--site-muted)' }}>{products.length} منتجات</span></div>
       {products.length === 0 ? <EmptyCollection label="لم تتم إضافة منتجات بعد." /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((raw, index) => { const item = asObject(raw); const image = typeof item.image === 'string' ? item.image : ''; const name = text(item, ['name', 'title'], 'منتج'); return <Reveal key={index} delay={index * 60}><article className="group site-card-lift overflow-hidden rounded-2xl border p-3" style={{ background: 'var(--site-card)', borderColor: 'var(--site-border)' }} data-testid={`card-product-${index}`}><div className="relative h-40 overflow-hidden rounded-xl" style={{ background: 'var(--site-soft)' }}>{image ? <img src={image} alt={name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <div className="absolute bottom-4 right-4 size-16 rounded-full opacity-80 transition-transform group-hover:scale-110" style={{ background: 'var(--site-accent)' }} />}</div><div className="px-2 pb-2 pt-4"><h3 className="font-bold">{name}</h3>{text(item, ['description'], '') && <p className="mt-1 text-xs line-clamp-2" style={{ color: 'var(--site-muted)' }}>{text(item, ['description'], '')}</p>}<div className="mt-3 flex items-center justify-between gap-3 text-sm"><span className="font-bold" style={{ color: 'var(--site-accent)' }}>{money(item.price)}</span><a href={productHref(name)} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="site-btn-shine rounded-full px-3 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5" style={{ background: 'var(--site-accent)' }} data-testid={`link-product-${index}`}>اطلب الآن</a></div></div></article></Reveal>; })}</div>}
    </section>
    <ContactSection contact={extras.contact} social={extras.social} />
    <HoursSection hours={extras.hours} />
    <TeamSection team={extras.team} />
    <TestimonialsSection testimonials={extras.testimonials} />
    <FaqSection faq={extras.faq} />
  </SiteShell>;
}

function StoreModern({ data, siteName, dark, onToggleDark, showBranding }: TemplateProps) {
  const products = items(data, ['products', 'items', 'featuredProducts']);
  const extras = useSiteExtras(data);
  const whatsapp = typeof extras.contact.whatsapp === 'string' && extras.contact.whatsapp ? extras.contact.whatsapp : (typeof extras.contact.phone === 'string' ? extras.contact.phone : '');
  const productHref = (name: string) => whatsappUrl(whatsapp, `مرحباً، أريد طلب المنتج: ${name}`);
  return <SiteShell siteName={siteName} logo={extras.logo} contact={extras.contact} social={extras.social} ctaLabel={extras.ctaLabel} dark={dark} onToggleDark={onToggleDark} showBranding={showBranding}>
    <section id="top" className="mx-auto max-w-6xl px-5 pb-4 pt-8 md:px-10">
      <div className="overflow-hidden whitespace-nowrap rounded-full border py-2 text-sm font-bold" style={{ borderColor: 'var(--site-border)', color: 'var(--site-accent)' }}>
        <div className="inline-block [animation:site-marquee_18s_linear_infinite]">{Array.from({ length: 6 }).map((_, i) => <span key={i} className="mx-6">✦ {siteName} — {text(data, ['tagline'], 'جودة تستحق الثقة')}</span>)}</div>
      </div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-3 px-5 py-10 md:grid-cols-3 md:px-10">
      <Reveal className="md:col-span-2"><div className="site-shadow-lux flex h-full flex-col justify-center rounded-[32px] p-10" style={{ background: 'var(--site-soft)' }}>
        <span className="site-pill mb-5 w-fit"><LiveDot color="var(--site-accent)" />{text(data, ['tagline'], 'وصل حديثاً')}</span>
        <h1 className="font-serif text-4xl font-bold leading-[1.35] md:text-6xl">{text(data, ['headline', 'title', 'heroTitle'], `متجر ${siteName}`)}</h1>
        <p className="mt-5 max-w-md text-base leading-8" style={{ color: 'var(--site-muted)' }}>{text(data, ['description', 'intro', 'about'], 'قطع مختارة بعناية فائقة، لعميل يعرف ما يريد.')}</p>
        <a href="#products" className="site-btn-shine mt-7 inline-flex w-fit items-center gap-2 rounded-full px-5 py-3 font-bold text-white shadow-[0_10px_24px_-10px_var(--site-accent)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_var(--site-accent)]" style={{ background: 'var(--site-accent)' }} data-testid="link-store-products">تسوّق الآن <ArrowUpRight size={17} /></a>
      </div></Reveal>
      <Reveal delay={120} className="site-shadow-lux relative min-h-[220px] overflow-hidden rounded-[32px]">
        {extras.heroImage ? <><HeroPhoto src={extras.heroImage} alt={siteName} className="absolute inset-0 h-full" /><div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(160deg, color-mix(in srgb, var(--site-accent) 45%, transparent), transparent 65%)' }} /><div className="site-glass absolute right-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-bold">{products.length} قطعة</div></> : <div className="h-full min-h-[220px]" style={{ background: 'linear-gradient(160deg, var(--site-accent), var(--site-soft))' }} />}
      </Reveal>
    </section>
    <section id="products" className="mx-auto max-w-6xl px-5 py-10 md:px-10">
      <div className="mb-7 flex items-end justify-between"><h2 className="font-serif text-2xl font-bold">أحدث القطع</h2><span className="text-xs" style={{ color: 'var(--site-muted)' }}>{products.length} منتجات</span></div>
       {products.length === 0 ? <EmptyCollection label="لم تتم إضافة منتجات بعد." /> : <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">{products.map((raw, index) => { const item = asObject(raw); const tall = index % 3 === 0; const image = typeof item.image === 'string' ? item.image : ''; const name = text(item, ['name', 'title'], 'منتج'); return <Reveal key={index} delay={index * 50}><article className="group site-card-lift overflow-hidden rounded-2xl border" style={{ background: 'var(--site-card)', borderColor: 'var(--site-border)' }} data-testid={`card-product-${index}`}><div className="overflow-hidden">{image ? <img src={image} alt={name} loading="lazy" className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${tall ? 'h-52' : 'h-32'}`} /> : <div className={`transition-transform duration-500 group-hover:scale-105 ${tall ? 'h-52' : 'h-32'}`} style={{ background: 'var(--site-soft)' }} />}</div><div className="p-4"><span className="text-[10px] font-bold" style={{ color: 'var(--site-accent)' }}>{String(index + 1).padStart(2, '0')}</span><h3 className="mt-1 font-bold">{name}</h3><div className="mt-3 flex items-center justify-between gap-3 text-sm"><span className="font-bold" style={{ color: 'var(--site-accent)' }}>{money(item.price)}</span><a href={productHref(name)} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="site-btn-shine rounded-full px-3 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5" style={{ background: 'var(--site-accent)' }}>اطلب الآن</a></div></div></article></Reveal>; })}</div>}
    </section>
    <ContactSection contact={extras.contact} social={extras.social} />
    <HoursSection hours={extras.hours} />
    <TeamSection team={extras.team} />
    <TestimonialsSection testimonials={extras.testimonials} />
    <FaqSection faq={extras.faq} />
  </SiteShell>;
}

// ---------------------------------------------------------------------------
// RESTAURANT — classic (dark bistro) and modern (light editorial) variants.
// ---------------------------------------------------------------------------
function RestaurantClassic({ data, siteName, dark, onToggleDark, showBranding }: TemplateProps) {
  const menu = items(data, ['menu', 'menuItems', 'items']);
  const extras = useSiteExtras(data);
  const whatsapp = typeof extras.contact.whatsapp === 'string' && extras.contact.whatsapp ? extras.contact.whatsapp : (typeof extras.contact.phone === 'string' ? extras.contact.phone : '');
  const orderHref = (name: string) => whatsappUrl(whatsapp, `مرحباً، أريد طلب المنتج: ${name}`);
  // Every color on this hero is derived from --site-ink/--site-accent so it
  // always matches whatever brand color the merchant picked, instead of a
  // fixed dark-green-and-gold palette.
  const heroBg = 'color-mix(in srgb, var(--site-ink) 92%, var(--site-accent) 8%)';
  const heroText = 'color-mix(in srgb, var(--site-bg) 92%, white 8%)';
  const heroMuted = 'color-mix(in srgb, var(--site-bg) 72%, var(--site-ink) 28%)';
  const gold = 'color-mix(in srgb, var(--site-accent) 65%, white 35%)';
  return <SiteShell siteName={siteName} logo={extras.logo} contact={extras.contact} social={extras.social} ctaLabel={extras.ctaLabel} dark={dark} onToggleDark={onToggleDark} showBranding={showBranding}>
    <section id="top" className="relative overflow-hidden px-5 py-20 md:px-10 md:py-28" style={{ background: heroBg, color: heroText }}>
      {extras.heroImage && <>
        <img src={extras.heroImage} alt={siteName} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-50 [animation:site-kenburns_20s_ease-in-out_infinite_alternate]" data-testid="img-hero" />
        <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(0deg, ${heroBg} 8%, color-mix(in srgb, ${heroBg} 55%, transparent) 55%, color-mix(in srgb, ${heroBg} 15%, transparent) 100%)` }} />
      </>}
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <span className="site-pill mb-6" style={{ background: 'color-mix(in srgb, var(--site-accent) 22%, transparent)', borderColor: 'color-mix(in srgb, var(--site-accent) 40%, transparent)', color: gold }}><LiveDot color={gold} />{text(data, ['eyebrow', 'tagline'], 'من مطبخنا إلى مائدتكم')}</span>
          <h1 className="max-w-3xl font-serif text-5xl font-bold leading-[1.35] md:text-7xl">{text(data, ['headline', 'title', 'heroTitle'], `نكهة ${siteName}`)}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8" style={{ color: heroMuted }}>{text(data, ['description', 'intro', 'about'], 'أطباق صادقة، مكونات طازجة، ووقت جميل حول الطاولة.')}</p>
          <div className="mt-9 flex flex-wrap gap-3"><a href="#menu" className="site-btn-shine rounded-xl px-5 py-3 font-bold text-white shadow-[0_10px_24px_-10px_var(--site-accent)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_var(--site-accent)]" style={{ background: 'var(--site-accent)' }} data-testid="link-restaurant-menu">شاهد القائمة</a><a href="#reach-us" className="rounded-xl border border-white/25 px-5 py-3 font-bold backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/10" data-testid="link-restaurant-reserve">احجز طاولتك</a></div>
        </Reveal>
      </div>
    </section>
    <section id="menu" className="mx-auto max-w-6xl px-5 py-16 md:px-10">
      <div className="mb-8 flex items-end justify-between"><div><p className="mb-2 text-xs font-bold" style={{ color: 'var(--site-accent)' }}>القائمة</p><h2 className="font-serif text-3xl font-bold">ما يشتهي القلب</h2></div><Clock3 size={25} style={{ color: 'var(--site-muted)' }} /></div>
       {menu.length === 0 ? <EmptyCollection label="لم تتم إضافة عناصر القائمة بعد." /> : <div className="grid gap-x-12 md:grid-cols-2">{menu.map((raw, index) => { const item = asObject(raw); const name = text(item, ['name', 'title'], 'طبق'); return <Reveal key={index} delay={index * 40}><div className="flex items-start justify-between gap-5 border-b py-5" style={{ borderColor: 'var(--site-border)' }} data-testid={`row-menu-${index}`}><div><h3 className="font-bold">{name}</h3><p className="mt-1 text-sm" style={{ color: 'var(--site-muted)' }}>{text(item, ['description', 'details'], '')}</p></div><div className="flex shrink-0 flex-col items-end gap-2"><span className="font-bold" style={{ color: 'var(--site-accent)' }}>{money(item.price)}</span><a href={orderHref(name)} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="text-xs font-bold underline underline-offset-4" data-testid={`link-menu-item-${index}`}>اطلب الآن</a></div></div></Reveal>; })}</div>}
    </section>
    <ContactSection contact={extras.contact} social={extras.social} />
    <HoursSection hours={extras.hours} />
    <TeamSection team={extras.team} />
    <TestimonialsSection testimonials={extras.testimonials} />
    <FaqSection faq={extras.faq} />
  </SiteShell>;
}

function RestaurantModern({ data, siteName, dark, onToggleDark, showBranding }: TemplateProps) {
  const menu = items(data, ['menu', 'menuItems', 'items']);
  const extras = useSiteExtras(data);
  const whatsapp = typeof extras.contact.whatsapp === 'string' && extras.contact.whatsapp ? extras.contact.whatsapp : (typeof extras.contact.phone === 'string' ? extras.contact.phone : '');
  const orderHref = (name: string) => whatsappUrl(whatsapp, `مرحباً، أريد طلب المنتج: ${name}`);
  return <SiteShell siteName={siteName} logo={extras.logo} contact={extras.contact} social={extras.social} ctaLabel={extras.ctaLabel} dark={dark} onToggleDark={onToggleDark} showBranding={showBranding}>
    <section id="top" className="mx-auto max-w-6xl px-5 pt-14 md:px-10">
      {extras.heroImage ? <Reveal className="relative"><HeroPhoto src={extras.heroImage} alt={siteName} className="site-shadow-lux mx-auto h-64 max-w-4xl md:h-[26rem]" /><div className="site-glass absolute right-1/2 top-5 flex translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold md:right-[15%] md:translate-x-0"><Star size={12} fill="var(--site-accent)" style={{ color: 'var(--site-accent)' }} /> {text(data, ['rating'], '4.8')} · {text(data, ['reviewsCount', 'reviews'], '120+ تقييم')}</div></Reveal> : <Reveal><p className="text-center font-serif text-8xl font-bold opacity-10 md:text-[10rem]">{siteName[0]}</p></Reveal>}
      <Reveal delay={100} className={extras.heroImage ? 'mt-10 text-center' : '-mt-14 text-center md:-mt-24'}>
        <span className="site-pill mx-auto mb-5"><LiveDot color="var(--site-accent)" />{text(data, ['eyebrow', 'tagline'], 'مفتوح الآن')}</span>
        <h1 className="font-serif text-4xl font-bold leading-[1.3] md:text-6xl">{text(data, ['headline', 'title', 'heroTitle'], `مطعم ${siteName}`)}</h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-8" style={{ color: 'var(--site-muted)' }}>{text(data, ['description', 'intro', 'about'], 'تجربة طعام هادئة، بمذاق لا يُنسى.')}</p>
        <a href="#menu" className="site-btn-shine mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-white shadow-[0_10px_24px_-10px_var(--site-accent)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_var(--site-accent)]" style={{ background: 'var(--site-accent)' }} data-testid="link-restaurant-menu">القائمة كاملة</a>
      </Reveal>
    </section>
    <section id="menu" className="mx-auto max-w-4xl px-5 py-16 md:px-10">
      <SectionHeading eyebrow="القائمة" title="مختارات الشيف" />
       {menu.length === 0 ? <EmptyCollection label="لم تتم إضافة عناصر القائمة بعد." /> : <div className="space-y-3">{menu.map((raw, index) => { const item = asObject(raw); const name = text(item, ['name', 'title'], 'طبق'); return <Reveal key={index} delay={index * 40}><div className="flex items-center gap-5 rounded-2xl border p-5" style={{ background: 'var(--site-card)', borderColor: 'var(--site-border)' }} data-testid={`row-menu-${index}`}><span className="font-serif text-2xl font-bold" style={{ color: 'var(--site-accent)' }}>{String(index + 1).padStart(2, '0')}</span><div className="flex-1"><h3 className="font-bold">{name}</h3><p className="mt-1 text-sm" style={{ color: 'var(--site-muted)' }}>{text(item, ['description', 'details'], '')}</p></div><div className="flex shrink-0 flex-col items-end gap-2"><span className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: 'var(--site-soft)', color: 'var(--site-accent)' }}>{money(item.price)}</span><a href={orderHref(name)} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="text-xs font-bold underline underline-offset-4" data-testid={`link-menu-item-${index}`}>اطلب الآن</a></div></div></Reveal>; })}</div>}
    </section>
    <ContactSection contact={extras.contact} social={extras.social} />
    <HoursSection hours={extras.hours} />
    <TeamSection team={extras.team} />
    <TestimonialsSection testimonials={extras.testimonials} />
    <FaqSection faq={extras.faq} />
  </SiteShell>;
}

// ---------------------------------------------------------------------------
// SERVICES — classic (card grid) and modern (numbered process/bento) variants.
// ---------------------------------------------------------------------------
function ServicesClassic({ data, siteName, dark, onToggleDark, showBranding }: TemplateProps) {
  const services = items(data, ['services', 'offerings', 'items']);
  const extras = useSiteExtras(data);
  const whatsapp = typeof extras.contact.whatsapp === 'string' && extras.contact.whatsapp ? extras.contact.whatsapp : (typeof extras.contact.phone === 'string' ? extras.contact.phone : '');
  const serviceHref = (name: string) => whatsappUrl(whatsapp, `مرحباً، أريد الاستفسار عن الخدمة: ${name}`);
  return <SiteShell siteName={siteName} logo={extras.logo} contact={extras.contact} social={extras.social} ctaLabel={extras.ctaLabel} dark={dark} onToggleDark={onToggleDark} showBranding={showBranding}>
    <section id="top" className="mx-auto max-w-6xl px-5 pb-14 pt-14 md:px-10 md:pb-24 md:pt-24">
      <Reveal className="max-w-3xl">
        <span className="site-pill mb-6"><LiveDot color="var(--site-accent)" />نعمل معك من الفكرة إلى الأثر</span>
        <h1 className="font-serif text-5xl font-bold leading-[1.35] md:text-7xl">{text(data, ['headline', 'title', 'heroTitle'], `${siteName} ينجزها معك`)}</h1>
        <p className="mt-7 max-w-2xl text-lg leading-9" style={{ color: 'var(--site-muted)' }}>{text(data, ['description', 'intro', 'about'], 'خدمات عملية مصممة لتجعل يومك أسهل ونتيجتك أوضح.')}</p>
        <a href="#services" className="site-btn-shine mt-9 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-white shadow-[0_10px_24px_-10px_var(--site-accent)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_var(--site-accent)]" style={{ background: 'var(--site-accent)' }} data-testid="link-services-list">استكشف خدماتنا <ArrowLeft size={17} /></a>
      </Reveal>
      {extras.heroImage && <Reveal delay={160} className="mt-12"><HeroPhoto src={extras.heroImage} alt={siteName} className="site-shadow-lux h-56 md:h-96" /></Reveal>}
    </section>
    <section id="services" className="px-5 py-16 md:px-10" style={{ background: 'var(--site-soft)' }}>
      <div className="mx-auto max-w-6xl">
        <h2 className="font-serif text-3xl font-bold">كيف نساعدك؟</h2>
        {services.length === 0 ? <EmptyCollection label="لم تتم إضافة الخدمات بعد." /> : <div className="mt-9 grid gap-4 md:grid-cols-2">{services.map((raw, index) => { const item = asObject(raw); const name = text(item, ['name', 'title'], 'خدمة'); return <Reveal key={index} delay={index * 60}><article className="group site-card-lift rounded-2xl border p-6" style={{ background: 'var(--site-card)', borderColor: 'var(--site-border)' }} data-testid={`card-service-${index}`}><span className="font-mono text-xs font-bold" style={{ color: 'var(--site-accent)' }}>0{index + 1}</span><h3 className="mt-10 font-serif text-xl font-bold">{name}</h3><p className="mt-3 text-sm leading-7" style={{ color: 'var(--site-muted)' }}>{text(item, ['description', 'details'], '')}</p><div className="mt-6 flex items-center justify-between"><ArrowLeft className="transition-transform group-hover:-translate-x-1" style={{ color: 'var(--site-accent)' }} size={17} /><a href={serviceHref(name)} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="site-btn-shine rounded-full px-3 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5" style={{ background: 'var(--site-accent)' }} data-testid={`link-service-${index}`}>احجز الآن</a></div></article></Reveal>; })}</div>}
      </div>
    </section>
    <TeamSection team={extras.team} />
    <TestimonialsSection testimonials={extras.testimonials} />
    <ContactSection contact={extras.contact} social={extras.social} />
    <HoursSection hours={extras.hours} />
    <FaqSection faq={extras.faq} />
  </SiteShell>;
}

function ServicesModern({ data, siteName, dark, onToggleDark, showBranding }: TemplateProps) {
  const services = items(data, ['services', 'offerings', 'items']);
  const extras = useSiteExtras(data);
  const whatsapp = typeof extras.contact.whatsapp === 'string' && extras.contact.whatsapp ? extras.contact.whatsapp : (typeof extras.contact.phone === 'string' ? extras.contact.phone : '');
  const serviceHref = (name: string) => whatsappUrl(whatsapp, `مرحباً، أريد الاستفسار عن الخدمة: ${name}`);
  return <SiteShell siteName={siteName} logo={extras.logo} contact={extras.contact} social={extras.social} ctaLabel={extras.ctaLabel} dark={dark} onToggleDark={onToggleDark} showBranding={showBranding}>
    <section id="top" className="mx-auto max-w-6xl px-5 pb-8 pt-14 text-center md:px-10 md:pt-20">
      <Reveal>
        <span className="site-pill mx-auto mb-6"><LiveDot color="var(--site-accent)" />{text(data, ['eyebrow', 'tagline'], 'جاهزون لاستقبال مشروعك')}</span>
        <h1 className="mx-auto max-w-3xl font-serif text-4xl font-bold leading-[1.4] md:text-6xl">{text(data, ['headline', 'title', 'heroTitle'], `${siteName}، شريكك في التنفيذ`)}</h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-8" style={{ color: 'var(--site-muted)' }}>{text(data, ['description', 'intro', 'about'], 'نحوّل الأفكار إلى نتائج ملموسة، بخطوات واضحة.')}</p>
      </Reveal>
      {extras.heroImage && <Reveal delay={150} className="mt-10"><HeroPhoto src={extras.heroImage} alt={siteName} className="site-shadow-lux mx-auto h-56 max-w-4xl md:h-96" /></Reveal>}
    </section>
    <section id="services" className="mx-auto max-w-6xl px-5 py-10 md:px-10">
      {services.length === 0 ? <EmptyCollection label="لم تتم إضافة الخدمات بعد." /> : <div className="grid gap-4 md:grid-cols-4">
         {services.map((raw, index) => { const item = asObject(raw); const wide = index === 0; const name = text(item, ['name', 'title'], 'خدمة'); return <Reveal key={index} delay={index * 70} className={wide ? 'md:col-span-2 md:row-span-2' : ''}><article className="group site-card-lift flex h-full flex-col justify-between rounded-3xl border p-6" style={{ background: index % 2 === 0 ? 'var(--site-soft)' : 'var(--site-card)', borderColor: 'var(--site-border)' }} data-testid={`card-service-${index}`}><div className="flex items-start justify-between"><span className="font-serif text-3xl font-bold transition-transform duration-500 group-hover:-translate-y-1" style={{ color: 'var(--site-accent)' }}>{String(index + 1).padStart(2, '0')}</span><ArrowLeft size={17} className="opacity-0 transition-all duration-500 group-hover:-translate-x-1 group-hover:opacity-100" style={{ color: 'var(--site-accent)' }} /></div><div className="mt-6"><h3 className="font-bold">{name}</h3><p className="mt-2 text-sm leading-7" style={{ color: 'var(--site-muted)' }}>{text(item, ['description', 'details'], '')}</p><a href={serviceHref(name)} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="site-btn-shine mt-5 inline-flex rounded-full px-3 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5" style={{ background: 'var(--site-accent)' }} data-testid={`link-service-${index}`}>احجز الآن</a></div></article></Reveal>; })}
      </div>}
    </section>
    <TeamSection team={extras.team} />
    <TestimonialsSection testimonials={extras.testimonials} />
    <ContactSection contact={extras.contact} social={extras.social} />
    <HoursSection hours={extras.hours} />
    <FaqSection faq={extras.faq} />
  </SiteShell>;
}

// ---------------------------------------------------------------------------
// PORTFOLIO — classic (bento gallery) and modern (stacked editorial) variants.
// ---------------------------------------------------------------------------
function PortfolioClassic({ data, siteName, dark, onToggleDark, showBranding }: TemplateProps) {
  const projects = items(data, ['projects', 'work', 'items']);
  const extras = useSiteExtras(data);
  return <SiteShell siteName={siteName} logo={extras.logo} contact={extras.contact} social={extras.social} ctaLabel={extras.ctaLabel} dark={dark} onToggleDark={onToggleDark} showBranding={showBranding}>
    <section id="top" className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 md:px-10 md:pb-28 md:pt-24">
      <Reveal>
        <span className="site-pill mb-6"><LiveDot color="var(--site-accent)" />{text(data, ['eyebrow', 'tagline'], 'متاح لعمل جديد')}</span>
        <h1 className="max-w-4xl font-serif text-5xl font-bold leading-[1.3] md:text-7xl">{text(data, ['headline', 'title', 'heroTitle'], `هذا هو ${siteName}`)}</h1>
        <p className="mt-7 max-w-xl text-lg leading-8" style={{ color: 'var(--site-muted)' }}>{text(data, ['description', 'intro', 'about'], 'أصنع أشياء جميلة، مفيدة، وتبقى في الذاكرة.')}</p>
      </Reveal>
      {extras.heroImage && <Reveal delay={160} className="relative mt-12">
        <HeroPhoto src={extras.heroImage} alt={siteName} className="site-shadow-lux h-64 md:h-[26rem]" />
        <div className="site-glass site-shadow-lux absolute -bottom-6 right-6 max-w-xs rounded-2xl p-5 md:right-10" data-testid="card-hero-quote">
          <div className="flex" style={{ color: 'var(--site-accent)' }}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}</div>
          <p className="mt-2 text-sm font-bold leading-6">{text(data, ['quote', 'heroQuote'], 'تجربة عمل احترافية بحس فني عالٍ.')}</p>
        </div>
      </Reveal>}
    </section>
    <section id="projects" className="mx-auto max-w-6xl px-5 pt-10 md:px-10 md:pt-16">
      {projects.length === 0 ? <EmptyCollection label="لم تتم إضافة أعمال بعد." /> : <div className="grid gap-4 md:grid-cols-12">{projects.map((raw, index) => { const item = asObject(raw); const image = typeof item.image === 'string' ? item.image : ''; return <Reveal key={index} delay={index * 70} className={index === 0 ? 'md:col-span-7 md:row-span-2' : 'md:col-span-5'}><article className="group relative overflow-hidden rounded-3xl" style={{ background: 'var(--site-soft)', padding: '1.25rem' }} data-testid={`card-project-${index}`}>{image ? <img src={image} alt={text(item, ['name', 'title'], '')} loading="lazy" className={`w-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-[1.02] ${index === 0 ? 'h-72 md:h-full md:min-h-[440px]' : 'h-44'}`} /> : <div className={`rounded-2xl transition-transform duration-500 group-hover:scale-[1.02] ${index === 0 ? 'h-72 md:h-full md:min-h-[440px]' : 'h-44'}`} style={{ background: 'color-mix(in srgb, var(--site-accent) 16%, transparent)' }} />}<div className="absolute bottom-8 left-8 right-8"><span className="text-xs font-bold opacity-80">{text(item, ['category', 'type'], 'مشروع')}</span><h3 className="mt-1 font-serif text-xl font-bold">{text(item, ['name', 'title'], 'عمل')}</h3></div></article></Reveal>; })}</div>}
    </section>
    <TeamSection team={extras.team} />
    <SkillsSection skills={extras.skills} />
    <ExperienceSection experience={extras.experience} />
    <CertificationsSection certifications={extras.certifications} />
    <TestimonialsSection testimonials={extras.testimonials} />
    <ContactSection contact={extras.contact} social={extras.social} />
    <HoursSection hours={extras.hours} />
    <FaqSection faq={extras.faq} />
  </SiteShell>;
}

function PortfolioModern({ data, siteName, dark, onToggleDark, showBranding }: TemplateProps) {
  const projects = items(data, ['projects', 'work', 'items']);
  const extras = useSiteExtras(data);
  return <SiteShell siteName={siteName} logo={extras.logo} contact={extras.contact} social={extras.social} ctaLabel={extras.ctaLabel} dark={dark} onToggleDark={onToggleDark} showBranding={showBranding}>
    <section id="top" className="relative mx-auto max-w-6xl px-5 pb-10 pt-16 md:px-10">
      <Reveal>
        <span className="site-pill mb-6"><LiveDot color="var(--site-accent)" />{text(data, ['eyebrow', 'tagline'], 'متاح لعمل جديد')}</span>
        <h1 className="font-serif text-5xl font-bold leading-[1.25] md:text-8xl">{text(data, ['headline', 'title', 'heroTitle'], siteName)}</h1>
        <p className="mt-6 max-w-lg text-lg leading-8" style={{ color: 'var(--site-muted)' }}>{text(data, ['description', 'intro', 'about'], 'أصنع أشياء جميلة، مفيدة، وتبقى في الذاكرة.')}</p>
      </Reveal>
      {extras.heroImage && <Reveal delay={150} className="relative mt-10">
        <HeroPhoto src={extras.heroImage} alt={siteName} className="site-shadow-lux h-56 md:h-96" />
        <div className="site-glass site-shadow-lux absolute -bottom-5 right-6 flex items-center gap-3 rounded-2xl px-5 py-3.5 md:right-10" data-testid="card-hero-stat">
          <span className="font-serif text-2xl font-bold" style={{ color: 'var(--site-accent)' }}>{text(data, ['projectsCount', 'stat'], `+${Math.max(projects.length, 12)}`)}</span>
          <span className="text-xs font-bold leading-4" style={{ color: 'var(--site-muted)' }}>مشروع<br />منجز بنجاح</span>
        </div>
      </Reveal>}
    </section>
    <section id="projects" className="mx-auto max-w-6xl divide-y px-5 pt-10 md:px-10 md:pt-16" style={{ borderColor: 'var(--site-border)' }}>
      {projects.length === 0 ? <EmptyCollection label="لم تتم إضافة أعمال بعد." /> : projects.map((raw, index) => { const item = asObject(raw); return <Reveal key={index} delay={index * 60}><div className="group flex items-center justify-between gap-6 border-t py-8" style={{ borderColor: 'var(--site-border)' }} data-testid={`card-project-${index}`}><div className="flex items-center gap-6"><span className="font-serif text-3xl font-bold opacity-30 transition-all duration-500 group-hover:opacity-100" style={{ color: 'var(--site-accent)' }}>{String(index + 1).padStart(2, '0')}</span><div><h3 className="font-serif text-2xl font-bold transition-transform duration-500 group-hover:-translate-x-1">{text(item, ['name', 'title'], 'عمل')}</h3><span className="text-sm" style={{ color: 'var(--site-muted)' }}>{text(item, ['category', 'type'], 'مشروع')}</span></div></div><ArrowUpRight className="shrink-0 transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:translate-x-1" style={{ color: 'var(--site-accent)' }} /></div></Reveal>; })}
    </section>
    <TeamSection team={extras.team} />
    <SkillsSection skills={extras.skills} />
    <ExperienceSection experience={extras.experience} />
    <CertificationsSection certifications={extras.certifications} />
    <TestimonialsSection testimonials={extras.testimonials} />
    <ContactSection contact={extras.contact} social={extras.social} />
    <HoursSection hours={extras.hours} />
    <FaqSection faq={extras.faq} />
  </SiteShell>;
}

// ---------------------------------------------------------------------------
// BOOKING — appointment-based businesses (clinics, salons, consultants).
// One deliberate design, not classic/modern: a bookable-services agenda
// (each row deep-links to WhatsApp with the service name pre-filled), a
// "how it works" flow, and working hours given real prominence since
// appointments live and die by them. Every animation here comes from the
// same shared system (Reveal, site-card-lift, site-btn-shine) as the other
// seven templates, so it never looks like a bolted-on 9th thing.
// ---------------------------------------------------------------------------
function BookingTemplate({ data, siteName, dark, onToggleDark, showBranding }: TemplateProps) {
  const services = items(data, ['services', 'offerings', 'items']);
  const steps = items(data, ['process', 'steps']);
  const extras = useSiteExtras(data);
  const whatsapp = typeof extras.contact.whatsapp === 'string' && extras.contact.whatsapp ? extras.contact.whatsapp : (typeof extras.contact.phone === 'string' ? extras.contact.phone : '');
  const bookHref = (label: string) => whatsapp ? `https://wa.me/${digitsOnly(whatsapp).replace(/^\+/, '')}?text=${encodeURIComponent(`أرغب بحجز موعد: ${label}`)}` : '#reach-us';
  const defaultSteps: Json[] = [
    { title: 'اختر الخدمة', description: 'تصفّح قائمة الخدمات وحدد ما يناسبك.' },
    { title: 'اختر الوقت', description: 'راجع ساعات العمل واختر الموعد الأنسب لك.' },
    { title: 'أكّد عبر واتساب', description: 'أرسل رسالة سريعة ونؤكد لك الحجز فوراً.' },
  ];
  const processSteps: Json[] = (steps.length ? steps : defaultSteps) as Json[];
  return <SiteShell siteName={siteName} logo={extras.logo} contact={extras.contact} social={extras.social} ctaLabel={extras.ctaLabel} dark={dark} onToggleDark={onToggleDark} showBranding={showBranding}>
    <section id="top" className="relative mx-auto grid max-w-6xl gap-12 overflow-hidden px-5 pb-10 pt-10 md:grid-cols-[1.05fr_.95fr] md:items-center md:px-10 md:pb-20 md:pt-16">
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full opacity-[0.08] blur-3xl [animation:site-float_7s_ease-in-out_infinite]" style={{ background: 'var(--site-accent)' }} />
      <Reveal>
        <span className="site-pill mb-5"><LiveDot color="var(--site-accent)" /><CalendarCheck size={14} /> احجز موعدك في دقيقة واحدة</span>
        <h1 className="font-serif text-4xl font-bold leading-[1.45] md:text-6xl">{text(data, ['headline', 'title', 'heroTitle'], `احجز موعدك في ${siteName}`)}</h1>
        <p className="mt-6 max-w-lg text-lg leading-8" style={{ color: 'var(--site-muted)' }}>{text(data, ['description', 'intro', 'about'], 'مواعيد مرنة وخدمة نثق بها — احجز الآن وسنكون بانتظارك.')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={bookHref(siteName)} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="site-btn-shine inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-white shadow-[0_10px_24px_-10px_var(--site-accent)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_var(--site-accent)]" style={{ background: 'var(--site-accent)' }} data-testid="link-booking-cta">احجز الآن <ArrowLeft size={17} /></a>
          <a href="#services" className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold transition hover:-translate-y-0.5" style={{ borderColor: 'var(--site-border)' }} data-testid="link-booking-services">تصفّح الخدمات</a>
        </div>
      </Reveal>
      {extras.heroImage ? <Reveal delay={150}><HeroPhoto src={extras.heroImage} alt={siteName} className="site-shadow-lux h-72 md:h-[420px]" /></Reveal>
        : <Reveal delay={150} className="relative min-h-[300px] overflow-hidden rounded-[32px]"><div className="h-full w-full rounded-[32px]" style={{ background: 'linear-gradient(135deg, var(--site-soft), var(--site-card))' }}><div className="relative h-full min-h-[300px]"><div className="absolute inset-8 rounded-[24px] border" style={{ borderColor: 'var(--site-border)', background: 'color-mix(in srgb, var(--site-card) 60%, transparent)' }} /><div className="absolute right-12 top-12 size-24 rounded-full opacity-80 [animation:site-float_6s_ease-in-out_infinite]" style={{ background: 'var(--site-accent)' }} /><div className="absolute bottom-12 left-12 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: 'var(--site-card)', color: 'var(--site-ink)' }}><BadgeCheck size={16} style={{ color: 'var(--site-accent)' }} /> حجوزات موثوقة</div></div></div></Reveal>}
    </section>
    <section className="mx-auto max-w-6xl px-5 pb-4 md:px-10">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: CalendarCheck, title: 'مواعيد مرنة', body: 'اختر الوقت الذي يناسب جدولك.' },
          { icon: BadgeCheck, title: 'تأكيد فوري', body: 'تأكيد الحجز مباشرة عبر واتساب.' },
          { icon: Users, title: 'خبرة موثوقة', body: 'فريق متمرّس يهتم بتفاصيل تجربتك.' },
        ].map(({ icon: Icon, title, body }, index) => <Reveal key={title} delay={index * 70}><div className="site-card-lift rounded-2xl border p-5" style={{ background: 'var(--site-card)', borderColor: 'var(--site-border)' }} data-testid={`card-value-${index}`}><span className="grid size-10 place-items-center rounded-xl" style={{ background: 'var(--site-soft)', color: 'var(--site-accent)' }}><Icon size={18} /></span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-1 text-sm leading-7" style={{ color: 'var(--site-muted)' }}>{body}</p></div></Reveal>)}
      </div>
    </section>
    <section id="services" className="px-5 py-16 md:px-10">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="الخدمات القابلة للحجز" title="اختر خدمتك" />
        {services.length === 0 ? <EmptyCollection label="لم تتم إضافة خدمات بعد." /> : <div className="space-y-3">
          {services.map((raw, index) => { const item = asObject(raw); const duration = text(item, ['duration', 'time'], ''); return <Reveal key={index} delay={index * 60}><div className="site-card-lift flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between" style={{ background: 'var(--site-card)', borderColor: 'var(--site-border)' }} data-testid={`card-booking-service-${index}`}>
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full font-serif text-sm font-bold" style={{ background: 'var(--site-soft)', color: 'var(--site-accent)' }}>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="font-bold">{text(item, ['name', 'title'], 'خدمة')}</h3>
                {text(item, ['description', 'details'], '') && <p className="mt-1 text-sm leading-6" style={{ color: 'var(--site-muted)' }}>{text(item, ['description', 'details'], '')}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold" style={{ color: 'var(--site-muted)' }}>
                  {duration && <span className="flex items-center gap-1"><Clock3 size={13} /> {duration}</span>}
                  <span style={{ color: 'var(--site-accent)' }}>{money(item.price)}</span>
                </div>
              </div>
            </div>
            <a href={bookHref(text(item, ['name', 'title'], 'خدمة'))} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="site-btn-shine inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5" style={{ background: 'var(--site-accent)' }} data-testid={`link-book-service-${index}`}>احجز الآن</a>
          </div></Reveal>; })}
        </div>}
      </div>
    </section>
    <section className="px-5 py-16 md:px-10" style={{ background: 'var(--site-soft)' }}>
      <div className="mx-auto max-w-5xl">
        <SectionHeading eyebrow="خطوات بسيطة" title="كيف تحجز موعدك؟" />
        <div className="grid gap-6 sm:grid-cols-3">
          {processSteps.slice(0, 4).map((raw, index) => { const step = asObject(raw); return <Reveal key={index} delay={index * 80}><div className="rounded-2xl border p-6" style={{ background: 'var(--site-card)', borderColor: 'var(--site-border)' }} data-testid={`card-step-${index}`}><span className="font-serif text-3xl font-bold opacity-30" style={{ color: 'var(--site-accent)' }}>{String(index + 1).padStart(2, '0')}</span><h3 className="mt-4 font-bold">{text(step, ['title', 'name'], '')}</h3><p className="mt-2 text-sm leading-7" style={{ color: 'var(--site-muted)' }}>{text(step, ['description', 'details'], '')}</p></div></Reveal>; })}
        </div>
      </div>
    </section>
    <HoursSection hours={extras.hours} />
    <TeamSection team={extras.team} />
    <TestimonialsSection testimonials={extras.testimonials} />
    <ContactSection contact={extras.contact} social={extras.social} />
    <FaqSection faq={extras.faq} />
  </SiteShell>;
}

// ---------------------------------------------------------------------------
// CINEMATIC — a fullscreen, GSAP/ScrollTrigger scroll-driven experience.
// One dark-luxury template shared across all categories (store/restaurant/
// services/portfolio/booking); it reads the same jsonStructure fields as
// every other template, so text edits via WhatsApp ("غيّر العنوان") just
// work with no special-casing. GSAP itself is loaded on demand (see the
// effect below) so templates that never use it don't pay for it.
// ---------------------------------------------------------------------------
function cinematicCollection(templateId: string): { label: string; heading: string } {
  const id = templateId.toLowerCase();
  if (id.includes('restaurant') || id.includes('مطعم')) return { label: 'طبق', heading: 'قائمتنا' };
  if (id.includes('booking') || id.includes('حجز')) return { label: 'خدمة', heading: 'خدماتنا' };
  if (id.includes('service') || id.includes('خدمات')) return { label: 'خدمة', heading: 'خدماتنا' };
  if (id.includes('portfolio') || id.includes('أعمال')) return { label: 'مشروع', heading: 'أعمالنا' };
  return { label: 'منتج', heading: 'منتجاتنا' };
}

// Scrolling a section's own height in from the right, holding centered, then
// exiting left — scrubbed to scroll position rather than time-based, per the
// "scrub animation" requirement. Kept as one small helper so every section
// sets itself up identically.
function scrubSection(
  gsapInstance: typeof import('gsap').gsap,
  wrapper: HTMLElement,
  targets: Element[],
): void {
  if (targets.length === 0) return;
  const tl = gsapInstance.timeline({
    scrollTrigger: { trigger: wrapper, start: 'top top', end: 'bottom bottom', scrub: 0.5 },
    defaults: { ease: 'none' },
  });
  tl.fromTo(targets, { xPercent: 30, opacity: 0 }, { xPercent: 0, opacity: 1, stagger: 0.08, duration: 0.28 })
    .to(targets, { xPercent: 0, opacity: 1, duration: 0.44 })
    .to(targets, { xPercent: -30, opacity: 0, stagger: 0.08, duration: 0.28 });
}

function CinematicTemplate({ data, siteName, templateId, dark, onToggleDark, showBranding }: TemplateProps & { templateId: string }) {
  const extras = useSiteExtras(data);
  const { label, heading } = cinematicCollection(templateId);
  const collection = items(data, ['items', 'services', 'projects']);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cleanup = () => {};
    let cancelled = false;
    // Loaded on demand — the only template that needs GSAP is this one.
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        root.querySelectorAll<HTMLElement>('[data-cinematic-section]').forEach((wrapper) => {
          const targets = Array.from(wrapper.querySelectorAll('[data-cinematic-text]'));
          scrubSection(gsap, wrapper, targets);
        });
        // Hero enters on load rather than on scroll — there's nothing above it to scroll past.
        gsap.fromTo('[data-cinematic-hero-text]', { xPercent: 22, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.12 });
      }, root);
      cleanup = () => ctx.revert();
    });

    return () => { cancelled = true; cleanup(); };
  }, [templateId]);

  const whatsapp = typeof extras.contact.whatsapp === 'string' && extras.contact.whatsapp ? extras.contact.whatsapp : (typeof extras.contact.phone === 'string' ? extras.contact.phone : '');
  const actionHref = whatsappUrl(whatsapp);

  return <div ref={rootRef} dir="rtl" className="site-public-shell grain relative min-h-[100dvh] overflow-x-clip transition-colors duration-300" style={{ background: 'var(--site-bg)', color: 'var(--site-ink)' }}>
    <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-10">
      <span className="flex items-center gap-2 font-serif text-lg font-bold tracking-tight">{extras.logo && <img src={extras.logo} alt={siteName} className="size-8 rounded-full object-cover" />}{siteName}</span>
      <div className="flex items-center gap-2">
        <ThemeToggle dark={dark} onToggle={onToggleDark} />
        <a href={actionHref} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="site-btn-shine hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white sm:inline-flex" style={{ background: 'var(--site-accent)' }} data-testid="link-cinematic-cta">{extras.ctaLabel}</a>
      </div>
    </div>

    {/* Hero — fullscreen, background image, load-in animation. */}
    <section id="top" className="relative flex h-[100dvh] items-center overflow-hidden px-6 md:px-16">
      {extras.heroImage ? <img src={extras.heroImage} alt={siteName} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--site-accent) 30%, transparent), transparent 55%), linear-gradient(160deg, var(--site-soft), var(--site-bg))' }} />}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--site-bg) 20%, transparent), color-mix(in srgb, var(--site-bg) 88%, transparent))' }} />
      <div className="relative max-w-3xl">
        <span data-cinematic-hero-text className="mb-5 inline-flex items-center gap-2.5 text-xs font-bold tracking-[0.2em]" style={{ color: 'var(--site-accent)' }}><LiveDot color="var(--site-accent)" />{text(data, ['tagline'], siteName)}</span>
        <h1 data-cinematic-hero-text className="font-serif text-5xl font-bold leading-[1.15] md:text-7xl">{text(data, ['headline', 'title', 'heroTitle'], siteName)}</h1>
        <p data-cinematic-hero-text className="mt-6 max-w-xl text-lg leading-8" style={{ color: 'var(--site-muted)' }}>{text(data, ['description', 'intro', 'about'], '')}</p>
        <div data-cinematic-hero-text className="mt-9 flex flex-wrap gap-3">
          <a href={actionHref} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="site-btn-shine inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-bold text-white shadow-[0_14px_34px_-12px_var(--site-accent)] transition hover:-translate-y-0.5" style={{ background: 'var(--site-accent)' }} data-testid="link-cinematic-hero-cta">{extras.ctaLabel} <ArrowLeft size={17} /></a>
        </div>
      </div>
    </section>

    {/* About — scroll-scrubbed: enters from the right, holds, exits left. */}
    {text(data, ['description', 'about'], '') && <section data-cinematic-section className="relative h-[170vh]">
      <div className="sticky top-0 flex h-[100dvh] items-center justify-center px-6 text-center md:px-16">
        <p data-cinematic-text className="max-w-3xl font-serif text-3xl font-bold leading-[1.6] md:text-5xl">{text(data, ['description', 'about'], '')}</p>
      </div>
    </section>}

    {/* Collection — scrubbed heading, then a normal (non-fullscreen) grid so a long catalogue doesn't turn into an endless scroll. */}
    {collection.length > 0 && <section id="collection" className="relative">
      <div data-cinematic-section className="relative h-[130vh]">
        <div className="sticky top-0 flex h-[100dvh] items-center justify-center px-6 text-center md:px-16">
          <h2 data-cinematic-text className="font-serif text-4xl font-bold md:text-6xl">{heading}</h2>
        </div>
      </div>
      <div className="mx-auto -mt-[40vh] max-w-6xl px-5 pb-24 md:px-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collection.map((raw, index) => {
            const item = asObject(raw);
            const photo = typeof item.image === 'string' ? item.image : '';
            return <Reveal key={index} delay={index * 60}><div className="site-card-lift overflow-hidden rounded-2xl border" style={{ background: 'var(--site-card)', borderColor: 'var(--site-border)' }} data-testid={`card-cinematic-${index}`}>
              {photo ? <img src={photo} alt={text(item, ['name', 'title'], label)} loading="lazy" className="h-56 w-full object-cover" /> : <div className="flex h-56 items-center justify-center font-serif text-3xl font-bold opacity-30" style={{ background: 'var(--site-soft)' }}>{text(item, ['name', 'title'], label)[0]}</div>}
              <div className="p-5">
                <h3 className="font-bold">{text(item, ['name', 'title'], label)}</h3>
                {text(item, ['description'], '') && <p className="mt-2 text-sm leading-6" style={{ color: 'var(--site-muted)' }}>{text(item, ['description'], '')}</p>}
                {(item.price !== undefined) && <p className="mt-3 font-bold" style={{ color: 'var(--site-accent)' }}>{money(item.price)}</p>}
              </div>
            </div></Reveal>;
          })}
        </div>
      </div>
    </section>}

    <HoursSection hours={extras.hours} />
    <TeamSection team={extras.team} />
    {templateId === 'portfolio' && <>
      <SkillsSection skills={extras.skills} />
      <ExperienceSection experience={extras.experience} />
      <CertificationsSection certifications={extras.certifications} />
    </>}
    <TestimonialsSection testimonials={extras.testimonials} />
    <ContactSection contact={extras.contact} social={extras.social} />
    <FaqSection faq={extras.faq} />

    <a href={actionHref} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="site-floating-cta fixed bottom-5 right-5 z-20 inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white transition duration-300 md:bottom-7 md:right-7" style={{ background: 'var(--site-accent)' }} data-testid="link-cinematic-floating-whatsapp">
      <MessageCircle size={17} /><span className="hidden sm:inline">{extras.ctaLabel}</span>
    </a>
    {showBranding && <div className="border-t px-5 py-6 text-center" style={{ borderColor: 'var(--site-border)' }}>
      <a href={(import.meta.env.VITE_FRONTEND_URL as string | undefined) || 'https://orxai.pages.dev'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold opacity-60 transition-opacity hover:opacity-100" style={{ color: 'var(--site-muted)' }} data-testid="link-orxai-badge-cinematic">
        <OrxaiMark monochrome className="h-3 w-auto" /> تم الإنشاء بواسطة orxai
      </a>
    </div>}
  </div>;
}

function appCategoryOf(item: Json): string {
  const value = typeof item.category === 'string' ? item.category.trim() : '';
  return value;
}

// Which lucide icon represents "browse the collection" in the bottom tab
// bar — reuses the same type-detection strings as cinematicCollection so
// the two never disagree about what kind of site this is.
function appTabIcon(templateId: string) {
  const id = templateId.toLowerCase();
  if (id.includes('restaurant') || id.includes('مطعم')) return UtensilsCrossed;
  if (id.includes('booking') || id.includes('حجز') || id.includes('service') || id.includes('خدم')) return Briefcase;
  if (id.includes('portfolio') || id.includes('أعمال')) return LayoutGrid;
  return ShoppingBag;
}

// Full-screen product/dish/service detail — replaces the whole frame rather
// than overlaying a dialog on it, same as tapping into an item in a real
// shopping or food app. Grounded in only the fields the platform actually
// stores (name/description/price/image): no fake size or color pickers that
// wouldn't be connected to anything real.
function AppDetailScreen({ item, label, whatsapp, siteName, onClose }: { item: Json; label: string; whatsapp: string; siteName: string; onClose: () => void }) {
  const name = text(item, ['name', 'title'], label);
  const image = typeof item.image === 'string' ? item.image : '';
  const description = text(item, ['description'], '');
  const orderHref = whatsappUrl(whatsapp, `مرحباً، أريد ${name} من ${siteName}`);
  return <div className="site-app-sheet absolute inset-0 z-40 flex flex-col" style={{ background: 'var(--site-bg)' }}>
    <div className="relative h-[44%] shrink-0 overflow-hidden">
      {image ? <img src={image} alt={name} className="h-full w-full object-cover" data-testid="img-app-detail" /> : <div className="h-full w-full" style={{ background: 'linear-gradient(160deg, var(--site-accent), var(--site-soft))' }} />}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, var(--site-bg) 100%)' }} />
      <button onClick={onClose} aria-label="إغلاق" className="site-glass absolute right-4 top-4 grid size-10 place-items-center rounded-full" data-testid="button-app-detail-close"><X size={18} /></button>
    </div>
    <div className="flex-1 overflow-y-auto px-5 pb-28 pt-5">
      <h2 className="font-serif text-2xl font-bold">{name}</h2>
      {description && <p className="mt-3 text-sm leading-7" style={{ color: 'var(--site-muted)' }}>{description}</p>}
    </div>
    <div className="site-app-sheet-bar absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <span className="block text-[11px]" style={{ color: 'var(--site-muted)' }}>السعر</span>
        <span className="font-serif text-lg font-bold" style={{ color: 'var(--site-accent)' }}>{money(item.price)}</span>
      </div>
      <a href={orderHref} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="site-btn-shine flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white" style={{ background: 'var(--site-accent)' }} data-testid="link-app-detail-order"><MessageCircle size={16} /> اطلب عبر واتساب</a>
    </div>
  </div>;
}

function AppNativeTemplate({ data, siteName, templateId, dark, onToggleDark, showBranding }: TemplateProps & { templateId: string }) {
  const extras = useSiteExtras(data);
  const { label, heading } = cinematicCollection(templateId);
  const collection = items(data, ['items', 'services', 'projects']);
  const whatsapp = typeof extras.contact.whatsapp === 'string' && extras.contact.whatsapp ? extras.contact.whatsapp : (typeof extras.contact.phone === 'string' ? extras.contact.phone : '');
  const actionHref = whatsappUrl(whatsapp);

  const [activeTab, setActiveTab] = useState<'home' | 'collection' | 'info'>('home');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(collection.map((raw) => appCategoryOf(asObject(raw))).filter(Boolean))),
    [collection],
  );
  const filtered = useMemo(
    () => collection
      .map((raw, index) => ({ raw, index }))
      .filter(({ raw }) => {
        const item = asObject(raw);
        if (activeCategory && appCategoryOf(item) !== activeCategory) return false;
        const name = text(item, ['name', 'title'], '');
        if (query.trim() && !name.toLowerCase().includes(query.trim().toLowerCase())) return false;
        return true;
      }),
    [collection, activeCategory, query],
  );

  const handleShare = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: siteName, url: window.location.href }); return; }
    } catch { /* user dismissed the native share sheet — nothing to do */ }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable — silently ignore */ }
  };

  const openSearch = () => { setActiveTab('collection'); setSearchOpen(true); };
  const goToCollection = () => setActiveTab('collection');

  const TabIcon = appTabIcon(templateId);
  const selectedItem = selectedIndex !== null ? asObject(collection[selectedIndex]) : null;
  const tabTitle = activeTab === 'home' ? siteName : activeTab === 'collection' ? heading : 'عنّا وتواصل';

  const renderCard = (raw: unknown, index: number) => {
    const item = asObject(raw);
    const image = typeof item.image === 'string' ? item.image : '';
    const name = text(item, ['name', 'title'], label);
    return <button key={index} onClick={() => setSelectedIndex(index)} className="site-app-card text-right" data-testid={`card-app-item-${index}`}>
      <div className="site-shadow-lux relative aspect-[3/4] overflow-hidden rounded-2xl">
        {image ? <img src={image} alt={name} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center font-serif text-2xl font-bold opacity-40" style={{ background: 'var(--site-soft)' }}>{name.slice(0, 1)}</div>}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.78), transparent 55%)' }} />
        <div className="absolute inset-x-2.5 bottom-2.5 text-white">
          <p className="truncate text-xs font-bold">{name}</p>
          <p className="text-[11px] font-bold opacity-90">{money(item.price)}</p>
        </div>
      </div>
    </button>;
  };

  return <div className="site-app-viewport" style={{ background: `radial-gradient(circle at 25% 15%, color-mix(in srgb, var(--site-accent) 22%, transparent), transparent 55%), var(--site-bg)` }}>
    <div className="site-app-frame flex flex-col" style={{ background: 'var(--site-bg)', color: 'var(--site-ink)' }}>
      {selectedItem && <AppDetailScreen item={selectedItem} label={label} whatsapp={whatsapp} siteName={siteName} onClose={() => setSelectedIndex(null)} />}
      <div className="site-app-scroll min-h-0 flex-1">
        <div className="site-app-topbar sticky top-0 z-30 flex items-center justify-between gap-2 px-4 py-3">
          <span className="flex items-center gap-2 truncate font-serif text-base font-bold">
            {activeTab === 'home' && extras.logo && <img src={extras.logo} alt={siteName} className="size-8 shrink-0 rounded-full object-cover" />}
            <span className="truncate">{tabTitle}</span>
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <button onClick={() => (activeTab === 'collection' ? setSearchOpen((open) => !open) : openSearch())} aria-label="بحث" className="site-app-icon-btn" data-testid="button-app-search-toggle"><Search size={16} /></button>
            <ThemeToggle dark={dark} onToggle={onToggleDark} />
            <button onClick={handleShare} aria-label="مشاركة" className="site-app-icon-btn" data-testid="button-app-share"><Share2 size={16} /></button>
          </div>
        </div>
        {searchOpen && activeTab === 'collection' && <div className="px-4 pb-3">
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`ابحث في ${heading}...`} className="w-full rounded-full border px-4 py-2.5 text-sm outline-none" style={{ borderColor: 'var(--site-border)', background: 'var(--site-card)', color: 'var(--site-ink)' }} data-testid="input-app-search" />
        </div>}
        {copied && <div className="site-app-toast">تم نسخ الرابط ✅</div>}

        {activeTab === 'home' && <div className="site-app-tab-panel pb-6">
          <section className="relative mx-4 mt-1 h-56 overflow-hidden rounded-[26px]">
            {extras.heroImage ? <HeroPhoto src={extras.heroImage} alt={siteName} className="h-full" /> : <div className="h-full w-full" style={{ background: 'linear-gradient(160deg, var(--site-accent), var(--site-soft))' }} />}
            <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.75), rgba(0,0,0,.05) 60%, transparent)' }} />
            <div className="absolute inset-x-4 bottom-4 text-white">
              <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold backdrop-blur"><Star size={11} fill="currentColor" /> {text(data, ['rating'], '4.9')}</span>
              <h1 className="font-serif text-xl font-bold leading-snug">{text(data, ['headline', 'title', 'heroTitle'], siteName)}</h1>
            </div>
          </section>
          {text(data, ['description', 'intro', 'about'], '') && <p className="px-5 pt-4 text-sm leading-7" style={{ color: 'var(--site-muted)' }}>{text(data, ['description', 'intro', 'about'], '')}</p>}
          <section className="px-4 pb-1 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold">{heading}</h2>
              {collection.length > 4 && <button onClick={goToCollection} className="text-xs font-bold" style={{ color: 'var(--site-accent)' }} data-testid="button-app-view-all">عرض الكل ({collection.length})</button>}
            </div>
            {collection.length === 0 ? <EmptyCollection label={`لم تتم إضافة ${label}ات بعد.`} /> : <div className="grid grid-cols-2 gap-3">
              {collection.slice(0, 4).map((raw, index) => renderCard(raw, index))}
            </div>}
          </section>
        </div>}

        {activeTab === 'collection' && <div className="site-app-tab-panel pb-6">
          {categories.length > 1 && <div className="site-app-chip-row mt-1">
            <button onClick={() => setActiveCategory('')} className={`site-app-chip ${activeCategory === '' ? 'site-app-chip-active' : ''}`} data-testid="chip-app-category-all">الكل</button>
            {categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={`site-app-chip ${activeCategory === category ? 'site-app-chip-active' : ''}`} data-testid={`chip-app-category-${category}`}>{category}</button>)}
          </div>}
          <section className="px-4 pb-1 pt-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold">{heading}</h2>
              <span className="text-xs" style={{ color: 'var(--site-muted)' }}>{filtered.length}</span>
            </div>
            {filtered.length === 0 ? <EmptyCollection label={collection.length === 0 ? `لم تتم إضافة ${label}ات بعد.` : `لا نتائج مطابقة في ${heading}.`} /> : <div className="grid grid-cols-2 gap-3">
              {filtered.map(({ raw, index }) => renderCard(raw, index))}
            </div>}
          </section>
        </div>}

        {activeTab === 'info' && <div className="site-app-tab-panel pb-2">
          <HoursSection hours={extras.hours} />
          <TeamSection team={extras.team} />
          {templateId === 'portfolio' && <>
            <SkillsSection skills={extras.skills} />
            <ExperienceSection experience={extras.experience} />
            <CertificationsSection certifications={extras.certifications} />
          </>}
          <TestimonialsSection testimonials={extras.testimonials} />
          <ContactSection contact={extras.contact} social={extras.social} />
          <FaqSection faq={extras.faq} />
          {showBranding && <div className="px-5 pb-8 pt-2 text-center">
            <a href={(import.meta.env.VITE_FRONTEND_URL as string | undefined) || 'https://orxai.pages.dev'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold opacity-60 transition-opacity hover:opacity-100" style={{ color: 'var(--site-muted)' }} data-testid="link-orxai-badge-app">
              <OrxaiMark monochrome className="h-3 w-auto" /> تم الإنشاء بواسطة orxai
            </a>
          </div>}
        </div>}
      </div>

      <nav className="site-app-tabbar shrink-0 z-30 flex items-center justify-around px-2 py-2.5">
        <button onClick={() => setActiveTab('home')} className={`site-app-tab ${activeTab === 'home' ? 'site-app-tab-active' : ''}`} data-testid="tab-app-home"><Home size={19} /><span>الرئيسية</span></button>
        <button onClick={() => setActiveTab('collection')} className={`site-app-tab ${activeTab === 'collection' ? 'site-app-tab-active' : ''}`} data-testid="tab-app-collection"><TabIcon size={19} /><span>{heading}</span></button>
        <a href={actionHref} target={whatsapp ? '_blank' : undefined} rel="noreferrer" className="site-app-tab site-app-tab-cta" data-testid="tab-app-contact"><MessageCircle size={19} /><span>تواصل</span></a>
        <button onClick={() => setActiveTab('info')} className={`site-app-tab ${activeTab === 'info' ? 'site-app-tab-active' : ''}`} data-testid="tab-app-info"><Info size={19} /><span>عنّا</span></button>
      </nav>
    </div>
  </div>;
}

function WebsiteLoadingSkeleton() {
  return <div dir="rtl" className="grain min-h-[100dvh] px-5 py-5 md:px-10" style={{ background: 'var(--site-bg, #faf9f5)', color: 'var(--site-ink, #181b1d)' }} aria-label="جارٍ تحميل الموقع">
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between border-b pb-5" style={{ borderColor: 'var(--site-border, #e7e2d8)' }}>
        <div className="website-skeleton-shimmer h-7 w-32 rounded-full" />
        <div className="flex gap-3">
          <div className="website-skeleton-shimmer h-9 w-9 rounded-full" />
          <div className="website-skeleton-shimmer h-9 w-24 rounded-full" />
        </div>
      </div>
      <div className="grid gap-10 py-14 md:grid-cols-[1fr_.9fr] md:items-center md:py-24">
        <div>
          <div className="website-skeleton-shimmer h-6 w-36 rounded-full" />
          <div className="website-skeleton-shimmer mt-7 h-14 max-w-xl rounded-2xl md:h-20" />
          <div className="website-skeleton-shimmer mt-4 h-14 max-w-md rounded-2xl" />
          <div className="website-skeleton-shimmer mt-8 h-12 w-36 rounded-xl" />
        </div>
        <div className="website-skeleton-shimmer h-64 rounded-[2rem] md:h-96" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <div key={index} className="website-skeleton-shimmer h-36 rounded-3xl" />)}
      </div>
    </div>
  </div>;
}

export default function PublicWebsite() {
  const { username = '' } = useParams<{ username: string }>();
  const query = useGetPublicWebsite(username, { query: { queryKey: getGetPublicWebsiteQueryKey(username), enabled: Boolean(username) } });
  const website = query.data;
  const trackedRef = useRef(false);
  useEffect(() => {
    if (!website?.publicId || trackedRef.current) return;
    trackedRef.current = true;
    const base = (import.meta.env.VITE_API_URL as string | undefined) || '';
    fetch(`${base}/api/public/websites/${encodeURIComponent(website.publicId)}/visit`, { method: 'POST' }).catch(() => undefined);
  }, [website?.publicId]);
  const data = useMemo(() => asObject(website?.jsonStructure), [website?.jsonStructure]);
  const [darkOverride, setDarkOverride] = useState<boolean | null>(null);
  const dark = darkOverride ?? Boolean(data.darkMode);
  // The theme color is set on the website record itself (top-level, updated
  // by every "change the color" request); jsonStructure is only a fallback
  // for older sites saved before this field existed.
  const accent = (website?.themeColor as string) || text(data, ['themeColor', 'accent'], '#e66f51');
  const paletteStyle = useMemo(() => getPalette(accent, dark), [accent, dark]);
  const showSplash = useMinimumVisible(query.isLoading);

  if (showSplash) return <WebsiteLoadingSkeleton />;
  if (query.isError || !website) return <div dir="rtl" className="grid min-h-[100dvh] place-items-center bg-[#fff8ee] p-6 text-center"><div><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#f4d8c9] text-[#b3523e]"><MapPin size={25} /></div><h1 className="mt-6 font-serif text-2xl font-bold">هذا الموقع غير متاح حالياً</h1><p className="mt-3 text-sm text-[#657174]">تحقق من الرابط أو حاول مرة أخرى بعد قليل.</p><button onClick={() => query.refetch()} className="mt-7 rounded-xl bg-[#1b2735] px-5 py-3 text-sm font-bold text-white" data-testid="button-retry-website">حاول مرة أخرى</button></div></div>;

  const template = website.templateId.toLowerCase();
  const templateStyle = text(data, ['templateStyle'], 'classic');
  const modern = templateStyle === 'modern';
  const props: TemplateProps = { data, siteName: website.siteName, dark, onToggleDark: () => setDarkOverride(!dark), showBranding: website.showBranding !== false };

  if (templateStyle === 'cinematic') {
    return <div className={`site-template-root site-template-${template} site-template-cinematic`} style={paletteStyle}><CinematicTemplate {...props} templateId={template} /></div>;
  }

  if (templateStyle === 'app') {
    return <div className={`site-template-root site-template-${template} site-template-app`} style={paletteStyle}><AppNativeTemplate {...props} templateId={template} /></div>;
  }

  let Body: (p: TemplateProps) => ReactElement;
  if (template.includes('restaurant') || template.includes('مطعم')) Body = modern ? RestaurantModern : RestaurantClassic;
  else if (template.includes('booking') || template.includes('حجز') || template.includes('موعد')) Body = BookingTemplate;
  else if (template.includes('service') || template.includes('خدمات')) Body = modern ? ServicesModern : ServicesClassic;
  else if (template.includes('portfolio') || template.includes('أعمال')) Body = modern ? PortfolioModern : PortfolioClassic;
  else Body = modern ? StoreModern : StoreClassic;

  return <div className={`site-template-root site-template-${template} ${modern ? 'site-template-modern' : 'site-template-classic'}`} style={paletteStyle}><Body {...props} /></div>;
}
