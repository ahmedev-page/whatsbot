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
        backgroundImage: 'linear-gradient(180deg, #030712 0%, #060D21 48%, #040917 100%)',
        backgroundColor: '#030712',
      }}
    >
      {/* Sweeping planetary blue arc from top-center to left (matching reference image) */}
      <svg
        className="absolute inset-x-0 top-0 h-[760px] w-full"
        viewBox="0 0 1440 760"
        fill="none"
        preserveAspectRatio="xMidYMin slice"
        style={{ width: '100%', height: '760px', display: 'block' }}
      >
        <defs>
          <radialGradient id="orx-planet-glow" cx="38%" cy="18%" r="58%">
            <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.34" />
            <stop offset="45%" stopColor="#0EA5E9" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#030712" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="orx-arc-edge" x1="65%" y1="0%" x2="10%" y2="85%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
          </linearGradient>
          <filter id="orx-soft-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="24" />
          </filter>
        </defs>

        {/* Soft volumetric blue fill behind top-left / center */}
        <path
          d="M 0 0 L 890 0 C 830 230 620 430 220 520 L 0 550 Z"
          fill="url(#orx-planet-glow)"
        />
        {/* Crisp glowing rim arc */}
        <path
          d="M 885 -10 C 825 225 615 425 180 525"
          stroke="url(#orx-arc-edge)"
          strokeWidth="2.5"
        />
        <path
          d="M 885 -10 C 825 225 615 425 180 525"
          stroke="#38BDF8"
          strokeOpacity="0.28"
          strokeWidth="14"
          filter="url(#orx-soft-blur)"
        />
      </svg>

      {/* Deep ambient radial spotlights */}
      <div
        className="absolute top-28 left-[8%] h-[420px] w-[520px] rounded-full blur-3xl"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(14, 165, 233, 0.22) 0%, rgba(37, 99, 235, 0.1) 55%, transparent 100%)',
        }}
      />
      <div
        className="absolute top-[520px] right-[12%] h-[360px] w-[520px] rounded-full blur-3xl"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(37, 99, 235, 0.14) 0%, transparent 75%)',
        }}
      />
    </div>
  );
}

/**
 * 100% Self-Contained SVG 3D Isometric Tilted Glass Browser Mockup with floating ORxai cube badge,
 * 4 compact left-rail icons, scenic coastal preview window, and glowing orbital light ring.
 * Rendered entirely inside a locked SVG viewBox so it scales proportionally on every mobile & desktop screen
 * and can never expand into large HTML buttons.
 */
