/** Status de moderação de avaliações. */
export const AVALIACAO_STATUS = {
  PENDENTE: "pendente",
  APROVADO: "aprovado",
  REJEITADO: "rejeitado",
  AGUARDANDO_EDICAO: "aguardando_edicao",
};

/** Status legados ainda aceitos na leitura. */
export const AVALIACAO_STATUS_APROVADOS = ["aprovado", "aprovada"];

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function parseAspectos(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return value.trim() ? [value.trim()] : [];
    }
  }
  return [];
}

/**
 * @param {string} [value]
 * @returns {{ tipo: string|null, motivo: string }}
 */
export function parseSugestaoIa(value) {
  const texto = String(value || "").trim();
  if (!texto) return { tipo: null, motivo: "" };

  const match = texto.match(/^(aprovar|rejeitar|revisar)\s*:\s*(.*)$/i);
  if (match) {
    return { tipo: match[1].toLowerCase(), motivo: match[2].trim() };
  }

  return { tipo: null, motivo: texto };
}

/**
 * @param {string|null|undefined} sentimento
 * @returns {string}
 */
export function getSentimentoEmoji(sentimento) {
  const value = String(sentimento || "").toLowerCase();
  if (value === "positivo") return "😊";
  if (value === "negativo") return "😞";
  return "😐";
}

/**
 * Emoji de humor alinhado à nota em estrelas (1 = pior, 5 = melhor).
 * @param {number|string|null|undefined} nota
 * @returns {string}
 */
export function getNotaEmoji(nota) {
  const n = Math.round(Number(nota) || 0);
  if (n >= 5) return "🤩";
  if (n === 4) return "😊";
  if (n === 3) return "😐";
  if (n === 2) return "😕";
  if (n === 1) return "😞";
  return "😐";
}

/**
 * @param {string|number|Date} value
 * @returns {string}
 */
export function formatAvaliacaoDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "hoje";
  if (diffDays === 1) return "há 1 dia";
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "há 1 semana" : `há ${weeks} semanas`;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
  }).format(date);
}

/**
 * @param {Array<{ nota?: number }>} avaliacoes
 * @returns {Record<number, number>}
 */
export function getDistribuicaoEstrelas(avaliacoes) {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const item of avaliacoes) {
    const nota = Math.round(Number(item.nota) || 0);
    if (nota >= 1 && nota <= 5) dist[nota] += 1;
  }
  return dist;
}

/**
 * @param {Array<{ nota?: number }>} avaliacoes
 * @returns {{ media: number, total: number }}
 */
export function getResumoNotas(avaliacoes) {
  const total = avaliacoes.length;
  if (total === 0) return { media: 0, total: 0 };

  const soma = avaliacoes.reduce((acc, item) => acc + Number(item.nota) || 0, 0);
  return { media: soma / total, total };
}

/**
 * Nome de exibição do autor. Prefere snapshot em `avaliacoes.autor_nome`
 * (público via RLS das avaliações); join em `perfis` só funciona para o próprio
 * usuário ou role `dev`.
 * @param {object} avaliacao
 * @returns {string}
 */
export function getNomeAutorAvaliacao(avaliacao) {
  const snapshot = String(avaliacao?.autor_nome || "").trim();
  if (snapshot) return snapshot;

  return (
    avaliacao?.perfis?.nome ||
    avaliacao?.profiles?.nome ||
    avaliacao?.profiles?.full_name ||
    "Usuário"
  );
}

/**
 * Foto do autor — snapshot público, com fallback do embed de `perfis`.
 * @param {object} avaliacao
 * @returns {string|null}
 */
export function getFotoAutorAvaliacao(avaliacao) {
  const snapshot = String(avaliacao?.autor_foto_url || "").trim();
  if (snapshot) return snapshot;

  const join =
    avaliacao?.perfis?.foto_url ||
    avaliacao?.profiles?.foto_url ||
    avaliacao?.profiles?.avatar_url ||
    null;

  return join ? String(join).trim() || null : null;
}

/**
 * @param {string} nome
 * @returns {string}
 */
export function getIniciaisAutor(nome) {
  return String(nome || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
