import test from "node:test";
import assert from "node:assert/strict";
import {
  buildNovoLocalCampaign,
  buildNovoParceiroCampaign,
  buildRoteiroReminderCampaign,
  buildWeatherCampaign,
  buildWeeklyHighlightCampaign,
  getRoteiroReminderWindow,
  getSaoPauloDateTime,
  isGoodWeatherForPush,
  isPushMorningWindow,
  novoLocalPushIntro,
  pickWeeklyPushHighlight,
  PUSH_CAMPAIGN_TYPES,
} from "./pushAutomationRules.js";

test("push de novo local não usa o nome da categoria como sujeito", () => {
  assert.equal(novoLocalPushIntro("Serviços"), "Um novo serviço");
  assert.equal(novoLocalPushIntro("Natureza"), "Um novo ponto de natureza");
  assert.equal(novoLocalPushIntro(""), "Um novo lugar");

  const campaign = buildNovoLocalCampaign({
    id: "lugar-1",
    nome: "Farmácia do Trabalhador",
    categoria: "Serviços",
  });
  assert.equal(campaign.title, "Novo no Guia: Farmácia do Trabalhador");
  assert.equal(
    campaign.body,
    "Um novo serviço acabou de chegar ao Guia de Bolso. Conheça agora."
  );
  assert.equal(campaign.url, "/lugares/lugar-1");
  assert.doesNotMatch(campaign.body, /^Serviços /);
});

test("push de novo parceiro mantém o nome do estabelecimento no corpo", () => {
  const campaign = buildNovoParceiroCampaign({
    id: "lugar-2",
    nome: "Café da Vila",
  });
  assert.equal(campaign.title, "🤝 Novo Parceiro Oficial");
  assert.match(campaign.body, /^Café da Vila agora é Parceiro Oficial/);
});

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
  assert.equal(campaign.title, "⛅ Tempo bom em Imbituba");
  assert.match(campaign.body, /25°C/);
  assert.match(campaign.body, /Abra o app/);
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
  assert.equal(campaign.title, "✨ Destaque da semana no app");
  assert.match(campaign.body, /Toque e confira/);
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
  assert.equal(campaign.title, "🧭 Seu roteiro te espera");
  assert.match(campaign.body, /Abra o app/);
});
