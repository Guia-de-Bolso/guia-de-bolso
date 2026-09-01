import assert from "node:assert/strict";
import {
  PERFIL_PROMO_FIM_PADRAO,
  PLANO_TIER,
  buildLugarLogDetalhes,
  buildPerfilPromoPayload,
  getPlanoComercialTier,
  getPlanoComercialTierLabel,
  hasPerfilCompletoGratuito,
  isLugarPerfilPresenca,
  isPerfilPromoAtivo,
  isSubcategoriaPresenca,
  shouldLugarDefaultPresenca,
} from "./planoLancamento.js";
import {
  countLugaresPorTier,
  getPrioridadeAbordagem,
  buildTopLugaresFromLogs,
  formatFilaAbordagemCsv,
} from "./adminKpis.js";
import {
  LOG_ACOES_VISUALIZACAO_LUGAR,
  LOG_ACOES_ACESSO_APP,
  aggregateEngajamentoByLugar,
} from "./adminRelatorios.js";

assert.equal(PERFIL_PROMO_FIM_PADRAO, "2027-02-28");
assert.equal(isPerfilPromoAtivo("2027-02-28", "2026-08-31"), true);
assert.equal(isPerfilPromoAtivo("2027-02-28", "2027-03-01"), false);
assert.equal(isPerfilPromoAtivo(null, "2026-08-31"), false);

const estabelecimento = {
  id: "1",
  nome: "Bar",
  categoria: "Gastronomia",
  subcategoria: "Restaurantes",
  eh_parceiro: false,
  perfil_promo_ate: "2027-02-28",
};

const farmacia = {
  id: "2",
  nome: "Farmácia",
  categoria: "Serviços",
  subcategoria: "Farmácias",
  eh_parceiro: false,
  perfil_promo_ate: null,
};

const parceiro = {
  ...estabelecimento,
  id: "3",
  eh_parceiro: true,
};

const praia = {
  id: "4",
  nome: "Praia",
  categoria: "Natureza",
  subcategoria: "Praias",
  eh_parceiro: false,
};

assert.equal(getPlanoComercialTier(estabelecimento, "2026-08-31"), PLANO_TIER.LANCAMENTO);
assert.equal(getPlanoComercialTier(farmacia, "2026-08-31"), PLANO_TIER.PRESENCA);
assert.equal(getPlanoComercialTier(parceiro, "2026-08-31"), PLANO_TIER.PARCEIRO);
assert.equal(getPlanoComercialTier(praia, "2026-08-31"), PLANO_TIER.PUBLICO);

assert.equal(hasPerfilCompletoGratuito(estabelecimento, "2026-08-31"), true);
assert.equal(hasPerfilCompletoGratuito(farmacia, "2026-08-31"), false);
assert.equal(isLugarPerfilPresenca(farmacia, "2026-08-31"), true);
assert.equal(isLugarPerfilPresenca(estabelecimento, "2026-08-31"), false);

assert.equal(isSubcategoriaPresenca("Farmácias"), true);
assert.equal(isSubcategoriaPresenca("Mercados"), true);
assert.equal(isSubcategoriaPresenca("Restaurantes"), false);
assert.equal(shouldLugarDefaultPresenca(farmacia), true);
assert.equal(shouldLugarDefaultPresenca(estabelecimento), false);

assert.deepEqual(buildPerfilPromoPayload({ perfil_promo_ativo: true }), {
  perfil_promo_ate: PERFIL_PROMO_FIM_PADRAO,
});
assert.deepEqual(buildPerfilPromoPayload({ perfil_promo_ativo: false }), {
  perfil_promo_ate: null,
});
assert.deepEqual(
  buildPerfilPromoPayload({ perfil_promo_ativo: true, perfil_promo_ate: "2027-01-15" }),
  { perfil_promo_ate: "2027-01-15" }
);

const detalhes = buildLugarLogDetalhes(estabelecimento, { app: "google" }, "2026-08-31");
assert.equal(detalhes.plano_tier, PLANO_TIER.LANCAMENTO);
assert.equal(detalhes.perfil_promo_ativo, true);
assert.equal(detalhes.app, "google");

const tiers = countLugaresPorTier(
  [
    { ...farmacia, status: "ativo" },
    { ...estabelecimento, status: "ativo" },
    { ...parceiro, status: "ativo" },
    { ...praia, status: "ativo" },
  ],
  "2026-08-31"
);
assert.equal(tiers.presenca, 1);
assert.equal(tiers.lancamento, 1);
assert.equal(tiers.parceiro, 1);
assert.equal(tiers.publico, 1);

const top = buildTopLugaresFromLogs(
  [
    { acao: "visualizou_lugar", detalhes: { lugar_id: "1" } },
    { acao: "visualizou_lugar", detalhes: { lugar_id: "1" } },
    { acao: "ir_agora", detalhes: { lugar_id: "1" } },
    { acao: "ir_agora", detalhes: { lugar_id: "2" } },
  ],
  new Map([
    ["1", { nome: "Bar", categoria: "Gastronomia" }],
    ["2", { nome: "Farmácia", categoria: "Serviços" }],
  ])
);
assert.equal(top[0].nome, "Bar");
assert.equal(top[0].engajamento, 3);

assert.equal(getPrioridadeAbordagem(farmacia, 60, "2026-08-31"), "alta");
assert.equal(getPrioridadeAbordagem(estabelecimento, 5, "2026-08-31"), "media");
assert.equal(getPrioridadeAbordagem(parceiro, 100, "2026-08-31"), "baixa");

assert.ok(LOG_ACOES_VISUALIZACAO_LUGAR.includes("visualizou_lugar"));
assert.ok(LOG_ACOES_ACESSO_APP.includes("acessou_app"));
assert.ok(!LOG_ACOES_VISUALIZACAO_LUGAR.includes("acessou_app"));
assert.ok(getPlanoComercialTierLabel(PLANO_TIER.LANCAMENTO).includes("Lançamento"));

const agg = aggregateEngajamentoByLugar([
  { acao: "visualizou_lugar", detalhes: { lugar_id: "1" } },
  { acao: "ir_agora", detalhes: { lugar_id: "1" } },
  { acao: "favoritou", detalhes: { lugar_id: "2" } },
]);
assert.equal(agg.get("1")?.visualizacoes, 1);
assert.equal(agg.get("1")?.irAgora, 1);
assert.equal(agg.get("2")?.favoritos, 1);

const csv = formatFilaAbordagemCsv({
  periodoLabel: "Últimos 30 dias",
  items: [
    {
      id: "1",
      nome: "Bar",
      categoria: "Gastronomia",
      subcategoria: "Restaurantes",
      tier: PLANO_TIER.LANCAMENTO,
      tierLabel: "Lançamento",
      prioridade: "alta",
      visualizacoes: 10,
      irAgora: 5,
      favoritos: 2,
      qrScans: 1,
      claimPerfil: 0,
      engajamentoTotal: 18,
      perfilPromoAte: "2027-02-28",
    },
  ],
});
assert.ok(csv.includes("Bar"));
assert.ok(csv.includes("2027-02-28"));

console.log("planoLancamento + adminKpis tests OK");
