import { IMBITUBA_COORDS } from "./localizacao.js";
import {
  buildRoteiroReminderCampaign,
  buildWeatherCampaign,
  buildWeeklyHighlightCampaign,
  getRoteiroReminderWindow,
  getSaoPauloDateTime,
  isGoodWeatherForPush,
  pickWeeklyPushHighlight,
} from "./pushAutomationRules.js";
import { sendPushNotificationBatch } from "./pushMessaging.js";
import { disableInvalidPushTokens } from "./pushTokens.js";

const PUSH_TOKEN_PAGE_SIZE = 1000;
const PUSH_CAMPAIGN_BATCH_SIZE = 100;
const PUSH_AUTOMATIONS_ROLLOUT_AT = "2026-07-21T00:00:00.000Z";

/**
 * Forecast diário isolado do clima marinho: falha da API de ondas não deve
 * bloquear uma notificação baseada apenas no tempo.
 * @returns {Promise<object>}
 */
async function fetchWeatherPushForecast() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${IMBITUBA_COORDS.latitude}` +
    `&longitude=${IMBITUBA_COORDS.longitude}` +
    "&daily=weather_code,temperature_2m_max&forecast_days=1&timezone=America/Sao_Paulo";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Falha ao buscar previsão diária.");
  const data = await response.json();
  const weatherCode = data?.daily?.weather_code?.[0];

  return {
    weatherCode,
    tempMax: data?.daily?.temperature_2m_max?.[0],
    condition:
      Number(weatherCode) === 0 ? "Ensolarado" : "Parcialmente nublado",
    weatherEmoji: Number(weatherCode) === 0 ? "☀️" : "⛅",
  };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} admin
 * @param {object[]} campaigns
 * @returns {Promise<number>}
 */
async function enqueueCampaigns(admin, campaigns) {
  if (!campaigns.length) return 0;

  const safeCampaigns = campaigns.map((campaign) => ({
    ...campaign,
    title: String(campaign.title ?? "").slice(0, 120),
    body: String(campaign.body ?? "").slice(0, 500),
    url: campaign.url ? String(campaign.url).slice(0, 500) : null,
  }));

  const { data, error } = await admin
    .from("push_campaigns")
    .upsert(safeCampaigns, { onConflict: "event_key", ignoreDuplicates: true })
    .select("id");

  if (error) throw new Error(`push_campaigns enqueue: ${error.message}`);
  return data?.length ?? 0;
}

/**
 * Prepara clima, destaque semanal e lembretes de roteiro. As chaves únicas
 * tornam a operação segura mesmo se o cron for repetido.
 * @param {import("@supabase/supabase-js").SupabaseClient} admin
 * @param {Date} [date]
 * @returns {Promise<{ enqueued: number, skippedMorning: boolean }>}
 */
export async function prepareScheduledPushCampaigns(admin, date = new Date()) {
  const campaigns = [];
  const { dateISO } = getSaoPauloDateTime(date);

  const [{ data: parceiros, error: parceirosError }, { data: roteiros, error: roteirosError }] =
    await Promise.all([
      admin
        .from("lugares")
        .select("id,nome,status,eh_parceiro,imagem_url,fotos")
        .eq("status", "ativo")
        .eq("eh_parceiro", true),
      (() => {
        const window = getRoteiroReminderWindow(date);
        return admin
          .from("roteiros")
          .select("id,user_id,titulo,created_at")
          .gte("created_at", PUSH_AUTOMATIONS_ROLLOUT_AT)
          .lt("created_at", window.to);
      })(),
    ]);

  if (parceirosError) {
    console.warn("[push campaigns] parceiros:", parceirosError.message);
  } else {
    const destaque = pickWeeklyPushHighlight(parceiros, date);
    if (destaque) campaigns.push(buildWeeklyHighlightCampaign(destaque, date));
  }

  if (roteirosError) {
    console.warn("[push campaigns] roteiros:", roteirosError.message);
  } else {
    campaigns.push(...(roteiros ?? []).map(buildRoteiroReminderCampaign));
  }

  try {
    const clima = await fetchWeatherPushForecast();
    if (isGoodWeatherForPush(clima)) {
      campaigns.push(buildWeatherCampaign(clima, dateISO));
    }
  } catch (error) {
    console.warn(
      "[push campaigns] clima:",
      error instanceof Error ? error.message : "falha desconhecida"
    );
  }

  return {
    enqueued: await enqueueCampaigns(admin, campaigns),
  };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} admin
 * @param {string|null} userId
 * @returns {Promise<string[]>}
 */
async function getCampaignTokens(admin, userId) {
  const tokens = [];

  for (let offset = 0; ; offset += PUSH_TOKEN_PAGE_SIZE) {
    let query = admin
      .from("push_tokens")
      .select("token")
      .eq("enabled", true)
      .order("id")
      .range(offset, offset + PUSH_TOKEN_PAGE_SIZE - 1);

    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) throw new Error(`push_tokens: ${error.message}`);

    tokens.push(...(data ?? []).map((row) => row.token).filter(Boolean));
    if ((data?.length ?? 0) < PUSH_TOKEN_PAGE_SIZE) break;
  }

  return [...new Set(tokens)];
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} admin
 * @param {string} id
 * @param {Record<string, unknown>} patch
 * @returns {Promise<void>}
 */
async function updateCampaign(admin, id, patch) {
  const { error } = await admin
    .from("push_campaigns")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`push_campaigns update: ${error.message}`);
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} admin
 * @param {object} campaign
 * @returns {Promise<{ status: string, sent: number, failed: number }>}
 */
async function deliverCampaign(admin, campaign) {
  const userId = campaign.audience === "user" ? campaign.user_id : null;
  const tokens = await getCampaignTokens(admin, userId);

  if (!tokens.length) {
    await updateCampaign(admin, campaign.id, {
      status: "skipped",
      token_count: 0,
      sent_count: 0,
      failed_count: 0,
      sent_at: new Date().toISOString(),
      last_error: "Nenhum dispositivo ativo para a audiência.",
    });
    return { status: "skipped", sent: 0, failed: 0 };
  }

  const result = await sendPushNotificationBatch({
    tokens,
    title: campaign.title,
    body: campaign.body,
    url: campaign.url,
  });

  if (result.invalidTokens.length) {
    await disableInvalidPushTokens(admin, result.invalidTokens);
  }

  const status = result.failed === 0 ? "sent" : result.sent > 0 ? "partial" : "failed";
  const allTokensInvalid =
    result.invalidTokens.length > 0 && result.invalidTokens.length === tokens.length;
  const shouldRetry =
    result.sent === 0 && !allTokensInvalid && Number(campaign.attempts) < 3;
  const finalStatus = shouldRetry ? "pending" : status;
  await updateCampaign(admin, campaign.id, {
    status: finalStatus,
    token_count: tokens.length,
    sent_count: result.sent,
    failed_count: result.failed,
    error_counts: result.errorCounts,
    scheduled_for: shouldRetry
      ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
      : campaign.scheduled_for,
    processing_started_at: null,
    sent_at: shouldRetry ? null : new Date().toISOString(),
    last_error: result.message ?? null,
  });

  return { status: finalStatus, sent: result.sent, failed: result.failed };
}

/**
 * Processa campanhas já enfileiradas. `claim_push_campaigns` evita envio duplo
 * em execuções concorrentes do cron.
 * @param {import("@supabase/supabase-js").SupabaseClient} admin
 * @param {{ prepareScheduled?: boolean, date?: Date }} [options]
 * @returns {Promise<object>}
 */
export async function processPushCampaigns(admin, options = {}) {
  const date = options.date ?? new Date();
  const prepared =
    options.prepareScheduled === false
      ? { enqueued: 0 }
      : await prepareScheduledPushCampaigns(admin, date);

  const { data: campaigns, error } = await admin.rpc("claim_push_campaigns", {
    p_limit: PUSH_CAMPAIGN_BATCH_SIZE,
  });
  if (error) throw new Error(`claim_push_campaigns: ${error.message}`);

  const totals = {
    campaigns: campaigns?.length ?? 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    partial: 0,
  };

  for (const campaign of campaigns ?? []) {
    try {
      const result = await deliverCampaign(admin, campaign);
      totals.sent += result.sent;
      totals.failed += result.failed;
      if (result.status === "skipped") totals.skipped += 1;
      if (result.status === "partial") totals.partial += 1;
    } catch (error) {
      totals.failed += 1;
      const shouldRetry = Number(campaign.attempts) < 3;
      await updateCampaign(admin, campaign.id, {
        status: shouldRetry ? "pending" : "failed",
        scheduled_for: shouldRetry
          ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
          : campaign.scheduled_for,
        processing_started_at: null,
        last_error: error instanceof Error ? error.message.slice(0, 500) : "Falha no envio.",
      });
    }
  }

  return { prepared, ...totals };
}
