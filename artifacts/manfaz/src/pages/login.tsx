import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, MessageCircle, RefreshCw, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Brand } from '@/components/brand';
import { pollLogin, startLogin, useAccount, whatsappLoginUrl, type LoginChallenge } from '@/lib/account';
import { useQueryClient } from '@tanstack/react-query';
import { accountQueryKey } from '@/lib/account';

type Phase = 'idle' | 'starting' | 'waiting' | 'success' | 'expired' | 'error';

const STEPS = [
  { title: 'نجهّز لك كودًا', body: 'كود قصير يُستخدم مرة واحدة فقط.' },
  { title: 'ترسله من واتساب', body: 'زر واحد يفتح المحادثة والكود جاهز.' },
  { title: 'تدخل تلقائيًا', body: 'ترجع للصفحة وتجد لوحتك مفتوحة.' },
];

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

// A ring that drains as the code approaches expiry — the countdown is felt,
// not just read.
function CountdownRing({ remaining, total }: { remaining: number; total: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  return (
    <div className="relative grid size-14 place-items-center" aria-label={`ينتهي الكود خلال ${formatClock(remaining)}`}>
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#e3e8ee" strokeWidth="3.5" />
        <circle
          cx="24" cy="24" r={radius} fill="none" stroke={remaining < 60 ? '#d9822b' : '#158C46'} strokeWidth="3.5"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }}
        />
      </svg>
      <span className="font-mono text-[11px] font-bold tabular-nums text-[#1b2735]">{formatClock(remaining)}</span>
    </div>
  );
}

