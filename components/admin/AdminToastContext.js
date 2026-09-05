"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * @typedef {"success"|"error"|"info"} AdminToastTone
 * @typedef {{ id: string, message: string, tone: AdminToastTone }} AdminToastItem
 */

const AdminToastContext = createContext(
  /** @type {{ showToast: (message: string, options?: { tone?: AdminToastTone, durationMs?: number }) => void }|null} */ (
    null
  )
);

/**
 * @param {AdminToastTone} tone
 * @returns {string}
 */
function toastToneClass(tone) {
  if (tone === "error") {
    return "bg-[#3d1f1f] text-[#ffd4d4] ring-[#ff8a8a]/30";
  }
  if (tone === "info") {
    return "bg-[#1a2e28] text-white ring-white/15";
  }
  return "bg-[#1a4a3a] text-white ring-[#d4ede8]/25";
}

/**
 * Provider de toasts do painel admin.
 * @param {{ children: import("react").ReactNode }} props
 * @returns {import("react").JSX.Element}
 */
export function AdminToastProvider({ children }) {
  const [toasts, setToasts] = useState(/** @type {AdminToastItem[]} */ ([]));

  const dismiss = useCallback((id) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((message, options = {}) => {
    const text = String(message || "").trim();
    if (!text) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tone = options.tone || "success";
    const durationMs = options.durationMs ?? 3500;

    setToasts((items) => [...items.slice(-4), { id, message: text, tone }]);

    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, durationMs);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[120] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg ring-1 backdrop-blur-sm ${toastToneClass(
              toast.tone
            )}`}
            role="status"
          >
            <span className="min-w-0 flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-lg px-1.5 py-0.5 text-xs font-bold opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Fechar aviso"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  );
}

/**
 * @returns {{ showToast: (message: string, options?: { tone?: AdminToastTone, durationMs?: number }) => void }}
 */
export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  return ctx || { showToast: () => {} };
}

/**
 * Consome `?saved=` / `?success=` na URL e exibe toast (uma vez).
 * @param {{ enabled?: boolean }} [options]
 */
export function useAdminFlashToast(options = {}) {
  const { enabled = true } = options;
  const { showToast } = useAdminToast();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const saved = url.searchParams.get("saved");
    const success = url.searchParams.get("success");

    /** @type {string|null} */
    let message = null;
    if (saved === "1" || success === "created") message = "Salvo com sucesso.";
    if (success === "updated") message = "Alterações salvas.";
    if (success === "created" && url.pathname.includes("roteiros")) {
      message = "Roteiro criado com sucesso.";
    }
    if (success === "updated" && url.pathname.includes("roteiros")) {
      message = "Roteiro atualizado com sucesso.";
    }
    if (success === "created" && url.pathname.includes("locais")) {
      message = "Local criado com sucesso.";
    }
    if (success === "updated" && url.pathname.includes("locais")) {
      message = "Local atualizado com sucesso.";
    }

    if (!message) return;

    showToast(message);
    url.searchParams.delete("saved");
    url.searchParams.delete("success");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next);
  }, [enabled, showToast]);
}
