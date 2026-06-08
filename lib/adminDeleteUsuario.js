import { isAdminTeamRole, normalizeRole } from "./adminRoles.js";
import { deleteUserAccount } from "./deleteUserAccount.js";
import { registrarLog } from "./logs.js";

export class AdminDeleteUsuarioError extends Error {
  /**
   * @param {string} message
   * @param {string} code
   * @param {number} [status]
   */
  constructor(message, code, status = 400) {
    super(message);
    this.name = "AdminDeleteUsuarioError";
    this.code = code;
    this.status = status;
  }
}

/**
 * @param {{ id?: string, nome?: string, email?: string }} perfil
 * @returns {string}
 */
export function getUsuarioDisplayName(perfil) {
  return perfil?.nome?.trim() || perfil?.email?.trim() || "Sem nome";
}

/**
 * Valida se o admin pode excluir o usuário alvo.
 * @param {{ adminId: string, targetPerfil: { id: string, role?: string } }}
 * @returns {{ ok: true } | { ok: false, code: string, message: string }}
 */
export function validateAdminCanDeleteUsuario({ adminId, targetPerfil }) {
  if (!targetPerfil?.id) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Usuário não encontrado.",
    };
  }

  if (adminId === targetPerfil.id) {
    return {
      ok: false,
      code: "SELF_DELETE",
      message: "Você não pode excluir a própria conta pelo painel admin.",
    };
  }

  if (isAdminTeamRole(targetPerfil.role)) {
    return {
      ok: false,
      code: "PROTECTED_ROLE",
      message: "Contas da equipe admin (admin ou dev) não podem ser excluídas por aqui.",
    };
  }

  return { ok: true };
}

/**
 * Confirma exclusão digitando e-mail ou nome exato (quando não há e-mail no perfil).
 * @param {{ email?: string|null, nome?: string|null }} targetPerfil
 * @param {{ confirmEmail?: string, confirmNome?: string }} input
 * @returns {boolean}
 */
export function isUsuarioDeleteConfirmationValid(targetPerfil, input = {}) {
  const email = String(targetPerfil?.email || "").trim().toLowerCase();

  if (email) {
    return String(input.confirmEmail || "").trim().toLowerCase() === email;
  }

  const nome = getUsuarioDisplayName(targetPerfil).trim().toLowerCase();
  if (!nome || nome === "sem nome") return false;

  return String(input.confirmNome || "").trim().toLowerCase() === nome;
}

/**
 * Exclui conta de usuário pelo admin (dados + auth) com log de auditoria.
 * @param {import('@supabase/supabase-js').SupabaseClient} serviceClient
 * @param {object} params
 * @param {import('@supabase/supabase-js').SupabaseClient} params.auditSupabase
 * @param {import('@supabase/supabase-js').User} params.adminUser
 * @param {string} params.targetUserId
 * @param {{ confirmEmail?: string, confirmNome?: string }} params.confirmation
 * @returns {Promise<{ ok: true }>}
 */
export async function adminDeleteUsuario(
  serviceClient,
  { auditSupabase, adminUser, targetUserId, confirmation }
) {
  if (!serviceClient || !auditSupabase || !adminUser?.id || !targetUserId) {
    throw new AdminDeleteUsuarioError(
      "Parâmetros inválidos para exclusão.",
      "VALIDATION",
      400
    );
  }

  const { data: targetPerfil, error: targetError } = await serviceClient
    .from("perfis")
    .select("id, nome, email, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetError) {
    throw new AdminDeleteUsuarioError(
      "Não foi possível carregar o usuário.",
      "SERVER",
      500
    );
  }

  const guard = validateAdminCanDeleteUsuario({
    adminId: adminUser.id,
    targetPerfil,
  });

  if (!guard.ok) {
    throw new AdminDeleteUsuarioError(guard.message, guard.code, guard.code === "NOT_FOUND" ? 404 : 403);
  }

  if (!isUsuarioDeleteConfirmationValid(targetPerfil, confirmation)) {
    throw new AdminDeleteUsuarioError(
      targetPerfil.email
        ? "Digite o e-mail do usuário exatamente como aparece no perfil."
        : "Digite o nome do usuário exatamente como aparece no perfil.",
      "CONFIRMATION_MISMATCH",
      400
    );
  }

  await registrarLog(auditSupabase, adminUser, "admin_excluiu_usuario", {
    alvo_id: targetPerfil.id,
    alvo_email: targetPerfil.email ?? null,
    alvo_nome: getUsuarioDisplayName(targetPerfil),
    alvo_role: normalizeRole(targetPerfil.role),
  });

  await deleteUserAccount(serviceClient, targetUserId);

  return { ok: true };
}
