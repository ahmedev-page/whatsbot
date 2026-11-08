import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';

import './index.css';

setBaseUrl(import.meta.env.VITE_API_URL || null);
setAuthTokenGetter(() =>
  typeof window !== 'undefined' ? sessionStorage.getItem('manfaz-admin-token') : null
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

// Registered after load so it never competes with the initial render for
// bandwidth/CPU. import.meta.env.BASE_URL (not a hardcoded "/") so this still
// resolves correctly wherever BASE_PATH places the build.
if (typeof window !== 'undefined' && 'caches' in window) {
  caches
    .keys()
    .then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== 'orxai-assets-v4')
          .map((key) => caches.delete(key)),
      ),
    )
    .catch(() => undefined);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((reg) => {
        reg.update().catch(() => undefined);
      })
      .catch((error) => {
        console.error('Service worker registration failed', error);
      });
  });
}
