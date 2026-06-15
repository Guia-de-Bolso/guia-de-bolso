"use client";

import { useId } from "react";
import BottomSheetShell from "@/components/BottomSheetShell";

/**
 * Bottom sheet reutilizável (horários, etc.).
 * @param {{ isOpen: boolean, onClose: () => void, title: string, children: import("react").ReactNode }} props
 * @returns {import("react").ReactElement|null}
 */
export default function LugarBottomSheet({ isOpen, onClose, title, children }) {
  const titleId = useId();

  return (
    <BottomSheetShell
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy={titleId}
      maxHeight="min(90vh, 640px)"
    >
      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <h2 id={titleId} className="mb-4 text-lg font-bold text-[#1a2e28]">
          {title}
        </h2>
        {children}
      </div>
    </BottomSheetShell>
  );
}
