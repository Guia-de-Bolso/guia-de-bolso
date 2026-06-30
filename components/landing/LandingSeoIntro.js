import Link from "next/link";
import { getCategoriasVisiveis, getCategoriaHref } from "@/lib/categorias";

/**
 * Bloco de texto indexável na landing (acessível, fora do hero animado).
 * @returns {import('react').ReactElement}
 */
export default function LandingSeoIntro() {
  return (
    <section
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:max-w-lg focus:rounded-xl focus:bg-white focus:p-4 focus:shadow-lg"
      aria-label="Sobre o Guia de Bolso em Imbituba"
    >
      <h2>Guia de Bolso Imbituba — turismo local</h2>
      <p>
        O <strong>Guia de Bolso</strong> é o guia turístico de{" "}
        <strong>Imbituba, Santa Catarina</strong>: praias, restaurantes, trilhas e
        experiências curadas. Não tem relação com a empresa financeira Guiabolso.
      </p>
      <p>
        <Link href="/guia">Guias de turismo</Link>
        {" · "}
        <Link href="/guia/o-que-fazer-em-imbituba">O que fazer em Imbituba</Link>
        {" · "}
        <Link href="/sobre">Sobre o guia</Link>
        {" · "}
        <Link href="/imbituba">Sobre Imbituba</Link>
        {" · "}
        <Link href="/categorias">Explorar categorias</Link>
        {" · "}
        <Link href="/para-negocios">Para anunciantes</Link>
      </p>
      <ul>
        {getCategoriasVisiveis().slice(0, 5).map((cat) => (
          <li key={cat.nome}>
            <Link href={getCategoriaHref(cat.nome)}>
              {cat.nome} em Imbituba
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
