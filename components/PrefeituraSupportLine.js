import Link from "next/link";
import {
  PREFETURA_SUPPORT_LINE,
  PREFETURA_SUPPORT_SOBRE_PATH,
} from "@/lib/institutionalSupport";

const VARIANT_CLASS = {
  hero: "flex items-center justify-center text-xs font-medium leading-snug text-white/70",
  inline: "mt-1 text-[10px] font-semibold leading-snug text-[#1a4a3a]/55",
  onboarding:
    "text-xs font-bold uppercase tracking-[0.18em] leading-snug text-[#b8e6d4]",
  footer: "text-[10px] leading-relaxed text-[#9aa8a3]",
};

const FOOTER_LINK_CLASS = "text-[10px] leading-relaxed text-[#9aa8a3]";

/**
 * Linha de apoio institucional da Prefeitura Municipal de Imbituba.
 * @param {object} props
 * @param {"hero"|"inline"|"onboarding"|"footer"} [props.variant="inline"]
 * @param {boolean} [props.showLink=false] - Link "Saiba mais" para /sobre.
 * @param {string} [props.className]
 * @returns {import("react").ReactElement}
 */
export default function PrefeituraSupportLine({
  variant = "inline",
  showLink = false,
  className = "",
}) {
  const baseClass = VARIANT_CLASS[variant] ?? VARIANT_CLASS.inline;
  const linkClass =
    variant === "hero" || variant === "onboarding"
      ? "font-semibold text-white/90 underline underline-offset-2"
      : "font-semibold text-[#1a4a3a] underline underline-offset-2";

  return (
    <div className={className}>
      <p className={`m-0 ${baseClass}`}>
        <span className="text-pretty">{PREFETURA_SUPPORT_LINE}</span>
      </p>
      {showLink ? (
        <p className={`mt-1 ${FOOTER_LINK_CLASS}`}>
          <Link href={PREFETURA_SUPPORT_SOBRE_PATH} className={linkClass}>
            Saiba mais
          </Link>
        </p>
      ) : null}
    </div>
  );
}
