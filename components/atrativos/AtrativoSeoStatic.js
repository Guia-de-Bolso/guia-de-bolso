import { truncateMetaDescription } from "@/lib/seo";

/**
 * Cabeçalho indexável no HTML inicial da rota (h1 único na página).
 * @param {object} props
 * @param {string} props.nome
 * @param {string} [props.descricao]
 * @param {string} [props.categoria]
 * @returns {import('react').JSX.Element}
 */
export default function AtrativoSeoStatic({ nome, descricao, categoria }) {
  const texto = truncateMetaDescription(
    descricao || `Atrativo curado em Imbituba: ${nome}`
  );

  return (
    <header className="sr-only">
      <h1>{nome}</h1>
      {categoria ? <p>{categoria}</p> : null}
      <p>{texto}</p>
    </header>
  );
}