function CodeTiles({ code }: { code: string }) {
  // "ORX-ABC234": the prefix is identity, the six characters are the secret.
  const [prefix, secret] = [code.slice(0, 4), code.slice(4)];
  return (
    <div dir="ltr" className="flex items-center justify-center gap-1.5 sm:gap-2" data-testid="login-code">
      <span className="mr-1 font-mono text-sm font-bold tracking-widest text-[#158C46]">{prefix}</span>
      {secret.split('').map((char, index) => (
        <span
          key={`${char}-${index}`}
          className="grid h-12 w-9 place-items-center rounded-xl border border-[#d8e0e8] bg-white font-mono text-xl font-bold text-[#1b2735] shadow-[0_2px_0_#e3e8ee] sm:h-14 sm:w-11 sm:text-2xl animate-[acct-tile-in_.55s_cubic-bezier(.2,.8,.2,1)_both]"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

export default function Login() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const account = useAccount();
  const [phase, setPhase] = useState<Phase>('idle');
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(600);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const polling = useRef(false);

  // Already signed in — nothing to do here.
  useEffect(() => {
    if (account.data) navigate('/dashboard', { replace: true });
  }, [account.data, navigate]);

  const begin = useCallback(async () => {
    setPhase('starting');
    setMessage('');
    try {
      const next = await startLogin();
      const seconds = Math.max(1, Math.round((Date.parse(next.expiresAt) - Date.now()) / 1000));
      setChallenge(next);
      setTotalSeconds(seconds);
      setRemaining(seconds);
      setPhase('waiting');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذّر بدء تسجيل الدخول.');
      setPhase('error');
    }
  }, []);

  const check = useCallback(async () => {
    if (!challenge || polling.current) return;
    polling.current = true;
    try {
      const status = await pollLogin(challenge.id);
      if (status === 'authenticated') {
        setPhase('success');
        await queryClient.invalidateQueries({ queryKey: accountQueryKey });
        window.setTimeout(() => navigate('/dashboard', { replace: true }), 1100);
      } else if (status === 'expired') {
        setPhase('expired');
      }
    } catch {
      // A dropped poll isn't a failed login — the next tick tries again.
    } finally {
      polling.current = false;
    }
  }, [challenge, navigate, queryClient]);

  // Poll while waiting, and the instant the person comes back from WhatsApp.
  useEffect(() => {
    if (phase !== 'waiting') return;
    const interval = window.setInterval(() => void check(), 2000);
    const onReturn = () => { if (document.visibilityState === 'visible') void check(); };
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, [phase, check]);

  useEffect(() => {
    if (phase !== 'waiting' || !challenge) return;
    const tick = window.setInterval(() => {
      const left = Math.round((Date.parse(challenge.expiresAt) - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) setPhase('expired');
    }, 1000);
    return () => window.clearInterval(tick);
  }, [phase, challenge]);

  const copyCode = async () => {
    if (!challenge) return;
    try {
      await navigator.clipboard.writeText(challenge.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable — the code is on screen anyway */ }
  };

  const waUrl = challenge ? whatsappLoginUrl(challenge.whatsappNumber, challenge.code) : null;
  const activeStep = phase === 'success' ? 3 : phase === 'waiting' ? 1 : 0;

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#f6f8fb] font-sans text-[#1b2735]">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-[#158C46]/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-52 -left-32 size-[560px] rounded-full bg-[#caa46a]/20 blur-3xl" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-10">
        <Link href="/" data-testid="link-login-home"><Brand /></Link>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5f6b76] transition-colors hover:text-[#1b2735]">
          الرئيسية <ArrowLeft size={15} />
        </Link>
      </header>

      <section className="relative mx-auto grid max-w-5xl items-stretch gap-0 px-5 pb-16 pt-2 md:grid-cols-[1fr_1.05fr] md:px-10 md:pt-8">
        {/* Story column */}
        <div className="flex flex-col justify-center pb-10 md:pb-0 md:pl-12">
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#158C46]/10 px-3 py-1.5 text-xs font-bold text-[#0f6f37]">
            <ShieldCheck size={14} /> بدون كلمة مرور
          </span>
          <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.25] tracking-tight">
            ادخل بواتساب،<br /><span className="text-[#158C46]">في ثوانٍ.</span>
          </h1>
          <p className="mt-4 max-w-sm text-[15px] leading-8 text-[#5f6b76]">
            رقمك هو هويتك. نتحقق منه عبر رسالة واحدة تُرسلها أنت — فلا حسابات ولا كلمات مرور تنساها.
          </p>
          <ol className="mt-9 space-y-5">
            {STEPS.map((step, index) => {
              const done = index < activeStep;
              const current = index === activeStep && phase !== 'success';
              return (
                <li key={step.title} className="flex items-start gap-4">
                  <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-all duration-500 ${done ? 'bg-[#158C46] text-white' : current ? 'bg-[#1b2735] text-white shadow-[0_0_0_6px_rgba(27,39,53,.08)]' : 'bg-[#e3e8ee] text-[#8a96a1]'}`}>
                    {done ? <Check size={16} strokeWidth={3} /> : index + 1}
                  </span>
                  <div className={`transition-opacity duration-500 ${done || current ? 'opacity-100' : 'opacity-55'}`}>
                    <p className="text-sm font-bold">{step.title}</p>
                    <p className="mt-0.5 text-[13px] leading-6 text-[#5f6b76]">{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Action card */}
        <div className="rounded-[32px] border border-[#e3e8ee] bg-white p-7 shadow-[0_30px_70px_-40px_rgba(27,39,53,.35)] sm:p-9" data-testid="card-login">
          {(phase === 'idle' || phase === 'starting' || phase === 'error') && (
            <div className="flex h-full flex-col justify-center text-center">
              <span className="mx-auto mb-6 grid size-16 place-items-center rounded-[22px] bg-[#158C46]/10 text-[#158C46]"><MessageCircle size={30} /></span>
              <h2 className="text-xl font-bold">ابدأ بتأكيد رقمك</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-7 text-[#5f6b76]">سنعطيك كودًا تُرسله لبوت ORxai. تأكيد واحد ويفتح لك كل شيء.</p>
              {phase === 'error' && <p className="mx-auto mt-4 max-w-xs rounded-2xl bg-[#fdecea] px-4 py-3 text-sm font-semibold text-[#a3392b]" data-testid="text-login-error">{message}</p>}
              <button
                onClick={() => void begin()}
                disabled={phase === 'starting'}
                className="mt-7 inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#158C46] px-6 py-4 text-[15px] font-bold text-white shadow-[0_16px_34px_-14px_#158C46] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
                data-testid="button-login-start"
              >
                {phase === 'starting' ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                {phase === 'starting' ? 'نجهّز الكود…' : 'المتابعة عبر واتساب'}
              </button>
              <p className="mt-4 text-xs text-[#8a96a1]">بالمتابعة، أنت توافق على استخدام رقمك للتحقق فقط.</p>
            </div>
          )}

          {phase === 'waiting' && challenge && (
            <div className="flex h-full flex-col justify-center text-center">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-xs font-bold text-[#8a96a1]">كودك لمرة واحدة</p>
                  <h2 className="mt-0.5 text-lg font-bold">أرسله للبوت على واتساب</h2>
                </div>
                <CountdownRing remaining={remaining} total={totalSeconds} />
              </div>

              <div className="my-7 rounded-[24px] bg-[#f6f8fb] px-3 py-6"><CodeTiles code={challenge.code} /></div>

              {waUrl ? (
                <a
                  href={waUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#158C46] px-6 py-4 text-[15px] font-bold text-white shadow-[0_16px_34px_-14px_#158C46] transition-all hover:-translate-y-0.5"
                  data-testid="link-login-whatsapp"
                >
                  <MessageCircle size={19} /> افتح واتساب وأرسل الكود
                </a>
              ) : (
                <p className="rounded-2xl bg-[#fff6e5] px-4 py-3 text-sm font-semibold leading-7 text-[#8a5a12]">
                  أرسل الكود أعلاه إلى بوت ORxai على واتساب.
                </p>
              )}

              <button onClick={() => void copyCode()} className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-[#5f6b76] transition-colors hover:bg-[#f0f3f6]" data-testid="button-copy-code">
                {copied ? <Check size={15} className="text-[#158C46]" /> : <Copy size={15} />} {copied ? 'تم النسخ' : 'نسخ الكود'}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2.5 text-[13px] font-semibold text-[#5f6b76]" role="status">
                <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#158C46]/60" /><span className="relative inline-flex size-2.5 rounded-full bg-[#158C46]" /></span>
                بانتظار تأكيدك في واتساب — ستدخل تلقائيًا
              </div>
            </div>
          )}

          {phase === 'success' && (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center" data-testid="login-success">
              <span className="grid size-20 place-items-center rounded-full bg-[#158C46] text-white animate-[acct-pop_.6s_cubic-bezier(.2,.8,.2,1)_both]">
                <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" style={{ strokeDasharray: 24, strokeDashoffset: 24, animation: 'acct-check-draw .5s .25s ease forwards' }} />
                </svg>
              </span>
              <h2 className="mt-6 text-xl font-bold">تم التأكيد</h2>
              <p className="mt-2 text-sm text-[#5f6b76]">نفتح لك لوحة التحكم…</p>
            </div>
          )}

          {phase === 'expired' && (
            <div className="flex h-full flex-col justify-center text-center">
              <span className="mx-auto mb-6 grid size-16 place-items-center rounded-[22px] bg-[#fff1e0] text-[#d9822b]"><Sparkles size={28} /></span>
              <h2 className="text-xl font-bold">انتهت صلاحية الكود</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-7 text-[#5f6b76]">للأمان، الكود يعيش 10 دقائق فقط. اطلب كودًا جديدًا وأكمل.</p>
              <button onClick={() => void begin()} className="mt-7 inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#1b2735] px-6 py-4 text-[15px] font-bold text-white transition-all hover:-translate-y-0.5" data-testid="button-login-retry">
                <RefreshCw size={18} /> كود جديد
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