export function HeroIsometricBrowserShowcase({
  activeTab = 0,
  onSelectTab,
  previewTitle = 'ORxai Digital Suite',
  previewCta = 'استكشف الواجهة',
}: {
  activeTab?: number;
  onSelectTab?: (index: number) => void;
  previewTitle?: string;
  previewSubtitle?: string;
  previewCta?: string;
}) {
  const railTabs = [
    { idx: 0, label: 'المواقع والواجهات', y: 98 },
    { idx: 1, label: 'المتاجر والمنتجات', y: 150 },
    { idx: 2, label: 'التحليلات والتقارير', y: 202 },
    { idx: 3, label: 'الإعدادات والأدوات', y: 254 },
  ];

  return (
    <div
      className="relative mx-auto w-full select-none"
      style={{
        width: '100%',
        maxWidth: '490px',
        margin: '0 auto',
      }}
    >
      <svg
        dir="ltr"
        viewBox="0 0 540 400"
        fill="none"
        className="block h-auto w-full overflow-visible"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          overflow: 'visible',
          direction: 'ltr',
        }}
      >
        <defs>
          {/* Ambient bottom-left floor glow */}
          <radialGradient id="orx-iso-floor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.46" />
            <stop offset="48%" stopColor="#2563EB" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#030712" stopOpacity="0" />
          </radialGradient>

          {/* Back glass layer gradient */}
          <linearGradient id="orx-iso-back" x1="30" y1="50" x2="430" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10204A" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#060D22" stopOpacity="0.88" />
          </linearGradient>

          {/* Main glass browser body gradient */}
          <linearGradient id="orx-iso-body" x1="55" y1="35" x2="485" y2="365" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#14285C" stopOpacity="0.92" />
            <stop offset="55%" stopColor="#09132E" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#050A1A" stopOpacity="0.98" />
          </linearGradient>

          {/* Glowing cyan border for main window */}
          <linearGradient id="orx-iso-border" x1="55" y1="35" x2="485" y2="365" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.65" />
          </linearGradient>

          {/* Floating ORxai Cube Badge gradient */}
          <linearGradient id="orx-cube-bg" x1="220" y1="10" x2="310" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#162D66" />
            <stop offset="100%" stopColor="#07112B" />
          </linearGradient>

          <linearGradient id="orx-x-mark1" x1="248" y1="32" x2="282" y2="66" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="orx-x-mark2" x1="282" y1="32" x2="248" y2="66" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Scenic Sky & Ocean gradients inside preview */}
          <linearGradient id="orx-scenic-sky" x1="150" y1="100" x2="450" y2="235" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="52%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#BAE6FD" />
          </linearGradient>
          <linearGradient id="orx-scenic-sea" x1="150" y1="190" x2="450" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="orx-cta-pill" x1="175" y1="195" x2="275" y2="215" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>

          {/* Orbital Ring gradient */}
          <linearGradient id="orx-orbit-stroke" x1="10" y1="220" x2="525" y2="330" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.92" />
          </linearGradient>

          <filter id="orx-window-shadow" x="-15%" y="-15%" width="130%" height="135%">
            <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#020617" floodOpacity="0.9" />
          </filter>
          <filter id="orx-cube-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0284C7" floodOpacity="0.55" />
          </filter>
          <clipPath id="orx-preview-clip">
            <rect x="148" y="84" width="304" height="162" rx="16" />
          </clipPath>
        </defs>

        {/* Bottom-left floor spotlight under the 3D window */}
        <ellipse cx="195" cy="352" rx="175" ry="38" fill="url(#orx-iso-floor)" />

        {/* ============================================================
            3D ISOMETRIC TILTED STAGE (skewY(6.5deg) rotate(-3deg))
        ============================================================ */}
        <g transform="translate(14, -4) rotate(-3.5 260 200) skewY(6.5) scale(0.95, 0.96)">
          {/* 1. Back Layered Glass Window for 3D Depth */}
          <rect
            x="34"
            y="58"
            width="416"
            height="282"
            rx="24"
            fill="url(#orx-iso-back)"
            stroke="#38BDF8"
            strokeOpacity="0.28"
            strokeWidth="1.5"
          />
          {/* Back window dots */}
          <circle cx="58" cy="80" r="3.5" fill="#64748B" fillOpacity="0.5" />
          <circle cx="70" cy="80" r="3.5" fill="#64748B" fillOpacity="0.4" />
          <circle cx="82" cy="80" r="3.5" fill="#38BDF8" fillOpacity="0.5" />

          {/* 2. Main Front 3D Glass Browser Window */}
          <g filter="url(#orx-window-shadow)">
            <rect
              x="64"
              y="42"
              width="418"
              height="292"
              rx="24"
              fill="url(#orx-iso-body)"
              stroke="url(#orx-iso-border)"
              strokeWidth="2"
            />
            {/* Subtle inner top glass highlight */}
            <rect
              x="66"
              y="44"
              width="414"
              height="288"
              rx="22"
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          </g>

          {/* Browser Top Chrome Dots */}
          <circle cx="90" cy="64" r="4" fill="#94A3B8" fillOpacity="0.55" />
          <circle cx="104" cy="64" r="4" fill="#94A3B8" fillOpacity="0.4" />
          <circle cx="118" cy="64" r="4" fill="#38BDF8" fillOpacity="0.7" />
          <rect x="408" y="61" width="50" height="6" rx="3" fill="#38BDF8" fillOpacity="0.2" />

          {/* 3. Left Vertical Icon Rail (4 Small Rounded Glass Squares locked inside SVG) */}
          {railTabs.map(({ idx, label, y }) => {
            const isActive = activeTab === idx;
            return (
              <g
                key={label}
                role="button"
                tabIndex={0}
                aria-label={label}
                onClick={() => onSelectTab?.(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTab?.(idx);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <title>{label}</title>
                <rect
                  x="84"
                  y={y}
                  width="44"
                  height="42"
                  rx="11"
                  fill={isActive ? '#172E6E' : '#0B1636'}
                  fillOpacity={isActive ? '0.95' : '0.82'}
                  stroke={isActive ? '#38BDF8' : '#475569'}
                  strokeOpacity={isActive ? '0.95' : '0.45'}
                  strokeWidth={isActive ? '1.8' : '1.2'}
                />
                {/* Icon 0: Wireframe Globe */}
                {idx === 0 && (
                  <g transform={`translate(94, ${y + 9})`} stroke={isActive ? '#E0F2FE' : '#93C5FD'} strokeWidth="1.6" fill="none">
                    <circle cx="12" cy="12" r="9.5" />
                    <ellipse cx="12" cy="12" rx="4.5" ry="9.5" />
                    <line x1="2.5" y1="12" x2="21.5" y2="12" />
                  </g>
                )}
                {/* Icon 1: 3D Isometric Cube */}
                {idx === 1 && (
                  <g transform={`translate(94, ${y + 9})`} stroke={isActive ? '#E0F2FE' : '#93C5FD'} strokeWidth="1.6" strokeLinejoin="round" fill="none">
                    <polygon points="12,2.5 21,7.5 12,12.5 3,7.5" />
                    <polyline points="3,7.5 3,17 12,22 21,17 21,7.5" />
                    <line x1="12" y1="12.5" x2="12" y2="22" />
                  </g>
                )}
                {/* Icon 2: Analytics Bar Chart */}
                {idx === 2 && (
                  <g transform={`translate(94, ${y + 9})`} fill={isActive ? '#E0F2FE' : '#93C5FD'}>
                    <rect x="4" y="12" width="3.5" height="8" rx="1" />
                    <rect x="10.2" y="6" width="3.5" height="14" rx="1" />
                    <rect x="16.4" y="9" width="3.5" height="11" rx="1" />
                  </g>
                )}
                {/* Icon 3: Settings Gear */}
                {idx === 3 && (
                  <g transform={`translate(94, ${y + 9})`} stroke={isActive ? '#E0F2FE' : '#93C5FD'} strokeWidth="1.7" strokeLinecap="round" fill="none">
                    <circle cx="12" cy="12" r="4" />
                    <line x1="12" y1="3" x2="12" y2="5.5" />
                    <line x1="12" y1="18.5" x2="12" y2="21" />
                    <line x1="3" y1="12" x2="5.5" y2="12" />
                    <line x1="18.5" y1="12" x2="21" y2="12" />
                    <line x1="5.6" y1="5.6" x2="7.4" y2="7.4" />
                    <line x1="16.6" y1="16.6" x2="18.4" y2="18.4" />
                    <line x1="18.4" y1="5.6" x2="16.6" y2="7.4" />
                    <line x1="7.4" y1="16.6" x2="5.6" y2="18.4" />
                  </g>
                )}
              </g>
            );
          })}

          {/* 4. Inner Website Preview Window (Frosted Top Header + Coastal Cliff Horizon + Blue Pill Button) */}
          <g clipPath="url(#orx-preview-clip)">
            {/* Scenic Sky & Ocean Background */}
            <rect x="148" y="84" width="304" height="162" fill="url(#orx-scenic-sky)" />

            {/* Sun & Coastal Cliff Silhouette on the Right */}
            <circle cx="385" cy="145" r="32" fill="#FDE68A" fillOpacity="0.32" />
            <path
              d="M 305 208 L 352 136 L 395 150 L 428 124 L 456 138 L 456 218 L 305 218 Z"
              fill="#334155"
              fillOpacity="0.88"
            />
            <path
              d="M 336 210 L 378 148 L 418 162 L 456 136 L 456 218 L 336 218 Z"
              fill="#1E293B"
            />

            {/* Ocean Horizon Water */}
            <rect x="148" y="204" width="304" height="44" fill="url(#orx-scenic-sea)" />
            <path
              d="M 148 214 Q 230 207 315 216 T 452 212"
              stroke="#7DD3FC"
              strokeOpacity="0.45"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Top Frosted Browser Bar inside Website Preview */}
            <rect x="148" y="84" width="304" height="32" fill="#E2E8F0" fillOpacity="0.94" />
            {/* Mini ORxai mark & title bar inside preview */}
            <circle cx="168" cy="100" r="4.5" fill="#2563EB" />
            <rect x="178" y="96.5" width="58" height="7" rx="3.5" fill="#0F172A" fillOpacity="0.82" />
            <rect x="364" y="96" width="26" height="7" rx="3.5" fill="#94A3B8" />
            <rect x="396" y="96" width="18" height="7" rx="3.5" fill="#CBD5E1" />
            <rect x="420" y="94" width="20" height="11" rx="5.5" fill="#2563EB" />

            {/* Frosted Overlay Card on Left of Scenic Preview */}
            <rect
              x="164"
              y="128"
              width="168"
              height="52"
              rx="10"
              fill="#0F172A"
              fillOpacity="0.42"
              stroke="#FFFFFF"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
            <rect x="176" y="140" width="124" height="7" rx="3.5" fill="#FFFFFF" fillOpacity="0.92" />
            <rect x="176" y="153" width="94" height="5.5" rx="2.75" fill="#E2E8F0" fillOpacity="0.7" />
            <rect x="176" y="164" width="68" height="5" rx="2.5" fill="#7DD3FC" fillOpacity="0.85" />

            {/* Glowing Blue CTA Pill inside Preview */}
            <rect
              x="168"
              y="192"
              width="96"
              height="26"
              rx="13"
              fill="url(#orx-cta-pill)"
            />
            <rect x="186" y="202" width="60" height="6" rx="3" fill="#FFFFFF" fillOpacity="0.95" />

            {/* Bottom-right mini status dots inside scenic preview */}
            <rect x="394" y="218" width="44" height="16" rx="8" fill="#0F172A" fillOpacity="0.55" />
            <circle cx="406" cy="226" r="3" fill="#38BDF8" />
            <circle cx="416" cy="226" r="3" fill="#FFFFFF" fillOpacity="0.7" />
            <circle cx="426" cy="226" r="3" fill="#FFFFFF" fillOpacity="0.4" />
          </g>

          {/* Crisp border around the inner preview window */}
          <rect
            x="148"
            y="84"
            width="304"
            height="162"
            rx="16"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.35"
            strokeWidth="1.2"
          />

          {/* 5. Bottom Two Dark Glass Cards inside Browser */}
          <rect
            x="148"
            y="258"
            width="145"
            height="56"
            rx="12"
            fill="#0B1532"
            fillOpacity="0.88"
            stroke="#38BDF8"
            strokeOpacity="0.28"
            strokeWidth="1.2"
          />
          <rect x="162" y="271" width="54" height="6" rx="3" fill="#38BDF8" fillOpacity="0.9" />
          <circle cx="277" cy="274" r="3.5" fill="#34D399" />
          <rect x="162" y="286" width="92" height="6" rx="3" fill="#FFFFFF" fillOpacity="0.75" />
          <rect x="162" y="298" width="62" height="5" rx="2.5" fill="#64748B" fillOpacity="0.65" />

          <rect
            x="307"
            y="258"
            width="145"
            height="56"
            rx="12"
            fill="#0B1532"
            fillOpacity="0.88"
            stroke="#38BDF8"
            strokeOpacity="0.28"
            strokeWidth="1.2"
          />
          <rect x="321" y="271" width="62" height="6" rx="3" fill="#93C5FD" fillOpacity="0.85" />
          <circle cx="436" cy="274" r="3.5" fill="#38BDF8" />
          <rect x="321" y="286" width="80" height="6" rx="3" fill="#38BDF8" fillOpacity="0.78" />
          <rect x="321" y="298" width="98" height="5" rx="2.5" fill="#64748B" fillOpacity="0.6" />

          {/* 6. Floating 3D ORxai Monogram Cube Badge at Top-Center of Browser */}
          <g filter="url(#orx-cube-glow)" transform="translate(8, -6) rotate(4 265 48)">
            {/* Back 3D thickness plate */}
            <rect
              x="225"
              y="15"
              width="74"
              height="68"
              rx="18"
              fill="#071029"
              stroke="#38BDF8"
              strokeOpacity="0.4"
              strokeWidth="1.5"
            />
            {/* Front 3D Cube Face */}
            <rect
              x="229"
              y="11"
              width="74"
              height="68"
              rx="18"
              fill="url(#orx-cube-bg)"
              stroke="#7DD3FC"
              strokeOpacity="0.85"
              strokeWidth="2"
            />
            {/* Glowing X Mark inside Cube */}
            <path d="M249 29L258 29L283 61L274 61L249 29Z" fill="url(#orx-x-mark1)" />
            <path d="M283 29L274 29L249 61L258 61L283 29Z" fill="url(#orx-x-mark2)" />
            <circle cx="266" cy="45" r="3.2" fill="#E0F2FE" />
          </g>
        </g>

        {/* ============================================================
            GLOWING ORBITAL LIGHT RING SWEEPING ACROSS THE 3D BROWSER
        ============================================================ */}
        <g className="pointer-events-none">
          <ellipse
            cx="268"
            cy="264"
            rx="252"
            ry="62"
            transform="rotate(11 268 264)"
            stroke="#38BDF8"
            strokeOpacity="0.28"
            strokeWidth="7"
            style={{ filter: 'blur(5px)' }}
          />
          <ellipse
            cx="268"
            cy="264"
            rx="252"
            ry="62"
            transform="rotate(11 268 264)"
            stroke="url(#orx-orbit-stroke)"
            strokeWidth="2.2"
          />
          {/* Bright orbital light beads */}
          <circle cx="24" cy="216" r="4" fill="#E0F2FE" />
          <circle cx="24" cy="216" r="9" fill="#38BDF8" fillOpacity="0.45" />
          <circle cx="486" cy="316" r="4.5" fill="#7DD3FC" />
          <circle cx="486" cy="316" r="10" fill="#38BDF8" fillOpacity="0.38" />
        </g>
      </svg>
    </div>
  );
}

