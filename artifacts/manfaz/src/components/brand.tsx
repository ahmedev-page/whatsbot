import { Link } from 'wouter';
import { OrxaiMark } from '@/components/orxai-mark';

export function Brand({
  dark = false,
  href = '/',
  className = '',
}: {
  dark?: boolean;
  href?: string | null;
  className?: string;
}) {
  const content = (
    <>
      <span
        style={{
          backgroundImage: dark
            ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
            : 'linear-gradient(135deg, #0B132B 0%, #1D4ED8 100%)',
          backgroundColor: dark ? '#0F172A' : '#0B132B',
          borderColor: dark ? '#334155' : '#1E40AF',
          color: '#38BDF8',
        }}
        className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border shadow-md transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-lg"
      >
        <OrxaiMark monochrome className="size-6 text-current" />
      </span>
      <span
        style={{ color: dark ? '#FFFFFF' : '#0B132B' }}
        className="font-mono text-2xl font-extrabold tracking-tight whitespace-nowrap"
      >
        ORxai
      </span>
    </>
  );

  if (!href) {
    return (
      <span
        className={`group inline-flex items-center gap-3 select-none whitespace-nowrap shrink-0 ${className}`}
        data-testid="brand-logo"
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 whitespace-nowrap shrink-0 ${className}`}
      data-testid="link-brand-home"
    >
      {content}
    </Link>
  );
}