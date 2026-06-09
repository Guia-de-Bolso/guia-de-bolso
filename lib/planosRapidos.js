import { FILTRO_STATUS_BUSCA, filtrarLugaresPorStatus } from "./busca.js";
import { getEffectiveCategoria } from "./lugarTaxonomia.js";
import { calcularDistanciaKm, getCoordenadasLugar } from "./localizacao.js";

/** @typedef {'relevance' | 'distancia' | 'variety'} PlanoSortMode */

/**
 * @typedef {Object} PlanoRapidoCriterios
 * @property {string[]} [subcategorias]
 * @property {string[]} [categorias]
 * @property {'subcategoria' | 'categoria_or_subcategoria'} [matchMode]
 * @property {string[]} [excludeSubcategorias]
 * @property {string[]} [excludeCategorias]
 * @property {string[]} [tagBoost]
 */

/**
 * @typedef {Object} PlanoRapido
 * @property {string} id
 * @property {string} titulo
 * @property {string} emoji
 * @property {string} descricao
 * @property {string} gradient
 * @property {string} filtro
 * @property {PlanoRapidoCriterios} criterios
 * @property {PlanoSortMode} sort
 * @property {Record<string, number>} [varietyMaxPerSubcategoria]
 * @property {number} limit
 */

/** Planos rápidos da home — curadoria determinística por taxonomia. */
export const PLANOS_RAPIDOS = [
  {
    id: "manha",
    titulo: "Manhã perfeita",
    emoji: "🌅",
    descricao: "Café, praia e energia para começar o dia",
    gradient: "from-amber-100 to-orange-50",
    filtro: FILTRO_STATUS_BUSCA.TODOS,
    criterios: {
      matchMode: "subcategoria",
      subcategorias: ["Cafés", "Padarias", "Praias"],
      tagBoost: ["cafe da manha", "nascer do sol", "praia paradisiaca"],
    },
    sort: "variety",
    varietyMaxPerSubcategoria: { Praias: 4 },
    limit: 8,
  },
  {
    id: "tarde-romantica",
    titulo: "Tarde romântica",
    emoji: "💑",
    descricao: "Almoço especial e pôr do sol",
    gradient: "from-rose-100 to-pink-50",
    filtro: FILTRO_STATUS_BUSCA.TODOS,
    criterios: {
      matchMode: "subcategoria",
      subcategorias: ["Restaurantes", "Mirantes", "Praias"],
      tagBoost: [
        "romant",
        "por do sol",
        "pôr do sol",
        "vista",
        "intimist",
        "frutos do mar",
        "sunset",
      ],
    },
    sort: "relevance",
    limit: 8,
  },
  {
    id: "dia-chuvoso",
    titulo: "Dia chuvoso",
    emoji: "🌧️",
    descricao: "Programas aconchegantes para qualquer tempo",
    gradient: "from-slate-200 to-blue-50",
    filtro: FILTRO_STATUS_BUSCA.TODOS,
    criterios: {
      matchMode: "subcategoria",
      subcategorias: [
        "Museus",
        "Monumentos",
        "Igrejas e templos",
        "Cafés",
        "Restaurantes",
        "Spa",
        "Yoga",
        "Lojas",
        "Empório Gourmet",
        "Padarias",
        "Sorveterias",
        "Feiras",
        "Artesanato",
      ],
      excludeSubcategorias: [
        "Praias",
        "Trilhas",
        "Cachoeiras",
        "Mirantes",
        "Dunas",
        "Ilhas",
        "Esportes radicais",
        "Passeios de barco",
        "Escalada",
        "Ciclismo",
      ],
      tagBoost: ["ambiente intimista", "arte local", "patrimonio", "massagem"],
    },
    sort: "relevance",
    limit: 8,
  },
  {
    id: "noite",
    titulo: "Noite animada",
    emoji: "🌙",
    descricao: "Bares, música e vida noturna",
    gradient: "from-indigo-100 to-violet-50",
    filtro: FILTRO_STATUS_BUSCA.TODOS,
    criterios: {
      matchMode: "categoria_or_subcategoria",
      categorias: ["Noite"],
      subcategorias: ["Bares", "Baladas", "Pubs"],
      tagBoost: ["happy hour", "drinks", "musica", "eletronica"],
    },
    sort: "relevance",
    limit: 8,
  },
  {
    id: "bate-volta",
    titulo: "Bate-volta rápido",
    emoji: "⚡",
    descricao: "Experiências curtas perto de você",
    gradient: "from-emerald-100 to-teal-50",
    filtro: FILTRO_STATUS_BUSCA.TODOS,
    criterios: {
      matchMode: "subcategoria",
      subcategorias: ["Sorveterias", "Padarias", "Mirantes", "Cafés", "Lojas", "Feiras"],
    },
    sort: "distancia",
    limit: 6,
  },
];

/**
 * @param {string} planoId
 * @returns {PlanoRapido|undefined}
 */
export function getPlanoRapidoById(planoId) {
  return PLANOS_RAPIDOS.find((plano) => plano.id === planoId);
}

/**
 * Normaliza texto para comparação (minúsculas, sem acentos).
 * @param {unknown} texto
 * @returns {string}
 */
