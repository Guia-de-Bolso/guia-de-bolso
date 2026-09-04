import GalleryPhotosIcon from "@/components/shared/GalleryPhotosIcon";
import { GALLERY_GLASS_PILL_CLASS } from "@/components/lugar/airbnb/lugarAirbnbTokens";

/**
 * Contador de mídia com glassmorphism estilo Apple.
 * @param {{ current: number, total: number, className?: string, labelKind?: "foto"|"video" }} props
 * @returns {import("react").JSX.Element}
 */
export default function GalleryPhotoCounter({
  current,
  total,
  className = "",
  labelKind = "foto",
}) {
  const ariaLabel =
    labelKind === "video" ? `Vídeo, item ${current} de ${total}` : `Foto ${current} de ${total}`;

  return (
    <span
      className={`${GALLERY_GLASS_PILL_CLASS} ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <GalleryPhotosIcon />
      {current} / {total}
    </span>
  );
}
