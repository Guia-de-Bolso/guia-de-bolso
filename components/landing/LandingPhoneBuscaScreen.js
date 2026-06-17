"use client";

import RemotePhoto from "@/components/shared/RemotePhoto";

/**
 * Prévia de resultados de busca com IA destacando um parceiro.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingLugarCard} [props.lugar]
 * @returns {import('react').ReactElement}
 */
export default function LandingPhoneBuscaScreen({ lugar }) {
  const nome = lugar?.nome || "Seu estabelecimento";
  const categoria = lugar?.categoria || "Gastronomia";
  const capa = lugar?.capa;

  const outros = [
    { nome: "Opção local", categoria: "Gastronomia" },
    { nome: "Outro lugar", categoria: categoria },
  ];

  return (
    <div className="h-full bg-[#f0f4f3] px-3.5 pb-3 pt-1">
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a4a3a] text-[10px] font-bold text-white"
          aria-hidden
        >
          GB
        </div>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#1a4a3a]/70">
          Busca com IA
        </p>
      </div>

      <div className="mt-3 rounded-[18px] bg-white/95 px-3 py-2.5 ring-1 ring-[#e8eeee]/80">
        <p className="text-[11px] font-medium text-[#1a2e28]">
          &ldquo;Onde comer com vista do mar?&rdquo;
        </p>
      </div>

      <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.16em] text-[#1a4a3a]/75">
        Sugestões do guia
      </p>

      <div className="mt-2 space-y-2">
        <article className="overflow-hidden rounded-[16px] bg-white ring-2 ring-[#f5e6b8]/80 ring-offset-1">
          <div className="flex gap-2.5 p-2.5">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#e8f2ee]">
              {capa ? (
                <RemotePhoto src={capa} alt="" fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="rounded-full bg-[#f5e6b8]/95 px-2 py-0.5 text-[7px] font-bold uppercase tracking-wide text-[#7a6520]">
                Parceiro · destaque IA
              </span>
              <p className="mt-1 line-clamp-1 text-[12px] font-bold text-[#1a2e28]">{nome}</p>
              <p className="text-[9px] text-[#5a6b66]">{categoria} · 1,2 km</p>
            </div>
          </div>
        </article>

        {outros.map((item) => (
          <article
            key={item.nome}
            className="flex items-center gap-2.5 rounded-[16px] bg-white/80 p-2.5 ring-1 ring-[#e8eeee]/60"
          >
            <div className="h-14 w-14 shrink-0 rounded-xl bg-[#e8f2ee]" />
            <div>
              <p className="text-[12px] font-semibold text-[#1a2e28]">{item.nome}</p>
              <p className="text-[9px] text-[#8a9b94]">{item.categoria}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
