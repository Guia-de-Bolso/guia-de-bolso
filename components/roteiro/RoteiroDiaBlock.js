"use client";

import RoteiroParadaCard from "@/components/roteiro/RoteiroParadaCard";
import { IconChevron, IconPeriodo } from "@/components/roteiro/roteiroIcons";
import { tituloDiaRoteiro } from "@/lib/roteiroDisplay";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a4a3a]";

/**
 * @param {import("@/lib/roteiroParse").RoteiroDia} dia
 * @returns {import("@/lib/roteiroParse").RoteiroParada[]}
 */
function paradasDoDia(dia) {
  return [
    ...dia.periodos.flatMap((periodo) => periodo.paradas),
    ...dia.paradasSemPeriodo,
  ];
}

/**
 * @param {object} props
 * @param {import("@/lib/roteiroParse").RoteiroParada} props.parada
 * @param {import("@/lib/roteiroParse").RoteiroParada|undefined} props.proxima
 * @param {Map<string, object>} props.catalogoPorId
 * @param {(parada: import("@/lib/roteiroParse").RoteiroParada) => string|null} props.getHref
 * @param {(parada: import("@/lib/roteiroParse").RoteiroParada) => string|null} props.getDeslocamento
 * @param {(parada: import("@/lib/roteiroParse").RoteiroParada) => void} [props.onIrAgora]
 * @param {string|null} props.proximaKey
 * @param {number} props.diaNumero
 * @param {Set<string>} props.concluidas
 * @param {(key: string) => void} props.onToggle
 * @param {(dia: number, ordem: number) => string} props.paradaKey
 * @returns {import("react").JSX.Element}
 */
function ParadaComLigacao({
  parada,
  proxima,
  catalogoPorId,
  capaPorId,
  getHref,
  getDeslocamento,
  onIrAgora,
  proximaKey,
  diaNumero,
  concluidas,
  onToggle,
  paradaKey,
}) {
  const key = paradaKey(diaNumero, parada.ordem);
  const lugar = parada.lugarId ? catalogoPorId.get(String(parada.lugarId)) : null;
  const deslocamento = proxima ? getDeslocamento(parada, proxima) : null;

  return (
    <div>
      <RoteiroParadaCard
        parada={parada}
        capaUrl={parada.lugarId ? capaPorId.get(String(parada.lugarId)) ?? "" : ""}
        lugarHref={getHref(parada, lugar)}
        ehParceiro={Boolean(lugar?.ehParceiro)}
        ehProxima={proximaKey === key}
        concluida={concluidas.has(key)}
        onToggleConcluida={() => onToggle(key)}
        onIrAgora={onIrAgora ? () => onIrAgora(parada, lugar) : undefined}
      />
      {deslocamento ? (
        <p className="flex items-center gap-3 px-1 py-3 text-center text-[12px] leading-snug text-[#5a6b66]">
          <span className="h-px flex-1 bg-[#e3ebe8]" aria-hidden />
          <span className="max-w-[14rem]">{deslocamento}</span>
          <span className="h-px flex-1 bg-[#e3ebe8]" aria-hidden />
        </p>
      ) : (
        <div className="h-3" />
      )}
    </div>
  );
}

/**
 * Um dia do guia, com períodos e paradas em sequência.
 * @param {object} props
 * @param {import("@/lib/roteiroParse").RoteiroDia} props.dia
 * @param {boolean} props.open
 * @param {() => void} props.onToggle
 * @param {Map<string, object>} props.catalogoPorId
 * @param {Map<string, string>} props.capaPorId
 * @param {(parada: object, lugar: object|null) => string|null} props.getHref
 * @param {(atual: object, proxima: object) => string|null} props.getDeslocamento
 * @param {(parada: object, lugar: object|null) => void} [props.onIrAgora]
 * @param {string|null} props.proximaKey
 * @param {Set<string>} props.concluidas
 * @param {(key: string) => void} props.onToggleConcluida
 * @param {(dia: number, ordem: number) => string} props.paradaKey
 * @returns {import("react").JSX.Element}
 */
