import {
  PUSH_BODY_MAX_LENGTH,
  PUSH_MAX_RECIPIENTS,
  PUSH_PLATFORMS,
  PUSH_TITLE_MAX_LENGTH,
  PUSH_TOKEN_MAX_LENGTH,
  PUSH_URL_MAX_LENGTH,
} from "./pushNotificationConstants.js";
import { safeRedirectPath } from "./safeRedirectPath.js";

/**
 * @param {unknown} value
 * @returns {string|null}
 */
export function normalizePushPlatform(value) {
  if (typeof value !== "string") return null;
  const platform = value.trim().toLowerCase();
  return PUSH_PLATFORMS.includes(platform) ? platform : null;
}

/**
 * @param {unknown} token
 * @returns {{ ok: true, token: string } | { ok: false, message: string }}
 */
export function validatePushToken(token) {
  if (typeof token !== "string") {
    return { ok: false, message: "Token de push inválido." };
  }

  const normalized = token.trim();
  if (!normalized) {
    return { ok: false, message: "Token de push inválido." };
  }

  if (normalized.length > PUSH_TOKEN_MAX_LENGTH) {
    return { ok: false, message: "Token de push inválido." };
  }

  return { ok: true, token: normalized };
}

/**
 * @param {unknown} platform
 * @returns {{ ok: true, platform: string } | { ok: false, message: string }}
 */
export function validatePushPlatform(platform) {
  const normalized = normalizePushPlatform(platform);
  if (!normalized) {
    return { ok: false, message: "Plataforma inválida." };
  }

  return { ok: true, platform: normalized };
}

/**
 * @param {unknown} userIds
 * @returns {{ ok: true, userIds: string[] } | { ok: false, message: string }}
 */
export function validatePushRecipientUserIds(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { ok: false, message: "Informe ao menos um usuário." };
  }

  if (userIds.length > PUSH_MAX_RECIPIENTS) {
    return {
      ok: false,
      message: `Máximo de ${PUSH_MAX_RECIPIENTS} destinatários por envio.`,
    };
  }

  const normalized = [];
  for (const value of userIds) {
    if (typeof value !== "string" || !value.trim()) {
      return { ok: false, message: "Lista de usuários inválida." };
    }
    normalized.push(value.trim());
  }

  return { ok: true, userIds: [...new Set(normalized)] };
}

/**
 * @param {unknown} body
 * @returns {{
 *   ok: true,
 *   title: string,
 *   body: string,
 *   url: string | null,
 *   userIds: string[]
 * } | { ok: false, message: string }}
 */
export function validateAdminPushPayload(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Payload inválido." };
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.body === "string" ? body.body.trim() : "";

  if (!title) {
    return { ok: false, message: "Informe o título da notificação." };
  }

  if (title.length > PUSH_TITLE_MAX_LENGTH) {
    return {
      ok: false,
      message: `Título muito longo (máx. ${PUSH_TITLE_MAX_LENGTH} caracteres).`,
    };
  }

  if (!message) {
    return { ok: false, message: "Informe o texto da notificação." };
  }

  if (message.length > PUSH_BODY_MAX_LENGTH) {
    return {
      ok: false,
      message: `Texto muito longo (máx. ${PUSH_BODY_MAX_LENGTH} caracteres).`,
    };
  }

  const recipients = validatePushRecipientUserIds(body.userIds);
  if (!recipients.ok) return recipients;

  let url = null;
  if (body.url != null && body.url !== "") {
    if (typeof body.url !== "string") {
      return { ok: false, message: "URL de destino inválida." };
    }

    const trimmed = body.url.trim();
    if (trimmed.length > PUSH_URL_MAX_LENGTH) {
      return { ok: false, message: "URL de destino inválida." };
    }

    url = safeRedirectPath(trimmed, null);
    if (!url) {
      return { ok: false, message: "URL de destino inválida." };
    }
  }

  return {
    ok: true,
    title,
    body: message,
    url,
    userIds: recipients.userIds,
  };
}
