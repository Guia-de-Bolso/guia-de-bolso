/** Mensagens amigáveis em português para a UI. */
export const USER_MESSAGES = {
  LOGIN_REQUIRED: "Faça login para continuar.",
  LIMIT_REACHED: "Você atingiu o limite gratuito de hoje. Tente de novo após a meia-noite ou assine o Premium.",
  NETWORK: "Não foi possível conectar. Verifique sua internet e tente de novo.",
  SERVER: "Algo deu errado do nosso lado. Tente novamente em instantes.",
  CLAUDE_ERROR: "Não conseguimos processar sua busca agora. Tente outra frase ou mais tarde.",
  ROTEIRO_ERROR: "Não foi possível gerar o roteiro agora. Tente de novo em instantes.",
  NOT_FOUND: "Conteúdo não encontrado.",
  VALIDATION: "Revise os dados informados e tente novamente.",
  UNAUTHORIZED: "Sessão expirada. Entre novamente na sua conta.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
  RATE_LIMIT: "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo.",
  /** Alias usado nas rotas de IA (`/api/buscar`, `/api/roteiro`). */
  RATE_LIMITED: "Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo.",
  FEEDBACK_SUCCESS: "Recebemos seu feedback. Obrigado!",
  FEEDBACK_ERROR: "Não foi possível enviar seu feedback. Tente novamente.",
  WAITLIST_SUCCESS:
    "Pronto! Você entrou na lista. Em breve enviamos um e-mail de confirmação.",
  WAITLIST_ALREADY:
    "Este e-mail já está na lista. Assim que tivermos novidades, você será avisado.",
  GENERIC: "Algo deu errado. Tente novamente.",
};

/**
 * @param {string} [code]
 * @param {string} [fallback]
 * @returns {string}
 */
export function getUserMessage(code, fallback) {
  if (code && USER_MESSAGES[code]) {
    return USER_MESSAGES[code];
  }
  return fallback ?? USER_MESSAGES.GENERIC;
}

/**
 * Normaliza resposta de fetch/API para mensagem exibível ao usuário.
 * @param {object|null|undefined} data - Corpo JSON da resposta.
 * @param {number} [status] - HTTP status.
 * @returns {{ message: string, code: string|null }}
 */
export function mapApiErrorResponse(data, status) {
  const code = data?.code ?? null;

  if (data?.error && typeof data.error === "string") {
    const trimmed = data.error.trim();
    if (/[àáâãéêíóôõúç]/i.test(trimmed) || trimmed.length > 0) {
      return { message: trimmed, code };
    }
  }

  if (code && USER_MESSAGES[code]) {
    return { message: USER_MESSAGES[code], code };
  }

  if (status === 401) {
    return { message: USER_MESSAGES.UNAUTHORIZED, code: "UNAUTHORIZED" };
  }
  if (status === 403) {
    return { message: USER_MESSAGES.FORBIDDEN, code: "FORBIDDEN" };
  }
  if (status === 404) {
    return { message: USER_MESSAGES.NOT_FOUND, code: "NOT_FOUND" };
  }
  if (status === 429) {
    const rateCode = code === "RATE_LIMITED" ? "RATE_LIMITED" : "RATE_LIMIT";
    return {
      message: USER_MESSAGES[rateCode] ?? USER_MESSAGES.RATE_LIMIT,
      code: rateCode,
    };
  }
  if (status && status >= 500) {
    return {
      message: data?.error && typeof data.error === "string"
        ? data.error.trim()
        : USER_MESSAGES.SERVER,
      code: "SERVER",
    };
  }

  return { message: USER_MESSAGES.GENERIC, code };
}

/**
 * Mensagem para erros de rede (fetch falhou).
 * @returns {string}
 */
export function getNetworkErrorMessage() {
  return USER_MESSAGES.NETWORK;
}

/**
 * Corpo JSON padronizado para respostas de erro da API.
 * @param {string} code - Chave em USER_MESSAGES ou mensagem custom em `error`.
 * @param {number} [status]
 * @param {object} [extra]
 * @returns {{ error: string, code: string } & object}
 */
export function buildApiErrorBody(code, extra = {}) {
  const message =
    typeof extra.error === "string" && extra.error.trim()
      ? extra.error.trim()
      : getUserMessage(code);
  const { error: _omit, ...rest } = extra;
  return {
    error: message,
    code,
    ...rest,
  };
}
