import assert from "node:assert/strict";
import { buildExplorarCountsFromLugares } from "./explorarCountsFromLugares.js";

const snapshot = buildExplorarCountsFromLugares([
  { categoria: "Natureza", subcategoria: "Praias", imagem_url: "https://a.test/1.jpg" },
  { categoria: "Natureza", subcategoria: "Pubs", imagem_url: "https://a.test/2.jpg" },
  { categoria: "Aventura", subcategoria: "Esportes radicais" },
  { categoria: "Hospedagem", subcategoria: "Pousadas" },
  { categoria: "CategoriaInexistente", subcategoria: null },
]);

assert.equal(snapshot.counts.Natureza, 1);
assert.equal(snapshot.counts.Noite, 1);
assert.equal(snapshot.counts.Aventura, 1);
assert.equal(snapshot.counts.Hospedagem, undefined);
assert.equal(snapshot.counts.CategoriaInexistente, undefined);
assert.equal(snapshot.totalLugares, 3);
assert.equal(snapshot.categoriasComLugares, 3);
assert.equal(snapshot.capas.Natureza, "https://a.test/1.jpg");
assert.ok(snapshot.destaques.length <= 3);
assert.ok(snapshot.categorias.includes("Aventura"));
assert.ok(!snapshot.categorias.includes("Hospedagem"));

console.log("explorarCategoryCounts.test.js: ok");
