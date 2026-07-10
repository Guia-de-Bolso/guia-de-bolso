/** Opções exibidas no formulário de roteiro com IA. */
export const ROTEIRO_DIAS_OPCOES = ["1 dia", "2 dias", "3 dias", "4+ dias"];

/** Faixa de dias quando o usuário escolhe "4+ dias". */
export const ROTEIRO_DIAS_EXTENDED_MIN = 4;
export const ROTEIRO_DIAS_EXTENDED_MAX = 14;

/** @type {number[]} */
export const ROTEIRO_DIAS_EXTENDED_OPCOES = Array.from(
  { length: ROTEIRO_DIAS_EXTENDED_MAX - ROTEIRO_DIAS_EXTENDED_MIN + 1 },
  (_, index) => ROTEIRO_DIAS_EXTENDED_MIN + index
);

/**
 * @param {string|number|null|undefined} value
 * @returns {boolean}
 */
export function isDiasExtendedOpcao(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase() === "4+ dias";
}

/**
 * @param {number} n
 * @returns {string}
 */
export function formatDiasOpcaoLabel(n) {
  if (n === 1) return "1 dia";
  return `${n} dias`;
}

/**
 * Converte rótulo da UI ou número em inteiro para `roteiros.dias`.
 * @param {string|number|null|undefined} value - Ex.: `"2 dias"`, `2`, `"4+ dias"`.
 * @returns {number|null} 1–99 ou `null` se inválido.
 */
export function parseDiasViagem(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.trunc(value);
    return n >= 1 && n <= 99 ? n : null;
  }

  const texto = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!texto) return null;

  if (texto.includes("4+") || /^4\+?\s*dias?$/.test(texto)) {
    return 4;
  }

  const match = texto.match(/(\d+)/);
  if (!match) return null;

  const n = parseInt(match[1], 10);
  return n >= 1 && n <= 99 ? n : null;
}

/**
 * Formata valor persistido (`integer` ou legado `text`) para exibição.
 * @param {string|number|null|undefined} value
 * @returns {string}
 */
export function formatDiasViagem(value) {
  const n = parseDiasViagem(value);
  if (n === null) {
    const legado = String(value ?? "").trim();
    return legado;
  }
  return formatDiasOpcaoLabel(n);
}

/**
 * Restaura estado do formulário a partir do valor salvo/enviado à API.
 * @param {string|number|null|undefined} value
 * @returns {{ dias: string, diasExatos: number|null }}
 */
export function splitDiasFormState(value) {
  const n = parseDiasViagem(value);
  const legado = String(value ?? "").trim();

  if (n !== null && n >= ROTEIRO_DIAS_EXTENDED_MIN && !isDiasExtendedOpcao(legado)) {
    return { dias: "4+ dias", diasExatos: n };
  }

  if (isDiasExtendedOpcao(legado)) {
    return { dias: "4+ dias", diasExatos: n };
  }

  if (n !== null && n >= 1 && n <= 3) {
    return { dias: formatDiasOpcaoLabel(n), diasExatos: null };
  }

  return { dias: legado, diasExatos: null };
}

/**
 * Valor final enviado à API após escolha de "4+ dias".
 * @param {string|null|undefined} diasOpcao
 * @param {string|number|null|undefined} diasExatos
 * @returns {string}
 */
export function resolveDiasParaRoteiro(diasOpcao, diasExatos) {
  const opcao = String(diasOpcao ?? "").trim();
  if (!opcao) return "";

  if (isDiasExtendedOpcao(opcao)) {
    const n = parseDiasViagem(diasExatos);
    if (n === null || n < ROTEIRO_DIAS_EXTENDED_MIN || n > ROTEIRO_DIAS_EXTENDED_MAX) {
      return "";
    }
    return formatDiasOpcaoLabel(n);
  }

  return opcao;
}
