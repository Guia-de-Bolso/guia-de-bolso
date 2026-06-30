import Link from "next/link";
import BaixarAppClient from "@/components/baixar/BaixarAppClient";
import { getAppStoreLinks } from "@/lib/appStoreLinks";
import { PREFETURA_SUPPORT_LINE } from "@/lib/institutionalSupport";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_BRAND_NAME, SITE_NAME_SHORT } from "@/lib/seoBrand";

export const metadata = buildPageMetadata({
  title: "Baixar o app",
  description:
    "Baixe o Guia de Bolso para iPhone e Android — guia turístico de Imbituba, SC, com praias, gastronomia e busca com IA.",
  path: "/baixar",
});

/**
 * Página pública para QR code e links de download (App Store + Google Play).
 * @returns {import("react").ReactElement}
 */
export default function BaixarPage() {
  const links = getAppStoreLinks();

  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10 pb-16">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a4a3a]">
            {SITE_NAME_SHORT}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#1a2e28]">
            Baixe o app
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#5a6b66]">
            Guia turístico de <strong className="text-[#1a4a3a]">Imbituba, SC</strong> — praias,
            gastronomia, trilhas e busca com IA no bolso.
          </p>
          <p className="mt-2 text-sm text-[#5a6b66]">{PREFETURA_SUPPORT_LINE}</p>
        </div>

        <BaixarAppClient links={links} />

        <p className="mt-auto pt-10 text-center text-sm text-[#5a6b66]">
          <Link href="/" className="text-[#1a4a3a] font-semibold hover:underline">
            Explorar no navegador
          </Link>
          <span className="mx-2">·</span>
          <Link href="/sobre" className="text-[#1a4a3a] hover:underline">
            Sobre o {SITE_BRAND_NAME}
          </Link>
        </p>
      </main>
    </div>
  );
}
