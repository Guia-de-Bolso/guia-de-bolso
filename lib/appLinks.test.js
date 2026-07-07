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

test("buildAppleAppSiteAssociation monta appID", () => {
  const aasa = buildAppleAppSiteAssociation();
  assert.equal(aasa.applinks.details[0].appID, "V4FTHNLS6A.app.guiadebolso");
  assert.ok(aasa.applinks.details[0].paths.includes("/lugares/*"));
});

test("resolveAppLinkPath aceita guiadebolso.app", () => {
  assert.equal(
    resolveAppLinkPath("https://guiadebolso.app/lugares/praia-da-vila/"),
    "/lugares/praia-da-vila/"
  );
});

test("resolveAppLinkPath ignora auth", () => {
  assert.equal(resolveAppLinkPath("app.guiadebolso://auth/callback"), null);
  assert.equal(resolveAppLinkPath("https://guiadebolso.app/auth/callback"), null);
});

test("resolveAppLinkPath ignora rotas privadas do app", () => {
  assert.equal(resolveAppLinkPath("https://guiadebolso.app/perfil"), null);
});

test("resolveAppLinkPath aceita custom scheme do banner WhatsApp", () => {
  assert.equal(
    resolveAppLinkPath("app.guiadebolso://guiadebolso.app/lugares/praia-da-vila/"),
    "/lugares/praia-da-vila/"
  );
});

test("isAppLinkInAppPath cobre lugares e baixar", () => {
  assert.equal(isAppLinkInAppPath("/lugares/teste"), true);
  assert.equal(isAppLinkInAppPath("/baixar"), true);
  assert.equal(isAppLinkInAppPath("/"), false);
});

console.log("appLinks.test.js: ok");
