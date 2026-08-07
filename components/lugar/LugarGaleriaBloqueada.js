"use client";

import RemotePhoto from "@/components/shared/RemotePhoto";
import { normalizeGalleryPhotos } from "@/lib/photoGallery";

/**
 * Preview borrado das fotos disponíveis apenas no perfil Parceiro.
 * @param {object} props
 * @param {Array<string|{ url: string, thumb?: string, blur?: string }>} [props.imagens]
 * @returns {import("react").JSX.Element|null}
 */
export default function LugarGaleriaBloqueada({ imagens = [] }) {
  const fotos = normalizeGalleryPhotos(imagens);
  if (!fotos.length) return null;

  return (
    <section aria-label="Fotos bloqueadas do perfil">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[#1a2e28]">Mais fotos</h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f5e6b8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#7a6520]">
          <span aria-hidden>🔒</span>
          Perfil Parceiro
        </span>
      </div>

      <div
        className={`grid h-36 gap-2 overflow-hidden rounded-2xl ${
          fotos.length === 1 ? "grid-cols-1" : "grid-cols-2"
        }`}
      >
        {fotos.map((foto, index) => (
          <div
            key={foto.url}
            className={`relative overflow-hidden bg-[#dfe8e4] ${
              fotos.length === 3 && index === 0 ? "row-span-2" : ""
            }`}
          >
            <RemotePhoto
              src={foto.thumb || foto.url}
              fullSrc={foto.url}
              thumbSrc={foto.thumb}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 195px"
              className="scale-110 object-cover blur-md"
              blurDataURL={foto.blur}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-[#1a2e28]/20" aria-hidden />
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-center text-xs font-semibold text-[#5a6b66]">
        Desbloqueado no perfil Parceiro
      </p>
    </section>
  );
}
