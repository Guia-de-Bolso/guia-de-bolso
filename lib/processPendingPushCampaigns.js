/**
 * Após CRUD de conteúdo no admin: processa push pendente e invalida
 * cache da home/landing (carrossel de parceiros, etc.).
 * Falhas não devem impedir o CRUD; o cron diário tenta o push de novo.
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
