"use client";

import Link from "next/link";
import PrefetchLink from "@/components/PrefetchLink";
import RemotePhoto from "@/components/shared/RemotePhoto";
import { useMemo, useState } from "react";
import { getCapaThumbFromAtrativo } from "@/lib/fotos";
import {
  CATEGORIAS_ATRATIVO,
  formatCategoriaAtrativoLabel,
  getCategoriaAtrativoMeta,
  normalizeCategoriaAtrativo,
} from "@/lib/atrativos";
import { resolveAtrativoDoDia } from "@/lib/atrativoDoDia";
import { getTagsFromAtrativo } from "@/lib/tags";

function IconClock({ className = "h-4 w-4" }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconPin({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </svg>
  );
}

function IconBolt({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 2L3 14h8l-1 8 11-13h-8l0-7z" />
    </svg>
  );
}

function getAtrativoNome(rota) {
  return rota.nome || rota.titulo || "Atrativo sem nome";
}

function formatDuracao(rota) {
  const minutos = rota.duracao_minutos;
  if (minutos === null || minutos === undefined) return "—";

  const totalMinutos = Number(minutos);
  if (!Number.isFinite(totalMinutos)) return "—";

  const horas = Math.floor(totalMinutos / 60);
  const mins = totalMinutos % 60;

  return horas > 0
    ? `${horas}h ${mins > 0 ? `${mins}m` : ""}`.trim()
    : `${mins}m`;
}

function formatDistancia(rota) {
  const value = rota.distancia_km ?? rota.distancia;
  if (!value) return "Distância livre";
  if (typeof value === "number") return `${value.toFixed(1)} km`;
  return String(value).includes("km") ? value : `${value} km`;
}

function dificuldadeClass(value) {
  const dificuldade = String(value || "").toLowerCase();
  if (dificuldade.includes("dif")) return "text-red-600";
  if (dificuldade.includes("mod") || dificuldade.includes("méd") || dificuldade.includes("med")) {
    return "text-amber-800";
  }
  return "text-[#1a4a3a]";
}

function CoverImage({
  rota,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 400px",
  compact = false,
}) {
  const foto = getCapaThumbFromAtrativo(rota);

  if (!foto) {
    return <div className={`${className} bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54]`} />;
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      <RemotePhoto
        src={foto}
        alt={getAtrativoNome(rota)}
        fill
        sizes={compact ? "112px" : sizes}
        quality={60}
        categoria="aventura"
        className="object-cover"
        priority={priority}
      />
    </div>
  );
}

function Metrics({ rota, compact = false }) {
  const dificuldade = rota.dificuldade || "Fácil";

  return (
    <div className={`flex flex-wrap items-center gap-3 ${compact ? "text-xs" : "text-sm"} text-[#5a6b66]`}>
      <span className="flex items-center gap-1">
        <IconClock />
        {formatDuracao(rota)}
      </span>
      <span className="flex items-center gap-1">
        <IconPin />
        {formatDistancia(rota)}
      </span>
      <span className={`flex items-center gap-1 font-semibold ${dificuldadeClass(dificuldade)}`}>
        <IconBolt />
        {dificuldade}
      </span>
    </div>
  );
}

function AtrativoTags({ rota }) {
  const tags = getTagsFromAtrativo(rota).slice(0, 3);
  if (tags.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="rounded-full bg-[#eef5f2] px-2.5 py-0.5 text-[11px] font-semibold text-[#1a4a3a]"
        >
          {tag.icone ? `${tag.icone} ` : ""}
          {tag.nome}
        </span>
      ))}
    </div>
  );
}

function AtrativoDoDiaCard({ rota, modo }) {
  const categoria = getCategoriaAtrativoMeta(rota.categoria);
  const badgeLabel = modo === "fixada" ? "📌 Atrativo do dia" : "🗓️ Atrativo do dia";

  return (
    <PrefetchLink
      href={`/atrativos/${rota.id}`}
      className="box-border block w-full min-w-0 max-w-full overflow-hidden rounded-2xl bg-white shadow-sm"
    >
      <div className="relative h-48 w-full min-w-0 overflow-hidden">
        <CoverImage rota={rota} className="h-full w-full" priority />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#1a4a3a] shadow-sm backdrop-blur-md">
          {badgeLabel}
        </span>
      </div>
      <div className="box-border min-w-0 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1a4a3a]">
          {categoria.icone} {categoria.nome}
        </p>
        <h2 className="mt-1 break-words text-2xl font-bold leading-tight text-[#1a2e28]">
          {getAtrativoNome(rota)}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#5a6b66]">
          {rota.descricao}
        </p>
        <AtrativoTags rota={rota} />
        <div className="mt-4">
          <Metrics rota={rota} />
        </div>
      </div>
    </PrefetchLink>
  );
}

