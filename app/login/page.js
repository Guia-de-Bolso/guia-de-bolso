"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AppDeveloperCredit from "@/components/AppDeveloperCredit";
import PrefeituraSupportLine from "@/components/PrefeituraSupportLine";
import AuthFlow from "@/components/AuthFlow";
import Logo from "@/components/Logo";
import LegalConsentLine from "@/components/legal/LegalConsentLine";
import { LOGIN_HERO_IMAGE, LOGIN_VALUE_PILLS } from "@/lib/authImagery";
import { safeRedirectPath } from "@/lib/safeRedirectPath";
import { createClient } from "@/lib/supabase";

/**
 * Skeleton da tela de login.
 * @returns {import("react").ReactElement}
 */
function LoginLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#071612]">
      <div className="mx-auto max-w-[430px] animate-pulse px-6 pt-16">
        <div className="h-3 w-28 rounded-full bg-white/10" />
        <div className="mt-6 h-10 w-4/5 rounded-xl bg-white/10" />
        <div className="mt-8 h-24 rounded-3xl bg-white/10" />
        <div className="mt-6 space-y-3">
          <div className="h-14 rounded-2xl bg-white/10" />
          <div className="h-14 rounded-2xl bg-white/10" />
          <div className="h-14 rounded-2xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}

/**
 * Carrossel de pills de valor (login).
 * @returns {import("react").ReactElement}
 */
function LoginValueCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((index) => (index + 1) % LOGIN_VALUE_PILLS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const pill = LOGIN_VALUE_PILLS[active];

  return (
    <div
      className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-md ring-1 ring-white/15"
      aria-live="polite"
    >
      <span className="text-lg" aria-hidden>
        {pill.emoji}
      </span>
      <span className="text-sm font-semibold text-white/95">{pill.label}</span>
    </div>
  );
}

/**
 * Conteúdo da página de login.
 * @returns {import("react").ReactElement}
 */
function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error") === "auth";
  const redirectAfterLogin = safeRedirectPath(searchParams.get("next"));
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(redirectAfterLogin);
      else setCheckingSession(false);
    });
  }, [router, redirectAfterLogin]);

  if (checkingSession) {
    return <LoginLoadingSkeleton />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#071612] text-white">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes loginMeshDrift {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-4%, 2%) scale(1.05); }
            100% { transform: translate(2%, -3%) scale(1.02); }
          }
          @keyframes loginHeroZoom {
            from { transform: scale(1.08); }
            to { transform: scale(1.14); }
          }
          .login-hero-zoom {
            animation: loginHeroZoom 18s ease-in-out infinite alternate;
          }
          .login-mesh-blob {
            animation: loginMeshDrift 12s ease-in-out infinite alternate;
          }
        }
      `}</style>

      {/* Fundo imersivo */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGIN_HERO_IMAGE.src}
          alt=""
          className="login-hero-zoom h-full w-full object-cover opacity-90"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#071612]/50 via-[#1a4a3a]/60 to-[#071612]"
          aria-hidden
        />
        <div
          className="login-mesh-blob pointer-events-none absolute -left-1/4 top-1/4 h-[420px] w-[420px] rounded-full bg-[#b8e6d4]/20 blur-3xl"
          aria-hidden
        />
        <div
          className="login-mesh-blob pointer-events-none absolute -right-1/4 bottom-1/3 h-[360px] w-[360px] rounded-full bg-[#2d6b54]/40 blur-3xl"
          style={{ animationDelay: "-4s" }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[430px] flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        {/* Hero de valor */}
        <div className="flex flex-1 flex-col justify-end pb-6 pt-8">
          <Logo size="lg" variant="light" priority className="drop-shadow-sm" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#b8e6d4]">
            Imbituba, Santa Catarina
          </p>
          <h1 className="mt-3 font-display text-[2.15rem] font-extrabold leading-[1.05] tracking-tight">
            Sua próxima
            <span className="block text-[#b8e6d4]">descoberta começa aqui</span>
          </h1>
          <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-white/80">
            O guia que une praias, trilhas, gastronomia e rotas — com mapa, clima e busca em português.
          </p>
          <div className="mt-5">
            <LoginValueCarousel />
          </div>
        </div>

        {/* Painel de login — glass */}
        <section
          className="shrink-0 rounded-[28px] bg-white/95 p-5 text-[#1a2e28] shadow-[0_20px_60px_rgba(7,22,18,0.45)] backdrop-blur-xl ring-1 ring-white/40"
          aria-label="Entrar na conta"
        >
          {authError && (
            <div
              className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              Não foi possível concluir o login. Tente Google ou SMS novamente.
            </div>
          )}

          <AuthFlow variant="immersive" redirectAfterLogin={redirectAfterLogin} />

          <Link
            href="/"
            className="mt-4 flex min-h-11 w-full items-center justify-center rounded-2xl text-sm font-semibold text-[#5a6b66] transition active:bg-[#f0f4f3]"
          >
            Continuar sem login
          </Link>

          <div className="mt-4">
            <LegalConsentLine />
          </div>

          <PrefeituraSupportLine variant="footer" showLink className="mt-5 text-center" />
          <AppDeveloperCredit className="mt-3" />
        </section>
      </div>
    </div>
  );
}

/**
 * Página de login em tela cheia.
 * @returns {import("react").ReactElement}
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}
