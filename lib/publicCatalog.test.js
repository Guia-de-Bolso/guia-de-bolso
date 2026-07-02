import assert from "node:assert/strict";
import {
  applyPublicLugarFilters,
  filterLugaresPublicos,
  isLugarVisivelNoApp,
  PUBLIC_APP_PARTNERS_ONLY,
} from "./publicCatalog.js";

assert.equal(PUBLIC_APP_PARTNERS_ONLY, false);

// Com o gate de parceiro desligado, todo lugar ativo é público (parceiro ou não).
assert.equal(isLugarVisivelNoApp({ status: "ativo", eh_parceiro: true }), true);
assert.equal(isLugarVisivelNoApp({ status: "ativo", eh_parceiro: false }), true);
assert.equal(isLugarVisivelNoApp({ status: "desativado", eh_parceiro: true }), false);
assert.equal(isLugarVisivelNoApp({ status: "em_analise", eh_parceiro: true }), false);
assert.equal(isLugarVisivelNoApp(null), false);

const filtered = filterLugaresPublicos([
  { id: "1", status: "ativo", eh_parceiro: true },
  { id: "2", status: "ativo", eh_parceiro: false },
  { id: "3", status: "desativado", eh_parceiro: true },
]);
assert.deepEqual(filtered.map((l) => l.id), ["1", "2"]);

const mockQuery = {
  filters: [],
  eq(column, value) {
    this.filters.push([column, value]);
    return this;
  },
};

applyPublicLugarFilters(mockQuery);
assert.deepEqual(mockQuery.filters, [["status", "ativo"]]);

console.log("publicCatalog.test.js: ok");
