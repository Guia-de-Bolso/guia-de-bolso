const MAPA_INTERESSE_CATEGORIA = {
  praias: ["natureza", "praia"],
  trilhas: ["natureza", "trilha", "aventura"],
  gastronomia: ["gastronomia"],
  "vida noturna": ["noite"],
  cultura: ["cultura"],
  compras: ["compras"],
  aventura: ["aventura", "natureza"],
  "bem-estar": ["bem-estar", "bem estar"],
};

/** Pontuação mínima de relevância (ex.: um match de interesse) para parceiro entrar no pool. */
export const ROTEIRO_MIN_RELEVANCE_SCORE = 3;

/**
 * Normaliza texto para comparação (minúsculas, sem acentos).
 * @param {unknown} texto
 * @returns {string}
 */
function normalizar(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Pontua relevância por interesses (sem bônus de parceiro).
 * @param {Object} lugar - Lugar com categoria, tags e descrição.
 * @param {string[]} interesses
 * @param {string[]} [tiposGastronomia]
 * @returns {number}
 */
export function pontuarRelevanciaRoteiro(lugar, interesses, tiposGastronomia = []) {
  let score = 0;
  const cat = normalizar(lugar.categoria);
  const sub = normalizar(lugar.subcategoria);
  const nome = normalizar(lugar.nome);
  const tags = (lugar.tags ?? []).map(normalizar);
  const desc = normalizar(lugar.descricao);

  for (const interesse of interesses) {
    const chave = normalizar(interesse);
    const palavrasMapa = MAPA_INTERESSE_CATEGORIA[chave] ?? [chave];

    for (const palavra of palavrasMapa) {
      if (
        cat.includes(palavra) ||
        sub.includes(palavra) ||
        nome.includes(palavra) ||
        tags.some((tag) => tag.includes(palavra)) ||
        desc.includes(palavra)
      ) {
        score += 3;
      }
    }
  }

  for (const tipo of tiposGastronomia) {
    const palavra = normalizar(tipo);
    if (!palavra) continue;

    if (
      tags.some((tag) => tag.includes(palavra) || palavra.includes(tag)) ||
      nome.includes(palavra) ||
      sub.includes(palavra) ||
      desc.includes(palavra)
    ) {
      score += 4;
    }
  }

  return score;
}

/**
 * Ordena lugares: relevância primeiro; parceiro só como desempate.
 * @param {{ relevanceScore: number, ehParceiro?: boolean, nome?: string }} a
 * @param {{ relevanceScore: number, ehParceiro?: boolean, nome?: string }} b
 * @returns {number}
 */
export function compareLugaresForRoteiro(a, b) {
  if (b.relevanceScore !== a.relevanceScore) {
    return b.relevanceScore - a.relevanceScore;
  }

  const parceiroA = Boolean(a.ehParceiro);
  const parceiroB = Boolean(b.ehParceiro);
  if (parceiroB !== parceiroA) {
    return parceiroB ? 1 : -1;
  }

  return String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR");
}

/**
 * Reduz lugares enviados à Claude (menos tokens = resposta mais rápida).
 * Parceiros só entram se relevanceScore >= ROTEIRO_MIN_RELEVANCE_SCORE; bônus é desempate.
 * @param {Array<Object>} [lugaresRaw] - Lugares completos do Supabase.
 * @param {string|string[]} interesses - Interesses do roteiro.
 * @param {number} [limite=24] - Máximo de lugares no contexto.
 * @param {string[]} [tiposGastronomia] - Especialidades culinárias (tags).
 * @returns {Array<{ id: string, nome: string, categoria: string, subcategoria: string, descricao: string, tags: string[] }>}
 */
export function selecionarLugaresParaRoteiro(
  lugaresRaw,
  interesses,
  limite = 24,
  tiposGastronomia = []
) {
  const interessesLista = Array.isArray(interesses) ? interesses : [interesses];
  const tiposLista = Array.isArray(tiposGastronomia) ? tiposGastronomia : [];

  const lugares = (lugaresRaw ?? []).map((lugar) => ({
    id: lugar.id,
    nome: lugar.nome,
    categoria: lugar.categoria,
    subcategoria: lugar.subcategoria,
    descricao:
      typeof lugar.descricao === "string"
        ? lugar.descricao.slice(0, 100)
        : "",
    tags: (lugar.lugares_tags ?? [])
      .map((item) => item.tags?.nome)
      .filter(Boolean)
      .slice(0, 4),
    ehParceiro: Boolean(lugar.ehParceiro),
  }));

  const comScore = lugares.map((lugar) => ({
    ...lugar,
    relevanceScore: pontuarRelevanciaRoteiro(lugar, interessesLista, tiposLista),
  }));

  comScore.sort(compareLugaresForRoteiro);

  const elegiveis = comScore.filter(
    (l) => l.relevanceScore >= ROTEIRO_MIN_RELEVANCE_SCORE
  );

  let chosen;
  if (elegiveis.length >= 8) {
    chosen = elegiveis.slice(0, limite);
  } else if (elegiveis.length > 0) {
    chosen = elegiveis.slice(0, limite);
  } else {
    chosen = comScore.filter((l) => !l.ehParceiro).slice(0, limite);
    if (!chosen.length) {
      chosen = comScore.slice(0, limite);
    }
  }

  return chosen.map(({ relevanceScore: _r, ehParceiro: _p, ...rest }) => rest);
}
