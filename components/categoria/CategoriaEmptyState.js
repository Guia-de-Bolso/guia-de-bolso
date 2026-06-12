"use client";

import Link from "next/link";

/**
 * Estado vazio quando a categoria não tem lugares cadastrados.
 */
export default function CategoriaEmptyState({ meta }) {
  return (
    <div className="home-reveal overflow-hidden rounded-[28px] bg-white p-6 text-center ring-1 ring-[#e8eeee]">
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br text-3xl ${meta.gradient}`}
        aria-hidden
      >
        {meta.icone}
      </div>
      <h3 className="mt-5 text-lg font-bold tracking-tight text-[#1a2e28]">
        {meta.nome} em breve
      </h3>
      <p className="mx-auto mt-2 max-w-[28ch] text-sm leading-relaxed text-[#5a6b66]">
        Ainda estamos curando lugares nesta categoria. Enquanto isso, explore outras áreas do
        guia.
      </p>
      <div className="mt-6 flex flex-col gap-2.5">
        <Link
          href="/categorias"
          className="inline-flex items-center justify-center rounded-2xl bg-[#1a4a3a] px-5 py-3.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(26,74,58,0.28)] transition-transform active:scale-[0.98]"
        >
          Ver outras categorias
        </Link>
        <Link
          href="/?busca=1"
          className="inline-flex items-center justify-center rounded-2xl bg-[#f0f4f3] px-5 py-3.5 text-sm font-semibold text-[#1a4a3a] ring-1 ring-[#e8eeee] transition-transform active:scale-[0.98]"
        >
          Buscar com IA
        </Link>
      </div>
    </div>
  );
}
