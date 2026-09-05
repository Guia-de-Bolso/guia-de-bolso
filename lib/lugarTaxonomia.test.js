import assert from "node:assert/strict";
import {
  buildCategoriaMatchOrFilter,
  filterLugaresByCategoria,
  getCategoriaQuerySpec,
  getEffectiveCategoria,
  lugarMatchesCategoria,
  lugarMatchesCategoriaQuerySpec,
  normalizeLugarTaxonomia,
} from "./lugarTaxonomia.js";

const pubNatureza = {
  categoria: "Natureza",
  subcategoria: "Pubs",
  nome: "Empório Zimbeer",
};

assert.equal(getEffectiveCategoria(pubNatureza), "Noite");
assert.equal(filterLugaresByCategoria([pubNatureza], "Natureza").length, 0);
assert.equal(filterLugaresByCategoria([pubNatureza], "Noite").length, 1);
assert.equal(normalizeLugarTaxonomia(pubNatureza).categoria, "Noite");

const barGastronomia = { categoria: "Gastronomia", subcategoria: "Bares" };
assert.equal(getEffectiveCategoria(barGastronomia), "Gastronomia");

const emporioGourmet = { categoria: "Compras", subcategoria: "Empório Gourmet" };
assert.equal(getEffectiveCategoria(emporioGourmet), "Gastronomia");
assert.equal(normalizeLugarTaxonomia(emporioGourmet).categoria, "Gastronomia");

const cachoeiraCompras = { categoria: "Compras", subcategoria: "Cachoeiras" };
assert.equal(getEffectiveCategoria(cachoeiraCompras), "Natureza");
assert.equal(normalizeLugarTaxonomia(cachoeiraCompras).categoria, "Natureza");

const barNoite = { categoria: "Noite", subcategoria: "Bares" };
const praiaOk = { categoria: "Natureza", subcategoria: "Praias" };
const semSub = { categoria: "Natureza", subcategoria: null };

const fixtures = [
  pubNatureza,
  barGastronomia,
  barNoite,
  emporioGourmet,
  cachoeiraCompras,
  praiaOk,
  semSub,
];

for (const lugar of fixtures) {
  for (const categoria of ["Natureza", "Noite", "Gastronomia", "Cultura"]) {
    const spec = getCategoriaQuerySpec(categoria);
    assert.equal(
      lugarMatchesCategoriaQuerySpec(lugar, spec),
      lugarMatchesCategoria(lugar, categoria),
      `${lugar.subcategoria || "(sem sub)"} / ${lugar.categoria} vs ${categoria}`
    );
  }
}

const noiteFilter = buildCategoriaMatchOrFilter("Noite");
assert.ok(noiteFilter.includes('subcategoria.in.('));
assert.ok(noiteFilter.includes('"Pubs"'));
assert.ok(noiteFilter.includes("subcategoria.is.null"));
assert.ok(noiteFilter.includes('categoria.eq."Noite"'));

console.log("lugarTaxonomia.test.js: ok");
