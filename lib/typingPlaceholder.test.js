import assert from "node:assert/strict";
import test from "node:test";
import {
  createTypingPlaceholderState,
  stepTypingPlaceholder,
} from "./typingPlaceholder.js";

const timing = { typeMs: 10, deleteMs: 5, holdMs: 100, gapMs: 20 };

function runSteps(phrases, count, start = createTypingPlaceholderState()) {
  const frames = [];
  let state = start;
  for (let i = 0; i < count; i += 1) {
    const next = stepTypingPlaceholder(state, phrases, timing);
    frames.push(next);
    state = next.state;
  }
  return frames;
}

test("digita a frase entre aspas, segura e apaga até a próxima", () => {
  const frames = runSteps(["sol", "mar"], 12);
  assert.deepEqual(
    frames.map((frame) => frame.text),
    ['"', '"s', '"so', '"sol', '"sol"', '"sol', '"so', '"s', '"', "", '"', '"m']
  );
  assert.equal(frames[4].delay, timing.holdMs);
  assert.equal(frames[4].state.phase, "hold");
  assert.equal(frames[9].delay, timing.gapMs);
  assert.equal(frames[9].state.phraseIndex, 1);
  assert.equal(frames[10].delay, timing.typeMs);
});

test("volta para a primeira frase depois da última", () => {
  const frames = runSteps(["a"], 8);
  assert.deepEqual(
    frames.map((frame) => frame.text),
    ['"', '"a', '"a"', '"a', '"', "", '"', '"a']
  );
  assert.equal(frames[5].state.phraseIndex, 0);
  assert.equal(frames[5].state.phase, "gap");
});

test("ignora frases vazias e lista inválida", () => {
  const blank = stepTypingPlaceholder(createTypingPlaceholderState(), ["", "  "], timing);
  assert.equal(blank.text, "");
  assert.equal(blank.state.phase, "gap");

  const invalid = stepTypingPlaceholder(createTypingPlaceholderState(), null, timing);
  assert.equal(invalid.text, "");
});
