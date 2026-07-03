"use client";

import { useRef } from "react";
import RemotePhoto from "@/components/shared/RemotePhoto";
import NavigationBackLink from "@/components/NavigationBackLink";
import OfflineMapsInfoButton from "@/components/maps/OfflineMapsInfoButton";
import GalleryPhotoCounter from "@/components/shared/GalleryPhotoCounter";
import {
  GALLERY_FAVORITO_ATIVO_BTN_CLASS,
  GALLERY_FLOAT_BTN_CLASS,
  GALLERY_FLOAT_ICON_CLASS,
  GALLERY_FOOTER_ROW_CLASS,
  PARCEIRO_BADGE_GRADIENT_CLASS,
} from "@/components/lugar/airbnb/lugarAirbnbTokens";
import {
  PHOTO_GALLERY_SLIDE_CLASS,
  PHOTO_GALLERY_TRACK_CLASS,
  useControlledPhotoCarousel,
} from "@/lib/horizontalCarousel";

function FavoriteIcon({ active, className = GALLERY_FLOAT_ICON_CLASS }) {
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

function ShareIcon({ className = GALLERY_FLOAT_ICON_CLASS }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </svg>
  );
}

/**
 * Hero de galeria compartilhado (lugares e rotas): full bleed, vidro no contador, card overlap abaixo.
 * @param {object} props
 * @param {boolean} [props.immersiveScroll=false] - Colapso/parallax via CSS scroll (detalhe lugar).
 * @returns {import("react").JSX.Element}
 */
export default function GalleryHeroAirbnb({
  nome,
  imagens,
  backHref = "/",
  isFavorito = false,
  onFavoritar,
  onShare,
  parceiroBadgeLabel = null,
  curadoriaBadgeLabel = null,
  showFavorite = true,
  immersiveScroll = false,
  mapsTipCategoria,
}) {
  const carouselRef = useRef(null);
  const fotos = imagens?.length ? imagens : [];
  const fotoAtual = useControlledPhotoCarousel(carouselRef, fotos.length);

  const temVariasFotos = fotos.length > 1;
  const showFooter =
    Boolean(parceiroBadgeLabel || curadoriaBadgeLabel) || temVariasFotos;

  return (
    <div className="relative h-full w-full">
      <div
        className={
          immersiveScroll
            ? "relative h-full w-full overflow-hidden bg-[#1a4a3a]"
            : "relative h-[min(52vh,28rem)] w-full overflow-hidden bg-[#1a4a3a]"
        }
      >
        <div
          className={
            immersiveScroll
              ? "detalhe-hero-media-layer absolute inset-x-0 top-0 w-full"
              : "absolute inset-0 h-full w-full"
          }
        >
          {fotos.length === 0 ? (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54]" />
          ) : (
            <div ref={carouselRef} className={`${PHOTO_GALLERY_TRACK_CLASS} h-full min-h-full w-full`}>
              {fotos.map((foto, index) => (
                <div key={`${foto}-${index}`} className={PHOTO_GALLERY_SLIDE_CLASS}>
                  <RemotePhoto
                    src={foto}
                    alt={nome}
                    fill
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-28 bg-gradient-to-t from-black/35 via-black/10 to-transparent"
          aria-hidden
        />

        {showFooter && (
          <div className={GALLERY_FOOTER_ROW_CLASS}>
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {parceiroBadgeLabel ? (
                <span className={PARCEIRO_BADGE_GRADIENT_CLASS}>{parceiroBadgeLabel}</span>
              ) : null}
              {curadoriaBadgeLabel ? (
                <span className="rounded-full bg-[#d4ede8]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1a4a3a] shadow-sm">
                  {curadoriaBadgeLabel}
                </span>
              ) : null}
              {!parceiroBadgeLabel && !curadoriaBadgeLabel ? (
                <span className="shrink-0" aria-hidden />
              ) : null}
            </div>
            {temVariasFotos ? (
              <GalleryPhotoCounter current={fotoAtual + 1} total={fotos.length} />
            ) : (
              <span className="shrink-0" aria-hidden />
            )}
          </div>
        )}

        <div
          className={`absolute inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex items-start justify-between px-4 ${
            immersiveScroll ? "detalhe-hero-actions-fade" : ""
          }`}
        >
          <NavigationBackLink
            href={backHref}
            className={GALLERY_FLOAT_BTN_CLASS}
            iconClassName={GALLERY_FLOAT_ICON_CLASS}
          />

          <div className="flex gap-2.5">
            <OfflineMapsInfoButton categoria={mapsTipCategoria} />
            <button
              type="button"
              onClick={onShare}
              className={GALLERY_FLOAT_BTN_CLASS}
              aria-label="Compartilhar"
            >
              <ShareIcon />
            </button>
            {showFavorite && onFavoritar && (
              <button
                type="button"
                onClick={onFavoritar}
                className={
                  isFavorito ? GALLERY_FAVORITO_ATIVO_BTN_CLASS : GALLERY_FLOAT_BTN_CLASS
                }
                aria-label={isFavorito ? "Remover dos favoritos" : "Favoritar"}
              >
                <FavoriteIcon
                  active={isFavorito}
                  className={
                    isFavorito
                      ? `${GALLERY_FLOAT_ICON_CLASS} text-white`
                      : GALLERY_FLOAT_ICON_CLASS
                  }
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
