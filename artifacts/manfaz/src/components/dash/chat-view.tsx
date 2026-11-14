import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, ExternalLink, FolderOpen, Home, Loader2, Lock, LogOut, Menu, Plus, Settings, X, type LucideIcon } from 'lucide-react';
import { useLocation, useSearch } from 'wouter';
import { OrxaiMark } from '@/components/orxai-mark';
import { ServiceCard } from '@/components/studio/service-card';
import {
  ApiError,
  accountQueryKey,
  askDashboardAssistant,
  createWebsiteInPlatform,
  fetchActivity,
  getActiveSiteUsername,
  setServicePublished,
  setActiveSiteUsername,
  siteQueryKey,
  siteUrl,
  slugifyUsername,
  useDeleteSite,
  useSaveSite,
  useSiteDocument,
  type Account,
  type AccountWebsite,
  type SiteDocument,
} from '@/lib/account';
import { relativeTime } from './primitives';
import {
  COLOR_PRESETS,
  STYLE_NAMES,
  STYLE_ORDER,
  TEMPLATES,
  applyAction,
  applyOps,
  createBlockReason,
  draftFromCreate,
  getItems,
  getTemplate,
  groupItems,
  interpret,
  isDirty,
  isInteractiveTemplate,
  newDraft,
  normalize,
  styleOf,
  type Action,
  type Draft,
  type PlanUsage,
  type SiteStyle,
} from '@/lib/studio';
import { BLUE, INK, LogoMark, MUTED, UserAvatar, iconFor } from './primitives';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChipAction =
  | { t: 'template'; id: string }
  | { t: 'send'; text: string }
  | { t: 'color'; hex: string; label: string }
  | { t: 'style'; style: SiteStyle }
  | { t: 'undo' }
  | { t: 'reload' }
  | { t: 'open'; username: string }
  | { t: 'copy'; text: string };

interface Chip {
  label: string;
  action: ChipAction;
  swatch?: string;
}

interface Msg {
  id: number;
  role: 'bot' | 'user';
  text: string;
  chips?: Chip[];
  at: number;
  // 'card' = where the live service card sits in the thread; 'form' = the inline
  // "name your service" step shown after choosing a type.
  kind?: 'card' | 'form';
  templateId?: string;
  done?: boolean;
}

// One isolated conversation + canvas per service: chat history, unsaved edits
// and the undo stack never leak between services.
interface Session {
  draft: Draft | null;
  baseline: Draft | null;
  version: string;
  messages: Msg[];
  history: Draft[];
  flash: number[];
  flashField?: string;
  thinking?: boolean;
}

const NEW_KEY = 'new';

// The dashboard page unmounts when the person taps "home" or "services". Keeping
// sessions here means an unsaved draft or a half-finished conversation is still
// there when they come back to the chat tab.
const store: { sessions: Record<string, Session>; activeKey: string | null } = { sessions: {}, activeKey: null };
let nextMsgId = 1;

// Called on logout so one person's drafts never show up for the next account.
export function resetChatStore() {
  store.sessions = {};
  store.activeKey = null;
}
const emptySession = (): Session => ({ draft: null, baseline: null, version: '', messages: [], history: [], flash: [] });

