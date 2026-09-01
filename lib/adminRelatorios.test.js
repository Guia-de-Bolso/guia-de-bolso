import assert from "node:assert/strict";
import {
  logDetalhesMatchLugar,
  LOG_ACOES_VISUALIZACAO_LUGAR,
  LOG_ACOES_ACESSO_APP,
  calcMediaInteira,
  calcPosicaoRanking,
  aggregateEngajamentoByLugar,
} from "./adminRelatorios.js";
import { formatRelatorioWhatsApp } from "./adminRelatorios.js";

assert.equal(logDetalhesMatchLugar({ lugar_id: "abc" }, "abc"), true);
assert.equal(logDetalhesMatchLugar({ lugarId: "abc" }, "abc"), true);
assert.equal(logDetalhesMatchLugar({ lugar_id: "x" }, "y"), false);

assert.ok(LOG_ACOES_VISUALIZACAO_LUGAR.includes("visualizou_lugar"));
assert.ok(!LOG_ACOES_VISUALIZACAO_LUGAR.includes("acessou_app"));
assert.ok(LOG_ACOES_ACESSO_APP.includes("acessou_app"));

assert.equal(calcMediaInteira([10, 20, 30]), 20);
assert.equal(calcPosicaoRanking(30, [50, 30, 10]), 2);
assert.equal(aggregateEngajamentoByLugar([]).size, 0);

const whatsapp = formatRelatorioWhatsApp({
  lugarNome: "Bar do Sol",
  periodoLabel: "Últimos 30 dias",
  planoTierLabel: "Lançamento (completo grátis)",
  visualizacoes: { value: 10, variation: { text: "↑ +20%" } },
  qrScans: { value: 2, variation: { text: "Sem variação" } },
  irAgora: { value: 5, variation: { text: "↑ +10%" } },
  favoritos: { value: 3, variation: { text: "Sem variação" } },
  claimPerfil: { value: 1, variation: { text: "Sem variação" } },
  avaliacoes: { value: 2, variation: { text: "Sem variação" } },
  avaliacoesMedia: 4.5,
  avaliacoesLista: [],
  comparativoCategoria: {
    categoria: "Gastronomia",
    totalEstabelecimentos: 8,
    mediaVisualizacoes: 120,
    mediaIrAgora: 15,
    mediaEngajamento: 140,
    posicaoVisualizacoes: 3,
    posicaoIrAgora: 2,
    topParceiroVisualizacoes: 400,
    topParceiroIrAgora: 45,
  },
});

assert.ok(whatsapp.includes("Bar do Sol"));
assert.ok(whatsapp.includes("Pedidos de perfil: 1"));
assert.ok(whatsapp.includes("Plano atual: Lançamento"));
assert.ok(whatsapp.includes("Comparativo · Gastronomia"));
assert.ok(whatsapp.includes("#3"));

console.log("adminRelatorios tests OK");
