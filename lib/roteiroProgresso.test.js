import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  loadParadasConcluidas,
  paradaProgressoKey,
  roteiroProgressScope,
  toggleParadaConcluida,
} from "./roteiroProgresso.js";

/**
 * @returns {Storage}
 */
function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

describe("roteiroProgresso", () => {
  it("usa o id do roteiro salvo como escopo", () => {
    assert.equal(roteiroProgressScope("abc", "texto"), "id:abc");
    assert.match(roteiroProgressScope(null, "texto"), /^txt:/);
  });

  it("marca e desmarca a parada na sessão", () => {
    const storage = memoryStorage();
    const scope = "id:1";
    const key = paradaProgressoKey(1, 2);

    const marcadas = toggleParadaConcluida(scope, key, storage);
    assert.equal(marcadas.has(key), true);
    assert.equal(loadParadasConcluidas(scope, storage).has(key), true);

    const limpas = toggleParadaConcluida(scope, key, storage);
    assert.equal(limpas.has(key), false);
  });
});
