/**
 * Perfil livre do roteiro com IA — texto do usuário, limitado antes do prompt.
 * @module lib/roteiroPerfil
 */

/** Tamanho máximo do perfil enviado à IA e salvo no banco. */
export const ROTEIRO_PERFIL_MAX = 80;

/** A partir deste tamanho o título do roteiro não repete o perfil. */
export const ROTEIRO_PERFIL_TITULO_MAX = 32;

/**
 * Limita o texto enquanto a pessoa digita, sem cortar o espaço do fim da frase.
 * @param {unknown} value
 * @returns {string}
 */
export function limitarPerfilRoteiro(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .slice(0, ROTEIRO_PERFIL_MAX);
}

/**
 * Remove caracteres de controle, normaliza espaços e limita o tamanho.
 * @param {unknown} value
 * @returns {string}
 */
export function sanitizePerfilRoteiro(value) {
  return limitarPerfilRoteiro(value).replace(/\s+/g, " ").trim();
}

/**
 * Título curto para a lista e o cabeçalho.
 * Perfil longo fica só no campo `perfil`, para não estourar o nome do guia.
 * @param {string} dias - Rótulo já resolvido, ex. "3 dias".
 * @param {string} perfil
 * @returns {string}
 */
export function buildTituloRoteiro(dias, perfil) {
  const diasLimpo = String(dias ?? "").replace(/\s+/g, " ").trim();
  const perfilLimpo = sanitizePerfilRoteiro(perfil);
  const base = diasLimpo ? `Roteiro ${diasLimpo}` : "Roteiro";

  if (!perfilLimpo || perfilLimpo.length > ROTEIRO_PERFIL_TITULO_MAX) {
    return base;
  }

  return `${base} - ${perfilLimpo}`;
}
