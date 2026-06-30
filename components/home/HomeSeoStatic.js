import Link from "next/link";
import { getCategoriasVisiveis, getCategoriaHref } from "@/lib/categorias";

/**
 * Bloco indexável da home (h1 + links para categorias) — complementa o feed client.
 * @param {object} props
 * @param {number} [props.lugaresCount]
 * @returns {import('react').JSX.Element}
 */
export default function HomeSeoStatic({ lugaresCount = 0 }) {
  const categoriasComLugares = getCategoriasVisiveis().slice(0, 8);

  return (
    <section className="sr-only" aria-label="Guia de Bolso — Imbituba">
      <h1>Guia de Bolso — o que fazer em Imbituba, SC</h1>
      <p>
        Descubra praias, trilhas, restaurantes, atrativos e serviços em Imbituba com busca
        inteligente e curadoria local.
        {lugaresCount > 0 ? ` ${lugaresCount} lugares ativos no guia.` : ""}
      </p>
      <nav aria-label="Categorias">
        <ul>
          {categoriasComLugares.map((cat) => (
            <li key={cat.nome}>
              <Link href={getCategoriaHref(cat.nome)}>{cat.nome} em Imbituba</Link>
            </li>
          ))}
        </ul>
        <Link href="/categorias">Ver todas as categorias</Link>
        <Link href="/atrativos">Atrativos e trilhas</Link>
        <Link href="/imbituba">Sobre Imbituba</Link>
      </nav>
    </section>
  );
}
