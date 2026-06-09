"use client";

import LugarSectionAirbnb, { LugarCardAirbnb } from "@/components/lugar/airbnb/LugarSectionAirbnb";

/**
 * Player nativo do vídeo do lugar — seção "Veja o lugar", abaixo da galeria de fotos.
 * @param {{ videoUrl: string, posterUrl?: string|null, nome: string }} props
 * @returns {import("react").ReactElement|null}
 */
export default function LugarVideoSection({ videoUrl, posterUrl = null, nome }) {
  if (!videoUrl?.trim()) return null;

  return (
    <LugarSectionAirbnb title="Veja o lugar">
      <LugarCardAirbnb className="overflow-hidden p-0">
        <video
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
          poster={posterUrl || undefined}
          className="aspect-video w-full bg-black object-contain"
          aria-label={`Vídeo de ${nome}`}
        />
      </LugarCardAirbnb>
    </LugarSectionAirbnb>
  );
}
