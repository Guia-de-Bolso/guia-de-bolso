"use client";

import Link from "next/link";

/**
 * Estados de carregamento/erro para detalhe offline de favoritos.
 * @param {object} props
 * @param {boolean} props.loading
 * @param {boolean} props.notFound
 * @param {string} props.backHref
 * @param {import("react").ReactNode} [props.children]
 * @returns {import("react").ReactElement}
 */
export default function OfflineFavoritoDetailShell({
  loading,
  notFound,
  backHref,
  children,
}) {
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] px-4">
        <p className="text-sm font-medium text-[#5a6b66]">Carregando favorito…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f4f3] px-6 text-center">
        <p className="font-display text-xl font-bold text-[#1a4a3a]">
          Conteúdo offline indisponível
        </p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#5a6b66]">
          Este favorito ainda não foi salvo neste aparelho. Abra com internet e favorite
          novamente, ou volte quando estiver online.
        </p>
        <Link
          href={backHref}
          className="mt-6 rounded-xl bg-[#1a4a3a] px-5 py-3 text-sm font-semibold text-white"
        >
          Voltar aos favoritos
        </Link>
      </div>
    );
  }

  return children;
}
