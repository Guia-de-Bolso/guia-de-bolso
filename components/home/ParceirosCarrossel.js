"use client";

import Link from "next/link";
import PrefetchLink from "@/components/PrefetchLink";
import RemotePhoto from "@/components/shared/RemotePhoto";
import { getCapaThumbFromLugar } from "@/lib/fotos";
import { getLugarPublicPath } from "@/lib/lugarPublicPath";
import { getBadgeParceiroLabel } from "@/lib/lugarBadges";
import LugarVideoPlayBadge from "@/components/lugar/LugarVideoPlayBadge";
import { lugarMostraVideoPublico } from "@/lib/lugarVideo";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import { HOME_CAROUSEL_TRACK_CLASS } from "@/components/home/homeTokens";

/**
 * Carrossel de estabelecimentos no plano Parceiro do Guia (R$ 299).
 */
export default function ParceirosCarrossel({ lugares = [] }) {
  if (!lugares.length) return null;

  return (
    <section
      className="mb-10 home-reveal overflow-visible"
      aria-labelledby="parceiros-carrossel-title"
    >
      <HomeSectionHeader eyebrow="Parceiros" title="Parceiros do Guia" />

      <div className={`${HOME_CAROUSEL_TRACK_CLASS} -mx-4 px-4`}>
        {lugares.map((lugar) => (
          <ParceiroCard key={lugar.id} lugar={lugar} />
        ))}
      </div>

      <p className="mt-4 text-center">
        <Link
          href="/categorias"
          className="text-sm font-semibold text-[#1a4a3a] underline decoration-[#1a4a3a]/30 underline-offset-4 transition hover:decoration-[#1a4a3a]"
        >
          Conheça todos os nossos parceiros
        </Link>
      </p>
    </section>
  );
}

function ParceiroCard({ lugar }) {
  const distancia = lugar.distancia_calculada || lugar.distancia;
  const mostraVideo = lugarMostraVideoPublico(lugar);

  return (
    <PrefetchLink
      href={getLugarPublicPath(lugar)}
      className="group relative flex h-[220px] w-[292px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[26px] ring-1 ring-[#e8eeee] transition-transform duration-300 active:scale-[0.98]"
    >
      <RemotePhoto
        src={getCapaThumbFromLugar(lugar)}
        alt=""
        fill
        sizes="292px"
        categoria={lugar.categoria}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#061612] via-[#061612]/55 to-transparent" />
      {mostraVideo ? <LugarVideoPlayBadge className="inset-x-0 top-0 h-[58%]" /> : null}
      <span className="absolute left-3.5 top-3.5 rounded-full bg-[#f5e6b8]/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#7a6520] shadow-sm">
        {getBadgeParceiroLabel()}
      </span>
      <div className="relative p-4 pb-5">
        <h3 className="text-lg font-bold leading-tight text-white drop-shadow-sm">
          {lugar.nome}
          {mostraVideo ? <span className="sr-only">, com vídeo</span> : null}
        </h3>
        <p className="mt-1 text-xs font-medium text-white/85">{lugar.categoria}</p>
        {distancia && (
          <p className="mt-2 text-xs font-semibold tabular-nums text-white/75">{distancia}</p>
        )}
      </div>
    </PrefetchLink>
  );
}
