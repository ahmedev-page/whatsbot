import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { safeLocalStorage } from '@/lib/safe-storage';
import type { Announcement } from '@/lib/account';

// Announcement cards written by the platform admin: text, an image, a link, or any
// mix. The same <AdCard> is used on the home screen and in the admin preview, so
// what the admin designs is exactly what users see.

export const AD_THEMES: Record<Announcement['theme'], { label: string; background: string; swatch: string }> = {
  blue: { label: 'أزرق', background: 'linear-gradient(135deg,#1E40AF 0%,#2563EB 55%,#38BDF8 100%)', swatch: '#2563EB' },
  navy: { label: 'كحلي', background: 'linear-gradient(135deg,#0B1220 0%,#1E3A8A 100%)', swatch: '#1E3A8A' },
  emerald: { label: 'أخضر', background: 'linear-gradient(135deg,#047857 0%,#10B981 100%)', swatch: '#10B981' },
  violet: { label: 'بنفسجي', background: 'linear-gradient(135deg,#5B21B6 0%,#8B5CF6 100%)', swatch: '#8B5CF6' },
  amber: { label: 'برتقالي', background: 'linear-gradient(135deg,#B45309 0%,#EA580C 100%)', swatch: '#EA580C' },
  rose: { label: 'وردي', background: 'linear-gradient(135deg,#BE123C 0%,#F43F5E 100%)', swatch: '#F43F5E' },
};