/**
 * 3D Hexagonal Wireframe Globe Icon for the "مواقع وواجهات" card.
 */
export function CategoryHexGlobeIcon() {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{
        width: 'clamp(46px, 11vw, 88px)',
        height: 'clamp(46px, 11vw, 88px)',
        flexShrink: 0,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-1 rounded-full blur-md sm:blur-xl"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(56, 189, 248, 0.38) 0%, transparent 72%)' }}
      />
      <svg
        viewBox="0 0 120 120"
        className="size-full overflow-visible"
        fill="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id="orx-hex-bg" x1="15" y1="10" x2="105" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#091534" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id="orx-hex-border" x1="15" y1="10" x2="105" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="orx-globe-stroke" x1="30" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>
        {/* Outer 3D Hexagon */}
        <polygon
          points="60,10 104,35 104,85 60,110 16,85 16,35"
          fill="url(#orx-hex-bg)"
          stroke="url(#orx-hex-border)"
          strokeWidth="2"
        />
        <polygon
          points="60,17 97,38 97,82 60,103 23,82 23,38"
          fill="none"
          stroke="#38BDF8"
          strokeOpacity="0.22"
          strokeWidth="1"
        />
        {/* Glowing Wireframe Globe */}
        <circle
          cx="60"
          cy="60"
          r="26"
          stroke="url(#orx-globe-stroke)"
          strokeWidth="2.2"
          fill="rgba(14, 165, 233, 0.1)"
        />
        <ellipse
          cx="60"
          cy="60"
          rx="13"
          ry="26"
          stroke="url(#orx-globe-stroke)"
          strokeWidth="1.8"
        />
        <line x1="34" y1="60" x2="86" y2="60" stroke="#7DD3FC" strokeWidth="1.8" />
        <path
          d="M 38 47 Q 60 53 82 47"
          stroke="#38BDF8"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M 38 73 Q 60 67 82 73"
          stroke="#38BDF8"
          strokeWidth="1.6"
          fill="none"
        />
      </svg>
    </div>
  );
}

