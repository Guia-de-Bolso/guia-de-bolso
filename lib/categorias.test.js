import assert from "node:assert/strict";
import {
  CATEGORIAS_REMOVIDAS,
  getCategoriaByNome,
  getCategoriasVisiveis,
  isCategoriaOculta,
} from "./categorias.js";

assert.ok(isCategoriaOculta("Hospedagem"));
assert.ok(isCategoriaOculta("Compras"));
assert.equal(getCategoriaByNome("Hospedagem"), undefined);
assert.equal(getCategoriaByNome("Compras"), undefined);
assert.ok(!getCategoriasVisiveis().some((item) => item.nome === "Hospedagem"));
assert.ok(!getCategoriasVisiveis().some((item) => item.nome === "Compras"));
assert.ok(getCategoriasVisiveis().every((item) => !CATEGORIAS_REMOVIDAS.has(item.nome)));
assert.ok(getCategoriasVisiveis().some((item) => item.nome === "Gastronomia"));
assert.equal(getCategoriasVisiveis().length, 7);

console.log("categorias.test.js: ok");
