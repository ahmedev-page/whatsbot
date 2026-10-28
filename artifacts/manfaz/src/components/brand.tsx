import { ArrowUpLeft } from 'lucide-react';
import { Link } from 'wouter';
import { OrxaiMark } from '@/components/orxai-mark';

export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" data-testid="link-brand-home">
      <span className={`grid size-11 place-items-center rounded-2xl p-2 ${dark ? 'bg-[#1b2735]' : 'bg-[#f4f6f8]'} transition-transform duration-300 group-hover:-rotate-6`}>
        <OrxaiMark monochrome className={dark ? 'text-[#efb93b]' : 'text-[#101828]'} />
      </span>
      <span className="leading-none">
        <span className={`block font-serif text-xl font-bold tracking-tight ${dark ? 'text-[#fff8ee]' : 'text-[#1b2735]'}`}>ORxai</span>
        <span className={`mt-1 block text-[10px] font-semibold tracking-[.18em] ${dark ? 'text-[#efb93b]' : 'text-[#158C46]'}`}>AI WEBSITE BUILDER</span>
      </span>
      <ArrowUpLeft className={`mr-1 size-4 opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100 ${dark ? 'text-[#efb93b]' : 'text-[#158C46]'}`} />
    </Link>
  );
}