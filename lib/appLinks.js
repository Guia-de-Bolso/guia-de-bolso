import { SITE_DOMAIN } from "./siteContact.js";
import { isPublicMarketingPath } from "./marketingHost.js";

/** Package Android (Capacitor). */
export const ANDROID_APP_PACKAGE = "app.guiadebolso";

/** Team ID Apple Developer. */
export const IOS_TEAM_ID = "V4FTHNLS6A";

/** Bundle ID iOS (= ANDROID_APP_PACKAGE). */
export const IOS_BUNDLE_ID = ANDROID_APP_PACKAGE;

/**
 * SHA-256 do certificado de assinatura (upload/release).
 * Para instalações via Play Store, adicione também o fingerprint da
 * "App signing key" na Play Console via ANDROID_APP_LINK_SHA256_EXTRA.
 */
export const ANDROID_RELEASE_SHA256 =
  "7B:6D:FF:3E:A7:F2:C4:66:3B:29:FA:B2:DB:86:BB:A3:8F:72:C2:CE:16:36:A1:98:1C:4F:CB:21:70:A7:E1:3D";

/** Hosts HTTPS aceitos em universal/app links. */
export const APP_LINK_HOSTS = new Set([
  SITE_DOMAIN,
  `www.${SITE_DOMAIN}`,
  "app.guiadebolso.app",
]);

/**
 * @returns {string[]}
 */
export function getAndroidAppLinkFingerprints() {
  const fingerprints = [ANDROID_RELEASE_SHA256];
  const extra = process.env.ANDROID_APP_LINK_SHA256_EXTRA?.trim();
  if (extra) {
    for (const part of extra.split(",")) {
      const value = part.trim();
      if (value && !fingerprints.includes(value)) {
        fingerprints.push(value);
      }
    }
  }
  return fingerprints;
}

/**
 * Paths publicados no apple-app-site-association / App Links.
 * @returns {string[]}
 */
export function getAppLinkAasaPaths() {
  return [
    "/lugares/*",
    "/atrativos/*",
    "/categoria/*",
    "/guia/*",
    "/baixar",
    "/baixar/*",
  ];
}

/**
 * @returns {object}
 */
export function buildAssetLinksJson() {
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_APP_PACKAGE,
        sha256_cert_fingerprints: getAndroidAppLinkFingerprints(),
      },
    },
  ];
}

/**
 * @returns {object}
 */
export function buildAppleAppSiteAssociation() {
  return {
    applinks: {
      apps: [],
      details: [
        {
          appID: `${IOS_TEAM_ID}.${IOS_BUNDLE_ID}`,
          paths: getAppLinkAasaPaths(),
        },
      ],
    },
  };
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
export function isAppLinkInAppPath(pathname) {
  const path = String(pathname || "").split("?")[0].split("#")[0];
  if (!path.startsWith("/")) return false;
  return isPublicMarketingPath(path) && path !== "/" && path !== "/landing";
}

/**
 * Ignora callbacks OAuth e custom schemes de auth.
 * @param {string} rawUrl
 * @returns {boolean}
 */
export function isAuthAppUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return false;
  if (value.startsWith("app.guiadebolso://auth")) return true;
  try {
    const url = new URL(value);
    return url.pathname.startsWith("/auth/");
  } catch {
    return false;
  }
}

/**
 * Converte URL de universal/app link em path interno do app (/lugares/...).
 * @param {string} rawUrl
 * @returns {string|null}
 */
export function resolveAppLinkPath(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value || isAuthAppUrl(value)) return null;

  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!APP_LINK_HOSTS.has(host)) return null;

  const path = `${url.pathname || "/"}${url.search || ""}${url.hash || ""}`;
  if (!isAppLinkInAppPath(url.pathname)) return null;

  return path.startsWith("/") ? path : `/${path}`;
}
