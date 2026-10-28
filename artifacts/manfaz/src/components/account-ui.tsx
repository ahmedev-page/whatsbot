import type { HTMLAttributes } from 'react';

export function Card({ children, className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-[28px] border border-[#e3e8ee] bg-white shadow-[0_1px_2px_rgba(27,39,53,.04)] ${className}`} {...rest}>
      {children}
    </div>
  );
}
