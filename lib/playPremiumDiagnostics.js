"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { MIN_NATIVE_BILLING_VERSION } from "@/lib/playPremiumConfig";

const NATIVE_PURCHASES_PLUGIN = "NativePurchases";

/**
 * @param {string} left
 * @param {string} right
 * @returns {number} 1 se left > right, -1 se left < right, 0 se igual
 */
export function compareAppVersions(left, right) {
  const parse = (value) =>
    String(value ?? "")
      .trim()
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);

  const a = parse(left);
  const b = parse(right);
  const length = Math.max(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }

  return 0;
}

/**
 * @returns {Promise<{ version: string|null, build: string|null }>}
 */
export async function getNativeAppVersionInfo() {
  if (!Capacitor.isNativePlatform()) {
    return { version: null, build: null };
  }

  try {
    const info = await App.getInfo();
    return {
      version: info.version ?? null,
      build: info.build ?? null,
    };
  } catch {
    return { version: null, build: null };
  }
}

/**
 * Mensagem específica quando billing nativo não está pronto no dispositivo.
 * @returns {Promise<string|null>} null se parece OK para tentar compra
 */
export async function getPlayBillingBlockerMessage() {
  if (Capacitor.getPlatform() !== "android") return null;

  const pluginAvailable = Capacitor.isPluginAvailable(NATIVE_PURCHASES_PLUGIN);
  const { version, build } = await getNativeAppVersionInfo();
  const versionLabel = version ? `v${version}` : "versão desconhecida";
  const buildLabel = build ? ` (build ${build})` : "";

  if (!pluginAvailable) {
    return (
      `Seu app instalado está na ${versionLabel}${buildLabel} e ainda não inclui pagamentos pela Play Store. ` +
      `Abra o link de Internal testing, atualize para ${MIN_NATIVE_BILLING_VERSION} ou superior e abra pelo ícone da Play — não use o navegador.`
    );
  }

  if (version && compareAppVersions(version, MIN_NATIVE_BILLING_VERSION) < 0) {
    return (
      `Seu app está na ${versionLabel}${buildLabel}. Atualize para ${MIN_NATIVE_BILLING_VERSION} ou superior pelo link de teste da Play Store.`
    );
  }

  return null;
}

/**
 * @returns {Promise<boolean>}
 */
export function isNativePurchasesPluginAvailable() {
  return Capacitor.isPluginAvailable(NATIVE_PURCHASES_PLUGIN);
}
