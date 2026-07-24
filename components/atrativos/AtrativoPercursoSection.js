"use client";

import { useState } from "react";
import AtrativoMapaIlustrado from "@/components/atrativos/AtrativoMapaIlustrado";
import AtrativoModoGuia from "@/components/atrativos/AtrativoModoGuia";
import AtrativoTimeline from "@/components/atrativos/AtrativoTimeline";
import { ATRATIVO_SECTION_TITLE_CLASS } from "@/components/atrativos/atrativoDetalheTokens";
import { useAtrativoPercursoProgresso } from "@/hooks/useAtrativoPercursoProgresso";

/**
 * Percurso interativo: mapa ilustrado, checklist e modo guia.
 * @param {object} props
 * @param {string|number} props.rotaId
 * @param {string} props.nome
 * @param {Array<object>} props.pontos
 */
export default function AtrativoPercursoSection({ rotaId, nome, pontos = [] }) {
  const [guiaOpen, setGuiaOpen] = useState(false);
  const [guiaIndex, setGuiaIndex] = useState(0);
  const [guiaSession, setGuiaSession] = useState(0);

  const {
    completedCount,
    total,
    percentual,
    proximoIndex,
    isComplete,
    isPontoDone,
    setPontoDone,
    togglePonto,
    resetProgresso,
  } = useAtrativoPercursoProgresso(rotaId, pontos);

  if (!pontos.length) return null;

  function openGuia(index) {
    setGuiaIndex(typeof index === "number" ? index : proximoIndex);
    setGuiaSession((current) => current + 1);
    setGuiaOpen(true);
  }

  const ctaLabel = isComplete
    ? "Rever no modo guia"
    : completedCount > 0
      ? "Continuar percurso"
      : "Começar percurso";

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className={ATRATIVO_SECTION_TITLE_CLASS}>Seu percurso</h2>
          <p className="mt-1 text-sm text-[#5a6b66]">
            {isComplete
              ? "Percurso concluído — parabéns!"
              : `${completedCount} de ${total} pontos · ${percentual}%`}
          </p>
        </div>
        {completedCount > 0 && (
          <button
            type="button"
            onClick={resetProgresso}
            className="shrink-0 text-xs font-semibold text-[#8a9a94] underline-offset-2 transition-opacity active:opacity-70"
          >
            Reiniciar
          </button>
        )}
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e4eeea]">
        <div
          className="h-full rounded-full bg-[#1a4a3a] transition-[width] duration-300 ease-out"
          style={{ width: `${percentual}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => openGuia(proximoIndex)}
        className="mt-4 flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#1a4a3a] px-5 py-4 text-white shadow-[0_8px_28px_rgba(26,74,58,0.28)] transition-transform active:scale-[0.98]"
      >
        <span className="text-[15px] font-bold tracking-wide">{ctaLabel}</span>
        <span className="text-[11px] font-medium text-white/70">
          Um ponto por vez · progresso salvo neste aparelho
        </span>
      </button>

      <div className="mt-5">
        <AtrativoMapaIlustrado
          pontos={pontos}
          isPontoDone={isPontoDone}
          currentIndex={isComplete ? -1 : proximoIndex}
          onPinClick={openGuia}
        />
      </div>

      <AtrativoTimeline
        pontos={pontos}
        isPontoDone={isPontoDone}
        onTogglePonto={togglePonto}
        currentIndex={isComplete ? -1 : proximoIndex}
        onOpenGuia={openGuia}
      />

      <AtrativoModoGuia
        key={guiaSession}
        isOpen={guiaOpen}
        onClose={() => setGuiaOpen(false)}
        pontos={pontos}
        initialIndex={guiaIndex}
        isPontoDone={isPontoDone}
        setPontoDone={setPontoDone}
        nomeAtrativo={nome}
      />
    </section>
  );
}
