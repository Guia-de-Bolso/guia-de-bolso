/**
 * Pede ao servidor para processar eventos automáticos criados por triggers.
 * Falhas não devem impedir o CRUD admin; o cron diário tenta novamente.
 * @returns {Promise<boolean>}
 */
export async function processPendingPushCampaigns() {
  try {
    const response = await fetch("/api/admin/push/process", {
      method: "POST",
      credentials: "same-origin",
    });
    return response.ok;
  } catch {
    return false;
  }
}
