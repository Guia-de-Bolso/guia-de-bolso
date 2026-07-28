"use client";

import { useState } from "react";
import {
  formatAvaliacaoDate,
  getDistribuicaoEstrelas,
  getFotoAutorAvaliacao,
  getIniciaisAutor,
  getNomeAutorAvaliacao,
  getResumoNotas,
  getNotaEmoji,
  parseAspectos,
} from "@/lib/avaliacoes";

const ASPECTOS_INICIAIS = 3;

/**
 * @param {{ nota: number, className?: string }} props
 * @returns {import("react").JSX.Element}
 */
function EstrelasNota({ nota, className = "" }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${nota} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <span
          key={value}
          className={value <= nota ? "text-amber-400" : "text-gray-200"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

/**
 * @param {object} props
 * @param {Array<object>} props.avaliacoes
 * @returns {import("react").JSX.Element}
 */
function DistribuicaoEstrelas({ avaliacoes }) {
  const dist = getDistribuicaoEstrelas(avaliacoes);
  const max = Math.max(...Object.values(dist), 1);

  return (
    <div className="mt-4 space-y-1.5">
      {[5, 4, 3, 2, 1].map((estrelas) => {
        const count = dist[estrelas] || 0;
        const width = max > 0 ? Math.round((count / max) * 100) : 0;
        return (
          <div key={estrelas} className="flex items-center gap-2 text-xs text-[#5a6b66]">
            <span className="w-6 shrink-0 font-medium">{estrelas}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8eeee]">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right tabular-nums">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} props.avaliacao
 * @returns {import("react").JSX.Element}
 */
function AvaliacaoCard({ avaliacao }) {
  const [aspectosAbertos, setAspectosAbertos] = useState(false);
  const nome = getNomeAutorAvaliacao(avaliacao);
  const fotoUrl = getFotoAutorAvaliacao(avaliacao);
  const aspectos = parseAspectos(avaliacao.aspectos);
  const temExtras = aspectos.length > ASPECTOS_INICIAIS;
  const visiveis =
    aspectosAbertos || !temExtras
      ? aspectos
      : aspectos.slice(0, ASPECTOS_INICIAIS);
  const extras = aspectos.length - ASPECTOS_INICIAIS;

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e8eeee]">
      <div className="flex items-start gap-3">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d4ede8] text-sm font-bold text-[#1a4a3a]">
            {getIniciaisAutor(nome)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[#1a2e28]">{nome}</p>
              <EstrelasNota nota={Number(avaliacao.nota) || 0} className="mt-0.5 text-sm" />
            </div>
            <span
              className="shrink-0 text-base"
              title={`${Number(avaliacao.nota) || 0} de 5 estrelas`}
              aria-hidden
            >
              {getNotaEmoji(avaliacao.nota)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#9aa8a3]">
            {formatAvaliacaoDate(avaliacao.created_at)}
          </p>
        </div>
      </div>

      {aspectos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visiveis.map((aspecto) => (
            <span
              key={aspecto}
              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
            >
              {aspecto}
            </span>
          ))}
          {temExtras && !aspectosAbertos && (
            <button
              type="button"
              onClick={() => setAspectosAbertos(true)}
              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-[#1a4a3a] underline-offset-2 hover:bg-[#e8eeee] hover:underline"
              aria-expanded="false"
            >
              e mais {extras}
            </button>
          )}
          {temExtras && aspectosAbertos && (
            <button
              type="button"
              onClick={() => setAspectosAbertos(false)}
              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-[#5a6b66] hover:bg-[#e8eeee]"
              aria-expanded="true"
            >
              ver menos
            </button>
          )}
        </div>
      )}

      {avaliacao.comentario?.trim() && (
        <p className="mt-3 text-sm leading-relaxed text-[#5a6b66]">
          {avaliacao.comentario}
        </p>
      )}
    </article>
  );
}

/**
 * Seção de avaliações aprovadas na página do lugar.
 * @param {object} props
 * @param {Array<object>} props.avaliacoes
 * @param {boolean} props.jaAvaliou
 * @param {() => void} props.onAvaliar
 * @param {string} [props.toast]
 * @returns {import("react").JSX.Element}
 */
export default function LugarAvaliacoesSection({
  avaliacoes,
  jaAvaliou,
  onAvaliar,
  toast = "",
}) {
  const { media, total } = getResumoNotas(avaliacoes);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[#1a2e28]">Avaliações</h2>
        {!jaAvaliou && (
          <button
            type="button"
            onClick={onAvaliar}
            className="shrink-0 rounded-full bg-[#1a4a3a] px-4 py-2 text-xs font-semibold text-white"
          >
            Avaliar
          </button>
        )}
      </div>

      {toast && (
        <p
          className="mt-3 rounded-xl bg-[#d4ede8] px-3 py-2.5 text-sm text-[#1a4a3a]"
          role="status"
        >
          {toast}
        </p>
      )}

      {total === 0 ? (
        jaAvaliou ? (
          <div
            className="mt-4 rounded-2xl border border-[#b8e6d8] bg-[#e8f5f0] px-4 py-3.5 text-sm leading-relaxed text-[#1a4a3a]"
            role="status"
          >
            <p className="font-semibold">Obrigado pela sua avaliação!</p>
            <p className="mt-1 text-[#2d5c4a]">
              Sua avaliação foi recebida e será analisada pela nossa equipe antes
              de aparecer aqui.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#9aa8a3]">
            Seja o primeiro a avaliar este lugar
          </p>
        )
      ) : (
        <>
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e8eeee]">
            <div className="flex items-end gap-4">
              <p className="text-4xl font-bold text-[#1a2e28]">
                {media.toFixed(1)}
              </p>
              <div>
                <EstrelasNota nota={Math.round(media)} className="text-lg" />
                <p className="mt-0.5 text-xs text-[#9aa8a3]">
                  {total} {total === 1 ? "avaliação" : "avaliações"}
                </p>
              </div>
            </div>
            <DistribuicaoEstrelas avaliacoes={avaliacoes} />
          </div>

          <ul className="mt-4 space-y-3">
            {avaliacoes.map((avaliacao) => (
              <li key={avaliacao.id}>
                <AvaliacaoCard avaliacao={avaliacao} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
