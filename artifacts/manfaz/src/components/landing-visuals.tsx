import type { ServiceVisualKind } from '@/lib/landing-data';

/**
 * Ambient orbital & geometric SVG backdrop for the Hero and dark royal sections.
 */
export function HeroOrbitalBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #060B18 0%, #0B132B 55%, #0F172A 100%)',
        backgroundColor: '#060B18',
      }}
    >
      {/* Deep royal ambient radial glows */}
      <div
        className="absolute -top-40 right-1/4 h-[540px] w-[780px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(37, 99, 235, 0.24) 0%, rgba(79, 70, 229, 0.14) 55%, transparent 100%)',
        }}
      />
      <div
        className="absolute top-1/3 -left-32 h-[480px] w-[640px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(59, 130, 246, 0.1) 55%, transparent 100%)',
        }}
      />
      <div
        className="absolute -bottom-32 right-1/3 h-[380px] w-[560px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(56, 189, 248, 0.14) 0%, transparent 75%)',
        }}
      />

      {/* Precision architectural grid + orbital rings SVG */}
      <svg
        className="absolute inset-0 hidden h-full w-full opacity-35 md:block"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="orx-hero-grid" width="72" height="72" patternUnits="userSpaceOnUse">
            <path
              d="M 72 0 L 0 0 0 72"
              fill="none"
              stroke="rgba(148, 163, 184, 0.14)"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id="orx-grid-mask" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="0.35" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="orx-ring-royal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#6366F1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.45" />
          </linearGradient>
          <mask id="orx-fade-mask">
            <rect width="1440" height="900" fill="url(#orx-grid-mask)" />
          </mask>
        </defs>

        <rect width="1440" height="900" fill="url(#orx-hero-grid)" mask="url(#orx-fade-mask)" />

        {/* Sculpted orbital arcs behind the showcase */}
        <g className="origin-center">
          <ellipse
            cx="430"
            cy="430"
            rx="390"
            ry="220"
            transform="rotate(-18 430 430)"
            stroke="url(#orx-ring-royal)"
            strokeWidth="1.25"
            strokeDasharray="8 8"
          />
          <ellipse
            cx="430"
            cy="430"
            rx="310"
            ry="175"
            transform="rotate(14 430 430)"
            stroke="rgba(56, 189, 248, 0.24)"
            strokeWidth="1"
          />
        </g>

        {/* Decorative geometric prism nodes */}
        <circle cx="820" cy="160" r="4" fill="#38BDF8" fillOpacity="0.65" />
        <circle cx="160" cy="240" r="5" fill="#60A5FA" fillOpacity="0.65" />
        <circle cx="690" cy="680" r="4" fill="#818CF8" fillOpacity="0.6" />
      </svg>
    </div>
  );
}

/**
 * Sculpted architectural SVG wave/curve transition between sections.
 */
export function SectionCurveDivider({
  fromColor,
  toColor,
  flip = false,
}: {
  fromColor: string;
  toColor: string;
  flip?: boolean;
}) {
  return (
    <div
      aria-hidden
      className="relative -my-px w-full overflow-hidden leading-none select-none"
      style={{ backgroundColor: fromColor === 'transparent' ? '#0F172A' : fromColor }}
    >
      <svg
        viewBox="0 0 1440 72"
        fill="none"
        preserveAspectRatio="none"
        className={`block h-10 w-full sm:h-16 ${flip ? 'scale-x-[-1]' : ''}`}
      >
        <path
          d="M0 24C240 68 480 72 720 44C960 16 1200 4 1440 36V72H0V24Z"
          fill={toColor}
          fillOpacity="0.35"
        />
        <path
          d="M0 40C310 74 620 64 940 32C1150 11 1320 18 1440 44V72H0V40Z"
          fill={toColor}
        />
      </svg>
    </div>
  );
}

/**
 * Dynamic SVG banner art inside the Interactive Studio & Hero Live Preview.
 */
