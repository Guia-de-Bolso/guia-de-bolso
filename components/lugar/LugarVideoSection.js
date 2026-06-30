"use client";

import LugarSectionAirbnb, { LugarCardAirbnb } from "@/components/lugar/airbnb/LugarSectionAirbnb";
import VideoPlayer from "@/components/VideoPlayer";

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
        <VideoPlayer
          src={videoUrl}
          poster={posterUrl || undefined}
          ariaLabel={`Vídeo de ${nome}`}
          className="overflow-hidden rounded-xl"
        />
      </LugarCardAirbnb>
    </LugarSectionAirbnb>
  );
}
