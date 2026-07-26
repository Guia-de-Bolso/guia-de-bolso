/**
 * Helpers de copy e conteúdo persuasivo para a tela de detalhe do lugar.
 */

import { getEffectiveCategoria } from "./lugarTaxonomia.js";

const FRASES_POR_CATEGORIA = {
  Natureza: [
    "Conexão com a natureza e paisagens incríveis 🌿",
    "Perfeito para recarregar as energias ao ar livre 🌊",
    "Ideal para quem busca tranquilidade e vista bonita 🌅",
  ],
  Gastronomia: [
    "Ótimo para saborear a gastronomia local 🍽️",
    "Perfeito para um almoço especial com quem você gosta ✨",
    "Ambiente convidativo para uma refeição memorável 🥂",
  ],
  Noite: [
    "Perfeito para curtir a noite com amigos 🍻",
    "Energia boa e clima ideal para sair hoje 🌙",
    "Ótima pedida para animar a noite na região 🎵",
  ],
  Cultura: [
    "Experiência cultural autêntica da região 🎭",
    "Ideal para descobrir algo diferente hoje 🖼️",
  ],
  Aventura: [
    "Adrenalina e experiências que valem a pena ⚡",
    "Perfeito para quem quer aventura hoje 🏄",
  ],
  "Bem-estar": [
    "Momento de relaxar e cuidar de você 🧘",
    "Ambiente acolhedor para desacelerar ✨",
  ],
  Compras: [
    "Ótima parada para encontrar algo especial 🛍️",
  ],
  Serviços: [
    "Atendimento próximo e confiável na região ✨",
    "Boa opção de serviço local em Imbituba 🤝",
  ],
  Hospedagem: [
    "Conforto e boa localização para sua estadia 🏨",
  ],
};

/** Frases por subcategoria canônica (prevalecem sobre tags genéricas). */
const FRASES_POR_SUBCATEGORIA = {
  Salões: [
    "Momento perfeito para cuidar do visual e se sentir bem ✨",
    "Ambiente profissional para hair, unhas e autocuidado 💇",
  ],
  Spa: [
    "Momento de relaxar e cuidar de você 🧖",
    "Tratamentos para renovar corpo e mente ✨",
  ],
  Yoga: [
    "Espaço para desacelerar e recarregar as energias 🧘",
    "Boa pedida para movimento consciente e bem-estar ✨",
  ],
  Terapias: [
    "Cuidado personalizado para o seu bem-estar 💆",
    "Ambiente acolhedor para relaxar de verdade ✨",
  ],
  Saúde: [
    "Cuidado com a saúde perto de você 🏥",
    "Atendimento de confiança quando você precisa 💙",
  ],
  Farmácias: [
    "Farmácia prática na região — resolve rápido 💊",
  ],
  Mecânicos: [
    "Oficina confiável para cuidar do seu veículo 🔧",
  ],
  Mercados: [
    "Compras do dia a dia perto de você 🛒",
  ],
  Restaurantes: [
    "Ótimo para saborear a gastronomia local 🍽️",
    "Ambiente convidativo para uma refeição memorável 🥂",
  ],
  Cafés: [
    "Pausa gostosa com café e clima aconchegante ☕",
  ],
  Padarias: [
    "Pães frescos e café da manhã na região 🥐",
  ],
  Praias: [
    "Experiência pé na areia com paisagem única 🏖️",
    "Dia perfeito para curtir o mar e o sol 🌊",
  ],
  Trilhas: [
    "Trilha com contato direto com a natureza 🥾",
    "Boa pedida para caminhar e respirar ar puro 🌿",
  ],
  Cachoeiras: [
    "Refresque-se em meio à natureza 💧",
  ],
  Mirantes: [
    "Vista incrível que vale o deslocamento 🌅",
  ],
};

/**
 * Palavras no nome/subcategoria/tags — prioridade alta para serviços específicos.
 * Evita frases genéricas ou de “ambiente” em negócios como veterinária.
 */
