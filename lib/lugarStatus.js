/** Status persistido em `lugares.status`. */
export const LUGAR_STATUS = {
  ATIVO: "ativo",
  /** Cadastrado no admin, fora do app — sem exclusão automática. */
  PAUSADO: "pausado",
  /** Estava publicado e foi desativado — exclusão após 30 dias (`desativado_em`). */
  DESATIVADO: "desativado",
  EM_ANALISE: "em_analise",
};

/** Rótulos do admin (UI). */
export const LUGAR_STATUS_LABELS = {
  [LUGAR_STATUS.ATIVO]: "Ativo",
  [LUGAR_STATUS.PAUSADO]: "Desativado",
  [LUGAR_STATUS.DESATIVADO]: "Inativo",
  [LUGAR_STATUS.EM_ANALISE]: "Em análise",
};

/** Opções do select de status no formulário admin. */
export const LUGAR_STATUS_FORM_OPTIONS = [
  {
    value: LUGAR_STATUS.ATIVO,
    label: "Ativo",
    hint: "visível no app",
  },
  {
    value: LUGAR_STATUS.PAUSADO,
    label: "Desativado",
    hint: "cadastrado, fora do app — sem exclusão automática",
  },
  {
    value: LUGAR_STATUS.DESATIVADO,
    label: "Inativo",
    hint: "exclusão definitiva após 30 dias",
  },
  {
    value: LUGAR_STATUS.EM_ANALISE,
    label: "Em análise",
    hint: "aguardando moderação",
  },
];

/**
 * @param {string|null|undefined} status
 * @returns {string}
 */
export function getLugarStatusLabel(status) {
  return LUGAR_STATUS_LABELS[status] || status || "—";
}

/**
 * @param {object|null|undefined} lugar
 * @returns {boolean}
 */
export function isLugarAtivo(lugar) {
  return lugar?.status === LUGAR_STATUS.ATIVO;
}

/**
 * Local elegível ao purge de 30 dias.
 * @param {object|null|undefined} lugar
 * @returns {boolean}
 */
export function isLugarInativoComPurge(lugar) {
  return lugar?.status === LUGAR_STATUS.DESATIVADO;
}

/**
 * Cadastro fora do app, sem exclusão automática.
 * @param {object|null|undefined} lugar
 * @returns {boolean}
 */
export function isLugarPausado(lugar) {
  return lugar?.status === LUGAR_STATUS.PAUSADO;
}
