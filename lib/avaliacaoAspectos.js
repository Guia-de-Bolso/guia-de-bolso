/**
 * Aspectos selecionáveis no formulário de avaliação, por categoria/subcategoria do lugar.
 */

const ASPECTOS_PRAIAS = [
  "Água limpa",
  "Estrutura",
  "Acessível",
  "Movimento tranquilo",
  "Salva-vidas",
  "Estacionamento",
  "Pôr do sol",
  "Boa para crianças",
  "Areia boa",
  "Banho de mar",
  "Quiosques",
  "Pet friendly",
];

const ASPECTOS_GASTRONOMIA = [
  "Comida",
  "Atendimento",
  "Ambiente",
  "Preço justo",
  "Boa para família",
  "Tempo de espera",
  "Cardápio variado",
  "Higiene",
  "Porções generosas",
  "Drinks",
  "Música ao vivo",
  "Reserva fácil",
];

const ASPECTOS_TRILHAS_AVENTURA = [
  "Sinalização",
  "Dificuldade real",
  "Paisagem",
  "Segurança",
  "Limpeza",
  "Guia necessário",
  "Vale a pena",
  "Acessível",
  "Bem conservada",
  "Fotos incríveis",
  "Equipamento",
  "Duração adequada",
];

const ASPECTOS_NOITE = [
  "Ambiente",
  "Música",
  "Atendimento",
  "Preço justo",
  "Segurança",
  "Drinks",
  "Lotado demais",
  "Boa para casal",
  "Estacionamento",
  "Horário",
  "Voltaria",
  "Recomendo",
];

const ASPECTOS_SERVICOS = [
  "Atendimento",
  "Preço justo",
  "Pontualidade",
  "Profissionalismo",
  "Localização",
  "Estacionamento",
  "Acessível",
  "Recomendo",
  "Resolveu o problema",
  "Comunicação clara",
  "Custo-benefício",
  "Voltaria",
];

const ASPECTOS_CULTURA = [
  "Conteúdo",
  "Organização",
  "Acessível",
  "Preço justo",
  "Duração",
  "Guia / mediação",
  "Ambiente",
  "Vale a pena",
  "Para família",
  "Fotos permitidas",
  "Recomendo",
  "Voltaria",
];

const ASPECTOS_BEM_ESTAR = [
  "Profissionais",
  "Ambiente",
  "Limpeza",
  "Relaxante",
  "Preço justo",
  "Atendimento",
  "Agendamento fácil",
  "Estacionamento",
  "Produtos",
  "Resultado",
  "Recomendo",
  "Voltaria",
];

const ASPECTOS_PADRAO = [
  "Atendimento",
  "Localização",
  "Custo-benefício",
  "Recomendo",
  "Voltaria",
  "Limpeza",
  "Ambiente",
  "Acessível",
  "Preço justo",
  "Estacionamento",
  "Vale a pena",
  "Boa experiência",
];

/** Máximo de chips “O que mais marcou?” por avaliação */
export const MAX_ASPECTOS_SELECIONADOS = 6;

/** @type {Record<string, string>} */
const CATEGORIA_CHIP = {
  Natureza: "bg-[#d4ede8] text-[#1a4a3a]",
  Gastronomia: "bg-[#f0e4d4] text-[#6b5344]",
  Noite: "bg-[#e4d4f0] text-[#5c4a6e]",
  Serviços: "bg-[#c5dff5] text-[#2a5a7a]",
  Cultura: "bg-purple-100 text-purple-700",
  Aventura: "bg-orange-100 text-orange-700",
  "Bem-estar": "bg-pink-100 text-pink-700",
};

export const MAX_COMENTARIO_AVALIACAO = 300;

/**
 * @param {string} [categoria]
 * @returns {string}
 */
export function getCategoriaChipClass(categoria) {
  return CATEGORIA_CHIP[categoria] || "bg-gray-100 text-gray-700";
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isPraia(value) {
  const text = String(value || "").toLowerCase();
  return text.includes("praia");
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isTrilhaOuAventura(value) {
  const text = String(value || "").toLowerCase();
  return (
    text.includes("trilha") ||
    text.includes("cachoeira") ||
    text.includes("mirante") ||
    text === "aventura"
  );
}

/**
 * Lista de aspectos para o formulário conforme categoria e subcategoria do lugar.
 * @param {{ categoria?: string, subcategoria?: string }} lugar
 * @returns {string[]}
 */
export function getAspectosParaLugar(lugar) {
  const categoria = lugar?.categoria || "";
  const subcategoria = lugar?.subcategoria || "";

  if (categoria === "Gastronomia") return ASPECTOS_GASTRONOMIA;
  if (categoria === "Noite") return ASPECTOS_NOITE;
  if (categoria === "Serviços") return ASPECTOS_SERVICOS;
  if (categoria === "Cultura") return ASPECTOS_CULTURA;
  if (categoria === "Bem-estar") return ASPECTOS_BEM_ESTAR;

  if (categoria === "Natureza") {
    if (isPraia(subcategoria)) return ASPECTOS_PRAIAS;
    if (isTrilhaOuAventura(subcategoria)) return ASPECTOS_TRILHAS_AVENTURA;
    return ASPECTOS_TRILHAS_AVENTURA;
  }

  if (categoria === "Aventura") return ASPECTOS_TRILHAS_AVENTURA;

  return ASPECTOS_PADRAO;
}
