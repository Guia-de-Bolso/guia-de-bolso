import { isMissingTableError } from "./deleteUserAccount.js";

/**
 * Exclusão definitiva de um lugar e dados dependentes.
 * Requer cliente Supabase com service role — apenas server-side (cron / admin futuro).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {number|string} lugarId
 * @returns {Promise<{ ok: true, lugarId: number|string }>}
 */
export async function deleteLugar(admin, lugarId) {
  if (!admin || lugarId == null || lugarId === "") {
    throw new Error("Parâmetros inválidos para exclusão de lugar.");
  }

  const id = lugarId;

  const childTables = [
    "destaques",
    "favoritos",
    "avaliacoes",
    "lugares_tags",
    "localizacoes",
    "fotos_lugar",
  ];

  for (const table of childTables) {
    const { error } = await admin.from(table).delete().eq("lugar_id", id);
    if (error && !isMissingTableError(error)) {
      throw new Error(`Falha ao remover ${table}: ${error.message}`);
    }
  }

  const { error: lugarError } = await admin.from("lugares").delete().eq("id", id);
  if (lugarError) {
    throw new Error(`Falha ao remover lugar: ${lugarError.message}`);
  }

  return { ok: true, lugarId: id };
}
