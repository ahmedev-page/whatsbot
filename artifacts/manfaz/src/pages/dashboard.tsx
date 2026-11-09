import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, ExternalLink, Loader2, LogOut, Plus, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Brand } from '@/components/brand';
import { ServiceCard } from '@/components/studio/service-card';
import {
  ApiError,
  accountQueryKey,
  askDashboardAssistant,
  createWebsiteInPlatform,
  getActiveSiteUsername,
  getLocalAccount,
  setActiveSiteUsername,
  siteQueryKey,
  siteUrl,
  slugifyUsername,
  useAccount,
  useDeleteSite,
  useLogout,
  useSaveSite,
  useSiteDocument,
  type SiteDocument,
} from '@/lib/account';
import {
  COLOR_PRESETS,
  STYLE_NAMES,
  STYLE_ORDER,
  TEMPLATES,
  applyAction,
  applyOps,
  draftFromCreate,
  getItems,
  getTemplate,
  groupItems,
  interpret,
  isDirty,
  newDraft,
  styleOf,
  type Action,
  type Draft,
  type SiteStyle,
} from '@/lib/studio';

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

function ChipButton({ chip, onPick, large = false }: { chip: Chip; onPick: (c: Chip) => void; large?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onPick(chip)}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border bg-white font-bold transition-colors hover:border-[#2563EB] hover:bg-[#EFF6FF] ${large ? 'h-11 justify-center px-4 text-sm' : 'h-9 px-3.5 text-xs'}`}
      style={{ borderColor: '#CBD5E1', color: '#0F172A' }}
    >
      {chip.swatch && <span className="size-3.5 rounded-full" style={{ backgroundColor: chip.swatch }} />}
      {chip.label}
    </button>
  );
}

