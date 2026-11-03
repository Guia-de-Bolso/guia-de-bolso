/**
 * Texto de exibição do roteiro, sem markdown e sem título duplicado do dia.
 * @module lib/roteiroDisplay
 */

/**
 * @param {unknown} text
 * @returns {string}
 */
export function textoRoteiroLimpo(text) {
  return String(text ?? "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Remove o prefixo "Dia 1 —" para a identidade do dia ficar no rótulo.
 * @param {unknown} titulo
 * @returns {string}
 */
export function tituloDiaRoteiro(titulo) {
  return textoRoteiroLimpo(titulo)
    .replace(/^dia\s*\d+\s*[—–\-:.]*\s*/i, "")
    .trim();
}

/**
 * @param {unknown} duracao
 * @returns {string}
 */
export function duracaoRoteiroLimpa(duracao) {
  return textoRoteiroLimpo(duracao)
    .replace(/^duração sugerida:\s*/i, "")
    .replace(/^duracao sugerida:\s*/i, "")
    .trim();
}
