import assert from "node:assert/strict";
import {
  formatDiasOpcaoLabel,
  formatDiasViagem,
  parseDiasViagem,
  resolveDiasParaRoteiro,
  splitDiasFormState,
} from "./roteiroDias.js";

assert.equal(parseDiasViagem("1 dia"), 1);
assert.equal(parseDiasViagem("2 dias"), 2);
assert.equal(parseDiasViagem("4+ dias"), 4);
assert.equal(parseDiasViagem("6 dias"), 6);
assert.equal(parseDiasViagem(3), 3);
assert.equal(formatDiasViagem(1), "1 dia");
assert.equal(formatDiasViagem(4), "4 dias");
assert.equal(formatDiasViagem(6), "6 dias");
assert.equal(resolveDiasParaRoteiro("4+ dias", 6), "6 dias");
assert.equal(resolveDiasParaRoteiro("4+ dias", null), "");
assert.equal(resolveDiasParaRoteiro("2 dias", null), "2 dias");
assert.deepEqual(splitDiasFormState("6 dias"), { dias: "4+ dias", diasExatos: 6 });
assert.deepEqual(splitDiasFormState("2 dias"), { dias: "2 dias", diasExatos: null });
assert.equal(formatDiasOpcaoLabel(5), "5 dias");

console.log("roteiroDias.test.js: ok");
