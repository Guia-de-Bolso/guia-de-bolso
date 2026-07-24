import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHomeGreeting,
  getClimaHook,
  getSaudacaoPeriodo,
} from "./homeGreeting.js";

test("getSaudacaoPeriodo cobre manhã, tarde e noite", () => {
  assert.equal(getSaudacaoPeriodo(new Date(2026, 6, 24, 8)), "Boa manhã");
  assert.equal(getSaudacaoPeriodo(new Date(2026, 6, 24, 14)), "Boa tarde");
  assert.equal(getSaudacaoPeriodo(new Date(2026, 6, 24, 20)), "Boa noite");
});

test("getClimaHook retorna frases curtas por condição", () => {
  const tarde = new Date(2026, 6, 24, 15);
  assert.equal(getClimaHook("Ensolarado", 24, tarde), "Dia de sol");
  assert.equal(getClimaHook("Ensolarado", 31, tarde), "Sol e calorzinho");
  assert.equal(getClimaHook("Chuva", 20, tarde), "Dia de chuva");
  assert.equal(getClimaHook("Garoa", 19, tarde), "Garoa leve");
  assert.equal(getClimaHook("Nublado", 16, tarde), "Céu fechado e fresco");
  assert.equal(getClimaHook("", 24, tarde), null);
});

test("getClimaHook adapta ensolarado à noite", () => {
  const noite = new Date(2026, 6, 24, 21);
  assert.equal(getClimaHook("Ensolarado", 18, noite), "Céu limpo");
});

test("buildHomeGreeting monta saudação e linha de clima", () => {
  const date = new Date(2026, 6, 24, 15);
  assert.deepEqual(
    buildHomeGreeting({
      primeiroNome: "Bruno Disliler",
      condition: "Ensolarado",
      temperature: 24.4,
      date,
    }),
    {
      saudacao: "Boa tarde, Bruno",
      climaLinha: "Dia de sol · 24°",
    }
  );

  assert.deepEqual(
    buildHomeGreeting({ primeiroNome: null, condition: null, date }),
    { saudacao: "Boa tarde", climaLinha: null }
  );
});
