"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCapaFromLugar } from "@/lib/fotos";
import { getLugarPublicPath } from "@/lib/lugarPublicPath";
import {
  getBadgeCuradoriaLabel,
  getBadgeParceiroLabel,
  isConteudoCuradoria,
  isParceiro,
} from "@/lib/lugarBadges";
import { buildLugarListMeta } from "@/lib/lugarListMeta";

function IconPin({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </svg>
  );
}

function IconClock({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 11H7v-2h4V7h2v6z" />
    </svg>
  );
}

/**
 * Card horizontal rico para listagem de lugares dentro de uma categoria.
 */
export default function CategoriaLugarCard({
  lugar,
  userPosition = null,
  returnPath = "",
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const imagemUrl = getCapaFromLugar(lugar);

  const meta = useMemo(
    () => buildLugarListMeta(lugar, userPosition),
    [lugar, userPosition]
  );

  const localMeta = [
    meta.distancia,
    meta.tempoCarro,
    meta.endereco,
  ].filter(Boolean);

  return (
    <Link
      href={getLugarPublicPath(lugar, { from: returnPath })}
      className="group flex gap-3.5 overflow-hidden rounded-[24px] bg-white p-3.5 ring-1 ring-[#e8eeee] transition-all duration-300 hover:ring-[#1a4a3a]/18 hover:shadow-[0_8px_28px_rgba(26,46,40,0.08)] active:scale-[0.99]"
    >
      <div className="relative h-[108px] w-[108px] shrink-0 overflow-hidden rounded-[20px] bg-[#e8eeee]">
        {imagemUrl ? (
          <Image
            src={imagemUrl}
            alt={lugar.nome}
            width={216}
            height={216}
            sizes="108px"
            onLoad={() => setImgLoaded(true)}
            className={`home-image-fade h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              imgLoaded ? "is-loaded" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54] text-2xl text-white/90">
            {(lugar.nome || "?").charAt(0).toUpperCase()}
          </div>
        )}
        {meta.status ? (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm ${
              meta.status.aberto ? "bg-emerald-500/95" : "bg-[#d9534f]/95"
            }`}
          >
            {meta.status.aberto ? "Aberto" : "Fechado"}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-[#1a2e28]">
              {lugar.nome}
            </h3>
            {meta.subcategoria ? (
              <p className="mt-1 inline-flex rounded-full bg-[#f0f4f3] px-2.5 py-0.5 text-[11px] font-semibold text-[#1a4a3a]">
                {meta.subcategoria}
              </p>
            ) : null}
          </div>
          {meta.rating !== null ? (
            <span className="shrink-0 rounded-full border border-[#e8eeee] bg-[#f8fafa] px-2.5 py-1 text-[11px] font-bold text-[#1a2e28]">
              ⭐ {meta.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        {meta.subtitulo ? (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#5a6b66]">
            {meta.subtitulo}
          </p>
        ) : null}

        {localMeta.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-[#1a4a3a]/85">
            {meta.distancia ? (
              <span className="inline-flex items-center gap-1">
                <IconPin />
                {meta.distancia}
              </span>
            ) : null}
            {meta.tempoCarro ? (
              <span className="inline-flex items-center gap-1 text-[#5a6b66]">
                <IconClock />
                {meta.tempoCarro}
              </span>
            ) : null}
            {meta.endereco ? (
              <span className="line-clamp-1 text-[#5a6b66]">{meta.endereco}</span>
            ) : null}
          </div>
        ) : null}

        {meta.status && (meta.status.resumo || meta.status.detail) ? (
          <p className="mt-1 line-clamp-1 text-[10px] font-medium text-[#1a4a3a]/75">
            {meta.status.resumo || meta.status.detail}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2.5">
          {meta.tags.map((tag) => (
            <span
              key={tag.id ?? tag.nome}
              className="rounded-full border border-[#e8eeee] bg-[#f8fafa] px-2.5 py-0.5 text-[10px] font-semibold text-[#1a4a3a]"
            >
              {tag.icone ? <span className="mr-0.5">{tag.icone}</span> : null}
              {tag.nome}
            </span>
          ))}
          {isParceiro(lugar) ? (
            <span className="rounded-full bg-[#f5e6b8] px-2.5 py-0.5 text-[10px] font-bold text-[#7a6520]">
              {getBadgeParceiroLabel()}
            </span>
          ) : null}
          {isConteudoCuradoria(lugar) ? (
            <span className="rounded-full bg-[#d4ede8] px-2.5 py-0.5 text-[10px] font-bold text-[#1a4a3a]">
              {getBadgeCuradoriaLabel()}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
