"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getCapaFromLugar } from "@/lib/fotos";
import { getLugarPublicPath } from "@/lib/lugarPublicPath";
import { ROTEIRO_RETURN_PATH } from "@/lib/roteiroDraft";
import { getBadgeParceiroLabel } from "@/lib/lugarBadges";
import {
  countRoteiroParadas,
  getRoteiroResumo,
  parseRoteiroMarkdown,
} from "@/lib/roteiroParse";

const MAX_ATIVIDADES = 2;
const MAX_ATIVIDADE_CHARS = 88;
const MAX_DICA_CHARS = 120;

/**
 * @param {string} text
 * @returns {string}
 */
function stripMarkdownBold(text) {
  return String(text || "").replace(/\*\*/g, "").trim();
}

/**
 * @param {string} text
 * @param {number} [max]
 * @returns {string}
 */
function truncateText(text, max = MAX_ATIVIDADE_CHARS) {
  const clean = stripMarkdownBold(text);
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}…`;
}

/**
 * @param {string[]} atividades
 * @returns {string[]}
 */
function summarizeAtividades(atividades) {
  return (atividades ?? [])
    .filter(Boolean)
    .slice(0, MAX_ATIVIDADES)
    .map((item) => truncateText(item));
}

/**
 * @param {import("@/lib/roteiroParse").RoteiroParada} parada
 * @param {Array<{ id: string, slug?: string|null }>} [lugaresCatalog]
 * @param {string} [returnPath]
 * @returns {string|null}
 */
function getParadaHref(parada, lugaresCatalog = [], returnPath = ROTEIRO_RETURN_PATH) {
  if (!parada.lugarId) return null;
  const lugar = lugaresCatalog.find((item) => String(item.id) === String(parada.lugarId));
  return getLugarPublicPath(lugar ?? { id: parada.lugarId }, { from: returnPath });
}

/**
 * Card de parada com foto, duração destacada e texto resumido.
 * @param {object} props
 * @param {import("@/lib/roteiroParse").RoteiroParada} props.parada
 * @param {boolean} [props.ehParceiro]
 * @param {string} [props.capaUrl]
 * @param {string} [props.lugarHref]
 * @returns {import("react").JSX.Element}
 */
function RoteiroParadaCard({ parada, ehParceiro = false, capaUrl = "", lugarHref = null }) {
  const atividades = summarizeAtividades(parada.atividades);
  const dica = parada.dica ? truncateText(parada.dica, MAX_DICA_CHARS) : "";
  const duracao = parada.duracao ? stripMarkdownBold(parada.duracao) : "";
  const nome = stripMarkdownBold(parada.nome);
  const temFoto = Boolean(capaUrl && parada.lugarId);

  const cardInner = (
    <>
      {temFoto ? (
        <div className="relative h-[5.5rem] w-full shrink-0 overflow-hidden bg-[#e8eeee] sm:h-24">
          <Image
            src={capaUrl}
            alt={nome}
            fill
            sizes="(max-width: 390px) 100vw, 390px"
            className="object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#1a2e28]/75 via-[#1a2e28]/20 to-transparent"
            aria-hidden
          />
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-xs font-bold text-[#1a4a3a] shadow-sm">
              {parada.ordem}
            </span>
            {duracao ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1a4a3a]/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm">
                <span aria-hidden>⏱</span>
                {duracao}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 border-b border-[#eef2f0] px-3 py-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a4a3a] text-xs font-bold text-white">
            {parada.ordem}
          </span>
          {duracao ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#d4ede8] px-2.5 py-1 text-[11px] font-bold text-[#1a4a3a]">
              <span aria-hidden>⏱</span>
              {duracao}
            </span>
          ) : null}
        </div>
      )}

      <div className="min-w-0 flex-1 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <h4 className="text-[15px] font-bold leading-snug text-[#1a2e28]">{nome}</h4>
          {ehParceiro ? (
            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              {getBadgeParceiroLabel()}
            </span>
          ) : null}
        </div>

        {atividades.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {atividades.map((item) => (
              <li
                key={`${parada.ordem}-${item.slice(0, 40)}`}
                className="flex gap-2 text-[13px] leading-snug text-[#3d4f4a]"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a4a3a]"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {dica ? (
          <div className="mt-2.5 flex gap-2 rounded-lg bg-[#f0f4f3] px-2.5 py-2 ring-1 ring-[#d4ede8]">
            <span className="shrink-0 text-sm leading-none" aria-hidden>
              💡
            </span>
            <p className="text-[12px] leading-snug text-[#3d4f4a]">{dica}</p>
          </div>
        ) : null}

        {lugarHref && !temFoto ? (
          <Link
            href={lugarHref}
            className="mt-2.5 inline-flex text-[13px] font-semibold text-[#1a4a3a] underline-offset-2 hover:underline"
          >
            Ver no guia →
          </Link>
        ) : null}
      </div>
    </>
  );

  if (lugarHref && temFoto) {
    return (
      <Link
        href={lugarHref}
        className="group block overflow-hidden rounded-xl border border-[#e3e9e6] bg-white shadow-sm transition-shadow hover:shadow-md"
      >
        {cardInner}
      </Link>
    );
  }

  return (
    <article className="overflow-hidden rounded-xl border border-[#e3e9e6] bg-white shadow-sm">
      {cardInner}
    </article>
  );
}

/**
 * Bloco de período (manhã/tarde/noite) com paradas em cards.
 * @param {object} props
 * @param {import("@/lib/roteiroParse").RoteiroPeriodo} props.periodo
 * @param {Map<string, boolean>} [props.parceiroPorLugarId]
 * @param {Map<string, string>} [props.capaPorLugarId]
 * @returns {import("react").JSX.Element|null}
 */
function RoteiroPeriodoBlock({ periodo, parceiroPorLugarId, capaPorLugarId, lugaresCatalog, returnPath }) {
  if (!periodo.paradas?.length) return null;

  return (
    <div className="mt-4 first:mt-2">
      <div className="flex items-center gap-2 border-l-[3px] border-[#1a4a3a] pl-2.5">
        <span className="text-base leading-none" aria-hidden>
          {periodo.emoji}
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#1a4a3a]">
          {periodo.label}
        </h3>
      </div>
      <div className="mt-2.5 space-y-2.5">
        {periodo.paradas.map((parada) => (
          <RoteiroParadaCard
            key={`${periodo.id}-${parada.ordem}-${parada.nome}`}
            parada={parada}
            ehParceiro={Boolean(
              parada.lugarId && parceiroPorLugarId?.get(String(parada.lugarId))
            )}
            capaUrl={
              parada.lugarId
                ? capaPorLugarId?.get(String(parada.lugarId)) ?? ""
                : ""
            }
            lugarHref={getParadaHref(parada, lugaresCatalog, returnPath)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Accordion de um dia do roteiro.
 * @param {object} props
 * @param {import("@/lib/roteiroParse").RoteiroDia} props.dia
 * @param {boolean} props.defaultOpen
 * @param {Map<string, boolean>} [props.parceiroPorLugarId]
 * @param {Map<string, string>} [props.capaPorLugarId]
 * @returns {import("react").JSX.Element}
 */
function RoteiroDiaAccordion({
  dia,
  defaultOpen,
  parceiroPorLugarId,
  capaPorLugarId,
  lugaresCatalog,
  returnPath,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const paradasNoDia =
    dia.periodos.reduce((acc, p) => acc + p.paradas.length, 0) +
    dia.paradasSemPeriodo.length;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e3e9e6] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#f7fbf9]"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1a4a3a]">
            Dia {dia.numero}
          </p>
          <h3 className="font-display text-base font-extrabold leading-snug text-[#1a2e28]">
            {stripMarkdownBold(dia.titulo.replace(/^dia\s*\d+\s*[—–-]?\s*/i, "")) ||
              dia.titulo}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-[#d4ede8] px-2.5 py-1 text-[11px] font-bold text-[#1a4a3a]">
            {paradasNoDia} {paradasNoDia === 1 ? "parada" : "paradas"}
          </span>
          <span
            className={`text-[#1a4a3a] transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▾
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-[#e8eeee] px-3 pb-4 pt-1 sm:px-4">
          {dia.periodos.map((periodo) => (
            <RoteiroPeriodoBlock
              key={periodo.id ?? periodo.label}
              periodo={periodo}
              parceiroPorLugarId={parceiroPorLugarId}
              capaPorLugarId={capaPorLugarId}
              lugaresCatalog={lugaresCatalog}
              returnPath={returnPath}
            />
          ))}
          {dia.paradasSemPeriodo.length > 0 ? (
            <div className="mt-3 space-y-2.5">
              {dia.paradasSemPeriodo.map((parada) => (
                <RoteiroParadaCard
                  key={`sem-periodo-${parada.ordem}-${parada.nome}`}
                  parada={parada}
                  ehParceiro={Boolean(
                    parada.lugarId && parceiroPorLugarId?.get(String(parada.lugarId))
                  )}
                  capaUrl={
                    parada.lugarId
                      ? capaPorLugarId?.get(String(parada.lugarId)) ?? ""
                      : ""
                  }
                  lugarHref={getParadaHref(parada, lugaresCatalog, returnPath)}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

/**
 * Timeline compacta do roteiro gerado ou salvo.
 * @param {object} props
 * @param {string} props.conteudo - Markdown do roteiro.
 * @param {string} [props.titulo]
 * @param {string} [props.diasLabel]
 * @param {string} [props.perfil]
 * @param {string[]} [props.interesses]
 * @param {Array<{ id: string, nome: string, imagem_url?: string, fotos?: unknown }>} [props.lugaresCatalog]
 * @param {boolean} [props.compactHeader=false] - Omitir header interno (pai já exibe título).
 * @returns {import("react").JSX.Element}
 */
export default function RoteiroItineraryView({
  conteudo,
  titulo = "",
  diasLabel = "",
  perfil = "",
  interesses = [],
  lugaresCatalog = [],
  compactHeader = false,
  className = "",
  returnPath = ROTEIRO_RETURN_PATH,
}) {
  const parsed = useMemo(
    () => parseRoteiroMarkdown(conteudo, lugaresCatalog),
    [conteudo, lugaresCatalog]
  );

  const parceiroPorLugarId = useMemo(() => {
    const map = new Map();
    for (const item of lugaresCatalog ?? []) {
      if (item?.id) {
        map.set(String(item.id), Boolean(item.ehParceiro));
      }
    }
    return map;
  }, [lugaresCatalog]);

  const capaPorLugarId = useMemo(() => {
    const map = new Map();
    for (const item of lugaresCatalog ?? []) {
      if (item?.id) {
        const capa = getCapaFromLugar(item);
        if (capa) map.set(String(item.id), capa);
      }
    }
    return map;
  }, [lugaresCatalog]);

  const resumo = getRoteiroResumo(parsed);
  const totalParadas = countRoteiroParadas(parsed);

  if (!conteudo?.trim()) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d4ede8] bg-[#f7fbf9] px-4 py-8 text-center">
        <p className="text-sm font-medium text-[#1a2e28]">
          Não foi possível montar o roteiro desta vez.
        </p>
        <p className="mt-1 text-sm text-[#5a6b66]">Tente gerar novamente.</p>
      </div>
    );
  }

  if (parsed.fallbackTexto && parsed.intro.length > 0) {
    return (
      <div className="space-y-3">
        {!compactHeader && titulo ? (
          <header>
            <h2 className="font-display text-lg font-extrabold text-[#1a2e28]">
              {titulo}
            </h2>
          </header>
        ) : null}
        <div className="rounded-2xl bg-white p-4 text-sm leading-relaxed text-[#3d4f4a] shadow-sm ring-1 ring-[#e8eeee]">
          {parsed.intro.map((line) => (
            <p key={line.slice(0, 48)} className="mb-2 last:mb-0">
              {stripMarkdownBold(line)}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (parsed.dias.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d4ede8] bg-[#f7fbf9] px-4 py-8 text-center">
        <p className="text-sm font-medium text-[#1a2e28]">
          Roteiro sem paradas estruturadas.
        </p>
        <p className="mt-1 text-sm text-[#5a6b66]">Gere novamente para reorganizar.</p>
      </div>
    );
  }

  const chips = [
    diasLabel,
    perfil,
    ...(interesses?.length ? [interesses.slice(0, 3).join(" · ")] : []),
  ].filter(Boolean);

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {!compactHeader ? (
        <header className="space-y-2">
          {titulo ? (
            <h2 className="font-display text-lg font-extrabold leading-tight text-[#1a2e28]">
              {titulo}
            </h2>
          ) : null}
          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-[#d4ede8] px-2.5 py-1 text-[11px] font-semibold text-[#1a4a3a]"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
          {resumo ? (
            <p className="text-xs text-[#5a6b66]">
              {resumo}
              {totalParadas > 0 ? " · Siga na ordem abaixo" : ""}
            </p>
          ) : null}
        </header>
      ) : null}

      {parsed.intro.length > 0 ? (
        <div className="rounded-xl border border-[#d4ede8] bg-[#f0f4f3] px-3 py-2.5 text-[13px] leading-snug text-[#3d4f4a]">
          {parsed.intro.slice(0, 2).map((line) => (
            <p key={line.slice(0, 48)}>{stripMarkdownBold(line)}</p>
          ))}
        </div>
      ) : null}

      <div className="space-y-3" role="list" aria-label="Dias do roteiro">
        {parsed.dias.map((dia, index) => (
          <RoteiroDiaAccordion
            key={`dia-${dia.numero}-${dia.titulo}`}
            dia={dia}
            defaultOpen={index === 0 || parsed.dias.length === 1}
            parceiroPorLugarId={parceiroPorLugarId}
            capaPorLugarId={capaPorLugarId}
            lugaresCatalog={lugaresCatalog}
            returnPath={returnPath}
          />
        ))}
      </div>
    </div>
  );
}
