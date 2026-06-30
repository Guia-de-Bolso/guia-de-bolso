import Link from "next/link";
import JsonLdScript from "@/components/seo/JsonLdScript";
import { getCategoriasVisiveis, getCategoriaHref } from "@/lib/categorias";
import { buildSobreMetadata } from "@/lib/seo";
import { buildSobrePageJsonLd } from "@/lib/seoJsonLd";
import { SITE_BRAND_NAME, SITE_NAME_SHORT } from "@/lib/seoBrand";
import {
  PREFETURA_SUPPORT_LINE,
  PREFETURA_SUPPORT_SOBRE,
} from "@/lib/institutionalSupport";
import {
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_PHONE_DISPLAY,
  SITE_WHATSAPP_URL,
  SOCIAL_LINKS,
  getSiteTelHref,
} from "@/lib/siteContact";

export const metadata = buildSobreMetadata();

/**
 * Página pública de marca — turismo em Imbituba e desambiguação vs Guiabolso (finanças).
 * @returns {import('react').ReactElement}
 */
export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <JsonLdScript data={buildSobrePageJsonLd()} />
      <article className="mx-auto max-w-2xl px-6 py-10">
        <nav className="text-sm text-[#5a6b66]" aria-label="Breadcrumb">
          <Link href="/" className="text-[#1a4a3a] hover:underline">
            Início
          </Link>
          <span className="mx-2">/</span>
          <span>Sobre</span>
        </nav>

        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[#1a2e28] sm:text-4xl">
          {SITE_BRAND_NAME} — turismo em Imbituba
        </h1>

        <p className="mt-4 text-base leading-relaxed text-[#5a6b66]">
          O <strong className="text-[#1a4a3a]">{SITE_NAME_SHORT}</strong> é o guia
          turístico digital de <strong>Imbituba, Santa Catarina</strong>: praias, Praia do
          Rosa, gastronomia, trilhas, atrativos curados e busca com inteligência artificial para
          moradores e visitantes.
        </p>

        <section className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-[#e8eeee]">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1a4a3a]">
            {PREFETURA_SUPPORT_LINE}
          </p>
          <h2 className="mt-3 text-lg font-bold text-[#1a2e28]">
            {PREFETURA_SUPPORT_SOBRE.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5a6b66]">
            {PREFETURA_SUPPORT_SOBRE.lead}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#5a6b66]">
            {PREFETURA_SUPPORT_SOBRE.body}
          </p>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-[#e8eeee]">
          <h2 className="text-lg font-bold text-[#1a2e28]">
            Não é o app de finanças Guiabolso
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5a6b66]">
            Se você procurou &quot;Guia Bolso&quot; pensando em controle financeiro ou
            empréstimos, este não é o produto certo. O{" "}
            <strong className="text-[#1a4a3a]">{SITE_BRAND_NAME}</strong> é exclusivamente
            de <strong>turismo e descoberta local</strong> no litoral sul de SC — sem
            relação com a empresa financeira Guiabolso.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-[#1a2e28]">O que você encontra aqui</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#5a6b66]">
            <li>Lugares verificados com horários, mapa e avaliações moderadas</li>
            <li>Categorias: Natureza, Gastronomia, Noite, Cultura e mais</li>
            <li>Atrativos e roteiros com IA para planejar o dia</li>
            <li>Guias editoriais para planejar viagem a Imbituba</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-[#1a2e28]">Explorar</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/guia" className="font-semibold text-[#1a4a3a] hover:underline">
                Todos os guias de turismo
              </Link>
            </li>
            <li>
              <Link
                href="/guia/o-que-fazer-em-imbituba"
                className="font-semibold text-[#1a4a3a] hover:underline"
              >
                O que fazer em Imbituba
              </Link>
            </li>
            <li>
              <Link href="/imbituba" className="font-semibold text-[#1a4a3a] hover:underline">
                Sobre o destino Imbituba
              </Link>
            </li>
            <li>
              <Link href="/categorias" className="font-semibold text-[#1a4a3a] hover:underline">
                Categorias e lugares
              </Link>
            </li>
            {getCategoriasVisiveis().slice(0, 4).map((cat) => (
              <li key={cat.nome}>
                <Link
                  href={getCategoriaHref(cat.nome)}
                  className="text-[#1a4a3a] hover:underline"
                >
                  {cat.nome} em Imbituba
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-[#1a2e28]">Contato e redes</h2>
          <p className="mt-3 text-sm text-[#5a6b66]">
            <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="font-semibold text-[#1a4a3a] hover:underline">
              {SITE_CONTACT_EMAIL}
            </a>
            {" · "}
            <a href={getSiteTelHref()} className="font-semibold text-[#1a4a3a] hover:underline">
              {SITE_CONTACT_PHONE_DISPLAY}
            </a>
            {" · "}
            <a
              href={SITE_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#1a4a3a] hover:underline"
            >
              WhatsApp
            </a>
          </p>
          <ul className="mt-3 flex flex-wrap gap-3 text-sm">
            <li>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#1a4a3a] hover:underline"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#1a4a3a] hover:underline"
              >
                TikTok
              </a>
            </li>
          </ul>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/categorias"
            className="rounded-xl bg-[#1a4a3a] py-3.5 text-center text-sm font-semibold text-white"
          >
            Explorar lugares
          </Link>
          <Link
            href="/para-negocios"
            className="rounded-xl bg-white py-3.5 text-center text-sm font-semibold text-[#1a4a3a] ring-1 ring-[#e8eeee]"
          >
            Cadastrar negócio
          </Link>
        </div>
      </article>
    </div>
  );
}
