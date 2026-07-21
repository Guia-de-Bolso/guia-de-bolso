import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRoteiroReminderCampaign,
  buildWeatherCampaign,
  buildWeeklyHighlightCampaign,
  getRoteiroReminderWindow,
  getSaoPauloDateTime,
  isGoodWeatherForPush,
  isPushMorningWindow,
  pickWeeklyPushHighlight,
  PUSH_CAMPAIGN_TYPES,
} from "./pushAutomationRules.js";

test("janela matinal usa America/Sao_Paulo", () => {
  const morning = new Date("2026-07-21T12:00:00.000Z");
  const afternoon = new Date("2026-07-21T18:00:00.000Z");

  assert.deepEqual(getSaoPauloDateTime(morning), {
    dateISO: "2026-07-21",
    hour: 9,
  });
  assert.equal(isPushMorningWindow(morning), true);
  assert.equal(isPushMorningWindow(afternoon), false);
});

test("clima só gera push em dia agradável com máxima de 22 graus ou mais", () => {
  assert.equal(isGoodWeatherForPush({ weatherCode: 1, tempMax: 25 }), true);
  assert.equal(isGoodWeatherForPush({ weatherCode: 61, tempMax: 25 }), false);
  assert.equal(isGoodWeatherForPush({ weatherCode: 1, tempMax: 20 }), false);

  const campaign = buildWeatherCampaign(
    {
      weatherCode: 1,
      tempMax: 25.4,
      condition: "Parcialmente nublado",
      weatherEmoji: "⛅",
    },
    "2026-07-21"
  );
  assert.equal(campaign.event_key, "clima:2026-07-21");
  assert.equal(campaign.type, PUSH_CAMPAIGN_TYPES.CLIMA);
  assert.match(campaign.body, /25 °C/);
});

test("destaque semanal considera apenas parceiro ativo com imagem", () => {
  const date = new Date("2026-07-21T12:00:00.000Z");
  const lugares = [
    { id: 1, nome: "Sem foto", status: "ativo", eh_parceiro: true },
    {
      id: 2,
      nome: "Parceiro",
      status: "ativo",
      eh_parceiro: true,
      imagem_url: "https://example.com/foto.jpg",
    },
    {
      id: 3,
      nome: "Inativo",
      status: "desativado",
      eh_parceiro: true,
      imagem_url: "https://example.com/foto.jpg",
    },
  ];

  const selected = pickWeeklyPushHighlight(lugares, date);
  assert.equal(selected.id, 2);

  const campaign = buildWeeklyHighlightCampaign(selected, date);
  assert.equal(campaign.url, "/lugares/2");
  assert.match(campaign.event_key, /^destaque_semana:\d{4}-W\d{2}$/);
});

test("lembrete de roteiro usa janela de 3 a 4 dias e chave única", () => {
  const now = new Date("2026-07-21T12:00:00.000Z");
  assert.deepEqual(getRoteiroReminderWindow(now), {
    from: "2026-07-17T12:00:00.000Z",
    to: "2026-07-18T12:00:00.000Z",
  });

  const campaign = buildRoteiroReminderCampaign({
    id: "roteiro-1",
    user_id: "user-1",
    titulo: "Fim de semana",
  });
  assert.equal(campaign.event_key, "lembrete_roteiro:roteiro-1");
  assert.equal(campaign.audience, "user");
  assert.equal(campaign.user_id, "user-1");
});
