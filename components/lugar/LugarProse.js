import { splitProseParagraphs } from "@/lib/proseParagraphs";

/**
 * Texto editorial com parágrafos reais e quebras de linha do cadastro.
 * @param {object} props
 * @param {string} props.texto
 * @param {boolean} [props.expandido]
 * @param {string} [props.clampClass] — ex. line-clamp-6; só aplica se !expandido
 * @param {string} [props.className]
 * @returns {import("react").ReactElement|null}
 */
export default function LugarProse({
  texto,
  expandido = true,
  clampClass = "",
  className = "",
}) {
  const paragrafos = splitProseParagraphs(texto);
  if (paragrafos.length === 0) return null;

  return (
    <div
      className={`${expandido ? "" : clampClass} ${className}`.trim()}
    >
      {paragrafos.map((paragrafo, index) => (
        <p
          key={`${index}-${paragrafo.slice(0, 24)}`}
          className={`whitespace-pre-wrap ${index > 0 ? "mt-3" : ""}`}
        >
          {paragrafo}
        </p>
      ))}
    </div>
  );
}
