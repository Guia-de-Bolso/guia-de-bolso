"use client";

import GalleryHeroAirbnb from "@/components/shared/GalleryHeroAirbnb";

/**
 * Galeria do detalhe do lugar — wrapper sobre o hero compartilhado.
 * @param {object} props
 * @returns {import("react").JSX.Element}
 */
export default function LugarGalleryAirbnb({
  nome,
  imagens,
  backHref = "/",
  isFavorito,
  onFavoritar,
  onShare,
  parceiroBadgeLabel = null,
  curadoriaBadgeLabel = null,
  immersiveScroll = true,
  mapsTipCategoria,
  categoria,
  videoUrl = null,
  videoPoster = null,
}) {
  return (
    <GalleryHeroAirbnb
      nome={nome}
      imagens={imagens}
      backHref={backHref}
      isFavorito={isFavorito}
      onFavoritar={onFavoritar}
      onShare={onShare}
      parceiroBadgeLabel={parceiroBadgeLabel}
      curadoriaBadgeLabel={curadoriaBadgeLabel}
      immersiveScroll={immersiveScroll}
      mapsTipCategoria={mapsTipCategoria}
      categoria={categoria}
      videoUrl={videoUrl}
      videoPoster={videoPoster}
    />
  );
}
