"use client";

import { useEffect, useState } from "react";
import { getDetalhesFromPonto } from "@/lib/atrativoPontos";
import { useBottomSheetBodyLock } from "@/hooks/useBottomSheetBodyLock";

/**
 * @param {number} initialIndex
 * @param {number} length
 * @returns {number}
 */
function clampIndex(initialIndex, length) {
  if (length <= 0) return 0;
  return Math.min(Math.max(0, initialIndex), length - 1);
}

/**
 * Modo guia: um ponto por vez, com progresso e checklist.
 * Remonte com `key` ao abrir para resetar o índice inicial.
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {Array<object>} props.pontos
 * @param {Array<{ id?: string, texto?: string, ordem?: number }>} [props.dicas]
 * @param {number} props.initialIndex
 * @param {(pontoId: string) => boolean} props.isPontoDone
 * @param {(pontoId: string, done: boolean) => void} props.setPontoDone
 * @param {string} [props.nomeAtrativo]
 */
export default function AtrativoModoGuia({
  isOpen,
  onClose,
  pontos = [],
  dicas = [],
  initialIndex = 0,
  isPontoDone,
  setPontoDone,
  nomeAtrativo = "Percurso",
}) {
  const [index, setIndex] = useState(() => clampIndex(initialIndex, pontos.length));

  useBottomSheetBodyLock(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return undefined;
    document.documentElement.classList.add("guia-percurso-ativo");
    return () => {
      document.documentElement.classList.remove("guia-percurso-ativo");
    };
  }, [isOpen]);

  if (!isOpen || pontos.length === 0) return null;

  const ponto = pontos[index] ?? pontos[0];
  const safeIndex = pontos[index] ? index : 0;
  const ordem = ponto?.ordem || safeIndex + 1;
  const titulo = ponto?.nome || ponto?.titulo || `Ponto ${ordem}`;
  const detalhes = getDetalhesFromPonto(ponto);
  const pontoId = String(ponto?.id ?? "");
  const done = Boolean(pontoId && isPontoDone?.(pontoId));
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === pontos.length - 1;
  const progressLabel = `${safeIndex + 1} de ${pontos.length}`;
  const dicasValidas = dicas.filter((dica) => dica?.texto?.trim());

  function handleMarcarEAvancar() {
    if (pontoId) setPontoDone?.(pontoId, true);
    if (!isLast) {
      setIndex((current) => Math.min(pontos.length - 1, current + 1));
      return;
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#0f2a22] text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`Guia do percurso: ${nomeAtrativo}`}
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-3 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Modo guia
            </p>
            <p className="truncate text-sm font-medium text-white/80">{nomeAtrativo}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition-colors active:bg-white/20"
          >
            Fechar
          </button>
        </header>

        <div className="pb-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[#7dcfb6] transition-[width] duration-300 ease-out"
              style={{ width: `${((safeIndex + 1) / pontos.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-white/60">{progressLabel}</p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col pt-5">
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-[#1a4a3a] to-[#12352b] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#7dcfb6]/15 blur-2xl"
              aria-hidden
            />

            <div className="relative flex items-center gap-3">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                  done ? "bg-[#7dcfb6] text-[#0f2a22]" : "bg-white text-[#1a4a3a]"
                }`}
              >
                {done ? "✓" : ordem}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
                  Ponto {ordem}
                </p>
                <h2 className="font-display text-[1.65rem] font-bold leading-tight tracking-tight">
                  {titulo}
                </h2>
              </div>
            </div>

            <div className="relative mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
              {detalhes.length > 0 ? (
                <ol className="grid list-none gap-3 p-0">
                  {detalhes.map((detalhe, detalheIndex) => (
                    <li
                      key={detalhe.id || `${pontoId}-${detalheIndex}`}
                      className="rounded-2xl bg-white/8 px-4 py-3 text-[15px] leading-relaxed text-white/90 ring-1 ring-white/10"
                    >
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-[#7dcfb6]">
                        {detalhe.ordem || detalheIndex + 1}
                      </span>
                      {detalhe.texto}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[15px] leading-relaxed text-white/70">
                  Sem instruções neste ponto — siga para o próximo marco da trilha.
                </p>
              )}

              {isFirst && dicasValidas.length > 0 ? (
                <div className="mt-5 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
                    Dicas do percurso
                  </p>
                  <ul className="mt-3 grid list-none gap-2.5 p-0">
                    {dicasValidas.map((dica, dicaIndex) => (
                      <li
                        key={dica.id || `dica-${dicaIndex}`}
                        className="flex gap-2.5 text-[14px] leading-relaxed text-white/85"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-[#7dcfb6]">
                          {dica.ordem || dicaIndex + 1}
                        </span>
                        <span>{dica.texto.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-2.5 pb-1">
            <button
              type="button"
              onClick={handleMarcarEAvancar}
              className="w-full rounded-2xl bg-[#7dcfb6] px-5 py-4 text-center text-[15px] font-bold text-[#0f2a22] shadow-[0_10px_28px_rgba(125,207,182,0.28)] transition-transform active:scale-[0.98]"
            >
              {done
                ? isLast
                  ? "Concluir guia"
                  : "Próximo ponto"
                : isLast
                  ? "Marcar e concluir"
                  : "Estou aqui · próximo"}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isFirst}
                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={isLast}
                onClick={() => setIndex((current) => Math.min(pontos.length - 1, current + 1))}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                Pular
              </button>
            </div>

            {pontoId && (
              <button
                type="button"
                onClick={() => setPontoDone?.(pontoId, !done)}
                className="py-2 text-center text-xs font-semibold text-white/55 underline-offset-2 transition-colors active:text-white/80"
              >
                {done ? "Desmarcar este ponto" : "Só marcar sem avançar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