export default function RoteiroDiaBlock({
  dia,
  open,
  onToggle,
  catalogoPorId,
  capaPorId,
  getHref,
  getDeslocamento,
  onIrAgora,
  proximaKey,
  concluidas,
  onToggleConcluida,
  paradaKey,
}) {
  const titulo = tituloDiaRoteiro(dia.titulo);
  const sequencia = paradasDoDia(dia);
  const total = sequencia.length;
  const numero = String(dia.numero).padStart(2, "0");
  const proximaNoDia = new Map(
    sequencia.slice(0, -1).map((parada, index) => [parada.ordem, sequencia[index + 1]])
  );

  /**
   * @param {import("@/lib/roteiroParse").RoteiroParada[]} paradas
   * @returns {import("react").JSX.Element}
   */
  function renderParadas(paradas) {
    return paradas.map((parada) => (
      <ParadaComLigacao
        key={`${dia.numero}-${parada.ordem}-${parada.nome}`}
        parada={parada}
        proxima={proximaNoDia.get(parada.ordem)}
        catalogoPorId={catalogoPorId}
        capaPorId={capaPorId}
        getHref={getHref}
        getDeslocamento={getDeslocamento}
        onIrAgora={onIrAgora}
        proximaKey={proximaKey}
        diaNumero={dia.numero}
        concluidas={concluidas}
        onToggle={onToggleConcluida}
        paradaKey={paradaKey}
      />
    ));
  }

  return (
    <section
      id={`roteiro-dia-${dia.numero}`}
      data-dia={dia.numero}
      className="scroll-mt-16"
      aria-labelledby={`roteiro-dia-titulo-${dia.numero}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1a4a3a]">
            Dia {numero}
          </p>
          {titulo ? (
            <h3
              id={`roteiro-dia-titulo-${dia.numero}`}
              className="mt-1 font-display text-[1.45rem] font-bold leading-tight tracking-tight text-[#1a2e28]"
            >
              {titulo}
            </h3>
          ) : (
            <h3 id={`roteiro-dia-titulo-${dia.numero}`} className="sr-only">
              Dia {dia.numero}
            </h3>
          )}
          <p className="mt-1 text-sm text-[#5a6b66]">
            {total} {total === 1 ? "parada" : "paradas"}
          </p>
          {!open &&
          sequencia.some((parada) => paradaKey(dia.numero, parada.ordem) === proximaKey) ? (
            <p className="mt-1 text-[13px] font-semibold text-[#1a4a3a]">Próxima parada neste dia</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`roteiro-dia-painel-${dia.numero}`}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f3f7f6] text-[#1a4a3a] ${FOCUS_RING}`}
        >
          <span className="sr-only">{open ? "Recolher dia" : "Abrir dia"}</span>
          <IconChevron open={open} />
        </button>
      </div>

      {open ? (
      <div id={`roteiro-dia-painel-${dia.numero}`} className="roteiro-dia-panel pt-4">
            {dia.periodos.map((periodo) => (
              <div key={periodo.id ?? periodo.label} className="mb-2">
                <div className="mb-3 flex items-center gap-2.5 text-[#1a4a3a]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7f3ee]">
                    <IconPeriodo id={periodo.id} />
                  </span>
                  <h4 className="text-[13px] font-bold uppercase tracking-[0.14em]">
                    {periodo.label}
                  </h4>
                  <span className="h-px flex-1 bg-[#e3ebe8]" aria-hidden />
                </div>
                {renderParadas(periodo.paradas)}
              </div>
            ))}

            {dia.paradasSemPeriodo.length > 0 ? (
              <div>
                {dia.periodos.length > 0 ? (
                  <div className="mb-3 flex items-center gap-2.5 text-[#5a6b66]">
                    <h4 className="text-[13px] font-bold uppercase tracking-[0.14em]">
                      Outras paradas
                    </h4>
                    <span className="h-px flex-1 bg-[#e3ebe8]" aria-hidden />
                  </div>
                ) : null}
                {renderParadas(dia.paradasSemPeriodo)}
              </div>
            ) : null}
      </div>
      ) : (
        <div id={`roteiro-dia-painel-${dia.numero}`} hidden />
      )}
    </section>
  );
}
