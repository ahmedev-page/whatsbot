import type { HTMLAttributes } from 'react';

export function Card({ children, className = '', style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-[#CBD5E1] bg-white text-[#0F172A] shadow-[0_8px_24px_-12px_rgba(15,23,42,0.06)] ${className}`}
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#CBD5E1',
        color: '#0F172A',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
