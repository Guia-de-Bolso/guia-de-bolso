import test from "node:test";
import assert from "node:assert/strict";
import {
  formatParceirosCadastrados,
  formatParceirosNoGuia,
} from "./landingPartnerCopy.js";

test("formatParceirosCadastrados pluraliza corretamente", () => {
  assert.equal(formatParceirosCadastrados(0), null);
  assert.equal(formatParceirosCadastrados(1), "1 parceiro cadastrado");
  assert.equal(formatParceirosCadastrados(12), "12 parceiros cadastrados");
});

test("formatParceirosNoGuia pluraliza corretamente", () => {
  assert.equal(formatParceirosNoGuia(0), null);
  assert.equal(formatParceirosNoGuia(1), "1 parceiro no guia");
  assert.equal(formatParceirosNoGuia(5), "5 parceiros no guia");
});
