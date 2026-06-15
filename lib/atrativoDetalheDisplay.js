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

  return horas > 0
    ? `${horas}h${mins > 0 ? ` ${mins}m` : ""}`.trim()
    : `${mins}m`;
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

const INFO_CARD_PRESETS = [
  { titulo: "Ambiente", icone: "🌲", accent: "bg-[#eef8f4] text-[#1a4a3a]" },
  { titulo: "Nível da trilha", icone: "⛰️", accent: "bg-[#fff8e6] text-amber-900" },
  { titulo: "Banho", icone: "💧", accent: "bg-[#eef6fc] text-sky-900" },
];

/**
 * Converte dicas da rota em mini cards da seção "Sobre".
 * @param {Array<{ texto?: string }>} dicas
 * @returns {Array<{ titulo: string, icone: string, accent: string, texto: string }>}
 */
export function buildAtrativoInfoCards(dicas = []) {
  return dicas
    .filter((d) => d.texto?.trim())
    .slice(0, 3)
    .map((dica, index) => {
      const preset = INFO_CARD_PRESETS[index] ?? {
        titulo: `Dica ${index + 1}`,
        icone: "✦",
        accent: "bg-[#f5f7f6] text-[#1a4a3a]",
      };
      return {
        ...preset,
        texto: dica.texto.trim(),
      };
    });
}
