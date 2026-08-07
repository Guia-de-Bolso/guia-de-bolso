"use client";

import {
  INFO_CARD_PREMIUM_CLASS,
  INFO_CHIP_PUBLIC_CLASS,
} from "@/components/lugar/airbnb/lugarAirbnbTokens";

/**
 * Ícone do WhatsApp.
 * @param {object} props
 * @param {string} [props.className] - Classes Tailwind do SVG.
 * @returns {import("react").JSX.Element}
 */
function IconWhatsApp({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/**
 * Ícone do Instagram.
 * @param {object} props
 * @param {string} [props.className] - Classes Tailwind do SVG.
 * @returns {import("react").JSX.Element}
 */
function IconInstagram({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm10 2H7a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3zm-5 3.5A4.5 4.5 0 1112 16a4.5 4.5 0 010-9zm0 2A2.5 2.5 0 1014.5 12 2.5 2.5 0 0012 9.5zM17.75 6.25a1 1 0 11-1 1 1 1 0 011-1z" />
    </svg>
  );
}

/**
 * Ícone do Facebook.
 * @param {object} props
 * @param {string} [props.className] - Classes Tailwind do SVG.
 * @returns {import("react").JSX.Element}
 */
function IconFacebook({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 22v-8.2h2.8l.4-3.3h-3.2V8.5c0-1 .3-1.7 1.8-1.7H17V3.6c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.7v2.6H7.2v3.3h2.6V22h3.7z" />
    </svg>
  );
}

/**
 * Ícone de cardápio / gastronomia.
 * @param {object} props
 * @param {string} [props.className] - Classes Tailwind do SVG.
 * @returns {import("react").JSX.Element}
 */
function IconUtensils({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8.1 13.34l2.83-2.83L3.91 3.5a4.008 4.008 0 000 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />
    </svg>
  );
}

/**
 * Ícone de site / web genérico.
 * @param {object} props
 * @param {string} [props.className] - Classes Tailwind do SVG.
 * @returns {import("react").JSX.Element}
 */
function IconGlobe({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.93 6h-2.95a15.6 15.6 0 00-1.2-3.1A8.03 8.03 0 0118.93 8zM12 4.04A13.8 13.8 0 0113.91 8h-3.82A13.8 13.8 0 0112 4.04zM4.26 14a8.18 8.18 0 010-4h3.38A16.47 16.47 0 007.5 12c0 .69.05 1.36.14 2H4.26zm.81 2h2.95c.3 1.13.7 2.18 1.2 3.1A8.03 8.03 0 015.07 16zm2.95-8H5.07a8.03 8.03 0 014.15-3.1A15.6 15.6 0 008.02 8zM12 19.96A13.8 13.8 0 0110.09 16h3.82A13.8 13.8 0 0112 19.96zM14.34 14H9.66A14.84 14.84 0 019.5 12c0-.69.06-1.36.16-2h4.68c.1.64.16 1.31.16 2s-.06 1.36-.16 2zm.44 5.1c.5-.92.9-1.97 1.2-3.1h2.95a8.03 8.03 0 01-4.15 3.1zM16.36 14c.09-.64.14-1.31.14-2s-.05-1.36-.14-2h3.38a8.18 8.18 0 010 4h-3.38z" />
    </svg>
  );
}

const ICONS_ESTABELECIMENTO = {
  whatsapp: IconWhatsApp,
  instagram: IconInstagram,
  facebook: IconFacebook,
  cardapio: IconUtensils,
  site: IconGlobe,
};

/**
 * Card de contato (estabelecimento) — mesmo visual dos cards de informação (praia, trilha).
 * @param {object} props
 * @param {{ id: string, label: string, href?: string|null }} props.acao
 * @param {import("react").ComponentType<{ className?: string }>} props.Icon
 * @returns {import("react").JSX.Element}
 */
function InfoCardContato({ acao, Icon }) {
  const bloqueado = !acao.href;
  const content = (
    <>
      {bloqueado && (
        <span
          className="absolute right-2 top-2 text-[11px] text-[#7a6520]"
          aria-hidden
        >
          🔒
        </span>
      )}
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1a4a3a] ring-1 ring-[#e8eeee]"
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-center text-[15px] font-bold leading-tight tracking-tight text-[#1a2e28]">
        {acao.label}
      </span>
      <span className="text-center text-[11px] font-medium leading-snug text-[#5a6b66]">
        {acao.href ? "Abrir" : "Perfil Parceiro"}
      </span>
    </>
  );

  if (bloqueado) {
    return (
      <div
        className={`${INFO_CARD_PREMIUM_CLASS} relative border border-dashed border-[#c9b66f] bg-[#fffdf5]`}
        role="listitem"
        aria-label={`${acao.label} disponível no perfil Parceiro`}
      >
        {content}
      </div>
    );
  }

  return (
    <a
      href={acao.href}
      target="_blank"
      rel="noopener noreferrer"
      className={INFO_CARD_PREMIUM_CLASS}
      role="listitem"
      aria-label={acao.label}
    >
      {content}
    </a>
  );
}

/**
 * Botão ou link de ação rápida para estabelecimentos — layout legado.
 * @param {object} props
 * @param {string} props.label - Texto exibido abaixo do ícone.
 * @param {string} [props.href] - URL externa; se ausente, renderiza botão desabilitado.
 * @param {import("react").ComponentType<{ className?: string }>} props.Icon - Componente de ícone.
 * @returns {import("react").JSX.Element}
 */
function BotaoEstabelecimento({ label, href, Icon, variant = "default" }) {
  const isAirbnb = variant === "airbnb";

  const content = (
    <>
      <Icon className={isAirbnb ? "h-4 w-4" : "h-5 w-5"} />
      <span className={isAirbnb ? "text-[10px] font-semibold leading-tight" : "text-xs font-medium"}>
        {label}
      </span>
    </>
  );

  const className = isAirbnb
    ? `flex w-[3.75rem] shrink-0 flex-col items-center gap-1 rounded-lg border px-1.5 py-2 text-[#1a4a3a] ${
        href
          ? "border-[#b8d4cc] bg-[#f0f4f3] transition-transform active:scale-95"
          : "border-[#d0ddd8] bg-[#f0f4f3]/50 opacity-40"
      }`
    : `flex w-[4.5rem] flex-col items-center gap-2 rounded-2xl px-2 py-3 text-[#1a4a3a] ${
        href
          ? "bg-white shadow-sm ring-1 ring-[#e3ebe7] transition-transform active:scale-95"
          : "bg-white/60 opacity-40 ring-1 ring-[#e3ebe7]/60"
      }`;

  if (!href) {
    return (
      <button type="button" disabled className={className} aria-label={`${label} indisponível`}>
        {content}
      </button>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  );
}

/**
 * Chip informativo para locais públicos (praia, trilha, etc.) — apenas exibição.
 * @param {object} props
 * @param {{ id: string, label: string, emoji: string }} props.acao - Dados da ação informativa.
 * @returns {import("react").JSX.Element}
 */
function InfoCardPremium({ acao }) {
  const valor = acao.valor ?? acao.label;
  const subtitulo = acao.subtitulo ?? "";

  return (
    <div className={INFO_CARD_PREMIUM_CLASS} role="listitem" aria-label={acao.label}>
      <span className="text-[26px] leading-none" aria-hidden>
        {acao.emoji}
      </span>
      <span className="text-center text-[15px] font-bold leading-tight tracking-tight text-[#1a2e28]">
        {valor}
      </span>
      {subtitulo ? (
        <span className="text-center text-[11px] font-medium leading-snug text-[#5a6b66]">
          {subtitulo}
        </span>
      ) : null}
    </div>
  );
}

function ChipPublico({ acao, variant = "default" }) {
  const isAirbnb = variant === "airbnb";
  const isPremium = variant === "premium";

  if (isPremium) {
    return <InfoCardPremium acao={acao} />;
  }

  if (isAirbnb) {
    return (
      <div className={INFO_CHIP_PUBLIC_CLASS} role="listitem" aria-label={acao.label}>
        <span className="text-base leading-none" aria-hidden>
          {acao.emoji}
        </span>
        <span className="line-clamp-2 text-center text-[10px] font-semibold leading-snug">
          {acao.label}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex min-w-[5.5rem] max-w-[9.5rem] shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl bg-white px-3 py-3 text-[#1a4a3a] shadow-sm ring-1 ring-[#e3ebe7]"
      role="listitem"
      aria-label={acao.label}
    >
      <span className="text-lg leading-none" aria-hidden>
        {acao.emoji}
      </span>
      <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight">
        {acao.label}
      </span>
    </div>
  );
}

/**
 * Seção de ações rápidas na página do lugar (links externos ou chips informativos).
 * @param {object} props
 * @param {"estabelecimento"|"publico"} [props.modo="estabelecimento"] - Layout e tipo de ação.
 * @param {"default"|"airbnb"|"premium"} [props.variant="default"] - Estilo visual dos chips.
 * @param {Array<{ id: string, label: string, href?: string, emoji?: string }>} [props.acoes=[]] - Lista de ações; vazio oculta a seção.
 * @returns {import("react").JSX.Element|null}
 */
export default function LugarQuickActions({
  modo = "estabelecimento",
  variant = "default",
  acoes = [],
}) {
  if (!acoes.length) return null;

  const isEstabelecimento = modo === "estabelecimento";
  const isAirbnb = variant === "airbnb";
  const isPremium = variant === "premium";
  const cardsPremium = isPremium || (isAirbnb && isEstabelecimento);

  return (
    <section className={isAirbnb || isPremium ? "" : "mt-6"}>
      <div
        className={
          cardsPremium
            ? "flex flex-wrap gap-3"
            : isEstabelecimento
              ? "mx-auto flex w-full max-w-sm justify-center gap-2.5"
              : `flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide snap-x snap-mandatory [-webkit-overflow-scrolling:touch]${isAirbnb ? "" : ""}`
        }
        role="list"
        aria-label={
          isEstabelecimento
            ? "Ações rápidas do estabelecimento"
            : "Informações do local"
        }
      >
        {isEstabelecimento
          ? acoes.map((acao) => {
              const Icon = ICONS_ESTABELECIMENTO[acao.id] || IconGlobe;
              if (cardsPremium) {
                return <InfoCardContato key={acao.id} acao={acao} Icon={Icon} />;
              }
              return (
                <BotaoEstabelecimento
                  key={acao.id}
                  label={acao.label}
                  href={acao.href}
                  Icon={Icon}
                  variant={variant}
                />
              );
            })
          : acoes.map((acao) => (
              <ChipPublico key={acao.id} acao={acao} variant={variant} />
            ))}
      </div>
    </section>
  );
}