/**
 * 3D Isometric Stacked Layers Icon for the "أدوات تفاعلية" card.
 */
export function CategoryStackedLayersIcon() {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{
        width: 'clamp(46px, 11vw, 88px)',
        height: 'clamp(46px, 11vw, 88px)',
        flexShrink: 0,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-1 rounded-full blur-md sm:blur-xl"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.38) 0%, transparent 72%)' }}
      />
      <svg
        viewBox="0 0 120 120"
        className="size-full overflow-visible"
        fill="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id="orx-hex2-bg" x1="15" y1="10" x2="105" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#091534" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id="orx-hex2-border" x1="15" y1="10" x2="105" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="orx-layer-top" x1="30" y1="30" x2="90" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="orx-layer-mid" x1="30" y1="45" x2="90" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="orx-layer-bot" x1="30" y1="60" x2="90" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
        </defs>
        {/* Outer 3D Hexagon */}
        <polygon
          points="60,10 104,35 104,85 60,110 16,85 16,35"
          fill="url(#orx-hex2-bg)"
          stroke="url(#orx-hex2-border)"
          strokeWidth="2"
        />
        {/* Bottom isometric layer */}
        <polygon
          points="60,64 88,78 60,92 32,78"
          fill="url(#orx-layer-bot)"
          stroke="#60A5FA"
          strokeOpacity="0.55"
          strokeWidth="1.2"
        />
        {/* Middle isometric layer */}
        <polygon
          points="60,50 88,64 60,78 32,64"
          fill="url(#orx-layer-mid)"
          stroke="#7DD3FC"
          strokeOpacity="0.7"
          strokeWidth="1.2"
        />
        {/* Top isometric layer */}
        <polygon
          points="60,36 88,50 60,64 32,50"
          fill="url(#orx-layer-top)"
          stroke="#E0F2FE"
          strokeOpacity="0.85"
          strokeWidth="1.4"
        />
      </svg>
    </div>
  );
}

