// localStorage / sessionStorage that can never throw.
//
// Real browsers throw on *access* (not just on write) in several common
// situations: Safari private mode, "block all cookies", locked-down in-app
// browsers (WhatsApp / Instagram / Facebook webviews — exactly where shared
// ORxai links get opened) and a full quota. An uncaught SecurityError during
// render is a white screen, and one inside a click handler is a button that
// "does nothing". This wrapper falls back to an in-memory map so the app keeps
// working for the current visit instead of crashing.

type Kind = 'localStorage' | 'sessionStorage';

export interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function createSafeStorage(kind: Kind): SafeStorage {
  const memory = new Map<string, string>();
  let native: Storage | null = null;
  try {
    if (typeof window !== 'undefined') {
      native = window[kind];
      void native.length; // access itself can throw
    }
  } catch {
    native = null;
  }

  return {
    getItem(key) {
      try {
        const value = native?.getItem(key);
        if (value !== null && value !== undefined) return value;
      } catch {
        // fall through to memory
      }
      return memory.get(key) ?? null;
    },
    setItem(key, value) {
      try {
        if (native) {
          native.setItem(key, value);
          memory.delete(key);
          return;
        }
      } catch {
        // quota exceeded / write blocked: keep it for this visit
      }
      memory.set(key, String(value));
    },
    removeItem(key) {
      try {
        native?.removeItem(key);
      } catch {
        // ignore
      }
      memory.delete(key);
    },
  };
}

export const safeLocalStorage = createSafeStorage('localStorage');
export const safeSessionStorage = createSafeStorage('sessionStorage');