const CONTEXTO_KEYWORDS = [
  {
    match: /veterin|cl[ií]nica pet|hospital veterin/i,
    frase: "Cuidado veterinário de confiança para o seu pet 🐾",
  },
  {
    match: /pet\s*sitter|petsitter|hospedagem pet|creche pet/i,
    frase: "Cuidado e companhia para o seu pet com tranquilidade 🐶",
  },
  {
    match: /banho\s*e\s*tosa|pet\s*shop|petshop|tosa/i,
    frase: "Banho, tosa e carinho para o seu pet ✂️",
  },
  {
    match: /\b(odont|dentista|cl[ií]nica odontol)/i,
    frase: "Cuidado com o sorriso perto de você 😁",
  },
  {
    match: /\b(fisioterap|fisio)\b/i,
    frase: "Cuidado especializado para o seu corpo 🧘",
  },
  {
    match: /lavander|lavagem/i,
    frase: "Lavanderia prática para o dia a dia 👕",
  },
  {
    match: /chaveir/i,
    frase: "Solução rápida quando a chave falha 🔑",
  },
  {
    match: /eletrici|el[eé]tric/i,
    frase: "Serviço elétrico de confiança na região ⚡",
  },
  {
    match: /encanad|hidr[aá]ulic/i,
    frase: "Ajuda hidráulica quando o problema aparece 🔧",
  },
  {
    match: /advogad|escrit[oó]rio jur[ií]dic/i,
    frase: "Orientação jurídica próxima e clara ⚖️",
  },
  {
    match: /contab[ií]l|contador/i,
    frase: "Suporte contábil para organizar o seu negócio 📊",
  },
  {
    match: /imobili[aá]r/i,
    frase: "Ajuda para encontrar o imóvel certo 🏠",
  },
  {
    match: /escola|curso|aula|idioma/i,
    frase: "Aprendizado e desenvolvimento perto de você 📚",
  },
  {
    match: /academia|crossfit|muscula/i,
    frase: "Treino e energia para a sua rotina 💪",
  },
];

const MELHOR_PARA_POR_CATEGORIA = {
  Natureza: ["famílias", "casais", "amigos"],
  Gastronomia: ["casais", "famílias", "amigos"],
  Noite: ["amigos", "casais"],
  Cultura: ["famílias", "casais", "amigos"],
  Aventura: ["amigos", "famílias"],
  "Bem-estar": ["casais", "famílias"],
  Compras: ["famílias", "amigos"],
  Serviços: ["todos"],
  Hospedagem: ["casais", "famílias"],
};

const TAG_KEYWORDS = [
  { match: /românt|date|casal/i, frase: "Ótimo para um date romântico 🌅" },
  { match: /famíl|crianç|kids/i, frase: "Ideal para famílias com crianças 👨‍👩‍👧‍👦" },
  {
    match: /pet\s*friendly|aceita\s*pet|pet\s*welcome/i,
    frase: "Ambiente pet friendly 🐶",
    categories: ["Gastronomia", "Hospedagem", "Natureza", "Bem-estar", "Cultura"],
  },
  { match: /música|live|show|dj/i, frase: "Música ao vivo e clima animado 🎵" },
  {
    match: /vista|pôr do sol|por do sol|sunset/i,
    frase: "Vista incrível do pôr do sol 🌅",
    outdoorOnly: true,
  },
  {
    match: /\bpraia(s)?\b/i,
    frase: "Experiência pé na areia 🏖️",
    outdoorOnly: true,
  },
  {
    match: /\b(oceano|mar)\b/i,
    frase: "Experiência à beira-mar 🌊",
    outdoorOnly: true,
  },
];

const CATEGORIAS_NAO_ESTABELECIMENTO = new Set(["Natureza"]);

const SUBCATEGORIAS_NATURAIS = [
  "praia",
  "praias",
  "trilha",
  "trilhas",
  "lagoa",
  "lagoas",
  "cachoeira",
  "cachoeiras",
  "mirante",
  "mirantes",
  "parque",
  "parques",
  "duna",
  "dunas",
  "costão",
  "costao",
  "ilha",
  "ilhas",
  "morro",
  "morro",
  "piscina natural",
  "piscinas naturais",
  "nascente",
  "riacho",
  "cânion",
  "canion",
];

