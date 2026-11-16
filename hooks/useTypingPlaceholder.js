"use client";

import { useEffect, useState } from "react";
import {
  SEARCH_TYPING_PHRASES,
  createTypingPlaceholderState,
  stepTypingPlaceholder,
} from "@/lib/typingPlaceholder";

const IDLE = Object.freeze({ animating: false, text: "" });

/**
 * Varia um pouco a pausa entre teclas para parecer digitação, sem alongar a frase.
 * @param {number} delay
 * @param {string} phase
 */
function delayFor(delay, phase) {
  if (phase !== "type") return delay;
  const delta = Math.round((Math.random() - 0.5) * 24);
  return Math.max(28, delay + delta);
}

/**
 * Placeholder animado enquanto a busca está ociosa.
 * Com `prefers-reduced-motion`, devolve o estado ocioso (o campo usa o texto fixo).
 *
 * @param {boolean} enabled
 * @returns {{ animating: boolean, text: string }}
 */
export function useTypingPlaceholder(enabled) {
  const [snapshot, setSnapshot] = useState(IDLE);

  useEffect(() => {
    if (!enabled) return undefined;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return undefined;

    let state = createTypingPlaceholderState();
    let timer = 0;
    let stopped = false;

    const clear = () => window.clearTimeout(timer);

    const tick = () => {
      if (stopped || document.hidden) return;
      const next = stepTypingPlaceholder(state, SEARCH_TYPING_PHRASES);
      state = next.state;
      setSnapshot({ animating: true, text: next.text });
      timer = window.setTimeout(tick, delayFor(next.delay, next.state.phase));
    };

    const onVisibility = () => {
      clear();
      if (!document.hidden) tick();
    };

    const first = stepTypingPlaceholder(state, SEARCH_TYPING_PHRASES);
    state = first.state;
    setSnapshot({ animating: true, text: first.text });
    timer = window.setTimeout(tick, delayFor(first.delay, first.state.phase));
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      clear();
      document.removeEventListener("visibilitychange", onVisibility);
      setSnapshot(IDLE);
    };
  }, [enabled]);

  return enabled ? snapshot : IDLE;
}
