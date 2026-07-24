import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearPercursoProgresso,
  getPercursoPercentual,
  getPercursoProgressoStorageKey,
  getProximoPontoIndex,
  normalizeCompletedIds,
  togglePontoConcluido,
} from "./atrativoPercursoProgresso.js";
import {
  getPercursoPinPositions,
  getTrailPathD,
  sampleTrailAt,
} from "./atrativoMapaLayout.js";

describe("atrativoPercursoProgresso", () => {
  it("monta chave de storage estável", () => {
    assert.equal(getPercursoProgressoStorageKey("abc"), "guia_atrativo_percurso_abc");
  });

  it("normaliza IDs concluídos", () => {
    assert.deepEqual(normalizeCompletedIds(["a", "a", "", null, "b"]), ["a", "b"]);
    assert.deepEqual(normalizeCompletedIds("x"), []);
  });

  it("alterna conclusão de ponto", () => {
    assert.deepEqual(togglePontoConcluido([], "p1", true), ["p1"]);
    assert.deepEqual(togglePontoConcluido(["p1", "p2"], "p1", false), ["p2"]);
  });

  it("calcula próximo índice e percentual", () => {
    const pontos = [{ id: "1" }, { id: "2" }, { id: "3" }];
    assert.equal(getProximoPontoIndex(pontos, ["1"]), 1);
    assert.equal(getProximoPontoIndex(pontos, ["1", "2", "3"]), 2);
    assert.equal(getPercursoPercentual(1, 4), 25);
    assert.equal(getPercursoPercentual(0, 0), 0);
  });

  it("clearPercursoProgresso não lança sem window", () => {
    assert.doesNotThrow(() => clearPercursoProgresso("x"));
  });
});

describe("atrativoMapaLayout", () => {
  it("amostra extremos da trilha", () => {
    const start = sampleTrailAt(0);
    const end = sampleTrailAt(1);
    assert.equal(start.x, 28);
    assert.equal(start.y, 172);
    assert.ok(Math.abs(end.x - 308) < 0.001);
    assert.ok(Math.abs(end.y - 48) < 0.001);
  });

  it("espalha pins sem colisão de ordem", () => {
    const pins = getPercursoPinPositions(5);
    assert.equal(pins.length, 5);
    assert.deepEqual(
      pins.map((p) => p.ordem),
      [1, 2, 3, 4, 5]
    );
    assert.ok(pins[0].x < pins[4].x);
  });

  it("gera path SVG não vazio", () => {
    const d = getTrailPathD();
    assert.match(d, /^M /);
    assert.ok(d.includes(" L "));
  });
});
