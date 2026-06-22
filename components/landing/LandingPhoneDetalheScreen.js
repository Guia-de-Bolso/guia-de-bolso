"use client";

import RemotePhoto from "@/components/shared/RemotePhoto";
import { getBadgeParceiroLabel } from "@/lib/lugarBadges";

/**
 * Prévia da página de detalhe de um parceiro dentro do mockup.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingLugarCard} [props.lugar]
 * @param {boolean} [props.genericPartners]
 * @returns {import('react').ReactElement}
 */
export default function LandingPhoneDetalheScreen({ lugar, genericPartners = false }) {
  const nome = genericPartners ? "Estabelecimento parceiro" : lugar?.nome || "Seu estabelecimento";
  const categoria = genericPartners ? "Gastronomia" : lugar?.categoria || "Gastronomia";
  const capa = genericPartners ? null : lugar?.capa;

  return (
    <div className="h-full overflow-hidden bg-[#f0f4f3]">
      <div className="relative h-[42%] min-h-[140px]">
        {capa ? (
          <RemotePhoto src={capa} alt="" fill className="object-cover" priority />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#061612]/80 via-transparent to-black/20" />
        <span className="absolute left-3 top-3 rounded-full bg-[#f5e6b8]/95 px-2.5 py-1 text-[8px] font-bold uppercase tracking-wide text-[#7a6520]">
          {getBadgeParceiroLabel()}
        </span>
        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs">
          ♡
        </span>
      </div>

      <div className="-mt-5 relative mx-3 rounded-[18px] bg-white p-3.5 shadow-sm ring-1 ring-[#e8eeee]/80">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#1a4a3a]/70">
          {categoria}
        </p>
        <h2 className="mt-0.5 font-display text-[15px] font-bold leading-tight tracking-tight text-[#1a2e28]">
          {nome}
        </h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-[#e8f5ef] px-2 py-0.5 text-[9px] font-semibold text-[#1a4a3a]">
            Aberto agora
          </span>
          <span className="rounded-full bg-[#f3f6f5] px-2 py-0.5 text-[9px] font-medium text-[#5a6b66]">
            ★ 4,8 · 12 avaliações
          </span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            { label: "Ligar", icon: "📞" },
            { label: "Instagram", icon: "📷" },
            { label: "Cardápio", icon: "📋" },
            { label: "Site", icon: "🔗" },
          ].map((acao) => (
            <div
              key={acao.label}
              className="flex flex-col items-center gap-0.5 rounded-xl bg-[#f7faf9] py-2 text-center"
            >
              <span className="text-sm" aria-hidden>
                {acao.icon}
              </span>
              <span className="text-[8px] font-medium text-[#5a6b66]">{acao.label}</span>
            </div>
          ))}
        </div>

        <p className="mt-3 line-clamp-2 text-[10px] leading-relaxed text-[#5a6b66]">
          {lugar?.descricao ||
            "Descrição completa, fotos da equipe e ambiente — tudo que o turista precisa antes de ir."}
        </p>
      </div>

      <div className="mx-3 mt-3 rounded-[14px] bg-[#1a4a3a] py-2.5 text-center text-[11px] font-bold text-white">
        IR AGORA →
      </div>
    </div>
  );
}
