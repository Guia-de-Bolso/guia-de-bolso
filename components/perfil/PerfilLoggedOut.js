"use client";

import Link from "next/link";
import AppDeveloperCredit from "@/components/AppDeveloperCredit";
import PrefeituraSupportLine from "@/components/PrefeituraSupportLine";
import AuthFlow from "@/components/AuthFlow";
import Logo from "@/components/Logo";
import PerfilSettingsGroup from "@/components/perfil/PerfilSettingsGroup";
import { useFeedback } from "@/components/FeedbackProvider";
import { PERFIL_BENEFICIOS } from "@/lib/perfil";
import {
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_PHONE_DISPLAY,
  SITE_WHATSAPP_URL,
  SOCIAL_LINKS,
  getSiteTelHref,
} from "@/lib/siteContact";

/**
 * Estado deslogado da aba Perfil.
 * @returns {import("react").JSX.Element}
 */
export default function PerfilLoggedOut() {
  const feedback = useFeedback();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a4a3a] via-[#1a4a3a] to-[#0f3028] px-6 py-8 text-center text-white shadow-md">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/5"
          aria-hidden
        />
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 p-3 ring-4 ring-white/20">
          <Logo size="md" variant="light" />
        </div>
        <h2 className="relative mt-5 text-xl font-bold leading-tight">
          Entre e personalize sua viagem
        </h2>
        <p className="relative mt-2 text-sm leading-relaxed text-white/85">
          Favoritos, avaliações, atrativos, roteiros com IA e preferências salvas na sua conta.
        </p>
      </div>

      <section aria-labelledby="perfil-beneficios-title">
        <h2
          id="perfil-beneficios-title"
          className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#5a6b66]"
        >
          O que você ganha
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {PERFIL_BENEFICIOS.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e8eeee]"
            >
              <span className="text-2xl" aria-hidden>
                {item.emoji}
              </span>
              <p className="mt-2 text-sm font-bold text-[#1a2e28]">{item.titulo}</p>
              <p className="mt-1 text-xs leading-snug text-[#5a6b66]">
                {item.descricao}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#e8eeee]">
        <p className="mb-4 text-center text-sm font-semibold text-[#1a2e28]">
          Criar conta ou entrar
        </p>
        <AuthFlow compact />
      </div>

      <PerfilSettingsGroup
        title="Ajuda e feedback"
        items={[
          {
            key: "feedback",
            icon: "💬",
            label: "Enviar sugestão ou reportar problema",
            onClick: () =>
              feedback?.openFeedback({ pagina_origem: "/perfil" }),
          },
        ]}
      />

      <Link
        href="/"
        className="block text-center text-sm font-medium text-[#5a6b66] underline-offset-2 hover:text-[#1a4a3a] hover:underline"
      >
        Continuar sem login
      </Link>

      <p className="text-center text-[11px] leading-relaxed text-[#9aa8a3]">
        <Link href="/termos" className="font-semibold text-[#1a4a3a] underline">
          Termos
        </Link>
        {" · "}
        <Link href="/privacidade" className="font-semibold text-[#1a4a3a] underline">
          Privacidade
        </Link>
      </p>
      <p className="text-center text-[11px] leading-relaxed text-[#9aa8a3]">
        <a
          href={getSiteTelHref()}
          className="font-semibold text-[#1a4a3a] underline"
        >
          {SITE_CONTACT_PHONE_DISPLAY}
        </a>
        {" · "}
        <a
          href={SITE_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#1a4a3a] underline"
        >
          WhatsApp
        </a>
        {" · "}
        <a
          href={`mailto:${SITE_CONTACT_EMAIL}`}
          className="font-semibold text-[#1a4a3a] underline"
        >
          {SITE_CONTACT_EMAIL}
        </a>
        {" · "}
        <a
          href={SOCIAL_LINKS.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#1a4a3a] underline"
        >
          Instagram
        </a>
        {" · "}
        <a
          href={SOCIAL_LINKS.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#1a4a3a] underline"
        >
          TikTok
        </a>
      </p>

      <PrefeituraSupportLine variant="footer" showLink className="mt-4 text-center" />
      <AppDeveloperCredit showProductLine className="mt-4" />
    </div>
  );
}
