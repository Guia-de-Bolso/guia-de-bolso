import assert from "node:assert/strict";
import { splitProseParagraphs } from "./proseParagraphs.js";

assert.deepEqual(splitProseParagraphs(""), []);
assert.deepEqual(splitProseParagraphs("   "), []);
assert.deepEqual(splitProseParagraphs(null), []);

assert.deepEqual(splitProseParagraphs("Um só bloco."), ["Um só bloco."]);

assert.deepEqual(
  splitProseParagraphs("Primeiro.\n\nSegundo."),
  ["Primeiro.", "Segundo."]
);

assert.deepEqual(
  splitProseParagraphs("Primeiro.\n  \nSegundo.\r\n\r\nTerceiro."),
  ["Primeiro.", "Segundo.", "Terceiro."]
);

assert.deepEqual(
  splitProseParagraphs("Linha um.\nLinha dois ainda no mesmo parágrafo."),
  ["Linha um.\nLinha dois ainda no mesmo parágrafo."]
);
