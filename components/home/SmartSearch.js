"use client";

import { memo, useCallback, useState } from "react";
import { HOME_CHIP_CLASS, HOME_SURFACE_CLASS } from "@/components/home/homeTokens";
import { QUICK_SEARCH_CHIPS } from "@/lib/homeContext";

function IconSparkle({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.2 4.2L17.4 7.4 13.2 8.6 12 12.8 10.8 8.6 6.6 7.4 10.8 4.2 12 2zm7 9l.9 3.1 3.1.9-3.1.9-.9 3.1-.9-3.1-3.1-.9 3.1-.9.9-3.1zm-14 0l.7 2.4 2.4.7-2.4.7-.7 2.4-.7-2.4-2.4-.7 2.4-.7.7-2.4z" />
    </svg>
  );
}

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

  return (
    <section className="home-smart-search-section relative mb-6 mt-1">
      <form ref={searchContainerRef} onSubmit={onSubmit}>
        <div
          className={`home-ai-search-surface ${HOME_SURFACE_CLASS} transition-shadow duration-300 ease-out ${
            active ? "home-ai-search-active" : "shadow-none ring-[#e8eeee]"
          }`}
        >
          <div className="home-ai-search-input-row flex items-center gap-3 px-4 py-3.5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${
                active
                  ? "bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54] text-white shadow-[0_4px_14px_rgba(26,74,58,0.35)]"
                  : "bg-[#eef6f2] text-[#1a4a3a]"
              }`}
            >
              <IconSparkle className="h-[18px] w-[18px]" />
            </div>

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
