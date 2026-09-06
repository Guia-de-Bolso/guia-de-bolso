import assert from "node:assert/strict";
import test from "node:test";
import {
  listCategoriasAtrativoEmUso,
  normalizeCategoriaAtrativo,
} from "./atrativos.js";

test("listCategoriasAtrativoEmUso ignora tipos sem roteiro", () => {
  const presentes = listCategoriasAtrativoEmUso([
    { categoria: "Trilha" },
    { categoria: "Roteiro de praias" },
    { categoria: "Mirantes e panorâmicos" },
  ]);
  assert.deepEqual(
    presentes.map((item) => item.nome),
    ["Trilha", "Roteiro de praias", "Mirantes e panorâmicos"]
  );
  assert.equal(
    presentes.some((item) => item.nome === "Gastronômico"),
    false
  );
});

test("normalizeCategoriaAtrativo", () => {
  assert.equal(normalizeCategoriaAtrativo("trilha"), "Trilha");
  assert.equal(normalizeCategoriaAtrativo(""), "Trilha");
});
