"use client";

import { useState } from "react";
import Link from "next/link";
import RemotePhoto from "@/components/shared/RemotePhoto";
import { getCategoriaHref } from "@/lib/categorias";

function CategoriaCardContent({ categoria, count, imagemUrl, vazio, imgLoaded, onImageLoad }) {
  return (
    <>
      <div className="relative h-[104px] w-full overflow-hidden">
        {imagemUrl && !vazio ? (
          <RemotePhoto
            src={imagemUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            onLoad={onImageLoad}
            className={`home-image-fade object-cover transition-transform duration-500 group-hover:scale-105 ${
              imgLoaded ? "is-loaded" : ""
            }`}
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${categoria.gradient}`}
            aria-hidden
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <span
          className={`absolute left-2.5 top-2.5 rounded-full border border-white/30 px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-sm ${categoria.chipClass}`}
        >
          {categoria.icone}
        </span>
        {!vazio ? (
          <span className="absolute bottom-2.5 right-2.5 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            {count} {count === 1 ? "lugar" : "lugares"}
          </span>
        ) : (
          <span className="absolute bottom-2.5 right-2.5 rounded-full border border-white/25 bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
            Em breve
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="text-[15px] font-bold leading-tight tracking-tight text-[#1a2e28]">
          {categoria.nome}
        </h3>
        <p className="mt-1 flex-1 text-[11px] leading-snug text-[#5a6b66] line-clamp-2">
          {categoria.descricaoCurta}
        </p>
        <p
          className={`mt-2.5 text-xs font-semibold ${
            vazio ? "text-[#8a9b94]" : "text-[#1a4a3a]"
          }`}
        >
          {vazio ? "Toque para ver detalhes" : "Explorar categoria →"}
        </p>
      </div>
    </>
  );
}

/**
 * Card compacto de categoria (grid 2 colunas).
 */
export default function ExplorarCategoriaCard({ categoria, count, imagemUrl }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const vazio = count === 0;
  const baseClass = `group relative flex min-h-[168px] flex-col overflow-hidden rounded-[22px] ring-1 bg-white transition-transform duration-300 active:scale-[0.98] ${
    vazio
      ? "ring-[#e8eeee]/90 hover:ring-[#1a4a3a]/12"
      : "ring-[#e8eeee] hover:ring-[#1a4a3a]/20"
  }`;

  return (
    <Link
      href={getCategoriaHref(categoria.nome)}
      className={baseClass}
      aria-label={
        vazio
          ? `${categoria.nome}, em breve`
          : `${categoria.nome}, ${count} lugares`
      }
    >
      <CategoriaCardContent
        categoria={categoria}
        count={count}
        imagemUrl={imagemUrl}
        vazio={vazio}
        imgLoaded={imgLoaded}
        onImageLoad={() => setImgLoaded(true)}
      />
    </Link>
  );
}
