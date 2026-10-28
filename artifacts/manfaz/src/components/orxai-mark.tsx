// Recreation of the ORxai ribbon monogram (the "O" ring interlocking with
// an "R" hook-and-leg swoosh) as real, animatable SVG — not a static image.
// `animated` plays a one-time draw-in + settle sequence (see the
// `.orxai-mark-animated` rules in index.css); omit it for a plain static
// mark in headers, footers, and badges.
export function OrxaiMark({ className = '', animated = false, monochrome = false, 'aria-hidden': ariaHidden }: { className?: string; animated?: boolean; monochrome?: boolean; 'aria-hidden'?: boolean }) {
  const gradientId = monochrome ? undefined : 'orxai-ribbon-gradient';
  const stroke = monochrome ? 'currentColor' : `url(#${gradientId})`;
  return (
    <svg
      viewBox="0 0 240 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'orxai-mark-animated' : ''} ${className}`}
      role={ariaHidden ? undefined : 'img'}
      aria-label={ariaHidden ? undefined : 'ORxai'}
      aria-hidden={ariaHidden}
    >
      {!monochrome && (
        <defs>
          <linearGradient id={gradientId} x1="10%" y1="0%" x2="95%" y2="100%">
            <stop offset="0%" stopColor="#4a4d52" />
            <stop offset="45%" stopColor="#16171a" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
        </defs>
      )}
      {/* the "O" ring */}
      <circle
        className={animated ? 'orxai-stroke' : ''}
        pathLength={1}
        cx="68"
        cy="66"
        r="42"
        stroke={stroke}
        strokeWidth="24"
      />
      {/* the "R" hook + diagonal leg, one continuous ribbon */}
      <path
        className={animated ? 'orxai-stroke orxai-stroke-delay' : ''}
        pathLength={1}
        d="M116,28 C142,14 172,26 169,50 C166,72 140,74 126,60 C150,78 175,94 198,112"
        stroke={stroke}
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* subtle fold shadow where the two ribbons cross, for depth */}
      <ellipse cx="112" cy="58" rx="14" ry="9" fill="#000000" opacity="0.18" />
    </svg>
  );
}
