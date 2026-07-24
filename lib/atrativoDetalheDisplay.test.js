import assert from "node:assert/strict";
import test from "node:test";
import {
  formatAtrativoDuracao,
  sanitizeCardDescription,
} from "./atrativoDetalheDisplay.js";

test("formatAtrativoDuracao usa min sem ambiguidade", () => {
  assert.equal(formatAtrativoDuracao({ duracao_minutos: 30 }), "30 min");
  assert.equal(formatAtrativoDuracao({ duracao_minutos: 60 }), "1h");
  assert.equal(formatAtrativoDuracao({ duracao_minutos: 90 }), "1h 30 min");
  assert.equal(formatAtrativoDuracao({}), "—");
});

test("sanitizeCardDescription remove pontuação solta no fim", () => {
  assert.equal(
    sanitizeCardDescription("Praia d'Água,  "),
    "Praia d'Água"
  );
  assert.equal(sanitizeCardDescription("Texto limpo."), "Texto limpo");
  assert.equal(sanitizeCardDescription("  uma   frase  "), "uma frase");
  assert.equal(sanitizeCardDescription(null), "");
});
