import LugarProse from "@/components/lugar/LugarProse";

/**
 * @param {"airbnb"|"legacy"} variant
 */
function HistoriaLivroIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 5.25A2.25 2.25 0 0 1 6.25 3H12v16.5H6.25A2.25 2.25 0 0 0 4 21.75V5.25Zm16 0A2.25 2.25 0 0 0 17.75 3H12v16.5h5.75A2.25 2.25 0 0 1 20 21.75V5.25Z" />
    </svg>
  );
}

/**
 * Bloco de História e cultura — visual distinto do card branco do Sobre.
 * @param {object} props
 * @param {string} props.texto
 * @param {boolean} props.expandido
 * @param {() => void} props.onMostrarMais
 * @param {"airbnb"|"legacy"} [props.variant]
 * @returns {import("react").ReactElement}
 */
export default function LugarHistoriaCulturaBlock({
  texto,
  expandido,
  onMostrarMais,
  variant = "airbnb",
}) {
  const isAirbnb = variant === "airbnb";
  const previewChars = isAirbnb ? 220 : 180;
  const showMais = !expandido && texto.length > previewChars;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4d5b8] bg-[#f6f0e4] shadow-[0_1px_2px_rgba(90,70,40,0.06)]">
      <div className="flex items-center gap-2 border-b border-[#eadcc4] bg-[#efe6d4]/80 px-4 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1a4a3a] text-[#f6f0e4]">
          <HistoriaLivroIcon className="h-4 w-4" />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5c4a28]">
          Memória do lugar
        </p>
      </div>
      <div className="px-4 py-4">
        <LugarProse
          texto={texto}
          expandido={expandido}
          clampClass={isAirbnb ? "line-clamp-6" : "line-clamp-4"}
          className={
            isAirbnb
              ? "text-[15px] leading-relaxed text-[#4a3f32]"
              : "text-sm leading-relaxed text-[#4a3f32]"
          }
        />
        {showMais && (
          <button
            type="button"
            onClick={onMostrarMais}
            className={`font-semibold text-[#1a4a3a] underline ${
              isAirbnb ? "mt-3 text-sm" : "mt-2 text-sm"
            }`}
          >
            Mostrar mais
          </button>
        )}
      </div>
    </div>
  );
}
