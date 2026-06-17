"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import RemotePhoto from "@/components/shared/RemotePhoto";
import { useEffect, useRef, useState } from "react";
import LandingAmbient from "@/components/landing/LandingAmbient";
import LandingButton from "@/components/landing/LandingButton";
import LandingHeroFloatingCards from "@/components/landing/LandingHeroFloatingCards";
import LandingPhoneMockup from "@/components/landing/LandingPhoneMockup";
import LandingWaitlistForm from "@/components/landing/LandingWaitlistForm";
import PrefeituraSupportLine from "@/components/PrefeituraSupportLine";
import { LANDING } from "@/components/landing/landingTheme";
import {
  fadeUpHero,
  floatDevice,
  scaleIn,
  staggerHero,
} from "@/components/landing/landingMotion";
import { useLandingRichMotion } from "@/components/landing/useLandingRichMotion";
import {
  LANDING_HERO,
  LANDING_SECTION_IDS,
  landingContactMailto,
} from "@/lib/landingContent";

const HERO_VIDEO_URL =
  "https://rsdjbqzjdyeaedyqwrvc.supabase.co/storage/v1/object/public/hero-video/202605281010.mp4";

/**
 * @typedef {object} LandingHeroProps
 * @property {import('@/lib/landingPageData').LandingPageData['stats']} stats
 * @property {boolean} hasLiveData
 * @property {import('@/lib/landingPageData').LandingLugarCard[]} [showcase]
 * @property {import('@/lib/landingPageData').LandingLugarCard[]} [parceiros]
 * @property {import('@/lib/landingPageData').LandingPageData['categorias']} [categorias]
 * @property {string|null} [heroBackdrop]
 * @property {boolean} richMotion
 */

/**
 * @param {LandingHeroProps} props
 */
function useHeroMedia(showcase, heroBackdrop) {
  const heroImages = showcase.filter((p) => p.capa);
  const backdropUrl = heroBackdrop ?? heroImages[0]?.capa ?? null;
  const heroPosterUrl = backdropUrl ?? heroImages[1]?.capa ?? null;

  const [useVideoBackground, setUseVideoBackground] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const mediaReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mediaMobile = window.matchMedia("(max-width: 1023px)").matches;
    const saveData = navigator.connection?.saveData === true;
    setUseVideoBackground(!mediaReduced && !mediaMobile && !saveData);
  }, []);

  useEffect(() => {
    if (!useVideoBackground || videoFailed || !videoRef.current) return;
    const playPromise = videoRef.current.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => setVideoFailed(true));
    }
  }, [useVideoBackground, videoFailed]);

  return { heroImages, heroPosterUrl, useVideoBackground, videoFailed, videoRef };
}

/**
 * @param {LandingHeroProps & { sectionRef?: import('react').RefObject<HTMLElement|null>, bgStyle?: object, textStyle?: object, phoneStyle?: object, ambientStyle?: object, animatePhone?: boolean }} props
 */