function Bubble({ msg, onPick, grid = false }: { msg: Msg; onPick: (c: Chip) => void; grid?: boolean }) {
  const mine = msg.role === 'user';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`} style={{ direction: 'rtl' }}>
      <div className="max-w-[92%]">
        <div
          className="rounded-2xl px-4 py-3 text-sm font-semibold leading-relaxed"
          style={
            mine
              ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderTopLeftRadius: 6 }
              : { backgroundColor: '#EAF0FD', color: '#0F172A', border: '1px solid #D5E0F7', borderTopRightRadius: 6 }
          }
        >
          {msg.text}
        </div>
        {msg.chips && msg.chips.length > 0 && (
          <div className={grid ? 'mt-2.5 grid grid-cols-2 gap-2' : 'mt-2 flex flex-wrap gap-1.5'}>
            {msg.chips.map((c) => (
              <ChipButton key={c.label} chip={c} onPick={onPick} large={grid} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start" style={{ direction: 'rtl' }} role="status" aria-label="المساعد يكتب">
      <div className="flex items-center gap-1.5 rounded-2xl px-4 py-3" style={{ backgroundColor: '#EAF0FD', border: '1px solid #D5E0F7', borderTopRightRadius: 6 }}>
        <span className="text-xs font-bold" style={{ color: '#1D4ED8' }}>المساعد يفكّر</span>
        {[0, 1, 2].map((i) => (
          <span key={i} className="studio-dot size-1.5 rounded-full" style={{ backgroundColor: '#2563EB', animationDelay: `${i * 160}ms` }} />
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

export default function Dashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const account = useAccount();
  const logout = useLogout();
  const saveSite = useSaveSite();
  const deleteSite = useDeleteSite();
  const activeAccount = account.data || getLocalAccount();

  const sites = useMemo(
    () => (activeAccount?.websites?.length ? activeAccount.websites : activeAccount?.website ? [activeAccount.website] : []),
    [activeAccount],
  );

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [previewUser, setPreviewUser] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [input, setInput] = useState('');
  const [hydrateTick, setHydrateTick] = useState(0);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const msg = useCallback((role: Msg['role'], text: string, chips?: Chip[]): Msg => ({ id: idRef.current++, role, text, chips }), []);

  const patch = useCallback((key: string, fn: (s: Session) => Session) => {
    setSessions((prev) => ({ ...prev, [key]: fn(prev[key] ?? emptySession()) }));
  }, []);

  useEffect(() => {
    if (!account.isLoading && !activeAccount) navigate('/login', { replace: true });
  }, [account.isLoading, activeAccount, navigate]);

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
  // onto the undo stack, so replacing a draft is never destructive.
  const installDraft = useCallback((draft: Draft, intro: Msg[]) => {
    setSessions((prev) => {
      const old = prev[NEW_KEY];
      return {
        ...prev,
        [NEW_KEY]: {
          draft,
          baseline: null,
          version: '',
          messages: intro,
          history: old?.draft ? [...old.history, old.draft].slice(-30) : [],
          flash: [],
        },
      };
    });
    setActiveKey(NEW_KEY);
  }, []);

  const startDraft = useCallback(
    (templateId: string, siteName?: string) => {
      const tpl = getTemplate(templateId);
      installDraft(newDraft(templateId, { siteName }), [
        msg('bot', `جهّزت لك «${tpl.label}» بمحتوى مبدئي. انقر على أي نص في البطاقة لتعديله، أو اكتب طلبك في الأسفل.`),
        msg('bot', 'تريد محتوى جاهزاً لنشاطك؟ اكتب وصفاً مثل «مطعم شاورما اسمه الشام» وسيكتبه لك المساعد الذكي.'),
      ]);
    },
    [installDraft, msg],
  );

  // First load: pick the service to show (or the create flow for new accounts).
  useEffect(() => {
    if (!activeAccount || activeKey !== null) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === '1') {
      const wanted = params.get('template');
      if (wanted && TEMPLATES.some((t) => t.id === wanted)) startDraft(wanted);
      else openNew();
      return;
    }
    const remembered = getActiveSiteUsername();
    const pick = sites.find((s) => s.username === remembered)?.username ?? sites[0]?.username;
    if (pick) {
      setActiveSiteUsername(pick);
      setActiveKey(pick);
    } else {
      openNew();
    }
  }, [activeAccount, activeKey, sites, openNew, startDraft]);

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
            : [msg('bot', 'أهلاً بك! يمكنك النقر مباشرة على أي عنصر في البطاقة لتعديله، أو كتابة طلبك في الأسفل.')],
        },
      };
    });
  }, [doc.data, activeKey, hydrateTick, msg]);

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
        });
        void queryClient.invalidateQueries({ queryKey: accountQueryKey });
        if (res.create) {
          installDraft(draftFromCreate(res.create), [
            msg('bot', res.reply || `جهّزت لك «${res.create.siteName}». راجع المحتوى وعدّل ما تريد بالنقر، ثم انشر.`),
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
    [installDraft, msg, patch, push, queryClient],
  );

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
          startDraft(a.id);
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
    [activeKey, patch, queryClient, runAction, send, startDraft, undo],
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

  const doLogout = () => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) });

  // Keep the newest message in view while there is no card (create flow).
  useEffect(() => {
    if (!draft) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [session?.messages.length, draft]);

  // --- Render ------------------------------------------------------------------

  if (account.isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center" style={{ backgroundColor: '#F8FAFC' }} dir="rtl">
        <Loader2 className="animate-spin" size={28} style={{ color: '#2563EB' }} />
      </div>
    );
  }
  if (!activeAccount) return null;

  const messages = session?.messages ?? [];
  const lastBotIndex = [...messages].map((m) => m.role).lastIndexOf('bot');
  const lastBot = lastBotIndex > 0 ? messages[lastBotIndex] : undefined;
  const lastUser = lastBotIndex > 0 && messages[lastBotIndex - 1]?.role === 'user' ? messages[lastBotIndex - 1] : undefined;
  const tpl = draft ? getTemplate(draft.templateId) : null;

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
    ...sites.map((s) => ({ key: s.username, label: `${s.siteName} - ${getTemplate(s.templateId).label}` })),
    // Just-published service whose account refetch hasn't landed yet.
    ...(activeKey && activeKey !== NEW_KEY && draft && tpl && !sites.some((s) => s.username === activeKey)
      ? [{ key: activeKey, label: `${draft.siteName} - ${tpl.label}` }]
      : []),
    ...(activeKey === NEW_KEY ? [{ key: NEW_KEY, label: 'خدمة جديدة' }] : []),
  ];

  return (
    <div dir="rtl" className="flex h-[100dvh] flex-col font-sans" style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}>
      {/* Header */}
      <header className="z-30 border-b bg-white" style={{ borderColor: '#E2E8F0' }}>
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-2 px-4">
          <Brand href="/" />
          <div className="ms-auto flex items-center gap-2">
            <button
              type="button"
              onClick={openNew}
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.8)] hover:bg-[#1D4ED8]"
              style={{ backgroundColor: '#2563EB' }}
              data-testid="button-new-service"
            >
              <Plus size={15} />
              إنشاء خدمة جديدة
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-label="الحساب"
                className="grid size-10 place-items-center rounded-full font-mono text-xs font-black text-white"
                style={{ backgroundColor: '#0F172A' }}
              >
                {activeAccount.phoneNumber.slice(-2)}
              </button>
              {menuOpen && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-56 rounded-2xl border bg-white p-2 shadow-xl" style={{ borderColor: '#E2E8F0' }}>
                  <p dir="ltr" className="px-3 py-2 text-right font-mono text-xs font-bold" style={{ color: '#64748B' }}>
                    +{activeAccount.phoneNumber}
                  </p>
                  <p className="px-3 pb-2 text-xs font-bold" style={{ color: '#0F172A' }}>
                    رصيد المساعد الذكي:{' '}
                    <span style={{ color: '#2563EB' }}>
                      {Math.max(0, activeAccount.freeMessagesLimit - activeAccount.freeMessagesUsed)} رسالة
                    </span>
                  </p>
                  <Link href="/" className="block rounded-xl px-3 py-2 text-xs font-bold hover:bg-[#F1F5F9]">
                    الصفحة الرئيسية للمنصة
                  </Link>
                  <button type="button" onClick={doLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#BE123C] hover:bg-[#FEF2F2]">
                    <LogOut size={14} />
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Service context switcher */}
        {tabs.length > 0 && (
          <nav aria-label="خدماتي" className="border-t" style={{ borderColor: '#F1F5F9' }}>
            <div className="mx-auto max-w-2xl">
              <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5">
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
                        className="relative inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[13px] font-bold transition-colors"
                        style={active ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' } : { backgroundColor: '#FFFFFF', color: '#0F172A', borderColor: '#CBD5E1' }}
                      >
                        {t.label}
                        {unsaved && <span className="size-1.5 rounded-full" style={{ backgroundColor: '#F59E0B' }} aria-label="غير محفوظ" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        )}
      </header>

      {/* Conversation + live canvas */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-5">
          {!session || (!draft && activeKey !== NEW_KEY) ? (
            <div className="flex items-center justify-center py-16" aria-live="polite">
              <Loader2 className="animate-spin" size={24} style={{ color: '#2563EB' }} />
            </div>
          ) : !draft ? (
            <>
              {messages.map((m) => <Bubble key={m.id} msg={m} onPick={onChip} grid />)}
              {session.thinking && <Typing />}
            </>
          ) : (
            <>
              {messages[0] && <Bubble msg={{ ...messages[0], chips: undefined }} onPick={onChip} />}
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
                onNotice={(text) => activeKey && push(activeKey, msg('bot', text))}
              />
            </>
          )}
        </div>
      </div>

      {/* Dock: latest reply, quick actions, minimal input */}
      <div className="z-20 border-t bg-white" style={{ borderColor: '#E2E8F0', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto w-full max-w-2xl">
          {draft && lastBot && (
            <div className="space-y-1.5 px-4 pt-3" aria-live="polite">
              {lastUser && (
                <p className="truncate text-end text-[11px] font-bold" style={{ color: '#64748B' }}>
                  {lastUser.text}
                </p>
              )}
              <Bubble msg={lastBot} onPick={onChip} />
            </div>
          )}
          {session?.thinking && draft && (
            <div className="px-4 pt-3">
              <Typing />
            </div>
          )}
          {quickChips.length > 0 && (
            <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 pt-3">
              {quickChips.map((c) => (
                <li key={c.label} className="shrink-0">
                  <ChipButton chip={c} onPick={onQuickChip} />
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={submit} className="flex items-center gap-2 px-4 pb-3 pt-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={draft ? 'اكتب ما تريد تعديله أو إضافته...' : 'اكتب ما تريد إنشاءه... مثل: أبغى أسوي منيو لمطعمي'}
              aria-label="اكتب طلبك"
              enterKeyHint="send"
              autoComplete="off"
              className="h-12 min-w-0 flex-1 rounded-2xl border bg-white px-4 text-sm font-semibold outline-none placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
              style={{ borderColor: '#CBD5E1', color: '#0F172A' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || !!session?.thinking}
              aria-label="إرسال"
              className="grid size-12 shrink-0 place-items-center rounded-2xl text-white disabled:opacity-40"
              style={{ backgroundColor: '#2563EB' }}
            >
              <ArrowLeft size={20} />
            </button>
          </form>
        </div>
      </div>

      {previewUser && <PreviewSheet username={previewUser} onClose={() => setPreviewUser(null)} />}
      {justSaved && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold text-white shadow-lg" style={{ backgroundColor: '#0F172A' }}>
            <Check size={14} style={{ color: '#34D399' }} />
            تم الحفظ
          </span>
        </div>
      )}
    </div>
  );
}
