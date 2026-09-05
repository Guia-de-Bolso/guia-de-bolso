import test from "node:test";
import assert from "node:assert/strict";
import {
  formatAvaliacoesAprovadas,
  formatParceirosCadastrados,
  formatParceirosNoGuia,
  socialProofMetrics,
} from "./landingPartnerCopy.js";

test("formatParceirosCadastrados pluraliza corretamente", () => {
  assert.equal(formatParceirosCadastrados(0), null);
  assert.equal(formatParceirosCadastrados(1), "1 parceiro cadastrado");
  assert.equal(formatParceirosCadastrados(12), "12 parceiros cadastrados");
});

test("formatAvaliacoesAprovadas omite zero e pluraliza", () => {
  assert.equal(formatAvaliacoesAprovadas(0), null);
  assert.equal(formatAvaliacoesAprovadas(1), "1 avaliação aprovada");
  assert.equal(formatAvaliacoesAprovadas(12), "12 avaliações aprovadas");
});

test("formatParceirosNoGuia pluraliza corretamente", () => {
  assert.equal(formatParceirosNoGuia(0), null);
  assert.equal(formatParceirosNoGuia(1), "1 parceiro no guia");
  assert.equal(formatParceirosNoGuia(5), "5 parceiros no guia");
});

test("socialProofMetrics omite avaliações zeradas e usa categorias", () => {
  assert.deepEqual(
    socialProofMetrics({
      totalLugares: 40,
      parceirosCount: 8,
      avaliacoesCount: 0,
      categoriasComLugares: 7,
    }),
    [
      { label: "Lugares verificados", value: 40 },
      { label: "Parceiros oficiais", value: 8 },
      { label: "Categorias no guia", value: 7 },
    ]
  );
});

test("socialProofMetrics mostra avaliações quando o total é real", () => {
  assert.deepEqual(
    socialProofMetrics({
      totalLugares: 40,
      parceirosCount: 8,
      avaliacoesCount: 12,
      categoriasComLugares: 7,
    }).map((item) => item.label),
    ["Lugares verificados", "Parceiros oficiais", "Avaliações aprovadas"]
  );
});
