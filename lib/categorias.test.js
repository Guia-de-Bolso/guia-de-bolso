import assert from "node:assert/strict";
import {
  CATEGORIAS_OCULTAS,
  getCategoriaByNome,
  getCategoriasVisiveis,
  isCategoriaOculta,
} from "./categorias.js";

assert.ok(isCategoriaOculta("Hospedagem"));
assert.equal(getCategoriaByNome("Hospedagem"), undefined);
assert.ok(getCategoriasVisiveis().every((item) => !CATEGORIAS_OCULTAS.has(item.nome)));
assert.ok(getCategoriasVisiveis().some((item) => item.nome === "Gastronomia"));

console.log("categorias.test.js: ok");
