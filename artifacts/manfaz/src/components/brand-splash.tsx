import { useEffect, useRef, useState } from 'react';
import { OrxaiMark } from '@/components/orxai-mark';

/**
 * Full-screen brand splash: the ORxai mark draws itself in, settles, then
 * the whole overlay fades away to reveal the app underneath. Used instead
 * of a plain spinner wherever someone is entering the platform or a
 * merchant's site for the first time.
 */
export function BrandSplash({ show }: { show: boolean }) {
  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-0 z-[999] grid place-items-center bg-[#0a0c0f] transition-opacity duration-700 ease-out ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <div className="relative flex flex-col items-center gap-5">
        <div aria-hidden className="absolute inset-0 -m-16 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,.08),transparent_70%)] blur-2xl [animation:orxai-glow-pulse_2.4s_ease-in-out_infinite]" />
        <OrxaiMark animated className="relative h-16 w-auto text-white md:h-20" />
        <span className="relative font-serif text-sm font-bold tracking-[.25em] text-white/70">ORXAI</span>
      </div>
    </div>
  );
}

/**
 * Shows the splash for a fixed minimum duration on mount — for pages with
 * no real async dependency (Landing, Admin), just a deliberate brand
 * moment on entry rather than an instant blank-to-content pop.
 */
export function useEntrySplash(minMs = 1300): boolean {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), minMs);
    return () => clearTimeout(t);
  }, [minMs]);
  return show;
}

/**
 * Ties the splash's visible duration to a real async condition (e.g. a
 * query's isLoading) while still guaranteeing a minimum display time, so
 * it never flashes for a barely-visible instant on a fast connection.
 */
export function useMinimumVisible(isLoading: boolean, minMs = 900): boolean {
  const [visible, setVisible] = useState(isLoading);
  const startedAt = useRef<number | null>(isLoading ? Date.now() : null);
  useEffect(() => {
    if (isLoading) {
      startedAt.current = startedAt.current ?? Date.now();
      setVisible(true);
      return;
    }
    const elapsed = startedAt.current ? Date.now() - startedAt.current : minMs;
    const remaining = Math.max(minMs - elapsed, 0);
    const t = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(t);
  }, [isLoading, minMs]);
  return visible;
}
