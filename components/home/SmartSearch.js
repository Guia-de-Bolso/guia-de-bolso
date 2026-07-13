"use client";

import { memo, useCallback, useState } from "react";
import { HOME_CHIP_CLASS, HOME_SURFACE_CLASS } from "@/components/home/homeTokens";
import { QUICK_SEARCH_CHIPS } from "@/lib/homeContext";

function IconSend({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.4 20.4l17.45-7.17a1 1 0 000-1.83L3.4 4.6a1 1 0 00-1.28 1.28l3.07 7.12-3.07 7.12a1 1 0 001.28 1.28z" />
    </svg>
  );
}

function IconClose({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

function IconMic({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-5 9a7 7 0 01-7-7h2a5 5 0 0010 0h2a7 7 0 01-7 7z" />
    </svg>
  );
}

const QuickChip = memo(function QuickChip({ chip, onClick }) {
  return (
    <button type="button" onClick={() => onClick(chip)} className={HOME_CHIP_CLASS}>
      <span className="text-base leading-none" aria-hidden>
        {chip.emoji}
      </span>
      <span className="whitespace-nowrap">{chip.label}</span>
    </button>
  );
});

function SmartSearch({
  searchContainerRef,
  searchInputRef,
  termoBusca,
  searchMode,
  onSubmit,
  onFocus,
  onBlur,
  onChange,
  onClose,
  onChipClick,
  showChips = true,
  voiceListening = false,
  voicePreparing = false,
  voiceError = "",
  voiceHint = "",
  onVoiceToggle,
}) {
  const [focused, setFocused] = useState(false);

  const handleChip = useCallback((chip) => onChipClick(chip), [onChipClick]);

  const handleFocus = useCallback(
    (e) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  const hasQuery = termoBusca.trim().length > 0;
  const active = focused || searchMode;

  const showChipRow = showChips && !searchMode;

  const handleVoiceToggle = useCallback(
    (event) => {
      event.preventDefault();
      onVoiceToggle?.();
    },
    [onVoiceToggle]
  );

  const micActive = voiceListening || voicePreparing;

  return (
    <section className="home-smart-search-section relative mb-6 mt-1">
      <form ref={searchContainerRef} onSubmit={onSubmit}>
        <div
          className={`home-ai-search-surface ${HOME_SURFACE_CLASS} transition-shadow duration-300 ease-out ${
            active ? "home-ai-search-active" : "shadow-none ring-[#e8eeee]"
          }`}
        >
          <div className="home-ai-search-input-row flex items-center gap-3 px-4 py-3.5">
            <button
              type="button"
              onClick={handleVoiceToggle}
              aria-label={
                voiceListening
                  ? "Parar busca por voz"
                  : voicePreparing
                    ? "Cancelar abertura do microfone"
                    : "Buscar por voz"
              }
              aria-pressed={micActive}
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 ${
                voiceListening
                  ? "bg-[#c0392b] text-white shadow-[0_6px_20px_rgba(192,57,43,0.32)]"
                  : voicePreparing
                    ? "bg-[#d35400] text-white shadow-[0_6px_20px_rgba(211,84,0,0.28)]"
                    : active
                      ? "bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54] text-white shadow-[0_4px_14px_rgba(26,74,58,0.35)]"
                      : "bg-[#eef6f2] text-[#1a4a3a]"
              }`}
            >
              {voiceListening ? (
                <span
                  className="absolute inset-0 rounded-2xl bg-[#c0392b]/30 motion-safe:animate-ping"
                  aria-hidden
                />
              ) : null}
              <IconMic className="relative h-[18px] w-[18px]" />
            </button>

            <div className="relative min-w-0 flex-1">
              <label htmlFor="smart-search-input" className="sr-only">
                Busca inteligente com IA
              </label>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1a4a3a]/50">
                Pergunte à IA
              </p>
              <input
                id="smart-search-input"
                ref={searchInputRef}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={termoBusca}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={(e) => onChange(e.target.value)}
                placeholder="O que você quer descobrir hoje?"
                className={`mt-0.5 w-full appearance-none border-0 bg-transparent text-[16px] leading-snug text-[#1a2e28] shadow-none outline-none ring-0 placeholder:text-[#9aa8a3] focus:outline-none focus-visible:outline-none ${
                  searchMode ? "pr-8" : ""
                }`}
              />
              {searchMode && (
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[#5a6b66] transition-colors active:bg-[#eef3f1]"
                  aria-label="Fechar busca"
                >
                  <IconClose />
                </button>
              )}
            </div>

            <button
              type="submit"
              aria-label="Buscar"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 ${
                hasQuery || active
                  ? "bg-[#1a4a3a] text-white shadow-[0_6px_20px_rgba(26,74,58,0.32)]"
                  : "bg-[#e8f0ec] text-[#9aa8a3]"
              }`}
            >
              <IconSend className="h-[17px] w-[17px] -rotate-45" />
            </button>
          </div>

          {voiceHint && !voiceError ? (
            <p className="border-t border-[#eef2f0] px-4 py-2 text-center text-xs font-medium text-[#1a4a3a]">
              {voiceHint}
            </p>
          ) : null}

          {voiceError ? (
            <p className="border-t border-[#eef2f0] px-4 py-2 text-center text-xs text-[#c0392b]">
              {voiceError}
            </p>
          ) : null}

          {showChipRow && (
            <div className="home-ai-chips-wrap border-t border-[#eef2f0] px-4 pt-3 pb-4">
              <div className="home-ai-chips-row flex gap-2.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                {QUICK_SEARCH_CHIPS.map((chip) => (
                  <QuickChip key={chip.id} chip={chip} onClick={handleChip} />
                ))}
                <span className="w-5 shrink-0 snap-end" aria-hidden />
              </div>
            </div>
          )}
        </div>
      </form>
    </section>
  );
}

export default memo(SmartSearch);
