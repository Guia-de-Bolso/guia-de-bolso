import assert from "node:assert/strict";
import {
  applyPublicLugarFilters,
  filterLugaresPublicos,
  isLugarVisivelNoApp,
  PUBLIC_APP_PARTNERS_ONLY,
} from "./publicCatalog.js";

assert.equal(PUBLIC_APP_PARTNERS_ONLY, true);

assert.equal(isLugarVisivelNoApp({ status: "ativo", eh_parceiro: true }), true);
assert.equal(isLugarVisivelNoApp({ status: "ativo", eh_parceiro: false }), false);
assert.equal(isLugarVisivelNoApp({ status: "desativado", eh_parceiro: true }), false);
assert.equal(isLugarVisivelNoApp(null), false);

const filtered = filterLugaresPublicos([
  { id: "1", status: "ativo", eh_parceiro: true },
  { id: "2", status: "ativo", eh_parceiro: false },
  { id: "3", status: "desativado", eh_parceiro: true },
]);
assert.deepEqual(filtered.map((l) => l.id), ["1"]);

const mockQuery = {
  filters: [],
  eq(column, value) {
    this.filters.push([column, value]);
    return this;
  },
};

applyPublicLugarFilters(mockQuery);
assert.deepEqual(mockQuery.filters, [
  ["status", "ativo"],
  ["eh_parceiro", true],
]);

console.log("publicCatalog.test.js: ok");
