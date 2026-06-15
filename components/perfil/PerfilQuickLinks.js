"use client";

import Link from "next/link";

const LINKS = [
  { href: "/favoritos", emoji: "❤️", label: "Favoritos" },
  { href: "/categorias", emoji: "🧭", label: "Explorar" },
  { href: "/atrativos", emoji: "🗺️", label: "Atrativos" },
  { href: "/?busca=1", emoji: "✨", label: "Busca IA" },
];

/**
 * Atalhos rápidos horizontais no perfil.
 * @returns {import("react").JSX.Element}
 */
export default function PerfilQuickLinks() {
  return (
    <section aria-labelledby="perfil-atalhos-title">
      <h2
        id="perfil-atalhos-title"
        className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#5a6b66]"
      >
        Acesso rápido
      </h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide [&::-webkit-scrollbar]:hidden">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex shrink-0 snap-start items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#1a4a3a] shadow-sm ring-1 ring-[#e8eeee] transition active:scale-[0.97]"
          >
            <span className="text-base leading-none" aria-hidden>
              {item.emoji}
            </span>
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