/**
 * Sculpted 3D Metallic/Luminous Blue Infinity Loop on a dark circular pedestal
 * for the "لماذا ORxai؟" section — matching the bottom-left visual in the reference image.
 */
export function InfinityPedestalVisual() {
  return (
    <div
      className="relative mx-auto flex w-full items-center justify-center py-1 sm:py-4 select-none"
      style={{
        width: '100%',
        maxWidth: '380px',
        margin: '0 auto',
      }}
    >
      {/* Ambient radial blue glow behind the infinity sculpture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 m-auto h-36 w-36 sm:h-60 sm:w-60 rounded-full blur-2xl sm:blur-3xl"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(56, 189, 248, 0.34) 0%, rgba(37, 99, 235, 0.18) 55%, transparent 100%)',
        }}
      />

      <svg
        viewBox="0 0 420 300"
        className="relative z-10 h-auto w-full overflow-visible"
        fill="none"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          {/* Pedestal gradients */}
          <linearGradient id="orx-pedestal-top" x1="80" y1="210" x2="340" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F1F47" />
            <stop offset="50%" stopColor="#172E66" />
            <stop offset="100%" stopColor="#071026" />
          </linearGradient>
          <linearGradient id="orx-pedestal-side" x1="70" y1="240" x2="350" y2="275" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#050B1A" />
            <stop offset="48%" stopColor="#1E3A8A" />
            <stop offset="52%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#050B1A" />
          </linearGradient>
          {/* 3D Infinity ribbon gradients */}
          <linearGradient id="orx-inf-main" x1="70" y1="70" x2="350" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="32%" stopColor="#2563EB" />
            <stop offset="68%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="orx-inf-highlight" x1="80" y1="60" x2="330" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="45%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
          <filter id="orx-inf-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#020617" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* Subtle orbital light ellipses around the infinity loop */}
        <ellipse
          cx="210"
          cy="135"
          rx="178"
          ry="58"
          transform="rotate(-14 210 135)"
          stroke="#38BDF8"
          strokeOpacity="0.28"
          strokeWidth="1.2"
        />
        <ellipse
          cx="210"
          cy="130"
          rx="132"
          ry="92"
          transform="rotate(28 210 130)"
          stroke="#60A5FA"
          strokeOpacity="0.2"
          strokeWidth="1"
        />

        {/* Floor glow under pedestal */}
        <ellipse
          cx="210"
          cy="266"
          rx="148"
          ry="20"
          fill="#38BDF8"
          fillOpacity="0.22"
          style={{ filter: 'blur(12px)' }}
        />

        {/* Dark 3D Cylindrical Pedestal Base */}
        <path
          d="M 76 232 L 76 254 A 134 24 0 0 0 344 254 L 344 232 Z"
          fill="url(#orx-pedestal-side)"
        />
        <ellipse
          cx="210"
          cy="254"
          rx="134"
          ry="24"
          fill="none"
          stroke="#38BDF8"
          strokeOpacity="0.65"
          strokeWidth="1.8"
        />
        <ellipse
          cx="210"
          cy="232"
          rx="134"
          ry="24"
          fill="url(#orx-pedestal-top)"
          stroke="#60A5FA"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
        <ellipse
          cx="210"
          cy="230"
          rx="112"
          ry="18"
          fill="#071128"
          stroke="#38BDF8"
          strokeOpacity="0.25"
          strokeWidth="1"
        />
        {/* Bright spark on pedestal front rim */}
        <circle cx="215" cy="277" r="3" fill="#E0F2FE" />
        <ellipse
          cx="215"
          cy="277"
          rx="26"
          ry="4"
          fill="#38BDF8"
          fillOpacity="0.75"
          style={{ filter: 'blur(4px)' }}
        />

        {/* Sculpted 3D Infinity Ribbon with dynamic 3D tilt matching reference image */}
        <g filter="url(#orx-inf-shadow)" transform="rotate(-9 210 130)">
          {/* Back/Underneath ribbon stroke for 3D thickness */}
          <path
            d="M 210 132 C 172 82, 92 82, 92 134 C 92 186, 172 186, 210 132 C 248 78, 328 78, 328 130 C 328 182, 248 182, 210 132 Z"
            stroke="#0F172A"
            strokeWidth="34"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Main 3D sculpted gradient body */}
          <path
            d="M 210 128 C 172 78, 92 78, 92 130 C 92 182, 172 182, 210 128 C 248 74, 328 74, 328 126 C 328 178, 248 178, 210 128 Z"
            stroke="url(#orx-inf-main)"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Specular top rim highlight */}
          <path
            d="M 210 124 C 172 74, 92 74, 92 126 C 92 178, 172 178, 210 124 C 248 70, 328 70, 328 122 C 328 174, 248 174, 210 124 Z"
            stroke="url(#orx-inf-highlight)"
            strokeWidth="6"
            strokeOpacity="0.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
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
      style={{ backgroundColor: fromColor === 'transparent' ? '#040917' : fromColor }}
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
      {(presetId === 'survey' ||
        presetId === 'rsvp' ||
        presetId === 'invoice' ||
        presetId === 'vcard' ||
        presetId === 'portfolio') && (
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
      <path
        d="M0 96C90 74 180 112 270 86C310 74 340 82 360 90V120H0V96Z"
        fill={primaryHex}
        fillOpacity="0.18"
      />
    </svg>
  );
}

