"use client";

import Link from "next/link";
import AppDeveloperCredit from "@/components/AppDeveloperCredit";
import PrefeituraSupportLine from "@/components/PrefeituraSupportLine";
import AuthFlow from "@/components/AuthFlow";
import { useFeedback } from "@/components/FeedbackProvider";
import {
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_PHONE_DISPLAY,
  SITE_WHATSAPP_URL,
  SOCIAL_LINKS,
  getSiteTelHref,
} from "@/lib/siteContact";

const PERFIL_ATALHOS = [
  { id: "favoritos", emoji: "❤️", titulo: "Favoritos" },
  { id: "avaliar", emoji: "⭐", titulo: "Avaliações" },
  { id: "roteiros", emoji: "🗺️", titulo: "Roteiros" },
  { id: "perto", emoji: "📍", titulo: "Recomendações próximas" },
];

/**
 * Estado deslogado da aba Perfil.
 * @returns {import("react").JSX.Element}
 */
export default function PerfilLoggedOut() {
  const feedback = useFeedback();

  return (
    <div className="space-y-6">
      <ul className="space-y-2">
        {PERFIL_ATALHOS.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-[#e8eeee]"
          >
            <span className="text-lg" aria-hidden>
              {item.emoji}
            </span>
            <span className="text-sm font-semibold text-[#1a2e28]">{item.titulo}</span>
          </li>
        ))}
      </ul>

      <AuthFlow compact hideCopy />

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

      <button
        type="button"
        onClick={() => feedback?.openFeedback({ pagina_origem: "/perfil" })}
        className="block w-full text-center text-[11px] font-medium text-[#9aa8a3] underline-offset-2 hover:text-[#1a4a3a] hover:underline"
      >
        Enviar sugestão
      </button>

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
