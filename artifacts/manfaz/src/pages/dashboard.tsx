import { useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useLocation, useRoute, useSearch } from 'wouter';
import { ChatView, resetChatStore } from '@/components/dash/chat-view';
import { HomeView, ServicesView, SettingsView } from '@/components/dash/views';
import { getLocalAccount, useAccount, useLogout, type AccountWebsite } from '@/lib/account';

// Four screens, one page component, so signed-in state and the chat's unsaved
// drafts survive moving between them:
//   /dashboard           home      (summary, my services, recent activity)
//   /dashboard/chat      chat      (create + edit services with the assistant)
//   /dashboard/services  services  (all services + what the plan still allows)
//   /dashboard/settings  settings  (account, plan, assistant balance)
// Old links (/dashboard/site …) land on the chat, where editing now happens.
export default function Dashboard() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/dashboard/:section?');
  const section = params?.section ?? '';
  const search = useSearch();
  const account = useAccount();
  const logout = useLogout();
  const active = account.data || getLocalAccount();

  useEffect(() => {
    if (!account.isLoading && !active) navigate('/login', { replace: true });
  }, [account.isLoading, active, navigate]);

  // Links from the landing page ("/dashboard?create=1&template=store") predate the
  // chat screen: send them to the create flow there.
  useEffect(() => {
    if (section) return;
    const q = new URLSearchParams(search);
    if (q.get('create') === '1' || q.get('new') === '1') {
      const template = q.get('template');
      navigate(`/dashboard/chat?new=1${template ? `&template=${encodeURIComponent(template)}` : ''}`, { replace: true });
    }
  }, [section, search, navigate]);

  const sites: AccountWebsite[] = useMemo(
    () => (active?.websites?.length ? active.websites : active?.website ? [active.website] : []),
    [active],
  );

  const onLogout = () =>
    logout.mutate(undefined, {
      onSettled: () => {
        resetChatStore();
        navigate('/login', { replace: true });
      },
    });

  if (!active) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center" style={{ backgroundColor: '#F4F7FD' }} dir="rtl" role="status" aria-label="جارٍ التحميل">
        <Loader2 className="animate-spin" size={28} style={{ color: '#2563EB' }} />
      </div>
    );
  }

  switch (section) {
    case 'chat':
    case 'site':
      return <ChatView account={active} sites={sites} onLogout={onLogout} />;
    case 'services':
      return <ServicesView account={active} sites={sites} onLogout={onLogout} />;
    case 'settings':
      return <SettingsView account={active} onLogout={onLogout} />;
    default:
      return <HomeView account={active} sites={sites} onLogout={onLogout} />;
  }
}
