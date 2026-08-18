"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import LandingButton from "@/components/landing/LandingButton";
import { IconClose, IconMenu } from "@/components/landing/LandingIcons";
import Logo from "@/components/Logo";
import { navbarTransition } from "@/components/landing/landingMotion";
import {
  useLandingMotion,
  useLandingRichMotion,
} from "@/components/landing/useLandingRichMotion";
import { useLandingNav } from "@/hooks/useLandingNav";
import { LANDING_DOWNLOAD_HREF, LANDING_HERO } from "@/lib/landingContent";

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.setOpen
 * @param {boolean} props.overHero
 * @param {{ label: string, href: string }[]} props.navItems
 * @param {string} props.homePath
 */
function LandingNavbarLinks({ open, setOpen, overHero, navItems, homePath }) {
  return (
    <>
      <ul className="hidden items-center gap-9 lg:flex" role="list">
        {navItems.map((link) => (
          <li key={link.href}>
            {link.href.startsWith("#") ? (
              <a
                href={link.href}
                className={`landing-link-underline text-[13px] font-medium transition-colors duration-500 ${
                  overHero
                    ? "text-white/75 hover:text-white"
                    : "text-[#4a5c56] hover:text-[#0a1612]"
                }`}
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className={`landing-link-underline text-[13px] font-medium transition-colors duration-500 ${
                  overHero
                    ? "text-white/75 hover:text-white"
                    : "text-[#4a5c56] hover:text-[#0a1612]"
                }`}
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>

      <div className="hidden items-center gap-2.5 sm:flex">
        {overHero ? (
          <>
            <LandingButton href="/para-negocios" variant="secondary" size="md">
              {LANDING_HERO.ctaBusiness}
            </LandingButton>
            <LandingButton href={LANDING_DOWNLOAD_HREF} variant="primary" size="md">
              {LANDING_HERO.ctaDownload}
            </LandingButton>
          </>
        ) : (
          <>
            <LandingButton href="/para-negocios" variant="ghost" size="md">
              {LANDING_HERO.ctaBusiness}
            </LandingButton>
            <LandingButton href={LANDING_DOWNLOAD_HREF} variant="primary" size="md">
              {LANDING_HERO.ctaDownload}
            </LandingButton>
          </>
        )}
      </div>

      <button
        type="button"
        className={`rounded-full p-2.5 sm:hidden ${
          open
            ? "bg-[#e8eeec] text-[#0a1612]"
            : overHero
              ? "bg-white/10 text-white backdrop-blur-md"
              : "landing-glass text-[#0a1612]"
        }`}
        aria-expanded={open}
        aria-controls="landing-mobile-menu"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
      </button>
    </>
  );
}

function LandingMobileNavItem({ link, onNavigate }) {
  const className =
    "block rounded-2xl px-4 py-3.5 text-[16px] font-medium text-[#0a1612] transition-colors active:bg-[#1a4a3a]/10";

  if (link.href.startsWith("#")) {
    return (
      <a href={link.href} className={className} onClick={onNavigate}>
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className} onClick={onNavigate}>
      {link.label}
    </Link>
  );
}

/**
 * Navbar mobile — scroll com rAF, sem Framer no header (evita re-render por frame).
 * @returns {import('react').ReactElement}
 */
function LandingNavbarLite() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { homePath, navItems } = useLandingNav();

  useEffect(() => {
    let raf = 0;
    const update = () => setScrolled(window.scrollY > 14);
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const barSolid = open || scrolled;
  const overHero = !barSolid;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[padding] duration-300 ease-out ${
        barSolid ? "py-0" : "py-1"
      }`}
    >
      <div
        className={
          open
            ? "landing-nav-bar-solid"
            : overHero
              ? "landing-nav-hero"
              : "landing-nav-scrolled"
        }
      >
        <nav
          className="relative z-[60] mx-auto flex max-w-[76rem] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12"
          style={{ height: barSolid ? 56 : 66 }}
          aria-label="Principal"
        >
          <div style={{ transform: barSolid ? "scale(0.965)" : "scale(1)" }}>
            <Link
              href={homePath}
              className="block rounded-xl transition-opacity hover:opacity-85 focus-visible:outline-none"
              aria-label="Guia de Bolso"
              onClick={() => setOpen(false)}
            >
              <Logo size="sm" showWordmark variant={overHero && !open ? "light" : "default"} />
            </Link>
          </div>

          <LandingNavbarLinks
            open={open}
            setOpen={setOpen}
            overHero={overHero}
            navItems={navItems}
            homePath={homePath}
          />
        </nav>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="landing-mobile-menu-backdrop fixed inset-0 z-[45] sm:hidden"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
            />
            <motion.div
              id="landing-mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="landing-mobile-menu-panel fixed inset-x-0 top-[56px] z-[55] max-h-[calc(100dvh-56px)] overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden"
            >
              <ul className="flex flex-col gap-0.5 px-5 py-5" role="list">
                {navItems.map((link) => (
                  <li key={link.href}>
                    <LandingMobileNavItem
                      link={link}
                      onNavigate={() => setOpen(false)}
                    />
                  </li>
                ))}
                <li className="mt-3 grid gap-2 border-t border-[#1a4a3a]/12 pt-4">
                  <LandingButton
                    href={LANDING_DOWNLOAD_HREF}
                    variant="primary"
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    {LANDING_HERO.ctaDownload}
                  </LandingButton>
                  <LandingButton
                    href="/para-negocios"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    {LANDING_HERO.ctaBusiness}
                  </LandingButton>
                </li>
              </ul>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

/**
 * Navbar desktop — shrink animado no scroll.
 * @returns {import('react').ReactElement}
 */
function LandingNavbarRich() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { homePath, navItems } = useLandingNav();

  useEffect(() => {
    let raf = 0;
    const update = () => setScrolled(window.scrollY > 14);
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const barSolid = open || scrolled;
  const overHero = !barSolid;

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      initial={false}
      animate={{
        paddingTop: barSolid ? 0 : 4,
        paddingBottom: barSolid ? 0 : 4,
      }}
      transition={navbarTransition}
    >
      <motion.div
        className={
          open
            ? "landing-nav-bar-solid"
            : overHero
              ? "landing-nav-hero"
              : "landing-nav-scrolled"
        }
        transition={navbarTransition}
      >
        <motion.nav
          className="relative z-[60] mx-auto flex max-w-[76rem] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12"
          aria-label="Principal"
          animate={{ height: barSolid ? 56 : 66 }}
          transition={navbarTransition}
        >
          <motion.div
            animate={{ scale: barSolid ? 0.965 : 1, y: barSolid ? -0.5 : 0 }}
            transition={navbarTransition}
          >
            <Link
              href={homePath}
              className="block rounded-xl transition-opacity hover:opacity-85 focus-visible:outline-none"
              aria-label="Guia de Bolso"
              onClick={() => setOpen(false)}
            >
              <Logo size="sm" showWordmark variant={overHero && !open ? "light" : "default"} />
            </Link>
          </motion.div>

          <LandingNavbarLinks
            open={open}
            setOpen={setOpen}
            overHero={overHero}
            navItems={navItems}
            homePath={homePath}
          />
        </motion.nav>
      </motion.div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="landing-mobile-menu-backdrop fixed inset-0 z-[45] sm:hidden"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
            />
            <motion.div
              id="landing-mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="landing-mobile-menu-panel fixed inset-x-0 top-[56px] z-[55] max-h-[calc(100dvh-56px)] overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden"
            >
              <ul className="flex flex-col gap-0.5 px-5 py-5" role="list">
                {navItems.map((link) => (
                  <li key={link.href}>
                    <LandingMobileNavItem
                      link={link}
                      onNavigate={() => setOpen(false)}
                    />
                  </li>
                ))}
                <li className="mt-3 grid gap-2 border-t border-[#1a4a3a]/12 pt-4">
                  <LandingButton
                    href={LANDING_DOWNLOAD_HREF}
                    variant="primary"
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    {LANDING_HERO.ctaDownload}
                  </LandingButton>
                  <LandingButton
                    href="/para-negocios"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    {LANDING_HERO.ctaBusiness}
                  </LandingButton>
                </li>
              </ul>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}

/**
 * Navbar premium — lite no mobile, animado no desktop.
 * @returns {import('react').ReactElement}
 */
export default function LandingNavbar() {
  const richMotion = useLandingRichMotion();
  const { liteMotion } = useLandingMotion();

  if (liteMotion) {
    return <LandingNavbarLite />;
  }

  if (richMotion) {
    return <LandingNavbarRich />;
  }

  return <LandingNavbarLite />;
}
