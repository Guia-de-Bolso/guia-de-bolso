"use client";

import { getClaimPerfilWhatsAppUrl } from "@/lib/lugarVisibilidade";

/**
 * CTA para o dono/gestor desbloquear o perfil completo (perfil básico / teaser).
 * @param {object} props
 * @param {{ nome?: string, slug?: string, id?: string, categoria?: string, subcategoria?: string }} props.lugar
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
          ? "rounded-2xl bg-[#fffdf5] p-4 ring-1 ring-[#eadcae]"
          : "mt-6 rounded-2xl bg-[#fffdf5] p-4 shadow-sm ring-1 ring-[#eadcae]"
      }
      aria-label="Desbloquear perfil completo"
    >
      <p className="text-[15px] font-bold leading-snug text-[#1a2e28]">
        Este perfil está no guia. Contato e fotos completas só com Parceiro.
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-[#5a6b66]">
        Você é o proprietário ou gerencia este local? Ative o perfil para mostrar
        todos os canais, fotos e comentários.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClaimClick}
        className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#1a4a3a] px-4 py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
      >
        Ativar perfil Parceiro
      </a>
    </section>
  );
}
