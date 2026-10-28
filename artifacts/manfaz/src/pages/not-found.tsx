import { ArrowRight, Compass } from 'lucide-react';
import { Link } from 'wouter';
import { Brand } from '@/components/brand';

export default function NotFound() {
  return (
    <div dir="rtl" className="grain flex min-h-[100dvh] items-center justify-center bg-[#fff8ee] px-5">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center"><Brand /></div>
        <div className="mx-auto mt-16 grid size-20 place-items-center rounded-[28px] bg-[#dbe8d5] text-[#426440]"><Compass size={34} /></div>
        <p className="mt-8 text-sm font-bold text-[#158C46]">خطوة ضائعة</p>
        <h1 className="mt-3 font-serif text-3xl font-bold">هذه الصفحة غير موجودة</h1>
        <p className="mt-4 text-sm leading-7 text-[#69777d]">يبدو أن الرابط أخذ منعطفاً آخر. ارجع إلى البداية ونبدأ من جديد.</p>
        <Link href="/" className="mx-auto mt-8 inline-flex items-center gap-2 rounded-xl bg-[#1b2735] px-5 py-3 text-sm font-bold text-[#fff8ee]" data-testid="link-not-found-home">العودة إلى ORxai <ArrowRight size={17} /></Link>
      </div>
    </div>
  );
}
