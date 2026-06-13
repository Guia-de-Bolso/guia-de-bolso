import Link from "next/link";
import {
  PREFETURA_SUPPORT_LINE,
  PREFETURA_SUPPORT_SOBRE_PATH,
} from "@/lib/institutionalSupport";

/**
 * Ícone neutro de prédio institucional (sem logo da prefeitura).
 * @param {object} props
 * @param {string} [props.className]
 * @returns {import("react").ReactElement}
 */
function InstitutionalIcon({ className = "h-3.5 w-3.5 shrink-0" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 9h.01M12 9h.01M15 9h.01M9 12h.01M12 12h.01M15 12h.01" />
    </svg>
  );
}

const VARIANT_CLASS = {
  hero: "inline-flex items-center gap-2 text-xs font-medium text-white/70",
  inline: "mt-1 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#1a4a3a]/55",
  footer: "text-[10px] leading-relaxed text-[#9aa8a3]",
};

/**
 * Linha de apoio institucional da Prefeitura Municipal de Imbituba.
 * @param {object} props
 * @param {"hero"|"inline"|"footer"} [props.variant="inline"]
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
    variant === "hero"
      ? "font-semibold text-white/90 underline underline-offset-2"
      : "font-semibold text-[#1a4a3a] underline underline-offset-2";

  return (
    <div className={className}>
      <p className={baseClass}>
        <InstitutionalIcon
          className={
            variant === "inline"
              ? "h-3 w-3 shrink-0 text-[#1a4a3a]/45"
              : "h-3.5 w-3.5 shrink-0"
          }
        />
        <span>{PREFETURA_SUPPORT_LINE}</span>
      </p>
      {showLink ? (
        <p className={`mt-1 ${VARIANT_CLASS.footer}`}>
          <Link href={PREFETURA_SUPPORT_SOBRE_PATH} className={linkClass}>
            Saiba mais
          </Link>
        </p>
      ) : null}
    </div>
  );
}
