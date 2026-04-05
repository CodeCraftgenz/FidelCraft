import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  leaving: boolean;
}

interface ToastAPI {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-l-4 border-l-emerald-500 bg-slate-800 border border-slate-700',
  error: 'border-l-4 border-l-red-500 bg-slate-800 border border-slate-700',
  info: 'border-l-4 border-l-blue-500 bg-slate-800 border border-slate-700',
};

const VARIANT_ICONS: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const VARIANT_ICON_COLORS: Record<ToastVariant, string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-blue-400',
};

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;
const EXIT_ANIMATION_MS = 300;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = ++counterRef.current;
      setToasts(prev => {
        const next = [...prev, { id, message, variant, leaving: false }];
        // Trim oldest if over max
        if (next.length > MAX_TOASTS) {
          const excess = next.length - MAX_TOASTS;
          for (let i = 0; i < excess; i++) {
            const oldest = next[i];
            if (!oldest.leaving) oldest.leaving = true;
          }
          setTimeout(() => {
            setToasts(current => current.slice(excess));
          }, EXIT_ANIMATION_MS);
        }
        return next;
      });
      setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
    },
    [removeToast],
  );

  const api: ToastAPI = {
    success: useCallback((msg: string) => addToast(msg, 'success'), [addToast]),
    error: useCallback((msg: string) => addToast(msg, 'error'), [addToast]),
    info: useCallback((msg: string) => addToast(msg, 'info'), [addToast]),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[280px] max-w-[400px] ${VARIANT_STYLES[t.variant]} transition-all duration-300 ${
              t.leaving
                ? 'opacity-0 translate-x-4'
                : 'opacity-100 translate-x-0 animate-toast-in'
            }`}
          >
            <span className={`text-lg font-bold ${VARIANT_ICON_COLORS[t.variant]}`}>
              {VARIANT_ICONS[t.variant]}
            </span>
            <span className="text-sm text-slate-200 flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-200 text-sm ml-2 shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {/* Inline keyframes */}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(1rem) translateY(0.5rem); }
          to   { opacity: 1; transform: translateX(0) translateY(0); }
        }
        .animate-toast-in { animation: toast-in 0.3s ease-out; }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
