import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Activity, AlertCircle, Ban, Check, ChevronLeft, Database, Globe, KeyRound, LayoutDashboard, LockKeyhole, LogOut, Menu, MessageCircle, Plus, RefreshCw, Save, Send, Settings2, ShieldCheck, Users, X } from 'lucide-react';
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
import { BrandSplash, useEntrySplash } from '@/components/brand-splash';

type Section = 'overview' | 'users' | 'websites' | 'keys' | 'settings';

function Skeleton({ className = '' }: { className?: string }) { return <div className={`animate-pulse rounded-xl bg-[#e7e0d5] ${className}`} />; }
function Notice({ children, tone = 'error' }: { children: string; tone?: 'error' | 'success' }) { return <div role="status" className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${tone === 'error' ? 'bg-[#f9e0d8] text-[#a34838]' : 'bg-[#dbe8d5] text-[#426440]'}`} data-testid={`status-${tone}`}><AlertCircle size={16} />{children}</div>; }
function formatDate(date?: string | null) { return date ? new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium' }).format(new Date(date)) : 'لم يُستخدم بعد'; }

function Login() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const login = useAdminLogin();
  const submit = (event: FormEvent) => { event.preventDefault(); setMessage(''); login.mutate({ data: { password } }, { onSuccess: (session) => { if (session.authenticated) { sessionStorage.setItem('manfaz-admin', 'true'); window.location.reload(); } else setMessage('كلمة المرور غير صحيحة.'); }, onError: () => setMessage('تعذّر تسجيل الدخول. حاول مرة أخرى.') }); };
  return <main className="grain flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#1b2735] px-5 py-10 text-[#fff8ee]"><div className="absolute -left-20 -top-20 size-72 rounded-full border-[45px] border-[#efb93b]/20" /><div className="relative w-full max-w-md"><Brand dark /><div className="mt-14 rounded-[28px] border border-[#ffffff1c] bg-[#263746] p-7 shadow-[0_28px_80px_rgba(0,0,0,.22)] md:p-9"><div className="mb-8 grid size-14 place-items-center rounded-2xl bg-[#e66f51]"><LockKeyhole size={23} /></div><p className="text-sm font-semibold text-[#efb93b]">مساحة محمية</p><h1 className="mt-3 font-serif text-3xl font-bold">مرحباً بعودتك</h1><p className="mt-3 text-sm leading-7 text-[#bdc8c7]">أدخل كلمة مرور الإدارة لمتابعة تشغيل منفذ.</p><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-semibold" htmlFor="admin-password">كلمة المرور<input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={1} autoComplete="current-password" className="mt-2 w-full rounded-xl border border-[#ffffff22] bg-[#1b2735] px-4 py-3 text-[#fff8ee] outline-none transition-colors placeholder:text-[#829097] focus:border-[#efb93b]" placeholder="اكتب كلمة المرور" data-testid="input-admin-password" /></label>{message && <Notice>{message}</Notice>}<button type="submit" disabled={login.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#efb93b] px-4 py-3.5 font-bold text-[#1b2735] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60" data-testid="button-admin-login">{login.isPending ? 'جارٍ التحقق...' : 'دخول آمن'}<ChevronLeft size={18} /></button></form></div><p className="mt-6 text-center text-xs text-[#829097]">مركز تشغيل منفذ · وصول خاص بالفريق</p></div></main>;
}

function StatCard({ label, value, note, icon: Icon, accent }: { label: string; value: string | number; note: string; icon: typeof Users; accent: string }) {
  return <article className="relative overflow-hidden rounded-2xl border border-[#e4dace] bg-[#fffdf8] p-5" data-testid={`card-stat-${label}`}><div className={`mb-8 grid size-10 place-items-center rounded-xl ${accent}`}><Icon size={18} /></div><p className="text-sm font-semibold text-[#69777d]">{label}</p><p className="mt-1 font-serif text-3xl font-bold">{value}</p><p className="mt-2 text-xs text-[#829097]">{note}</p><span className="absolute -bottom-7 -left-5 size-24 rounded-full border-[14px] border-[#f3eadf]" /></article>;
}

function Overview({ summary, whatsappStatus, isLoading, onRefresh, refreshPending, onUsers }: { summary: AdminSummary | undefined; whatsappStatus?: { connected: boolean; message: string }; isLoading: boolean; onRefresh: () => void; refreshPending: boolean; onUsers: () => void }) {
  if (isLoading || !summary) return <div className="space-y-6"><div><Skeleton className="h-8 w-44" /><Skeleton className="mt-3 h-4 w-72" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-44" />)}</div><Skeleton className="h-52" /></div>;
  return <div className="space-y-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-[#e66f51]">صباح التشغيل</p><h1 className="mt-2 font-serif text-3xl font-bold">الصورة كاملة.</h1><p className="mt-2 text-sm text-[#69777d]">كل ما تحتاجه لمتابعة منفذ من مكان واحد.</p></div><button onClick={onRefresh} className="flex items-center justify-center gap-2 rounded-xl border border-[#e4dace] bg-[#fffdf8] px-4 py-2.5 text-sm font-bold transition-colors hover:border-[#e66f51]" disabled={refreshPending} data-testid="button-refresh-summary"><RefreshCw size={16} className={refreshPending ? 'animate-spin' : ''} /> تحديث البيانات</button></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="المستخدمون" value={summary.totalUsers} note="حسابات مسجلة" icon={Users} accent="bg-[#dbe8d5] text-[#426440]" /><StatCard label="المواقع المنشورة" value={summary.totalWebsites} note="حضور رقمي مبني" icon={LayoutDashboard} accent="bg-[#f9dfc5] text-[#ad5f3e]" /><StatCard label="الرسائل المستخدمة" value={summary.messagesUsed} note="منذ بداية المنصة" icon={MessageCircle} accent="bg-[#f5e6ad] text-[#81621c]" /><StatCard label="مفاتيح Gemini" value={summary.activeApiKeys} note="مفتاح نشط الآن" icon={KeyRound} accent="bg-[#dce7ed] text-[#315e78]" /></div><div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-2xl border border-[#e4dace] bg-[#fffdf8] p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-[#829097]">صحة القنوات</p><h2 className="mt-1 font-serif text-xl font-bold">هل كل شيء جاهز؟</h2></div><Activity className="text-[#e66f51]" size={22} /></div><div className="mt-7 space-y-4"><HealthRow icon={MessageCircle} label="رقم واتساب" value={whatsappStatus?.connected ? whatsappStatus.message : whatsappStatus?.message || (summary.whatsappConfigured ? 'مهيأ، يحتاج فحص' : 'يحتاج إعداداً')} okay={whatsappStatus?.connected ?? summary.whatsappConfigured} /><HealthRow icon={Database} label="خدمة البيانات" value="متصلة" okay /><HealthRow icon={ShieldCheck} label="التحويل إلى المواقع" value="جاهز" okay /></div></section><section className="rounded-2xl bg-[#1b2735] p-6 text-[#fff8ee]"><p className="text-xs font-bold text-[#efb93b]">ملاحظة اليوم</p><h2 className="mt-3 font-serif text-xl font-bold leading-8">الموقع الجيد يبدأ من رسالة واضحة.</h2><p className="mt-3 text-sm leading-7 text-[#c6d0ce]">راجع مفاتيح الذكاء الاصطناعي والحدود المجانية دورياً حتى تبقى تجربة أصحاب الأعمال سلسة.</p><button onClick={onUsers} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#efb93b]" data-testid="button-overview-users">إدارة المستخدمين <ChevronLeft size={16} /></button></section></div></div>;
}

function HealthRow({ icon: Icon, label, value, okay }: { icon: typeof MessageCircle; label: string; value: string; okay: boolean }) { return <div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-xl ${okay ? 'bg-[#dbe8d5] text-[#426440]' : 'bg-[#f9e0d8] text-[#a34838]'}`}><Icon size={16} /></span><span className="text-sm font-semibold">{label}</span><span className={`mr-auto text-xs font-bold ${okay ? 'text-[#426440]' : 'text-[#a34838]'}`}>{value}</span>{okay ? <Check size={15} className="text-[#789d64]" /> : <X size={15} />}</div>; }

