import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Activity,
  AlertCircle,
  Ban,
  Check,
  ChevronLeft,
  Database,
  Globe,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  RefreshCw,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  ApiKeyStatus,
  type AdminSummary,
  getGetAdminSummaryQueryKey,
  getGetAdminWhatsappStatusQueryKey,
  getGetAdminUserMessagesQueryKey,
  getListAdminApiKeysQueryKey,
  getListAdminSettingsQueryKey,
  getListAdminUsersQueryKey,
  getListAdminWebsitesQueryKey,
  useAdminLogin,
  useCreateAdminApiKey,
  useGetAdminSummary,
  useGetAdminUserMessages,
  useGetAdminWhatsappStatus,
  useListAdminApiKeys,
  useListAdminSettings,
  useListAdminUsers,
  useListAdminWebsites,
  useSendUserMessage,
  useUpdateAdminApiKey,
  useUpdateAdminSettings,
  useUpdateAdminWebsiteBranding,
  useUpdateUserBlocked,
  useUpdateUserQuota,
} from '@workspace/api-client-react';
import { Brand } from '@/components/brand';
import { safeSessionStorage as sessionStorage } from '@/lib/safe-storage';
import { BrandSplash, useEntrySplash } from '@/components/brand-splash';

type Section = 'overview' | 'users' | 'websites' | 'keys' | 'settings';

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#E2E8F0] ${className}`}
      style={{ backgroundColor: '#E2E8F0' }}
    />
  );
}

function Notice({
  children,
  tone = 'error',
}: {
  children: string;
  tone?: 'error' | 'success';
}) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold"
      style={
        tone === 'error'
          ? { backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#BE123C' }
          : { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' }
      }
      data-testid={`status-${tone}`}
    >
      <AlertCircle size={16} />
      {children}
    </div>
  );
}

function formatDate(date?: string | null) {
  return date
    ? new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium' }).format(new Date(date))
    : 'لم يُستخدم بعد';
}

