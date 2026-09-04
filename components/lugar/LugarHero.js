"use client";

import GallerySlidePhoto from "@/components/shared/GallerySlidePhoto";
import GallerySlideVideo from "@/components/shared/GallerySlideVideo";
import OfflineMapsInfoButton from "@/components/maps/OfflineMapsInfoButton";
import { useGalleryPhotoPreload } from "@/hooks/useGalleryPhotoPreload";
import Link from "next/link";
import { useRef } from "react";
import IconBack from "@/components/IconBack";
import GalleryMediaViewer from "@/components/shared/GalleryMediaViewer";
import { useGalleryMediaViewer } from "@/hooks/useGalleryMediaViewer";
import {
  PHOTO_GALLERY_TRACK_CLASS,
  useControlledPhotoCarousel,
} from "@/lib/horizontalCarousel";
import { getCategoryPlaceholderHex } from "@/lib/imagePlaceholder";
import {
  buildHeroGalleryItems,
  getGalleryPhotoPreloadIndex,
  getGalleryPhotosForPreload,
  isGalleryVideoItem,
} from "@/lib/galleryMedia";

/**
 * Ícone de coração para favoritar ou indicar favorito ativo.
 * @param {object} props
 * @param {boolean} props.active - Se o lugar está nos favoritos (preenche o ícone).
 * @param {string} [props.className] - Classes Tailwind do SVG.
 * @returns {import("react").JSX.Element}
 */
function FavoriteIcon({ active, className = "w-5 h-5" }) {
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

/**
 * Ícone de compartilhar (seta para cima).
 * @param {object} props
 * @param {string} [props.className] - Classes Tailwind do SVG.
 * @returns {import("react").JSX.Element}
 */
function ShareIcon({ className = "w-5 h-5" }) {
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
 * Hero da página de detalhe do lugar: carrossel de fotos, navegação, favorito e metadados.
 * @param {object} props
 * @param {string} props.nome - Nome do lugar (alt das imagens e título).
 * @param {string[]} props.imagens - URLs das fotos do carrossel.
 * @param {string} props.categoria - Nome da categoria exibida no chip.
 * @param {string} props.categoriaStyle - Classes Tailwind do chip de categoria.
 * @param {string} [props.subcategoria] - Nome da subcategoria (chip opcional).
 * @param {string} [props.subcategoriaIcone] - Emoji ou ícone da subcategoria.
 * @param {string} [props.distancia] - Texto de distância (ex.: "2,3 km de você").
 * @param {number} props.mediaAvaliacoes - Média das notas aprovadas.
 * @param {number} props.totalAvaliacoes - Quantidade de avaliações.
 * @param {{ aberto: boolean }} props.status - Estado aberto/fechado do horário.
 * @param {boolean} [props.mostrarStatusAbertura=true] - Exibe chip "Aberto agora" / "Fechado".
 * @param {boolean} props.isFavorito - Se o usuário favoritou o lugar.
 * @param {() => void} props.onFavoritar - Callback ao tocar no botão de favorito.
 * @param {() => void} props.onShare - Callback ao tocar em compartilhar.
 * @returns {import("react").JSX.Element}
 */
export default function LugarHero({
  nome,
  imagens,
  categoria,
  categoriaStyle,
  subcategoria,
  subcategoriaIcone,
  distancia,
  mediaAvaliacoes,
  totalAvaliacoes,
  status,
  mostrarStatusAbertura = true,
  isFavorito,
  onFavoritar,
  onShare,
  videoUrl = null,
  videoPoster = null,
}) {
  const carouselRef = useRef(null);
  const items = buildHeroGalleryItems(imagens, videoUrl, videoPoster);
  const fotoAtual = useControlledPhotoCarousel(carouselRef, items.length);
  const placeholderHex = getCategoryPlaceholderHex(categoria);
  const temNota = totalAvaliacoes > 0 && mediaAvaliacoes > 0;
  const viewer = useGalleryMediaViewer(fotoAtual, items.length > 0);

  useGalleryPhotoPreload(
    getGalleryPhotosForPreload(items),
    getGalleryPhotoPreloadIndex(items, fotoAtual)
  );

  return (
    <>
    <div
      className="relative h-[min(52vh,380px)] min-h-[300px] overflow-hidden"
      style={{ backgroundColor: placeholderHex }}
    >
      <div
        ref={carouselRef}
        className={`${PHOTO_GALLERY_TRACK_CLASS} cursor-zoom-in`}
        {...viewer.carouselPointerHandlers}
      >
        {items.map((item, index) =>
          isGalleryVideoItem(item) ? (
            <GallerySlideVideo
              key={`video-${item.url}`}
              src={item.url}
              poster={item.poster}
              alt={`Vídeo de ${nome}`}
              categoria={categoria}
              isActive={index === fotoAtual && !viewer.isOpen}
            />
          ) : (
            <GallerySlidePhoto
              key={`${item.url}-${index}`}
              src={item.url}
              thumbSrc={item.thumb}
              blurDataURL={item.blur}
              alt={nome}
              categoria={categoria}
              index={index}
              activeIndex={fotoAtual}
              total={items.length}
            />
          )
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071612]/95 via-[#071612]/45 to-[#071612]/20"
        aria-hidden
      />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]" data-gallery-chrome>
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md"
          aria-label="Voltar"
        >
          <IconBack />
        </Link>
        <div className="flex gap-2">
          <OfflineMapsInfoButton
            categoria={categoria}
            buttonClassName="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md"
            iconClassName="h-5 w-5"
          />
          <button
            type="button"
            onClick={onShare}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md"
            aria-label="Compartilhar lugar"
          >
            <ShareIcon />
          </button>
          <button
            type="button"
            onClick={onFavoritar}
            className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md ${
              isFavorito
                ? "bg-[#1a4a3a] text-white"
                : "bg-black/35 text-white"
            }`}
            aria-label={
              isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"
            }
          >
            <FavoriteIcon active={isFavorito} />
          </button>
        </div>
      </div>

      {items.length > 1 && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {fotoAtual + 1} / {items.length}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-5 pt-16">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${categoriaStyle}`}
          >
            {categoria}
          </span>
          {subcategoria && (
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
              {subcategoriaIcone && <span className="mr-1">{subcategoriaIcone}</span>}
              {subcategoria}
            </span>
          )}
        </div>

        <h2 className="mt-2 font-display text-[1.75rem] font-bold leading-tight tracking-tight text-white">
          {nome}
        </h2>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {temNota && (
            <span className="flex items-center gap-1 text-sm font-semibold text-white">
              <span className="text-[#f5c842]">★</span>
              {mediaAvaliacoes.toFixed(1)}
              <span className="font-normal text-white/70">
                ({totalAvaliacoes})
              </span>
            </span>
          )}
          {mostrarStatusAbertura && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                status.aberto
                  ? "bg-[#3ecf8e] text-[#053d24]"
                  : "bg-[#ff6b5a] text-white"
              }`}
              title={status.resumo || status.detail}
            >
              {status.aberto ? "Aberto agora" : "Fechado"}
            </span>
          )}
          {distancia && (
            <span className="text-sm font-medium text-white/85">{distancia}</span>
          )}
        </div>
      </div>
    </div>
    <GalleryMediaViewer
      isOpen={viewer.isOpen}
      onClose={viewer.closeViewer}
      items={items}
      initialIndex={viewer.startIndex}
      nome={nome}
      categoria={categoria}
    />
    </>
  );
}
