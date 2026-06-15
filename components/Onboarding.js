"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import PrefeituraSupportLine from "@/components/PrefeituraSupportLine";
import { ONBOARDING_SLIDES } from "@/lib/authImagery";
import { PREFETURA_SUPPORT_LINE } from "@/lib/institutionalSupport";
import { createClient } from "@/lib/supabase/client";

const SWIPE_THRESHOLD_PX = 52;
const SLIDE_COUNT = ONBOARDING_SLIDES.length;

/** @typedef {'login' | 'home'} OnboardingDestination */

/**
 * Slide de fundo com fallback se a imagem falhar ao carregar.
 * @param {object} props
 * @param {object} props.image
 * @param {boolean} props.active
 * @param {boolean} props.reducedMotion
 * @param {string} props.motionSafe
 * @returns {import("react").ReactElement}
 */
function OnboardingBackgroundSlide({ image, active, reducedMotion, motionSafe }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [image.src]);

  return (
    <div
      className={`absolute inset-0 ${motionSafe} ${
        active ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!active}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.src}
          alt={active ? image.alt : ""}
          loading={active ? "eager" : "lazy"}
          fetchPriority={active ? "high" : "auto"}
          decoding="async"
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover opacity-90 ${
            active && !reducedMotion ? "onboarding-ken-burns" : ""
          }`}
        />
      ) : (
        <div
          className="h-full w-full bg-gradient-to-br from-[#1a4a3a] via-[#0d2820] to-[#071612]"
          aria-hidden
        />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#071612]/45 via-[#1a4a3a]/35 to-[#071612]/80"
        aria-hidden
      />
    </div>
  );
}

/**
 * Onboarding imersivo em tela cheia — fotos, valor e gestos de swipe.
 * @param {object} props
 * @param {boolean} [props.isLoggedIn=false] - Sessão ativa (evita loop login→home).
 * @param {(dest: OnboardingDestination) => void} [props.onComplete]
 * @returns {import("react").ReactElement}
 */