/**
 * Bespoke mini-UI schematic / vector shape illustration for each service card.
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
        backgroundImage: 'linear-gradient(135deg, #0B132B 0%, #0F172A 60%, #1E293B 100%)',
        backgroundColor: '#0B132B',
        borderColor: '#1E293B',
        color: '#FFFFFF',
      }}
      className="relative h-28 w-full overflow-hidden rounded-2xl border p-3 text-white shadow-inner transition-transform duration-300 group-hover:scale-[1.015]"
    >
      <div
        className="pointer-events-none absolute -top-8 -left-8 h-24 w-24 rounded-full opacity-35 blur-xl transition-opacity duration-300 group-hover:opacity-55"
        style={{ backgroundImage: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
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
              style={{ backgroundImage: `linear-gradient(135deg, ${accentFrom}40, ${accentTo}22)` }}
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
                style={{ backgroundImage: box.bg }}
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
              backgroundImage: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
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
              backgroundImage: 'linear-gradient(135deg, #1E3A8A, #172554)',
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
                        backgroundImage: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                        backgroundColor: '#4F46E5',
                        color: '#FFFFFF',
                      }
                    : {
                        backgroundImage: 'none',
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
                style={{ backgroundImage: 'linear-gradient(90deg, #38BDF8, #2563EB)' }}
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
            backgroundImage: 'linear-gradient(90deg, #0F172A, #172554)',
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
          backgroundImage: 'linear-gradient(135deg, #064E3B 0%, #0F172A 70%, #020617 100%)',
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
          backgroundImage: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 70%, #020617 100%)',
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
        backgroundImage: 'linear-gradient(135deg, #0C4A6E 0%, #0F172A 70%, #020617 100%)',
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
                backgroundImage:
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