function Login() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const login = useAdminLogin();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    login.mutate(
      { data: { password } },
      {
        onSuccess: (session) => {
          if (session.authenticated) {
            sessionStorage.setItem('manfaz-admin', 'true');
            const maybeToken = (session as { token?: string }).token;
            if (maybeToken) {
              sessionStorage.setItem('manfaz-admin-token', maybeToken);
            }
            window.location.reload();
          } else {
            setMessage('كلمة المرور غير صحيحة.');
          }
        },
        onError: () => setMessage('تعذّر تسجيل الدخول. حاول مرة أخرى.'),
      }
    );
  };
  return (
    <main
      dir="rtl"
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#060B18] px-5 py-10 font-sans text-white"
      style={{
        background: 'linear-gradient(155deg, #060B18 0%, #0B132B 55%, #111E42 100%)',
        backgroundColor: '#060B18',
        color: '#FFFFFF',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(37, 99, 235, 0.25)' }}
      />
      <div className="relative z-10 w-full max-w-md">
        <Brand dark />
        <div
          className="mt-8 rounded-3xl border border-[#1E293B] bg-[#0B132B] p-7 shadow-2xl md:p-9"
          style={{
            backgroundColor: '#0B132B',
            borderColor: '#1E293B',
            color: '#FFFFFF',
          }}
        >
          <div
            className="mb-6 grid size-14 place-items-center rounded-2xl border border-[#3B82F6] bg-[#1D4ED8] text-white"
            style={{ backgroundColor: '#1D4ED8', borderColor: '#3B82F6', color: '#FFFFFF' }}
          >
            <LockKeyhole size={23} />
          </div>
          <p
            className="font-mono text-xs font-extrabold tracking-widest uppercase text-[#38BDF8]"
            style={{ color: '#38BDF8' }}
          >
            ENTERPRISE ADMIN CONSOLE
          </p>
          <h1
            className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl"
            style={{ color: '#FFFFFF' }}
          >
            بوابة الإدارة المركزية
          </h1>
          <p
            className="mt-2 text-sm font-medium leading-7 text-[#CBD5E1]"
            style={{ color: '#CBD5E1' }}
          >
            أدخل كلمة مرور الإدارة لمتابعة تشغيل منظومة ORxai السحابية.
          </p>
          <form onSubmit={submit} className="mt-7 space-y-5">
            <label
              className="block text-xs font-extrabold text-white"
              style={{ color: '#FFFFFF' }}
              htmlFor="admin-password"
            >
              كلمة المرور الإدارية
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={1}
                autoComplete="current-password"
                className="mt-2 h-12 w-full rounded-xl border border-[#334155] bg-[#060B18] px-4 text-sm font-bold text-white outline-none transition-colors placeholder:text-[#64748B] focus:border-[#38BDF8]"
                style={{
                  backgroundColor: '#060B18',
                  borderColor: '#334155',
                  color: '#FFFFFF',
                }}
                placeholder="اكتب كلمة المرور"
                data-testid="input-admin-password"
              />
            </label>
            {message && <Notice>{message}</Notice>}
            <button
              type="submit"
              disabled={login.isPending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#1D4ED8] disabled:cursor-wait disabled:opacity-60"
              style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
              data-testid="button-admin-login"
            >
              {login.isPending ? 'جارٍ التحقق...' : 'دخول آمن للوحة الإدارة'}
              <ChevronLeft size={18} />
            </button>
          </form>
        </div>
        <p
          className="mt-6 text-center text-xs font-semibold text-[#94A3B8]"
          style={{ color: '#94A3B8' }}
        >
          مركز تشغيل ORxai · وصول مشفر خاص بالإدارة
        </p>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  accentBg,
  accentText,
  accentBorder,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: typeof Users;
  accentBg: string;
  accentText: string;
  accentBorder: string;
}) {
  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-2xs"
      style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
      data-testid={`card-stat-${label}`}
    >
      <div
        className="mb-6 grid size-11 place-items-center rounded-xl border"
        style={{ backgroundColor: accentBg, borderColor: accentBorder, color: accentText }}
      >
        <Icon size={19} />
      </div>
      <p className="text-xs font-extrabold text-[#475569]" style={{ color: '#475569' }}>
        {label}
      </p>
      <p
        className="mt-1 font-mono text-3xl font-black tabular-nums text-[#0F172A]"
        style={{ color: '#0F172A' }}
      >
        {value}
      </p>
      <p className="mt-2 text-xs font-medium text-[#64748B]" style={{ color: '#64748B' }}>
        {note}
      </p>
    </article>
  );
}

function Overview({
  summary,
  whatsappStatus,
  isLoading,
  onRefresh,
  refreshPending,
  onUsers,
}: {
  summary: AdminSummary | undefined;
  whatsappStatus?: { connected: boolean; message: string };
  isLoading: boolean;
  onRefresh: () => void;
  refreshPending: boolean;
  onUsers: () => void;
}) {
  if (isLoading || !summary)
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-3 h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-44" />
          ))}
        </div>
        <Skeleton className="h-52" />
      </div>
    );
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p
            className="font-mono text-xs font-extrabold tracking-widest uppercase text-[#1D4ED8]"
            style={{ color: '#1D4ED8' }}
          >
            SYSTEM OPERATIONS
          </p>
          <h1
            className="mt-1.5 text-2xl font-black text-[#0F172A] sm:text-3xl"
            style={{ color: '#0F172A' }}
          >
            النظرة التشغيلية الكاملة
          </h1>
          <p className="mt-1 text-sm font-medium text-[#475569]" style={{ color: '#475569' }}>
            كل ما تحتاجه لمتابعة منظومة ORxai من مكان واحد.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-4 text-xs font-bold text-[#0F172A] transition-colors hover:bg-[#F1F5F9]"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
          disabled={refreshPending}
          data-testid="button-refresh-summary"
        >
          <RefreshCw size={15} className={refreshPending ? 'animate-spin' : ''} style={{ color: '#1D4ED8' }} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="المستخدمون"
          value={summary.totalUsers}
          note="حسابات مسجلة وموثقة"
          icon={Users}
          accentBg="#EFF6FF"
          accentText="#1D4ED8"
          accentBorder="#BFDBFE"
        />
        <StatCard
          label="المواقع المنشورة"
          value={summary.totalWebsites}
          note="حضور رقمي مبني"
          icon={LayoutDashboard}
          accentBg="#ECFDF5"
          accentText="#047857"
          accentBorder="#A7F3D0"
        />
        <StatCard
          label="الرسائل المستخدمة"
          value={summary.messagesUsed}
          note="منذ بداية المنصة"
          icon={MessageCircle}
          accentBg="#EEF2FF"
          accentText="#4338CA"
          accentBorder="#C7D2FE"
        />
        <StatCard
          label="مفاتيح Gemini"
          value={summary.activeApiKeys}
          note="مفتاح نشط الآن"
          icon={KeyRound}
          accentBg="#F5F3FF"
          accentText="#6D28D9"
          accentBorder="#DDD6FE"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section
          className="rounded-2xl border border-[#CBD5E1] bg-white p-6"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-[#1D4ED8]" style={{ color: '#1D4ED8' }}>
                صحة القنوات والأنظمة
              </p>
              <h2 className="mt-1 text-lg font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
                حالة الربط والتشغيل
              </h2>
            </div>
            <Activity style={{ color: '#1D4ED8' }} size={22} />
          </div>
          <div className="mt-6 space-y-4">
            <HealthRow
              icon={MessageCircle}
              label="رقم واتساب"
              value={
                whatsappStatus?.connected
                  ? whatsappStatus.message
                  : whatsappStatus?.message ||
                    (summary.whatsappConfigured ? 'مهيأ، يحتاج فحص' : 'يحتاج إعداداً')
              }
              okay={whatsappStatus?.connected ?? summary.whatsappConfigured}
            />
            <HealthRow icon={Database} label="خدمة البيانات" value="متصلة" okay />
            <HealthRow icon={ShieldCheck} label="استوديو المواقع" value="جاهز" okay />
          </div>
        </section>

        <section
          className="rounded-2xl border border-[#1E293B] bg-[#0B132B] p-6 text-white"
          style={{
            background: 'linear-gradient(155deg, #060B18 0%, #0B132B 100%)',
            backgroundColor: '#0B132B',
            borderColor: '#1E293B',
            color: '#FFFFFF',
          }}
        >
          <p className="text-xs font-extrabold text-[#38BDF8]" style={{ color: '#38BDF8' }}>
            توصية التشغيل
          </p>
          <h2
            className="mt-2 text-xl font-black leading-8 text-white"
            style={{ color: '#FFFFFF' }}
          >
            استمرارية الخدمة تبدأ من جاهزية البوت والمفاتيح.
          </h2>
          <p
            className="mt-3 text-sm font-medium leading-7 text-[#CBD5E1]"
            style={{ color: '#CBD5E1' }}
          >
            راجع مفاتيح الذكاء الاصطناعي والحدود المجانية دورياً حتى تبقى تجربة أصحاب الأعمال في استوديو ORxai سلسة وسريعة.
          </p>
          <button
            onClick={onUsers}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#1D4ED8]"
            style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
            data-testid="button-overview-users"
          >
            <span>إدارة المستخدمين</span>
            <ChevronLeft size={16} />
          </button>
        </section>
      </div>
    </div>
  );
}