/**
 * Normaliza texto para comparação (minúsculas, sem acentos).
 * @param {string} [value]
 * @returns {string}
 */
function normalizarTexto(value) {
  return (value || "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

/**
 * Praias, trilhas, mirantes e similares — chips informativos, sem horário comercial.
 * @param {Object} [lugar]
 * @returns {boolean}
 */
export function isLugarPublico(lugar) {
  if (!lugar) return false;

  const categoria = lugar.categoria || "";
  if (CATEGORIAS_NAO_ESTABELECIMENTO.has(categoria)) return true;

  const sub = normalizarTexto(lugar.subcategoria);
  if (SUBCATEGORIAS_NATURAIS.some((termo) => sub.includes(termo))) return true;

  if (categoria === "Aventura" && /trilha|praia|mirante|costao|costão/i.test(sub)) {
    return true;
  }

  return false;
}

/**
 * Indica se o lugar é estabelecimento comercial (oposto de {@link isLugarPublico}).
 * @param {Object} lugar
 * @returns {boolean}
 */
export function isLugarEstabelecimento(lugar) {
  return !isLugarPublico(lugar);
}

/**
 * Gera hash numérico determinístico a partir de uma string (para escolha de frase).
 * @param {unknown} value
 * @returns {number}
 */
function hashString(value) {
  let hash = 0;
  const str = String(value || "");
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Escolhe item estável de um pool com base no id do lugar.
 * @param {string[]} pool
 * @param {unknown} seed
 * @returns {string}
 */
function pickFraseDoPool(pool, seed) {
  if (!pool?.length) return "";
  return pool[hashString(seed) % pool.length];
}

/**
 * Retorna frase persuasiva alinhada à subcategoria, categoria e contexto do lugar.
 * Ordem: palavras no nome/contexto → subcategoria → tags → categoria.
 * @param {Object} lugar
 * @param {Array<{ nome?: string, icone?: string }>} [tags]
 * @returns {string}
 */
export function getFraseConvencimento(lugar, tags = []) {
  if (!lugar) return "";

  const categoria = getEffectiveCategoria(lugar);
  const subcategoria = String(lugar.subcategoria ?? "").trim();
  const contextoNatural = isLugarPublico({ ...lugar, categoria });
  const seed = lugar.id ?? lugar.nome;
  const contextoTexto = [
    lugar.nome,
    subcategoria,
    lugar.descricao,
    ...tags.map((tag) => `${tag.nome || ""} ${tag.icone || ""}`),
  ]
    .filter(Boolean)
    .join(" ");

  // Nome/contexto específico (ex.: veterinária) antes de pools genéricos de subcategoria.
  for (const { match, frase } of CONTEXTO_KEYWORDS) {
    if (match.test(contextoTexto)) return frase;
  }

  if (subcategoria && FRASES_POR_SUBCATEGORIA[subcategoria]) {
    return pickFraseDoPool(FRASES_POR_SUBCATEGORIA[subcategoria], seed);
  }

  for (const tag of tags) {
    const nome = `${tag.nome || ""} ${tag.icone || ""}`;
    for (const { match, frase, outdoorOnly, categories } of TAG_KEYWORDS) {
      if (outdoorOnly && !contextoNatural) continue;
      if (categories?.length && !categories.includes(categoria)) continue;
      if (match.test(nome)) return frase;
    }
  }

  const pool = FRASES_POR_CATEGORIA[categoria] || [
    "Uma experiência que vale a pena viver hoje ✨",
    "Boa pedida para aproveitar a região agora 📍",
  ];

  return pickFraseDoPool(pool, seed);
}

/**
 * Monta bullets "Por que ir agora" para a tela de detalhe.
 * @param {Object} lugar
 * @param {Array<{ nome: string, icone?: string }>} [tags]
 * @param {import('@/lib/horarios').StatusFuncionamento} [status]
 * @param {number} [mediaAvaliacoes]
 * @param {number} [totalAvaliacoes]
 * @returns {Array<{ text: string, emoji: string }>}
 */
export function getPorQueIrAgora(lugar, tags = [], status, mediaAvaliacoes, totalAvaliacoes) {
  const bullets = [];
  const seen = new Set();

  function add(text, emoji) {
    const key = text.toLowerCase();
    if (seen.has(key) || bullets.length >= 5) return;
    seen.add(key);
    bullets.push({ text, emoji });
  }

  if (status?.aberto && isLugarEstabelecimento(lugar)) {
    add("Aberto agora — bom momento para ir", "🟢");
  }

  if (totalAvaliacoes > 0 && mediaAvaliacoes >= 4) {
    add("Muito bem avaliado pelos visitantes", "⭐");
  } else if (totalAvaliacoes >= 3) {
    add(`${totalAvaliacoes} pessoas já avaliaram este lugar`, "💬");
  }

  for (const tag of tags) {
    add(tag.nome, tag.icone || "✓");
  }

  const categoriaExtras = {
    Noite: ["Música e clima para curtir a noite", "🎵"],
    Natureza: ["Paisagem e ar livre de tirar o fôlego", "🌿"],
    Gastronomia: ["Boa pedida para refeição na região", "🍽️"],
  };

  const extra = categoriaExtras[lugar?.categoria];
  if (extra) add(extra[0], extra[1]);

  if (lugar?.ehParceiro) {
    add("Parceiro oficial do guia", "✨");
  }

  if (bullets.length < 3) {
    add("Fácil de chegar e vale o deslocamento", "📍");
  }

  return bullets.slice(0, 5);
}

/**
 * Resume avaliações em percentual de recomendação e público-alvo.
 * @param {Array<{ nota: number }>} [avaliacoes]
 * @param {string} categoria
 * @returns {{ percentRecomenda: number, melhorPara: string[], total: number }|null}
 */
export function getResumoAvaliacoes(avaliacoes, categoria) {
  if (!avaliacoes?.length) return null;

  const total = avaliacoes.length;
  const recomendam = avaliacoes.filter((a) => Number(a.nota) >= 4).length;
  const percent = Math.round((recomendam / total) * 100);

  const melhorPara = MELHOR_PARA_POR_CATEGORIA[categoria] || ["amigos", "casais"];

  return {
    percentRecomenda: percent,
    melhorPara: melhorPara.slice(0, 3),
    total,
  };
}

/**
 * Formata status de funcionamento em texto curto para o detalhe.
 * @param {import('@/lib/horarios').StatusFuncionamento} [status]
 * @returns {string}
 */
export function getHorarioResumo(status) {
  if (!status) return "Horário não informado";

  if (status.resumo) return status.resumo;

  const detail = status.detail || "";

  if (status.aberto) {
    if (detail.includes("meia-noite")) return "Aberto até a meia-noite";
    const match = detail.match(/Fecha às\s+(.+)/i);
    if (match) return `Aberto até ${match[1]} hoje`;
    if (detail.includes("24 horas")) return "Aberto 24 horas hoje";
    return "Aberto agora";
  }

  if (detail.includes("Abre mais tarde")) return detail;
  if (detail.startsWith("Abre às")) return detail;
  if (detail.startsWith("Abre ")) return detail;
  if (detail.includes("Fechado hoje")) return detail;

  return status.label === "Fechado" ? detail || "Fechado agora" : detail;
}

/**
 * Texto do botão CTA "Ir agora" conforme tipo de lugar e status.
 * @param {import('@/lib/horarios').StatusFuncionamento} [status]
 * @param {boolean} [ehEstabelecimento=true]
 * @returns {string}
 */
export function getCtaIrAgoraText(status, ehEstabelecimento = true) {
  if (!ehEstabelecimento) return "Ir para este lugar";
  if (status?.aberto) return "Como chegar agora";
  return "Abrir rota no mapa";
}

/**
 * Estima tempo de deslocamento a partir do texto de distância.
 * @param {string} [distancia]
 * @returns {string|null}
 */
function estimarTempoDeslocamento(distancia) {
  if (!distancia) return null;

  const kmMatch = String(distancia).match(/([\d,.]+)\s*km/i);
  if (kmMatch) {
    const km = parseFloat(kmMatch[1].replace(",", "."));
    if (km < 1) return "~5 min de carro";
    if (km < 3) return `~${Math.round(km * 4)} min de carro`;
    return `~${Math.round(km * 3)} min de carro`;
  }

  const mMatch = String(distancia).match(/([\d,.]+)\s*m\b/i);
  if (mMatch) {
    const metros = parseFloat(mMatch[1].replace(",", "."));
    if (metros < 500) return "~2 min a pé ou de carro";
    return "~5 min de carro";
  }

  return null;
}

/**
 * Gera rótulo de acesso (fácil, trilha, orla, etc.) para lugares públicos.
 * @param {Object} lugar
 * @param {Array<{ nome?: string, icone?: string }>} [tags]
 * @returns {string}
 */
function getAcessoLabel(lugar, tags = []) {
  const textoTags = tags.map((t) => `${t.nome} ${t.icone || ""}`).join(" ");
  const base = `${lugar?.subcategoria || ""} ${textoTags} ${lugar?.descricao || ""}`.toLowerCase();

  if (/acesso f[aá]cil|f[aá]cil acesso|estacionamento/i.test(base)) {
    return "Acesso fácil";
  }
  if (/moderad|intermedi/i.test(base)) return "Acesso moderado";
  if (/dif[ií]cil|exigente|trilha longa/i.test(base)) return "Acesso mais exigente";

  const sub = (lugar?.subcategoria || "").toLowerCase();
  if (/trilha/.test(sub)) return "Trilha — calçado confortável";
  if (/praia/.test(sub)) return "Acesso pela orla";
  if (/cachoeira|lagoa/.test(sub)) return "Caminhada curta até o ponto";
  if (/mirante/.test(sub)) return "Visita rápida ao mirante";

  return "Acesso livre ao local";
}

/**
 * Sugere duração típica da visita para locais naturais/públicos.
 * @param {Object} lugar
 * @returns {string}
 */
function getDuracaoExperienciaLocal(lugar) {
  const sub = (lugar?.subcategoria || "").toLowerCase();
  if (/praia/.test(sub)) return "Reserve 2–4h na praia";
  if (/trilha/.test(sub)) return "Trilha ~1–2h";
  if (/cachoeira|lagoa/.test(sub)) return "Visita ~1–2h";
  if (/mirante/.test(sub)) return "Parada ~30–45min";
  if (lugar?.categoria === "Natureza") return "Experiência ~1–2h";
  if (lugar?.categoria === "Aventura") return "Atividade ~2–3h";
  return "Visita flexível";
}

/**
 * Sugere melhor horário de visita para locais públicos.
 * @param {Object} lugar
 * @param {Array<{ nome?: string }>} [tags]
 * @returns {string}
 */
function getMelhorHorarioVisita(lugar, tags = []) {
  const texto = tags.map((t) => t.nome).join(" ").toLowerCase();
  const sub = (lugar?.subcategoria || "").toLowerCase();

  if (/p[oô]r do sol|sunset/.test(texto) || /mirante/.test(sub)) {
    return "Melhor no fim da tarde";
  }
  if (/praia/.test(sub)) return "Ideal de manhã ou fim de tarde";
  if (/trilha|cachoeira/.test(sub)) return "Melhor pela manhã";
  if (lugar?.categoria === "Natureza") return "Visite com luz do dia";
  return "Aproveite com calma";
}

/**
 * Monta chips de ações rápidas para praias, trilhas e locais públicos.
 * @param {Object} lugar
 * @param {Array<Object>} [tags]
 * @param {string} [distancia] - Texto de distância formatado.
 * @returns {Array<{ id: string, emoji: string, label: string }>}
 */
/**
 * @param {string} id
 * @param {string} emoji
 * @param {string} valor
 * @param {string} subtitulo
 * @param {string} label
 * @returns {{ id: string, emoji: string, valor: string, subtitulo: string, label: string }}
 */
function infoAcao(id, emoji, valor, subtitulo, label) {
  return { id, emoji, valor, subtitulo, label };
}

/**
 * Extrai valor em destaque e legenda menor para cards de informação.
 * @param {string} id
 * @param {string} emoji
 * @param {string} label
 * @returns {{ id: string, emoji: string, valor: string, subtitulo: string, label: string }}
 */
function parseInfoAcao(id, emoji, label) {
  if (id === "tempo") {
    const match = label.match(/(~?\d+\s*min)/i);
    const valor = match?.[1]?.trim() || label;
    const subtitulo = label.replace(match?.[0] || "", "").trim() || "de carro";
    return infoAcao(id, emoji, valor, subtitulo, label);
  }

  if (id === "duracao") {
    const match = label.match(/(\d+[–-]\d+h|\d+h|~\d+[–-]\d+h)/i);
    const valor = match?.[1] || label.split(" ")[0];
    const subtitulo = label.includes("praia")
      ? "na praia"
      : label.includes("Trilha")
        ? "trilha"
        : "tempo médio";
    return infoAcao(id, emoji, valor, subtitulo, label);
  }

  if (id === "acesso") {
    const parts = label.split("—").map((s) => s.trim());
    if (parts.length >= 2) {
      return infoAcao(id, emoji, parts[0], parts[1], label);
    }
    if (/^acesso/i.test(label)) {
      return infoAcao(id, emoji, "Acesso", label.replace(/^acesso\s*/i, "") || "livre", label);
    }
    return infoAcao(id, emoji, label.split(" ")[0] || "Acesso", "ao local", label);
  }

  if (id === "horario") {
    return infoAcao(id, emoji, "Ideal", label.replace(/^ideal\s*/i, "") || label, label);
  }

  return infoAcao(id, emoji, label, "", label);
}

export function getAcoesRapidasLocais(lugar, tags = [], distancia) {
  const acoes = [];

  const tempo = estimarTempoDeslocamento(distancia);
  if (tempo) acoes.push(parseInfoAcao("tempo", "🚗", tempo));

  const acesso = getAcessoLabel(lugar, tags);
  if (acesso) acoes.push(parseInfoAcao("acesso", "🥾", acesso));

  acoes.push(parseInfoAcao("duracao", "⏱️", getDuracaoExperienciaLocal(lugar)));
  acoes.push(parseInfoAcao("horario", "☀️", getMelhorHorarioVisita(lugar, tags)));

  return acoes;
}

/**
 * Monta link wa.me a partir do telefone cadastrado (BR: DDD + número).
 * @param {string} [telefone]
 * @returns {string|null}
 */
export function buildWhatsAppHref(telefone) {
  const digits = String(telefone || "").replace(/\D/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (digits.length === 10 || digits.length === 11) {
    normalized = `55${digits}`;
  } else if (digits.length < 12) {
    return null;
  }

  return `https://wa.me/${normalized}`;
}

/**
 * Monta ações rápidas (WhatsApp, Instagram, Facebook, cardápio, site) para estabelecimentos.
 * @param {{ telefone?: string, instagramHref?: string, facebookHref?: string, cardapioUrl?: string, siteUrl?: string }} params
 * @returns {Array<{ id: string, label: string, href: string|null }>}
 */
export function getAcoesRapidasEstabelecimento({
  telefone,
  instagramHref,
  facebookHref,
  cardapioUrl,
  siteUrl,
}) {
  return [
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: buildWhatsAppHref(telefone),
    },
    {
      id: "instagram",
      label: "Instagram",
      href: instagramHref || null,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: facebookHref || null,
    },
    {
      id: "cardapio",
      label: "Cardápio",
      href: cardapioUrl || null,
    },
    {
      id: "site",
      label: "Site",
      href: siteUrl || null,
    },
  ];
}

/**
 * Gera URL do Google Maps Static API para preview de localização.
 * @param {{ latitude?: number|string, longitude?: number|string }} localizacao
 * @param {number} [width=600]
 * @param {number} [height=300]
 * @returns {string|null}
 */
export function getStaticMapUrl(localizacao, width = 600, height = 300) {
  const lat = Number(localizacao?.latitude);
  const lng = Number(localizacao?.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("[getStaticMapUrl] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ausente");
    return null;
  }

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: "15",
    size: `${width}x${height}`,
    maptype: "roadmap",
    markers: `color:0x1a4a3a|${lat},${lng}`,
    key: apiKey,
  });

  const url = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  console.log("[getStaticMapUrl]", url);
  return url;
}
