"use client";

import { useEffect, useMemo } from "react";
import {
  detectStorePlatform,
  getStoreUrlForPlatform,
  isStoreLinkConfigured,
} from "@/lib/appStoreLinks";

/**
 * @param {object} props
 * @param {{ appStore: string|null, playStore: string|null }} props.links
 * @returns {import("react").ReactElement}
 */
export default function BaixarAppClient({ links }) {
  const appStoreReady = isStoreLinkConfigured(links.appStore);
  const playStoreReady = isStoreLinkConfigured(links.playStore);

  const platform = useMemo(() => {
    if (typeof navigator === "undefined") return "other";
    return detectStorePlatform(navigator.userAgent);
  }, []);

  const redirectUrl = useMemo(
    () => getStoreUrlForPlatform(platform, links),
    [platform, links]
  );

  useEffect(() => {
    if (!redirectUrl) return undefined;
    const timer = window.setTimeout(() => {
      window.location.replace(redirectUrl);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [redirectUrl]);

  return (
    <div className="mt-8 space-y-3">
      {redirectUrl ? (
        <p className="rounded-xl bg-white/80 px-4 py-3 text-center text-sm text-[#5a6b66] ring-1 ring-[#e8eeee]">
          Redirecionando para a loja… Se não abrir, use um dos botões abaixo.
        </p>
      ) : null}

      <StoreButton
        label="Baixar na App Store"
        sublabel="iPhone e iPad"
        href={links.appStore}
        ready={appStoreReady}
        variant="apple"
        highlighted={platform === "ios"}
      />

      <StoreButton
        label="Baixar no Google Play"
        sublabel="Android"
        href={links.playStore}
        ready={playStoreReady}
        variant="google"
        highlighted={platform === "android"}
      />

      {!appStoreReady && !playStoreReady ? (
        <p className="pt-2 text-center text-xs leading-relaxed text-[#5a6b66]">
          Os links das lojas serão ativados em breve. Salve esta página ou escaneie o QR novamente
          depois do lançamento oficial.
        </p>
      ) : null}
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.sublabel
 * @param {string|null} props.href
 * @param {boolean} props.ready
 * @param {"apple"|"google"} props.variant
 * @param {boolean} [props.highlighted]
 * @returns {import("react").ReactElement}
 */
function StoreButton({ label, sublabel, href, ready, variant, highlighted = false }) {
  const baseClass =
    "flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition active:scale-[0.99]";
  const variantClass =
    variant === "apple"
      ? "bg-[#1a2e28] text-white shadow-md"
      : "bg-white text-[#1a2e28] ring-1 ring-[#dce8e3] shadow-sm";
  const highlightClass = highlighted && ready ? "ring-2 ring-[#7fd4ae] ring-offset-2 ring-offset-[#f0f4f3]" : "";

  const content = (
    <>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          variant === "apple" ? "bg-white/10" : "bg-[#f0f4f3]"
        }`}
        aria-hidden
      >
        {variant === "apple" ? <AppleIcon /> : <PlayIcon />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span
          className={`mt-0.5 block text-xs ${variant === "apple" ? "text-white/70" : "text-[#5a6b66]"}`}
        >
          {ready ? sublabel : "Em breve"}
        </span>
      </span>
      {ready ? (
        <span className={`text-lg ${variant === "apple" ? "text-white/80" : "text-[#1a4a3a]"}`} aria-hidden>
          →
        </span>
      ) : (
        <span className="rounded-full bg-[#e8eeee] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5a6b66]">
          Em breve
        </span>
      )}
    </>
  );

  if (ready && href) {
    return (
      <a
        href={href}
        className={`${baseClass} ${variantClass} ${highlightClass}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={`${baseClass} ${variantClass} cursor-not-allowed opacity-60`}
      aria-disabled="true"
    >
      {content}
    </div>
  );
}

function AppleIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden>
      <path fill="#34A853" d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" />
      <path fill="#FBBC04" d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" />
      <path fill="#4285F4" d="M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81Z" />
      <path fill="#EA4335" d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
    </svg>
  );
}