export default function Onboarding({ isLoggedIn = false, onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [sessionLoggedIn, setSessionLoggedIn] = useState(isLoggedIn);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isLastSlide = currentSlide === SLIDE_COUNT - 1;
  const slide = ONBOARDING_SLIDES[currentSlide];
  const progressPct = ((currentSlide + 1) / SLIDE_COUNT) * 100;
  const loggedIn = isLoggedIn || sessionLoggedIn;

  useEffect(() => {
    setSessionLoggedIn(isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setSessionLoggedIn(true);
    });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /** @param {OnboardingDestination} dest */
  const finish = useCallback(
    (dest) => {
      onComplete?.(dest);
    },
    [onComplete]
  );

  /** Visitante → login; já logado → home (evita redirect imediato em /login). */
  const finishEnter = useCallback(() => {
    finish(loggedIn ? "home" : "login");
  }, [finish, loggedIn]);

  const finishExplore = useCallback(() => {
    finish("home");
  }, [finish]);

  function goToSlide(index) {
    setCurrentSlide(Math.max(0, Math.min(index, SLIDE_COUNT - 1)));
  }

  function handlePrimaryAction() {
    if (isLastSlide) {
      finishEnter();
      return;
    }
    goToSlide(currentSlide + 1);
  }

  function handleTouchStart(event) {
    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
  }

  function handleTouchEnd(event) {
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    const deltaY = event.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaY) > Math.abs(deltaX)) return;

    if (deltaX < 0 && !isLastSlide) goToSlide(currentSlide + 1);
    else if (deltaX > 0 && currentSlide > 0) goToSlide(currentSlide - 1);
  }

  const motionSafe = reducedMotion ? "" : "transition-all duration-700 ease-out";
  const primaryCtaLabel = isLastSlide
    ? loggedIn
      ? "Continuar no guia"
      : "Entrar no guia"
    : "Próximo";

  const showPrefeituraInFooter =
    slide.kicker !== PREFETURA_SUPPORT_LINE && !isLastSlide;

  return (
    <section
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#071612] text-white"
      aria-label="Introdução ao Guia de Bolso"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes onboardingKenBurns {
            from { transform: scale(1.05); }
            to { transform: scale(1.12); }
          }
          @keyframes onboardingFloatIn {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes onboardingPulseCta {
            0%, 100% { box-shadow: 0 8px 28px rgba(184, 230, 212, 0.35); }
            50% { box-shadow: 0 12px 36px rgba(184, 230, 212, 0.55); }
          }
          .onboarding-ken-burns {
            animation: onboardingKenBurns 14s ease-in-out infinite alternate;
          }
          .onboarding-content-enter {
            animation: onboardingFloatIn 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          .onboarding-cta-glow {
            animation: onboardingPulseCta 2.5s ease-in-out infinite;
          }
        }
      `}</style>

      <div className="absolute inset-0">
        {ONBOARDING_SLIDES.map((item, index) => (
          <OnboardingBackgroundSlide
            key={item.image.src}
            image={item.image}
            active={index === currentSlide}
            reducedMotion={reducedMotion}
            motionSafe={motionSafe}
          />
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[min(52dvh,420px)] bg-gradient-to-t from-[#071612]/80 from-[12%] via-[#071612]/18 via-[48%] to-transparent"
        aria-hidden
      />

      <header className="relative z-20 shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 backdrop-blur-md">
            <Logo size="sm" variant="light" />
          </span>
          <button
            type="button"
            onClick={finishEnter}
            className="min-h-10 rounded-full px-3 py-1.5 text-sm font-semibold text-white/90 backdrop-blur-md ring-1 ring-white/20 transition active:bg-white/15"
            aria-label={
              loggedIn ? "Pular introdução e ir para o guia" : "Pular introdução e ir para login"
            }
          >
            Pular
          </button>
        </div>
        <div
          className="mt-3 h-1 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-valuenow={currentSlide + 1}
          aria-valuemin={1}
          aria-valuemax={SLIDE_COUNT}
          aria-label={`Passo ${currentSlide + 1} de ${SLIDE_COUNT}`}
        >
          <div
            className={`h-full rounded-full bg-[#b8e6d4] ${reducedMotion ? "" : "transition-all duration-500 ease-out"}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3 pt-2">
          <div key={currentSlide} className="onboarding-content-enter max-w-md">
            {slide.kicker === PREFETURA_SUPPORT_LINE ? (
              <PrefeituraSupportLine variant="onboarding" />
            ) : (
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b8e6d4]">
                {slide.kicker}
              </p>
            )}
            <h1
              className={`mt-2 font-display font-extrabold leading-[1.08] tracking-tight text-white ${
                isLastSlide ? "text-[1.65rem]" : "text-[1.85rem]"
              }`}
            >
              {slide.title}
            </h1>
            <p
              className={`mt-2 max-w-[20rem] leading-snug text-white/85 ${
                isLastSlide ? "text-sm" : "text-[15px]"
              }`}
            >
              {slide.subtitle}
            </p>

            <div
              className={`inline-flex max-w-full items-center gap-2 rounded-2xl bg-white/10 px-3.5 backdrop-blur-md ring-1 ring-white/15 ${
                isLastSlide ? "mt-4 py-2.5" : "mt-5 py-3"
              }`}
            >
              <span
                className={`shrink-0 font-display font-extrabold leading-none text-[#b8e6d4] ${
                  slide.stat.compact ? "text-xl" : "text-3xl"
                }`}
              >
                {slide.stat.value}
              </span>
              <span
                className={`min-w-0 font-semibold uppercase leading-snug text-white/75 ${
                  slide.stat.compact ? "text-[10px] tracking-wide" : "pb-0.5 text-xs tracking-wide"
                }`}
              >
                {slide.stat.label}
              </span>
            </div>

            <ul
              className={`flex flex-col ${isLastSlide ? "mt-3 max-h-[28vh] gap-2 overflow-y-auto overscroll-contain" : "mt-4 gap-2.5"}`}
              aria-label="Destaques"
            >
              {slide.highlights.map((item, index) => (
                <li
                  key={item.text}
                  className={`flex items-center gap-2.5 rounded-2xl bg-white/10 px-3.5 backdrop-blur-md ring-1 ring-white/10 ${
                    isLastSlide ? "py-2.5" : "py-3"
                  }`}
                  style={
                    reducedMotion
                      ? undefined
                      : { animationDelay: `${80 + index * 70}ms` }
                  }
                >
                  <span className="text-lg" aria-hidden>
                    {item.emoji}
                  </span>
                  <span className="text-sm font-semibold leading-snug text-white/95">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="relative z-20 mx-auto w-full max-w-md shrink-0 pb-safe-bottom pt-3">
          {showPrefeituraInFooter ? (
            <PrefeituraSupportLine variant="hero" className="mb-3" />
          ) : null}
          <div className="flex justify-center gap-2" role="tablist" aria-label="Slides">
            {ONBOARDING_SLIDES.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === currentSlide}
                aria-label={`Ir para slide ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8e6d4] ${
                  index === currentSlide ? "w-9 bg-[#b8e6d4]" : "w-2 bg-white/35"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handlePrimaryAction}
            className={`mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#b8e6d4] text-base font-bold text-[#053d24] ${
              !reducedMotion && isLastSlide ? "onboarding-cta-glow" : ""
            } transition active:scale-[0.98] active:bg-[#a3dcc8]`}
          >
            {primaryCtaLabel}
          </button>

          {isLastSlide ? (
            <>
              <button
                type="button"
                onClick={finishExplore}
                className="mt-2 flex min-h-11 w-full items-center justify-center rounded-2xl text-sm font-semibold text-white/90 ring-1 ring-white/25 transition active:bg-white/10"
              >
                Explorar sem criar conta
              </button>
              <p className="mt-2 text-center text-[11px] leading-snug text-white/50">
                {loggedIn
                  ? "Você já está conectado — continue explorando"
                  : "Entrar no guia abre login com Google ou SMS"}
              </p>
            </>
          ) : (
            <p className="mt-2 text-center text-[11px] text-white/50">
              Deslize ↔ ou toque em Próximo
            </p>
          )}
        </footer>
      </div>
    </section>
  );
}
