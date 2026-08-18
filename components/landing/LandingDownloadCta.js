import Link from "next/link";
import {
  LANDING_DOWNLOAD,
  LANDING_DOWNLOAD_HREF,
} from "@/lib/landingContent";

/** @typedef {"hero" | "dark"} LandingDownloadVariant */

const VARIANT_STYLES = {
  hero: {
    wrapper: "mt-8 max-w-md border-t border-white/20 pt-8 sm:mt-10",
    kicker: "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7fd4ae]",
    title: "mt-2 font-display text-lg font-semibold tracking-tight text-white",
    hint: "mt-1 text-sm leading-relaxed text-white/70",
    stores: "mt-3 text-xs font-medium text-white/55",
    link: "text-[#9de3c2] underline-offset-2 hover:underline",
  },
  dark: {
    wrapper: "relative mx-auto mt-10 max-w-md text-center",
    kicker: "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7fd4ae]",
    title: "mt-2 font-display text-xl font-semibold tracking-tight text-white",
    hint: "mx-auto mt-1 max-w-sm text-sm leading-relaxed text-white/65",
    stores: "mt-3 text-xs font-medium text-white/50",
    link: "text-[#9de3c2] underline-offset-2 hover:underline",
  },
};

/**
 * Selo de disponibilidade nas lojas — o download vai para /baixar.
 * @param {object} props
 * @param {LandingDownloadVariant} [props.variant]
 * @param {string} [props.id]
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function LandingDownloadCta({
  variant = "hero",
  id = "baixar-app",
  className = "",
}) {
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.hero;

  return (
    <div id={id} className={`${styles.wrapper} ${className}`.trim()}>
      <p className={styles.kicker}>{LANDING_DOWNLOAD.kicker}</p>
      <h3 className={styles.title}>{LANDING_DOWNLOAD.title}</h3>
      <p className={styles.hint}>{LANDING_DOWNLOAD.hint}</p>
      <p className={styles.stores}>
        <Link href={LANDING_DOWNLOAD_HREF} className={styles.link}>
          {LANDING_DOWNLOAD.stores}
        </Link>
      </p>
    </div>
  );
}
