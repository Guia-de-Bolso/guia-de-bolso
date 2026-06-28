"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getStatusFuncionamento } from "@/lib/horarios";
import { getCapaFromLugar } from "@/lib/fotos";
import { getLugarPublicPath } from "@/lib/lugarPublicPath";
import {
  getBadgeCuradoriaLabel,
  getBadgeParceiroLabel,
  isConteudoCuradoria,
  isParceiro,
} from "@/lib/lugarBadges";
import { getTagsFromLugar } from "@/lib/tags";

function IconPin({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </svg>
  );
}

function FavoriteIcon({ active, className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function getRatingMedio(lugar) {
  const value = lugar.rating_medio ?? lugar.media_avaliacoes;
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * PlaceCard - Full-height place card with image, status, and optional favorite action.
 * @param {"default"|"immersive"} [props.variant]
 */
export default function PlaceCard({
  lugar,
  isFavorito = false,
  onFavoritar,
  priority = false,
  variant = "default",
  hrefOverride,
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const status = getStatusFuncionamento(lugar.horarios, lugar.mostrar_horarios);
  const distancia = lugar.distancia_calculada || lugar.distancia;
  const tags = getTagsFromLugar(lugar).slice(0, 2);
  const rating = getRatingMedio(lugar);
  const imagemUrl = getCapaFromLugar(lugar);
  const detailHref = hrefOverride || getLugarPublicPath(lugar);
  const immersive = variant === "immersive";

  return (
    <article
      className={`group relative overflow-hidden transition-shadow duration-300 ${
        immersive
          ? "min-h-[420px] rounded-[28px] ring-1 ring-[#e8eeee] shadow-none"
          : "min-h-[380px] rounded-2xl shadow-[0_6px_24px_rgba(26,46,40,0.08)] ring-1 ring-[#e8eeee] hover:shadow-[0_10px_32px_rgba(26,46,40,0.12)]"
      }`}
    >
      {imagemUrl ? (
        <Image
          src={imagemUrl}
          alt={lugar.nome}
          fill
          sizes={immersive ? "300px" : "(max-width: 768px) 100vw, 400px"}
          quality={60}
          onLoad={() => setImgLoaded(true)}
          className={`home-image-fade object-cover transition-transform duration-500 group-hover:scale-105 ${
            imgLoaded ? "is-loaded" : ""
          }`}
          priority={priority}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54]" />
      )}
      <div
        className={`absolute inset-0 ${
          immersive
            ? "bg-gradient-to-t from-[#061612] via-[#061612]/55 to-[#061612]/10"
            : "bg-gradient-to-t from-black/80 via-black/30 to-transparent"
        }`}
      />

      <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
        {rating !== null && (
          <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
            ⭐ {rating.toFixed(1)}
          </span>
        )}
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${
            immersive
              ? "border border-white/20 bg-white/15 text-white"
              : "bg-[#d4ede8] text-[#1a4a3a]"
          }`}
        >
          {lugar.categoria}
        </span>
        {isParceiro(lugar) && (
          <span className="rounded-full bg-[#f5e6b8]/95 px-3 py-1 text-xs font-bold text-[#7a6520] shadow-sm">
            {getBadgeParceiroLabel()}
          </span>
        )}
        {isConteudoCuradoria(lugar) && (
          <span className="rounded-full bg-[#d4ede8]/95 px-3 py-1 text-xs font-bold text-[#1a4a3a] shadow-sm">
            {getBadgeCuradoriaLabel()}
          </span>
        )}
      </div>
      {status && (
        <span
          className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm ${
            status.aberto ? "bg-[#1a4a3a]/90" : "bg-[#d9534f]/90"
          }`}
          title={status.resumo || status.detail || status.label}
        >
          {status.label}
        </span>
      )}

      <Link
        href={detailHref}
        className={`absolute inset-0 flex flex-col justify-end ${immersive ? "p-5 pr-16" : "p-4 pr-16"}`}
      >
        <div>
          <h3
            className={`font-bold leading-tight text-white drop-shadow-sm ${
              immersive ? "text-[1.5rem] tracking-tight" : "text-2xl"
            }`}
          >
            {lugar.nome}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/88">
            {lugar.descricao}
          </p>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    immersive
                      ? "border border-white/20 bg-white/15 text-white backdrop-blur-md"
                      : "bg-white text-[#1a2e28] shadow-sm"
                  }`}
                >
                  {tag.icone && <span className="mr-1">{tag.icone}</span>}
                  {tag.nome}
                </span>
              ))}
            </div>
          )}
          {distancia && (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold tabular-nums text-white/90">
              <IconPin className="h-4 w-4 shrink-0 text-white/80" />
              {distancia}
            </p>
          )}
        </div>
      </Link>

      {onFavoritar && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onFavoritar(lugar);
          }}
          className="absolute bottom-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white backdrop-blur-md transition-transform active:scale-90"
          aria-label={isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <FavoriteIcon active={isFavorito} />
        </button>
      )}
    </article>
  );
}
