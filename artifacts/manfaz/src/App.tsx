import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { safeSessionStorage } from '@/lib/safe-storage';
import NotFound from '@/pages/not-found';
import Landing from '@/pages/landing';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

// Everything except the landing page is loaded on demand. Previously all pages
// (~9k lines: admin, login, dashboard, the public-site renderer) shipped in the
// first bundle, so a phone on a slow network sat on a blank screen until all of
// it had downloaded and parsed — just to show the home page.
const RELOAD_FLAG = 'orxai-chunk-reload';

function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().then(
      (module) => {
        safeSessionStorage.removeItem(RELOAD_FLAG);
        return module;
      },
      (error) => {
        // After a deploy, an open tab still points at chunk files that no longer
        // exist. One reload fetches the new build; the flag prevents a loop.
        if (!safeSessionStorage.getItem(RELOAD_FLAG)) {
          safeSessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
          return new Promise<never>(() => undefined);
        }
        safeSessionStorage.removeItem(RELOAD_FLAG);
        throw error;
      },
    ),
  );
}

const Admin = lazyPage(() => import('@/pages/admin'));
const Login = lazyPage(() => import('@/pages/login'));
const Dashboard = lazyPage(() => import('@/pages/dashboard'));
const PublicWebsite = lazyPage(() => import('@/pages/public-website'));

// Bounded retries: a flaky connection should not leave screens spinning for
// many seconds (the default is 3 retries with exponential backoff).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 15_000 },
    mutations: { retry: false },
  },
});

function PageFallback() {
  return (
    <div
      dir="rtl"
      role="status"
      aria-label="جارٍ التحميل"
      className="flex min-h-[100dvh] items-center justify-center bg-[#F8FAFC]"
      style={{ backgroundColor: '#F8FAFC' }}
    >
      <span
        className="size-8 animate-spin rounded-full border-[3px] border-[#CBD5E1] border-t-[#2563EB]"
        style={{ borderColor: '#CBD5E1', borderTopColor: '#2563EB' }}
      />
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/admin" component={Admin} />
          {/* Platform account: registered before /:username so these paths are never read as site names. */}
          <Route path="/login" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/dashboard/:section" component={Dashboard} />
          {/* Old shared links keep working; new sites are linked without the /site prefix. */}
          <Route path="/site/:username" component={PublicWebsite} />
          <Route path="/:username" component={PublicWebsite} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