export function StudioHeroBannerArt({
  presetId,
  primaryHex,
  secondaryHex,
}: {
  presetId: string;
  primaryHex: string;
  secondaryHex: string;
}) {
  return (
    <svg
      viewBox="0 0 360 120"
      fill="none"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`grad-${presetId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryHex} stopOpacity="0.34" />
          <stop offset="65%" stopColor={secondaryHex} stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.14" />
        </linearGradient>
      </defs>
      <rect width="360" height="120" rx="16" fill={`url(#grad-${presetId})`} />
      {/* Dynamic geometric shapes centered so left KPI/CTA and right title stay crisp */}
      {presetId === 'store' && (
        <g opacity="0.55">
          <circle cx="175" cy="58" r="38" fill={primaryHex} fillOpacity="0.22" />
          <circle cx="198" cy="48" r="24" fill={secondaryHex} fillOpacity="0.28" />
          <rect
            x="152"
            y="34"
            width="46"
            height="46"
            rx="12"
            stroke={primaryHex}
            strokeOpacity="0.6"
            strokeWidth="1.75"
            fill="rgba(15, 23, 42, 0.45)"
          />
        </g>
      )}
      {presetId === 'restaurant' && (
        <g opacity="0.55">
          <circle
            cx="180"
            cy="58"
            r="34"
            stroke={primaryHex}
            strokeOpacity="0.55"
            strokeWidth="1.75"
            fill="rgba(15, 23, 42, 0.45)"
          />
          <circle cx="180" cy="58" r="20" fill={secondaryHex} fillOpacity="0.28" />
        </g>
      )}
      {presetId === 'booking' && (
        <g opacity="0.55">
          <rect
            x="146"
            y="30"
            width="68"
            height="56"
            rx="12"
            fill="rgba(15, 23, 42, 0.45)"
            stroke={primaryHex}
            strokeOpacity="0.55"
            strokeWidth="1.75"
          />
          <circle cx="164" cy="58" r="5" fill={primaryHex} />
          <circle cx="180" cy="58" r="5" fill={secondaryHex} />
          <circle cx="196" cy="58" r="5" fill="#38BDF8" />
        </g>
      )}
      {presetId === 'services' && (
        <g opacity="0.6">
          <path
            d="M142 82L166 44L190 66L214 34"
            stroke={primaryHex}
            strokeOpacity="0.65"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="166" cy="44" r="4.5" fill={secondaryHex} />
          <circle cx="190" cy="66" r="4.5" fill={primaryHex} />
          <circle cx="214" cy="34" r="5" fill="#38BDF8" />
        </g>
      )}
      {(presetId === 'survey' || presetId === 'rsvp' || presetId === 'invoice' || presetId === 'vcard') && (
        <g opacity="0.58">
          <rect
            x="144"
            y="30"
            width="72"
            height="56"
            rx="14"
            fill="rgba(15, 23, 42, 0.48)"
            stroke={primaryHex}
            strokeOpacity="0.6"
            strokeWidth="1.75"
          />
          <rect x="158" y="44" width="44" height="6" rx="3" fill={primaryHex} />
          <rect x="158" y="56" width="32" height="6" rx="3" fill={secondaryHex} />
          <rect x="158" y="68" width="22" height="6" rx="3" fill="#38BDF8" />
        </g>
      )}
      {/* Flowing architectural wave across bottom */}
      <path
        d="M0 96C90 74 180 112 270 86C310 74 340 82 360 90V120H0V96Z"
        fill={primaryHex}
        fillOpacity="0.18"
      />
    </svg>
  );
}

/**
 * Bespoke mini-UI schematic / vector shape illustration for each of the 12 service cards.
 * Uses an explicit dark sapphire stage (#0B132B -> #0F172A) with pure HEX inline styles
 * so service cards never suffer from low contrast on any browser.
 */
export function ServiceCardVisual({
  kind,
  accentFrom,
  accentTo,
}: {
  kind: ServiceVisualKind;
  accentFrom: string;
  accentTo: string;
}) {
  const innerCardStyle = {
    backgroundColor: '#0F172A',
    borderColor: 'rgba(148, 163, 184, 0.22)',
    color: '#FFFFFF',
  };

  return (
    <div
      aria-hidden
      style={{
        background: 'linear-gradient(135deg, #0B132B 0%, #0F172A 60%, #1E293B 100%)',
        backgroundColor: '#0B132B',
        borderColor: '#1E293B',
        color: '#FFFFFF',
      }}
      className="relative h-28 w-full overflow-hidden rounded-2xl border p-3 text-white shadow-inner transition-transform duration-300 group-hover:scale-[1.015]"
    >
      {/* Ambient corner orb */}
      <div
        className="pointer-events-none absolute -top-8 -left-8 h-24 w-24 rounded-full opacity-35 transition-opacity duration-300 group-hover:opacity-55"
        style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
      />

      {kind === 'website' && (
        <div
          style={innerCardStyle}
          className="relative flex h-full flex-col justify-between rounded-xl border p-2.5"
        >
          <div className="flex items-center justify-between border-b border-slate-700/70 pb-1.5">
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-full" style={{ backgroundColor: '#FB7185' }} />
              <span className="size-2 rounded-full" style={{ backgroundColor: '#38BDF8' }} />
              <span className="size-2 rounded-full" style={{ backgroundColor: '#34D399' }} />
            </div>
            <span
              className="h-2 w-16 rounded-full"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1.5">
            <div
              className="col-span-2 rounded-lg border border-slate-700/70 p-2"
              style={{ background: `linear-gradient(135deg, ${accentFrom}40, ${accentTo}22)` }}
            >
              <div
                className="h-2 w-3/4 rounded-full"
                style={{ backgroundColor: '#FFFFFF' }}
              />
              <div
                className="mt-1.5 h-1.5 w-1/2 rounded-full"
                style={{ backgroundColor: '#7DD3FC' }}
              />
              <div
                className="mt-2 h-3 w-12 rounded-full"
                style={{ backgroundColor: accentTo }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div
                className="flex-1 rounded-md border border-slate-700"
                style={{ backgroundColor: '#1E293B' }}
              />
              <div
                className="flex-1 rounded-md border border-sky-500/40"
                style={{ backgroundColor: 'rgba(14, 165, 233, 0.2)' }}
              />
            </div>
          </div>
        </div>
      )}

      {kind === 'store' && (
        <div className="relative grid h-full grid-cols-3 gap-2">
          {[
            { price: '68 ر.س', bg: 'linear-gradient(135deg, #1E3A8A, #1D4ED8)', dot: '#38BDF8' },
            { price: '120 ر.س', bg: 'linear-gradient(135deg, #312E81, #4F46E5)', dot: '#818CF8' },
            { price: '95 ر.س', bg: 'linear-gradient(135deg, #064E3B, #0D9488)', dot: '#34D399' },
          ].map((box, i) => (
            <div
              key={i}
              style={innerCardStyle}
              className="flex flex-col justify-between rounded-xl border p-2"
            >
              <div
                className="h-9 rounded-lg border border-slate-700/60"
                style={{ background: box.bg }}
              />
              <div className="flex items-center justify-between pt-1">
                <span
                  style={{ color: '#FFFFFF' }}
                  className="font-mono text-[10px] font-bold"
                >
                  {box.price}
                </span>
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: box.dot }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {kind === 'menu' && (
        <div
          style={innerCardStyle}
          className="relative flex h-full items-center justify-between gap-3 rounded-xl border p-2.5"
        >
          {/* High-contrast QR Graphic on Dark Slate */}
          <div
            style={{ backgroundColor: '#020617', borderColor: '#334155' }}
            className="grid size-14 shrink-0 grid-cols-3 gap-1 rounded-lg border p-2"
          >
            <span className="rounded-xs" style={{ backgroundColor: '#38BDF8' }} />
            <span className="rounded-xs" style={{ backgroundColor: '#FFFFFF' }} />
            <span className="rounded-xs" style={{ backgroundColor: '#38BDF8' }} />
            <span className="rounded-xs" style={{ backgroundColor: '#FFFFFF' }} />
            <span className="rounded-xs" style={{ backgroundColor: '#2563EB' }} />
            <span className="rounded-xs" style={{ backgroundColor: '#FFFFFF' }} />
            <span className="rounded-xs" style={{ backgroundColor: '#38BDF8' }} />
            <span className="rounded-xs" style={{ backgroundColor: '#475569' }} />
            <span className="rounded-xs" style={{ backgroundColor: '#38BDF8' }} />
          </div>
          <div className="flex-1 space-y-2">
            <div
              style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}
              className="flex items-center justify-between rounded-lg border px-2.5 py-1.5"
            >
              <span
                className="h-2 w-20 rounded-full"
                style={{ backgroundColor: '#FFFFFF' }}
              />
              <span
                style={{ color: '#38BDF8' }}
                className="font-mono text-[10px] font-extrabold"
              >
                95 ر.س
              </span>
            </div>
            <div
              style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}
              className="flex items-center justify-between rounded-lg border px-2.5 py-1.5"
            >
              <span
                className="h-2 w-16 rounded-full"
                style={{ backgroundColor: '#CBD5E1' }}
              />
              <span
                style={{ color: '#34D399' }}
                className="font-mono text-[10px] font-extrabold"
              >
                52 ر.س
              </span>
            </div>
          </div>
        </div>
      )}

      {kind === 'booking' && (
        <div
          style={innerCardStyle}
          className="relative flex h-full flex-col justify-between rounded-xl border p-2.5"
        >
          <div className="flex items-center justify-between">
            <span style={{ color: '#5EEAD4' }} className="text-[10px] font-bold">
              جدول المواعيد المتاحة
            </span>
            <span style={{ color: '#38BDF8' }} className="font-mono text-[10px] font-bold">
              10:30 AM
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {['09:00', '10:30', '12:00', '04:30'].map((slot, idx) => (
              <div
                key={slot}
                style={
                  idx === 1
                    ? { backgroundColor: '#0D9488', color: '#FFFFFF' }
                    : {
                        backgroundColor: '#1E293B',
                        borderColor: '#334155',
                        color: '#E2E8F0',
                      }
                }
                className="rounded-md border border-transparent py-1.5 text-center font-mono text-[10px] font-extrabold"
              >
                {slot}
              </div>
            ))}
          </div>
        </div>
      )}

      {kind === 'profile' && (
        <div
          style={innerCardStyle}
          className="relative flex h-full items-center gap-3 rounded-xl border p-2.5"
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
              color: '#FFFFFF',
            }}
            className="grid size-12 shrink-0 place-items-center rounded-full font-mono text-xs font-extrabold shadow-md"
          >
            ORX
          </div>
          <div className="flex-1 space-y-1.5">
            <div
              className="h-2.5 w-24 rounded-full"
              style={{ backgroundColor: '#FFFFFF' }}
            />
            <div className="flex gap-1.5 pt-1">
              <span
                className="h-5 flex-1 rounded-md border"
                style={{
                  backgroundColor: 'rgba(14, 165, 233, 0.22)',
                  borderColor: 'rgba(56, 189, 248, 0.35)',
                }}
              />
              <span
                className="h-5 flex-1 rounded-md border"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.22)',
                  borderColor: 'rgba(129, 140, 248, 0.35)',
                }}
              />
              <span
                className="h-5 flex-1 rounded-md border"
                style={{
                  backgroundColor: '#1E293B',
                  borderColor: '#334155',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {kind === 'services_pkg' && (
        <div className="relative grid h-full grid-cols-2 gap-2">
          <div
            style={innerCardStyle}
            className="flex flex-col justify-between rounded-xl border p-2.5"
          >
            <span
              className="h-2 w-12 rounded-full"
              style={{ backgroundColor: '#CBD5E1' }}
            />
            <span style={{ color: '#FFFFFF' }} className="font-mono text-xs font-extrabold">
              4,500 ر.س
            </span>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #1E3A8A, #172554)',
              borderColor: '#3B82F6',
              color: '#FFFFFF',
            }}
            className="flex flex-col justify-between rounded-xl border p-2.5"
          >
            <span
              className="h-2 w-14 rounded-full"
              style={{ backgroundColor: '#7DD3FC' }}
            />
            <span style={{ color: '#38BDF8' }} className="font-mono text-xs font-extrabold">
              8,200 ر.س
            </span>
          </div>
        </div>
      )}

      {kind === 'loyalty' && (
        <div
          style={innerCardStyle}
          className="relative flex h-full flex-col justify-between rounded-xl border p-2.5"
        >
          <div
            style={{ color: '#E2E8F0' }}
            className="flex items-center justify-between text-[10px] font-bold"
          >
            <span>بطاقة الولاء الذكية</span>
            <span style={{ color: '#C4B5FD' }} className="font-mono">
              4 / 5 أختام
            </span>
          </div>
          <div className="flex items-center justify-between gap-1.5">
            {[1, 2, 3, 4, 5].map((stamp) => (
              <div
                key={stamp}
                style={
                  stamp <= 4
                    ? {
                        background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                        color: '#FFFFFF',
                      }
                    : {
                        backgroundColor: '#1E293B',
                        borderColor: '#475569',
                        color: '#94A3B8',
                      }
                }
                className={`grid size-8 place-items-center rounded-full font-mono text-[10px] font-extrabold ${
                  stamp > 4 ? 'border border-dashed' : 'shadow-xs'
                }`}
              >
                {stamp <= 4 ? '✓' : '5'}
              </div>
            ))}
          </div>
        </div>
      )}

      {kind === 'reviews' && (
        <div
          style={innerCardStyle}
          className="relative flex h-full items-center justify-between rounded-xl border px-3.5 py-2.5"
        >
          <div>
            <div className="flex items-center gap-1" style={{ color: '#38BDF8' }}>
              {['★', '★', '★', '★', '★'].map((s, i) => (
                <span key={i} className="text-sm leading-none">
                  {s}
                </span>
              ))}
            </div>
            <p style={{ color: '#E2E8F0' }} className="mt-1.5 text-[11px] font-bold">
              تقييم موثق على Google
            </p>
          </div>
          <span
            style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
            className="rounded-lg px-2.5 py-1 font-mono text-xl font-extrabold"
          >
            4.9
          </span>
        </div>
      )}

      {kind === 'survey' && (
        <div
          style={innerCardStyle}
          className="relative flex h-full flex-col justify-between rounded-xl border p-2.5"
        >
          <div
            style={{ color: '#E2E8F0' }}
            className="flex items-center justify-between text-[10px] font-bold"
          >
            <span>مؤشر رضا العملاء CSAT</span>
            <span style={{ color: '#38BDF8' }} className="font-mono">
              96%
            </span>
          </div>
          <div className="space-y-1.5">
            <div
              className="h-2.5 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: '#1E293B' }}
            >
              <div
                className="h-full w-[92%] rounded-full"
                style={{ background: 'linear-gradient(90deg, #38BDF8, #2563EB)' }}
              />
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: '#1E293B' }}
            >
              <div
                className="h-full w-[76%] rounded-full"
                style={{ backgroundColor: '#818CF8' }}
              />
            </div>
          </div>
        </div>
      )}

      {kind === 'quiz' && (
        <div
          style={innerCardStyle}
          className="relative flex h-full items-center justify-between rounded-xl border px-3.5 py-2"
        >
          <div className="space-y-1.5">
            <span style={{ color: '#C4B5FD' }} className="block text-[10px] font-bold">
              النتيجة الفورية
            </span>
            <div
              className="h-2 w-24 rounded-full"
              style={{ backgroundColor: '#FFFFFF' }}
            />
            <div
              className="h-1.5 w-16 rounded-full"
              style={{ backgroundColor: '#94A3B8' }}
            />
          </div>
          <div
            style={{
              backgroundColor: '#2E1065',
              borderColor: '#A78BFA',
              color: '#FFFFFF',
            }}
            className="grid size-12 place-items-center rounded-full border-4 font-mono text-xs font-extrabold"
          >
            95%
          </div>
        </div>
      )}

      {kind === 'poll' && (
        <div
          style={innerCardStyle}
          className="relative flex h-full items-end justify-between gap-2 rounded-xl border p-2.5"
        >
          {[
            { pct: '68%', h: 'h-12', color: '#34D399' },
            { pct: '22%', h: 'h-8', color: '#38BDF8' },
            { pct: '10%', h: 'h-4', color: '#64748B' },
          ].map((bar, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span style={{ color: '#E2E8F0' }} className="font-mono text-[10px] font-bold">
                {bar.pct}
              </span>
              <div
                className={`w-full rounded-t-md ${bar.h}`}
                style={{ backgroundColor: bar.color }}
              />
            </div>
          ))}
        </div>
      )}

      {kind === 'invite' && (
        <div
          style={{
            background: 'linear-gradient(90deg, #0F172A, #172554)',
            borderColor: 'rgba(96, 165, 250, 0.35)',
            color: '#FFFFFF',
          }}
          className="relative flex h-full items-center justify-between rounded-xl border px-3.5 py-2.5"
        >
          <div>
            <span style={{ color: '#38BDF8' }} className="font-mono text-[10px] font-bold">
              VIP PASS · 2025
            </span>
            <div
              className="mt-1 h-2.5 w-24 rounded-full"
              style={{ backgroundColor: '#FFFFFF' }}
            />
          </div>
          {/* Barcode bars */}
          <div
            style={{ borderColor: 'rgba(255, 255, 255, 0.25)' }}
            className="flex h-10 items-center gap-0.5 border-r border-dashed pr-3"
          >
            {[2, 1, 3, 1, 2, 1, 3, 2].map((w, i) => (
              <span
                key={i}
                className="h-full"
                style={{ width: `${w * 2}px`, backgroundColor: '#7DD3FC' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Interactive visual card inside the WhatsApp Executive Companion phone screen.
 */
export function BotVisualAttachment({
  pillarId,
}: {
  pillarId: 'auth' | 'edit' | 'analytics';
}) {
  if (pillarId === 'auth') {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #0F172A 70%, #020617 100%)',
          backgroundColor: '#0F172A',
          borderColor: 'rgba(52, 211, 153, 0.35)',
          color: '#FFFFFF',
        }}
        className="mt-3 rounded-xl border p-4"
      >
        <div className="flex items-center justify-between">
          <span style={{ color: '#6EE7B7' }} className="text-xs font-bold">
            درع التوثيق السيادي
          </span>
          <span style={{ color: '#38BDF8' }} className="font-mono text-xs font-bold">
            TLS 1.3 · OTP
          </span>
        </div>
        <div
          style={{
            backgroundColor: '#020617',
            borderColor: 'rgba(255, 255, 255, 0.14)',
          }}
          className="mt-3 flex items-center justify-between rounded-lg border px-4 py-2.5"
        >
          <span
            style={{ color: '#FFFFFF' }}
            className="font-mono text-lg font-extrabold tracking-widest"
          >
            ORX-849201
          </span>
          <span style={{ color: '#34D399' }} className="text-xs font-bold">
            ✓ تم التحقق
          </span>
        </div>
      </div>
    );
  }

  if (pillarId === 'edit') {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 70%, #020617 100%)',
          backgroundColor: '#0F172A',
          borderColor: 'rgba(129, 140, 248, 0.35)',
          color: '#FFFFFF',
        }}
        className="mt-3 rounded-xl border p-4"
      >
        <div
          style={{ color: '#A5B4FC' }}
          className="flex items-center justify-between text-xs font-bold"
        >
          <span>مزامنة الموقع المنشور</span>
          <span style={{ color: '#38BDF8' }} className="font-mono">
            0.8s
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div
            style={{
              backgroundColor: '#1E293B',
              borderColor: 'rgba(255, 255, 255, 0.12)',
            }}
            className="rounded-lg border p-2.5"
          >
            <span style={{ color: '#94A3B8' }} className="block text-[11px]">
              السعر السابق
            </span>
            <span
              style={{ color: '#94A3B8' }}
              className="font-mono text-sm font-bold line-through"
            >
              68 ر.س
            </span>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.18)',
              borderColor: 'rgba(52, 211, 153, 0.45)',
            }}
            className="rounded-lg border p-2.5"
          >
            <span style={{ color: '#6EE7B7' }} className="block text-[11px]">
              السعر المعتمد الآن
            </span>
            <span style={{ color: '#FFFFFF' }} className="font-mono text-base font-extrabold">
              64 ر.س
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0C4A6E 0%, #0F172A 70%, #020617 100%)',
        backgroundColor: '#0F172A',
        borderColor: 'rgba(56, 189, 248, 0.35)',
        color: '#FFFFFF',
      }}
      className="mt-3 rounded-xl border p-4"
    >
      <div
        style={{ color: '#7DD3FC' }}
        className="flex items-center justify-between text-xs font-bold"
      >
        <span>مؤشر الزيارات والمبيعات الحية</span>
        <span style={{ color: '#34D399' }} className="font-mono">
          +24% اليوم
        </span>
      </div>
      <div className="mt-3 flex h-16 items-end justify-between gap-2 px-1">
        {[35, 48, 42, 64, 78, 86, 100].map((h, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md transition-all duration-500"
              style={{
                height: `${Math.round((h / 100) * 54)}px`,
                background:
                  i === 6
                    ? 'linear-gradient(180deg, #34D399 0%, #059669 100%)'
                    : 'linear-gradient(180deg, #38BDF8 0%, #2563EB 100%)',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
