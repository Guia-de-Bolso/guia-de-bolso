"use client";

/**
 * Toggle de notificações push no perfil (somente app nativo).
 * @param {object} props
 * @param {boolean} props.enabled
 * @param {boolean} [props.busy]
 * @param {(next: boolean) => void} props.onChange
 * @returns {import("react").JSX.Element | null}
 */
export default function PerfilPushToggleRow({ enabled, busy = false, onChange }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0f4f3] text-lg"
        aria-hidden
      >
        🔔
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#1a2e28]">Notificações push</p>
        <p className="mt-0.5 text-xs text-[#5a6b66]">
          Novidades, destaques e alertas do guia
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Ativar notificações push"
        disabled={busy}
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-[#1a4a3a]" : "bg-[#d5dfdb]"
        } ${busy ? "opacity-60" : ""}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
