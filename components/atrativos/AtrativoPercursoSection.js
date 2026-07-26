"use client";

import { useEffect, useState } from "react";
import AtrativoModoGuia from "@/components/atrativos/AtrativoModoGuia";
import { ATRATIVO_SECTION_TITLE_CLASS } from "@/components/atrativos/atrativoDetalheTokens";
import { useAtrativoPercursoProgresso } from "@/hooks/useAtrativoPercursoProgresso";

/**
 * Entrada do percurso interativo — CTA + progresso; mapa, pontos e dicas só no modo guia.
 * @param {object} props
 * @param {string|number} props.rotaId
 * @param {string} props.nome
 * @param {Array<object>} props.pontos
 * @param {Array<{ id?: string, texto?: string, ordem?: number }>} [props.dicas]
 * @param {(open: boolean) => void} [props.onGuiaOpenChange]
 */
export default function AtrativoPercursoSection({
  rotaId,
  nome,
  pontos = [],
  dicas = [],
  onGuiaOpenChange,
}) {
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
    resetProgresso,
  } = useAtrativoPercursoProgresso(rotaId, pontos);

  useEffect(() => {
    onGuiaOpenChange?.(guiaOpen);
    return () => onGuiaOpenChange?.(false);
  }, [guiaOpen, onGuiaOpenChange]);

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
          <h2 className={ATRATIVO_SECTION_TITLE_CLASS}>Percurso guiado</h2>
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
          Mapa, pontos e dicas no modo interativo
        </span>
      </button>

      <AtrativoModoGuia
        key={guiaSession}
        isOpen={guiaOpen}
        onClose={() => setGuiaOpen(false)}
        pontos={pontos}
        dicas={dicas}
        initialIndex={guiaIndex}
        isPontoDone={isPontoDone}
        setPontoDone={setPontoDone}
        nomeAtrativo={nome}
      />
    </section>
  );
}
