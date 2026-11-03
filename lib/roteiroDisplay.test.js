import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { duracaoRoteiroLimpa, tituloDiaRoteiro } from "./roteiroDisplay.js";

describe("tituloDiaRoteiro", () => {
  it("remove o prefixo do dia", () => {
    assert.equal(tituloDiaRoteiro("Dia 1 — Praias e lagoas"), "Praias e lagoas");
  });

  it("não inventa título quando só existe o número", () => {
    assert.equal(tituloDiaRoteiro("Dia 2"), "");
  });
});

describe("duracaoRoteiroLimpa", () => {
  it("mantém a duração sugerida pela IA", () => {
    assert.equal(duracaoRoteiroLimpa("~2h"), "~2h");
  });
});
