import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';

import { safeSessionStorage } from '@/lib/safe-storage';

import './index.css';

setBaseUrl(import.meta.env.VITE_API_URL || null);
setAuthTokenGetter(() =>
  safeSessionStorage.getItem('manfaz-admin-token')
);

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

// A deploy can remove the hashed chunk a stale tab still references. Vite emits
// this event when a lazy import fails; one guarded reload picks up the new build.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  if (!safeSessionStorage.getItem('orxai-chunk-reload')) {
    safeSessionStorage.setItem('orxai-chunk-reload', '1');
    window.location.reload();
  }
});

// Async errors never reach an error boundary; log them instead of letting them
// surface as an unhandled rejection that some webviews treat as fatal.
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection', event.reason);
});

// Registered after load so it never competes with the initial render for
// bandwidth/CPU. import.meta.env.BASE_URL (not a hardcoded "/") so this still
// resolves correctly wherever BASE_PATH places the build.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {
      console.error('Service worker registration failed', error);
    });
  });
}
