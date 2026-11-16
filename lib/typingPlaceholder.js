/**
 * Máquina de estados do placeholder que simula alguém digitando na busca.
 * @module lib/typingPlaceholder
 */

/** Exemplos curtos, no tom de uma busca real no Guia. */
export const SEARCH_TYPING_PHRASES = Object.freeze([
  "praia calma para hoje",
  "onde ver o pôr do sol",
  "trilha rápida perto",
  "restaurante à beira-mar",
  "lugar aberto agora",
  "o que fazer com chuva",
]);

/** Ritmo próximo da barra da Decathlon: digita, segura, apaga, troca. */
export const TYPING_PLACEHOLDER_TIMING = Object.freeze({
  typeMs: 52,
  deleteMs: 30,
  holdMs: 2200,
  gapMs: 360,
});

/**
 * @typedef {"type"|"hold"|"delete"|"gap"} TypingPlaceholderPhase
 * @typedef {{ phraseIndex: number, length: number, phase: TypingPlaceholderPhase }} TypingPlaceholderState
 * @typedef {{ typeMs: number, deleteMs: number, holdMs: number, gapMs: number }} TypingPlaceholderTiming
 */

/** Estado inicial: primeira frase, ainda sem caracteres visíveis. */
export function createTypingPlaceholderState() {
  return { phraseIndex: 0, length: 0, phase: "type" };
}

/**
 * Frases utilizáveis, na ordem original.
 * @param {readonly string[]} phrases
 * @returns {string[]}
 */
function usablePhrases(phrases) {
  if (!Array.isArray(phrases)) return [];
  return phrases.filter((item) => typeof item === "string" && item.trim().length > 0);
}

/**
 * Avança um passo da animação.
 * O texto visível inclui aspas, como um exemplo de busca sendo digitado.
 *
 * @param {TypingPlaceholderState} state
 * @param {readonly string[]} phrases
 * @param {TypingPlaceholderTiming} [timing]
 * @returns {{ state: TypingPlaceholderState, delay: number, text: string }}
 */
export function stepTypingPlaceholder(state, phrases, timing = TYPING_PLACEHOLDER_TIMING) {
  const list = usablePhrases(phrases);
  if (list.length === 0) {
    return {
      state: { phraseIndex: 0, length: 0, phase: "gap" },
      delay: timing.gapMs,
      text: "",
    };
  }

  const index = ((state.phraseIndex % list.length) + list.length) % list.length;
  const full = `"${list[index]}"`;
  const phase = state.phase;

  if (phase === "gap") {
    return {
      state: { phraseIndex: index, length: 1, phase: "type" },
      delay: timing.typeMs,
      text: full.slice(0, 1),
    };
  }

  if (phase === "hold") {
    const nextLength = Math.max(0, full.length - 1);
    if (nextLength === 0) {
      return {
        state: { phraseIndex: (index + 1) % list.length, length: 0, phase: "gap" },
        delay: timing.gapMs,
        text: "",
      };
    }
    return {
      state: { phraseIndex: index, length: nextLength, phase: "delete" },
      delay: timing.deleteMs,
      text: full.slice(0, nextLength),
    };
  }

  if (phase === "delete") {
    const nextLength = Math.max(0, state.length - 1);
    if (nextLength === 0) {
      return {
        state: { phraseIndex: (index + 1) % list.length, length: 0, phase: "gap" },
        delay: timing.gapMs,
        text: "",
      };
    }
    return {
      state: { phraseIndex: index, length: nextLength, phase: "delete" },
      delay: timing.deleteMs,
      text: full.slice(0, nextLength),
    };
  }

  const nextLength = Math.min(full.length, state.length + 1);
  const done = nextLength >= full.length;
  return {
    state: {
      phraseIndex: index,
      length: nextLength,
      phase: done ? "hold" : "type",
    },
    delay: done ? timing.holdMs : timing.typeMs,
    text: full.slice(0, nextLength),
  };
}
