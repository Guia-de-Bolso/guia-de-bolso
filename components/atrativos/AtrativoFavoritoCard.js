"use client";

import Image from "next/image";
import Link from "next/link";
import { getCapaFromAtrativo } from "@/lib/fotos";
import { getCategoriaAtrativoMeta } from "@/lib/atrativos";

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

function getAtrativoNome(rota) {
  return rota.nome || rota.titulo || "Atrativo sem nome";
}

/**
 * Card compacto de atrativo favorito com ação de remover.
 * @param {object} props
 * @param {object} props.rota
 * @param {() => void} props.onRemover
 * @returns {import("react").ReactElement}
 */
export default function AtrativoFavoritoCard({ rota, onRemover }) {
  const categoria = getCategoriaAtrativoMeta(rota.categoria);
  const foto = getCapaFromAtrativo(rota);
  const nome = getAtrativoNome(rota);

  return (
    <article className="relative box-border w-full min-w-0 max-w-full overflow-hidden rounded-2xl bg-white shadow-[0_2px_14px_-4px_rgba(26,46,40,0.08)] ring-1 ring-[#e8eeee]">
      <Link
        href={`/atrativos/${rota.id}`}
        className="box-border flex w-full min-w-0 gap-3 overflow-hidden p-3 pr-14"
      >
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54]">
          {foto ? (
            <Image src={foto} alt={nome} fill sizes="96px" className="object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 py-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1a4a3a]">
            {categoria.icone} {categoria.nome}
          </p>
          <h2 className="truncate text-base font-bold text-[#1a2e28]">{nome}</h2>
          {rota.descricao ? (
            <p className="mt-1 line-clamp-2 break-words text-sm leading-relaxed text-[#5a6b66]">
              {rota.descricao}
            </p>
          ) : null}
        </div>
      </Link>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          onRemover();
        }}
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0f0] text-[#e25555] transition-transform active:scale-95"
        aria-label="Remover dos favoritos"
      >
        <FavoriteIcon active className="h-5 w-5" />
      </button>
    </article>
  );
}