function UserMessagesDrawer({ userId, phoneNumber, onClose }: { userId: string; phoneNumber: string; onClose: () => void }) {
  const [cursors, setCursors] = useState<Array<number | undefined>>([undefined]);
  const page = cursors[cursors.length - 1];
  const query = useGetAdminUserMessages(userId, { before: page }, { query: { queryKey: getGetAdminUserMessagesQueryKey(userId, { before: page }) } });
  const queryClient = useQueryClient();
  const [allMessages, setAllMessages] = useState<NonNullable<typeof query.data>['messages']>([]);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const send = useSendUserMessage();

  useEffect(() => { setCursors([undefined]); setAllMessages([]); setDraft(''); setSendError(''); }, [userId]);
  useEffect(() => {
    if (!query.data) return;
    setAllMessages((current) => cursors.length === 1 ? query.data.messages : [...current, ...query.data.messages]);
  }, [query.data]);

  useEffect(() => {
    // Opening (or paging) a thread reads it — reflect that in the users list's unread badge without a full refetch delay.
    queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
  }, [query.data]);

  const hasMore = query.data?.hasMore ?? false;
  const loadOlder = () => { const oldest = allMessages[allMessages.length - 1]; if (oldest) setCursors((current) => [...current, oldest.id]); };

  const submitMessage = (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    setSendError('');
    send.mutate({ id: userId, data: { message } }, {
      onSuccess: () => {
        setDraft('');
        // The message we just sent is now part of the thread — refresh
        // the first page so it shows up without waiting on the user's
        // next inbound message.
        setCursors([undefined]);
        setAllMessages([]);
        queryClient.invalidateQueries({ queryKey: getGetAdminUserMessagesQueryKey(userId, { before: undefined }) });
      },
      onError: () => setSendError('تعذّر إرسال الرسالة. تأكد من إعداد واتساب وحاول مرة أخرى.'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl bg-[#fffdf8] sm:rounded-3xl" onClick={(event) => event.stopPropagation()} data-testid="panel-user-messages">
        <div className="flex items-center justify-between border-b border-[#e4dace] px-6 py-4">
          <div>
            <p className="text-xs font-bold text-[#829097]">محادثة واتساب</p>
            <h3 className="font-serif text-lg font-bold">{phoneNumber}</h3>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-[#eee6dc]" data-testid="button-close-messages"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {query.isLoading && cursors.length === 1 ? (
            <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
          ) : query.isError ? (
            <Notice>تعذر تحميل الرسائل.</Notice>
          ) : allMessages.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#829097]">لا توجد رسائل بعد.</p>
          ) : (
            allMessages.map((message) => (
              <div key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${message.direction === 'inbound' ? 'mr-auto bg-[#f3eadf] text-[#1b2735]' : 'ml-auto bg-[#1b2735] text-[#fff8ee]'}`} data-testid={`message-${message.id}`}>
                <p>{message.content}</p>
                <p className={`mt-1 text-[10px] ${message.direction === 'inbound' ? 'text-[#829097]' : 'text-[#c6d0ce]'}`}>{new Intl.DateTimeFormat('ar-SA', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(message.createdAt))}</p>
              </div>
            ))
          )}
          {hasMore && <button onClick={loadOlder} disabled={query.isFetching} className="mx-auto block rounded-lg border border-[#e4dace] px-4 py-2 text-xs font-bold text-[#69777d] hover:border-[#e66f51] disabled:opacity-50" data-testid="button-load-older-messages">{query.isFetching ? 'جارٍ التحميل...' : 'عرض السابق'}</button>}
        </div>
        <form onSubmit={submitMessage} className="border-t border-[#e4dace] p-4">
          {sendError && <div className="mb-3"><Notice>{sendError}</Notice></div>}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitMessage(event); } }}
              placeholder="اكتب رسالة للمستخدم..."
              rows={1}
              maxLength={4096}
              className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-[#ded2c3] bg-[#fffaf2] px-4 py-2.5 text-sm outline-none focus:border-[#e66f51]"
              data-testid="input-send-message"
            />
            <button
              type="submit"
              disabled={send.isPending || !draft.trim()}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#1b2735] text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="button-send-message"
            >
              <Send size={17} />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-[#829097]">هذه رسالة يدوية من فريق الإدارة، منفصلة عن ردود ORxai التلقائية.</p>
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
  const update = (id: string) => { const value = Number(delta[id]); if (!Number.isFinite(value) || value === 0) return; quota.mutate({ id, data: { delta: value } }, { onSuccess: () => { setNotice('تم تحديث الحد بنجاح.'); setDelta((current) => ({ ...current, [id]: '' })); queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() }); }, onError: () => setNotice('تعذر تحديث الحد.') }); };
  const toggleBlock = (id: string, blocked: boolean) => { blockToggle.mutate({ id, data: { blocked } }, { onSuccess: () => { setNotice(blocked ? 'تم حظر المستخدم.' : 'تم إلغاء حظر المستخدم.'); queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() }); }, onError: () => setNotice('تعذر تحديث حالة الحظر.') }); };
  const messagesUser = users.find((user) => user.id === messagesUserId);
  return <section id="users" className="space-y-5"><div><p className="text-sm font-semibold text-[#e66f51]">إدارة الحسابات</p><h2 className="mt-2 font-serif text-2xl font-bold">المستخدمون والحدود</h2></div>{notice && <Notice tone={notice.startsWith('تم') ? 'success' : 'error'}>{notice}</Notice>}{query.isLoading ? <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div> : query.isError ? <Notice>تعذر تحميل المستخدمين.</Notice> : users.length === 0 ? <EmptyState icon={Users} title="لا يوجد مستخدمون بعد" body="سيظهر أصحاب المشاريع هنا عند بدء استخدام منفذ." /> : <div className="overflow-x-auto rounded-2xl border border-[#e4dace] bg-[#fffdf8]"><table className="w-full min-w-[820px] text-right text-sm"><thead className="border-b border-[#e4dace] bg-[#f8f1e7] text-xs text-[#69777d]"><tr><th className="px-5 py-4 font-semibold">المستخدم</th><th className="px-5 py-4 font-semibold">المواقع</th><th className="px-5 py-4 font-semibold">الرسائل</th><th className="px-5 py-4 font-semibold">تعديل الحد</th><th className="px-5 py-4 font-semibold">المحادثة</th><th className="px-5 py-4 font-semibold">الحالة</th><th className="px-5 py-4 font-semibold">تاريخ التسجيل</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-[#eee6dc] last:border-0" data-testid={`row-user-${user.id}`}><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#dbe8d5] text-xs font-bold text-[#426440]">{user.phoneNumber.slice(-2)}</span><div><div className="font-bold" data-testid={`text-user-phone-${user.id}`}>{user.phoneNumber}</div><div className="mt-1 text-[11px] text-[#829097]">معرّف {user.id.slice(0, 8)}</div></div></div></td><td className="px-5 py-4 font-bold">{user.websiteCount}</td><td className="px-5 py-4"><span className="font-bold">{user.freeMessagesUsed}</span><span className="text-[#829097]"> / {user.freeMessagesLimit}</span><div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-[#eee6dc]"><div className="h-full rounded-full bg-[#e66f51]" style={{ width: `${Math.min(100, (user.freeMessagesUsed / Math.max(1, user.freeMessagesLimit)) * 100)}%` }} /></div></td><td className="px-5 py-4"><div className="flex items-center gap-2"><input type="number" value={delta[user.id] || ''} onChange={(event) => setDelta((current) => ({ ...current, [user.id]: event.target.value }))} placeholder="+10" className="w-20 rounded-lg border border-[#ded2c3] bg-[#fffdf8] px-2 py-2 text-center text-xs outline-none focus:border-[#e66f51]" data-testid={`input-quota-${user.id}`} /><button onClick={() => update(user.id)} disabled={quota.isPending} className="rounded-lg bg-[#1b2735] px-3 py-2 text-xs font-bold text-white disabled:opacity-50" data-testid={`button-update-quota-${user.id}`}>حفظ</button></div></td><td className="px-5 py-4"><button onClick={() => setMessagesUserId(user.id)} className="relative flex items-center gap-1.5 rounded-lg border border-[#e4dace] px-3 py-2 text-xs font-bold hover:border-[#e66f51]" data-testid={`button-messages-${user.id}`}><MessageCircle size={14} />عرض{user.unreadMessages > 0 && <span className="absolute -left-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#e66f51] text-[9px] font-bold text-white">{user.unreadMessages > 9 ? '9+' : user.unreadMessages}</span>}</button></td><td className="px-5 py-4">{user.blocked ? <button onClick={() => toggleBlock(user.id, false)} disabled={blockToggle.isPending} className="rounded-lg bg-[#f9e0d8] px-3 py-2 text-xs font-bold text-[#a34838] disabled:opacity-50" data-testid={`button-unblock-${user.id}`}>محظور — إلغاء</button> : <button onClick={() => toggleBlock(user.id, true)} disabled={blockToggle.isPending} className="flex items-center gap-1.5 rounded-lg border border-[#e4dace] px-3 py-2 text-xs font-bold text-[#69777d] hover:border-[#a34838] hover:text-[#a34838] disabled:opacity-50" data-testid={`button-block-${user.id}`}><Ban size={13} />حظر</button>}</td><td className="px-5 py-4 text-xs text-[#69777d]">{formatDate(user.createdAt)}</td></tr>)}</tbody></table></div>}{messagesUser && <UserMessagesDrawer userId={messagesUser.id} phoneNumber={messagesUser.phoneNumber} onClose={() => setMessagesUserId(null)} />}</section>;
}


function WebsitesPanel() {
  const query = useListAdminWebsites();
  const queryClient = useQueryClient();
  const toggleBranding = useUpdateAdminWebsiteBranding();
  const [notice, setNotice] = useState('');
  const websites = query.data || [];
  const toggle = (id: string, next: boolean) => toggleBranding.mutate({ id, data: { showBranding: next } }, { onSuccess: () => { setNotice(next ? 'تم إظهار شارة orxai.' : 'تم إخفاء شارة orxai.'); queryClient.invalidateQueries({ queryKey: getListAdminWebsitesQueryKey() }); }, onError: () => setNotice('تعذر تحديث الشارة.') });
  return <section id="websites" className="space-y-5"><div><p className="text-sm font-semibold text-[#e66f51]">حضور رقمي</p><h2 className="mt-2 font-serif text-2xl font-bold">المواقع وشارة orxai</h2><p className="mt-2 text-sm text-[#69777d]">تحكم بظهور شارة "تم الإنشاء بواسطة orxai" على أي موقع لصاحب مشروع.</p></div>{notice && <Notice tone={notice.startsWith('تم') ? 'success' : 'error'}>{notice}</Notice>}{query.isLoading ? <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div> : query.isError ? <Notice>تعذر تحميل المواقع.</Notice> : websites.length === 0 ? <EmptyState icon={Globe} title="لا توجد مواقع بعد" body="ستظهر مواقع أصحاب المشاريع هنا فور إنشائها." /> : <div className="overflow-x-auto rounded-2xl border border-[#e4dace] bg-[#fffdf8]"><table className="w-full min-w-[720px] text-right text-sm"><thead className="border-b border-[#e4dace] bg-[#f8f1e7] text-xs text-[#69777d]"><tr><th className="px-5 py-4 font-semibold">الموقع</th><th className="px-5 py-4 font-semibold">المالك</th><th className="px-5 py-4 font-semibold">شارة orxai</th><th className="px-5 py-4 font-semibold">آخر تحديث</th></tr></thead><tbody>{websites.map((site) => <tr key={site.id} className="border-b border-[#eee6dc] last:border-0" data-testid={`row-website-${site.id}`}><td className="px-5 py-4"><div className="font-bold" data-testid={`text-website-name-${site.id}`}>{site.siteName}</div><div className="mt-1 text-[11px] text-[#829097]">{site.templateId}</div></td><td className="px-5 py-4 text-xs">{site.ownerPhone || '—'}</td><td className="px-5 py-4"><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${site.showBranding ? 'bg-[#dbe8d5] text-[#426440]' : 'bg-[#f2eee6] text-[#829097]'}`}>{site.showBranding ? 'ظاهرة' : 'مخفية'}</span><button onClick={() => toggle(site.id, !site.showBranding)} disabled={toggleBranding.isPending} className="rounded-lg border border-[#ded2c3] px-3 py-2 text-xs font-bold transition-colors hover:border-[#e66f51] disabled:opacity-50" data-testid={`button-toggle-branding-${site.id}`}>{site.showBranding ? 'إخفاء الشارة' : 'إظهار الشارة'}</button></div></td><td className="px-5 py-4 text-xs text-[#69777d]">{formatDate(site.updatedAt)}</td></tr>)}</tbody></table></div>}</section>;
}

function KeysPanel() {
  const query = useListAdminApiKeys();
  const queryClient = useQueryClient();
  const create = useCreateAdminApiKey();
  const update = useUpdateAdminApiKey();
  const [key, setKey] = useState('');
  const [notice, setNotice] = useState('');
  const addKey = (event: FormEvent) => { event.preventDefault(); if (key.length < 10) { setNotice('يجب أن يحتوي المفتاح على 10 أحرف على الأقل.'); return; } create.mutate({ data: { key } }, { onSuccess: () => { setKey(''); setNotice('تمت إضافة المفتاح.'); queryClient.invalidateQueries({ queryKey: getListAdminApiKeysQueryKey() }); }, onError: () => setNotice('تعذر إضافة المفتاح.') }); };
  const toggle = (id: string, status: 'active' | 'disabled') => update.mutate({ id, data: { status } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAdminApiKeysQueryKey() }), onError: () => setNotice('تعذر تحديث حالة المفتاح.') });
  return <section className="space-y-5"><div><p className="text-sm font-semibold text-[#e66f51]">البنية الذكية</p><h2 className="mt-2 font-serif text-2xl font-bold">مفاتيح Gemini</h2><p className="mt-2 text-sm text-[#69777d]">أضف مفاتيح احتياطية وبدّلها دون كشف قيمها.</p></div>{notice && <Notice tone={notice.startsWith('تم') ? 'success' : 'error'}>{notice}</Notice>}<form onSubmit={addKey} className="flex flex-col gap-3 rounded-2xl border border-[#e4dace] bg-[#fffdf8] p-4 sm:flex-row"><input type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder="الصق مفتاح Gemini هنا" className="min-w-0 flex-1 rounded-xl border border-[#ded2c3] bg-[#fffaf2] px-4 py-3 text-sm outline-none focus:border-[#e66f51]" data-testid="input-gemini-key" /><button type="submit" disabled={create.isPending} className="flex items-center justify-center gap-2 rounded-xl bg-[#e66f51] px-5 py-3 text-sm font-bold text-white disabled:opacity-50" data-testid="button-add-gemini-key"><Plus size={17} /> إضافة مفتاح</button></form>{query.isLoading ? <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div> : query.isError ? <Notice>تعذر تحميل المفاتيح.</Notice> : <div className="space-y-3">{(query.data || []).length === 0 ? <EmptyState icon={KeyRound} title="لا توجد مفاتيح" body="أضف أول مفتاح لتفعيل إنشاء المواقع." /> : (query.data || []).map((item) => { const active = item.status === ApiKeyStatus.active; return <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-[#e4dace] bg-[#fffdf8] p-5 sm:flex-row sm:items-center" data-testid={`row-api-key-${item.id}`}><span className={`grid size-10 place-items-center rounded-xl ${active ? 'bg-[#dbe8d5] text-[#426440]' : 'bg-[#f2eee6] text-[#829097]'}`}><KeyRound size={18} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-bold">{item.maskedKey}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${active ? 'bg-[#dbe8d5] text-[#426440]' : 'bg-[#f2eee6] text-[#829097]'}`}>{active ? 'نشط' : 'متوقف'}</span></div><p className="mt-1 text-xs text-[#829097]">آخر استخدام: {formatDate(item.lastUsedAt)}</p></div><button onClick={() => toggle(item.id, active ? 'disabled' : 'active')} disabled={update.isPending} className="rounded-xl border border-[#ded2c3] px-4 py-2 text-xs font-bold transition-colors hover:border-[#e66f51]" data-testid={`button-toggle-key-${item.id}`}>{active ? 'إيقاف مؤقت' : 'تفعيل المفتاح'}</button></div>; })}</div>}</section>;
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
  const save = () => update.mutate({ data: { settings: settings.map((item) => ({ key: item.key, value: values[item.key] ?? item.value })) } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAdminSettingsQueryKey() }) });
  return <section className="space-y-5"><div><p className="text-sm font-semibold text-[#e66f51]">تشغيل المنصة</p><h2 className="mt-2 font-serif text-2xl font-bold">الإعدادات العامة</h2><p className="mt-2 text-sm text-[#69777d]">تحكم في القنوات التي يعتمد عليها أصحاب المشاريع.</p></div>{query.isLoading ? <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : query.isError ? <Notice>تعذر تحميل الإعدادات.</Notice> : <div className="rounded-2xl border border-[#e4dace] bg-[#fffdf8] p-5">{settings.length === 0 ? <EmptyState icon={Settings2} title="لا توجد إعدادات" body="ستظهر إعدادات المنصة عند تهيئتها." /> : <><div className="space-y-4">{settings.map((item) => <label key={item.key} className="block text-sm font-bold" data-testid={`field-setting-${item.key}`}>{item.key}<input value={values[item.key] ?? item.value} onChange={(event) => setValues((current) => ({ ...current, [item.key]: event.target.value }))} className="mt-2 w-full rounded-xl border border-[#ded2c3] bg-[#fffaf2] px-4 py-3 font-normal outline-none focus:border-[#e66f51]" data-testid={`input-setting-${item.key}`} /></label>)}</div><button onClick={save} disabled={update.isPending} className="mt-6 flex items-center gap-2 rounded-xl bg-[#1b2735] px-5 py-3 text-sm font-bold text-white disabled:opacity-50" data-testid="button-save-settings"><Save size={16} /> {update.isPending ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}</button></>}</div>}</section>;
}

function EmptyState({ icon: Icon, title, body }: { icon: typeof Users; title: string; body: string }) { return <div className="rounded-2xl border border-dashed border-[#d9ccbb] bg-[#fffaf2] p-10 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f2eee6] text-[#829097]"><Icon size={20} /></span><h3 className="mt-4 font-serif font-bold">{title}</h3><p className="mt-2 text-sm text-[#829097]">{body}</p></div>; }

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(() => typeof window !== 'undefined' && sessionStorage.getItem('manfaz-admin') === 'true');
  const [section, setSection] = useState<Section>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const showSplash = useEntrySplash();
  const summary = useGetAdminSummary({ query: { queryKey: getGetAdminSummaryQueryKey(), enabled: authenticated } });
  const whatsappStatus = useGetAdminWhatsappStatus({ query: { queryKey: getGetAdminWhatsappStatusQueryKey(), enabled: authenticated } });
  const nav = [{ id: 'overview' as Section, label: 'نظرة عامة', icon: LayoutDashboard }, { id: 'users' as Section, label: 'المستخدمون', icon: Users }, { id: 'websites' as Section, label: 'المواقع', icon: Globe }, { id: 'keys' as Section, label: 'مفاتيح Gemini', icon: KeyRound }, { id: 'settings' as Section, label: 'الإعدادات', icon: Settings2 }];
  if (showSplash) return <BrandSplash show />;
  if (!authenticated) return <Login />;
  const currentLabel = nav.find((item) => item.id === section)?.label || '';
  const logout = () => { sessionStorage.removeItem('manfaz-admin'); setAuthenticated(false); };
  return <div dir="rtl" className="grain min-h-[100dvh] bg-[#f8f1e7] text-[#1b2735]"><aside className={`fixed inset-y-0 right-0 z-30 w-72 bg-[#1b2735] p-6 text-[#fff8ee] transition-transform duration-300 lg:translate-x-0 ${mobileNav ? 'translate-x-0' : 'translate-x-full'}`}><div className="flex items-center justify-between"><Brand dark /><button onClick={() => setMobileNav(false)} className="text-[#829097] lg:hidden" data-testid="button-close-nav"><X size={20} /></button></div><div className="mt-14 text-[11px] font-bold tracking-[.08em] text-[#829097]">مساحة الإدارة</div><nav className="mt-4 space-y-2">{nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setSection(id); setMobileNav(false); }} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${section === id ? 'bg-[#e66f51] text-white' : 'text-[#c2cdca] hover:bg-[#263746]'}`} data-testid={`button-nav-${id}`}><Icon size={18} />{label}</button>)}</nav><div className="absolute bottom-6 right-6 left-6 border-t border-[#ffffff1a] pt-5"><button onClick={logout} className="flex items-center gap-3 text-sm font-semibold text-[#aebbb8] transition-colors hover:text-[#efb93b]" data-testid="button-admin-logout"><LogOut size={17} /> تسجيل الخروج</button></div></aside>{mobileNav && <button className="fixed inset-0 z-20 bg-[#1b2735]/50 lg:hidden" onClick={() => setMobileNav(false)} aria-label="إغلاق القائمة" data-testid="button-overlay-nav" />}<div className="lg:mr-72"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e4dace] bg-[#f8f1e7]/95 px-5 py-4 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button onClick={() => setMobileNav(true)} className="rounded-xl border border-[#e4dace] bg-[#fffdf8] p-2 lg:hidden" data-testid="button-open-nav"><Menu size={18} /></button><div><p className="text-xs font-semibold text-[#829097]">مركز منفذ</p><h1 className="mt-0.5 font-serif text-lg font-bold">{currentLabel}</h1></div></div><div className="flex items-center gap-3"><span className="hidden items-center gap-2 text-xs font-semibold text-[#69777d] sm:flex"><span className="size-2 rounded-full bg-[#789d64]" /> النظام يعمل</span><Link href="/" className="grid size-9 place-items-center rounded-xl border border-[#e4dace] bg-[#fffdf8] text-[#69777d] transition-colors hover:text-[#e66f51]" data-testid="link-view-home"><ChevronLeft size={17} /></Link></div></header><main className="admin-scroll mx-auto max-w-7xl overflow-auto px-5 py-8 md:px-8 md:py-10">{section === 'overview' && <Overview summary={summary.data} whatsappStatus={whatsappStatus.data} isLoading={summary.isLoading} refreshPending={summary.isFetching} onRefresh={() => summary.refetch()} onUsers={() => setSection('users')} />}{section === 'users' && <UsersPanel />}{section === 'websites' && <WebsitesPanel />}{section === 'keys' && <KeysPanel />}{section === 'settings' && <SettingsPanel />}</main></div></div>;
}