function CompactRouteCard({ rota }) {
  const categoria = getCategoriaAtrativoMeta(rota.categoria);

  return (
    <PrefetchLink
      href={`/atrativos/${rota.id}`}
      className="box-border flex w-full min-w-0 max-w-full gap-3 overflow-hidden rounded-2xl bg-white p-3 shadow-sm"
    >
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
        <CoverImage rota={rota} className="h-full w-full" compact />
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1a4a3a]">
          {categoria.icone} {categoria.nome}
        </p>
        <h2 className="truncate text-base font-bold text-[#1a2e28]">{getAtrativoNome(rota)}</h2>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#5a6b66]">
          {rota.descricao}
        </p>
        <AtrativoTags rota={rota} />
        <div className="mt-2">
          <Metrics rota={rota} compact />
        </div>
      </div>
    </PrefetchLink>
  );
}

/**
 * Lista de atrativos com filtro por tipo de experiência.
 * @param {{ atrativos: Array<object> }} props
 * @returns {import("react").ReactElement}
 */
export default function AtrativosCatalogo({ atrativos }) {
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);

  const categoriasPresentes = useMemo(() => {
    const nomes = new Set(atrativos.map((item) => normalizeCategoriaAtrativo(item.categoria)));
    return CATEGORIAS_ATRATIVO.filter((item) => nomes.has(item.nome));
  }, [atrativos]);

  const atrativosFiltrados = useMemo(() => {
    if (!categoriaFiltro) return atrativos;
    return atrativos.filter(
      (item) => normalizeCategoriaAtrativo(item.categoria) === categoriaFiltro
    );
  }, [atrativos, categoriaFiltro]);

  const { rota: rotaDoDia, modo: modoAtrativoDoDia } = useMemo(
    () => resolveAtrativoDoDia(atrativosFiltrados),
    [atrativosFiltrados]
  );

  const outrosAtrativos = rotaDoDia
    ? atrativosFiltrados.filter((rota) => rota.id !== rotaDoDia.id)
    : atrativosFiltrados;

  return (
    <div className="box-border min-w-0 max-w-full overflow-hidden">
      {categoriasPresentes.length > 1 && (
        <div className="mb-4 min-w-0 max-w-full overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCategoriaFiltro(null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${
              categoriaFiltro === null
                ? "bg-[#1a4a3a] text-white"
                : "bg-white text-[#1a4a3a] shadow-sm"
            }`}
          >
            Todas
          </button>
          {categoriasPresentes.map((item) => (
            <button
              key={item.nome}
              type="button"
              onClick={() => setCategoriaFiltro(item.nome)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                categoriaFiltro === item.nome
                  ? "bg-[#1a4a3a] text-white"
                  : "bg-white text-[#1a4a3a] shadow-sm"
              }`}
            >
              {formatCategoriaAtrativoLabel(item.nome)}
            </button>
          ))}
          </div>
        </div>
      )}

      {atrativosFiltrados.length === 0 ? (
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-[#1a2e28]">
            Nenhum atrativo nesta categoria
          </h2>
          <p className="mt-2 text-sm text-[#5a6b66]">
            Tente outro filtro ou volte em breve.
          </p>
        </section>
      ) : (
        <ul className="grid w-full min-w-0 list-none gap-4 p-0">
          {rotaDoDia && (
            <li className="min-w-0">
              <AtrativoDoDiaCard rota={rotaDoDia} modo={modoAtrativoDoDia} />
            </li>
          )}
          {outrosAtrativos.map((rota) => (
            <li key={rota.id} className="min-w-0">
              <CompactRouteCard rota={rota} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
