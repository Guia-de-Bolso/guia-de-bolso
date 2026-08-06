"use client";

import { getClaimPerfilWhatsAppUrl } from "@/lib/lugarVisibilidade";

/**
 * CTA para o dono/gestor desbloquear o perfil completo (perfil básico / teaser).
 * @param {object} props
 * @param {{ nome?: string, slug?: string, id?: string }} props.lugar
 * @param {() => void} [props.onClaimClick]
 * @param {"default"|"airbnb"} [props.variant]
 * @returns {import("react").JSX.Element}
 */
export default function LugarPerfilBloqueadoCta({
  lugar,
  onClaimClick,
  variant = "airbnb",
}) {
  const href = getClaimPerfilWhatsAppUrl(lugar);
  const isAirbnb = variant === "airbnb";

  return (
    <section
      className={
        isAirbnb
          ? "relative overflow-hidden rounded-2xl bg-white ring-1 ring-[#e8eeee]"
          : "relative mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#e8eeee]"
      }
      aria-label="Desbloquear perfil completo"
    >
      <div
        className="pointer-events-none select-none px-4 pb-16 pt-4 opacity-40 blur-[2.5px]"
        aria-hidden
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm font-semibold text-amber-500">★★★★★</span>
          <span className="text-xs font-medium text-[#5a6b66]">4,8 · 12 avaliações</span>
        </div>
        <p className="text-sm leading-relaxed text-[#5a6b66]">
          Galeria de fotos, cardápio, Instagram, site, telefone e avaliações de
          quem já visitou — tudo no perfil completo do estabelecimento.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Cardápio", "Instagram", "Site", "WhatsApp"].map((label) => (
            <span
              key={label}
              className="rounded-lg bg-[#f0f4f3] px-3 py-1.5 text-xs font-semibold text-[#1a4a3a]"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#f0f4f3] via-[#f0f4f3]/95 to-transparent px-4 pb-4 pt-12">
        <p className="text-center text-[15px] font-bold leading-snug text-[#1a2e28]">
          Você é o proprietário ou gerencia este local?
        </p>
        <p className="mt-1 text-center text-[13px] leading-snug text-[#5a6b66]">
          Entre em contato para desbloquear o perfil completo no Guia de Bolso.
        </p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClaimClick}
          className="mt-3 flex w-full items-center justify-center rounded-xl bg-[#1a4a3a] px-4 py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
        >
          Falar no WhatsApp
        </a>
      </div>
    </section>
  );
}
