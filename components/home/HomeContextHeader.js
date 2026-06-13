"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import PrefeituraSupportLine from "@/components/PrefeituraSupportLine";
import { HOME_CONTEXT_PILL_CLASS } from "@/components/home/homeTokens";

/**
 * @returns {"Boa manhã"|"Boa tarde"|"Boa noite"}
 */
function getSaudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Boa manhã";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

/**
 * HomeContextHeader - Saudação, local/clima e perfil.
 * @param {object} props
 * @returns {import('react').ReactElement}
 */
export default function HomeContextHeader({
  user,
  avatarUrl,
  locationLabel = "Imbituba, SC",
  temperatura = null,
  weatherEmoji = null,
  weatherCondition = null,
  climaLoading = false,
  climaErro = false,
  getUserInitial,
}) {
  const primeiroNome =
    user?.user_metadata?.full_name?.split(" ")?.[0] ||
    user?.user_metadata?.name?.split(" ")?.[0] ||
    user?.email?.split("@")?.[0] ||
    null;

  const saudacao = primeiroNome ? `${getSaudacao()}, ${primeiroNome}` : getSaudacao();

  const tempNum = Number(temperatura);
  const tempExibicao = Number.isFinite(tempNum) ? `${Math.round(tempNum)}°` : null;
  const mostrarClima = !climaLoading && (tempExibicao || climaErro);
  const tempLabel = tempExibicao || (climaErro ? "--°" : null);

  return (
    <header className="pb-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo size="md" variant="default" />
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a4a3a]/70">
                Guia de Bolso
              </p>
            </div>
            <PrefeituraSupportLine variant="inline" />
          </div>

          <p className="mt-3 text-sm font-medium text-[#5a6b66]">{saudacao} 👋</p>

          <h1 className="mt-1 font-display text-[1.75rem] font-bold leading-[1.12] tracking-tight text-[#1a2e28]">
            O que fazer <span className="text-[#1a4a3a]">agora?</span>
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className={HOME_CONTEXT_PILL_CLASS} aria-label={locationLabel}>
              <svg
                className="h-3.5 w-3.5 shrink-0 text-[#1a4a3a]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
              <span className="truncate">{locationLabel}</span>
            </span>

            {climaLoading && (
              <span
                className="inline-flex h-8 w-20 animate-pulse rounded-full bg-[#e8eeee]"
                aria-hidden
              />
            )}

            {mostrarClima && tempLabel && (
              <span
                className={HOME_CONTEXT_PILL_CLASS}
                aria-label={
                  weatherCondition && tempExibicao
                    ? `${tempExibicao}, ${weatherCondition}`
                    : tempLabel
                }
              >
                <span className="font-semibold tabular-nums">{tempLabel}</span>
                {weatherEmoji && (
                  <span className="text-base leading-none" role="img" aria-hidden>
                    {weatherEmoji}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        <Link
          href={user ? "/perfil" : "/login"}
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-[#1a4a3a] shadow-[0_4px_16px_rgba(26,46,40,0.08)] ring-1 ring-[#e8eeee] transition-transform active:scale-95"
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
