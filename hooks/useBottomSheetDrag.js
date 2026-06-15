"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const BOTTOM_SHEET_DRAG_CLOSE_PX = 110;
export const BOTTOM_SHEET_DRAG_MAX_PX = 260;
const INTERACTIVE_DRAG_BLOCK_SELECTOR =
  "button, a, input, textarea, select, label, [role='button'], [data-sheet-action]";

/**
 * @param {EventTarget|null} target
 * @returns {boolean}
 */
function isInteractiveDragTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(INTERACTIVE_DRAG_BLOCK_SELECTOR));
}

/**
 * Gestos de arrastar para baixo para fechar bottom sheets no mobile.
 * @param {object} options
 * @param {boolean} options.isOpen
 * @param {() => void} options.onClose
 * @param {boolean} [options.handleOnly=false] - Só arrasta pelo handle (evita conflito com scroll).
 * @returns {{
 *   sheetRef: import("react").RefObject<HTMLDivElement|null>,
 *   scrollAreaRef: import("react").RefObject<HTMLDivElement|null>,
 *   dragY: number,
 *   isDragging: boolean,
 *   sheetMotionStyle: import("react").CSSProperties,
 * }}
 */
export function useBottomSheetDrag({ isOpen, onClose, handleOnly = false }) {
  const sheetRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const dragStartYRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragYRef = useRef(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const resetDrag = useCallback(() => {
    dragYRef.current = 0;
    dragStartYRef.current = null;
    isDraggingRef.current = false;
    setDragY(0);
    setIsDragging(false);
  }, []);

  const finishDrag = useCallback(() => {
    if (!isDraggingRef.current) return;

    const shouldClose = dragYRef.current >= BOTTOM_SHEET_DRAG_CLOSE_PX;
    isDraggingRef.current = false;
    dragStartYRef.current = null;
    setIsDragging(false);

    if (shouldClose) {
      resetDrag();
      onClose();
      return;
    }

    dragYRef.current = 0;
    setDragY(0);
  }, [onClose, resetDrag]);

  useEffect(() => {
    if (!isOpen) resetDrag();
  }, [isOpen, resetDrag]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!isOpen || !sheet) return undefined;

    function canStartDrag(target) {
      if (!(target instanceof Element)) return false;
      if (isInteractiveDragTarget(target)) return false;

      const scrollTop = scrollAreaRef.current?.scrollTop ?? 0;
      const onHandle = Boolean(target.closest("[data-drag-handle='true']"));
      const inScroll = Boolean(scrollAreaRef.current?.contains(target));

      if (handleOnly) return onHandle;
      if (onHandle) return true;
      if (inScroll && scrollTop > 4) return false;
      return true;
    }

    function handleTouchStart(event) {
      if (event.touches.length !== 1) return;
      if (!canStartDrag(event.target)) return;

      dragStartYRef.current = event.touches[0].clientY;
      isDraggingRef.current = true;
      setIsDragging(true);
    }

    function handleTouchMove(event) {
      if (!isDraggingRef.current || dragStartYRef.current === null) return;

      const deltaY = event.touches[0].clientY - dragStartYRef.current;
      const nextDragY = Math.max(0, Math.min(BOTTOM_SHEET_DRAG_MAX_PX, deltaY));

      if (nextDragY > 0) {
        event.preventDefault();
      }

      dragYRef.current = nextDragY;
      setDragY(nextDragY);
    }

    sheet.addEventListener("touchstart", handleTouchStart, { passive: true });
    sheet.addEventListener("touchmove", handleTouchMove, { passive: false });
    sheet.addEventListener("touchend", finishDrag, { passive: true });
    sheet.addEventListener("touchcancel", finishDrag, { passive: true });

    return () => {
      sheet.removeEventListener("touchstart", handleTouchStart);
      sheet.removeEventListener("touchmove", handleTouchMove);
      sheet.removeEventListener("touchend", finishDrag);
      sheet.removeEventListener("touchcancel", finishDrag);
    };
  }, [isOpen, finishDrag, handleOnly]);

  const sheetMotionStyle =
    dragY > 0
      ? {
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? "none" : "transform 180ms ease-out",
        }
      : {
          transition: isDragging ? "none" : "transform 180ms ease-out",
        };

  return {
    sheetRef,
    scrollAreaRef,
    dragY,
    isDragging,
    sheetMotionStyle,
  };
}
