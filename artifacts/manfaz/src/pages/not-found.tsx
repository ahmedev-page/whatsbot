import { ArrowLeft, Compass, LayoutGrid } from 'lucide-react';
import { Link } from 'wouter';
import { Brand } from '@/components/brand';

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="flex min-h-[100dvh] flex-col justify-between bg-[#F8FAFC] font-sans text-[#0F172A]"
      style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}
    >
      <header
        className="border-b border-[#E2E8F0] bg-white"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
      >
        <div className="mx-auto flex h-20 max-w-[1360px] items-center justify-between px-5 sm:px-8">
          <Brand href="/" />
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 text-xs font-bold text-[#0F172A] transition-colors hover:bg-[#E2E8F0]"
            style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
          >
            <LayoutGrid size={14} style={{ color: '#2563EB' }} />
            <span>لوحة التحكم</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 items-center justify-center px-5 py-16">
        <div
          className="w-full rounded-3xl border border-[#CBD5E1] bg-white p-8 text-center shadow-[0_24px_60px_-24px_rgba(15,23,42,0.1)] sm:p-12"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
        >
          <div
            className="mx-auto grid size-20 place-items-center rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
            style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
          >
            <Compass size={36} />
          </div>
          <p
            className="mt-6 font-mono text-xs font-extrabold tracking-widest uppercase text-[#2563EB]"
            style={{ color: '#2563EB' }}
          >
            ERROR 404 · ROUTE NOT FOUND
          </p>
          <h1
            className="mt-2 text-2xl font-black tracking-tight text-[#0F172A] sm:text-3xl"
            style={{ color: '#0F172A' }}
          >
            هذه الصفحة غير موجودة
          </h1>
          <p
            className="mt-3 text-sm font-medium leading-7 text-[#475569]"
            style={{ color: '#475569' }}
          >
            الرابط الذي تبحث عنه غير متاح أو تم نقله. يمكنك العودة إلى الصفحة الرئيسية لمنصة ORxai أو فتح لوحة التحكم مباشرة.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1E40AF] sm:w-auto"
              style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
              data-testid="link-not-found-home"
            >
              <span>العودة إلى ORxai</span>
              <ArrowLeft size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-6 text-sm font-bold text-[#0F172A] transition-colors hover:bg-[#E2E8F0] sm:w-auto"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
            >
              <span>دخول المنصة</span>
            </Link>
          </div>
        </div>
      </main>

      <footer
        className="border-t border-[#E2E8F0] bg-white py-5 text-center text-xs font-semibold text-[#64748B]"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#64748B' }}
      >
        ORxai Enterprise Cloud Platform
      </footer>
    </div>
  );
}