export function AdCard({
  ad,
  onLink,
  onDismiss,
  preview = false,
}: {
  ad: Pick<Announcement, 'title' | 'body' | 'imageUrl' | 'linkUrl' | 'linkLabel' | 'theme'>;
  onLink?: () => void;
  onDismiss?: () => void;
  preview?: boolean;
}) {
  const theme = AD_THEMES[ad.theme] ?? AD_THEMES.blue;
  const hasText = !!(ad.title || ad.body);
  const imageOnly = !!ad.imageUrl && !hasText;
  const link =
    ad.linkUrl &&
    (preview ? (
      <span className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-extrabold" style={{ color: '#0F172A' }}>
        {ad.linkLabel || 'اعرف المزيد'}
        <ArrowLeft size={15} />
      </span>
    ) : (
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onLink}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-extrabold shadow-[0_6px_16px_-8px_rgba(0,0,0,.5)] active:scale-[.97]"
        style={{ color: '#0F172A' }}
      >
        {ad.linkLabel || 'اعرف المزيد'}
        <ArrowLeft size={15} />
      </a>
    ));

  return (
    <article
      className="ad-sheen relative flex min-h-[172px] w-full overflow-hidden rounded-[22px] text-white"
      style={{ background: theme.background }}
      dir="rtl"
    >
      {ad.imageUrl && (
        <img
          src={ad.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className={
            imageOnly
              ? 'absolute inset-0 size-full object-cover'
              : 'absolute inset-y-0 left-0 hidden w-[42%] object-cover min-[380px]:block'
          }
          style={imageOnly ? undefined : { maskImage: 'linear-gradient(to right, #000 55%, transparent)', WebkitMaskImage: 'linear-gradient(to right, #000 55%, transparent)' }}
        />
      )}
      {imageOnly && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" aria-hidden />}
      <div className={`relative z-10 flex w-full flex-col justify-between gap-3 p-5 ${imageOnly ? 'justify-end' : ''} ${ad.imageUrl && !imageOnly ? 'min-[380px]:w-[62%] min-[380px]:ms-auto' : ''}`}>
        {hasText && (
          <div>
            {ad.title && <h3 className="text-[20px] font-black leading-snug">{ad.title}</h3>}
            {ad.body && <p className="mt-1.5 text-[13.5px] font-semibold leading-relaxed text-white/90">{ad.body}</p>}
          </div>
        )}
        {link && <div>{link}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="إخفاء الإعلان"
          className="absolute left-2.5 top-2.5 z-20 grid size-8 place-items-center rounded-full bg-black/25 text-white hover:bg-black/40"
        >
          <X size={15} />
        </button>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------

const DISMISS_KEY = 'orxai-dismissed-ads';
const DISMISS_MS = 3 * 24 * 60 * 60 * 1000;
const ROTATE_MS = 6500;

function readDismissed(): Record<string, number> {
  try {
    const raw = JSON.parse(safeLocalStorage.getItem(DISMISS_KEY) || '{}') as Record<string, number>;
    const now = Date.now();
    return Object.fromEntries(Object.entries(raw).filter(([, at]) => typeof at === 'number' && now - at < DISMISS_MS));
  } catch {
    return {};
  }
}

const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function AdCarousel({
  ads,
  onView,
  onClick,
}: {
  ads: Announcement[];
  onView?: (id: string) => void;
  onClick?: (id: string) => void;
}) {
  const [dismissed, setDismissed] = useState(readDismissed);
  const visible = ads.filter((a) => !dismissed[a.id]);
  const count = visible.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const seen = useRef(new Set<string>());
  const drag = useRef<{ x: number; y: number } | null>(null);
  const current = Math.min(index, Math.max(0, count - 1));
  const reduced = useRef(prefersReducedMotion());

  // Auto-advance. Stops while the person touches/hovers/focuses the card, when the
  // tab is hidden, and always for people who asked for reduced motion.
  useEffect(() => {
    if (count < 2 || paused || reduced.current) return;
    const timer = window.setTimeout(() => {
      if (!document.hidden) setIndex((i) => (Math.min(i, count - 1) + 1) % count);
    }, ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [current, paused, count]);

  // One impression per card per visit.
  useEffect(() => {
    const ad = visible[current];
    if (ad && !seen.current.has(ad.id)) {
      seen.current.add(ad.id);
      onView?.(ad.id);
    }
  }, [current, visible, onView]);

  const go = useCallback((next: number) => count && setIndex(((next % count) + count) % count), [count]);

  const dismiss = (id: string) => {
    const next = { ...dismissed, [id]: Date.now() };
    setDismissed(next);
    safeLocalStorage.setItem(DISMISS_KEY, JSON.stringify(next));
  };

  if (count === 0) return null;

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="إعلانات"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, y: e.clientY };
        setPaused(true);
      }}
      onPointerUp={(e) => {
        const start = drag.current;
        drag.current = null;
        setPaused(false);
        if (!start || count < 2) return;
        const dx = e.clientX - start.x;
        // Mostly-horizontal swipe. In RTL the next card sits to the left, so a
        // swipe to the right brings it in.
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(e.clientY - start.y) * 1.5) go(current + (dx > 0 ? 1 : -1));
      }}
      onPointerCancel={() => {
        drag.current = null;
        setPaused(false);
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="overflow-hidden rounded-[22px]" dir="rtl">
        <div className="flex transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `translateX(${current * 100}%)` }}>
          {visible.map((ad, i) => (
            <div
              key={ad.id}
              className="w-full shrink-0"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} من ${count}`}
              aria-hidden={i !== current}
              // Off-screen slides must not be tabbable.
              {...(i !== current ? { inert: true } : {})}
            >
              <AdCard ad={ad} onLink={() => onClick?.(ad.id)} onDismiss={() => dismiss(ad.id)} />
            </div>
          ))}
        </div>
      </div>
      {count > 1 && (
        <div className="mt-2.5 flex items-center justify-center gap-1.5" role="tablist" aria-label="اختيار الإعلان">
          {visible.map((ad, i) => (
            <button
              key={ad.id}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`الإعلان ${i + 1}`}
              onClick={() => go(i)}
              className="relative h-1.5 overflow-hidden rounded-full transition-all duration-300"
              style={{ width: i === current ? 26 : 7, backgroundColor: '#C9D6F2' }}
            >
              {i === current && (
                <span
                  key={`${ad.id}-${paused}`}
                  className={`absolute inset-y-0 right-0 rounded-full ${paused || reduced.current ? 'w-full' : 'ad-progress'}`}
                  style={{ backgroundColor: '#2563EB' }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
