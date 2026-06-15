import { Capacitor } from "@capacitor/core";

/** Fallback quando env(safe-area-inset-*) retorna 0 no WebView Android. */
const ANDROID_FALLBACK_TOP_PX = 32;
const ANDROID_FALLBACK_BOTTOM_PX = 20;

/**
 * Mede um inset CSS env() via elemento probe.
 * @param {"safe-area-inset-top"|"safe-area-inset-bottom"} envName
 * @returns {number}
 */
function measureEnvInset(envName) {
  if (typeof document === "undefined") return 0;

  const probe = document.createElement("div");
  const edge = envName.endsWith("top") ? "paddingTop" : "paddingBottom";
  probe.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;${edge}:env(${envName});`;
  document.body.appendChild(probe);
  const value = parseFloat(getComputedStyle(probe)[edge]) || 0;
  probe.remove();
  return value;
}

/**
 * Define --app-safe-top/bottom para padding e sticky no app Capacitor.
 */
export function initNativeSafeAreaInsets() {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const measuredTop = measureEnvInset("safe-area-inset-top");
  const measuredBottom = measureEnvInset("safe-area-inset-bottom");
  const isAndroidNative =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

  const topPx = measuredTop > 0 ? measuredTop : isAndroidNative ? ANDROID_FALLBACK_TOP_PX : 0;
  const bottomPx =
    measuredBottom > 0 ? measuredBottom : isAndroidNative ? ANDROID_FALLBACK_BOTTOM_PX : 0;

  root.style.setProperty("--app-safe-top", `${topPx}px`);
  root.style.setProperty("--app-safe-bottom", `${bottomPx}px`);
}
