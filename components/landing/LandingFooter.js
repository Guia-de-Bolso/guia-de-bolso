import Link from "next/link";
import Logo from "@/components/Logo";
import PrefeituraSupportLine from "@/components/PrefeituraSupportLine";
import { IconInstagram, IconMail, IconTikTok } from "@/components/landing/LandingIcons";
import {
  LANDING_CONTACT_EMAIL,
  LANDING_SECTION_IDS,
  landingContactMailto,
} from "@/lib/landingContent";
import { SITE_DOMAIN, SOCIAL_LINKS } from "@/lib/siteContact";

/**
 * Rodapé minimal.
 * @returns {import('react').ReactElement}
 */
export default function LandingFooter() {
  return (
    <footer
      id={LANDING_SECTION_IDS.contato}
      className="border-t border-[rgba(13,31,25,0.06)] bg-[#fafaf9] py-16 sm:py-20"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-5 lg:px-10">
        <div className="sm:col-span-2">
          <Logo size="md" showWordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#5c6f68]">
            Guia de Bolso Imbituba — turismo local em SC. Não confundir com Guiabolso
            (finanças).
          </p>
          <PrefeituraSupportLine variant="footer" className="mt-3 max-w-xs" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a9b94]">Anunciantes</p>
          <ul className="mt-4 space-y-2 text-sm" role="list">
            <li>
              <Link href="/para-negocios" className="font-medium text-[#1a4a3a] hover:text-[#0d1f19]">
                Página para anunciantes
              </Link>
            </li>
            <li>
              <Link href="/para-negocios#planos" className="text-[#5c6f68] hover:text-[#0d1f19]">
                Plano Parceiro
              </Link>
            </li>
            <li>
              <Link href="/para-negocios#curadoria" className="text-[#5c6f68] hover:text-[#0d1f19]">
                Curadoria e rotas
              </Link>
            </li>
            <li>
              <Link href="/para-negocios#parceiros-ativos" className="text-[#5c6f68] hover:text-[#0d1f19]">
                Parceiros ativos
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a9b94]">Explorar</p>
          <ul className="mt-4 space-y-2 text-sm" role="list">
            <li>
              <Link href="/guia" className="text-[#5c6f68] hover:text-[#0d1f19]">
                Guias de turismo
              </Link>
            </li>
            <li>
              <Link href="/guia/o-que-fazer-em-imbituba" className="text-[#5c6f68] hover:text-[#0d1f19]">
                O que fazer em Imbituba
              </Link>
            </li>
            <li>
              <Link href="/guia/praia-do-rosa" className="text-[#5c6f68] hover:text-[#0d1f19]">
                Praia do Rosa
              </Link>
            </li>
            <li>
              <Link href="/guia/onde-comer-em-imbituba" className="text-[#5c6f68] hover:text-[#0d1f19]">
                Onde comer
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="text-[#5c6f68] hover:text-[#0d1f19]">
                Sobre o guia
              </Link>
            </li>
            <li>
              <Link href="/imbituba" className="text-[#5c6f68] hover:text-[#0d1f19]">
                Sobre Imbituba
              </Link>
            </li>
            <li>
              <Link href="/categorias" className="text-[#5c6f68] hover:text-[#0d1f19]">
                Categorias
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a9b94]">Legal</p>
          <ul className="mt-4 space-y-2 text-sm" role="list">
            <li>
              <Link href="/termos" className="text-[#5c6f68] hover:text-[#0d1f19]">
                Termos
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="text-[#5c6f68] hover:text-[#0d1f19]">
                Privacidade
              </Link>
            </li>
            <li>
              <Link href="/excluir-conta" className="text-[#5c6f68] hover:text-[#0d1f19]">
                Excluir conta
              </Link>
            </li>
            <li>
              <a href={landingContactMailto()} className="text-[#5c6f68] hover:text-[#0d1f19]">
                {LANDING_CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a9b94]">Social</p>
          <ul className="mt-4 flex gap-3" role="list">
            <li>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-2 text-[#5c6f68] ring-1 ring-[rgba(13,31,25,0.08)] hover:text-[#0d1f19]"
                aria-label="Instagram"
              >
                <IconInstagram className="h-5 w-5" />
              </a>
            </li>
            <li>
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-2 text-[#5c6f68] ring-1 ring-[rgba(13,31,25,0.08)] hover:text-[#0d1f19]"
                aria-label="TikTok"
              >
                <IconTikTok className="h-5 w-5" />
              </a>
            </li>
          </ul>
          <p className="mt-6 text-xs text-[#8a9b94]">{SITE_DOMAIN}</p>
        </div>
      </div>

      <p className="mx-auto mt-12 max-w-6xl px-5 text-center text-xs text-[#8a9b94] sm:px-8 lg:px-10">
        © {new Date().getFullYear()} Guia de Bolso Imbituba
      </p>
    </footer>
  );
}