function LandingHeroBody({
  stats,
  hasLiveData,
  showcase = [],
  parceiros = [],
  categorias = [],
  heroBackdrop = null,
  richMotion,
  sectionRef,
  bgStyle,
  textStyle,
  phoneStyle,
  ambientStyle,
  animatePhone = false,
}) {
  const { heroImages, heroPosterUrl, useVideoBackground, videoFailed, videoRef } = useHeroMedia(
    showcase,
    heroBackdrop
  );

  const heroStats = [
    { label: "Lugares", value: hasLiveData ? stats.totalLugares : "—" },
    { label: "Categorias", value: hasLiveData ? stats.categoriasComLugares : "—" },
    { label: "Parceiros", value: hasLiveData ? stats.parceirosCount : "—" },
  ];

  const BgWrap = bgStyle ? motion.div : "div";
  const TextWrap = textStyle ? motion.div : "div";
  const PhoneWrap = phoneStyle ? motion.div : "div";
  const AmbientWrap = ambientStyle ? motion.div : "div";
  const PhoneAnimator = animatePhone ? motion.div : "div";
  const EyebrowTag = richMotion ? motion.p : "p";
  const TitleTag = richMotion ? motion.h1 : "h1";
  const SubtitleTag = richMotion ? motion.p : "p";
  const CtaWrap = richMotion ? motion.div : "div";
  const StatsWrap = richMotion ? motion.dl : "dl";
  const WaitlistWrap = richMotion ? motion.div : "div";
  const motionChild = richMotion ? { variants: fadeUpHero } : {};
  const textWrapMotion = richMotion
    ? { initial: "hidden", animate: "visible", variants: staggerHero }
    : {};
  const phoneWrapMotion = richMotion ? { initial: "hidden", animate: "visible", variants: scaleIn } : {};

  return (
    <section
      ref={sectionRef}
      className={`relative overflow-x-clip ${LANDING.heroMinH} pt-[5.5rem] pb-16 sm:pt-32 sm:pb-24 lg:pb-32`}
      aria-labelledby="landing-hero-title"
    >
      {heroPosterUrl ? (
        <BgWrap
          className="landing-hero-video-grade pointer-events-none absolute inset-0"
          style={bgStyle}
          aria-hidden
        >
          {useVideoBackground && !videoFailed ? (
            <video
              ref={videoRef}
              className="landing-hero-video-frame h-full w-full object-cover object-center"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={heroPosterUrl}
              onError={() => setVideoFailed(true)}
            >
              <source src={HERO_VIDEO_URL} type="video/mp4" />
            </video>
          ) : (
            <RemotePhoto
              src={heroPosterUrl}
              alt=""
              fill
              priority
              className="landing-hero-video-frame object-cover object-[center_40%]"
            />
          )}
          <div className="landing-cinematic-overlay-video absolute inset-0" />
          <div className="landing-hero-vignette absolute inset-0" />
          {richMotion ? <div className="landing-hero-rim-glow absolute inset-0" /> : null}
          {richMotion ? (
            <AmbientWrap className="landing-hero-light-pass absolute inset-0" style={ambientStyle} />
          ) : null}
          {richMotion ? (
            <div className="landing-hero-ambient landing-ambient-drift absolute inset-0 opacity-90" />
          ) : null}
        </BgWrap>
      ) : (
        <LandingAmbient variant="hero" lite={!richMotion} />
      )}

      {heroPosterUrl && richMotion ? (
        <div
          className="landing-noise landing-hero-film-grain pointer-events-none absolute inset-0 z-[1]"
          aria-hidden
        />
      ) : null}
      {heroPosterUrl ? (
        <LandingAmbient variant="hero" className="opacity-35" lite={!richMotion} />
      ) : null}

      <div className="relative z-[3] mx-auto flex w-full max-w-[76rem] flex-col px-5 sm:px-8 lg:px-12">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1fr_minmax(0,300px)] lg:gap-12 xl:grid-cols-[1.05fr_minmax(0,320px)] xl:gap-16">
          <TextWrap
            className="order-2 lg:order-1 landing-hero-content-block"
            style={textStyle}
            {...textWrapMotion}
          >
            <EyebrowTag
              {...motionChild}
              className="landing-glass-dark inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[12px] font-medium tracking-wide text-white"
            >
              {hasLiveData && heroImages.length > 0 ? (
                <span className="flex -space-x-1.5" aria-hidden>
                  {heroImages.slice(0, 3).map((p) => (
                    <span
                      key={p.id}
                      className="relative inline-block h-6 w-6 overflow-hidden rounded-full ring-2 ring-white"
                    >
                      <RemotePhoto src={p.capa} alt="" fill className="object-cover" />
                    </span>
                  ))}
                </span>
              ) : null}
              <span>
                {hasLiveData && stats.totalLugares > 0
                  ? `${stats.totalLugares}+ experiências · ${LANDING_HERO.eyebrow}`
                  : LANDING_HERO.eyebrow}
              </span>
            </EyebrowTag>

            <PrefeituraSupportLine variant="hero" className="mt-3" />

            <TitleTag
              id="landing-hero-title"
              {...motionChild}
              className="landing-display mt-6 max-w-[12ch] text-[clamp(2.75rem,8vw,4.5rem)] font-semibold leading-[0.98] text-white lg:mt-8 xl:text-[4.75rem]"
            >
              <span className="block">{LANDING_HERO.line1}</span>
              <span className="mt-1 block bg-gradient-to-br from-[#dff8ea] via-[#9de3c2] to-[#6ec89d] bg-clip-text text-transparent">
                {LANDING_HERO.line2}
              </span>
            </TitleTag>

            <SubtitleTag
              {...motionChild}
              className="mt-5 max-w-md text-lg leading-relaxed text-white/85 sm:mt-6 sm:text-xl sm:leading-relaxed"
            >
              {LANDING_HERO.subtitle}
            </SubtitleTag>

            <CtaWrap
              {...motionChild}
              className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4"
            >
              <LandingButton href={`#${LANDING_SECTION_IDS.categorias}`} variant="primary" size="lg">
                {LANDING_HERO.ctaExplore}
              </LandingButton>
              <LandingButton
                href={landingContactMailto("Cadastrar meu negócio")}
                variant="secondary"
                size="lg"
                external
              >
                {LANDING_HERO.ctaBusiness}
              </LandingButton>
            </CtaWrap>

            <WaitlistWrap {...motionChild}>
              <LandingWaitlistForm
                variant="hero"
                origem="landing-hero"
                id={LANDING_SECTION_IDS.listaEspera}
              />
            </WaitlistWrap>

            <StatsWrap
              {...motionChild}
              className="landing-hero-stats relative z-[1] mt-10 grid grid-cols-3 gap-3 border-t border-white/25 pt-8 sm:mt-14 sm:gap-4 sm:pt-9"
            >
              {heroStats.map((item) => (
                <div
                  key={item.label}
                  className="landing-hero-stat-card rounded-2xl px-3 py-3 sm:px-5 sm:py-4"
                >
                  <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/64 sm:text-[11px]">
                    {item.label}
                  </dt>
                  <dd className="landing-display mt-1 text-[1.5rem] font-semibold leading-none tabular-nums text-white sm:mt-1.5 sm:text-[2.3rem]">
                    {item.value}
                  </dd>
                </div>
              ))}
            </StatsWrap>
          </TextWrap>

          <PhoneWrap
            className="order-1 flex justify-center lg:order-2 lg:justify-end"
            style={phoneStyle}
            {...phoneWrapMotion}
          >
            <div className="relative">
              {richMotion ? <LandingHeroFloatingCards places={showcase} /> : null}
              <div
                className="landing-device-glow pointer-events-none absolute -inset-20 -z-10 sm:-inset-24"
                aria-hidden
              />
              {richMotion ? (
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[70%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7fd4ae]/15 blur-[60px]"
                  aria-hidden
                />
              ) : null}
              <PhoneAnimator {...(animatePhone ? floatDevice : {})}>
                <LandingPhoneMockup
                  screen="home"
                  size="hero"
                  emAlta={showcase}
                  parceiros={parceiros}
                  categorias={categorias}
                  animateEntrance={richMotion}
                  className="relative z-[1] drop-shadow-[0_40px_80px_rgba(7,15,12,0.28)]"
                />
              </PhoneAnimator>
            </div>
          </PhoneWrap>
        </div>
      </div>

      {heroPosterUrl ? <div className="landing-hero-bottom-bridge" aria-hidden /> : null}
    </section>
  );
}

/**
 * @param {Omit<LandingHeroProps, 'richMotion'>} props
 */
function LandingHeroMobile(props) {
  return <LandingHeroBody {...props} richMotion={false} />;
}

/**
 * @param {Omit<LandingHeroProps, 'richMotion'>} props
 */
function LandingHeroDesktop(props) {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const textY = useTransform(scrollYProgress, [0, 1], [0, 56]);
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, 28]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const ambientY = useTransform(scrollYProgress, [0, 1], [0, -24]);

  return (
    <LandingHeroBody
      {...props}
      sectionRef={sectionRef}
      richMotion
      bgStyle={{ y: bgY, scale: bgScale }}
      textStyle={{ y: textY }}
      phoneStyle={{ y: phoneY }}
      ambientStyle={{ y: ambientY }}
      animatePhone
    />
  );
}

/**
 * Hero — sem parallax no mobile para scroll fluido.
 * @param {Omit<LandingHeroProps, 'richMotion'>} props
 * @returns {import('react').ReactElement}
 */
export default function LandingHero(props) {
  const richMotion = useLandingRichMotion();

  if (richMotion) {
    return <LandingHeroDesktop {...props} />;
  }

  return <LandingHeroMobile {...props} />;
}
