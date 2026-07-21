import { getCapaFromLugar } from "./fotos.js";
import { pickOneBySeed, weeklySeed } from "./homeRotation.js";

export const PUSH_CAMPAIGN_TYPES = Object.freeze({
  NOVO_LOCAL: "novo_local",
  NOVO_PARCEIRO: "novo_parceiro",
  DESTAQUE_SEMANA: "destaque_semana",
  CLIMA: "clima",
  LEMBRETE_ROTEIRO: "lembrete_roteiro",
});

const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

/**
 * @param {Date} [date]
 * @returns {{ dateISO: string, hour: number }}
 */
export function getSaoPauloDateTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    dateISO: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
  };
}

/**
 * O cron diário deve preparar campanhas matinais entre 8h e 11h (horário de SP).
 * @param {Date} [date]
 * @returns {boolean}
 */
export function isPushMorningWindow(date = new Date()) {
  const { hour } = getSaoPauloDateTime(date);
  return hour >= 8 && hour <= 11;
}

/**
 * Evita notificação diária sem valor: clima só vira push em dia agradável.
 * @param {object|null|undefined} clima
 * @returns {boolean}
 */
export function isGoodWeatherForPush(clima) {
  const code = Number(clima?.weatherCode);
  const max = Number(clima?.tempMax);
  return Number.isFinite(code) && code >= 0 && code <= 3 && Number.isFinite(max) && max >= 22;
}

/**
 * @param {object} clima
 * @param {string} dateISO
 * @returns {object}
 */
export function buildWeatherCampaign(clima, dateISO) {
  const max = Math.round(Number(clima.tempMax));
  const condition = String(clima.condition || "tempo agradável").toLowerCase();
  const emoji = String(clima.weatherEmoji || "☀️");

  return {
    event_key: `clima:${dateISO}`,
    type: PUSH_CAMPAIGN_TYPES.CLIMA,
    audience: "all",
    title: `${emoji} O dia está convidativo em Imbituba`,
    body: `${condition}, máxima de ${max} °C. Veja o que fazer hoje.`,
    url: "/",
  };
}

/**
 * Seleciona um parceiro ativo com imagem de forma determinística por semana.
 * @param {Array<object>} lugares
 * @param {Date} [date]
 * @returns {object|null}
 */
export function pickWeeklyPushHighlight(lugares, date = new Date()) {
  const eligible = (lugares ?? []).filter(
    (lugar) =>
      lugar?.status === "ativo" &&
      lugar?.eh_parceiro === true &&
      Boolean(getCapaFromLugar(lugar))
  );
  return pickOneBySeed(eligible, weeklySeed(date));
}

/**
 * @param {object} lugar
 * @param {Date} [date]
 * @returns {object}
 */
export function buildWeeklyHighlightCampaign(lugar, date = new Date()) {
  const seed = weeklySeed(date);
  return {
    event_key: `destaque_semana:${seed}`,
    type: PUSH_CAMPAIGN_TYPES.DESTAQUE_SEMANA,
    audience: "all",
    title: "✨ Destaque da semana",
    body: `${lugar.nome} está em destaque no Guia de Bolso. Conheça agora.`,
    url: `/lugares/${lugar.id}`,
  };
}

/**
 * Janela de roteiros criados entre 3 e 4 dias antes da execução.
 * @param {Date} [date]
 * @returns {{ from: string, to: string }}
 */
export function getRoteiroReminderWindow(date = new Date()) {
  const to = new Date(date.getTime() - 3 * 24 * 60 * 60 * 1000);
  const from = new Date(date.getTime() - 4 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * @param {object} roteiro
 * @returns {object}
 */
export function buildRoteiroReminderCampaign(roteiro) {
  return {
    event_key: `lembrete_roteiro:${roteiro.id}`,
    type: PUSH_CAMPAIGN_TYPES.LEMBRETE_ROTEIRO,
    audience: "user",
    user_id: roteiro.user_id,
    title: "🧭 Seu roteiro está esperando",
    body: `Que tal retomar “${roteiro.titulo}” e planejar seu passeio?`,
    url: "/atrativos",
  };
}
