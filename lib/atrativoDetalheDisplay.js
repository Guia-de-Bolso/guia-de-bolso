/**
 * Nome exibido da rota.
 * @param {object} rota
 * @returns {string}
 */
export function getAtrativoNome(rota) {
  return rota.nome || rota.titulo || "Atrativo sem nome";
}

/**
 * @param {object} rota
 * @returns {string}
 */
export function formatAtrativoDuracao(rota) {
  const minutos = rota.duracao_minutos;
  if (minutos === null || minutos === undefined) return "—";

  const totalMinutos = Number(minutos);
  if (!Number.isFinite(totalMinutos)) return "—";

  const horas = Math.floor(totalMinutos / 60);
  const mins = totalMinutos % 60;

  if (horas > 0) {
    return mins > 0 ? `${horas}h ${mins} min` : `${horas}h`;
  }

  return `${mins} min`;
}

/**
 * Remove pontuação solta no fim para truncamento com reticências limpas.
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function sanitizeCardDescription(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[,;:.\-–—…]+\s*$/u, "")
    .trim();
}

/**
 * @param {object} rota
 * @returns {string}
 */
export function formatAtrativoDistancia(rota) {
  const value = rota.distancia_km ?? rota.distancia;
  if (!value) return "Livre";
  if (typeof value === "number") return `${value.toFixed(1).replace(".", ",")} km`;
  return String(value).includes("km") ? value : `${value} km`;
}

/**
 * @param {string} [value]
 * @returns {string}
 */
export function dificuldadeToneClass(value) {
  const dificuldade = String(value || "").toLowerCase();
  if (dificuldade.includes("dif")) return "text-red-600";
  if (dificuldade.includes("mod") || dificuldade.includes("méd") || dificuldade.includes("med")) {
    return "text-amber-700";
  }
  return "text-[#1a4a3a]";
}

/**
 * Legenda contextual do CTA de mapas.
 * @param {object} rota
 * @param {object|null} localizacao
 * @returns {string|null}
 */
export function getAtrativoMapsSubtitulo(rota, localizacao) {
  if (rota.tempo_acesso?.trim()) return rota.tempo_acesso.trim();
  if (rota.tempo_estimado?.trim()) return rota.tempo_estimado.trim();

  const cidade = localizacao?.cidade || localizacao?.municipio;
  if (cidade) return `Como chegar · ${cidade}`;

  return "Como chegar de carro";
}
