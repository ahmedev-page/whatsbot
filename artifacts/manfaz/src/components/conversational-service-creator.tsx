import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Layers,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Palette,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Rocket,
  Send,
  Settings,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Type,
  User,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import SiteEditor from '@/pages/site-editor';
import {
  accountQueryKey,
  applyAssistantResolutionToLocalSite,
  createWebsiteInPlatform,
  getLocalAccount,
  setActiveSiteUsername,
  siteQueryKey,
  siteUrl,
  slugifyUsername,
  useAccountMessages,
  useSaveSite,
  useSendAssistantCommand,
  useSiteDocument,
  type Account,
  type AccountWebsite,
  type InitialCollectionItemInput,
  type SiteDocument,
  type SiteStyle,
} from '@/lib/account';
import {
  CHAT_COLOR_SWATCHES,
  CONVERSATION_SERVICE_OPTIONS,
  STUDIO_PANEL_META,
  analyzeUserProjectRequest,
  buildCreateInPlatformPayload,
  canCreateServiceWithTemplate,
  computeServiceQuotaStatus,
  getConversationalServiceOption,
  getDynamicCreationSteps,
  getNextCreationStep,
  getPrevCreationStep,
  getServiceCategoryLabel,
  getStepLabelForTemplate,
  isValidServiceTemplateId,
  parseSmartChatInput,
  parseStudioEditCommand,
  resolveMultiServiceCommand,
  type AssistantServiceSummary,
  type CreationStepId,
  type PendingAssistantDisambiguation,
  type StudioActivePanel,
  type TemplateVisualCardSpec,
} from '@/lib/conversational-creator';

interface StudioChatTurnMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  disambiguationCandidates?: AssistantServiceSummary[];
  resolvedService?: AssistantServiceSummary;
}

const SERVICE_ICONS: Record<string, LucideIcon> = {
  store: Store,
  restaurant: UtensilsCrossed,
  services: Globe,
  portfolio: Sparkles,
  vcard: User,
  survey: ClipboardList,
  booking: CalendarCheck,
  rsvp: CalendarDays,
  invoice: Briefcase,
};

const TEMPLATE_NAMES: Record<string, string> = {
  store: 'متجر إلكتروني',
  restaurant: 'مطعم ومقهى',
  services: 'شركة وخدمات',
  portfolio: 'صفحة شخصية وأعمال',
  vcard: 'بطاقة رقمية وروابط',
  survey: 'استبيان واستطلاع رأي',
  booking: 'حجز مواعيد',
  rsvp: 'دعوة وتأكيد حضور',
  invoice: 'باقات وعروض أسعار',
};

const STYLE_LABELS: Record<SiteStyle, string> = {
  classic: 'كلاسيكي أنيق (Classic)',
  modern: 'عصري فائق (Modern)',
  cinematic: 'سينمائي فاخر (Cinematic)',
  app: 'تطبيق جوال (App UI)',
};

const SURVEY_QUESTION_TYPE_OPTIONS = [
  { value: 'rating', label: 'تقييم بالنجوم (1 - 5)' },
  { value: 'choice', label: 'اختيار واحد من متعدد' },
  { value: 'multi', label: 'اختيار متعدد' },
  { value: 'yesno', label: 'نعم / لا / ربما' },
  { value: 'nps', label: 'مقياس رقمي (1 - 10)' },
  { value: 'text', label: 'إجابة نصية مفتوحة' },
];

function timeGreeting(): string {
  return new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير';
}

// ---------------------------------------------------------------------------
// 1. Compact Circular Bot Avatar (Opaque, Crisp, Zero Blur Overlap)
// ---------------------------------------------------------------------------
function MiniBotAvatar({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: '9999px',
        backgroundColor: '#13285C',
        borderColor: '#38BDF8',
      }}
      className="relative flex items-center justify-center border shrink-0 select-none"
      aria-hidden
    >
      <svg viewBox="0 0 48 48" width={Math.round(size * 0.72)} height={Math.round(size * 0.72)} fill="none">
        <rect
          x="7"
          y="10"
          width="34"
          height="26"
          rx="13"
          fill="#E2E8F0"
          stroke="#60A5FA"
          strokeWidth="1.4"
        />
        <rect x="11" y="15" width="26" height="16" rx="8" fill="#061029" />
        <path
          d="M 15.5 22.5 Q 18.5 19 21.5 22.5"
          stroke="#38BDF8"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M 26.5 22.5 Q 29.5 19 32.5 22.5"
          stroke="#38BDF8"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M 21.5 26.5 Q 24 28.8 26.5 26.5"
          stroke="#38BDF8"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Visual Template Preview Card Artwork (Opaque Solid Surfaces)
