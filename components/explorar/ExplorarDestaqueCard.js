"use client";

import { useState } from "react";
import Link from "next/link";
import RemotePhoto from "@/components/shared/RemotePhoto";
import { getCategoriaHref } from "@/lib/categorias";

/**
 * Card horizontal em destaque para uma categoria.
 */
export default function ExplorarDestaqueCard({ categoria, count, imagemUrl }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const vazio = count === 0;
  const href = getCategoriaHref(categoria.nome);

  const inner = (
    <>
      {imagemUrl && !vazio ? (
        <RemotePhoto
          src={imagemUrl}
          alt=""
          fill
          sizes="260px"
          onLoad={() => setImgLoaded(true)}
          className={`home-image-fade object-cover transition-transform duration-500 group-hover:scale-105 ${
            imgLoaded ? "is-loaded" : ""
          }`}
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${categoria.gradient}`}
          aria-hidden
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061612] via-[#061612]/55 to-[#061612]/10" />

      {categoria.destaque && !vazio && (
        <span className="absolute left-3.5 top-3.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
          {categoria.destaque}
        </span>
      )}

      <div className="relative p-4 pb-5 text-white">
        <span className="text-2xl" aria-hidden>
          {categoria.icone}
        </span>
        <h3 className="mt-2 text-xl font-bold leading-tight drop-shadow-sm">{categoria.nome}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/88">
          {categoria.descricaoCurta}
        </p>
        <p className="mt-2 text-xs font-semibold tabular-nums text-white/90">
          {vazio
            ? "Em breve"
            : `${count} ${count === 1 ? "lugar" : "lugares"}`}
          {!vazio && (
            <span className="ml-1 opacity-80" aria-hidden>
              →
            </span>
          )}
        </p>
      </div>
    </>
  );

  const shellClass = `relative flex h-[168px] w-[260px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[26px] ring-1 ring-[#e8eeee] ${
    vazio
      ? "pointer-events-none cursor-not-allowed opacity-70"
      : "group transition-transform duration-300 active:scale-[0.98]"
  }`;

  if (vazio) {
    return (
      <div
        className={shellClass}
        aria-disabled="true"
        tabIndex={-1}
        title={`${categoria.nome} — em breve, sem lugares cadastrados`}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link href={href} className={`${shellClass} group`}>
      {inner}
    </Link>
  );
}
