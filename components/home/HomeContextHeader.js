"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { getSaudacaoPeriodo } from "@/lib/homeGreeting";

/**
 * HomeContextHeader — marca, saudação compacta e perfil.
 * @param {object} props
 * @returns {import('react').ReactElement}
 */
export default function HomeContextHeader({
  user,
  avatarUrl,
  temperatura = null,
  weatherEmoji = null,
  climaLoading = false,
  climaErro = false,
  getUserInitial,
}) {
  const primeiroNome =
    user?.user_metadata?.full_name?.split(" ")?.[0] ||
    user?.user_metadata?.name?.split(" ")?.[0] ||
    user?.email?.split("@")?.[0] ||
    null;

  // Saudação só no client — evita mismatch SSR (UTC no servidor vs fuso do aparelho).
  const [saudacao, setSaudacao] = useState("Olá");

  useEffect(() => {
    const periodo = getSaudacaoPeriodo();
    setSaudacao(primeiroNome ? `${periodo}, ${primeiroNome}` : periodo);
  }, [primeiroNome]);

  const tempNum = Number(temperatura);
  const tempExibicao =
    !climaErro && Number.isFinite(tempNum) ? `${Math.round(tempNum)}°` : null;
  const climaAria = tempExibicao
    ? weatherEmoji
      ? `${tempExibicao}`
      : tempExibicao
    : null;

  return (
    <header className="pb-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <Logo size="md" className="!h-11 w-auto" priority />
            <p className="min-w-0 flex-1 self-center truncate text-[12px] font-bold uppercase leading-none tracking-[0.14em] text-[#1a4a3a]/80">
              Guia de Bolso · Imbituba
            </p>
          </div>

          <p
            className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] font-medium leading-snug text-[#5a6b66]"
            suppressHydrationWarning
          >
            <span>{saudacao}</span>
            {climaLoading && (
              <span
                className="inline-block h-3.5 w-10 animate-pulse rounded-full bg-[#e8eeee]"
                aria-hidden
              />
            )}
            {!climaLoading && tempExibicao && (
              <span
                className="inline-flex items-center gap-1 tabular-nums text-[#1a4a3a]"
                aria-label={climaAria}
              >
                <span className="text-[#5a6b66]/45" aria-hidden>
                  ·
                </span>
                <span className="font-semibold">{tempExibicao}</span>
                {weatherEmoji ? (
                  <span className="text-[15px] leading-none" role="img" aria-hidden>
                    {weatherEmoji}
                  </span>
                ) : null}
              </span>
            )}
          </p>

          <h1 className="mt-1 font-display text-[1.5rem] font-bold leading-[1.15] tracking-tight text-[#1a2e28] sm:text-[1.6rem]">
            <span className="block">O que fazer em</span>
            <span className="block">
              <span className="text-[#1a4a3a]">Imbituba</span> agora?
            </span>
          </h1>
        </div>

        <Link
          href={user ? "/perfil" : "/login"}
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-[#1a4a3a] shadow-[0_4px_16px_rgba(26,46,40,0.08)] ring-1 ring-[#e8eeee] transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/55 focus-visible:ring-offset-2"
          aria-label={user ? "Abrir perfil" : "Entrar"}
        >
          {user && avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : user ? (
            <span className="flex h-full w-full items-center justify-center bg-[#1a4a3a] text-sm font-bold text-white">
              {getUserInitial(user)}
            </span>
          ) : (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <path d="M12 11a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          )}
        </Link>
      </div>
    </header>
  );
}