// ---------------------------------------------------------------------------
function TemplateVisualPreviewCard({
  card,
  selected,
  siteName,
  themeColor,
  onSelect,
}: {
  card: TemplateVisualCardSpec;
  selected: boolean;
  siteName: string;
  themeColor: string;
  onSelect: () => void;
}) {
  const displayHeadline = siteName.trim()
    ? `${siteName.trim()}\n${card.previewHeadlineEn.split('\n')[1] || ''}`
    : card.previewHeadlineEn;

  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`template-style-card-${card.style}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        padding: '7px',
        backgroundColor: selected ? '#132A63' : '#0B1633',
        borderColor: selected ? '#38BDF8' : '#1E3A6E',
        borderWidth: selected ? '2px' : '1px',
      }}
      className="group relative w-full cursor-pointer text-center transition-colors duration-200 hover:border-sky-400 focus:outline-none"
    >
      {selected && (
        <span
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '24px',
            height: '24px',
            borderRadius: '9999px',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            zIndex: 10,
          }}
          className="flex items-center justify-center border border-sky-300"
        >
          <Check size={14} strokeWidth={3} />
        </span>
      )}

      <div
        dir="ltr"
        style={{
          backgroundColor: card.surfaceBg,
          borderRadius: '11px',
          overflow: 'hidden',
          border: '1px solid rgba(148, 163, 184, 0.25)',
        }}
        className="relative w-full text-left"
      >
        <div
          style={{
            backgroundColor: card.isDarkPreview ? '#0F172A' : '#E2E8F0',
            padding: '4px 7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="flex items-center gap-1">
            <span className="inline-block size-1.5 rounded-full bg-slate-400" />
            <span className="inline-block size-1.5 rounded-full bg-slate-400" />
            <span className="inline-block size-1.5 rounded-full bg-slate-400" />
          </div>
          <div
            style={{
              height: '4px',
              width: '32px',
              borderRadius: '99px',
              backgroundColor: card.textPrimary,
              opacity: 0.3,
            }}
          />
          <span
            style={{
              height: '4px',
              width: '10px',
              borderRadius: '99px',
              backgroundColor: card.textPrimary,
              opacity: 0.3,
            }}
          />
        </div>

        <div
          style={{
            padding: '8px 9px',
            display: 'grid',
            gridTemplateColumns: '58% 42%',
            alignItems: 'center',
            gap: '4px',
            minHeight: '76px',
          }}
        >
          <div className="min-w-0">
            <p
              style={{
                color: card.textPrimary,
                fontSize: 'clamp(8.5px, 1.7vw, 10.5px)',
                lineHeight: 1.2,
                fontWeight: 800,
              }}
              className="whitespace-pre-line break-words"
            >
              {displayHeadline}
            </p>
            <p
              style={{
                color: card.textPrimary,
                opacity: 0.72,
                fontSize: '7px',
                marginTop: '2px',
              }}
              className="truncate"
            >
              {card.previewSubEn}
            </p>
            <span
              style={{
                display: 'inline-block',
                marginTop: '5px',
                padding: '2px 6px',
                borderRadius: '999px',
                backgroundColor: selected ? themeColor : card.accentColor,
                color: '#FFFFFF',
                fontSize: '6.5px',
                fontWeight: 700,
              }}
            >
              {card.badge}
            </span>
          </div>

          <div className="flex items-center justify-center">
            <svg viewBox="0 0 80 72" className="w-full max-w-[58px] h-auto" fill="none">
              <rect
                x="14"
                y="14"
                width="52"
                height="44"
                rx="10"
                fill={card.cardBg}
                stroke={selected ? themeColor : card.accentColor}
                strokeWidth="2"
              />
              <rect
                x="22"
                y="22"
                width="24"
                height="6"
                rx="3"
                fill={selected ? themeColor : card.accentColor}
              />
              <rect
                x="22"
                y="32"
                width="36"
                height="4"
                rx="2"
                fill={card.textPrimary}
                opacity="0.35"
              />
              <rect
                x="22"
                y="40"
                width="28"
                height="4"
                rx="2"
                fill={card.textPrimary}
                opacity="0.25"
              />
            </svg>
          </div>
        </div>

        <div
          style={{
            backgroundColor: card.cardBg,
            padding: '5px 7px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '4px',
          }}
        >
          {[0, 1, 2, 3].map((itemIdx) => (
            <div
              key={itemIdx}
              style={{
                backgroundColor: card.isDarkPreview ? '#1E293B' : '#F1F5F9',
                borderRadius: '5px',
                padding: '3px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  backgroundColor: selected ? themeColor : card.accentColor,
                  display: 'block',
                }}
              />
              <span
                style={{
                  width: '100%',
                  height: '2px',
                  borderRadius: '99px',
                  backgroundColor: card.textPrimary,
                  opacity: 0.3,
                  marginTop: '3px',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 pb-0.5">
        <p
          style={{
            color: '#FFFFFF',
            fontSize: 'clamp(10.5px, 2.2vw, 13px)',
          }}
          className="font-extrabold tracking-tight truncate"
        >
          {card.title}
        </p>
        <p className="text-[10px] font-bold text-sky-300 truncate">{card.badge}</p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// 3. Copy Link Button Inside Studio Chat
// ---------------------------------------------------------------------------
function StudioCopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        if (navigator.clipboard) {
          void navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }
      }}
      data-testid="button-copy-site-link"
      style={{
        borderRadius: '10px',
        padding: '6px 12px',
        backgroundColor: '#0F1E42',
        borderColor: '#2563EB',
        color: '#E0F2FE',
        fontSize: '11.5px',
      }}
      className="inline-flex items-center gap-1.5 border font-bold transition hover:border-sky-400"
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-sky-400" />}
      <span>{copied ? 'تم نسخ الرابط' : 'نسخ الرابط'}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// 4. Completed Step Conversational Pair (Solid Opaque Bubbles, No Blur)
// ---------------------------------------------------------------------------
function CompletedStepTurn({
  botQuestion,
  userAnswer,
  onEdit,
  stepTestId,
}: {
  botQuestion: string;
  userAnswer: string;
  onEdit: () => void;
  stepTestId: string;
}) {
  return (
    <div
      style={{
        borderRadius: '14px',
        padding: '8px 12px',
        backgroundColor: '#09132B',
        borderColor: '#1E3A6E',
      }}
      className="flex flex-nowrap items-center justify-between gap-2 border"
      data-testid={stepTestId}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          style={{
            width: '24px',
            height: '24px',
            minWidth: '24px',
            borderRadius: '9999px',
            backgroundColor: '#059669',
            color: '#FFFFFF',
          }}
          className="flex items-center justify-center shrink-0"
        >
          <Check size={13} strokeWidth={3} />
        </span>
        <div className="min-w-0 text-right">
          <p className="text-[11px] font-bold text-slate-400 truncate">{botQuestion}</p>
          <p className="text-xs font-extrabold text-white truncate">{userAnswer}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        style={{
          borderRadius: '8px',
          padding: '4px 10px',
          backgroundColor: '#13285C',
          borderColor: '#2563EB',
          color: '#E0F2FE',
          fontSize: '11px',
        }}
        className="shrink-0 border font-bold hover:border-sky-400 hover:text-white"
      >
        تعديل
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Post-Publish Conversational Service Hub (Phase 2)
//    - Conversational Hub by default (No full dashboard or all tools at once!)
//    - Opens ONLY the requested part (template, colors, products, content, contact, preview, results, settings)
//    - Returns smoothly to the conversation after finishing/saving
// ---------------------------------------------------------------------------
function IndependentServiceChatContext({
  serviceUsername,
  serviceSummary,
  activePanel,
  onSelectPanel,
  serviceMessages,
  onAppendServiceMessage,
  onSelectDisambiguatedService,
  onDeleted,
}: {
  serviceUsername: string;
  serviceSummary: AccountWebsite;
  activePanel: StudioActivePanel | null;
  onSelectPanel: (panel: StudioActivePanel | null) => void;
  serviceMessages: StudioChatTurnMessage[];
  onAppendServiceMessage: (...msgs: StudioChatTurnMessage[]) => void;
  onSelectDisambiguatedService?: (service: AssistantServiceSummary) => void;
  onDeleted: () => void;
}) {
  const siteQuery = useSiteDocument(serviceUsername);
  const saveMutation = useSaveSite();
  const [showAllPreviewModal, setShowAllPreviewModal] = useState(false);
  const [iframeEpoch, setIframeEpoch] = useState(() => Date.now());

  const doc = siteQuery.data;
  const templateId = doc?.templateId || serviceSummary.templateId || 'store';
  const serviceOpt = getConversationalServiceOption(templateId);
  const ServiceIcon = SERVICE_ICONS[templateId] || Globe;
  const currentStyle = ((doc?.jsonStructure?.templateStyle as SiteStyle) ||
    (serviceSummary.templateStyle as SiteStyle) ||
    'modern') as SiteStyle;
  const currentThemeColor = doc?.themeColor || serviceSummary.themeColor || '#1D4ED8';
  const currentDarkMode = Boolean(doc?.jsonStructure?.darkMode);
  const publicUrl = siteUrl(serviceUsername);

  const collectionKey = doc?.collectionKey || 'items';
  const publishedItemsCount = Array.isArray(doc?.jsonStructure?.[collectionKey])
    ? (doc!.jsonStructure[collectionKey] as unknown[]).length
    : 0;
  const submissionsCount = Array.isArray(doc?.jsonStructure?.submissions)
    ? (doc!.jsonStructure.submissions as unknown[]).length
    : serviceSummary.submissionsCount ?? 0;

  const handleOpenFocusedPanel = (panel: StudioActivePanel, userIntentText: string) => {
    const meta = STUDIO_PANEL_META[panel];
    onAppendServiceMessage(
      { id: `u-act-${Date.now()}`, sender: 'user', text: userIntentText },
      {
        id: `b-act-${Date.now() + 1}`,
        sender: 'bot',
        text: `تفضل واجهة «${meta.title}» الخاصة بـ «${
          doc?.siteName || serviceSummary.siteName
        }». بعد الانتهاء اضغط حفظ والعودة للمحادثة:`,
      }
    );
    onSelectPanel(panel);
  };

  const handleReturnFromFocusedPanel = (savedSectionLabel?: string) => {
    onSelectPanel(null);
    void siteQuery.refetch();
    setIframeEpoch(Date.now());
    if (savedSectionLabel) {
      onAppendServiceMessage({
        id: `b-saved-${Date.now()}`,
        sender: 'bot',
        text: `✅ تم حفظ تعديلات «${savedSectionLabel}» بنجاح! عدنا إلى محادثة الخدمة — اختر أي جزء آخر لتعديله أو اكتب طلبك في الشات.`,
      });
    }
  };

  const handleQuickStyleSave = (nextStyle: SiteStyle, andReturn = false) => {
    if (!doc) return;
    const nextStructure = {
      ...doc.jsonStructure,
      templateStyle: nextStyle,
      darkMode: nextStyle === 'cinematic' ? true : currentDarkMode,
    };
    saveMutation.mutate(
      {
        id: doc.id,
        baseUpdatedAt: doc.updatedAt,
        username: doc.username,
        siteName: doc.siteName,
        templateId: doc.templateId,
        themeColor: doc.themeColor,
        jsonStructure: nextStructure,
      },
      {
        onSuccess: () => {
          void siteQuery.refetch();
          setIframeEpoch(Date.now());
          if (andReturn) {
            handleReturnFromFocusedPanel('القالب والمظهر');
          }
        },
      }
    );
  };

  const ACTION_CARDS: Array<{
    panel: StudioActivePanel;
    icon: LucideIcon;
    title: string;
    subtitle: string;
    userPhrase: string;
    accent: string;
    testId: string;
    legacyTestId?: string;
  }> = [
    {
      panel: 'template',
      icon: Layers,
      title: 'القالب والمظهر',
      subtitle: STYLE_LABELS[currentStyle],
      userPhrase: 'أريد تعديل القالب والمظهر',
      accent: '#38BDF8',
      testId: 'action-panel-template',
    },
    {
      panel: 'colors',
      icon: Palette,
      title: 'الألوان والشعار والغلاف',
      subtitle: 'لون الهوية، الوضع الداكن، والشعار',
      userPhrase: 'أريد تعديل الألوان والشعار',
      accent: '#A78BFA',
      testId: 'action-panel-colors',
    },
    {
      panel: 'products',
      icon: ShoppingBag,
      title: `المنتجات والعناصر (${publishedItemsCount})`,
      subtitle: `إدارة وترتيب وإضافة ${serviceOpt.itemNoun}`,
      userPhrase: `أريد إدارة المنتجات والعناصر (${serviceOpt.itemNoun})`,
      accent: '#34D399',
      testId: 'action-panel-products',
      legacyTestId: 'link-edit-site',
    },
    {
      panel: 'content',
      icon: Type,
      title: 'النصوص والمحتوى والأقسام',
      subtitle: 'العناوين، النبذة، الفريق، الآراء، والأسئلة الشائعة',
      userPhrase: 'أريد تعديل النصوص والمحتوى',
      accent: '#60A5FA',
      testId: 'action-panel-content',
    },
    {
      panel: 'contact',
      icon: Phone,
      title: 'التواصل وساعات العمل',
      subtitle: 'الجوال، واتساب، العنوان، وأوقات الدوام',
      userPhrase: 'أريد تعديل بيانات التواصل وساعات العمل',
      accent: '#FBBF24',
      testId: 'action-panel-contact',
    },
    {
      panel: 'preview',
      icon: Smartphone,
      title: 'المعاينة الحية والنشر',
      subtitle: 'تفاعل مع الخدمة مباشرة وشارك الرابط',
      userPhrase: 'أريد عرض المعاينة الحية للخدمة',
      accent: '#38BDF8',
      testId: 'action-panel-preview',
    },
    {
      panel: 'results',
      icon: BarChart3,
      title: `النتائج والردود (${submissionsCount})`,
      subtitle: `زيارات اليوم: ${serviceSummary.visitsToday ?? 0} · الإجمالي: ${
        serviceSummary.visitsTotal ?? 0
      }`,
      userPhrase: 'أريد عرض النتائج والردود والإحصائيات',
      accent: '#10B981',
      testId: 'action-panel-results',
      legacyTestId: `link-results-site-${serviceUsername}`,
    },
    {
      panel: 'settings',
      icon: Settings,
      title: 'الإعدادات والرابط المخصص',
      subtitle: 'تغيير الرابط (Username) أو حذف الخدمة',
      userPhrase: 'أريد فتح إعدادات الخدمة والرابط',
      accent: '#F43F5E',
      testId: 'action-panel-settings',
    },
  ];

  return (
    <div
      className="space-y-3"
      data-testid={`independent-service-context-${serviceUsername}`}
    >
      {/* 1. Bot Service Header & Live Status Card */}
      <section
        style={{
          borderRadius: '18px',
          padding: '14px',
          backgroundColor: '#0A1530',
          borderColor: '#1E3A6E',
        }}
        className="border text-right space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: currentThemeColor,
                color: '#FFFFFF',
              }}
              className="flex items-center justify-center shrink-0"
            >
              <ServiceIcon size={18} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white" data-testid="text-site-name">
                  {doc?.siteName || serviceSummary.siteName}
                </h2>
                <span
                  style={{
                    borderRadius: '9999px',
                    padding: '2px 9px',
                    backgroundColor: '#13285C',
                    borderColor: '#2563EB',
                    color: '#38BDF8',
                    fontSize: '10.5px',
                  }}
                  className="border font-extrabold"
                >
                  {getServiceCategoryLabel(templateId)} · {TEMPLATE_NAMES[templateId] ?? templateId}
                </span>
                <span className="text-[11px] font-extrabold text-emerald-400">
                  ● منشور ومفعّل
                </span>
              </div>
              <p dir="ltr" className="mt-0.5 text-right font-mono text-[11px] font-bold text-sky-300 truncate">
                {publicUrl}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                activePanel === 'preview'
                  ? onSelectPanel(null)
                  : handleOpenFocusedPanel('preview', 'أريد عرض المعاينة الحية للخدمة')
              }
              data-testid="button-service-chat-live-preview"
              style={{
                borderRadius: '10px',
                padding: '6px 12px',
                backgroundColor: activePanel === 'preview' ? '#0284C7' : '#0F1E42',
                borderColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '11.5px',
              }}
              className="inline-flex items-center gap-1.5 border font-extrabold transition hover:border-sky-400"
            >
              <Smartphone size={13} className="text-sky-300" />
              <span>{activePanel === 'preview' ? 'إغلاق المعاينة' : 'المعاينة الحية'}</span>
            </button>

            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              data-testid="link-open-site"
              style={{
                borderRadius: '10px',
                padding: '6px 12px',
                backgroundColor: '#1D4ED8',
                color: '#FFFFFF',
                fontSize: '11.5px',
              }}
              className="inline-flex items-center gap-1.5 font-extrabold transition hover:bg-blue-600"
            >
              <ExternalLink size={13} />
              <span>فتح الرابط العام</span>
            </a>

            <StudioCopyLinkButton url={publicUrl} />
          </div>
        </div>

        {/* Real Service Counters */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div
            style={{
              borderRadius: '10px',
              padding: '7px 10px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border"
          >
            <p className="font-mono text-sm sm:text-base font-black text-white">
              {serviceSummary.visitsToday ?? 0}
            </p>
            <p className="text-[10px] font-bold text-slate-300">زيارات اليوم</p>
          </div>
          <div
            style={{
              borderRadius: '10px',
              padding: '7px 10px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border"
          >
            <p className="font-mono text-sm sm:text-base font-black text-white">
              {serviceSummary.visitsTotal ?? 0}
            </p>
            <p className="text-[10px] font-bold text-slate-300">إجمالي الزيارات</p>
          </div>
          <div
            style={{
              borderRadius: '10px',
              padding: '7px 10px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border"
          >
            <p className="font-mono text-sm sm:text-base font-black text-sky-300">
              {publishedItemsCount}
            </p>
            <p className="text-[10px] font-bold text-slate-300">
              العناصر المنشورة ({serviceOpt.itemNoun})
            </p>
          </div>
          <div
            style={{
              borderRadius: '10px',
              padding: '7px 10px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border"
          >
            <p className="font-mono text-sm sm:text-base font-black text-emerald-400">
              {submissionsCount}
            </p>
            <p className="text-[10px] font-bold text-slate-300">النتائج والردود</p>
          </div>
        </div>
      </section>

      {/* 2. Conversation Turns History for This Specific Service */}
      {serviceMessages.map((msg) =>
        msg.sender === 'user' ? (
          <div
            key={msg.id}
            className="flex items-center justify-start gap-2.5"
          >
            <span
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '9999px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
              }}
              className="flex items-center justify-center shrink-0"
            >
              <User size={15} />
            </span>
            <div
              style={{
                borderRadius: '14px',
                padding: '7px 14px',
                backgroundColor: '#1D4ED8',
                color: '#FFFFFF',
                fontSize: '12px',
              }}
              className="font-bold"
            >
              {msg.text}
            </div>
          </div>
        ) : (
          <div
            key={msg.id}
            dir="ltr"
            className="flex items-start justify-start gap-2.5"
          >
            <MiniBotAvatar size={32} />
            <div
              dir="rtl"
              style={{
                borderRadius: '14px',
                padding: '8px 13px',
                backgroundColor: '#0D1B3E',
                borderColor: '#1E3A6E',
                color: '#E2E8F0',
                fontSize: '12px',
              }}
              className="border font-medium whitespace-pre-line text-right space-y-2"
            >
              <p>{msg.text}</p>
              {msg.disambiguationCandidates && msg.disambiguationCandidates.length > 0 && (
                <div
                  className="flex flex-wrap gap-1.5 pt-1"
                  data-testid="studio-disambiguation-choices"
                >
                  {msg.disambiguationCandidates.map((srv) => {
                    const opt = getConversationalServiceOption(srv.templateId);
                    return (
                      <button
                        key={srv.username}
                        type="button"
                        onClick={() => onSelectDisambiguatedService?.(srv)}
                        data-testid={`studio-disambiguate-service-${srv.username}`}
                        style={{
                          borderRadius: '10px',
                          padding: '6px 12px',
                          backgroundColor: '#1D4ED8',
                          borderColor: '#38BDF8',
                          color: '#FFFFFF',
                          fontSize: '11.5px',
                        }}
                        className="inline-flex items-center gap-1.5 border font-extrabold transition hover:bg-blue-600"
                      >
                        <span>{srv.siteName}</span>
                        <span className="rounded-full bg-black/25 px-1.5 py-0.5 text-[10px]">
                          {opt.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* 3. Conversational Action Picker OR Single Focused Panel */}
      {activePanel === null ? (
        <section
          data-testid="service-conversation-actions-hub"
          style={{
            borderRadius: '18px',
            padding: '14px',
            backgroundColor: '#0A1530',
            borderColor: '#1E3A6E',
          }}
          className="border text-right space-y-3"
        >
          <div className="flex items-center gap-2.5">
            <MiniBotAvatar size={32} />
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-white">
                ماذا ترغب أن نعدل أو نعرض في «{doc?.siteName || serviceSummary.siteName}» الآن؟
              </h3>
              <p className="text-[11px] font-medium text-slate-300">
                اختر الجزء المطلوب من البطاقات أدناه أو اكتب طلبك في الشات بالأسفل، وستظهر واجهة هذا الجزء فقط:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ACTION_CARDS.map((card) => {
              const CardIcon = card.icon;
              return (
                <button
                  key={card.panel}
                  type="button"
                  onClick={() => handleOpenFocusedPanel(card.panel, card.userPhrase)}
                  data-testid={card.testId}
                  style={{
                    borderRadius: '14px',
                    padding: '10px 12px',
                    backgroundColor: '#070F24',
                    borderColor: '#172E5C',
                  }}
                  className="group flex items-center justify-between gap-2.5 border text-right transition-colors hover:border-sky-400 hover:bg-[#0D1A3B]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        backgroundColor: '#0F1E42',
                        borderColor: '#1E3A6E',
                        color: card.accent,
                      }}
                      className="flex items-center justify-center border shrink-0"
                    >
                      <CardIcon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p
                        className="truncate text-xs font-black text-white"
                        data-testid={card.legacyTestId}
                      >
                        {card.title}
                      </p>
                      <p className="truncate text-[10.5px] font-medium text-slate-400">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowLeft
                    size={14}
                    className="shrink-0 text-slate-400 transition-transform group-hover:-translate-x-1 group-hover:text-sky-400"
                  />
                </button>
              );
            })}
          </div>
        </section>
      ) : activePanel === 'template' ? (
        <section
          data-testid="focused-panel-template"
          style={{
            borderRadius: '18px',
            padding: '14px',
            backgroundColor: '#0A1530',
            borderColor: '#2563EB',
          }}
          className="border text-right space-y-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white">
                تعديل القالب ونمط العرض لـ «{doc?.siteName || serviceSummary.siteName}»
              </h3>
              <p className="text-[11px] font-medium text-slate-300">
                اختر القالب المرئي المفضل، وسيتم حفظه فوراً والعودة للمحادثة.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAllPreviewModal(true)}
                style={{
                  borderRadius: '10px',
                  padding: '5px 11px',
                  backgroundColor: '#13285C',
                  borderColor: '#2563EB',
                  color: '#38BDF8',
                  fontSize: '11px',
                }}
                className="inline-flex items-center gap-1 border font-extrabold"
              >
                <Sparkles size={12} />
                <span>معاينة الكل</span>
              </button>
              <button
                type="button"
                onClick={() => handleReturnFromFocusedPanel()}
                data-testid="button-return-to-service-chat"
                style={{
                  borderRadius: '10px',
                  padding: '5px 12px',
                  backgroundColor: '#1E293B',
                  borderColor: '#334155',
                  color: '#E2E8F0',
                  fontSize: '11.5px',
                }}
                className="inline-flex items-center gap-1 border font-extrabold hover:bg-slate-700"
              >
                <ArrowRight size={13} />
                <span>العودة للمحادثة</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {serviceOpt.visualCards.slice(0, 3).map((card) => (
              <TemplateVisualPreviewCard
                key={card.id}
                card={card}
                selected={currentStyle === card.style}
                siteName={doc?.siteName || serviceSummary.siteName}
                themeColor={currentThemeColor}
                onSelect={() => handleQuickStyleSave(card.style, false)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300">
              النمط المحدد حالياً: <strong className="text-sky-300">{STYLE_LABELS[currentStyle]}</strong>
            </span>
            <button
              type="button"
              onClick={() => handleReturnFromFocusedPanel('القالب والمظهر')}
              data-testid="button-save-template-and-return"
              style={{
                borderRadius: '10px',
                padding: '7px 16px',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                fontSize: '12px',
              }}
              className="inline-flex items-center gap-1.5 font-extrabold hover:bg-emerald-600"
            >
              <Check size={14} />
              <span>اعتماد القالب والعودة للمحادثة</span>
            </button>
          </div>
        </section>
      ) : activePanel === 'preview' ? (
        <section
          data-testid="focused-panel-preview"
          style={{
            borderRadius: '18px',
            padding: '14px',
            backgroundColor: '#0A1530',
            borderColor: '#2563EB',
          }}
          className="border space-y-3.5 text-right"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <p className="text-xs sm:text-sm font-black text-white">
                المعاينة الحية لخدمة «{doc?.siteName || serviceSummary.siteName}»
              </p>
              <p className="text-[11px] text-slate-300">
                تفاعل مع خدمتك المنشورة مباشرة كما يراها الزوار والعملاء
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIframeEpoch(Date.now())}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
              >
                <RefreshCw size={12} /> تحديث المعاينة
              </button>
              <button
                type="button"
                onClick={() => handleReturnFromFocusedPanel()}
                data-testid="button-close-preview-and-return"
                style={{
                  borderRadius: '10px',
                  padding: '5px 12px',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                }}
                className="inline-flex items-center gap-1 font-extrabold hover:bg-emerald-600"
              >
                <ArrowRight size={13} />
                <span>العودة للمحادثة</span>
              </button>
            </div>
          </div>

          <div className="mx-auto h-[520px] w-full max-w-[360px] overflow-hidden rounded-[28px] border-4 border-slate-700 bg-white">
            <iframe
              key={iframeEpoch}
              src={`${publicUrl}?_=${iframeEpoch}`}
              title="معاينة الخدمة الحية"
              className="size-full"
              loading="lazy"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleReturnFromFocusedPanel()}
              style={{
                borderRadius: '10px',
                padding: '7px 14px',
                backgroundColor: '#1E293B',
                color: '#FFFFFF',
                fontSize: '11.5px',
              }}
              className="inline-flex items-center gap-1.5 font-extrabold hover:bg-slate-700"
            >
              <ArrowRight size={13} />
              <span>انتهيت من المعاينة — العودة للمحادثة</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="pt-0.5" data-testid={`focused-service-section-${activePanel}`}>
          <SiteEditor
            forcedUsername={serviceUsername}
            focusedSection={activePanel}
            hideSiteSwitcher={true}
            onBackToChat={handleReturnFromFocusedPanel}
            onDeleted={onDeleted}
          />
        </section>
      )}

      {showAllPreviewModal && (
        <div
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-label="معاينة القوالب"
          style={{ backgroundColor: 'rgba(3, 7, 18, 0.92)' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3"
        >
          <div
            style={{
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              borderRadius: '20px',
              padding: '18px',
              backgroundColor: '#0A1530',
              borderColor: '#2563EB',
              color: '#FFFFFF',
            }}
            className="relative overflow-y-auto border space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                جميع أنماط قالب «{serviceOpt.shortLabel}» لـ {doc?.siteName || serviceSummary.siteName}
              </h3>
              <button
                type="button"
                onClick={() => setShowAllPreviewModal(false)}
                className="flex size-8 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {serviceOpt.visualCards.map((card) => (
                <TemplateVisualPreviewCard
                  key={card.id}
                  card={card}
                  selected={currentStyle === card.style}
                  siteName={doc?.siteName || serviceSummary.siteName}
                  themeColor={currentThemeColor}
                  onSelect={() => {
                    handleQuickStyleSave(card.style, true);
                    setShowAllPreviewModal(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. WhatsApp Companion Card Inside Studio Chat (Multi-Service Aware)
// ---------------------------------------------------------------------------
function StudioWhatsappCompanionCard({
  account,
  botNumber,
  websites = [],
  onOpenService,
  onStartCreateNewService,
}: {
  account?: Account;
  botNumber: string;
  websites?: AccountWebsite[];
  onOpenService?: (username: string) => void;
  onStartCreateNewService?: () => void;
}) {
  const historyQuery = useAccountMessages();
  const sendMutation = useSendAssistantCommand();
  const [localTranscript, setLocalTranscript] = useState<
    Array<{
      sender: 'user' | 'bot';
      text: string;
      time: string;
      disambiguationCandidates?: AssistantServiceSummary[];
      resolvedService?: AssistantServiceSummary;
      isCreateNewService?: boolean;
    }>
  >([]);
  const [pendingContext, setPendingContext] = useState<
    PendingAssistantDisambiguation | undefined
  >(undefined);
  const [input, setInput] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  const serverMessages = (historyQuery.data ?? []).map((msg) => ({
    sender: (msg.direction === 'inbound' ? 'user' : 'bot') as 'user' | 'bot',
    text: msg.content || (msg as unknown as { body?: string }).body || '',
    time: new Intl.DateTimeFormat('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(msg.createdAt)),
  }));

  const allMessages = [...serverMessages, ...localTranscript];

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [allMessages.length]);

  const sendCommand = (text: string) => {
    const clean = text.trim();
    if (!clean || sendMutation.isPending) return;
    const now = new Intl.DateTimeFormat('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    setLocalTranscript((prev) => [...prev, { sender: 'user', text: clean, time: now }]);
    sendMutation.mutate(
      { message: clean, pendingContext },
      {
        onSuccess: (res) => {
          const resolution = res.resolution;
          if (resolution?.status === 'needs_disambiguation') {
            setPendingContext(resolution.pendingContext);
            setLocalTranscript((prev) => [
              ...prev,
              {
                sender: 'bot',
                text: res.reply,
                time: now,
                disambiguationCandidates: resolution.candidateServices,
              },
            ]);
            return;
          }

          if (resolution?.awaitingValueFollowUp && resolution.pendingContext) {
            setPendingContext(resolution.pendingContext);
          } else {
            setPendingContext(undefined);
          }

          setLocalTranscript((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: res.reply,
              time: now,
              resolvedService: resolution?.targetService,
              isCreateNewService: resolution?.status === 'create_new_service',
            },
          ]);
        },
      }
    );
  };

  const cleanBotDigits = botNumber.replace(/[^\d]/g, '') || '966500000000';
  const waDirectUrl = `https://wa.me/${cleanBotDigits}`;

  const quickCommands =
    websites.length > 1
      ? [
          'غيّر أوقات العمل',
          websites.some((w) => w.templateId === 'restaurant')
            ? 'غيّر أوقات العمل في المطعم: يومياً 10ص إلى 12م'
            : `غيّر أوقات العمل في ${websites[0].siteName}: يومياً 9ص إلى 11م`,
          'كم زائر اليوم؟',
        ]
      : ['كم زائر اليوم؟', 'أوقات العمل: السبت - الخميس 9ص إلى 11م'];

  return (
    <div className="space-y-3" data-testid="studio-whatsapp-companion">
      <section
        style={{
          borderRadius: '18px',
          padding: '14px',
          backgroundColor: '#0A1530',
          borderColor: '#1E3A6E',
        }}
        className="border space-y-3.5 text-right"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <h2 className="text-sm sm:text-base font-black text-white">
              مساعد واتساب السريع للتحقق والتعديلات الفورية
            </h2>
            <p className="mt-0.5 text-xs font-medium text-slate-300">
              يتعرف على جميع خدماتك المسجلة ويفصل بين بيانات كل خدمة بدقة تامة قبل تنفيذ أي تعديل.
            </p>
          </div>
          <a
            href={waDirectUrl}
            target="_blank"
            rel="noreferrer"
            data-testid="link-open-whatsapp-bot"
            style={{
              borderRadius: '10px',
              padding: '7px 14px',
              backgroundColor: '#059669',
              color: '#FFFFFF',
              fontSize: '11.5px',
            }}
            className="inline-flex items-center gap-1.5 font-extrabold hover:bg-emerald-600"
          >
            <MessageCircle size={14} />
            <span>فتح محادثة واتساب (+{cleanBotDigits})</span>
          </a>
        </div>

        {/* Connected User Services Strip */}
        {websites.length > 0 && (
          <div
            data-testid="whatsapp-connected-services"
            style={{
              borderRadius: '12px',
              padding: '10px 12px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-sky-300">
                خدماتك المرتبطة بالمساعد السريع وواتساب ({websites.length}):
              </span>
              <span className="text-[10.5px] font-bold text-slate-400">
                حدد اسم الخدمة في رسالتك أو سيخيرك المساعد تلقائياً عند وجود أكثر من خدمة
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {websites.map((site) => {
                const opt = getConversationalServiceOption(site.templateId);
                return (
                  <button
                    key={site.username}
                    type="button"
                    onClick={() => onOpenService?.(site.username)}
                    data-testid={`whatsapp-service-badge-${site.username}`}
                    style={{
                      borderRadius: '10px',
                      padding: '5px 10px',
                      backgroundColor: '#0F1E42',
                      borderColor: '#1E3A6E',
                      color: '#E2E8F0',
                      fontSize: '11px',
                    }}
                    className="inline-flex items-center gap-1.5 border font-bold hover:border-sky-400"
                  >
                    <span className="font-extrabold text-white">{site.siteName}</span>
                    <span className="rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-300">
                      {opt.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-2.5 sm:grid-cols-3">
          <div
            style={{
              borderRadius: '12px',
              padding: '10px 12px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border space-y-1"
          >
            <div className="flex items-center gap-1.5 text-emerald-400">
              <BadgeCheck size={15} />
              <span className="text-xs font-extrabold">1. التحقق الآمن لمرة واحدة</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              يوثّق ملكية رقمك{' '}
              {account?.phoneNumber && account.phoneNumber !== '966500000000'
                ? `(+${account.phoneNumber})`
                : ''}{' '}
              ويحفظ معرّف جهازك للدخول الفوري.
            </p>
          </div>

          <div
            style={{
              borderRadius: '12px',
              padding: '10px 12px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border space-y-1"
          >
            <div className="flex items-center gap-1.5 text-sky-400">
              <Pencil size={15} />
              <span className="text-xs font-extrabold">2. تمييز ذكي بين خدماتك</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              ينفذ الأمر مباشرة إذا ذكرت الخدمة (مثل: غيّر أوقات العمل في المطعم)، أو يسألك لتحديد الخدمة المقصودة.
            </p>
          </div>

          <div
            style={{
              borderRadius: '12px',
              padding: '10px 12px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border space-y-1"
          >
            <div className="flex items-center gap-1.5 text-purple-400">
              <BarChart3 size={15} />
              <span className="text-xs font-extrabold">3. عزل تام لبيانات كل خدمة</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              تعديل أي خدمة لا يؤثر إطلاقاً على بيانات أو إعدادات أو محتوى خدماتك الأخرى.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-extrabold text-sky-300">أوامر استعلام وتحديث سريعة:</p>
          <div className="flex flex-wrap gap-2">
            {quickCommands.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => sendCommand(cmd)}
                style={{
                  borderRadius: '10px',
                  padding: '5px 12px',
                  backgroundColor: '#0F1E42',
                  borderColor: '#2563EB',
                  color: '#E0F2FE',
                  fontSize: '11px',
                }}
                className="border font-bold transition hover:border-sky-400"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {allMessages.length > 0 && (
          <div
            ref={logContainerRef}
            data-testid="whatsapp-messages-log"
            className="max-h-72 space-y-2.5 overflow-y-auto rounded-xl border border-slate-800 bg-[#050B1C] p-3"
          >
            {allMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  style={
                    msg.sender === 'user'
                      ? {
                          borderRadius: '12px',
                          padding: '7px 12px',
                          backgroundColor: '#1D4ED8',
                          color: '#FFFFFF',
                          fontSize: '11.5px',
                        }
                      : {
                          borderRadius: '12px',
                          padding: '8px 12px',
                          backgroundColor: '#0F1E42',
                          borderColor: '#1E3A6E',
                          color: '#E2E8F0',
                          fontSize: '11.5px',
                        }
                  }
                  className="max-w-[90%] border font-medium space-y-2"
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  {msg.disambiguationCandidates && msg.disambiguationCandidates.length > 0 && (
                    <div
                      className="flex flex-wrap gap-1.5 pt-1"
                      data-testid="whatsapp-disambiguation-choices"
                    >
                      {msg.disambiguationCandidates.map((srv) => {
                        const opt = getConversationalServiceOption(srv.templateId);
                        return (
                          <button
                            key={srv.username}
                            type="button"
                            onClick={() => sendCommand(srv.siteName)}
                            data-testid={`whatsapp-disambiguate-service-${srv.username}`}
                            style={{
                              borderRadius: '10px',
                              padding: '5px 11px',
                              backgroundColor: '#059669',
                              borderColor: '#34D399',
                              color: '#FFFFFF',
                              fontSize: '11px',
                            }}
                            className="inline-flex items-center gap-1.5 border font-extrabold transition hover:bg-emerald-600"
                          >
                            <span>{srv.siteName}</span>
                            <span className="rounded-full bg-black/25 px-1.5 py-0.5 text-[9.5px]">
                              {opt.shortLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {msg.isCreateNewService && onStartCreateNewService && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={onStartCreateNewService}
                        data-testid="whatsapp-start-new-service-btn"
                        style={{
                          borderRadius: '10px',
                          padding: '5px 11px',
                          backgroundColor: '#1D4ED8',
                          color: '#FFFFFF',
                          fontSize: '11px',
                        }}
                        className="inline-flex items-center gap-1.5 font-extrabold hover:bg-blue-600"
                      >
                        <Plus size={12} />
                        <span>الانتقال لإنشاء خدمة جديدة مستقلة</span>
                      </button>
                    </div>
                  )}
                  <span className="mt-1 block text-left text-[10px] opacity-70">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            const txt = input.trim();
            setInput('');
            sendCommand(txt);
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            data-testid="input-whatsapp-command"
            placeholder={
              pendingContext
                ? 'اختر الخدمة المطلوبة من الأزرار أعلاه أو اكتب اسمها (مثال: المطعم)...'
                : 'اكتب أمراً للمساعد السريع (مثال: غيّر أوقات العمل في المطعم، أو غيّر أوقات العمل)...'
            }
            style={{
              backgroundColor: '#070F24',
              borderColor: '#1E3A6E',
              color: '#FFFFFF',
            }}
            className="h-9 flex-1 rounded-xl border px-3 text-xs font-bold placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sendMutation.isPending || !input.trim()}
            data-testid="button-send-whatsapp-command"
            style={{
              borderRadius: '10px',
              padding: '0 14px',
              height: '36px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontSize: '11.5px',
            }}
            className="inline-flex items-center gap-1.5 font-extrabold disabled:opacity-50"
          >
            <Send size={13} />
            <span>إرسال</span>
          </button>
        </form>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. Analytics & Account Settings Card Inside Studio Chat (Real Data Only)
// ---------------------------------------------------------------------------
function StudioAnalyticsAndSettingsCard({
  account,
  websites,
  onLogout,
  loggingOut,
  onOpenService,
}: {
  account?: Account;
  websites: AccountWebsite[];
  onLogout?: () => void;
  loggingOut?: boolean;
  onOpenService: (username: string) => void;
}) {
  const siteDoc = useSiteDocument();
  const doc = siteDoc.data;
  const collectionKey = doc?.collectionKey || 'items';
  const rawList = doc?.jsonStructure?.[collectionKey];
  const publishedItemsCount = Array.isArray(rawList) ? rawList.length : 0;

  const visitsToday = websites.reduce((sum, w) => sum + (w.visitsToday ?? 0), 0);
  const visitsTotal = websites.reduce((sum, w) => sum + (w.visitsTotal ?? 0), 0);
  const used = account?.freeMessagesUsed ?? 0;
  const limit = Math.max(1, account?.freeMessagesLimit ?? 40);
  const remainingMessages = Math.max(0, limit - used);
  const quota = computeServiceQuotaStatus(websites);

  return (
    <div className="space-y-3" data-testid="studio-analytics-settings">
      <section
        style={{
          borderRadius: '18px',
          padding: '14px',
          backgroundColor: '#0A1530',
          borderColor: '#1E3A6E',
        }}
        className="border space-y-4 text-right"
      >
        <div>
          <h2 className="text-sm sm:text-base font-black text-white">
            الإحصائيات الفعليّة وحدود الحساب والإعدادات
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-300">
            بيانات حقيقية مسجلة من خدماتك المنشورة دون أي أرقام أو رسائل وهمية.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div
            style={{
              borderRadius: '12px',
              padding: '12px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-extrabold text-sky-300">حد المواقع الرقمية</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                متجر، مطعم، شركة، صفحة شخصية، أو بطاقة رقمية
              </p>
            </div>
            <span className="font-mono text-lg font-black text-white">
              {quota.websiteCount} / {quota.maxWebsites}
            </span>
          </div>
          <div
            style={{
              borderRadius: '12px',
              padding: '12px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-extrabold text-emerald-400">حد الأدوات التفاعلية</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                استبيان، حجز مواعيد، دعوة حضور، أو حاسبة باقات
              </p>
            </div>
            <span className="font-mono text-lg font-black text-white">
              {quota.toolCount} / {quota.maxTools}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div
            style={{
              borderRadius: '12px',
              padding: '12px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border"
          >
            <Eye size={16} className="text-sky-400" />
            <p
              className="mt-1.5 font-mono text-xl font-black text-white"
              data-testid="stat-visits-today"
            >
              {visitsToday}
            </p>
            <p className="text-[11px] font-bold text-slate-300">زيارات اليوم الفعليّة</p>
          </div>

          <div
            style={{
              borderRadius: '12px',
              padding: '12px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border"
          >
            <BarChart3 size={16} className="text-indigo-400" />
            <p
              className="mt-1.5 font-mono text-xl font-black text-white"
              data-testid="stat-visits-total"
            >
              {visitsTotal}
            </p>
            <p className="text-[11px] font-bold text-slate-300">إجمالي الزيارات الكلي</p>
          </div>

          <div
            style={{
              borderRadius: '12px',
              padding: '12px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border"
          >
            <ShoppingBag size={16} className="text-emerald-400" />
            <p
              className="mt-1.5 font-mono text-xl font-black text-white"
              data-testid="stat-published-items"
            >
              {publishedItemsCount}
            </p>
            <p className="text-[11px] font-bold text-slate-300">العناصر بالخدمة النشطة</p>
          </div>

          <div
            style={{
              borderRadius: '12px',
              padding: '12px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border"
          >
            <MessageSquare size={16} className="text-purple-400" />
            <p
              className="mt-1.5 font-mono text-xl font-black text-white"
              data-testid="stat-remaining-messages"
            >
              {remainingMessages}
            </p>
            <p className="text-[11px] font-bold text-slate-300">رصيد رسائل المساعد</p>
          </div>
        </div>

        {websites.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-extrabold text-sky-300">
              خدماتك المنشورة ({websites.length}):
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {websites.map((site) => (
                <div
                  key={site.id}
                  style={{
                    borderRadius: '12px',
                    padding: '10px 12px',
                    backgroundColor: '#070F24',
                    borderColor: '#172E5C',
                  }}
                  className="border flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-white">{site.siteName}</p>
                    <p className="text-[10.5px] font-bold text-sky-400">
                      {getServiceCategoryLabel(site.templateId)} ·{' '}
                      {TEMPLATE_NAMES[site.templateId] ?? site.templateId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenService(site.username)}
                    style={{
                      borderRadius: '8px',
                      padding: '5px 10px',
                      backgroundColor: '#1D4ED8',
                      color: '#FFFFFF',
                      fontSize: '11px',
                    }}
                    className="shrink-0 font-extrabold hover:bg-blue-600"
                  >
                    فتح محادثة الخدمة
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {account && (
          <div
            style={{
              borderRadius: '12px',
              padding: '12px',
              backgroundColor: '#070F24',
              borderColor: '#172E5C',
            }}
            className="border space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-300">رقم واتساب الموثق للحساب:</span>
              <span dir="ltr" className="font-mono font-black text-sky-400">
                +{account.phoneNumber}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-300">تاريخ التسجيل:</span>
              <span className="font-bold text-white">
                {new Intl.DateTimeFormat('ar-SA', { dateStyle: 'long' }).format(
                  new Date(account.createdAt)
                )}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-300">استهلاك رسائل مساعد واتساب:</span>
              <span className="font-mono font-black text-white">
                {used} / {limit}
              </span>
            </div>
            {onLogout && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onLogout}
                  disabled={loggingOut}
                  data-testid="button-logout"
                  style={{
                    borderRadius: '10px',
                    padding: '7px 14px',
                    backgroundColor: '#3B0D1E',
                    borderColor: '#BE123C',
                    color: '#FDA4AF',
                    fontSize: '11.5px',
                  }}
                  className="inline-flex items-center gap-1.5 border font-extrabold hover:bg-rose-900/60 disabled:opacity-50"
                >
                  <LogOut size={14} />
                  <span>تسجيل الخروج من الجلسة</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. Main Prompt-First Adaptive ORXAI Studio Chat Hub Component
// ---------------------------------------------------------------------------
export interface ConversationalServiceCreatorProps {
  initialTemplate?: string;
  initialStyle?: SiteStyle;
  initialSiteName?: string;
  defaultPhone?: string;
  userName?: string;
  publishedSitesCount?: number;
  isModal?: boolean;
  onClose?: () => void;
  onNavigateSection?: (section: string) => void;
  onSuccess: (created: SiteDocument) => void;
  account?: Account;
  websites?: AccountWebsite[];
  activeSection?: string;
  botNumber?: string;
  onLogout?: () => void;
  loggingOut?: boolean;
}

export function ConversationalServiceCreator({
  initialTemplate = 'store',
  initialStyle = 'modern',
  initialSiteName = '',
  defaultPhone = '',
  isModal = false,
  onClose,
  onNavigateSection,
  onSuccess,
  account,
  websites = [],
  activeSection = 'home',
  botNumber = '966500000000',
  onLogout,
  loggingOut = false,
}: ConversationalServiceCreatorProps) {
  const quota = computeServiceQuotaStatus(websites);

  // Active Studio Context:
  // - 'create': Prompt-first adaptive creation flow
  // - 'service:<username>': Conversational management hub for a specific published service
  // - 'whatsapp': WhatsApp quick companion
  // - 'analytics_settings': Platform analytics & account settings
  const [studioContext, setStudioContext] = useState<string>(() => {
    if (isModal) return 'create';
    if (activeSection === 'assistant') return 'whatsapp';
    if (activeSection === 'analytics' || activeSection === 'settings') return 'analytics_settings';
    if (activeSection === 'site' || activeSection === 'services') {
      const targetUser = websites[0]?.username;
      if (targetUser) return `service:${targetUser}`;
    }
    return 'create';
  });

  // Focused Single-Part Panel inside a Published Service Conversation (null = Conversational Hub)
  const [activeServicePanel, setActiveServicePanel] = useState<StudioActivePanel | null>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('tab=results')) {
      return 'results';
    }
    return null;
  });

  // Collapsible & Hideable Top Welcome Banner State
  const [welcomeCollapsed, setWelcomeCollapsed] = useState<boolean>(() =>
    Boolean(initialSiteName.trim())
  );
  const [welcomeHidden, setWelcomeHidden] = useState<boolean>(false);

  // Prompt-First Adaptive Creation State
  const [userInitialPrompt, setUserInitialPrompt] = useState<string>('');
  const [promptInputDraft, setPromptInputDraft] = useState<string>('');
  const [skipProjectNameStep, setSkipProjectNameStep] = useState<boolean>(() =>
    Boolean(initialSiteName.trim())
  );
  const [skipBrandColorStep, setSkipBrandColorStep] = useState<boolean>(false);

  const [creationStep, setCreationStep] = useState<CreationStepId>(() =>
    initialSiteName.trim() ? 'template_style' : 'service_type'
  );

  useEffect(() => {
    if (isModal) {
      setStudioContext('create');
      return;
    }
    if (activeSection === 'assistant') {
      setStudioContext('whatsapp');
    } else if (activeSection === 'analytics' || activeSection === 'settings') {
      setStudioContext('analytics_settings');
    } else if (activeSection === 'site' || activeSection === 'services') {
      if (websites.length > 0) {
        const currentIsService = studioContext.startsWith('service:');
        if (!currentIsService) {
          setStudioContext(`service:${websites[0].username}`);
        }
      } else {
        setStudioContext('create');
      }
    }
  }, [activeSection, isModal, websites.length]);

  // Core Form State for New Service Creation (100% preserved & compatible with backend)
  const [siteName, setSiteName] = useState(initialSiteName);
  const [username, setUsername] = useState('');
  const [templateId, setTemplateId] = useState(() => {
    if (initialTemplate && canCreateServiceWithTemplate(initialTemplate, quota).allowed) {
      return initialTemplate;
    }
    if (!quota.canCreateWebsite && quota.canCreateTool) {
      return 'survey';
    }
    return initialTemplate || 'store';
  });
  const [templateStyle, setTemplateStyle] = useState<SiteStyle>(initialStyle);
  const [themeColor, setThemeColor] = useState('#1D4ED8');
  const [darkMode, setDarkMode] = useState(false);
  const [tagline, setTagline] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [phone, setPhone] = useState(defaultPhone || account?.phoneNumber || '');
  const [whatsapp, setWhatsapp] = useState(defaultPhone || account?.phoneNumber || '');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [snapchat, setSnapchat] = useState('');
  const [hours, setHours] = useState<Array<{ day: string; time: string }>>([]);
  const [initialItems, setInitialItems] = useState<InitialCollectionItemInput[]>([]);
  const [skillsText, setSkillsText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationHint, setValidationHint] = useState('');

  // Conversational UI states
  const [showAllPreviewModal, setShowAllPreviewModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messagesByContext, setMessagesByContext] = useState<
    Record<string, StudioChatTurnMessage[]>
  >({});
  const [pendingStudioAssistant, setPendingStudioAssistant] = useState<
    PendingAssistantDisambiguation | undefined
  >(undefined);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  const queryClient = useQueryClient();
  const sendAssistantMutation = useSendAssistantCommand();
  const saveServiceMutation = useSaveSite();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTemplateId(initialTemplate);
  }, [initialTemplate]);

  useEffect(() => {
    if (!quota.canCreateWebsite && quota.canCreateTool) {
      const check = canCreateServiceWithTemplate(templateId, quota);
      if (!check.allowed) {
        setTemplateId('survey');
      }
    }
  }, [quota.canCreateWebsite, quota.canCreateTool, templateId]);

  useEffect(() => {
    const resolvedPhone = defaultPhone || account?.phoneNumber || '';
    if (resolvedPhone && resolvedPhone !== '966500000000') {
      setPhone((prev) => prev || resolvedPhone);
      setWhatsapp((prev) => prev || resolvedPhone);
    }
  }, [defaultPhone, account?.phoneNumber]);

  // Automatically collapse welcome banner when user moves beyond the entry prompt
  useEffect(() => {
    if (creationStep !== 'service_type' || studioContext !== 'create') {
      setWelcomeCollapsed(true);
    }
  }, [creationStep, studioContext]);

  const currentServiceOption = getConversationalServiceOption(templateId);
  const ActiveServiceIcon = SERVICE_ICONS[templateId] || Store;
  const itemNoun = currentServiceOption.itemNoun;
  const previewSlug = slugifyUsername(
    username.trim() || siteName.trim() || currentServiceOption.defaultSampleName || 'my-site'
  );
  const primaryThreeCards = currentServiceOption.visualCards.slice(0, 3);
  const templateQuotaCheck = canCreateServiceWithTemplate(templateId, quota);

  // Dynamic Steps tailored to the user's request & chosen service type
  const activeDynamicSteps = getDynamicCreationSteps(templateId, {
    skipProjectName: skipProjectNameStep,
    skipBrandColor: skipBrandColorStep,
  });
  const activeStepPosition = Math.max(0, activeDynamicSteps.indexOf(creationStep));
  const isCompactColorService = ['survey', 'vcard', 'rsvp', 'invoice'].includes(templateId);

  const activeServiceUsername = studioContext.startsWith('service:')
    ? studioContext.slice('service:'.length)
    : null;
  const activeServiceSummary = activeServiceUsername
    ? websites.find((w) => w.username === activeServiceUsername) || websites[0]
    : undefined;
  const activeSiteDocQuery = useSiteDocument(activeServiceUsername || undefined);

  const appendContextMessage = (ctxKey: string, ...msgs: StudioChatTurnMessage[]) => {
    setMessagesByContext((prev) => ({
      ...prev,
      [ctxKey]: [...(prev[ctxKey] ?? []), ...msgs],
    }));
  };

  const switchToServiceContext = (
    targetUsername: string,
    initialPanel: StudioActivePanel | null = null
  ) => {
    setActiveSiteUsername(targetUsername);
    setActiveServicePanel(initialPanel);
    setStudioContext(`service:${targetUsername}`);
  };

  // Handler when the user submits their free-form idea in «ماذا تريد أن تبني اليوم؟»
  const handleUserInitialPromptSubmit = (rawIdea: string) => {
    const cleanIdea = rawIdea.trim();
    if (!cleanIdea) return;

    const analysis = analyzeUserProjectRequest(cleanIdea, quota, templateId);
    setUserInitialPrompt(cleanIdea);
    setPromptInputDraft('');
    setWelcomeCollapsed(true);

    setTemplateId(analysis.templateId);
    if (analysis.extractedSiteName) {
      setSiteName(analysis.extractedSiteName);
      setSkipProjectNameStep(true);
    } else {
      setSkipProjectNameStep(false);
    }

    if (analysis.extractedColor) {
      setThemeColor(analysis.extractedColor);
      setSkipBrandColorStep(true);
    } else {
      setSkipBrandColorStep(false);
    }

    if (analysis.extractedStyle) {
      setTemplateStyle(analysis.extractedStyle);
    }
    if (typeof analysis.extractedDarkMode === 'boolean') {
      setDarkMode(analysis.extractedDarkMode);
    }
    if (analysis.extractedPhone) {
      setPhone(analysis.extractedPhone);
      setWhatsapp(analysis.extractedPhone);
    }
    if (analysis.extractedDescription) {
      setDescription(analysis.extractedDescription);
    }

    setValidationHint('');
    setCreationStep(analysis.nextStep);
  };

  const executeCreateSite = async () => {
    const check = canCreateServiceWithTemplate(templateId, quota);
    if (!check.allowed) {
      setValidationHint(check.reason || 'وصلت للحد المسموح من الخدمات.');
      return;
    }

    const cleanName = siteName.trim();
    if (!cleanName) {
      setValidationHint(`يرجى كتابة ${currentServiceOption.nameQuestion}`);
      setSkipProjectNameStep(false);
      setCreationStep('project_name');
      return;
    }

    setValidationHint('');
    setSubmitting(true);

    try {
      const payload = buildCreateInPlatformPayload({
        siteName: cleanName,
        username,
        templateId,
        templateStyle,
        themeColor,
        darkMode,
        tagline,
        headline,
        description,
        ctaLabel,
        phone,
        whatsapp,
        email,
        address,
        instagram,
        twitter,
        tiktok,
        snapchat,
        hours,
        initialItems,
        skillsText,
      });

      const created = await createWebsiteInPlatform(payload);
      setSubmitting(false);
      // Reset creation state for next service
      setSiteName('');
      setUsername('');
      setUserInitialPrompt('');
      setPromptInputDraft('');
      setInitialItems([]);
      setHours([]);
      setSkillsText('');
      setSkipProjectNameStep(false);
      setSkipBrandColorStep(false);
      setCreationStep('service_type');

      // Seed confirmation message in the newly created service's independent conversation
      const newServiceCtx = `service:${created.username}`;
      appendContextMessage(newServiceCtx, {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: `🎉 تم نشر خدمة «${created.siteName}» بنجاح! هذه المحادثة المخصصة هي مركز إدارة خدمتك — اختر أي جزء من البطاقات أدناه لتعديله (القالب، الألوان، المنتجات، المحتوى، التواصل، أو الإعدادات) أو اكتب طلبك مباشرة في الشات.`,
      });

      onSuccess(created);
      if (!isModal) {
        switchToServiceContext(created.username, null);
      }
      onClose?.();
    } catch {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creationStep === 'service_type') {
      if (promptInputDraft.trim()) {
        handleUserInitialPromptSubmit(promptInputDraft);
        return;
      }
      setWelcomeCollapsed(true);
      setCreationStep('project_name');
      return;
    }
    if (creationStep !== 'preview_publish') {
      if (creationStep === 'project_name' && !siteName.trim()) {
        setValidationHint(`يرجى إدخال ${currentServiceOption.nameQuestion}`);
        nameInputRef.current?.focus();
        return;
      }
      setCreationStep(getNextCreationStep(creationStep, activeDynamicSteps));
      return;
    }
    await executeCreateSite();
  };

  const executeStudioMultiServiceCommand = (rawText: string) => {
    const raw = rawText.trim();
    if (!raw || !activeServiceUsername || !activeServiceSummary) return;

    const userMsgId = `u-${Date.now()}`;

    // If not in a pending disambiguation, allow quick panel close commands
    if (!pendingStudioAssistant) {
      const quickCmd = parseStudioEditCommand(raw, activeServiceSummary.siteName);
      if (quickCmd.action === 'close_panel') {
        setActiveServicePanel(null);
        appendContextMessage(
          studioContext,
          { id: userMsgId, sender: 'user', text: raw },
          { id: `b-${Date.now()}`, sender: 'bot', text: quickCmd.botReply }
        );
        return;
      }
      if (quickCmd.action === 'save_changes') {
        appendContextMessage(
          studioContext,
          { id: userMsgId, sender: 'user', text: raw },
          { id: `b-${Date.now()}`, sender: 'bot', text: quickCmd.botReply }
        );
        return;
      }
    }

    const resolution = resolveMultiServiceCommand(raw, websites, pendingStudioAssistant);

    // 1. User asked to create a new service -> Never mix with existing services!
    if (resolution.status === 'create_new_service') {
      setPendingStudioAssistant(undefined);
      appendContextMessage(
        studioContext,
        { id: userMsgId, sender: 'user', text: raw },
        { id: `b-${Date.now()}`, sender: 'bot', text: resolution.botReply }
      );
      setSiteName('');
      setUsername('');
      setUserInitialPrompt('');
      setPromptInputDraft('');
      setInitialItems([]);
      setHours([]);
      setSkillsText('');
      setSkipProjectNameStep(false);
      setSkipBrandColorStep(false);
      setCreationStep('service_type');
      setStudioContext('create');
      return;
    }

    // 2. Request is ambiguous across multiple user services -> Ask which service first!
    if (resolution.status === 'needs_disambiguation') {
      setPendingStudioAssistant(resolution.pendingContext);
      appendContextMessage(
        studioContext,
        { id: userMsgId, sender: 'user', text: raw },
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: resolution.botReply,
          disambiguationCandidates: resolution.candidateServices,
        }
      );
      return;
    }

    // 3. Resolved to a specific service
    if (resolution.status === 'resolved' && resolution.targetService) {
      const target = resolution.targetService;
      const targetCtxKey = `service:${target.username}`;

      if (resolution.awaitingValueFollowUp && resolution.pendingContext) {
        setPendingStudioAssistant(resolution.pendingContext);
      } else {
        setPendingStudioAssistant(undefined);
      }

      // Apply data updates strictly to the resolved target service only
      const applied = applyAssistantResolutionToLocalSite(target.username, resolution);
      if (applied.website) {
        queryClient.setQueryData(siteQueryKey, applied.website);
        queryClient.setQueryData([...siteQueryKey, target.username], applied.website);
        queryClient.setQueryData(accountQueryKey, getLocalAccount());
        void activeSiteDocQuery.refetch();
      }

      setActiveSiteUsername(target.username);
      if (studioContext !== targetCtxKey) {
        setStudioContext(targetCtxKey);
      }

      const hasInlineMutation = Boolean(
        resolution.extractedValue ||
          resolution.extractedItem ||
          resolution.extractedColor ||
          resolution.extractedStyle ||
          typeof resolution.extractedDarkMode === 'boolean'
      );

      if (
        resolution.intent === 'open_panel' &&
        resolution.targetPanel &&
        !hasInlineMutation
      ) {
        setActiveServicePanel(resolution.targetPanel);
      } else if (hasInlineMutation) {
        setActiveServicePanel(null);
      }

      appendContextMessage(
        targetCtxKey,
        { id: userMsgId, sender: 'user', text: raw },
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: applied.reply || resolution.botReply,
          resolvedService: target,
        }
      );
      return;
    }

    // Fallback to assistant mutation
    appendContextMessage(studioContext, { id: userMsgId, sender: 'user', text: raw });
    sendAssistantMutation.mutate(
      { message: raw, targetUsername: activeServiceUsername, pendingContext: pendingStudioAssistant },
      {
        onSuccess: (res) => {
          void activeSiteDocQuery.refetch();
          appendContextMessage(studioContext, {
            id: `b-${Date.now()}`,
            sender: 'bot',
            text: res.reply,
          });
        },
      }
    );
  };

  // Bottom Chat Input Handler (Supports both Prompt-First Creation & Multi-Service Management)
  const handleChatBarSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = chatInput.trim();
    if (!raw) return;
    setChatInput('');

    const userMsgId = `u-${Date.now()}`;

    // -------------------------------------------------------------------------
    // CASE A: Inside a Published Service's Independent Conversation Context
    // -------------------------------------------------------------------------
    if (activeServiceUsername && activeServiceSummary) {
      executeStudioMultiServiceCommand(raw);
      return;
    }

    // -------------------------------------------------------------------------
    // CASE B: Inside Creation Flow ('create')
    // -------------------------------------------------------------------------
    if (studioContext !== 'create') {
      setStudioContext('create');
    }

    // If at the initial prompt stage, analyze the full project request dynamically
    if (creationStep === 'service_type') {
      handleUserInitialPromptSubmit(raw);
      return;
    }

    const parsed = parseSmartChatInput(raw, { templateId, siteName });

    if (parsed.action === 'select_template' && parsed.templateId) {
      setTemplateId(parsed.templateId);
      setCreationStep('project_name');
    } else if (parsed.action === 'set_site_name' && parsed.siteName) {
      setSiteName(parsed.siteName);
      setValidationHint('');
      if (creationStep === 'project_name') {
        setCreationStep(getNextCreationStep('project_name', activeDynamicSteps));
      }
    } else if (parsed.action === 'set_contact_phone' && parsed.phone) {
      setWhatsapp(parsed.phone);
      setPhone(parsed.phone);
      if (creationStep === 'content_items') {
        setCreationStep('preview_publish');
      }
    } else if (parsed.action === 'set_description' && parsed.description) {
      setDescription(parsed.description);
    } else if (parsed.action === 'add_item' && parsed.item) {
      setInitialItems((prev) => [...prev, parsed.item!]);
    } else if (parsed.action === 'launch_request') {
      appendContextMessage(
        'create',
        { id: userMsgId, sender: 'user', text: raw },
        { id: `b-${Date.now()}`, sender: 'bot', text: parsed.botReply }
      );
      await executeCreateSite();
      return;
    }

    appendContextMessage(
      'create',
      { id: userMsgId, sender: 'user', text: raw },
      { id: `b-${Date.now()}`, sender: 'bot', text: parsed.botReply }
    );

    window.setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  };

  const createMessages = messagesByContext['create'] ?? [];
  const verifiedPhoneLabel =
    account?.phoneNumber && account.phoneNumber !== '966500000000'
      ? `+${account.phoneNumber}`
      : '';

  const selectedCardTitle =
    currentServiceOption.visualCards.find((c) => c.style === templateStyle)?.title ||
    STYLE_LABELS[templateStyle];
  const selectedColorLabel =
    CHAT_COLOR_SWATCHES.find((s) => s.hex.toLowerCase() === themeColor.toLowerCase())?.label ||
    themeColor;

  return (
    <div
      dir="rtl"
      data-testid="conversational-service-creator"
      style={{
        backgroundColor: '#040918',
        color: '#FFFFFF',
      }}
      className={`relative font-sans antialiased selection:bg-sky-500 selection:text-white ${
        isModal ? 'fixed inset-0 z-50 overflow-y-auto' : 'min-h-screen overflow-x-hidden'
      }`}
    >
      {/* =====================================================================
          TOP STUDIO HEADER + INDEPENDENT SERVICE CONVERSATIONS BAR
          (Solid Opaque Background - Zero Blur / Transparency Overlap)
      ====================================================================== */}
      <header
        style={{ backgroundColor: '#050C1F', borderColor: '#172E5C' }}
        className="sticky top-0 z-30 border-b"
      >
        <div
          style={{
            maxWidth: '920px',
            margin: '0 auto',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          {/* Right Side in RTL: Menu Button + ORxai Studio Logo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHeaderMenuOpen((v) => !v)}
              aria-label="القائمة"
              data-testid="button-creator-menu"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: '#0C1A3B',
                borderColor: '#1E3A6E',
                color: '#E2E8F0',
              }}
              className="flex items-center justify-center border transition hover:border-sky-400"
            >
              {headerMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            <Link
              href="/"
              dir="ltr"
              className="inline-flex items-center gap-1.5 select-none"
            >
              <svg viewBox="0 0 36 36" width="22" height="22" fill="none" aria-hidden>
                <path
                  d="M7 8L29 28M29 8L7 28"
                  stroke="#38BDF8"
                  strokeWidth="4.8"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                ORxai
              </span>
            </Link>

            <span
              style={{
                borderRadius: '9999px',
                padding: '2px 8px',
                backgroundColor: '#0F224A',
                borderColor: '#2563EB',
                color: '#38BDF8',
                fontSize: '10px',
              }}
              className="border font-extrabold"
            >
              Studio
            </span>
          </div>

          {/* Left Side in RTL: Quota Badge + Real Account Greeting Pill + Avatar */}
          <div className="flex items-center gap-2">
            <div
              data-testid="studio-quota-pill"
              style={{
                borderRadius: '9999px',
                padding: '4px 10px',
                backgroundColor: '#0C1A3B',
                borderColor: '#1E3A6E',
                color: '#CBD5E1',
                fontSize: '10.5px',
              }}
              className="hidden sm:inline-flex items-center gap-1.5 border font-bold"
            >
              <span>
                المواقع:{' '}
                <strong className="font-mono text-sky-400">
                  {quota.websiteCount}/{quota.maxWebsites}
                </strong>
              </span>
              <span className="opacity-30">|</span>
              <span>
                الأدوات:{' '}
                <strong className="font-mono text-emerald-400">
                  {quota.toolCount}/{quota.maxTools}
                </strong>
              </span>
            </div>

            <div
              style={{
                borderRadius: '9999px',
                padding: '4px 10px',
                backgroundColor: '#0C1A3B',
                borderColor: '#1E3A6E',
                color: '#E2E8F0',
                fontSize: '11px',
              }}
              className="inline-flex items-center gap-1.5 border font-bold whitespace-nowrap"
            >
              <span>{timeGreeting()}</span>
              {verifiedPhoneLabel && (
                <span dir="ltr" className="hidden md:inline font-mono text-sky-300">
                  {verifiedPhoneLabel}
                </span>
              )}
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  backgroundColor: '#10B981',
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => setHeaderMenuOpen((v) => !v)}
              aria-label="حساب المستخدم"
              data-testid="button-account-menu"
              className="inline-flex items-center gap-1"
            >
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9999px',
                  backgroundColor: '#1E3A8A',
                  borderColor: '#38BDF8',
                }}
                className="flex items-center justify-center overflow-hidden border"
              >
                <User size={16} className="text-sky-200" />
              </span>
            </button>

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9999px',
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  color: '#E2E8F0',
                }}
                className="flex items-center justify-center border hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* INDEPENDENT SERVICE CONVERSATIONS & STUDIO HUB SWITCHER BAR */}
        {!isModal && (
          <div
            style={{
              maxWidth: '920px',
              margin: '0 auto',
              padding: '0 12px 8px 12px',
            }}
          >
            <div
              data-testid="studio-context-switcher"
              className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar"
            >
              <button
                type="button"
                onClick={() => {
                  if (!quota.canCreateWebsite && quota.canCreateTool) {
                    const check = canCreateServiceWithTemplate(templateId, quota);
                    if (!check.allowed) {
                      setTemplateId('survey');
                    }
                  }
                  setStudioContext('create');
                  onNavigateSection?.('home');
                }}
                data-testid="tab-context-create"
                style={
                  studioContext === 'create'
                    ? {
                        borderRadius: '9999px',
                        padding: '5px 12px',
                        backgroundColor: '#1D4ED8',
                        borderColor: '#38BDF8',
                        color: '#FFFFFF',
                        fontSize: '11px',
                      }
                    : {
                        borderRadius: '9999px',
                        padding: '5px 12px',
                        backgroundColor: '#0C1A3B',
                        borderColor: '#1E3A6E',
                        color: '#CBD5E1',
                        fontSize: '11px',
                      }
                }
                className="inline-flex shrink-0 items-center gap-1.5 border font-extrabold transition hover:border-sky-400"
              >
                <Plus size={12} />
                <span>إنشاء خدمة جديدة</span>
                <span className="font-mono text-[10px] opacity-85">
                  ({quota.totalCount}/{quota.maxTotal})
                </span>
              </button>

              {websites.map((site) => {
                const Icon = SERVICE_ICONS[site.templateId] || Globe;
                const isCurrent = studioContext === `service:${site.username}`;
                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => switchToServiceContext(site.username, null)}
                    data-testid={`tab-service-context-${site.username}`}
                    style={
                      isCurrent
                        ? {
                            borderRadius: '9999px',
                            padding: '5px 12px',
                            backgroundColor: '#059669',
                            borderColor: '#34D399',
                            color: '#FFFFFF',
                            fontSize: '11px',
                          }
                        : {
                            borderRadius: '9999px',
                            padding: '5px 12px',
                            backgroundColor: '#0C1A3B',
                            borderColor: '#1E3A6E',
                            color: '#E2E8F0',
                            fontSize: '11px',
                          }
                    }
                    className="inline-flex shrink-0 items-center gap-1.5 border font-extrabold transition hover:border-sky-400"
                  >
                    <Icon size={12} />
                    <span>{site.siteName}</span>
                    <span className="rounded-full bg-black/30 px-1.5 py-0.5 text-[9.5px]">
                      {getServiceCategoryLabel(site.templateId)}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setStudioContext('whatsapp');
                  onNavigateSection?.('assistant');
                }}
                data-testid="tab-context-whatsapp"
                style={
                  studioContext === 'whatsapp'
                    ? {
                        borderRadius: '9999px',
                        padding: '5px 12px',
                        backgroundColor: '#1D4ED8',
                        borderColor: '#38BDF8',
                        color: '#FFFFFF',
                        fontSize: '11px',
                      }
                    : {
                        borderRadius: '9999px',
                        padding: '5px 12px',
                        backgroundColor: '#0C1A3B',
                        borderColor: '#1E3A6E',
                        color: '#CBD5E1',
                        fontSize: '11px',
                      }
                }
                className="inline-flex shrink-0 items-center gap-1.5 border font-bold transition hover:border-sky-400"
              >
                <MessageCircle size={12} className="text-emerald-400" />
                <span>واتساب السريع</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudioContext('analytics_settings');
                  onNavigateSection?.('analytics');
                }}
                data-testid="tab-context-analytics-settings"
                style={
                  studioContext === 'analytics_settings'
                    ? {
                        borderRadius: '9999px',
                        padding: '5px 12px',
                        backgroundColor: '#1D4ED8',
                        borderColor: '#38BDF8',
                        color: '#FFFFFF',
                        fontSize: '11px',
                      }
                    : {
                        borderRadius: '9999px',
                        padding: '5px 12px',
                        backgroundColor: '#0C1A3B',
                        borderColor: '#1E3A6E',
                        color: '#CBD5E1',
                        fontSize: '11px',
                      }
                }
                className="inline-flex shrink-0 items-center gap-1.5 border font-bold transition hover:border-sky-400"
              >
                <BarChart3 size={12} className="text-sky-400" />
                <span>الإحصائيات والإعدادات</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Navigation Drawer */}
        {headerMenuOpen && (
          <div
            style={{
              maxWidth: '920px',
              margin: '0 auto',
              padding: '4px 12px 10px 12px',
            }}
          >
            <div
              style={{
                borderRadius: '14px',
                padding: '10px',
                backgroundColor: '#0A1530',
                borderColor: '#1E3A6E',
              }}
              className="flex flex-wrap items-center justify-between gap-2 border"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    setStudioContext('create');
                    onNavigateSection?.('home');
                  }}
                  style={{
                    borderRadius: '10px',
                    padding: '6px 12px',
                    backgroundColor: '#1D4ED8',
                    color: '#FFFFFF',
                    fontSize: '11.5px',
                  }}
                  className="inline-flex items-center gap-1.5 font-extrabold"
                >
                  <Sparkles size={13} />
                  <span>إنشاء خدمة جديدة</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    setStudioContext('whatsapp');
                    onNavigateSection?.('assistant');
                  }}
                  style={{
                    borderRadius: '10px',
                    padding: '6px 12px',
                    backgroundColor: '#0F1E42',
                    borderColor: '#1E3A6E',
                    color: '#E2E8F0',
                    fontSize: '11.5px',
                  }}
                  className="inline-flex items-center gap-1.5 border font-bold hover:border-sky-400"
                >
                  <MessageCircle size={13} className="text-emerald-400" />
                  <span>واتساب والمساعد السريع</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    setStudioContext('analytics_settings');
                    onNavigateSection?.('analytics');
                  }}
                  style={{
                    borderRadius: '10px',
                    padding: '6px 12px',
                    backgroundColor: '#0F1E42',
                    borderColor: '#1E3A6E',
                    color: '#E2E8F0',
                    fontSize: '11.5px',
                  }}
                  className="inline-flex items-center gap-1.5 border font-bold hover:border-sky-400"
                >
                  <Settings size={13} className="text-sky-400" />
                  <span>الإحصائيات والإعدادات</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  style={{
                    borderRadius: '10px',
                    padding: '6px 12px',
                    backgroundColor: '#0F172A',
                    color: '#94A3B8',
                    fontSize: '11.5px',
                  }}
                  className="font-bold hover:text-white"
                >
                  واجهة المنصة الرئيسية ←
                </Link>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    disabled={loggingOut}
                    style={{
                      borderRadius: '10px',
                      padding: '6px 12px',
                      backgroundColor: '#3B0D1E',
                      color: '#FDA4AF',
                      fontSize: '11.5px',
                    }}
                    className="font-bold hover:bg-rose-900/60"
                  >
                    خروج
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          MAIN STUDIO WORKSPACE STREAM
          (Optimized spacing on mobile & desktop, solid surfaces, zero overlap)
      ====================================================================== */}
      <div
        style={{
          maxWidth: studioContext.startsWith('service:') ? '820px' : '680px',
          margin: '0 auto',
          padding: '10px 10px 92px 10px',
        }}
        className="sm:px-4 sm:pt-3"
      >
        {studioContext.startsWith('service:') && activeServiceUsername && activeServiceSummary ? (
          <IndependentServiceChatContext
            key={activeServiceUsername}
            serviceUsername={activeServiceUsername}
            serviceSummary={activeServiceSummary}
            activePanel={activeServicePanel}
            onSelectPanel={setActiveServicePanel}
            serviceMessages={messagesByContext[studioContext] ?? []}
            onAppendServiceMessage={(...msgs) => appendContextMessage(studioContext, ...msgs)}
            onSelectDisambiguatedService={(srv) => executeStudioMultiServiceCommand(srv.siteName)}
            onDeleted={() => {
              setStudioContext('create');
              onNavigateSection?.('home');
            }}
          />
        ) : studioContext === 'whatsapp' ? (
          <StudioWhatsappCompanionCard
            account={account}
            botNumber={botNumber}
            websites={websites}
            onOpenService={(uname) => switchToServiceContext(uname, null)}
            onStartCreateNewService={() => {
              setSiteName('');
              setUsername('');
              setCreationStep('service_type');
              setStudioContext('create');
              onNavigateSection?.('home');
            }}
          />
        ) : studioContext === 'analytics_settings' ? (
          <StudioAnalyticsAndSettingsCard
            account={account}
            websites={websites}
            onLogout={onLogout}
            loggingOut={loggingOut}
            onOpenService={(uname) => switchToServiceContext(uname, null)}
          />
        ) : (
          /* =================================================================
             PHASE 1: PROMPT-FIRST ADAPTIVE CREATION FLOW
             - Starts with «ماذا تريد أن تبني اليوم؟» + Free-form input + Optional choices
             - Guides step-by-step dynamically based on user request & service type
          ================================================================== */
          <form onSubmit={handleFormSubmit} className="space-y-2.5 sm:space-y-3">
            {/* 1. COMPACT, COLLAPSIBLE & HIDEABLE WELCOME BANNER */}
            {!welcomeHidden && (
              <section
                data-testid="studio-welcome-banner"
                style={{
                  borderRadius: '14px',
                  padding: welcomeCollapsed ? '6px 10px' : '9px 12px',
                  backgroundColor: '#0A1530',
                  borderColor: '#1E3A6E',
                }}
                className="border transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MiniBotAvatar size={28} />
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                      <span className="text-xs sm:text-sm font-extrabold text-white">
                        مرحباً بك في <span className="text-sky-400">ORxai Studio</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-300">
                        (المواقع:{' '}
                        <strong className="font-mono text-sky-400">
                          {quota.websiteCount}/{quota.maxWebsites}
                        </strong>{' '}
                        · الأدوات:{' '}
                        <strong className="font-mono text-emerald-400">
                          {quota.toolCount}/{quota.maxTools}
                        </strong>
                        )
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setWelcomeCollapsed((v) => !v)}
                      data-testid="button-toggle-welcome"
                      title={welcomeCollapsed ? 'توسيع البطاقة' : 'اختصار البطاقة'}
                      style={{
                        borderRadius: '8px',
                        padding: '3px 7px',
                        backgroundColor: '#13285C',
                        borderColor: '#1E3A6E',
                        color: '#CBD5E1',
                        fontSize: '10px',
                      }}
                      className="inline-flex items-center gap-1 border font-bold hover:text-white"
                    >
                      {welcomeCollapsed ? (
                        <>
                          <span>توسيع</span>
                          <ChevronDown size={11} />
                        </>
                      ) : (
                        <>
                          <span>اختصار</span>
                          <ChevronUp size={11} />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWelcomeHidden(true)}
                      data-testid="button-hide-welcome"
                      aria-label="إخفاء بطاقة الترحيب"
                      title="إخفاء"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '8px',
                        backgroundColor: '#13285C',
                        borderColor: '#1E3A6E',
                        color: '#94A3B8',
                      }}
                      className="flex items-center justify-center border hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
                {!welcomeCollapsed && (
                  <p className="mt-1.5 text-[11px] text-slate-300 leading-snug">
                    صف فكرتك بحرية أو اختر نوع الخدمة، وسأقودك خطوة بخطوة حسب احتياج مشروعك حتى المعاينة والنشر.
                  </p>
                )}
              </section>
            )}

            {/* 1B. USER'S OWN PUBLISHED SERVICES QUICK ACCESS (If any exist) */}
            {websites.length > 0 && (
              <section
                data-testid="home-websites-list"
                style={{
                  borderRadius: '14px',
                  padding: '9px 12px',
                  backgroundColor: '#0A1530',
                  borderColor: '#1E3A6E',
                }}
                className="border space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold text-sky-300">
                    خدماتك المنشورة ({websites.length}) — اضغط لفتح محادثة إدارة أي خدمة:
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {websites.map((site) => {
                    const SIcon = SERVICE_ICONS[site.templateId] || Globe;
                    return (
                      <div
                        key={site.id}
                        data-testid={`site-card-${site.username}`}
                        style={{
                          borderRadius: '12px',
                          padding: '8px 10px',
                          backgroundColor: '#070F24',
                          borderColor: '#172E5C',
                        }}
                        className="border flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              backgroundColor: site.themeColor || '#1D4ED8',
                              color: '#FFFFFF',
                            }}
                            className="flex items-center justify-center shrink-0"
                          >
                            <SIcon size={14} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-white">{site.siteName}</p>
                            <p className="text-[10px] font-bold text-sky-400">
                              {TEMPLATE_NAMES[site.templateId] ?? site.templateId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => switchToServiceContext(site.username, null)}
                            data-testid={`button-edit-${site.username}`}
                            style={{
                              borderRadius: '8px',
                              padding: '4px 9px',
                              backgroundColor: '#1D4ED8',
                              color: '#FFFFFF',
                              fontSize: '10.5px',
                            }}
                            className="font-extrabold hover:bg-blue-600"
                          >
                            محادثة الخدمة
                          </button>
                          <button
                            type="button"
                            onClick={() => switchToServiceContext(site.username, 'results')}
                            data-testid={`button-results-${site.username}`}
                            style={{
                              borderRadius: '8px',
                              padding: '4px 8px',
                              backgroundColor: '#13285C',
                              borderColor: '#2563EB',
                              color: '#38BDF8',
                              fontSize: '10.5px',
                            }}
                            className="border font-extrabold"
                          >
                            النتائج ({site.submissionsCount ?? 0})
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 2. DYNAMIC PROGRESS BAR (Shown ONLY AFTER user initiates request, not pre-imposed!) */}
            {creationStep !== 'service_type' && (
              <section
                data-testid="creation-progressive-stepper"
                style={{
                  borderRadius: '14px',
                  padding: '8px 12px',
                  backgroundColor: '#0A1530',
                  borderColor: '#1E3A6E',
                }}
                className="border"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-extrabold text-sky-300">
                    المرحلة الحالية:{' '}
                    <strong className="text-white">
                      {getStepLabelForTemplate(creationStep, templateId)}
                    </strong>
                  </span>
                  <span className="text-[10.5px] font-bold text-slate-400">
                    مسار مخصص لـ «{currentServiceOption.shortLabel}»
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${activeDynamicSteps.length}, minmax(0, 1fr))`,
                    gap: '6px',
                  }}
                >
                  {activeDynamicSteps.map((stepId, idx) => {
                    const isDone = idx < activeStepPosition;
                    const isCurrent = stepId === creationStep;
                    return (
                      <button
                        key={stepId}
                        type="button"
                        onClick={() => setCreationStep(stepId)}
                        data-testid={`stepper-dot-${stepId}`}
                        title={getStepLabelForTemplate(stepId, templateId)}
                        style={{
                          height: '5px',
                          borderRadius: '9999px',
                          backgroundColor: isCurrent
                            ? '#38BDF8'
                            : isDone
                            ? '#10B981'
                            : '#1E293B',
                        }}
                        className="transition-colors hover:opacity-90"
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* ===============================================================
                COMPLETED STEPS SUMMARY BUBBLES
            ================================================================ */}
            {creationStep !== 'service_type' && (
              <CompletedStepTurn
                stepTestId="completed-step-service-type"
                botQuestion="ماذا تريد أن تبني اليوم؟"
                userAnswer={
                  userInitialPrompt.trim()
                    ? `${userInitialPrompt.trim()} (${currentServiceOption.shortLabel})`
                    : currentServiceOption.userIntentPhrase
                }
                onEdit={() => setCreationStep('service_type')}
              />
            )}

            {creationStep !== 'service_type' &&
              creationStep !== 'project_name' &&
              siteName.trim() && (
                <CompletedStepTurn
                  stepTestId="completed-step-project-name"
                  botQuestion={currentServiceOption.nameQuestion}
                  userAnswer={siteName.trim()}
                  onEdit={() => {
                    setSkipProjectNameStep(false);
                    setCreationStep('project_name');
                  }}
                />
              )}

            {(creationStep === 'brand_color' ||
              creationStep === 'content_items' ||
              creationStep === 'preview_publish') && (
              <CompletedStepTurn
                stepTestId="completed-step-template-style"
                botQuestion={currentServiceOption.templateGalleryPrompt}
                userAnswer={selectedCardTitle}
                onEdit={() => setCreationStep('template_style')}
              />
            )}

            {(creationStep === 'content_items' || creationStep === 'preview_publish') && (
              <CompletedStepTurn
                stepTestId="completed-step-brand-color"
                botQuestion={currentServiceOption.colorQuestion}
                userAnswer={`${selectedColorLabel}${darkMode ? ' · الوضع الداكن' : ''}`}
                onEdit={() => {
                  setSkipBrandColorStep(false);
                  setCreationStep('brand_color');
                }}
              />
            )}

            {creationStep === 'preview_publish' && (
              <CompletedStepTurn
                stepTestId="completed-step-content-items"
                botQuestion={getStepLabelForTemplate('content_items', templateId)}
                userAnswer={
                  initialItems.length > 0
                    ? `تم إعداد المحتوى و ${initialItems.length} (${itemNoun})`
                    : 'تم إعداد النصوص وبيانات الخدمة الأساسية'
                }
                onEdit={() => setCreationStep('content_items')}
              />
            )}

            {/* ===============================================================
                ENTRY STAGE: «ماذا تريد أن تبني اليوم؟»
                Free-form user prompt box + Optional ready service choices
            ================================================================ */}
            {creationStep === 'service_type' && (
              <section
                data-testid="active-step-service-type"
                style={{
                  borderRadius: '18px',
                  padding: '14px',
                  backgroundColor: '#0A1530',
                  borderColor: '#1E3A6E',
                }}
                className="border text-right space-y-3.5"
              >
                <div className="flex items-start gap-2.5">
                  <MiniBotAvatar size={36} />
                  <div className="min-w-0 flex-1">
                    <h1
                      data-testid="prompt-heading-what-to-build"
                      className="text-base sm:text-lg font-black text-white"
                    >
                      ماذا تريد أن تبني اليوم؟
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-300">
                      صف فكرتك أو مشروعك بحرية في مربع المراسلة أدناه، أو اختر من الخيارات الجاهزة الاختيارية:
                    </p>
                  </div>
                </div>

                {/* Free-Form Project Idea Message Box */}
                <div
                  style={{
                    borderRadius: '14px',
                    padding: '10px',
                    backgroundColor: '#070F24',
                    borderColor: '#2563EB',
                  }}
                  className="border space-y-2"
                >
                  <textarea
                    rows={2}
                    value={promptInputDraft}
                    onChange={(e) => setPromptInputDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (promptInputDraft.trim()) {
                          handleUserInitialPromptSubmit(promptInputDraft);
                        }
                      }
                    }}
                    placeholder="اكتب فكرتك بحرية... (مثال: أريد متجر عطور باسم دار العود باللون الذهبي، أو منيو كافيه مختص، أو حجز مواعيد لعيادة أسنان)"
                    aria-label="ماذا تريد أن تبني اليوم؟"
                    data-testid="input-initial-project-prompt"
                    className="w-full resize-none bg-transparent text-right text-xs sm:text-sm font-bold text-white placeholder:text-slate-400 focus:outline-none"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                    <span className="text-[10.5px] font-medium text-slate-400">
                      سيحدد البوت نوع الخدمة والخطوات المناسبة لمشروعك تلقائياً
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (promptInputDraft.trim()) {
                          handleUserInitialPromptSubmit(promptInputDraft);
                        } else {
                          setWelcomeCollapsed(true);
                          setCreationStep('project_name');
                        }
                      }}
                      data-testid="button-submit-initial-prompt"
                      style={{
                        borderRadius: '10px',
                        padding: '7px 16px',
                        backgroundColor: '#1D4ED8',
                        color: '#FFFFFF',
                        fontSize: '12px',
                      }}
                      className="inline-flex items-center gap-1.5 font-extrabold hover:bg-blue-600"
                    >
                      <Send size={13} />
                      <span>إرسال والبدء</span>
                    </button>
                  </div>
                </div>

                {/* Optional Ready Choices for Service Types */}
                <div className="space-y-2.5 pt-1">
                  <p className="text-[11px] font-extrabold text-slate-300">
                    أو اختر مباشرة من الخيارات الجاهزة لأنواع الخدمات:
                  </p>

                  {/* Group 1: Websites */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-sky-300">
                      <span>1. المواقع والواجهات الرقمية:</span>
                      <span className="font-mono">
                        {quota.websiteCount}/{quota.maxWebsites}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {CONVERSATION_SERVICE_OPTIONS.filter((o) => o.groupId === 'websites').map(
                        (opt) => {
                          const Icon = SERVICE_ICONS[opt.templateId] || Globe;
                          const active = templateId === opt.templateId;
                          return (
                            <button
                              type="button"
                              key={opt.templateId}
                              onClick={() => {
                                setTemplateId(opt.templateId);
                                setSkipProjectNameStep(false);
                                setSkipBrandColorStep(false);
                                setValidationHint('');
                              }}
                              data-testid={`modal-template-${opt.templateId}`}
                              style={
                                active
                                  ? {
                                      borderRadius: '12px',
                                      padding: '8px 10px',
                                      backgroundColor: '#132A63',
                                      borderColor: '#38BDF8',
                                      color: '#FFFFFF',
                                    }
                                  : {
                                      borderRadius: '12px',
                                      padding: '8px 10px',
                                      backgroundColor: '#070F24',
                                      borderColor: '#172E5C',
                                      color: '#E2E8F0',
                                    }
                              }
                              className="flex items-center justify-between gap-2 border text-right transition-colors hover:border-sky-400"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '8px',
                                    backgroundColor: active ? '#2563EB' : '#0F1E42',
                                    color: '#38BDF8',
                                  }}
                                  className="flex items-center justify-center shrink-0"
                                >
                                  <Icon size={15} className={active ? 'text-white' : 'text-sky-400'} />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-extrabold text-white">
                                    {opt.shortLabel}
                                  </p>
                                  <p className="line-clamp-1 text-[10px] text-slate-300">
                                    {opt.desc}
                                  </p>
                                </div>
                              </div>
                              {active && <Check size={14} className="text-sky-300 shrink-0" />}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Group 2: Interactive Tools */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-400">
                      <span>2. الأدوات التفاعلية الذكية:</span>
                      <span className="font-mono">
                        {quota.toolCount}/{quota.maxTools}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {CONVERSATION_SERVICE_OPTIONS.filter((o) => o.groupId === 'tools').map(
                        (opt) => {
                          const Icon = SERVICE_ICONS[opt.templateId] || Globe;
                          const active = templateId === opt.templateId;
                          return (
                            <button
                              type="button"
                              key={opt.templateId}
                              onClick={() => {
                                setTemplateId(opt.templateId);
                                setSkipProjectNameStep(false);
                                setSkipBrandColorStep(false);
                                setValidationHint('');
                              }}
                              data-testid={`modal-template-${opt.templateId}`}
                              style={
                                active
                                  ? {
                                      borderRadius: '12px',
                                      padding: '8px 10px',
                                      backgroundColor: '#063E31',
                                      borderColor: '#34D399',
                                      color: '#FFFFFF',
                                    }
                                  : {
                                      borderRadius: '12px',
                                      padding: '8px 10px',
                                      backgroundColor: '#070F24',
                                      borderColor: '#172E5C',
                                      color: '#E2E8F0',
                                    }
                              }
                              className="flex items-center justify-between gap-2 border text-right transition-colors hover:border-emerald-400"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '8px',
                                    backgroundColor: active ? '#059669' : '#0F1E42',
                                  }}
                                  className="flex items-center justify-center shrink-0"
                                >
                                  <Icon
                                    size={15}
                                    className={active ? 'text-white' : 'text-emerald-400'}
                                  />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-extrabold text-white">
                                    {opt.shortLabel}
                                  </p>
                                  <p className="line-clamp-1 text-[10px] text-slate-300">
                                    {opt.desc}
                                  </p>
                                </div>
                              </div>
                              {active && <Check size={14} className="text-emerald-300 shrink-0" />}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>

                {validationHint && (
                  <p className="text-xs font-bold text-rose-400" role="alert">
                    {validationHint}
                  </p>
                )}

                {/* Quota Reached Guidance Card */}
                {!templateQuotaCheck.allowed ? (
                  <div
                    data-testid="quota-limit-guidance-card"
                    style={{
                      borderRadius: '12px',
                      padding: '10px 12px',
                      backgroundColor: '#1E293B',
                      borderColor: '#F59E0B',
                    }}
                    className="border space-y-2"
                  >
                    <p className="text-xs font-extrabold text-amber-300">
                      {templateQuotaCheck.reason}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quota.existingWebsiteUsername && (
                        <button
                          type="button"
                          onClick={() =>
                            switchToServiceContext(quota.existingWebsiteUsername!, null)
                          }
                          style={{
                            borderRadius: '10px',
                            padding: '6px 12px',
                            backgroundColor: '#1D4ED8',
                            color: '#FFFFFF',
                            fontSize: '11px',
                          }}
                          className="font-extrabold"
                        >
                          فتح محادثة موقعي «{quota.existingWebsiteName}» وتعديله
                        </button>
                      )}
                      {quota.canCreateTool && (
                        <button
                          type="button"
                          onClick={() => {
                            setTemplateId('survey');
                            setValidationHint('');
                            setCreationStep('project_name');
                          }}
                          style={{
                            borderRadius: '10px',
                            padding: '6px 12px',
                            backgroundColor: '#059669',
                            color: '#FFFFFF',
                            fontSize: '11px',
                          }}
                          className="font-extrabold"
                        >
                          إنشاء أداة تفاعلية الآن ({quota.toolCount}/{quota.maxTools})
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={!isValidServiceTemplateId(templateId) || !templateQuotaCheck.allowed}
                      onClick={() => {
                        if (!isValidServiceTemplateId(templateId) || !templateQuotaCheck.allowed) {
                          setValidationHint('يرجى اختيار خدمة صالحة للمتابعة.');
                          return;
                        }
                        if (promptInputDraft.trim()) {
                          handleUserInitialPromptSubmit(promptInputDraft);
                          return;
                        }
                        setWelcomeCollapsed(true);
                        setCreationStep('project_name');
                      }}
                      data-testid="button-next-step-service"
                      style={{
                        borderRadius: '10px',
                        padding: '8px 18px',
                        backgroundColor: '#1D4ED8',
                        color: '#FFFFFF',
                        fontSize: '12px',
                      }}
                      className="inline-flex items-center gap-1.5 font-extrabold hover:bg-blue-600 disabled:opacity-50"
                    >
                      <span>متابعة: {currentServiceOption.shortLabel}</span>
                      <ArrowLeft size={14} />
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* ===============================================================
                ADAPTIVE STEP: PROJECT NAME & CUSTOM SLUG
            ================================================================ */}
            {creationStep === 'project_name' && (
              <section
                data-testid="active-step-project-name"
                style={{
                  borderRadius: '18px',
                  padding: '14px',
                  backgroundColor: '#0A1530',
                  borderColor: '#1E3A6E',
                }}
                className="border text-right space-y-3.5"
              >
                <div className="flex items-start gap-2.5">
                  <MiniBotAvatar size={34} />
                  <div>
                    <span className="text-[10.5px] font-extrabold text-sky-400">
                      {getStepLabelForTemplate('project_name', templateId)}
                    </span>
                    <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-white">
                      {currentServiceOption.botPraisePhrase}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-300">
                      {currentServiceOption.nameQuestion}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">
                      {currentServiceOption.nameQuestion} *
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-sky-500/40 bg-[#070E22] px-3 py-2">
                      <ActiveServiceIcon size={16} className="text-sky-400 shrink-0" />
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={siteName}
                        onChange={(e) => {
                          setSiteName(e.target.value);
                          if (validationHint) setValidationHint('');
                        }}
                        placeholder={`اكتب ${currentServiceOption.nameQuestion}`}
                        aria-label="اسم المشروع أو النشاط التجاري"
                        data-testid="input-site-name"
                        className="w-full bg-transparent text-right text-xs sm:text-sm font-extrabold text-white placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">
                      الرابط المخصص (اختياري)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={previewSlug}
                      aria-label="الرابط المخصص للموقع"
                      data-testid="input-site-username"
                      className="h-9 w-full rounded-xl border border-sky-500/30 bg-[#070E22] px-3 text-left font-mono text-xs font-bold text-sky-300 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                    />
                    <p dir="ltr" className="mt-1 text-right font-mono text-[10px] text-sky-400">
                      {siteUrl(previewSlug)}
                    </p>
                  </div>
                </div>

                {validationHint && (
                  <p className="text-xs font-bold text-rose-400" role="alert">
                    {validationHint}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCreationStep(getPrevCreationStep('project_name', activeDynamicSteps))
                    }
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    السابق
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!siteName.trim()) {
                        setValidationHint(`يرجى كتابة ${currentServiceOption.nameQuestion}`);
                        nameInputRef.current?.focus();
                        return;
                      }
                      setValidationHint('');
                      setCreationStep(getNextCreationStep('project_name', activeDynamicSteps));
                    }}
                    data-testid="button-next-step-name"
                    style={{
                      borderRadius: '10px',
                      padding: '8px 18px',
                      backgroundColor: '#1D4ED8',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    className="inline-flex items-center gap-1.5 font-extrabold hover:bg-blue-600"
                  >
                    <span>التالي: اختيار القالب</span>
                    <ArrowLeft size={14} />
                  </button>
                </div>
              </section>
            )}

            {/* ===============================================================
                ADAPTIVE STEP: VISUAL TEMPLATE GALLERY SELECTION
                (Includes inline color swatches when service is a compact tool!)
            ================================================================ */}
            {creationStep === 'template_style' && (
              <section
                data-testid="active-step-template-style"
                style={{
                  borderRadius: '18px',
                  padding: '14px',
                  backgroundColor: '#0A1530',
                  borderColor: '#1E3A6E',
                }}
                className="border space-y-3.5 text-right"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <MiniBotAvatar size={34} />
                    <div>
                      <span className="text-[10.5px] font-extrabold text-sky-400">
                        تصميم القالب والمظهر
                      </span>
                      <h2 className="text-xs sm:text-sm font-extrabold text-white">
                        {currentServiceOption.templateGalleryPrompt}
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAllPreviewModal(true)}
                    data-testid="button-preview-all-templates"
                    style={{
                      borderRadius: '10px',
                      padding: '5px 12px',
                      backgroundColor: '#13285C',
                      borderColor: '#2563EB',
                      color: '#E0F2FE',
                      fontSize: '11px',
                    }}
                    className="inline-flex items-center gap-1.5 border font-extrabold transition hover:border-sky-400"
                  >
                    <Sparkles size={12} className="text-sky-400" />
                    <span>معاينة الكل</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {primaryThreeCards.map((card) => (
                    <TemplateVisualPreviewCard
                      key={card.id}
                      card={card}
                      selected={templateStyle === card.style}
                      siteName={siteName}
                      themeColor={themeColor}
                      onSelect={() => {
                        setTemplateStyle(card.style);
                        if (card.style === 'cinematic') setDarkMode(true);
                      }}
                    />
                  ))}
                </div>

                {/* For Compact Tools (survey, vcard, rsvp, invoice), show quick color swatches right here */}
                {isCompactColorService && (
                  <div
                    style={{
                      borderRadius: '12px',
                      padding: '10px 12px',
                      backgroundColor: '#070F24',
                      borderColor: '#172E5C',
                    }}
                    className="border space-y-2"
                  >
                    <p className="text-xs font-extrabold text-slate-200">
                      {currentServiceOption.colorQuestion}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {CHAT_COLOR_SWATCHES.map((swatch) => {
                        const active = themeColor === swatch.hex;
                        return (
                          <button
                            type="button"
                            key={swatch.hex}
                            onClick={() => setThemeColor(swatch.hex)}
                            data-testid={`swatch-color-${swatch.hex}`}
                            style={{
                              borderRadius: '9999px',
                              padding: '4px 10px',
                              backgroundColor: active ? '#132A63' : '#0B1633',
                              borderColor: active ? '#38BDF8' : '#1E3A6E',
                              borderWidth: active ? '2px' : '1px',
                            }}
                            className="inline-flex items-center gap-1.5"
                          >
                            <span
                              style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '9999px',
                                backgroundColor: swatch.hex,
                              }}
                              className="inline-block border border-white/30"
                            />
                            <span className="text-[11px] font-bold text-white">{swatch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCreationStep(getPrevCreationStep('template_style', activeDynamicSteps))
                    }
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    السابق
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCreationStep(getNextCreationStep('template_style', activeDynamicSteps))
                    }
                    data-testid="button-next-step-template"
                    style={{
                      borderRadius: '10px',
                      padding: '8px 18px',
                      backgroundColor: '#1D4ED8',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    className="inline-flex items-center gap-1.5 font-extrabold hover:bg-blue-600"
                  >
                    <span>اعتماد القالب والتالي</span>
                    <ArrowLeft size={14} />
                  </button>
                </div>
              </section>
            )}

            {/* ===============================================================
                ADAPTIVE STEP: BRAND IDENTITY COLOR & DARK MODE
            ================================================================ */}
            {creationStep === 'brand_color' && (
              <section
                data-testid="active-step-brand-color"
                style={{
                  borderRadius: '18px',
                  padding: '14px',
                  backgroundColor: '#0A1530',
                  borderColor: '#1E3A6E',
                }}
                className="border text-right space-y-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <MiniBotAvatar size={34} />
                  <div>
                    <span className="text-[10.5px] font-extrabold text-sky-400">
                      لون الهوية والمظهر
                    </span>
                    <h2 className="text-xs sm:text-sm font-extrabold text-white">
                      {currentServiceOption.colorQuestion}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {CHAT_COLOR_SWATCHES.map((swatch) => {
                    const active = themeColor === swatch.hex;
                    return (
                      <button
                        type="button"
                        key={swatch.hex}
                        onClick={() => setThemeColor(swatch.hex)}
                        aria-label={swatch.label}
                        data-testid={`swatch-color-${swatch.hex}`}
                        style={{
                          borderRadius: '9999px',
                          padding: '6px 12px',
                          backgroundColor: active ? '#132A63' : '#070F24',
                          borderColor: active ? '#38BDF8' : '#172E5C',
                          borderWidth: active ? '2px' : '1px',
                        }}
                        className="inline-flex items-center gap-2 transition-colors hover:border-sky-400"
                      >
                        <span
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '9999px',
                            backgroundColor: swatch.hex,
                          }}
                          className="inline-block border border-white/30"
                        />
                        <span className="text-xs font-bold text-white">{swatch.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-0.5">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-extrabold text-slate-200">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      className="size-4 accent-sky-400"
                    />
                    <span>تفعيل الوضع الداكن افتراضياً لخدمتك</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCreationStep(getPrevCreationStep('brand_color', activeDynamicSteps))
                    }
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    السابق
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCreationStep(getNextCreationStep('brand_color', activeDynamicSteps))
                    }
                    data-testid="button-next-step-color"
                    style={{
                      borderRadius: '10px',
                      padding: '8px 18px',
                      backgroundColor: '#1D4ED8',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    className="inline-flex items-center gap-1.5 font-extrabold hover:bg-blue-600"
                  >
                    <span>التالي: {getStepLabelForTemplate('content_items', templateId)}</span>
                    <ArrowLeft size={14} />
                  </button>
                </div>
              </section>
            )}

            {/* ===============================================================
                ADAPTIVE STEP: SERVICE-SPECIFIC CONTENT, TOOLS & FIELDS
                (Tailored dynamically to templateId: store, restaurant, services,
                 portfolio, vcard, survey, booking, rsvp, invoice)
            ================================================================ */}
            {creationStep === 'content_items' && (
              <section
                data-testid="active-step-content-items"
                style={{
                  borderRadius: '18px',
                  padding: '14px',
                  backgroundColor: '#0A1530',
                  borderColor: '#1E3A6E',
                }}
                className="border text-right space-y-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <MiniBotAvatar size={34} />
                  <div>
                    <span className="text-[10.5px] font-extrabold text-sky-400">
                      {getStepLabelForTemplate('content_items', templateId)}
                    </span>
                    <h2 className="text-xs sm:text-sm font-extrabold text-white">
                      {templateId === 'vcard'
                        ? `أدخل حسابات التواصل والروابط الخاصة ببطاقة «${siteName.trim()}»`
                        : templateId === 'portfolio'
                        ? `أضف مهاراتك المهنية ونبذتك وأعمالك في «${siteName.trim()}»`
                        : templateId === 'survey'
                        ? `أضف أسئلة الاستبيان وطريقة الإجابة لـ «${siteName.trim()}»`
                        : templateId === 'booking'
                        ? `حدد الخدمات المتاحة للحجز وأوقات العمل لـ «${siteName.trim()}»`
                        : templateId === 'rsvp'
                        ? `أدخل موعد ومكان المناسبة وبرنامج الحفل لـ «${siteName.trim()}»`
                        : templateId === 'invoice'
                        ? `أضف باقات الأسعار وبنود الحاسبة لـ «${siteName.trim()}»`
                        : `أضف نبذة وعناصر (${itemNoun}) ورقم التواصل لـ «${siteName.trim()}»`}
                    </h2>
                  </div>
                </div>

                {/* Common or Template-Specific Top Fields */}
                {templateId === 'rsvp' ? (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300">
                        موعد وتاريخ الفعالية
                      </label>
                      <input
                        type="text"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="مثال: الخميس 25 نوفمبر · الساعة 8:00 مساءً"
                        className="mt-1 h-9 w-full rounded-xl border border-slate-700 bg-[#070E22] px-3 text-xs font-bold text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300">
                        موقع القاعة أو مكان المناسبة
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="مثال: الرياض — قاعة المؤتمرات الكبرى"
                        className="mt-1 h-9 w-full rounded-xl border border-slate-700 bg-[#070E22] px-3 text-xs font-bold text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300">
                        {templateId === 'vcard'
                          ? 'المسمى الوظيفي أو التعريف المختصر'
                          : 'العبارة الترحيبية العلوية (اختياري)'}
                      </label>
                      <input
                        type="text"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder={
                          templateId === 'vcard'
                            ? 'مثال: مستشار تطوير أعمال'
                            : 'عبارة ترحيبية مختصرة تظهر أعلى الصفحة'
                        }
                        className="mt-1 h-9 w-full rounded-xl border border-slate-700 bg-[#070E22] px-3 text-xs font-bold text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300">
                        رقم واتساب للتواصل واستقبال الطلبات
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={whatsapp}
                        onChange={(e) => {
                          setWhatsapp(e.target.value);
                          setPhone(e.target.value);
                        }}
                        placeholder="9665XXXXXXXX"
                        className="mt-1 h-9 w-full rounded-xl border border-slate-700 bg-[#070E22] px-3 text-left font-mono text-xs font-bold text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Portfolio Specific: Skills Input */}
                {templateId === 'portfolio' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300">
                      المهارات والتخصصات (افصل بينها بفاصلة)
                    </label>
                    <input
                      type="text"
                      value={skillsText}
                      onChange={(e) => setSkillsText(e.target.value)}
                      placeholder="مثال: تصميم الهوية البصرية، واجهات المستخدم، تجربة المستخدم"
                      data-testid="input-portfolio-skills"
                      className="mt-1 h-9 w-full rounded-xl border border-slate-700 bg-[#070E22] px-3 text-xs font-bold text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                )}

                {/* vCard Specific: Social Channels & Email */}
                {templateId === 'vcard' && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="mt-1 h-9 w-full rounded-xl border border-slate-700 bg-[#070E22] px-2.5 text-left font-mono text-xs text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300">
                        حساب إنستقرام
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@username"
                        className="mt-1 h-9 w-full rounded-xl border border-slate-700 bg-[#070E22] px-2.5 text-left font-mono text-xs text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300">
                        حساب X / تويتر
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="@username"
                        className="mt-1 h-9 w-full rounded-xl border border-slate-700 bg-[#070E22] px-2.5 text-left font-mono text-xs text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Booking Specific: Address & Working Hours */}
                {templateId === 'booking' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300">
                        عنوان المركز أو العيادة
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="مثال: الرياض — طريق الملك فهد"
                        className="mt-1 h-9 w-full rounded-xl border border-slate-700 bg-[#070E22] px-3 text-xs font-bold text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                      />
                    </div>

                    <div
                      style={{
                        borderRadius: '12px',
                        padding: '10px',
                        backgroundColor: '#070F24',
                        borderColor: '#172E5C',
                      }}
                      className="border space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-300">
                          <Clock size={13} />
                          <span>أوقات الدوام المتاحة للحجز ({hours.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setHours((prev) => [...prev, { day: '', time: '' }])
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-sky-300 hover:bg-slate-700"
                        >
                          <Plus size={12} />
                          <span>إضافة فترة دوام</span>
                        </button>
                      </div>
                      {hours.map((h, idx) => (
                        <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                          <input
                            type="text"
                            value={h.day}
                            onChange={(e) =>
                              setHours((prev) =>
                                prev.map((row, i) =>
                                  i === idx ? { ...row, day: e.target.value } : row
                                )
                              )
                            }
                            placeholder="الأيام (مثال: السبت - الخميس)"
                            className="h-8 rounded-lg border border-slate-700 bg-[#050B1A] px-2.5 text-xs text-white sm:col-span-5"
                          />
                          <input
                            type="text"
                            value={h.time}
                            onChange={(e) =>
                              setHours((prev) =>
                                prev.map((row, i) =>
                                  i === idx ? { ...row, time: e.target.value } : row
                                )
                              )
                            }
                            placeholder="الوقت (مثال: 9:00 ص - 9:00 م)"
                            className="h-8 rounded-lg border border-slate-700 bg-[#050B1A] px-2.5 text-xs text-white sm:col-span-6"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setHours((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="grid h-8 place-items-center rounded-lg border border-rose-500/35 bg-rose-500/15 text-rose-300 sm:col-span-1"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300">
                    {templateId === 'rsvp'
                      ? 'نص الدعوة والترحيب بالضيوف'
                      : templateId === 'survey'
                      ? 'رسالة توضيحية للمشاركين في الاستبيان'
                      : 'نبذة ووصف المشروع'}
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اكتب وصفاً مختصراً يظهر للزوار في واجهة الخدمة..."
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-[#070E22] p-2.5 text-xs font-medium text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                </div>

                {/* Service-Specific Collection Items Repeater */}
                <div
                  style={{
                    borderRadius: '14px',
                    padding: '12px',
                    backgroundColor: '#070F24',
                    borderColor: '#172E5C',
                  }}
                  className="border space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-sky-300">
                      {templateId === 'survey'
                        ? `أسئلة الاستبيان (${initialItems.length})`
                        : templateId === 'vcard'
                        ? `الروابط المميزة في البطاقة (${initialItems.length})`
                        : templateId === 'rsvp'
                        ? `فقرات برنامج الحفل (${initialItems.length})`
                        : templateId === 'invoice'
                        ? `باقات وبنود عرض السعر (${initialItems.length})`
                        : `العناصر (${itemNoun}) (${initialItems.length})`}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setInitialItems((prev) => [
                          ...prev,
                          {
                            name: '',
                            price: '',
                            duration: templateId === 'survey' ? 'rating' : '',
                            category: '',
                            description: '',
                          },
                        ])
                      }
                      data-testid="button-modal-add-item"
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-500"
                    >
                      <Plus size={12} />
                      <span>إضافة {itemNoun}</span>
                    </button>
                  </div>

                  {initialItems.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      يمكنك إضافة {itemNoun} الآن أو المتابعة للمعاينة وإضافتها لاحقاً من محادثة الخدمة.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {initialItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 gap-2 rounded-xl border border-slate-800 bg-[#0B1636] p-2.5 sm:grid-cols-12"
                        >
                          {templateId === 'survey' ? (
                            <>
                              <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) =>
                                  setInitialItems((prev) =>
                                    prev.map((entry, i) =>
                                      i === idx ? { ...entry, name: e.target.value } : entry
                                    )
                                  )
                                }
                                placeholder="نص السؤال *"
                                className="h-9 rounded-lg border border-slate-700 bg-[#050B1A] px-2.5 text-xs font-bold text-white placeholder:text-slate-500 sm:col-span-5"
                              />
                              <select
                                value={item.duration || 'rating'}
                                onChange={(e) =>
                                  setInitialItems((prev) =>
                                    prev.map((entry, i) =>
                                      i === idx ? { ...entry, duration: e.target.value } : entry
                                    )
                                  )
                                }
                                className="h-9 rounded-lg border border-slate-700 bg-[#050B1A] px-2 text-xs font-bold text-sky-300 sm:col-span-3"
                              >
                                {SURVEY_QUESTION_TYPE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={item.category || ''}
                                onChange={(e) =>
                                  setInitialItems((prev) =>
                                    prev.map((entry, i) =>
                                      i === idx ? { ...entry, category: e.target.value } : entry
                                    )
                                  )
                                }
                                placeholder="الخيارات (افصل بفاصلة)"
                                className="h-9 rounded-lg border border-slate-700 bg-[#050B1A] px-2.5 text-xs text-white placeholder:text-slate-500 sm:col-span-3"
                              />
                            </>
                          ) : templateId === 'vcard' ? (
                            <>
                              <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) =>
                                  setInitialItems((prev) =>
                                    prev.map((entry, i) =>
                                      i === idx ? { ...entry, name: e.target.value } : entry
                                    )
                                  )
                                }
                                placeholder="عنوان الرابط (مثال: المتجر أو لينكدإن)"
                                className="h-9 rounded-lg border border-slate-700 bg-[#050B1A] px-2.5 text-xs font-bold text-white placeholder:text-slate-500 sm:col-span-5"
                              />
                              <input
                                type="text"
                                dir="ltr"
                                value={item.price || ''}
                                onChange={(e) =>
                                  setInitialItems((prev) =>
                                    prev.map((entry, i) =>
                                      i === idx ? { ...entry, price: e.target.value } : entry
                                    )
                                  )
                                }
                                placeholder="https://..."
                                className="h-9 rounded-lg border border-slate-700 bg-[#050B1A] px-2.5 text-left font-mono text-xs text-sky-300 placeholder:text-slate-500 sm:col-span-6"
                              />
                            </>
                          ) : templateId === 'booking' || templateId === 'invoice' ? (
                            <>
                              <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) =>
                                  setInitialItems((prev) =>
                                    prev.map((entry, i) =>
                                      i === idx ? { ...entry, name: e.target.value } : entry
                                    )
                                  )
                                }
                                placeholder={`اسم الـ${itemNoun} *`}
                                className="h-9 rounded-lg border border-slate-700 bg-[#050B1A] px-2.5 text-xs font-bold text-white placeholder:text-slate-500 sm:col-span-4"
                              />
                              <input
                                type="text"
                                value={item.price || ''}
                                onChange={(e) =>
                                  setInitialItems((prev) =>
                                    prev.map((entry, i) =>
                                      i === idx ? { ...entry, price: e.target.value } : entry
                                    )
                                  )
                                }
                                placeholder="السعر / الرسوم"
                                className="h-9 rounded-lg border border-slate-700 bg-[#050B1A] px-2.5 text-xs font-bold text-white placeholder:text-slate-500 sm:col-span-3"
                              />
                              <input
                                type="text"
                                value={item.duration || ''}
                                onChange={(e) =>
                                  setInitialItems((prev) =>
                                    prev.map((entry, i) =>
                                      i === idx ? { ...entry, duration: e.target.value } : entry
                                    )
                                  )
                                }
                                placeholder={
                                  templateId === 'booking'
                                    ? 'المدة (مثال: 45 دقيقة)'
                                    : 'الدورية (مثال: شهرياً)'
                                }
                                className="h-9 rounded-lg border border-slate-700 bg-[#050B1A] px-2.5 text-xs text-white placeholder:text-slate-500 sm:col-span-4"
                              />
                            </>
                          ) : (
                            <>
                              <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) =>
                                  setInitialItems((prev) =>
                                    prev.map((entry, i) =>
                                      i === idx ? { ...entry, name: e.target.value } : entry
                                    )
                                  )
                                }
                                placeholder={`اسم الـ${itemNoun} *`}
                                className="h-9 rounded-lg border border-slate-700 bg-[#050B1A] px-2.5 text-xs font-bold text-white placeholder:text-slate-500 sm:col-span-5"
                              />
                              {templateId !== 'portfolio' && (
                                <input
                                  type="text"
                                  value={item.price || ''}
                                  onChange={(e) =>
                                    setInitialItems((prev) =>
                                      prev.map((entry, i) =>
                                        i === idx ? { ...entry, price: e.target.value } : entry
                                      )
                                    )
                                  }
                                  placeholder={
                                    templateId === 'rsvp' ? 'التوقيت (مثال: 8:30 م)' : 'السعر'
                                  }
                                  className="h-9 rounded-lg border border-slate-700 bg-[#050B1A] px-2.5 text-xs font-bold text-white placeholder:text-slate-500 sm:col-span-3"
                                />
                              )}
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) =>
                                  setInitialItems((prev) =>
                                    prev.map((entry, i) =>
                                      i === idx ? { ...entry, description: e.target.value } : entry
                                    )
                                  )
                                }
                                placeholder="وصف مختصر"
                                className={`h-9 rounded-lg border border-slate-700 bg-[#050B1A] px-2.5 text-xs font-medium text-white placeholder:text-slate-500 ${
                                  templateId === 'portfolio' ? 'sm:col-span-6' : 'sm:col-span-3'
                                }`}
                              />
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setInitialItems((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label="حذف العنصر"
                            className="grid h-9 place-items-center rounded-lg border border-rose-500/35 bg-rose-500/15 text-rose-300 sm:col-span-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCreationStep(getPrevCreationStep('content_items', activeDynamicSteps))
                    }
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    السابق
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreationStep('preview_publish')}
                    data-testid="button-next-step-content"
                    style={{
                      borderRadius: '10px',
                      padding: '8px 18px',
                      backgroundColor: '#1D4ED8',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    className="inline-flex items-center gap-1.5 font-extrabold hover:bg-blue-600"
                  >
                    <span>عرض المعاينة النهائية والنشر</span>
                    <ArrowLeft size={14} />
                  </button>
                </div>
              </section>
            )}

            {/* ===============================================================
                FINAL STAGE: LIVE PREVIEW & PUBLISH
            ================================================================ */}
            {creationStep === 'preview_publish' && (
              <section
                data-testid="active-step-preview-publish"
                style={{
                  borderRadius: '18px',
                  padding: '14px',
                  backgroundColor: '#0A1530',
                  borderColor: '#1E3A6E',
                }}
                className="border text-right space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <MiniBotAvatar size={34} />
                    <div>
                      <span className="text-[10.5px] font-extrabold text-emerald-400">
                        اكتمل إعداد مشروعك ✓
                      </span>
                      <h2 className="text-sm sm:text-base font-black text-white">
                        معاينة خدمتك «{siteName.trim()}» قبل النشر
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAllPreviewModal(true)}
                    style={{
                      borderRadius: '10px',
                      padding: '5px 12px',
                      backgroundColor: '#13285C',
                      borderColor: '#2563EB',
                      color: '#38BDF8',
                      fontSize: '11px',
                    }}
                    className="inline-flex items-center gap-1.5 border font-extrabold"
                  >
                    <Sparkles size={12} />
                    <span>تغيير القالب</span>
                  </button>
                </div>

                {/* Interactive Live Preview Card */}
                <div
                  style={{
                    borderRadius: '16px',
                    padding: '14px',
                    backgroundColor: darkMode ? '#090F22' : '#F8FAFC',
                    color: darkMode ? '#FFFFFF' : '#0F172A',
                    borderColor: themeColor,
                    borderWidth: '2px',
                  }}
                  className="space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-500/20 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          backgroundColor: themeColor,
                          color: '#FFFFFF',
                        }}
                        className="flex items-center justify-center font-black"
                      >
                        <ActiveServiceIcon size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-black">{siteName.trim()}</p>
                        <p dir="ltr" className="font-mono text-[10.5px] opacity-75">
                          {siteUrl(previewSlug)}
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        borderRadius: '9999px',
                        padding: '3px 10px',
                        backgroundColor: themeColor,
                        color: '#FFFFFF',
                        fontSize: '10.5px',
                      }}
                      className="font-bold"
                    >
                      {STYLE_LABELS[templateStyle]}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {tagline.trim() && (
                      <p
                        style={{ color: themeColor }}
                        className="text-xs font-extrabold tracking-wide"
                      >
                        {tagline.trim()}
                      </p>
                    )}
                    <h3 className="text-base sm:text-lg font-black">
                      {headline.trim() || siteName.trim()}
                    </h3>
                    <p className="text-xs opacity-80 leading-relaxed">
                      {description.trim() || currentServiceOption.desc}
                    </p>
                    {address.trim() && (
                      <p className="text-[11px] font-bold opacity-75">📍 {address.trim()}</p>
                    )}
                    {skillsText.trim() && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {skillsText
                          .split(/[,،\n]+/)
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((skill, i) => (
                            <span
                              key={i}
                              style={{ borderColor: themeColor }}
                              className="rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold"
                            >
                              {skill}
                            </span>
                          ))}
                      </div>
                    )}
                    {initialItems.filter((it) => it.name?.trim()).length > 0 && (
                      <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                        {initialItems
                          .filter((it) => it.name?.trim())
                          .slice(0, 4)
                          .map((it, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-slate-500/20 bg-black/5 px-3 py-2 text-xs"
                            >
                              <p className="font-extrabold">{it.name}</p>
                              {it.price && (
                                <p style={{ color: themeColor }} className="font-mono font-bold">
                                  {it.price}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                    <div className="pt-1.5">
                      <span
                        style={{
                          display: 'inline-block',
                          borderRadius: '10px',
                          padding: '6px 14px',
                          backgroundColor: themeColor,
                          color: '#FFFFFF',
                          fontSize: '11px',
                        }}
                        className="font-extrabold"
                      >
                        {ctaLabel.trim() || currentServiceOption.ctaPlaceholder}
                      </span>
                    </div>
                  </div>
                </div>

                {validationHint && (
                  <p className="text-xs font-bold text-rose-400" role="alert">
                    {validationHint}
                  </p>
                )}

                {/* Final Publish Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCreationStep(getPrevCreationStep('preview_publish', activeDynamicSteps))
                    }
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    السابق (تعديل البيانات)
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !templateQuotaCheck.allowed}
                    data-testid="button-submit-create-site"
                    style={{
                      borderRadius: '12px',
                      padding: '10px 22px',
                      backgroundColor: '#059669',
                      borderColor: '#34D399',
                      color: '#FFFFFF',
                      fontSize: '13px',
                    }}
                    className="inline-flex items-center gap-2 border font-extrabold transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {submitting ? (
                      <RefreshCw className="animate-spin" size={15} />
                    ) : (
                      <Rocket size={15} />
                    )}
                    <span>اعتماد ونشر الخدمة الآن ({siteName.trim()})</span>
                  </button>
                </div>
              </section>
            )}

            {/* Dynamic Conversational Turns from Bottom Chat Input */}
            {createMessages.map((msg) =>
              msg.sender === 'user' ? (
                <div
                  key={msg.id}
                  className="flex items-center justify-start gap-2.5"
                >
                  <span
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '9999px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                    }}
                    className="flex items-center justify-center shrink-0"
                  >
                    <User size={15} />
                  </span>
                  <div
                    style={{
                      borderRadius: '14px',
                      padding: '7px 14px',
                      backgroundColor: '#1D4ED8',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    className="font-bold"
                  >
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div
                  key={msg.id}
                  dir="ltr"
                  className="flex items-center justify-start gap-2.5"
                >
                  <MiniBotAvatar size={32} />
                  <div
                    dir="rtl"
                    style={{
                      borderRadius: '14px',
                      padding: '8px 13px',
                      backgroundColor: '#0D1B3E',
                      borderColor: '#1E3A6E',
                      color: '#E2E8F0',
                      fontSize: '12px',
                    }}
                    className="border font-medium whitespace-pre-line text-right"
                  >
                    {msg.text}
                  </div>
                </div>
              )
            )}

            <div ref={chatEndRef} />
          </form>
        )}
      </div>

      {/* =====================================================================
          BOTTOM STICKY SMART INPUT DOCK
          - Hidden on the initial service_type start card so two message inputs NEVER appear at the same time
          - Shown only after creation starts (creationStep !== 'service_type') or inside a published service conversation
      ====================================================================== */}
      {((studioContext === 'create' && creationStep !== 'service_type') ||
        studioContext.startsWith('service:')) && (
        <div
          data-testid="bottom-chat-dock"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            padding: '8px 10px',
            backgroundColor: '#050C1F',
            borderColor: '#172E5C',
          }}
          className="border-t"
        >
          <form
            onSubmit={handleChatBarSend}
            style={{
              maxWidth: '780px',
              margin: '0 auto',
              borderRadius: '14px',
              padding: '6px 8px',
              backgroundColor: '#0A1530',
              borderColor: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
            className="border"
          >
            <button
              type="submit"
              aria-label="إرسال الرد"
              data-testid="button-chat-send"
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',
                borderRadius: '10px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
              }}
              className="flex items-center justify-center transition hover:bg-blue-500"
            >
              <Send size={16} />
            </button>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                pendingStudioAssistant
                  ? 'اختر الخدمة المقصودة من الأزرار أعلاه أو اكتب اسمها (مثال: المطعم)...'
                  : activeServiceSummary
                  ? `اطلب تعديل أي جزء لـ «${activeServiceSummary.siteName}» أو لأي خدمة من خدماتك...`
                  : `اكتب إجابتك لمرحلة (${getStepLabelForTemplate(creationStep, templateId)})...`
              }
              aria-label="اكتب ردك هنا"
              data-testid="input-chat-reply"
              style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                fontSize: 'clamp(12px, 2.5vw, 13.5px)',
              }}
              className="px-2 text-right font-semibold placeholder:text-slate-400 focus:outline-none"
            />
          </form>
        </div>
      )}

      {/* =====================================================================
          LIVE INTERACTIVE TEMPLATE PREVIEW MODAL ("معاينة الكل")
      ====================================================================== */}
      {showAllPreviewModal && (
        <div
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-label="معاينة القوالب الحية"
          data-testid="modal-live-template-preview"
          style={{ backgroundColor: 'rgba(3, 7, 18, 0.92)' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3"
        >
          <div
            style={{
              maxWidth: '840px',
              width: '100%',
              maxHeight: '90vh',
              borderRadius: '20px',
              padding: '18px',
              backgroundColor: '#0A1530',
              borderColor: '#2563EB',
              color: '#FFFFFF',
            }}
            className="relative overflow-y-auto border space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  معاينة جميع أنماط قالب «{currentServiceOption.shortLabel}»
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  اختر النمط المناسب لمشروعك وتابع خطوات الإنشاء
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllPreviewModal(false)}
                aria-label="إغلاق المعاينة"
                className="flex size-8 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {currentServiceOption.visualCards.map((card) => (
                <TemplateVisualPreviewCard
                  key={card.id}
                  card={card}
                  selected={templateStyle === card.style}
                  siteName={siteName}
                  themeColor={themeColor}
                  onSelect={() => {
                    setTemplateStyle(card.style);
                    if (card.style === 'cinematic') setDarkMode(true);
                  }}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {CHAT_COLOR_SWATCHES.slice(0, 6).map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => setThemeColor(swatch.hex)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '9999px',
                      backgroundColor: swatch.hex,
                      borderColor: themeColor === swatch.hex ? '#FFFFFF' : 'transparent',
                      borderWidth: '2px',
                    }}
                    title={swatch.label}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAllPreviewModal(false)}
                style={{
                  borderRadius: '10px',
                  padding: '7px 16px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
                className="font-extrabold hover:bg-blue-600"
              >
                اعتماد القالب المختار
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConversationalServiceCreator;
