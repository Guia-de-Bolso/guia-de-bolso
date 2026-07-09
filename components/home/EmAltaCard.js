"use client";

import PrefetchLink from "@/components/PrefetchLink";
import RemotePhoto from "@/components/shared/RemotePhoto";
import { getCapaThumbFromLugar, getCapaBlurFromLugar } from "@/lib/fotos";
import { getLugarPublicPath } from "@/lib/lugarPublicPath";
import { getStatusFuncionamento } from "@/lib/horarios";
import { getTagsFromLugar } from "@/lib/tags";

/**
 * Returns aggregated rating from the place record when available.
 * @param {object} lugar - Place record.
 * @returns {number|null} Average rating or null.
 */
function getRatingMedio(lugar) {
  const value = lugar.rating_medio ?? lugar.media_avaliacoes;
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * EmAltaCard - Compact trending place card for the home carousel.
 */
export default function EmAltaCard({ lugar, priority = false, returnPath = "" }) {
  const status = getStatusFuncionamento(lugar.horarios, lugar.mostrar_horarios);
  const tags = getTagsFromLugar(lugar).slice(0, 2);
  const distancia = lugar.distancia_calculada || lugar.distancia;
  const rating = getRatingMedio(lugar);
  const imagemUrl = getCapaThumbFromLugar(lugar);
  const imagemBlur = getCapaBlurFromLugar(lugar);

  return (
    <PrefetchLink
      href={getLugarPublicPath(lugar, { from: returnPath })}
      className="group flex w-[208px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] bg-white ring-1 ring-[#e8eeee] transition-transform duration-300 active:scale-[0.98]"
    >
      <div className="relative h-[120px] overflow-hidden">
        {imagemUrl ? (
          <RemotePhoto
            src={imagemUrl}
            alt={lugar.nome}
            width={416}
            height={312}
            sizes="208px"
            quality={60}
            categoria={lugar.categoria}
            blurDataURL={imagemBlur || undefined}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        {status && (
          <span
            className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-sm ${
              status.aberto ? "bg-emerald-500/95 text-white" : "bg-red-500/95 text-white"
            }`}
          >
            {status.aberto ? "Aberto" : "Fechado"}
          </span>
        )}
        {rating !== null && (
          <span className="absolute right-2.5 top-2.5 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            ⭐ {rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-1 text-[15px] font-bold tracking-tight text-[#1a2e28]">
          {lugar.nome}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs font-medium text-[#5a6b66]">{distancia}</p>
        {status && (status.resumo || status.detail) && (
          <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-[#1a4a3a]/80">
            {status.resumo || status.detail}
          </p>
        )}
        {tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.id ?? tag.nome}
                className="rounded-full border border-[#e8eeee] bg-[#f8fafa] px-2.5 py-0.5 text-[10px] font-semibold text-[#1a4a3a]"
              >
                {tag.nome}
              </span>
            ))}
          </div>
        )}
      </div>
    </PrefetchLink>
  );
}
