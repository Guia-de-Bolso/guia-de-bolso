import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { descreverDeslocamento } from "./roteiroDeslocamento.js";

describe("descreverDeslocamento", () => {
  it("não inventa distância sem coordenadas", () => {
    assert.equal(descreverDeslocamento(null, { latitude: -28.2, longitude: -48.6 }), null);
  });

  it("descreve cerca de 1 km entre dois pontos", () => {
    const texto = descreverDeslocamento(
      { latitude: -28.24, longitude: -48.67 },
      { latitude: -28.25, longitude: -48.67 }
    );
    assert.match(texto, /km em linha reta até a próxima/);
  });

  it("ignora o mesmo ponto", () => {
    const ponto = { latitude: -28.24, longitude: -48.67 };
    assert.equal(descreverDeslocamento(ponto, ponto), null);
  });
});