function HealthRow({
  icon: Icon,
  label,
  value,
  okay,
}: {
  icon: typeof MessageCircle;
  label: string;
  value: string;
  okay: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
      style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
    >
      <span
        className="grid size-9 place-items-center rounded-lg border"
        style={
          okay
            ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' }
            : { backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#BE123C' }
        }
      >
        <Icon size={16} />
      </span>
      <span className="text-sm font-bold text-[#0F172A]" style={{ color: '#0F172A' }}>
        {label}
      </span>
      <span
        className="mr-auto text-xs font-bold"
        style={{ color: okay ? '#047857' : '#BE123C' }}
      >
        {value}
      </span>
      {okay ? (
        <Check size={15} style={{ color: '#059669' }} />
      ) : (
        <X size={15} style={{ color: '#BE123C' }} />
      )}
    </div>
  );
}

function UserMessagesDrawer({
  userId,
  phoneNumber,
  onClose,
}: {
  userId: string;
  phoneNumber: string;
  onClose: () => void;
}) {
  const [cursors, setCursors] = useState<Array<number | undefined>>([undefined]);
  const page = cursors[cursors.length - 1];
  const query = useGetAdminUserMessages(
    userId,
    { before: page },
    { query: { queryKey: getGetAdminUserMessagesQueryKey(userId, { before: page }) } }
  );
  const queryClient = useQueryClient();
  const [allMessages, setAllMessages] = useState<NonNullable<typeof query.data>['messages']>([]);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const send = useSendUserMessage();

  useEffect(() => {
    setCursors([undefined]);
    setAllMessages([]);
    setDraft('');
    setSendError('');
  }, [userId]);
  useEffect(() => {
    if (!query.data) return;
    setAllMessages((current) =>
      cursors.length === 1 ? query.data.messages : [...current, ...query.data.messages]
    );
  }, [query.data, cursors.length]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
  }, [query.data, queryClient]);

  const hasMore = query.data?.hasMore ?? false;
  const loadOlder = () => {
    const oldest = allMessages[allMessages.length - 1];
    if (oldest) setCursors((current) => [...current, oldest.id]);
  };

  const submitMessage = (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    setSendError('');
    send.mutate(
      { id: userId, data: { message } },
      {
        onSuccess: () => {
          setDraft('');
          setCursors([undefined]);
          setAllMessages([]);
          queryClient.invalidateQueries({
            queryKey: getGetAdminUserMessagesQueryKey(userId, { before: undefined }),
          });
        },
        onError: (error) => {
          // The Worker now explains the real reason (expired token, wrong phone
          // number id, 24h window, test-number allow-list...).
          const reason = (error as { data?: { error?: unknown } } | null)?.data?.error;
          setSendError(
            typeof reason === 'string' && reason
              ? reason
              : 'تعذّر إرسال الرسالة. تأكد من إعداد واتساب وحاول مرة أخرى.'
          );
        },
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      style={{ backgroundColor: 'rgba(6, 11, 24, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl border border-[#CBD5E1] bg-white sm:rounded-3xl"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
        onClick={(event) => event.stopPropagation()}
        data-testid="panel-user-messages"
      >
        <div
          className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4"
          style={{ borderColor: '#E2E8F0' }}
        >
          <div>
            <p className="text-xs font-bold text-[#1D4ED8]" style={{ color: '#1D4ED8' }}>
              محادثة واتساب
            </p>
            <h3 className="font-mono text-lg font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
              {phoneNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#E2E8F0]"
            style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
            data-testid="button-close-messages"
          >
            <X size={16} />
          </button>
        </div>
        <div
          className="flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] px-6 py-4"
          style={{ backgroundColor: '#F8FAFC' }}
        >
          {query.isLoading && cursors.length === 1 ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : query.isError ? (
            <Notice>تعذر تحميل الرسائل.</Notice>
          ) : allMessages.length === 0 ? (
            <p className="py-8 text-center text-sm font-medium text-[#64748B]" style={{ color: '#64748B' }}>
              لا توجد رسائل بعد.
            </p>
          ) : (
            allMessages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-medium leading-6 ${
                  message.direction === 'inbound' ? 'mr-auto border' : 'ml-auto'
                }`}
                style={
                  message.direction === 'inbound'
                    ? { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }
                    : { backgroundColor: '#0B132B', color: '#FFFFFF' }
                }
                data-testid={`message-${message.id}`}
              >
                <p>{message.content}</p>
                <p
                  className="mt-1 text-[10px]"
                  style={{ color: message.direction === 'inbound' ? '#64748B' : '#93C5FD' }}
                >
                  {new Intl.DateTimeFormat('ar-SA', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(message.createdAt))}
                </p>
              </div>
            ))
          )}
          {hasMore && (
            <button
              onClick={loadOlder}
              disabled={query.isFetching}
              className="mx-auto block rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-50"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
              data-testid="button-load-older-messages"
            >
              {query.isFetching ? 'جارٍ التحميل...' : 'عرض السابق'}
            </button>
          )}
        </div>
        <form
          onSubmit={submitMessage}
          className="border-t border-[#E2E8F0] bg-white p-4"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
        >
          {sendError && (
            <div className="mb-3">
              <Notice>{sendError}</Notice>
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitMessage(event);
                }
              }}
              placeholder="اكتب رسالة للمستخدم..."
              rows={1}
              maxLength={4096}
              className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
              data-testid="input-send-message"
            />
            <button
              type="submit"
              disabled={send.isPending || !draft.trim()}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#1D4ED8] text-white transition-colors hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
              data-testid="button-send-message"
            >
              <Send size={17} />
            </button>
          </div>
          <p className="mt-2 text-[11px] font-medium text-[#64748B]" style={{ color: '#64748B' }}>
            هذه رسالة يدوية من فريق الإدارة، منفصلة عن ردود ORxai التلقائية.
          </p>
        </form>
      </div>
    </div>
  );
}

function UsersPanel() {
  const query = useListAdminUsers();
  const queryClient = useQueryClient();
  const quota = useUpdateUserQuota();
  const blockToggle = useUpdateUserBlocked();
  const [delta, setDelta] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [messagesUserId, setMessagesUserId] = useState<string | null>(null);
  const users = query.data || [];
  const update = (id: string) => {
    const value = Number(delta[id]);
    if (!Number.isFinite(value) || value === 0) return;
    quota.mutate(
      { id, data: { delta: value } },
      {
        onSuccess: () => {
          setNotice('تم تحديث الحد بنجاح.');
          setDelta((current) => ({ ...current, [id]: '' }));
          queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
        },
        onError: () => setNotice('تعذر تحديث الحد.'),
      }
    );
  };
  const toggleBlock = (id: string, blocked: boolean) => {
    blockToggle.mutate(
      { id, data: { blocked } },
      {
        onSuccess: () => {
          setNotice(blocked ? 'تم حظر المستخدم.' : 'تم إلغاء حظر المستخدم.');
          queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
        },
        onError: () => setNotice('تعذر تحديث حالة الحظر.'),
      }
    );
  };
  const messagesUser = users.find((user) => user.id === messagesUserId);
  return (
    <section id="users" className="space-y-5">
      <div>
        <p className="text-xs font-extrabold text-[#1D4ED8]" style={{ color: '#1D4ED8' }}>
          إدارة الحسابات
        </p>
        <h2 className="mt-1 text-2xl font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
          المستخدمون والحدود
        </h2>
      </div>
      {notice && <Notice tone={notice.startsWith('تم') ? 'success' : 'error'}>{notice}</Notice>}
      {query.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : query.isError ? (
        <Notice>تعذر تحميل المستخدمين.</Notice>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="لا يوجد مستخدمون بعد"
          body="سيظهر أصحاب المشاريع هنا عند بدء استخدام استوديو ORxai."
        />
      ) : (
        <div
          className="overflow-x-auto rounded-2xl border border-[#CBD5E1] bg-white"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
        >
          <table className="w-full min-w-[820px] text-right text-sm">
            <thead
              className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold text-[#475569]"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569' }}
            >
              <tr>
                <th className="px-5 py-4 font-bold">المستخدم</th>
                <th className="px-5 py-4 font-bold">المواقع</th>
                <th className="px-5 py-4 font-bold">الرسائل</th>
                <th className="px-5 py-4 font-bold">تعديل الحد</th>
                <th className="px-5 py-4 font-bold">المحادثة</th>
                <th className="px-5 py-4 font-bold">الحالة</th>
                <th className="px-5 py-4 font-bold">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[#E2E8F0] last:border-0"
                  style={{ borderColor: '#E2E8F0' }}
                  data-testid={`row-user-${user.id}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid size-9 place-items-center rounded-xl bg-[#0B132B] font-mono text-xs font-black text-white"
                        style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
                      >
                        {user.phoneNumber.slice(-2)}
                      </span>
                      <div>
                        <div
                          className="font-mono font-black text-[#0F172A]"
                          style={{ color: '#0F172A' }}
                          data-testid={`text-user-phone-${user.id}`}
                        >
                          {user.phoneNumber}
                        </div>
                        <div className="mt-0.5 text-[11px] font-medium text-[#64748B]" style={{ color: '#64748B' }}>
                          معرّف {user.id.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
                    {user.websiteCount}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
                      {user.freeMessagesUsed}
                    </span>
                    <span className="font-mono text-[#64748B]" style={{ color: '#64748B' }}>
                      {' '}
                      / {user.freeMessagesLimit}
                    </span>
                    <div
                      className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-[#E2E8F0]"
                      style={{ backgroundColor: '#E2E8F0' }}
                    >
                      <div
                        className="h-full rounded-full bg-[#1D4ED8]"
                        style={{
                          width: `${Math.min(
                            100,
                            (user.freeMessagesUsed / Math.max(1, user.freeMessagesLimit)) * 100
                          )}%`,
                          backgroundColor: '#1D4ED8',
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={delta[user.id] || ''}
                        onChange={(event) =>
                          setDelta((current) => ({ ...current, [user.id]: event.target.value }))
                        }
                        placeholder="+10"
                        className="w-20 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2 py-2 text-center font-mono text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                        style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                        data-testid={`input-quota-${user.id}`}
                      />
                      <button
                        onClick={() => update(user.id)}
                        disabled={quota.isPending}
                        className="rounded-lg bg-[#1D4ED8] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                        style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
                        data-testid={`button-update-quota-${user.id}`}
                      >
                        حفظ
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setMessagesUserId(user.id)}
                      className="relative flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-bold text-[#0F172A] hover:border-[#2563EB]"
                      style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                      data-testid={`button-messages-${user.id}`}
                    >
                      <MessageCircle size={14} style={{ color: '#1D4ED8' }} />
                      <span>عرض</span>
                      {user.unreadMessages > 0 && (
                        <span
                          className="absolute -left-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#1D4ED8] text-[9px] font-bold text-white"
                          style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
                        >
                          {user.unreadMessages > 9 ? '9+' : user.unreadMessages}
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    {user.blocked ? (
                      <button
                        onClick={() => toggleBlock(user.id, false)}
                        disabled={blockToggle.isPending}
                        className="rounded-lg border border-[#FECDD3] bg-[#FFF1F2] px-3 py-2 text-xs font-bold text-[#BE123C] disabled:opacity-50"
                        style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#BE123C' }}
                        data-testid={`button-unblock-${user.id}`}
                      >
                        محظور — إلغاء
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleBlock(user.id, true)}
                        disabled={blockToggle.isPending}
                        className="flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-bold text-[#475569] hover:border-[#BE123C] hover:text-[#BE123C] disabled:opacity-50"
                        style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#475569' }}
                        data-testid={`button-block-${user.id}`}
                      >
                        <Ban size={13} />
                        <span>حظر</span>
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-[#475569]" style={{ color: '#475569' }}>
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {messagesUser && (
        <UserMessagesDrawer
          userId={messagesUser.id}
          phoneNumber={messagesUser.phoneNumber}
          onClose={() => setMessagesUserId(null)}
        />
      )}
    </section>
  );
}

function WebsitesPanel() {
  const query = useListAdminWebsites();
  const queryClient = useQueryClient();
  const toggleBranding = useUpdateAdminWebsiteBranding();
  const [notice, setNotice] = useState('');
  const websites = query.data || [];
  const toggle = (id: string, next: boolean) =>
    toggleBranding.mutate(
      { id, data: { showBranding: next } },
      {
        onSuccess: () => {
          setNotice(next ? 'تم إظهار شارة ORxai.' : 'تم إخفاء شارة ORxai.');
          queryClient.invalidateQueries({ queryKey: getListAdminWebsitesQueryKey() });
        },
        onError: () => setNotice('تعذر تحديث الشارة.'),
      }
    );
  return (
    <section id="websites" className="space-y-5">
      <div>
        <p className="text-xs font-extrabold text-[#1D4ED8]" style={{ color: '#1D4ED8' }}>
          حضور رقمي
        </p>
        <h2 className="mt-1 text-2xl font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
          المواقع وشارة ORxai
        </h2>
        <p className="mt-1 text-sm font-medium text-[#475569]" style={{ color: '#475569' }}>
          تحكم بظهور شارة "تم الإنشاء بواسطة ORxai" على أي موقع لصاحب مشروع.
        </p>
      </div>
      {notice && <Notice tone={notice.startsWith('تم') ? 'success' : 'error'}>{notice}</Notice>}
      {query.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : query.isError ? (
        <Notice>تعذر تحميل المواقع.</Notice>
      ) : websites.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="لا توجد مواقع بعد"
          body="ستظهر مواقع أصحاب المشاريع هنا فور إنشائها."
        />
      ) : (
        <div
          className="overflow-x-auto rounded-2xl border border-[#CBD5E1] bg-white"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
        >
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead
              className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold text-[#475569]"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569' }}
            >
              <tr>
                <th className="px-5 py-4 font-bold">الموقع</th>
                <th className="px-5 py-4 font-bold">المالك</th>
                <th className="px-5 py-4 font-bold">شارة ORxai</th>
                <th className="px-5 py-4 font-bold">آخر تحديث</th>
              </tr>
            </thead>
            <tbody>
              {websites.map((site) => (
                <tr
                  key={site.id}
                  className="border-b border-[#E2E8F0] last:border-0"
                  style={{ borderColor: '#E2E8F0' }}
                  data-testid={`row-website-${site.id}`}
                >
                  <td className="px-5 py-4">
                    <div
                      className="font-black text-[#0F172A]"
                      style={{ color: '#0F172A' }}
                      data-testid={`text-website-name-${site.id}`}
                    >
                      {site.siteName}
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium text-[#64748B]" style={{ color: '#64748B' }}>
                      {site.templateId}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs font-bold text-[#334155]" style={{ color: '#334155' }}>
                    {site.ownerPhone || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-lg border px-2.5 py-1 text-[11px] font-bold"
                        style={
                          site.showBranding
                            ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' }
                            : { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#64748B' }
                        }
                      >
                        {site.showBranding ? 'ظاهرة' : 'مخفية'}
                      </span>
                      <button
                        onClick={() => toggle(site.id, !site.showBranding)}
                        disabled={toggleBranding.isPending}
                        className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-bold text-[#0F172A] transition-colors hover:border-[#2563EB] disabled:opacity-50"
                        style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                        data-testid={`button-toggle-branding-${site.id}`}
                      >
                        {site.showBranding ? 'إخفاء الشارة' : 'إظهار الشارة'}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-[#475569]" style={{ color: '#475569' }}>
                    {formatDate(site.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function KeysPanel() {
  const query = useListAdminApiKeys();
  const queryClient = useQueryClient();
  const create = useCreateAdminApiKey();
  const update = useUpdateAdminApiKey();
  const [key, setKey] = useState('');
  const [notice, setNotice] = useState('');
  const addKey = (event: FormEvent) => {
    event.preventDefault();
    if (key.length < 10) {
      setNotice('يجب أن يحتوي المفتاح على 10 أحرف على الأقل.');
      return;
    }
    create.mutate(
      { data: { key } },
      {
        onSuccess: () => {
          setKey('');
          setNotice('تمت إضافة المفتاح.');
          queryClient.invalidateQueries({ queryKey: getListAdminApiKeysQueryKey() });
        },
        onError: () => setNotice('تعذر إضافة المفتاح.'),
      }
    );
  };
  const toggle = (id: string, status: 'active' | 'disabled') =>
    update.mutate(
      { id, data: { status } },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: getListAdminApiKeysQueryKey() }),
        onError: () => setNotice('تعذر تحديث حالة المفتاح.'),
      }
    );
  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-extrabold text-[#1D4ED8]" style={{ color: '#1D4ED8' }}>
          البنية الذكية
        </p>
        <h2 className="mt-1 text-2xl font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
          مفاتيح Gemini
        </h2>
        <p className="mt-1 text-sm font-medium text-[#475569]" style={{ color: '#475569' }}>
          أضف مفاتيح احتياطية وبدّلها دون كشف قيمها.
        </p>
      </div>
      {notice && <Notice tone={notice.startsWith('تم') ? 'success' : 'error'}>{notice}</Notice>}
      <form
        onSubmit={addKey}
        className="flex flex-col gap-3 rounded-2xl border border-[#CBD5E1] bg-white p-4 sm:flex-row"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
      >
        <input
          type="password"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="الصق مفتاح Gemini هنا"
          className="min-w-0 flex-1 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
          style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
          data-testid="input-gemini-key"
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1E40AF] disabled:opacity-50"
          style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
          data-testid="button-add-gemini-key"
        >
          <Plus size={17} /> إضافة مفتاح
        </button>
      </form>
      {query.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : query.isError ? (
        <Notice>تعذر تحميل المفاتيح.</Notice>
      ) : (
        <div className="space-y-3">
          {(query.data || []).length === 0 ? (
            <EmptyState
              icon={KeyRound}
              title="لا توجد مفاتيح"
              body="أضف أول مفتاح لتفعيل خدمات الذكاء الاصطناعي."
            />
          ) : (
            (query.data || []).map((item) => {
              const active = item.status === ApiKeyStatus.active;
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#CBD5E1] bg-white p-5 sm:flex-row sm:items-center"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                  data-testid={`row-api-key-${item.id}`}
                >
                  <span
                    className="grid size-10 place-items-center rounded-xl border"
                    style={
                      active
                        ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' }
                        : { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#64748B' }
                    }
                  >
                    <KeyRound size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="font-mono text-sm font-black text-[#0F172A]"
                        style={{ color: '#0F172A' }}
                      >
                        {item.maskedKey}
                      </span>
                      <span
                        className="rounded-lg border px-2 py-0.5 text-[10px] font-bold"
                        style={
                          active
                            ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' }
                            : { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#64748B' }
                        }
                      >
                        {active ? 'نشط' : 'متوقف'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-[#64748B]" style={{ color: '#64748B' }}>
                      آخر استخدام: {formatDate(item.lastUsedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => toggle(item.id, active ? 'disabled' : 'active')}
                    disabled={update.isPending}
                    className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2 text-xs font-bold text-[#0F172A] transition-colors hover:border-[#2563EB]"
                    style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                    data-testid={`button-toggle-key-${item.id}`}
                  >
                    {active ? 'إيقاف مؤقت' : 'تفعيل المفتاح'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}

function SettingsPanel() {
  const query = useListAdminSettings();
  const update = useUpdateAdminSettings();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const settings = query.data || [];
  useEffect(() => {
    if (settings.length && !initialized) {
      setInitialized(true);
      setValues(Object.fromEntries(settings.map((item) => [item.key, item.value])));
    }
  }, [initialized, settings]);
  const save = () =>
    update.mutate(
      {
        data: {
          settings: settings.map((item) => ({
            key: item.key,
            value: values[item.key] ?? item.value,
          })),
        },
      },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: getListAdminSettingsQueryKey() }),
      }
    );
  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-extrabold text-[#1D4ED8]" style={{ color: '#1D4ED8' }}>
          تشغيل المنصة
        </p>
        <h2 className="mt-1 text-2xl font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
          الإعدادات العامة
        </h2>
        <p className="mt-1 text-sm font-medium text-[#475569]" style={{ color: '#475569' }}>
          تحكم في القنوات التي يعتمد عليها أصحاب المشاريع.
        </p>
      </div>
      {query.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : query.isError ? (
        <Notice>تعذر تحميل الإعدادات.</Notice>
      ) : (
        <div
          className="rounded-2xl border border-[#CBD5E1] bg-white p-6"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
        >
          {settings.length === 0 ? (
            <EmptyState
              icon={Settings2}
              title="لا توجد إعدادات"
              body="ستظهر إعدادات المنصة عند تهيئتها."
            />
          ) : (
            <>
              <div className="space-y-4">
                {settings.map((item) => (
                  <label
                    key={item.key}
                    className="block text-xs font-extrabold text-[#0F172A]"
                    style={{ color: '#0F172A' }}
                    data-testid={`field-setting-${item.key}`}
                  >
                    {item.key}
                    <input
                      value={values[item.key] ?? item.value}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [item.key]: event.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
                      style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
                      data-testid={`input-setting-${item.key}`}
                    />
                  </label>
                ))}
              </div>
              <button
                onClick={save}
                disabled={update.isPending}
                className="mt-6 flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1E40AF] disabled:opacity-50"
                style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
                data-testid="button-save-settings"
              >
                <Save size={16} /> {update.isPending ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Users;
  title: string;
  body: string;
}) {
  return (
    <div
      className="rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-white p-10 text-center"
      style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
    >
      <span
        className="mx-auto grid size-12 place-items-center rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
        style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
      >
        <Icon size={20} />
      </span>
      <h3 className="mt-4 font-black text-[#0F172A]" style={{ color: '#0F172A' }}>
        {title}
      </h3>
      <p className="mt-1.5 text-sm font-medium text-[#64748B]" style={{ color: '#64748B' }}>
        {body}
      </p>
    </div>
  );
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('manfaz-admin') === 'true'
  );
  const [section, setSection] = useState<Section>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const showSplash = useEntrySplash();
  const summary = useGetAdminSummary({
    query: { queryKey: getGetAdminSummaryQueryKey(), enabled: authenticated },
  });
  const whatsappStatus = useGetAdminWhatsappStatus({
    query: { queryKey: getGetAdminWhatsappStatusQueryKey(), enabled: authenticated },
  });
  const nav = [
    { id: 'overview' as Section, label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'users' as Section, label: 'المستخدمون', icon: Users },
    { id: 'websites' as Section, label: 'المواقع', icon: Globe },
    { id: 'keys' as Section, label: 'مفاتيح Gemini', icon: KeyRound },
    { id: 'settings' as Section, label: 'الإعدادات', icon: Settings2 },
  ];
  if (showSplash) return <BrandSplash show />;
  if (!authenticated) return <Login />;
  const currentLabel = nav.find((item) => item.id === section)?.label || '';
  const logout = () => {
    sessionStorage.removeItem('manfaz-admin');
    sessionStorage.removeItem('manfaz-admin-token');
    setAuthenticated(false);
  };
  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] bg-[#F8FAFC] font-sans text-[#0F172A]"
      style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}
    >
      <aside
        className={`fixed inset-y-0 right-0 z-30 w-72 border-l border-[#1E293B] bg-[#0B132B] p-6 text-white transition-transform duration-300 lg:translate-x-0 ${
          mobileNav ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #060B18 0%, #0B132B 100%)',
          backgroundColor: '#0B132B',
          borderColor: '#1E293B',
          color: '#FFFFFF',
        }}
      >
        <div className="flex items-center justify-between">
          <Brand dark />
          <button
            onClick={() => setMobileNav(false)}
            className="text-[#94A3B8] lg:hidden"
            style={{ color: '#94A3B8' }}
            data-testid="button-close-nav"
          >
            <X size={20} />
          </button>
        </div>
        <div
          className="mt-10 text-[11px] font-extrabold tracking-widest uppercase text-[#38BDF8]"
          style={{ color: '#38BDF8' }}
        >
          مساحة الإدارة المركزية
        </div>
        <nav className="mt-4 space-y-1.5">
          {nav.map(({ id, label, icon: Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setSection(id);
                  setMobileNav(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors"
                style={
                  active
                    ? { backgroundColor: '#2563EB', color: '#FFFFFF' }
                    : { backgroundColor: 'transparent', color: '#CBD5E1' }
                }
                data-testid={`button-nav-${id}`}
              >
                <Icon size={18} style={{ color: active ? '#FFFFFF' : '#93C5FD' }} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
        <div
          className="absolute bottom-6 left-6 right-6 border-t border-[#1E293B] pt-5"
          style={{ borderColor: '#1E293B' }}
        >
          <button
            onClick={logout}
            className="flex items-center gap-3 text-sm font-bold text-[#94A3B8] transition-colors hover:text-white"
            style={{ color: '#94A3B8' }}
            data-testid="button-admin-logout"
          >
            <LogOut size={17} /> تسجيل الخروج
          </button>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="fixed inset-0 z-20 lg:hidden"
          style={{ backgroundColor: 'rgba(6, 11, 24, 0.65)' }}
          onClick={() => setMobileNav(false)}
          aria-label="إغلاق القائمة"
          data-testid="button-overlay-nav"
        />
      )}
      <div className="lg:mr-72">
        <header
          className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E2E8F0] bg-white px-5 py-4 md:px-8"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNav(true)}
              className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-2 lg:hidden"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
              data-testid="button-open-nav"
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="text-xs font-extrabold text-[#1D4ED8]" style={{ color: '#1D4ED8' }}>
                مركز إدارة ORxai
              </p>
              <h1
                className="mt-0.5 text-lg font-black text-[#0F172A]"
                style={{ color: '#0F172A' }}
              >
                {currentLabel}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-2 text-xs font-bold text-[#047857] sm:flex"
              style={{ color: '#047857' }}
            >
              <span
                className="size-2 rounded-full bg-[#10B981]"
                style={{ backgroundColor: '#10B981' }}
              />{' '}
              النظام يعمل بكفاءة
            </span>
            <Link
              href="/"
              className="grid size-9 place-items-center rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] transition-colors hover:bg-[#E2E8F0]"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', color: '#0F172A' }}
              data-testid="link-view-home"
            >
              <ChevronLeft size={17} />
            </Link>
          </div>
        </header>
        <main className="admin-scroll mx-auto max-w-7xl overflow-auto px-5 py-8 md:px-8 md:py-10">
          {section === 'overview' && (
            <Overview
              summary={summary.data}
              whatsappStatus={whatsappStatus.data}
              isLoading={summary.isLoading}
              refreshPending={summary.isFetching}
              onRefresh={() => summary.refetch()}
              onUsers={() => setSection('users')}
            />
          )}
          {section === 'users' && <UsersPanel />}
          {section === 'websites' && <WebsitesPanel />}
          {section === 'keys' && <KeysPanel />}
          {section === 'settings' && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}