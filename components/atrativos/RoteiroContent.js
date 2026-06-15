"use client";

import RoteiroItineraryView from "@/components/atrativos/RoteiroItineraryView";

/**
 * Renderiza roteiro em timeline estruturada (substitui HTML markdown legado).
 * @param {object} props
 * @param {string} props.conteudo - Texto markdown do roteiro.
 * @param {string} [props.className]
 * @param {string} [props.titulo]
 * @param {string} [props.diasLabel]
 * @param {string} [props.perfil]
 * @param {string[]} [props.interesses]
 * @param {Array<{ id: string, nome: string }>} [props.lugaresCatalog]
 * @param {boolean} [props.compactHeader]
 * @returns {import("react").JSX.Element|null}
 */
export default function RoteiroContent({
  conteudo,
  className = "",
  titulo,
  diasLabel,
  perfil,
  interesses,
  lugaresCatalog,
  compactHeader,
}) {
  if (!conteudo) return null;

  return (
    <RoteiroItineraryView
      conteudo={conteudo}
      titulo={titulo}
      diasLabel={diasLabel}
      perfil={perfil}
      interesses={interesses}
      lugaresCatalog={lugaresCatalog}
      compactHeader={compactHeader}
      className={className}
    />
  );
}
