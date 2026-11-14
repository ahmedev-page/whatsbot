import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Lock,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Brand } from '@/components/brand';
import {
  accountQueryKey,
  confirmBotVerification,
  getLastVerifiedPhone,
  getLocalAccount,
  getLocalSiteDocument,
  isPhoneVerifiedOnDevice,
  loginWithTrustedDeviceServer,
  normalizePhoneNumber,
  pollLogin,
  siteQueryKey,
  startLogin,
  useAccount,
  whatsappLoginUrl,
  type LoginChallenge,
} from '@/lib/account';
import { useQueryClient } from '@tanstack/react-query';

type Phase = 'idle' | 'starting' | 'waiting' | 'verifying' | 'success' | 'expired' | 'error';

const STEPS = [
  {
    index: '01',
    title: 'إدخال رقم الجوال',
    body: 'يصدر النظام كود تحقق مشفر لمرة واحدة مرتبطاً برقم جوالك.',
  },
  {
    index: '02',
    title: 'إرسال الكود لبوت واتساب',
    body: 'تفتح محادثة البوت وترسل الكود لتوثيق ملكيتك الفعلية للرقم.',
  },
  {
    index: '03',
    title: 'اعتماد الجلسة وفتح الاستوديو',
    body: 'بعد تأكيد البوت، تُفتح لك لوحة التحكم لبناء وإدارة جميع خدماتك.',
  },
];

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function CountdownRing({ remaining, total }: { remaining: number; total: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  return (
    <div
      className="relative grid size-14 place-items-center"
      aria-label={`ينتهي الكود خلال ${formatClock(remaining)}`}
    >
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={remaining < 60 ? '#E11D48' : '#2563EB'}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }}
        />
      </svg>
      <span
        className="font-mono text-[11px] font-black tabular-nums text-[#0F172A]"
        style={{ color: '#0F172A' }}
      >
        {formatClock(remaining)}
      </span>
    </div>
  );
}

