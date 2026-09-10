import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ANDROID_APP_PACKAGE,
  buildAppleAppSiteAssociation,
  buildAssetLinksJson,
  isAppLinkInAppPath,
  isAuthAppUrl,
  resolveAppLinkPath,
} from "./appLinks.js";

test("buildAssetLinksJson inclui package e SHA-256", () => {
  const json = buildAssetLinksJson();
  assert.equal(json[0].target.package_name, ANDROID_APP_PACKAGE);
  assert.ok(json[0].target.sha256_cert_fingerprints.length >= 1);
});

test("buildAppleAppSiteAssociation monta appID e paths", () => {
  const aasa = buildAppleAppSiteAssociation();
  assert.equal(aasa.applinks.details[0].appID, "V4FTHNLS6A.app.guiadebolso");
  assert.ok(aasa.applinks.details[0].paths.includes("/lugares/*"));
  assert.ok(aasa.applinks.details[0].paths.includes("/roteiros/*"));
  assert.ok(aasa.applinks.details[0].paths.includes("/q/*"));
});

test("resolveAppLinkPath aceita guiadebolso.app", () => {
  assert.equal(
    resolveAppLinkPath("https://guiadebolso.app/lugares/praia-da-vila/"),
    "/lugares/praia-da-vila/"
  );
  assert.equal(
    resolveAppLinkPath("https://guiadebolso.app/roteiros/abc-123"),
    "/roteiros/abc-123"
  );
  assert.equal(
    resolveAppLinkPath("https://guiadebolso.app/lugares/x?from=/"),
    "/lugares/x?from=/"
  );
});

test("resolveAppLinkPath aceita app.guiadebolso.app", () => {
  assert.equal(
    resolveAppLinkPath("https://app.guiadebolso.app/lugares/praia-da-vila"),
    "/lugares/praia-da-vila"
  );
});

test("resolveAppLinkPath ignora auth e hosts inválidos", () => {
  assert.equal(resolveAppLinkPath("app.guiadebolso://auth/callback"), null);
  assert.equal(resolveAppLinkPath("https://guiadebolso.app/auth/callback"), null);
  assert.equal(resolveAppLinkPath("https://evil.com/lugares/x"), null);
  assert.equal(isAuthAppUrl("app.guiadebolso://auth/callback"), true);
});

test("resolveAppLinkPath ignora rotas privadas do app", () => {
  assert.equal(resolveAppLinkPath("https://guiadebolso.app/perfil"), null);
});

test("isAppLinkInAppPath cobre lugares, roteiros, q e baixar", () => {
  assert.equal(isAppLinkInAppPath("/lugares/teste"), true);
  assert.equal(isAppLinkInAppPath("/roteiros/abc"), true);
  assert.equal(isAppLinkInAppPath("/q/slug"), true);
  assert.equal(isAppLinkInAppPath("/baixar"), true);
  assert.equal(isAppLinkInAppPath("/"), false);
});

console.log("appLinks.test.js: ok");
