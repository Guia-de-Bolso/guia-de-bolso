"use client";

import PerfilBottomSheet from "@/components/perfil/PerfilBottomSheet";
import { NAV_APPS } from "@/lib/perfil";

/**
 * Sheet para escolher app de navegação preferido.
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} props.selected
 * @param {(key: string) => void} props.onSelect
 * @returns {import("react").JSX.Element}
 */
export default function PerfilNavAppSheet({ isOpen, onClose, selected, onSelect }) {
  return (
    <PerfilBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="App de navegação preferido"
    >
      <p className="mb-4 text-sm text-[#5a6b66]">
        Usado no botão IR AGORA nos lugares e roteiros.
      </p>
      <div className="grid gap-2">
        {NAV_APPS.map((app) => {
          const isSelected = app.key === selected;
          return (
            <button
              key={app.key}
              type="button"
              onClick={() => onSelect(app.key)}
              className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-left transition ${
                isSelected
                  ? "bg-[#d4ede8] ring-2 ring-[#1a4a3a]/30"
                  : "bg-[#f0f4f3] hover:bg-[#e8eeee]"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-xl" aria-hidden>
                  {app.emoji}
                </span>
                <span className="font-semibold text-[#1a2e28]">{app.label}</span>
              </span>
              {isSelected && (
                <span className="text-lg font-bold text-[#1a4a3a]" aria-hidden>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </PerfilBottomSheet>
  );
}
