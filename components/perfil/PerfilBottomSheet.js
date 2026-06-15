"use client";

import { useId } from "react";
import BottomSheetShell from "@/components/BottomSheetShell";
import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";

/**
 * Bottom sheet reutilizável na área de perfil (arrastar, overlay e Escape).
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} props.title
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").JSX.Element|null}
 */
export default function PerfilBottomSheet({ isOpen, onClose, title, children }) {
  const titleId = useId();
  const { sheetRef, scrollAreaRef, dragY, isDragging, sheetMotionStyle } = useBottomSheetDrag({
    isOpen,
    onClose,
  });

  return (
    <BottomSheetShell
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy={titleId}
      sheetRef={sheetRef}
      scrollRef={scrollAreaRef}
      sheetStyle={sheetMotionStyle}
      isDragging={isDragging}
      dragY={dragY}
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
