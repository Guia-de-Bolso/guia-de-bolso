"use client";

import { getDetalhesFromPonto } from "@/lib/atrativoPontos";
import { ATRATIVO_SECTION_TITLE_CLASS, ATRATIVO_TIMELINE_CARD_CLASS } from "@/components/atrativos/atrativoDetalheTokens";

/**
 * Timeline dos pontos com checklist sincronizado ao progresso.
 * @param {object} props
 * @param {Array<object>} props.pontos
 * @param {(pontoId: string) => boolean} props.isPontoDone
 * @param {(pontoId: string) => void} props.onTogglePonto
 * @param {number} props.currentIndex
 * @param {(index: number) => void} [props.onOpenGuia]
 */
export default function AtrativoTimeline({
  pontos,
  isPontoDone,
  onTogglePonto,
  currentIndex = 0,
  onOpenGuia,
}) {
  if (!pontos.length) return null;

  return (
    <section className="mt-8">
      <h2 className={ATRATIVO_SECTION_TITLE_CLASS}>Pontos do percurso</h2>

      <div className="relative mt-6 space-y-5">
        <div
          className="absolute bottom-4 left-5 top-4 w-0.5 rounded-full bg-gradient-to-b from-[#1a4a3a]/50 via-[#b8d4cc] to-transparent"
          aria-hidden
        />

        {pontos.map((ponto, index) => {
          const detalhes = getDetalhesFromPonto(ponto);
          const ordem = ponto.ordem || index + 1;
          const titulo = ponto.nome || ponto.titulo || `Ponto ${ordem}`;
          const pontoId = String(ponto.id ?? "");
          const done = Boolean(pontoId && isPontoDone?.(pontoId));
          const isCurrent = index === currentIndex && !done;

          return (
            <div key={ponto.id || index} className="relative flex gap-4 pl-0.5">
              <button
                type="button"
                onClick={() => pontoId && onTogglePonto?.(pontoId)}
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-[0_4px_12px_rgba(26,74,58,0.35)] ring-4 ring-[#f0f4f3] transition-transform active:scale-95 ${
                  done
                    ? "bg-[#1a4a3a] text-white"
                    : isCurrent
                      ? "bg-[#2f7a62] text-white"
                      : "bg-white text-[#1a4a3a] ring-[#dce8e3]"
                }`}
                aria-pressed={done}
                aria-label={
                  done
                    ? `Desmarcar ponto ${ordem}: ${titulo}`
                    : `Marcar ponto ${ordem}: ${titulo}`
                }
              >
                {done ? "✓" : ordem}
              </button>

              <article
                className={`${ATRATIVO_TIMELINE_CARD_CLASS} p-4 ${
                  done ? "opacity-80" : ""
                } ${isCurrent ? "ring-[#1a4a3a]/35" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3
                    className={`min-w-0 flex-1 text-[15px] font-bold leading-snug ${
                      done ? "text-[#5a6b66] line-through decoration-[#1a4a3a]/30" : "text-[#1a2e28]"
                    }`}
                  >
                    {titulo}
                  </h3>
                  {onOpenGuia && (
                    <button
                      type="button"
                      onClick={() => onOpenGuia(index)}
                      className="shrink-0 text-xs font-semibold text-[#1a4a3a] underline-offset-2 transition-opacity active:opacity-70"
                    >
                      Abrir
                    </button>
                  )}
                </div>

                {detalhes.length > 0 && (
                  <ol className="mt-3 grid list-none gap-2.5 p-0">
                    {detalhes.map((detalhe, detalheIndex) => (
                      <li
                        key={detalhe.id || `${ponto.id}-${detalheIndex}`}
                        className="flex gap-2.5 text-[13px] leading-relaxed text-[#5a6b66]"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef5f2] text-[10px] font-bold text-[#1a4a3a]">
                          {detalhe.ordem || detalheIndex + 1}
                        </span>
                        <span className="min-w-0 flex-1">{detalhe.texto}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
}