function toDraft(doc: SiteDocument): Draft {
  return {
    isNew: false,
    id: doc.id,
    username: doc.username,
    siteName: doc.siteName,
    templateId: doc.templateId,
    themeColor: doc.themeColor || COLOR_PRESETS[0],
    showBranding: doc.showBranding,
    structure: doc.jsonStructure ?? {},
  };
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');

const COLOR_CHIPS: Chip[] = [
  { label: 'أزرق', swatch: '#2563EB', action: { t: 'color', hex: '#2563EB', label: 'الأزرق' } },
  { label: 'كحلي', swatch: '#0F172A', action: { t: 'color', hex: '#0F172A', label: 'الكحلي' } },
  { label: 'أخضر', swatch: '#059669', action: { t: 'color', hex: '#059669', label: 'الأخضر' } },
  { label: 'أحمر', swatch: '#BE123C', action: { t: 'color', hex: '#BE123C', label: 'الأحمر' } },
  { label: 'بنفسجي', swatch: '#6D28D9', action: { t: 'color', hex: '#6D28D9', label: 'البنفسجي' } },
  { label: 'برتقالي', swatch: '#EA580C', action: { t: 'color', hex: '#EA580C', label: 'البرتقالي' } },
];

const PRICE_CHIPS: Chip[] = [
  { label: '+ 5 ر.س', action: { t: 'send', text: 'زد الأسعار 5 ريال' } },
  { label: '+ 10 ر.س', action: { t: 'send', text: 'زد الأسعار 10 ريال' } },
  { label: '+ 10٪', action: { t: 'send', text: 'زد الأسعار 10%' } },
  { label: '− 5 ر.س', action: { t: 'send', text: 'خفض الأسعار 5 ريال' } },
  { label: '− 10٪', action: { t: 'send', text: 'خفض الأسعار 10%' } },
];

const TYPE_CHIPS: Chip[] = TEMPLATES.map((t) => ({ label: t.label, action: { t: 'template', id: t.id } }));

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

function BotAvatar() {
  return (
    <span
      className="grid size-11 shrink-0 place-items-center rounded-full text-white"
      style={{ background: 'linear-gradient(135deg,#0B2A6F 0%,#2563EB 100%)', boxShadow: '0 4px 12px -4px rgba(37,99,235,.6)' }}
      aria-hidden
    >
      <OrxaiMark monochrome className="size-[52%] text-[#BFE3FF]" aria-hidden />
    </span>
  );
}

const clock = (at: number) => new Date(at).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' });

function ChipButton({
  chip,
  onPick,
  large = false,
  locked = false,
}: {
  chip: Chip;
  onPick: (c: Chip) => void;
  large?: boolean;
  locked?: boolean;
}) {
  const Icon: LucideIcon | null = chip.action.t === 'template' ? (locked ? Lock : iconFor(chip.action.id)) : null;
  return (
    <button
      type="button"
      onClick={() => onPick(chip)}
      className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border bg-white font-bold transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF] ${large ? 'h-12 px-4 text-[13px]' : 'h-9 rounded-full px-3.5 text-xs'}`}
      style={{ borderColor: '#D5DEEE', color: locked ? '#94A3B8' : INK }}
      title={locked ? 'هذا النوع مكتمل في خطتك' : undefined}
    >
      {chip.swatch && <span className="size-3.5 rounded-full" style={{ backgroundColor: chip.swatch }} />}
      {Icon && <Icon size={17} style={{ color: locked ? '#94A3B8' : BLUE }} />}
      {chip.label}
    </button>
  );
}

function Bubble({
  msg,
  onPick,
  phone,
  blocked,
}: {
  msg: Msg;
  onPick: (c: Chip) => void;
  phone: string;
  blocked: Set<string>;
}) {
  const mine = msg.role === 'user';
  return (
    <div className="flex items-start gap-2.5" style={{ direction: 'rtl' }}>
      {mine ? <UserAvatar phone={phone} size={40} /> : <BotAvatar />}
      <div className={`min-w-0 max-w-[84%] ${mine ? '' : 'flex-1'}`}>
        <div
          className="inline-block whitespace-pre-line rounded-2xl px-4 py-3 text-[14.5px] font-semibold leading-relaxed"
          style={
            mine
              ? { backgroundColor: BLUE, color: '#FFFFFF', borderTopRightRadius: 6 }
              : { backgroundColor: '#FFFFFF', color: INK, border: '1px solid #E1E8F5', borderTopRightRadius: 6, boxShadow: '0 4px 14px -10px rgba(15,35,95,.25)' }
          }
        >
          {msg.text}
        </div>
        {msg.chips && msg.chips.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {msg.chips.map((c) => (
              <ChipButton
                key={c.label}
                chip={c}
                onPick={onPick}
                large={c.action.t === 'template'}
                locked={c.action.t === 'template' && blocked.has(c.action.id)}
              />
            ))}
          </div>
        )}
        <p className="mt-1 px-1 text-[11px] font-semibold" style={{ color: '#94A3B8' }}>{clock(msg.at)}</p>
      </div>
    </div>
  );
}

// The inline "name your service" step (see the reference chat): one field,
// skip or continue — no modal, no separate form page.
function FormCard({ msg, onSubmit }: { msg: Msg; onSubmit: (value: string | null) => void }) {
  const [value, setValue] = useState('');
  const tpl = getTemplate(msg.templateId ?? 'store');
  const Icon = iconFor(tpl.id);
  const disabled = !!msg.done;
  return (
    <div className="flex items-start gap-2.5" style={{ direction: 'rtl' }}>
      <span className="size-11 shrink-0" aria-hidden />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!disabled) onSubmit(value.trim() || null);
        }}
        className="min-w-0 flex-1 space-y-3 rounded-2xl border p-4"
        style={{ backgroundColor: '#EEF3FF', borderColor: '#D5E0F7', opacity: disabled ? 0.6 : 1 }}
      >
        <div className="flex items-center gap-2">
          <Icon size={20} style={{ color: BLUE }} />
          <h3 className="text-[15px] font-black" style={{ color: INK }}>معلومات {tpl.label}</h3>
        </div>
        <p className="text-[13px] font-semibold" style={{ color: MUTED }}>أدخل اسم نشاطك أو وصفه باختصار.</p>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder={`مثال: ${tpl.starter.siteName}`}
          aria-label="اسم النشاط أو وصفه"
          maxLength={160}
          className="h-12 w-full rounded-xl border bg-white px-3.5 text-[15px] font-semibold outline-none placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,.15)]"
          style={{ borderColor: '#D5DEEE', color: INK }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSubmit(null)}
            className="h-12 flex-1 rounded-xl border bg-white text-sm font-extrabold disabled:opacity-60"
            style={{ borderColor: '#D5DEEE', color: INK }}
          >
            تخطي
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex h-12 flex-[1.5] items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-white disabled:opacity-60"
            style={{ backgroundColor: BLUE }}
          >
            متابعة
            <ArrowLeft size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-center gap-2.5" style={{ direction: 'rtl' }} role="status" aria-label="المساعد يكتب">
      <BotAvatar />
      <div className="flex items-center gap-1.5 rounded-2xl border bg-white px-4 py-3" style={{ borderColor: '#E1E8F5' }}>
        <span className="text-xs font-bold" style={{ color: '#1D4ED8' }}>المساعد يفكّر</span>
        {[0, 1, 2].map((i) => (
          <span key={i} className="studio-dot size-1.5 rounded-full" style={{ backgroundColor: BLUE, animationDelay: `${i * 160}ms` }} />
        ))}
      </div>
    </div>
  );
}

function PreviewSheet({ username, onClose }: { username: string; onClose: () => void }) {
  const src = useMemo(() => `${siteUrl(username)}?preview=${Date.now()}`, [username]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F172A]/60 sm:items-center" role="dialog" aria-modal="true" aria-label="معاينة حية" onClick={onClose}>
      <div
        className="flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white sm:h-[86dvh] sm:w-[420px] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: '#E2E8F0' }}>
          <p className="flex-1 text-sm font-extrabold" style={{ color: '#0F172A' }}>معاينة حية</p>
          <a
            href={siteUrl(username)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#F1F5F9] px-3 text-xs font-bold"
            style={{ color: '#0F172A' }}
          >
            <ExternalLink size={14} />
            فتح في تبويب جديد
          </a>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="grid size-9 place-items-center rounded-xl hover:bg-[#F1F5F9]">
            <X size={18} />
          </button>
        </div>
        <iframe title="معاينة الموقع" src={src} className="min-h-0 flex-1 border-0 bg-white" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ChatView({ account, sites, onLogout }: { account: Account; sites: AccountWebsite[]; onLogout: () => void }) {
  const [, navigate] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const saveSite = useSaveSite();
  const deleteSite = useDeleteSite();

  const [activeKey, setActiveKey] = useState<string | null>(() => store.activeKey);
  const [sessions, setSessions] = useState<Record<string, Session>>(() => store.sessions);
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  useEffect(() => {
    store.sessions = sessions;
    store.activeKey = activeKey;
  }, [sessions, activeKey]);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [previewUser, setPreviewUser] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [input, setInput] = useState('');
  const [hydrateTick, setHydrateTick] = useState(0);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const scrollRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<{ key: string; text: string; notice: string } | null>(null);
  const askAiRef = useRef<((key: string, text: string, current: Draft | null, onFail?: () => void) => Promise<void>) | null>(null);
  const usage: PlanUsage | undefined = account.usage;

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const msg = useCallback(
    (role: Msg['role'], text: string, chips?: Chip[]): Msg => ({ id: nextMsgId++, role, text, chips, at: Date.now() }),
    [],
  );
  const marker = useCallback((kind: 'card'): Msg => ({ id: nextMsgId++, role: 'bot', text: '', at: Date.now(), kind }), []);

  const patch = useCallback((key: string, fn: (s: Session) => Session) => {
    setSessions((prev) => ({ ...prev, [key]: fn(prev[key] ?? emptySession()) }));
  }, []);

  // --- Opening / creating ----------------------------------------------------

  const typePickerMessages = useCallback(
    (text?: string): Msg[] => [
      msg('bot', text ?? 'ماذا تريد أن تنشئ؟ اختر نوع الخدمة، أو اكتب بكلماتك مثل «أبغى أسوي منيو لمطعمي».', TYPE_CHIPS),
    ],
    [msg],
  );

  const openNew = useCallback(() => {
    setSessions((prev) => (prev[NEW_KEY] ? prev : { ...prev, [NEW_KEY]: { ...emptySession(), messages: typePickerMessages() } }));
    setActiveKey(NEW_KEY);
  }, [typePickerMessages]);

  // Puts a draft into the "new service" session. The previous draft (if any) goes
  // onto the undo stack, so replacing a draft is never destructive. The chat that
  // led here (type choice, name form) stays above the new card.
  const installDraft = useCallback((draft: Draft, intro: Msg[]) => {
    setSessions((prev) => {
      const old = prev[NEW_KEY];
      const carried = old && !old.draft ? old.messages.map((m) => (m.kind === 'form' ? { ...m, done: true } : m)) : [];
      return {
        ...prev,
        [NEW_KEY]: {
          draft,
          baseline: null,
          version: '',
          messages: [...carried, ...intro],
          history: old?.draft ? [...old.history, old.draft].slice(-30) : [],
          flash: [],
        },
      };
    });
    setActiveKey(NEW_KEY);
  }, []);

  const startDraft = useCallback(
    (templateId: string, siteName?: string) => {
      const reason = createBlockReason(usage, templateId);
      if (reason) {
        setSessions((prev) => (prev[NEW_KEY] ? prev : { ...prev, [NEW_KEY]: { ...emptySession(), messages: typePickerMessages() } }));
        setActiveKey(NEW_KEY);
        patch(NEW_KEY, (s) => ({ ...s, messages: [...s.messages, msg('bot', `${reason} عدّلها من القائمة أو احذفها لتنشئ بدلاً منها.`)] }));
        return;
      }
      const tpl = getTemplate(templateId);
      installDraft(newDraft(templateId, { siteName }), [
        msg('bot', `جهّزت لك «${tpl.label}» بمحتوى مبدئي. انقر على أي نص في البطاقة لتعديله، أو اكتب طلبك في الأسفل.`),
        marker('card'),
        msg('bot', 'تريد محتوى جاهزاً لنشاطك؟ اكتب وصفاً مثل «مطعم شاورما اسمه الشام» وسيكتبه لك المساعد الذكي.'),
      ]);
    },
    [installDraft, marker, msg, patch, typePickerMessages, usage],
  );

  // Choosing a type in the chat: show the person's choice, then the inline name
  // step — or, if their plan already used that slot, say so and offer the
  // existing service instead of a dead end.
  const beginType = useCallback(
    (templateId: string) => {
      const tpl = getTemplate(templateId);
      const reason = createBlockReason(usage, templateId);
      setSessions((prev) => (prev[NEW_KEY] ? prev : { ...prev, [NEW_KEY]: { ...emptySession(), messages: typePickerMessages() } }));
      setActiveKey(NEW_KEY);
      const existing = sites.find((s) => (isInteractiveTemplate(templateId) ? s.templateId === templateId : !isInteractiveTemplate(s.templateId)));
      patch(NEW_KEY, (s) => ({
        ...s,
        messages: [
          ...s.messages,
          msg('user', `أريد إنشاء ${tpl.label}`),
          reason
            ? msg(
                'bot',
                `${reason} يمكنك تعديل الموجودة أو حذفها لإنشاء جديدة.`,
                existing ? [{ label: `فتح «${existing.siteName}»`, action: { t: 'open', username: existing.username } }] : undefined,
              )
            : msg('bot', `ممتاز! سأساعدك في إنشاء ${tpl.label} خطوة بخطوة 😊`),
          ...(reason ? [] : [{ ...msg('bot', ''), kind: 'form' as const, templateId }]),
        ],
      }));
    },
    [msg, patch, sites, typePickerMessages, usage],
  );

  const submitForm = useCallback(
    (formId: number, templateId: string, value: string | null) => {
      patch(NEW_KEY, (s) => ({ ...s, messages: s.messages.map((m) => (m.id === formId ? { ...m, done: true } : m)) }));
      if (value) patch(NEW_KEY, (s) => ({ ...s, messages: [...s.messages, msg('user', value)] }));
      // A longer answer is a description of the business: let the assistant write
      // real content from it (falls back to the free starter if it can't).
      if (value && value.length > 40) void askAiRef.current?.(NEW_KEY, `أنشئ ${getTemplate(templateId).label}: ${value}`, null, () => startDraft(templateId));
      else startDraft(templateId, value ?? undefined);
    },
    [msg, patch, startDraft],
  );

  // Where to land: ?service=<username> (from a service card), ?new=1 (create), or
  // whatever was open last. The query is cleared right away so a refresh does not
  // repeat the action.
  useEffect(() => {
    const params = new URLSearchParams(search);
    const service = params.get('service');
    const wantsNew = params.get('new') === '1' || params.get('create') === '1';
    if (service && sites.some((s) => s.username === service)) {
      setActiveSiteUsername(service);
      setActiveKey(service);
      navigate('/dashboard/chat', { replace: true });
      return;
    }
    if (wantsNew) {
      const wanted = params.get('template');
      if (wanted && TEMPLATES.some((t) => t.id === wanted)) beginType(wanted);
      else openNew();
      navigate('/dashboard/chat', { replace: true });
      return;
    }
    if (activeKey !== null) return;
    const remembered = getActiveSiteUsername();
    const pick = sites.find((s) => s.username === remembered)?.username ?? sites[0]?.username;
    if (pick) {
      setActiveSiteUsername(pick);
      setActiveKey(pick);
    } else {
      openNew();
    }
  }, [search, activeKey, sites, openNew, beginType, navigate]);

  // Hydrate a saved service into its session once its document arrives. Local
  // unsaved edits always win over a refetch.
  const doc = useSiteDocument(activeKey && activeKey !== NEW_KEY ? activeKey : undefined);
  useEffect(() => {
    const data = doc.data;
    if (!activeKey || activeKey === NEW_KEY || !data || data.username !== activeKey) return;
    setSessions((prev) => {
      const cur = prev[activeKey];
      if (cur?.draft && cur.baseline && isDirty(cur.draft, cur.baseline)) return prev;
      if (cur?.draft && cur.version === data.updatedAt) return prev;
      const d = toDraft(data);
      return {
        ...prev,
        [activeKey]: {
          ...(cur ?? emptySession()),
          draft: d,
          baseline: d,
          version: data.updatedAt,
          messages: cur?.messages.length
            ? cur.messages
            : [msg('bot', 'أهلاً بك! يمكنك النقر مباشرة على أي عنصر في البطاقة لتعديله، أو كتابة طلبك في الأسفل.'), marker('card')],
        },
      };
    });
  }, [doc.data, activeKey, hydrateTick, msg, marker]);

  const session = activeKey ? sessions[activeKey] : undefined;
  const draft = session?.draft ?? null;
  const dirty = !!(session?.draft && session.baseline && isDirty(session.draft, session.baseline));
  const activeSite = sites.find((s) => s.username === activeKey);

  const selectKey = (key: string) => {
    if (key !== NEW_KEY) setActiveSiteUsername(key);
    setActiveKey(key);
    setMenuOpen(false);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  // --- Editing ---------------------------------------------------------------

  // Direct edits on the card (typing, color dots, add/remove rows).
  const edit = useCallback(
    (next: Draft) => {
      if (!activeKey) return;
      patch(activeKey, (s) => (s.draft ? { ...s, history: [...s.history, s.draft].slice(-30), draft: next, flash: [], flashField: undefined } : s));
    },
    [activeKey, patch],
  );

  const undo = useCallback(() => {
    if (!activeKey) return;
    patch(activeKey, (s) => {
      const prev = s.history[s.history.length - 1];
      if (!prev) return s;
      return { ...s, draft: prev, history: s.history.slice(0, -1), flash: [], flashField: undefined, messages: [...s.messages, msg('bot', 'تراجعت عن آخر تعديل.')] };
    });
  }, [activeKey, patch, msg]);

  const push = useCallback(
    (key: string, ...messages: Msg[]) => patch(key, (s) => ({ ...s, messages: [...s.messages, ...messages].slice(-40) })),
    [patch],
  );

  // Free-form requests the local parser can't handle go to Gemini through the
  // Worker (same admin-managed keys and message quota as WhatsApp). The model
  // returns validated operations; we apply them to the draft like any other edit.
  const askAi = useCallback(
    async (key: string, text: string, current: Draft | null, onFail?: () => void) => {
      patch(key, (s) => ({ ...s, thinking: true }));
      const history = (sessionsRef.current[key]?.messages ?? [])
        .slice(-7, -1)
        .map((m) => ({ role: m.role, text: m.text }));
      try {
        const res = await askDashboardAssistant({
          message: text,
          draft: current ? { siteName: current.siteName, templateId: current.templateId, themeColor: current.themeColor, structure: current.structure } : null,
          history,
          activeUsername: key !== NEW_KEY ? key : undefined,
        });
        void queryClient.invalidateQueries({ queryKey: accountQueryKey });
        // The message names another saved service: switch to it and carry on
        // there (decided server-side by the shared registry — no AI was used).
        if (res.switchTo) {
          replayRef.current = { key: res.switchTo.username, text, notice: `هذا الطلب يخص «${res.switchTo.name}» — انتقلت إليها.` };
          setActiveSiteUsername(res.switchTo.username);
          setActiveKey(res.switchTo.username);
          return;
        }
        if (res.create) {
          installDraft(draftFromCreate(res.create), [
            msg('bot', res.reply || `جهّزت لك «${res.create.siteName}». راجع المحتوى وعدّل ما تريد بالنقر، ثم انشر.`),
            marker('card'),
            msg('bot', 'يمكنك التعديل بالنقر على أي نص، أو اطلب مني: «أضف قسم حلويات» أو «غيّر اللون إلى أخضر».'),
          ]);
          return;
        }
        if (res.ops.length && current) {
          const result = applyOps(current, res.ops);
          if (result.changed) {
            patch(key, (s) => ({
              ...s,
              history: s.draft ? [...s.history, s.draft].slice(-30) : s.history,
              draft: result.draft,
              flash: result.touched,
              flashField: result.field,
              messages: [...s.messages, msg('bot', res.reply || 'تم التعديل — راجعه في البطاقة.', [{ label: 'تراجع', action: { t: 'undo' } }])].slice(-40),
            }));
            window.setTimeout(() => patch(key, (s) => ({ ...s, flash: [], flashField: undefined })), 1900);
            if (result.touched.length) {
              window.requestAnimationFrame(() =>
                document.getElementById(`studio-item-${result.touched[0]}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
              );
            }
            return;
          }
        }
        push(key, msg('bot', res.reply || 'لم أفهم الطلب تماماً. جرّب صياغة أخرى، أو عدّل مباشرة بالنقر على البطاقة.'));
      } catch (err) {
        const note = err instanceof ApiError && err.message ? err.message : 'تعذّر الوصول إلى المساعد الذكي. حاول مرة أخرى.';
        push(key, msg('bot', note));
        onFail?.();
      } finally {
        patch(key, (s) => ({ ...s, thinking: false }));
      }
    },
    [installDraft, marker, msg, patch, push, queryClient],
  );
  askAiRef.current = askAi;

  const runAction = useCallback(
    (key: string, action: Action, current: Draft | null, text = '') => {
      const requireDraft = (): Draft | null => {
        if (current) return current;
        push(key, msg('bot', 'ابدأ أولاً بإنشاء خدمة — اختر نوعها:', TYPE_CHIPS));
        return null;
      };

      switch (action.kind) {
        case 'create': {
          const detailed = !!action.siteName || text.trim().split(/\s+/).length >= 5;
          if (action.templateId && detailed && text) {
            // Rich request ("منيو لمطعم شاورما اسمه الشام"): let Gemini write real
            // content; if it can't, fall back to the free local starter.
            void askAi(key, text, current, () => startDraft(action.templateId as string, action.siteName));
          } else if (action.templateId) startDraft(action.templateId, action.siteName);
          else {
            setSessions((prev) => ({ ...prev, [NEW_KEY]: prev[NEW_KEY]?.draft ? prev[NEW_KEY] : { ...emptySession(), messages: typePickerMessages('ما نوع الخدمة التي تريد إنشاءها؟') } }));
            setActiveKey(NEW_KEY);
          }
          return;
        }
        case 'undo':
          undo();
          return;
        case 'stats': {
          const site = sites.find((s) => s.username === key);
          push(
            key,
            msg(
              'bot',
              site
                ? `📊 «${site.siteName}»: زيارات اليوم ${site.visitsToday}، وإجمالي الزيارات ${site.visitsTotal}${typeof site.submissionsCount === 'number' ? `، والردود المستلمة ${site.submissionsCount}` : ''}.`
                : 'انشر الخدمة أولاً لتبدأ الزيارات بالظهور هنا.',
            ),
          );
          return;
        }
        case 'orders': {
          const site = sites.find((s) => s.username === key);
          // The message names a different service: let the registry on the server
          // route it (it switches the screen) instead of answering for this one.
          const spoken = normalize(text);
          const other = sites.some((s) => s.username !== key && spoken.includes(normalize(s.siteName)));
          if (other) {
            void askAi(key, text, current);
            return;
          }
          if (!site) {
            push(key, msg('bot', 'انشر الخدمة أولاً لتبدأ الطلبات بالوصول هنا.'));
            return;
          }
          void (async () => {
            const events = (await fetchActivity()).filter((e) => e.type === 'submission' && e.username === key).slice(0, 5);
            const total = site.submissionsCount ?? events.length;
            if (!events.length) {
              push(key, msg('bot', `لا توجد طلبات أو ردود على «${site.siteName}» حتى الآن. شارك رابط الخدمة ليبدأ وصولها.`));
              return;
            }
            const lines = events.map((e, i) => `${i + 1}) ${e.title}${e.detail ? ` — ${e.detail}` : ''} (${relativeTime(e.at)})`);
            push(key, msg('bot', `📥 آخر ما وصل «${site.siteName}» — الإجمالي ${total}:\n${lines.join('\n')}`));
          })();
          return;
        }
        case 'openColors':
          push(key, msg('bot', 'اختر لون الهوية — سيتغير في البطاقة فوراً:', COLOR_CHIPS));
          return;
        case 'openStyles':
          push(
            key,
            msg('bot', 'اختر النمط:', STYLE_ORDER.map((s) => ({ label: STYLE_NAMES[s], action: { t: 'style', style: s } as ChipAction }))),
          );
          return;
        case 'unknown':
          void askAi(key, text, current);
          return;
        default: {
          const base = requireDraft();
          if (!base) return;
          const result = applyAction(base, action);
          if (!result.changed) {
            push(key, msg('bot', result.reply || 'لا يوجد ما يتغير.'));
            return;
          }
          patch(key, (s) => ({
            ...s,
            history: s.draft ? [...s.history, s.draft].slice(-30) : s.history,
            draft: result.draft,
            flash: result.touched,
            flashField: result.field,
            messages: [...s.messages, msg('bot', result.reply, [{ label: 'تراجع', action: { t: 'undo' } }])].slice(-40),
          }));
          window.setTimeout(() => patch(key, (s) => ({ ...s, flash: [], flashField: undefined })), 1900);
          if (result.touched.length) {
            window.requestAnimationFrame(() =>
              document.getElementById(`studio-item-${result.touched[0]}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
            );
          }
        }
      }
    },
    [askAi, msg, patch, push, sites, startDraft, typePickerMessages, undo],
  );

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || !activeKey || sessionsRef.current[activeKey]?.thinking) return;
      const current = sessionsRef.current[activeKey]?.draft ?? null;
      push(activeKey, msg('user', text));
      const sectionNames = current ? groupItems(getItems(current)).map((g) => g.name) : [];
      runAction(activeKey, interpret(text, { sectionNames, hasSite: !!current }), current, text);
    },
    [activeKey, msg, push, runAction],
  );

  const onChip = useCallback(
    (chip: Chip) => {
      if (!activeKey) return;
      const current = sessionsRef.current[activeKey]?.draft ?? null;
      const a = chip.action;
      switch (a.t) {
        case 'template':
          beginType(a.id);
          break;
        case 'open':
          setActiveSiteUsername(a.username);
          setActiveKey(a.username);
          break;
        case 'send':
          send(a.text);
          break;
        case 'color':
          runAction(activeKey, { kind: 'color', hex: a.hex, label: a.label }, current);
          break;
        case 'style':
          runAction(activeKey, { kind: 'style', style: a.style }, current);
          break;
        case 'undo':
          undo();
          break;
        case 'reload':
          patch(activeKey, (s) => ({ ...s, draft: null, baseline: null, version: '' }));
          void queryClient.invalidateQueries({ queryKey: siteQueryKey });
          setHydrateTick((n) => n + 1);
          break;
        case 'copy':
          void navigator.clipboard?.writeText(a.text).catch(() => undefined);
          break;
      }
    },
    [activeKey, beginType, patch, queryClient, runAction, send, undo],
  );

  // --- Saving ----------------------------------------------------------------

  const afterSaveMove = useCallback(
    (fromKey: string, saved: SiteDocument, note: string) => {
      const d = toDraft(saved);
      setSessions((prev) => {
        const old = prev[fromKey] ?? emptySession();
        const { [fromKey]: _removed, ...rest } = prev;
        return {
          ...rest,
          [saved.username]: {
            draft: d,
            baseline: d,
            version: saved.updatedAt,
            messages: [...old.messages, msg('bot', note, [{ label: 'نسخ الرابط', action: { t: 'copy', text: siteUrl(saved.username) } }])].slice(-40),
            history: [],
            flash: [],
          },
        };
      });
      setActiveSiteUsername(saved.username);
      setActiveKey(saved.username);
      queryClient.setQueryData(siteQueryKey, saved);
      queryClient.setQueryData([...siteQueryKey, saved.username], saved);
      void queryClient.invalidateQueries({ queryKey: accountQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['account-activity'] });
    },
    [msg, queryClient],
  );

  // Returns the saved service's username, or null on failure.
  const save = useCallback(async (): Promise<string | null> => {
    const key = activeKey;
    const s = key ? sessionsRef.current[key] : undefined;
    if (!key || !s?.draft) return null;
    const d = s.draft;
    setSaving(true);
    try {
      if (d.isNew) {
        const created = await createWebsiteInPlatform({
          siteName: d.siteName.trim() || getTemplate(d.templateId).starter.siteName,
          templateId: d.templateId,
          templateStyle: styleOf(d),
          themeColor: d.themeColor,
          darkMode: d.structure.darkMode === true,
          showBranding: d.showBranding,
          tagline: str(d.structure.tagline),
          headline: str(d.structure.headline),
          description: str(d.structure.description),
          initialItems: getItems(d).map((it) => ({
            name: it.name,
            title: it.title,
            price: it.price,
            duration: it.duration,
            category: it.category,
            description: it.description,
            image: it.image,
          })),
        });
        afterSaveMove(key, created, 'نُشرت خدمتك ✓ يمكنك الآن مشاركة الرابط، وتعديلها بالنقر أو بالكتابة في أي وقت.');
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 2200);
        return created.username;
      }
      const saved = await saveSite.mutateAsync({
        id: d.id,
        baseUpdatedAt: s.version,
        username: slugifyUsername(d.username.trim() || d.siteName.trim()),
        siteName: d.siteName,
        templateId: d.templateId,
        themeColor: d.themeColor,
        showBranding: d.showBranding,
        jsonStructure: d.structure,
      });
      afterSaveMove(key, saved, 'تم حفظ التغييرات ونشرها على موقعك.');
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2200);
      return saved.username;
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && !err.message.includes('الرابط')) {
        push(key, msg('bot', 'عُدّلت هذه الخدمة من مكان آخر (مثل واتساب) أثناء عملك. حمّل آخر نسخة لتجنّب فقدان أي تغيير، ثم أعد تعديلك.', [{ label: 'تحميل آخر نسخة', action: { t: 'reload' } }]));
      } else {
        push(key, msg('bot', err instanceof Error && err.message ? err.message : 'تعذّر الحفظ. حاول مرة أخرى.'));
      }
      return null;
    } finally {
      setSaving(false);
    }
  }, [activeKey, afterSaveMove, msg, push, saveSite]);

  const openPreview = useCallback(async () => {
    const s = activeKey ? sessionsRef.current[activeKey] : undefined;
    if (!s?.draft) return;
    const needsSave = s.draft.isNew || (s.baseline ? isDirty(s.draft, s.baseline) : false);
    const username = needsSave ? await save() : s.draft.username;
    if (username) setPreviewUser(username);
  }, [activeKey, save]);

  // Pause / resume the open service. The server refuses a resume when the plan's
  // slot is taken, and says why — shown here as a normal chat reply.
  const togglePublish = useCallback(async () => {
    const key = activeKey;
    const current = sites.find((s) => s.username === key);
    if (!key || key === NEW_KEY || !current) return;
    const next = current.published === false;
    try {
      await setServicePublished(key, next);
      await queryClient.invalidateQueries({ queryKey: accountQueryKey });
      push(
        key,
        msg(
          'bot',
          next
            ? `أعدت نشر «${current.siteName}» وصار زوارك يرونها.`
            : `أوقفت نشر «${current.siteName}». بياناتها محفوظة ولا يراها زوارك، وصارت خانتها فاضية في خطتك.`,
        ),
      );
    } catch (err) {
      push(key, msg('bot', err instanceof Error && err.message ? err.message : 'تعذّر تنفيذ الطلب.'));
    }
  }, [activeKey, msg, push, queryClient, sites]);

  const removeService = useCallback(async () => {
    const key = activeKey;
    if (!key || key === NEW_KEY) return;
    await deleteSite.mutateAsync(key);
    const rest = sites.filter((s) => s.username !== key);
    setSessions((prev) => {
      const { [key]: _gone, ...others } = prev;
      return others;
    });
    if (rest[0]) {
      setActiveSiteUsername(rest[0].username);
      setActiveKey(rest[0].username);
    } else {
      setActiveKey(null); // re-runs the first-load effect → create flow
    }
  }, [activeKey, deleteSite, sites]);


  // Keep the newest bubble in view; a freshly shown card scrolls to its top instead.
  useEffect(() => {
    const el = scrollRef.current;
    const msgs = session?.messages ?? [];
    const last = msgs[msgs.length - 1];
    if (!el || session?.flash.length || !last || last.kind === 'card') return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [session?.messages.length, session?.thinking, session?.flash.length]);
  const hasDraft = !!draft;
  useEffect(() => {
    if (!hasDraft) return;
    const id = window.requestAnimationFrame(() => document.getElementById('studio-card')?.scrollIntoView({ block: 'start' }));
    return () => window.cancelAnimationFrame(id);
  }, [activeKey, hasDraft]);

  // A request that named another service continues once that service has loaded.
  useEffect(() => {
    const r = replayRef.current;
    if (r && activeKey === r.key && sessions[r.key]?.draft) {
      replayRef.current = null;
      push(r.key, msg('bot', r.notice));
      send(r.text);
    }
  });

  // --- Render ------------------------------------------------------------------

  const messages = session?.messages ?? [];
  const tpl = draft ? getTemplate(draft.templateId) : null;
  // Types whose plan slot is already used — shown locked (and explained on tap).
  const blocked = new Set(TEMPLATES.filter((t) => createBlockReason(usage, t.id)).map((t) => t.id));

  const quickChips: Chip[] = draft && tpl
    ? [
        { label: 'تغيير الألوان', action: { t: 'send', text: 'غيّر الألوان' } },
        ...(tpl.hasSections ? [{ label: '+ إضافة قسم جديد', action: { t: 'send', text: 'أضف قسم جديد' } } as Chip] : []),
        ...(tpl.hasPrice ? [{ label: 'ضبط الأسعار', action: { t: 'send', text: 'ضبط الأسعار' } } as Chip] : []),
      ]
    : [];

  const onQuickChip = (chip: Chip) => {
    if (chip.action.t === 'send' && chip.action.text === 'ضبط الأسعار' && activeKey) {
      push(activeKey, msg('bot', 'كم تريد أن تغيّر الأسعار؟ أو اكتب رقماً مثل «زد الأسعار 3 ريال».', PRICE_CHIPS));
      return;
    }
    onChip(chip);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = input;
    setInput('');
    send(value);
  };

  const tabs = [
    ...sites.map((s) => ({ key: s.username, label: s.published === false ? `${s.siteName} ⏸` : s.siteName })),
    // Just-published service whose account refetch hasn't landed yet.
    ...(activeKey && activeKey !== NEW_KEY && draft && !sites.some((s) => s.username === activeKey) ? [{ key: activeKey, label: draft.siteName }] : []),
    ...(activeKey === NEW_KEY ? [{ key: NEW_KEY, label: 'خدمة جديدة' }] : []),
  ];

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <div dir="rtl" className="dash-bg flex h-[100dvh] flex-col font-sans" style={{ color: INK }}>
      <header className="z-30 border-b bg-white" style={{ borderColor: '#E6ECF7' }}>
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-extrabold"
            style={{ backgroundColor: '#EEF3FF', color: INK }}
            role="status"
          >
            {online ? 'متصل' : 'غير متصل'}
            <span className="size-2.5 rounded-full" style={{ backgroundColor: online ? '#22C55E' : '#94A3B8' }} />
          </span>
          <LogoMark />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="القائمة"
            aria-expanded={menuOpen}
            className="grid size-10 place-items-center rounded-xl hover:bg-[#EEF3FF]"
          >
            <Menu size={24} style={{ color: '#1E3A8A' }} />
          </button>
        </div>
        {tabs.length > 0 && (
          <nav aria-label="خدماتي" className="border-t" style={{ borderColor: '#F1F5F9' }}>
            <ul className="no-scrollbar mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-2.5">
              {tabs.map((t) => {
                const active = t.key === activeKey;
                const s = sessions[t.key];
                const unsaved = !!(s?.draft && (s.draft.isNew || (s.baseline && isDirty(s.draft, s.baseline))));
                return (
                  <li key={t.key} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => selectKey(t.key)}
                      aria-current={active ? 'page' : undefined}
                      className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-bold"
                      style={active ? { backgroundColor: INK, color: '#fff', borderColor: INK } : { backgroundColor: '#fff', color: INK, borderColor: '#CBD5E1' }}
                    >
                      {t.label}
                      {unsaved && <span className="size-1.5 rounded-full" style={{ backgroundColor: '#F59E0B' }} aria-label="غير محفوظ" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </header>

      <div ref={scrollRef} className="dash-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-5">
          {!session || (!draft && activeKey !== NEW_KEY) ? (
            <div className="flex items-center justify-center py-16" aria-live="polite">
              <Loader2 className="animate-spin" size={24} style={{ color: BLUE }} />
            </div>
          ) : (
            <>
              {messages.map((m) => {
                if (m.kind === 'card') {
                  return draft ? (
                    <div key={m.id} id="studio-card">
                      <ServiceCard
                        draft={draft}
                        dirty={dirty}
                        saving={saving}
                        justSaved={justSaved}
                        flash={session.flash}
                        flashField={session.flashField}
                        canUndo={session.history.length > 0}
                        url={!draft.isNew ? siteUrl(draft.username) : undefined}
                        stats={activeSite ? { today: activeSite.visitsToday, total: activeSite.visitsTotal } : undefined}
                        onUndo={undo}
                        onChange={edit}
                        onSave={() => void save()}
                        onPreview={() => void openPreview()}
                        onDelete={() => void removeService()}
                        published={activeSite ? activeSite.published !== false : undefined}
                        onTogglePublish={activeSite ? () => void togglePublish() : undefined}
                        onNotice={(text) => activeKey && push(activeKey, msg('bot', text))}
                      />
                    </div>
                  ) : null;
                }
                if (m.kind === 'form') return <FormCard key={m.id} msg={m} onSubmit={(value) => submitForm(m.id, m.templateId ?? 'store', value)} />;
                return <Bubble key={m.id} msg={m} onPick={onChip} phone={account.phoneNumber} blocked={blocked} />;
              })}
              {session.thinking && <Typing />}
            </>
          )}
        </div>
      </div>

      <div className="z-20 border-t bg-white dash-safe-bottom" style={{ borderColor: '#E6ECF7' }}>
        <div className="mx-auto w-full max-w-2xl">
          {quickChips.length > 0 && (
            <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 pt-3">
              {quickChips.map((c) => (
                <li key={c.label} className="shrink-0">
                  <ChipButton chip={c} onPick={onQuickChip} />
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={submit} className="flex items-center gap-2.5 px-4 pb-3 pt-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={draft ? 'اكتب ما تريد تعديله أو إضافته...' : 'اكتب رسالتك هنا...'}
              aria-label="اكتب رسالتك"
              enterKeyHint="send"
              autoComplete="off"
              className="h-12 min-w-0 flex-1 rounded-2xl border bg-white px-4 text-base font-semibold outline-none placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
              style={{ borderColor: '#D5DEEE', color: INK }}
            />
            <button
              type="submit"
              disabled={!input.trim() || !!session?.thinking}
              aria-label="إرسال"
              className="grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.8)] disabled:opacity-40"
              style={{ backgroundColor: BLUE }}
            >
              <ArrowLeft size={21} />
            </button>
          </form>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/45" role="dialog" aria-modal="true" aria-label="القائمة" onClick={() => setMenuOpen(false)}>
          <div className="mr-auto flex h-full w-72 flex-col bg-white p-4 shadow-2xl" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <LogoMark size={32} />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="إغلاق" className="grid size-9 place-items-center rounded-xl hover:bg-[#F1F5F9]">
                <X size={18} />
              </button>
            </div>
            <nav className="space-y-1">
              {[
                { label: 'الرئيسية', path: '/dashboard', icon: Home },
                { label: 'خدماتي', path: '/dashboard/services', icon: FolderOpen },
                { label: 'الإعدادات', path: '/dashboard/settings', icon: Settings },
              ].map(({ label, path, icon: Icon }) => (
                <button key={path} type="button" onClick={() => go(path)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold hover:bg-[#F1F5F9]">
                  <Icon size={19} style={{ color: BLUE }} />
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openNew();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold hover:bg-[#F1F5F9]"
              >
                <Plus size={19} style={{ color: BLUE }} />
                إنشاء خدمة جديدة
              </button>
            </nav>
            <button type="button" onClick={onLogout} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[#BE123C] hover:bg-[#FEF2F2]">
              <LogOut size={19} />
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}

      {previewUser && <PreviewSheet username={previewUser} onClose={() => setPreviewUser(null)} />}
      {justSaved && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold text-white shadow-lg" style={{ backgroundColor: INK }}>
            <Check size={14} style={{ color: '#34D399' }} />
            تم الحفظ
          </span>
        </div>
      )}
    </div>
  );
}
