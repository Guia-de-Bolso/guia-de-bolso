"use client";

import { useBottomSheetBodyLock } from "@/hooks/useBottomSheetBodyLock";

const SHEET_ENTER_KEYFRAMES = `
  @keyframes bottomSheetShellIn {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`;

/**
 * Shell padrão para bottom sheets — largura limitada, sem overflow horizontal no WebView.
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {import("react").ReactNode} props.children
 * @param {import("react").ReactNode} [props.footer]
 * @param {string} [props.ariaLabelledBy]
 * @param {number} [props.zIndex=50]
 * @param {string} [props.maxHeight="90vh"]
 * @param {import("react").RefObject<HTMLDivElement|null>} [props.sheetRef]
 * @param {import("react").RefObject<HTMLDivElement|null>} [props.scrollRef]
 * @param {import("react").CSSProperties} [props.sheetStyle]
 * @param {string} [props.sheetClassName]
 * @param {boolean} [props.dragHandle=true]
 * @param {boolean} [props.enterAnimation=true]
 * @param {boolean} [props.isDragging=false]
 * @param {number} [props.dragY=0]
 * @returns {import("react").ReactElement|null}
 */
export default function BottomSheetShell({
  isOpen,
  onClose,
  children,
  footer,
  ariaLabelledBy,
  zIndex = 50,
  maxHeight = "90vh",
  sheetRef,
  scrollRef,
  sheetStyle = {},
  sheetClassName = "",
  dragHandle = true,
  enterAnimation = true,
  isDragging = false,
  dragY = 0,
}) {
  useBottomSheetBodyLock(isOpen, onClose);

  if (!isOpen) return null;

  const motionStyle =
    enterAnimation && !isDragging && dragY === 0
      ? {
          animation: "bottomSheetShellIn 260ms ease-out forwards",
          ...sheetStyle,
        }
      : sheetStyle;

  const body = scrollRef ? (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y"
    >
      {children}
    </div>
  ) : (
    children
  );

  return (
    <div
      className="fixed inset-0 flex items-end justify-center overflow-x-hidden bg-black/55 backdrop-blur-sm"
      style={{ zIndex }}
      onClick={onClose}
    >
      <style>{SHEET_ENTER_KEYFRAMES}</style>

      <div
        ref={sheetRef}
        className={`flex w-full min-w-0 max-w-md flex-col rounded-t-[24px] bg-white shadow-2xl ${sheetClassName}`}
        style={{ maxHeight, ...motionStyle }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
      >
        {dragHandle ? (
          <div
            data-drag-handle="true"
            className="flex shrink-0 cursor-grab flex-col items-center px-5 pt-2 active:cursor-grabbing"
            aria-hidden
          >
            <span className="h-1.5 w-12 rounded-full bg-[#d8dfdc]" />
            <span className="mt-2 h-4 w-full max-w-[120px] rounded-full bg-transparent" />
          </div>
        ) : null}

        {body}
        {footer}
      </div>
    </div>
  );
}
