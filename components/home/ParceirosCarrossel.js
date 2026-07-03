"use client";

import { useState } from "react";
import Link from "next/link";
import RemotePhoto from "@/components/shared/RemotePhoto";
import { getCapaFromLugar } from "@/lib/fotos";
import { getLugarPublicPath } from "@/lib/lugarPublicPath";
import { getBadgeParceiroLabel } from "@/lib/lugarBadges";
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
    </section>
  );
}

function ParceiroCard({ lugar }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const distancia = lugar.distancia_calculada || lugar.distancia;

  return (
    <Link
      href={getLugarPublicPath(lugar)}
      className="group relative flex h-[220px] w-[292px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[26px] ring-1 ring-[#e8eeee] transition-transform duration-300 active:scale-[0.98]"
    >
      <RemotePhoto
        src={getCapaFromLugar(lugar)}
        alt=""
        fill
        sizes="292px"
        onLoad={() => setImgLoaded(true)}
        className={`home-image-fade object-cover transition-transform duration-500 group-hover:scale-105 ${
          imgLoaded ? "is-loaded" : ""
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#061612] via-[#061612]/55 to-transparent" />
      <span className="absolute left-3.5 top-3.5 rounded-full bg-[#f5e6b8]/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#7a6520] shadow-sm">
        {getBadgeParceiroLabel()}
      </span>
      <div className="relative p-4 pb-5">
        <h3 className="text-lg font-bold leading-tight text-white drop-shadow-sm">{lugar.nome}</h3>
        <p className="mt-1 text-xs font-medium text-white/85">{lugar.categoria}</p>
        {distancia && (
          <p className="mt-2 text-xs font-semibold tabular-nums text-white/75">{distancia}</p>
        )}
      </div>
    </Link>
  );
}
