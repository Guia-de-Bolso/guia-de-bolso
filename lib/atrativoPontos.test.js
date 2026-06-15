import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assignPontoDetalhesOrdem, sortPontoDetalhes } from "./atrativoPontos.js";

describe("assignPontoDetalhesOrdem", () => {
  it("preserva texto com espaços à direita durante edição", () => {
    const result = assignPontoDetalhesOrdem([{ texto: "Olá ", ordem: 1 }]);
    assert.equal(result[0].texto, "Olá ");
  });

  it("mantém ordem do array após troca de posição", () => {
    const swapped = [
      { texto: "Segundo", ordem: 2 },
      { texto: "Primeiro", ordem: 1 },
    ];
    const result = assignPontoDetalhesOrdem(swapped);
    assert.deepEqual(
      result.map((item) => item.texto),
      ["Segundo", "Primeiro"]
    );
    assert.deepEqual(
      result.map((item) => item.ordem),
      [1, 2]
    );
  });
});

describe("sortPontoDetalhes", () => {
  it("ordena por ordem e remove linhas vazias ao salvar", () => {
    const result = sortPontoDetalhes([
      { texto: "  B  ", ordem: 2 },
      { texto: "", ordem: 1 },
      { texto: "A", ordem: 1 },
    ]);
    assert.deepEqual(result, [
      { texto: "A", ordem: 1 },
      { texto: "B", ordem: 2 },
    ]);
  });
});
