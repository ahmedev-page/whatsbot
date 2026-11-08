import { useEffect, useRef, useState } from 'react';
import { OrxaiMark } from '@/components/orxai-mark';

/**
 * Full-screen brand splash: the ORxai mark draws itself in, settles, then
 * the whole overlay fades away to reveal the app underneath.
 */
export function BrandSplash({ show }: { show: boolean }) {
  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-0 z-[999] grid place-items-center bg-[#060B18] transition-opacity duration-700 ease-out ${
        show ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      style={{ backgroundColor: '#060B18', color: '#FFFFFF' }}
    >
      <div className="relative flex flex-col items-center gap-5">
        <div
          aria-hidden
          className="absolute inset-0 -m-16 rounded-full blur-2xl [animation:orxai-glow-pulse_2.4s_ease-in-out_infinite]"
          style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(37, 99, 235, 0.28), transparent 70%)',
          }}
        />
        <div
          className="relative grid size-20 place-items-center rounded-2xl border border-[#1E3A8A]"
          style={{
            backgroundImage: 'linear-gradient(135deg, #1D4ED8 0%, #0B132B 100%)',
            borderColor: '#3B82F6',
          }}
        >
          <OrxaiMark animated monochrome className="relative h-10 w-auto text-white" />
        </div>
        <div className="text-center">
          <span
            className="relative block font-mono text-sm font-black tracking-[0.28em]"
            style={{ color: '#FFFFFF' }}
          >
            ORXAI
          </span>
          <span
            className="mt-1 block text-[11px] font-bold"
            style={{ color: '#93C5FD' }}
          >
            ENTERPRISE CLOUD STUDIO
          </span>
        </div>
      </div>
    </div>
  );
}

export function useEntrySplash(minMs = 650): boolean {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), minMs);
    return () => clearTimeout(t);
  }, [minMs]);
  return show;
}

export function useMinimumVisible(isLoading: boolean, minMs = 600): boolean {
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