export function normalizarPlanoTexto(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * @param {object} lugar
 * @returns {string[]}
 */
export function getLugarTagNomes(lugar) {
  if (Array.isArray(lugar?.tags)) {
    return lugar.tags
      .map((tag) => (typeof tag === "string" ? tag : tag?.nome))
      .filter(Boolean);
  }

  return (lugar?.lugares_tags ?? [])
    .map((row) => row?.tags?.nome)
    .filter(Boolean);
}

/**
 * @param {object} lugar
 * @param {PlanoRapidoCriterios} criterios
 * @returns {boolean}
 */
export function lugarMatchesPlanoCriterios(lugar, criterios) {
  const sub = String(lugar?.subcategoria ?? "").trim();
  const categoria = getEffectiveCategoria(lugar);

  if (criterios.excludeSubcategorias?.includes(sub)) return false;
  if (criterios.excludeCategorias?.includes(categoria)) return false;

  const subcategorias = criterios.subcategorias ?? [];
  const categorias = criterios.categorias ?? [];
  const matchSub = subcategorias.length > 0 && subcategorias.includes(sub);
  const matchCat = categorias.length > 0 && categorias.includes(categoria);

  if (criterios.matchMode === "categoria_or_subcategoria") {
    return matchSub || matchCat;
  }

  if (subcategorias.length > 0) {
    return matchSub;
  }

  if (categorias.length > 0) {
    return matchCat;
  }

  return false;
}

/**
 * @param {object} lugar
 * @param {string[]} [patterns]
 * @returns {number}
 */
export function scorePlanoTagBoost(lugar, patterns = []) {
  if (!patterns.length) return 0;

  const tags = getLugarTagNomes(lugar).map(normalizarPlanoTexto);
  const haystack = [
    lugar?.nome,
    lugar?.subcategoria,
    lugar?.descricao,
    ...tags,
  ]
    .map(normalizarPlanoTexto)
    .join(" ");

  let score = 0;
  for (const pattern of patterns) {
    const token = normalizarPlanoTexto(pattern);
    if (token && haystack.includes(token)) score += 4;
  }
  return score;
}

/**
 * @param {object} lugar
 * @param {PlanoRapidoCriterios} criterios
 * @returns {number}
 */
export function scoreLugarForPlano(lugar, criterios) {
  if (!lugarMatchesPlanoCriterios(lugar, criterios)) return -1;

  let score = 10;

  const sub = String(lugar?.subcategoria ?? "").trim();
  if (criterios.subcategorias?.includes(sub)) score += 6;
  if (criterios.categorias?.includes(getEffectiveCategoria(lugar))) score += 4;

  score += scorePlanoTagBoost(lugar, criterios.tagBoost);

  return score;
}

/**
 * Intercala resultados por subcategoria para variedade no carrossel de resultados.
 * @param {Array<{ lugar: object, score: number }>} scored
 * @param {number} limit
 * @param {Record<string, number>} [maxPerSubcategoria]
 * @returns {object[]}
 */
export function pickPlanoResultsVariety(scored, limit, maxPerSubcategoria = {}) {
  const bySub = new Map();
  const pickedCounts = new Map();

  for (const item of scored) {
    const key = item.lugar?.subcategoria || "outros";
    if (!bySub.has(key)) bySub.set(key, []);
    bySub.get(key).push(item);
  }

  const queues = [...bySub.values()];
  const picked = [];

  function canPickFromQueue(queue) {
    if (!queue.length) return false;
    const key = queue[0].lugar?.subcategoria || "outros";
    const max = maxPerSubcategoria[key];
    if (Number.isFinite(max) && (pickedCounts.get(key) ?? 0) >= max) {
      return false;
    }
    return true;
  }

  while (picked.length < limit && queues.some((queue) => queue.length > 0)) {
    let added = false;
    for (const queue of queues) {
      if (!canPickFromQueue(queue)) continue;
      if (queue.length > 0 && picked.length < limit) {
        const item = queue.shift();
        const key = item.lugar?.subcategoria || "outros";
        picked.push(item);
        pickedCounts.set(key, (pickedCounts.get(key) ?? 0) + 1);
        added = true;
      }
    }
    if (!added) break;
  }

  return picked.map((item) => item.lugar);
}

/**
 * Filtra e ordena lugares para um plano rápido.
 * @param {object[]} lugares
 * @param {string} planoId
 * @param {{ filtroStatus?: string, userPosition?: { latitude: number, longitude: number }|null }} [options]
 * @returns {{ plano: PlanoRapido, lugares: object[] }}
 */
export function filterLugaresForPlano(lugares, planoId, options = {}) {
  const plano = getPlanoRapidoById(planoId);
  if (!plano) {
    throw new Error(`Plano rápido desconhecido: ${planoId}`);
  }

  const filtroStatus = options.filtroStatus ?? plano.filtro;
  const pool = filtrarLugaresPorStatus(lugares ?? [], filtroStatus);

  const scored = pool
    .map((lugar) => ({
      lugar,
      score: scoreLugarForPlano(lugar, plano.criterios),
    }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.lugar.nome ?? "").localeCompare(String(b.lugar.nome ?? ""), "pt-BR");
    });

  let resultados;

  if (plano.sort === "distancia") {
    const userPosition = options.userPosition ?? null;
    resultados = [...scored]
      .sort((a, b) => {
        const da =
          calcularDistanciaKm(userPosition, getCoordenadasLugar(a.lugar)) ?? 999;
        const db =
          calcularDistanciaKm(userPosition, getCoordenadasLugar(b.lugar)) ?? 999;
        if (da !== db) return da - db;
        return b.score - a.score;
      })
      .slice(0, plano.limit)
      .map((item) => item.lugar);
  } else if (plano.sort === "variety") {
    resultados = pickPlanoResultsVariety(
      scored,
      plano.limit,
      plano.varietyMaxPerSubcategoria
    );
  } else {
    resultados = scored.slice(0, plano.limit).map((item) => item.lugar);
  }

  return { plano, lugares: resultados };
}
