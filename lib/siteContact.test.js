import assert from "node:assert/strict";
import test from "node:test";
import {
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_PHONE_DISPLAY,
  SITE_CONTACT_PHONE_E164,
  SITE_DOMAIN,
  SITE_PUBLIC_URL,
  SITE_WHATSAPP_URL,
  SOCIAL_LINKS,
  getSiteDisplayDomain,
  getSiteTelHref,
} from "./siteContact.js";

test("constantes de contato e domínio", () => {
  assert.equal(SITE_DOMAIN, "guiadebolso.app");
  assert.equal(SITE_PUBLIC_URL, "https://guiadebolso.app");
  assert.equal(SITE_CONTACT_EMAIL, "contato@guiadebolso.app");
  assert.equal(SITE_CONTACT_PHONE_DISPLAY, "(48) 9 9122-3308");
  assert.equal(SITE_CONTACT_PHONE_E164, "+5548991223308");
  assert.equal(SITE_WHATSAPP_URL, "https://wa.me/5548991223308");
  assert.equal(getSiteTelHref(), "tel:+5548991223308");
  assert.equal(SOCIAL_LINKS.instagram, "https://www.instagram.com/guiadebolsoimbituba/");
  assert.equal(SOCIAL_LINKS.tiktok, "https://www.tiktok.com/@guiadebolsoimbituba");
});

test("getSiteDisplayDomain", () => {
  assert.equal(getSiteDisplayDomain("https://guiadebolso.app/q/foo"), "guiadebolso.app");
  assert.equal(getSiteDisplayDomain("https://www.guiadebolso.app"), "guiadebolso.app");
});
