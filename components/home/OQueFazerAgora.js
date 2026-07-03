"use client";

import { useState } from "react";
import Link from "next/link";
import RemotePhoto from "@/components/shared/RemotePhoto";
import { getCapaFromAtrativo } from "@/lib/fotos";
import {
  formatAtrativoDistancia,
  formatAtrativoDuracao,
  getAtrativoNome,
} from "@/lib/atrativoDetalheDisplay";
import { formatCategoriaAtrativoLabel } from "@/lib/atrativos";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.icon
 * @param {string} props.value
 * @returns {import('react').ReactElement}
 */
function MetricPill({ icon, value }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-3 py-2 backdrop-blur-md">
      <span className="inline-flex shrink-0 text-white/90" aria-hidden>
        {icon}
      </span>
      <span className="text-xs font-semibold tabular-nums text-white">{value}</span>
    </div>
  );
}

function IconClock() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 1010 10A10.01 10.01 0 0012 2zm1 11H7v-2h4V7h2v7z" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 2L3 14h8l-1 8 11-13h-8l0-7z" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm9.24-2.16l1.41 1.41 1.8-1.79-1.41-1.41-1.8 1.8zM20 13h3v-2h-3v2zM6.76 19.16l-1.42 1.42 1.79 1.8 1.41-1.41-1.78-1.81zM12 6a6 6 0 100 12 6 6 0 000-12z" />
    </svg>
  );
}

function HeroSkeleton() {
  return (
    <section className="mb-10 home-reveal">
      <HomeSectionHeader eyebrow="Sugestão do momento" title="O que fazer agora" />
      <div className="relative min-h-[440px] overflow-hidden rounded-[32px] bg-[#e8eeee] shadow-[0_12px_40px_rgba(26,46,40,0.08)] ring-1 ring-[#e8eeee]">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#d8e8e2] to-[#eef2f0]" />
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-6">
          <div className="h-7 w-2/3 rounded-xl bg-white/40" />
          <div className="h-4 w-full rounded-lg bg-white/30" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-20 rounded-full bg-white/25" />
            ))}
          </div>
          <div className="h-12 rounded-2xl bg-[#1a4a3a]/20" />
        </div>
      </div>
    </section>
  );
}

/**
 * Hero da home — rota curada do dia (round-robin).
 */
export default function OQueFazerAgora({ rota, temperatura = null }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!rota) {
    return <HeroSkeleton />;
  }

  const tempNum = Number(temperatura);
  const temperaturaExibicao = Number.isFinite(tempNum)
    ? `${Math.round(tempNum)}°`
    : "--°";
  const capa = getCapaFromAtrativo(rota);
  const dificuldade = rota.dificuldade || "Fácil";

  return (
    <section className="mb-10 home-reveal">
      <HomeSectionHeader eyebrow="Sugestão do momento" title="O que fazer agora" />

      <article className="group relative min-h-[460px] overflow-hidden rounded-[32px] shadow-[0_16px_48px_rgba(11,31,26,0.22)] ring-1 ring-black/8 transition-shadow duration-300 hover:shadow-[0_20px_56px_rgba(11,31,26,0.28)]">
        <RemotePhoto
          src={capa}
          alt={getAtrativoNome(rota)}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          priority
          onLoad={() => setImgLoaded(true)}
          className={`home-image-fade scale-105 object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
            imgLoaded ? "is-loaded" : ""
          }`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061612] via-[#061612]/70 to-[#061612]/15" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/25" />

        <div className="absolute left-4 right-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#d4ede8]/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#1a4a3a] shadow-sm">
            Atrativo curado
          </span>
          <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
            {formatCategoriaAtrativoLabel(rota.categoria)}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 pb-6">
          <h3 className="font-display text-[1.65rem] font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-sm">
            {getAtrativoNome(rota)}
          </h3>
          {rota.descricao && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/90">
              {rota.descricao}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <MetricPill icon={<IconClock />} value={formatAtrativoDuracao(rota)} />
            <MetricPill icon={<IconPin />} value={formatAtrativoDistancia(rota)} />
            <MetricPill icon={<IconBolt />} value={dificuldade} />
            <MetricPill icon={<IconSun />} value={temperaturaExibicao} />
          </div>

          <Link
            href={`/atrativos/${rota.id}`}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a4a3a] py-4 text-center text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_24px_rgba(26,74,58,0.45)] transition-transform active:scale-[0.98]"
          >
            Ver atrativo
            <span aria-hidden>→</span>
          </Link>
        </div>
      </article>
    </section>
  );
}
