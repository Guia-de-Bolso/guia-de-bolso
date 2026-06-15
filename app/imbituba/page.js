import Link from "next/link";
import { CATEGORIAS_EXPLORE, getCategoriaHref } from "@/lib/categorias";
import { buildImbitubaMetadata } from "@/lib/seo";

export const metadata = buildImbitubaMetadata();

/**
 * Landing SEO — Imbituba como destino.
 * @returns {import('react').ReactElement}
 */
export default function ImbitubaPage() {
  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <article className="mx-auto max-w-md px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a4a3a]/75">
          Santa Catarina · Brasil
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#1a2e28]">
          Imbituba
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#5a6b66]">
          Cidade litorânea famosa pelas praias (Praia do Rosa, Praia da Vila, Ibiraquera),
          surf, observação de baleias francas na temporada e natureza preservada. O{" "}
          <strong className="font-semibold text-[#1a4a3a]">Guia de Bolso</strong> reúne
          lugares verificados, atrativos e busca com IA para moradores e visitantes.
        </p>

        <h2 className="mt-8 text-lg font-bold text-[#1a2e28]">Explore por categoria</h2>
        <ul className="mt-3 space-y-2">
          {CATEGORIAS_EXPLORE.map((cat) => (
            <li key={cat.nome}>
              <Link
                href={getCategoriaHref(cat.nome)}
                className="text-sm font-semibold text-[#1a4a3a] underline-offset-2 hover:underline"
              >
                {cat.icone} {cat.nome}
              </Link>
              <span className="ml-2 text-sm text-[#5a6b66]">— {cat.descricaoCurta}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm leading-relaxed text-[#5a6b66]">
          <Link
            href="/guia/o-que-fazer-em-imbituba"
            className="font-semibold text-[#1a4a3a] underline-offset-2 hover:underline"
          >
            O que fazer em Imbituba — guia completo
          </Link>
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/categorias"
            className="rounded-xl bg-[#1a4a3a] py-3.5 text-center text-sm font-semibold text-white"
          >
            Explorar lugares
          </Link>
          <Link
            href="/"
            className="rounded-xl bg-white py-3.5 text-center text-sm font-semibold text-[#1a4a3a] ring-1 ring-[#e8eeee]"
          >
            Voltar ao início
          </Link>
        </div>
      </article>
    </div>
  );
}
