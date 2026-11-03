"use client";

import { useState } from "react";
import PrefetchLink from "@/components/PrefetchLink";
import RemotePhoto from "@/components/shared/RemotePhoto";
import { IconCheck, IconNavigate } from "@/components/roteiro/roteiroIcons";
import { getBadgeParceiroLabel } from "@/lib/lugarBadges";
import { duracaoRoteiroLimpa, textoRoteiroLimpo } from "@/lib/roteiroDisplay";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a4a3a]";

/**
 * Card de uma parada do guia.
 * @param {object} props
 * @param {import("@/lib/roteiroParse").RoteiroParada} props.parada
 * @param {string} [props.capaUrl]
 * @param {string|null} [props.lugarHref]
 * @param {boolean} [props.ehParceiro]
 * @param {boolean} [props.ehProxima]
 * @param {boolean} [props.concluida]
 * @param {() => void} [props.onToggleConcluida]
 * @param {() => void} [props.onIrAgora]
 * @returns {import("react").JSX.Element}
 */
export default function RoteiroParadaCard({
  parada,
  capaUrl = "",
  lugarHref = null,
  ehParceiro = false,
  ehProxima = false,
  concluida = false,
  onToggleConcluida,
  onIrAgora,
}) {
  const [expandida, setExpandida] = useState(false);
  const nome = textoRoteiroLimpo(parada.nome);
  const linhas = (parada.atividades ?? []).map(textoRoteiroLimpo).filter(Boolean);
  const dica = textoRoteiroLimpo(parada.dica);
  const duracao = duracaoRoteiroLimpa(parada.duracao);
  const textoLongo = `${linhas.join(" ")} ${dica}`.trim().length > 180;

  return (
    <article
      className={`overflow-hidden rounded-[22px] bg-white shadow-[0_10px_28px_rgba(26,46,40,0.06)] ring-1 transition-opacity ${
        ehProxima ? "ring-[#1a4a3a]" : "ring-[#e6eeeb]"
      } ${concluida ? "opacity-80" : ""}`}
    >
      {capaUrl ? (
        <div className="relative h-44 w-full bg-[#e7eeeb]">
          <RemotePhoto
            src={capaUrl}
            alt={nome}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#10241d]/50 to-transparent"
            aria-hidden
          />
          <span className="absolute bottom-3 left-3 flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-2 text-sm font-bold text-[#1a4a3a]">
            {concluida ? <IconCheck className="h-4 w-4" /> : parada.ordem}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 pt-4">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              concluida ? "bg-[#1a4a3a] text-white" : "bg-[#e7f3ee] text-[#1a4a3a]"
            }`}
          >
            {concluida ? <IconCheck className="h-4 w-4" /> : parada.ordem}
          </span>
          {!ehProxima ? null : (
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a4a3a]">
              Próxima parada
            </p>
          )}
        </div>
      )}

      <div className="px-4 pb-4 pt-3.5">
        {capaUrl && ehProxima ? (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a4a3a]">
            Próxima parada
          </p>
        ) : null}

        <h4
          className={`font-display text-[1.35rem] font-bold leading-tight tracking-tight text-[#1a2e28] ${
            concluida ? "line-through decoration-[#8aa399]" : ""
          }`}
        >
          {nome}
        </h4>

        {ehParceiro ? (
          <p className="mt-1 text-[12px] font-semibold text-[#8a6232]">
            {getBadgeParceiroLabel()}
          </p>
        ) : null}

        <div className={textoLongo && !expandida ? "line-clamp-4" : ""}>
          {linhas.map((linha) => (
            <p key={linha} className="mt-2 text-[15px] leading-relaxed text-[#3d4f4a]">
              {linha}
            </p>
          ))}
          {dica ? (
            <p className="mt-3 text-[14px] leading-relaxed text-[#3d4f4a]">
              <span className="font-semibold text-[#1a4a3a]">Recomendação. </span>
              {dica}
            </p>
          ) : null}
        </div>

        {textoLongo ? (
          <button
            type="button"
            onClick={() => setExpandida((valor) => !valor)}
            className={`mt-2 min-h-11 text-sm font-semibold text-[#1a4a3a] ${FOCUS_RING}`}
            aria-expanded={expandida}
          >
            {expandida ? "Mostrar menos" : "Mostrar mais"}
          </button>
        ) : null}

        {duracao ? (
          <p className="mt-3 text-[13px] font-medium text-[#5a6b66]">
            Duração sugerida: {duracao}
          </p>
        ) : null}

        {lugarHref || onIrAgora ? (
          <div className="mt-4 flex gap-2">
            {lugarHref ? (
              <PrefetchLink
                href={lugarHref}
                className={`flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-[#f0f4f3] px-3 text-sm font-semibold text-[#1a4a3a] transition-transform active:scale-[0.98] ${FOCUS_RING}`}
              >
                Ver lugar
              </PrefetchLink>
            ) : null}
            {onIrAgora ? (
              <button
                type="button"
                onClick={onIrAgora}
                className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#1a4a3a] px-3 text-sm font-semibold text-white transition-transform active:scale-[0.98] ${FOCUS_RING}`}
              >
                <IconNavigate />
                Ir agora
              </button>
            ) : null}
          </div>
        ) : null}

        {onToggleConcluida ? (
          <button
            type="button"
            onClick={onToggleConcluida}
            aria-pressed={concluida}
            className={`mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition-colors ${FOCUS_RING} ${
              concluida
                ? "border-[#1a4a3a] bg-[#e7f3ee] text-[#1a4a3a]"
                : "border-[#e1e8e5] bg-white text-[#3d4f4a]"
            }`}
          >
            {concluida ? <IconCheck /> : null}
            {concluida ? "Feita" : "Marcar como feita"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