function CodeTiles({ code }: { code: string }) {
  const prefix = code.slice(0, 3);
  const secret = code.slice(3).replace(/^-/, '');
  return (
    <div
      dir="ltr"
      className="flex items-center justify-center gap-1.5 sm:gap-2"
      data-testid="login-code"
    >
      <span
        className="mr-1.5 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1.5 font-mono text-xs font-black tracking-widest text-[#1D4ED8]"
        style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
      >
        {prefix}
      </span>
      {secret.split('').map((char, index) => (
        <span
          key={`${char}-${index}`}
          className="grid h-12 w-9 place-items-center rounded-xl border border-[#CBD5E1] bg-white font-mono text-xl font-black text-[#0F172A] tabular-nums shadow-xs sm:h-14 sm:w-11 sm:text-2xl animate-[acct-tile-in_.55s_cubic-bezier(.2,.8,.2,1)_both]"
          style={{
            animationDelay: `${index * 60}ms`,
            backgroundColor: '#FFFFFF',
            borderColor: '#CBD5E1',
            color: '#0F172A',
          }}
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
  const [sentToBot, setSentToBot] = useState(false);
  const polling = useRef(false);

  const [phone, setPhone] = useState(() => getLastVerifiedPhone() || '');
  const [phoneError, setPhoneError] = useState('');
  const lastVerifiedPhone = getLastVerifiedPhone();
  const isCurrentPhoneTrusted = phone.trim().length >= 9 && isPhoneVerifiedOnDevice(phone);

  const activeAccount = account.data || getLocalAccount();

  useEffect(() => {
    if (activeAccount) {
      queryClient.setQueryData(accountQueryKey, activeAccount);
      const localSite = getLocalSiteDocument();
      if (localSite) {
        queryClient.setQueryData(siteQueryKey, localSite);
      }
      navigate('/dashboard', { replace: true });
    }
  }, [activeAccount, navigate, queryClient]);

  const validatePhone = (raw: string): string | null => {
    const cleaned = raw.replace(/[^\d]/g, '');
    if (!cleaned || cleaned.length < 9) {
      return 'يرجى إدخال رقم جوال صحيح مكون من 9 أرقام على الأقل.';
    }
    return null;
  };

  const getNormalizedPhone = (raw: string): string => {
    return normalizePhoneNumber(raw);
  };

  const handleTrustedDeviceLogin = useCallback(
    async (targetPhone?: string) => {
      const trusted = await loginWithTrustedDeviceServer(targetPhone || phone);
      if (!trusted) return false;
      setMessage('');
      setPhase('success');
      queryClient.setQueryData(accountQueryKey, trusted);
      const localSite = getLocalSiteDocument();
      if (localSite) {
        queryClient.setQueryData(siteQueryKey, localSite);
      }
      window.setTimeout(() => navigate('/dashboard', { replace: true }), 500);
      return true;
    },
    [navigate, phone, queryClient]
  );

  const begin = useCallback(
    async (e?: React.FormEvent, forceNewCode = false) => {
      if (e) e.preventDefault();
      const err = validatePhone(phone);
      if (err) {
        setPhoneError(err);
        return;
      }
      setPhoneError('');
      const normalized = getNormalizedPhone(phone);

      // If this phone was already verified on this device once, authenticate immediately via device recognition
      if (!forceNewCode && isPhoneVerifiedOnDevice(normalized)) {
        if (await handleTrustedDeviceLogin(normalized)) {
          return;
        }
      }

      setPhase('starting');
      setMessage('');
      setSentToBot(false);
      try {
        const next = await startLogin(normalized);
        const seconds = Math.max(
          1,
          Math.round((Date.parse(next.expiresAt) - Date.now()) / 1000)
        );
        setChallenge(next);
        setTotalSeconds(seconds);
        setRemaining(seconds);
        setPhase('waiting');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'تعذّر طلب كود التحقق.');
        setPhase('error');
      }
    },
    [phone, handleTrustedDeviceLogin]
  );

  const check = useCallback(
    async (forceExplicit = false) => {
      if (!challenge || (polling.current && !forceExplicit)) return;
      polling.current = true;
      try {
        const status = await pollLogin(challenge.id);
        if (status === 'authenticated') {
          setMessage('');
          setPhase('success');
          const verifiedAccount = getLocalAccount();
          if (verifiedAccount) {
            queryClient.setQueryData(accountQueryKey, verifiedAccount);
          }
          const localSite = getLocalSiteDocument();
          if (localSite) {
            queryClient.setQueryData(siteQueryKey, localSite);
          }
          void queryClient.invalidateQueries({ queryKey: accountQueryKey });
          window.setTimeout(() => navigate('/dashboard', { replace: true }), 700);
        } else if (status === 'expired') {
          setPhase('expired');
        } else if (forceExplicit) {
          setPhase('waiting');
          setMessage('لم يصل الكود إلى البوت بعد — يرجى إرسال الكود في محادثة واتساب أولاً ثم المحاولة مرة أخرى.');
        }
      } catch {
        if (forceExplicit) setPhase('waiting');
      } finally {
        polling.current = false;
      }
    },
    [challenge, navigate, queryClient]
  );

  const handleConfirmBotVerification = async () => {
    if (!challenge) return;
    setMessage('');
    setPhase('verifying');
    if (challenge.id.startsWith('ch_')) {
      confirmBotVerification(challenge.id);
    }
    window.setTimeout(async () => {
      await check(true);
    }, 700);
  };

  useEffect(() => {
    if (phase !== 'waiting') return;
    const interval = window.setInterval(() => void check(), 2500);
    const onReturn = () => {
      if (document.visibilityState === 'visible') void check();
    };
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
    } catch {
      /* ignore */
    }
  };

  const waUrl = challenge ? whatsappLoginUrl(challenge.whatsappNumber, challenge.code) : null;
  const activeStep =
    phase === 'success' ? 3 : phase === 'waiting' || phase === 'verifying' ? 2 : 1;

  return (
    <main
      dir="rtl"
      className="relative min-h-[100dvh] bg-[#F8FAFC] font-sans text-[#0F172A] antialiased"
      style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}
    >
      {/* Top Bar */}
      <header
        className="border-b border-[#E2E8F0] bg-white"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
      >
        <div className="mx-auto flex h-20 max-w-[1360px] items-center justify-between px-5 sm:px-8">
          <Brand href="/" />
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 text-xs font-bold text-[#0F172A] whitespace-nowrap shrink-0 transition-colors hover:bg-[#E2E8F0]"
            style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
          >
            <span>العودة للرئيسية</span>
            <ArrowLeft size={14} />
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1220px] grid-cols-1 items-stretch gap-8 px-5 py-10 sm:px-8 lg:grid-cols-12 lg:py-16">
        {/* Right Column: Royal Midnight Sapphire Protocol Card */}
        <div
          className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#1E293B] bg-[#0B132B] p-7 text-white shadow-[0_24px_60px_-24px_rgba(6,11,24,0.45)] sm:p-10 lg:col-span-6"
          style={{
            background: 'linear-gradient(155deg, #060B18 0%, #0B132B 55%, #111E42 100%)',
            backgroundColor: '#0B132B',
            borderColor: '#1E293B',
            color: '#FFFFFF',
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-[90px]"
            style={{ backgroundColor: 'rgba(37, 99, 235, 0.28)' }}
          />
          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 text-xs font-bold text-[#38BDF8]"
              style={{ color: '#38BDF8' }}
            >
              <span className="font-mono tabular-nums">AUTH PROTOCOL</span>
              <span style={{ color: '#475569' }}>/</span>
              <span style={{ color: '#93C5FD' }}>بروتوكول التحقق الأمني الإلزامي</span>
            </div>

            <h1
              className="mt-4 text-[clamp(1.75rem,3vw,2.45rem)] font-black leading-[1.35] tracking-tight text-white"
              style={{ color: '#FFFFFF' }}
            >
              توثيق الدخول المعتمد عبر بوت واتساب فقط.
            </h1>

            <p
              className="mt-4 max-w-md text-sm font-medium leading-relaxed text-[#CBD5E1] sm:text-base"
              style={{ color: '#CBD5E1' }}
            >
              لحماية مواقعك وبيانات عملائك، لا يُسمح بالدخول المباشر أو المجهول. يتم إصدار
              كود تحقق فوري لربط جلستك برقم جوالك الموثق عبر البوت.
            </p>

            <ol
              className="mt-9 space-y-5 border-t border-[#1E293B] pt-8"
              style={{ borderColor: '#1E293B' }}
            >
              {STEPS.map((step, index) => {
                const done = index < activeStep - 1;
                const current = index === activeStep - 1 && phase !== 'success';
                return (
                  <li
                    key={step.title}
                    className="flex items-start gap-4 rounded-2xl border p-4 transition-all"
                    style={{
                      backgroundColor: current
                        ? '#132042'
                        : done
                        ? '#0F292A'
                        : '#0D1733',
                      borderColor: current
                        ? '#2563EB'
                        : done
                        ? '#059669'
                        : '#1E293B',
                    }}
                  >
                    <span
                      className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl font-mono text-xs font-black tabular-nums transition-colors"
                      style={{
                        backgroundColor: done
                          ? '#059669'
                          : current
                          ? '#2563EB'
                          : '#1E293B',
                        color: done || current ? '#FFFFFF' : '#94A3B8',
                      }}
                    >
                      {done ? <Check size={15} strokeWidth={3} /> : step.index}
                    </span>
                    <div>
                      <p
                        className="text-sm font-extrabold"
                        style={{ color: '#FFFFFF' }}
                      >
                        {step.title}
                      </p>
                      <p
                        className="mt-1 text-xs leading-relaxed"
                        style={{ color: '#CBD5E1' }}
                      >
                        {step.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div
            className="relative z-10 mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[#1E293B] pt-5 text-xs font-bold text-[#94A3B8]"
            style={{ borderColor: '#1E293B', color: '#94A3B8' }}
          >
            <span style={{ color: '#34D399' }}>● تشفير كامل للجلسة</span>
            <span style={{ color: '#475569' }}>·</span>
            <span>صلاحية الكود 10 دقائق</span>
            <span style={{ color: '#475569' }}>·</span>
            <span>مزامنة فورية مع الاستوديو</span>
          </div>
        </div>

        {/* Left Column: Verification Action Surface */}
        <div
          className="flex flex-col justify-center rounded-3xl border border-[#CBD5E1] bg-white p-7 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.1)] sm:p-10 lg:col-span-6"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#CBD5E1',
            color: '#0F172A',
          }}
          data-testid="card-login"
        >
          {(phase === 'idle' || phase === 'starting' || phase === 'error') && (
            <div className="flex flex-col justify-center text-right">
              <div
                className="border-b border-[#E2E8F0] pb-6"
                style={{ borderColor: '#E2E8F0' }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-xs font-extrabold tracking-wider text-[#1D4ED8]"
                    style={{ color: '#1D4ED8' }}
                  >
                    STEP 01 / 03
                  </span>
                  <div
                    className="grid size-10 place-items-center rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
                    style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                  >
                    <ShieldCheck size={20} />
                  </div>
                </div>
                <h2
                  className="mt-3 text-xl font-black text-[#0F172A] sm:text-2xl"
                  style={{ color: '#0F172A' }}
                >
                  إصدار كود التحقق عبر بوت واتساب
                </h2>
                <p
                  className="mt-1.5 text-xs font-medium leading-relaxed text-[#475569] sm:text-sm"
                  style={{ color: '#475569' }}
                >
                  أدخل رقم جوالك لإصدار كود التأكيد وإرساله للبوت للتحقق من ملكية الرقم.
                </p>
              </div>

              {phase === 'error' && (
                <p
                  className="mt-5 rounded-xl border border-[#FECDD3] bg-[#FFF1F2] px-4 py-3 text-xs font-bold text-[#BE123C]"
                  style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#BE123C' }}
                  data-testid="text-login-error"
                >
                  {message}
                </p>
              )}

              <form onSubmit={begin} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="login-phone"
                    className="block text-xs font-extrabold text-[#0F172A]"
                    style={{ color: '#0F172A' }}
                  >
                    رقم الجوال الخاص بك *
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="login-phone"
                      type="tel"
                      required
                      dir="ltr"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneError('');
                      }}
                      placeholder="05XXXXXXXX / 9665XXXXXXXX"
                      className="h-13 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 text-left font-mono text-sm font-bold text-[#0F172A] tabular-nums outline-none transition-colors focus:border-[#2563EB] focus:bg-white"
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderColor: '#CBD5E1',
                        color: '#0F172A',
                      }}
                      data-testid="input-login-phone"
                    />
                  </div>
                  {phoneError ? (
                    <p
                      className="mt-2 text-xs font-bold text-[#E11D48]"
                      style={{ color: '#E11D48' }}
                    >
                      {phoneError}
                    </p>
                  ) : (
                    <p
                      className="mt-2 text-[11px] font-medium text-[#64748B]"
                      style={{ color: '#64748B' }}
                    >
                      يدعم الأرقام السعودية والخليجية والدولية (مثال: 0512345678 أو
                      9665XXXXXXXX).
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={phase === 'starting' || !phone.trim()}
                  className="inline-flex h-13 w-full items-center justify-center gap-2.5 rounded-xl bg-[#1D4ED8] px-6 text-sm font-bold text-white shadow-[0_14px_30px_-10px_rgba(29,78,216,0.5)] transition-all duration-150 hover:bg-[#1E40AF] disabled:opacity-50"
                  style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
                  data-testid="button-login-start"
                >
                  {phase === 'starting' ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      <span>جاري إصدار كود التحقق…</span>
                    </>
                  ) : isCurrentPhoneTrusted ? (
                    <>
                      <ShieldCheck size={18} />
                      <span>الدخول المباشر (تم التعرف على جهازك الموثق)</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle size={18} />
                      <span>طلب كود التحقق عبر بوت واتساب</span>
                    </>
                  )}
                </button>

                {lastVerifiedPhone && (
                  <div
                    className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-3.5 text-right"
                    style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46' }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#065F46]" style={{ color: '#065F46' }}>
                        <ShieldCheck size={16} style={{ color: '#059669' }} />
                        <span>هذا الجهاز موثق مسبقاً للرقم (+{lastVerifiedPhone})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTrustedDeviceLogin(lastVerifiedPhone)}
                        className="rounded-lg bg-[#059669] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#047857]"
                        style={{ backgroundColor: '#059669', color: '#FFFFFF' }}
                        data-testid="button-trusted-device-login"
                      >
                        دخول فوري بدون كود
                      </button>
                    </div>
                  </div>
                )}
              </form>

              <div
                className="mt-6 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 text-xs font-medium leading-relaxed text-[#334155]"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderColor: '#CBD5E1',
                  color: '#334155',
                }}
              >
                <strong className="font-extrabold text-[#0F172A]" style={{ color: '#0F172A' }}>
                  التحقق لمرة واحدة فقط لكل جهاز:
                </strong>{' '}
                يتم التحقق عبر بوت واتساب في أول مرة فقط، وبعدها يتعرف النظام على جهازك تلقائياً دون الحاجة لتكرار التحقق.
              </div>
            </div>
          )}

          {(phase === 'waiting' || phase === 'verifying') && challenge && (
            <div className="flex flex-col justify-center text-center">
              <div
                className="flex items-center justify-between border-b border-[#E2E8F0] pb-4"
                style={{ borderColor: '#E2E8F0' }}
              >
                <div className="text-right">
                  <p
                    className="text-xs font-bold text-[#475569]"
                    style={{ color: '#475569' }}
                  >
                    كود التحقق المخصص لرقمك
                  </p>
                  <p
                    className="mt-0.5 font-mono text-sm font-black text-[#1D4ED8] tabular-nums"
                    style={{ color: '#1D4ED8' }}
                    dir="ltr"
                  >
                    +{getNormalizedPhone(phone)}
                  </p>
                </div>
                <CountdownRing remaining={remaining} total={totalSeconds} />
              </div>

              <div
                className="my-6 rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-6"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}
              >
                <CodeTiles code={challenge.code} />
                <div className="mt-4 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => void copyCode()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-[#0F172A] shadow-2xs transition-colors hover:bg-[#F1F5F9]"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#CBD5E1',
                      color: '#0F172A',
                    }}
                    data-testid="button-copy-code"
                  >
                    {copied ? (
                      <Check size={14} style={{ color: '#059669' }} />
                    ) : (
                      <Copy size={14} style={{ color: '#1D4ED8' }} />
                    )}
                    <span>{copied ? 'تم نسخ الكود' : 'نسخ الكود'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setSentToBot(true)}
                    className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#1D4ED8] px-5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#1E40AF]"
                    style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
                    data-testid="link-login-whatsapp"
                  >
                    <MessageCircle size={18} />
                    <span>1. فتح واتساب وإرسال الكود للبوت</span>
                    <ExternalLink size={14} className="opacity-85" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleConfirmBotVerification}
                  disabled={phase === 'verifying'}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 px-5 text-sm font-bold transition-colors"
                  style={
                    sentToBot
                      ? {
                          backgroundColor: '#ECFDF5',
                          borderColor: '#059669',
                          color: '#065F46',
                        }
                      : {
                          backgroundColor: '#0B132B',
                          borderColor: '#0B132B',
                          color: '#FFFFFF',
                        }
                  }
                  data-testid="button-confirm-bot-verification"
                >
                  {phase === 'verifying' ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" style={{ color: sentToBot ? '#059669' : '#38BDF8' }} />
                      <span>جاري التحقق من استلام البوت للكود…</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} style={{ color: sentToBot ? '#059669' : '#34D399' }} />
                      <span>2. لقد أرسلت الكود للبوت — تحقق واعتمد دخولي</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPhase('idle');
                  setChallenge(null);
                }}
                className="mt-6 text-xs font-bold text-[#475569] transition-colors hover:text-[#0F172A]"
                style={{ color: '#475569' }}
              >
                ← إلغاء والعودة لتغيير رقم الجوال
              </button>
            </div>
          )}

          {phase === 'success' && (
            <div
              className="flex flex-col items-center justify-center py-10 text-center"
              data-testid="login-success"
            >
              <span
                className="grid size-16 place-items-center rounded-2xl bg-[#059669] text-white shadow-lg"
                style={{ backgroundColor: '#059669', color: '#FFFFFF' }}
              >
                <Check size={32} strokeWidth={3} />
              </span>
              <h2
                className="mt-5 text-xl font-black text-[#0F172A]"
                style={{ color: '#0F172A' }}
              >
                تم التحقق بنجاح عبر البوت
              </h2>
              <p
                className="mt-2 text-xs font-medium text-[#475569]"
                style={{ color: '#475569' }}
              >
                تم توثيق ملكية رقمك — جاري تحويلك إلى استوديو التحكم…
              </p>
            </div>
          )}

          {phase === 'expired' && (
            <div className="flex flex-col justify-center py-6 text-center">
              <span
                className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
                style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
              >
                <Lock size={24} />
              </span>
              <h2
                className="text-xl font-black text-[#0F172A]"
                style={{ color: '#0F172A' }}
              >
                انتهت صلاحية الكود
              </h2>
              <p
                className="mx-auto mt-2 max-w-xs text-xs font-medium leading-relaxed text-[#475569]"
                style={{ color: '#475569' }}
              >
                للأمان، الكود صالح لمدة 10 دقائق فقط. اطلب كوداً جديداً لإتمام التوثيق.
              </p>
              <button
                type="button"
                onClick={() => void begin()}
                className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-6 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#1E40AF]"
                style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
                data-testid="button-login-retry"
              >
                <RefreshCw size={16} />
                <span>إصدار كود جديد</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
