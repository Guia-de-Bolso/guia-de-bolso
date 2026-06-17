"use client";

import RemotePhoto from "@/components/shared/RemotePhoto";
import Link from "next/link";

/**
 * PlaceThumb - Circular thumbnail or initial fallback for a place row.
 * @param {object} props
 * @param {string} [props.imagemUrl] - Cover image URL.
 * @param {string} props.nome - Place name for fallback initial.
 * @returns {import('react').ReactElement}
 */
function PlaceThumb({ imagemUrl, nome }) {
  if (imagemUrl) {
    return (
      <RemotePhoto
        src={imagemUrl}
        alt={nome}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d4ede8] text-sm font-bold text-[#1a4a3a]">
      {(nome || "?").charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * SearchListItem - Compact linked row for search browse lists.
 * @param {object} props
 * @param {string} props.href - Destination path for the place.
 * @param {string} [props.imagemUrl] - Cover image URL.
 * @param {string} props.nome - Place name.
 * @param {string} props.categoria - Category label.
 * @param {import('react').ReactNode} props.leading - Leading icon or emoji.
 * @returns {import('react').ReactElement}
 */
export default function SearchListItem({ href, imagemUrl, nome, categoria, leading }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm transition-colors hover:bg-[#f7faf9] active:bg-[#eef3f1]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-base">
        {leading}
      </span>
      <PlaceThumb imagemUrl={imagemUrl} nome={nome} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1a2e28]">{nome}</p>
        <p className="truncate text-xs text-[#5a6b66]">{categoria}</p>
      </div>
    </Link>
  );
}
