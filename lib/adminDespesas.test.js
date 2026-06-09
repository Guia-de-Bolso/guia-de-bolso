import assert from "node:assert/strict";
import {
  calcularCustoProjetadoDespesa,
  calcularResumo,
  calcularTotalPeriodo,
  calcVariationPercent,
  countMonthsInRange,
  isDespesaAtiva,
  normalizeValorMensal,
  resolveDespesaPeriodo,
  toBrl,
} from "./adminDespesas.js";

assert.equal(normalizeValorMensal(30, "mensal"), 30);
assert.equal(normalizeValorMensal(90, "trimestral"), 30);
assert.equal(normalizeValorMensal(600, "semestral"), 100);
assert.equal(normalizeValorMensal(120, "anual"), 10);
assert.equal(normalizeValorMensal(500, "unico"), 0);

assert.equal(toBrl(10, "BRL"), 10);
assert.equal(toBrl(10, "USD", 5.9), 59);

const despesaMensal = {
  id: "1",
  nome_plataforma: "Vercel",
  categoria: "infra",
  periodicidade: "mensal",
  valor: 20,
  moeda: "USD",
  ativo: true,
  data_inicio: "2026-01-01",
  data_fim: null,
  taxa_cambio: null,
};

assert.equal(isDespesaAtiva(despesaMensal, "2026-06-01"), true);
assert.equal(isDespesaAtiva({ ...despesaMensal, ativo: false }, "2026-06-01"), false);
assert.equal(isDespesaAtiva({ ...despesaMensal, data_fim: "2026-05-31" }, "2026-06-01"), false);

assert.equal(countMonthsInRange("2026-01-01", "2026-03-31"), 3);

const periodoMes = resolveDespesaPeriodo("mes", 2026, "", "", new Date("2026-06-15T12:00:00-03:00"));
assert.equal(periodoMes.inicio, "2026-06-01");
assert.equal(periodoMes.fim, "2026-06-30");
assert.equal(periodoMes.meses, 1);

const periodoSemestre = resolveDespesaPeriodo(
  "semestre",
  2026,
  "",
  "",
  new Date("2026-06-15T12:00:00-03:00")
);
assert.equal(periodoSemestre.inicio, "2026-01-01");
assert.equal(periodoSemestre.fim, "2026-06-30");

const periodoAno = resolveDespesaPeriodo("ano", 2026);
assert.equal(periodoAno.inicio, "2026-01-01");
assert.equal(periodoAno.fim, "2026-12-31");

const custoMes = calcularCustoProjetadoDespesa(despesaMensal, "2026-06-01", "2026-06-30", 5.9);
assert.equal(custoMes, 20 * 5.9);

const despesaAnual = {
  ...despesaMensal,
  periodicidade: "anual",
  valor: 120,
};
const custoAnualUmMes = calcularCustoProjetadoDespesa(despesaAnual, "2026-06-01", "2026-06-30", 5.9);
assert.equal(custoAnualUmMes, 10 * 5.9);

const despesaUnica = {
  ...despesaMensal,
  periodicidade: "unico",
  valor: 25,
  data_inicio: "2026-06-10",
};
assert.equal(
  calcularCustoProjetadoDespesa(despesaUnica, "2026-06-01", "2026-06-30", 5.9),
  25 * 5.9
);
assert.equal(
  calcularCustoProjetadoDespesa(despesaUnica, "2026-07-01", "2026-07-31", 5.9),
  0
);

const despesas = [despesaMensal, despesaAnual];
const totalTrimestre = calcularTotalPeriodo(
  despesas,
  [],
  "2026-04-01",
  "2026-06-30",
  5.9,
  "projetado"
);
assert.equal(totalTrimestre, 20 * 5.9 * 3 + 10 * 5.9 * 3);

const resumo = calcularResumo(
  despesas,
  [],
  { inicio: "2026-06-01", fim: "2026-06-30", meses: 1 },
  5.9,
  "projetado"
);
assert.ok(resumo.totalBrl > 0);
assert.ok(resumo.porCategoria.length > 0);
assert.equal(resumo.itensAtivos, 2);

assert.equal(calcVariationPercent(110, 100), 10);
assert.equal(calcVariationPercent(0, 0), 0);

console.log("adminDespesas.test.js: ok");
