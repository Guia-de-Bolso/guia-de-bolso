"use client";

import { useState } from "react";
import Link from "next/link";
import IconBack from "@/components/IconBack";
import { HOME_CONTEXT_PILL_CLASS } from "@/components/home/homeTokens";

/**
 * Hero editorial da listagem por categoria — capa, contexto e métricas.
 */
export default function CategoriaHero({
  meta,
  capaUrl = "",
  totalLugares,
  totalSubcategorias,
  loading,
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const lugaresLabel = loading
    ? "Carregando lugares…"
    : totalLugares === 0
      ? "Nenhum lugar ainda"
      : `${totalLugares} ${totalLugares === 1 ? "lugar" : "lugares"}`;

  const subcategoriasLabel =
    !loading && totalSubcategorias > 0
      ? `${totalSubcategorias} ${totalSubcategorias === 1 ? "tipo" : "tipos"}`
      : null;

  return (
    <section className="home-reveal -mx-4 mb-6" aria-labelledby="categoria-hero-title">
      <div className="relative min-h-[248px] overflow-hidden rounded-b-[32px] ring-1 ring-[#e8eeee]/80">
        {capaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capaUrl}
            alt=""
            onLoad={() => setImgLoaded(true)}
            className={`home-image-fade absolute inset-0 h-full w-full object-cover ${
              imgLoaded ? "is-loaded" : ""
            }`}
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${meta.gradient}`}
            aria-hidden
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061612] via-[#061612]/72 to-[#061612]/20" />

        <div className="relative flex min-h-[248px] flex-col justify-between p-4 pb-5">
          <div className="flex items-start justify-between gap-3">
            <Link
              href="/categorias"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white shadow-sm backdrop-blur-md transition-transform active:scale-[0.97]"
              aria-label="Voltar para Explorar"
            >
              <IconBack />
            </Link>
            <span
              className={`rounded-full border border-white/25 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/95 backdrop-blur-md ${meta.chipClass}`}
            >
              {meta.icone} {meta.descricaoCurta}
            </span>
          </div>

          <div className="mt-auto pt-8 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
              Categoria
            </p>
            <h2
              id="categoria-hero-title"
              className="mt-1 font-display text-[1.85rem] font-bold leading-[1.08] tracking-tight drop-shadow-sm"
            >
              {meta.nome}
            </h2>
            <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-white/88">
              {meta.descricao}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <span className={HOME_CONTEXT_PILL_CLASS}>{lugaresLabel}</span>
              {subcategoriasLabel ? (
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-[13px] font-semibold text-white/95 backdrop-blur-md">
                  {subcategoriasLabel}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-[13px] font-medium text-white/90 backdrop-blur-md">
                <svg
                  className="h-3.5 w-3.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                </svg>
                Imbituba, SC
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
