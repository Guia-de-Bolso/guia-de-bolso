"use client";

import PrefetchLink from "@/components/PrefetchLink";
import RemotePhoto from "@/components/shared/RemotePhoto";
import { getCapaThumbFromAtrativo } from "@/lib/fotos";
import {
  formatAtrativoDistancia,
  formatAtrativoDuracao,
  getAtrativoNome,
  sanitizeCardDescription,
} from "@/lib/atrativoDetalheDisplay";
import { formatCategoriaAtrativoLabel } from "@/lib/atrativos";
import { HOME_SECTION_EYEBROW_CLASS } from "@/components/home/homeTokens";

/**
 * Hero da home — atrativo curado do momento.
 */
export default function OQueFazerAgora({ rota }) {
  if (!rota) {
    return <HeroSkeleton />;
  }

  const href = `/atrativos/${rota.id}`;
  const nome = getAtrativoNome(rota);
  const capa = getCapaThumbFromAtrativo(rota);
  const dificuldade = rota.dificuldade || "Fácil";
  const descricao = sanitizeCardDescription(rota.descricao);
  const metaParts = [
    formatAtrativoDuracao(rota),
    formatAtrativoDistancia(rota),
    dificuldade,
  ].filter((part) => part && part !== "—");

  return (
    <section className="mb-7 home-reveal" aria-labelledby="sugestao-momento-title">
      <p id="sugestao-momento-title" className={`${HOME_SECTION_EYEBROW_CLASS} mb-3`}>
        Sugestão do momento
      </p>
      <PrefetchLink
        href={href}
        className="group relative block min-h-[372px] overflow-hidden rounded-[28px] shadow-[0_14px_40px_rgba(11,31,26,0.2)] ring-1 ring-black/8 transition-[transform,box-shadow] duration-300 hover:shadow-[0_18px_48px_rgba(11,31,26,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0f4f3] active:scale-[0.995] motion-reduce:transition-none motion-reduce:active:scale-100"
        aria-label={`${nome}. Ver detalhes`}
      >
        <RemotePhoto
          src={capa}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          priority
          categoria="aventura"
          className="scale-105 object-cover transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-105"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061612] via-[#061612]/68 to-[#061612]/12"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20"
          aria-hidden
        />

        <div className="absolute left-4 right-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#d4ede8]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1a4a3a]">
            Curado
          </span>
          <span className="rounded-full border border-white/20 bg-white/12 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white/95 backdrop-blur-sm">
            {formatCategoriaAtrativoLabel(rota.categoria)}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 pb-5 sm:p-5">
          <h3 className="font-display text-[1.45rem] font-extrabold leading-[1.12] tracking-tight text-white drop-shadow-sm sm:text-[1.55rem]">
            {nome}
          </h3>
          {descricao ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/88">
              {descricao}
            </p>
          ) : null}

          {metaParts.length > 0 ? (
            <p className="mt-3 text-[13px] font-medium tabular-nums tracking-wide text-white/85">
              {metaParts.join(" · ")}
            </p>
          ) : null}

          <span className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-2xl bg-[#1a4a3a] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(26,74,58,0.35)] transition-transform group-active:scale-[0.99]">
            Ver detalhes
            <span aria-hidden>→</span>
          </span>
        </div>
      </PrefetchLink>
    </section>
  );
}

function HeroSkeleton() {
  return (
    <section className="mb-7 home-reveal" aria-labelledby="sugestao-momento-title">
      <p id="sugestao-momento-title" className={`${HOME_SECTION_EYEBROW_CLASS} mb-3`}>
        Sugestão do momento
      </p>
      <div className="relative min-h-[372px] overflow-hidden rounded-[28px] bg-[#e8eeee] shadow-[0_12px_40px_rgba(26,46,40,0.08)] ring-1 ring-[#e8eeee]">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#d8e8e2] to-[#eef2f0]" />
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-5">
          <div className="h-7 w-2/3 rounded-xl bg-white/40" />
          <div className="h-4 w-full rounded-lg bg-white/30" />
          <div className="h-3.5 w-40 rounded bg-white/25" />
          <div className="h-11 rounded-2xl bg-[#1a4a3a]/20" />
        </div>
      </div>
    </section>
  );
}
