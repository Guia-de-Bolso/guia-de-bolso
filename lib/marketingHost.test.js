import assert from "node:assert/strict";
import test from "node:test";
import {
  getMarketingRouteAction,
  getRequestHostname,
  isMarketingHost,
  isPublicMarketingPath,
  isPublicSeoPath,
} from "./marketingHost.js";

test("isMarketingHost", () => {
  assert.equal(isMarketingHost("guiadebolso.app"), true);
  assert.equal(isMarketingHost("www.guiadebolso.app"), true);
  assert.equal(isMarketingHost("guia-de-bolso-puce.vercel.app"), false);
  assert.equal(isMarketingHost("localhost"), false);
});

test("isPublicSeoPath", () => {
  assert.equal(isPublicSeoPath("/lugares/praia-da-vila"), true);
  assert.equal(isPublicSeoPath("/categoria/Natureza"), true);
  assert.equal(isPublicSeoPath("/atrativos/abc"), true);
  assert.equal(isPublicSeoPath("/guia/o-que-fazer-em-imbituba"), true);
  assert.equal(isPublicSeoPath("/lugares/"), false);
  assert.equal(isPublicSeoPath("/login"), false);
});

test("isPublicMarketingPath", () => {
  assert.equal(isPublicMarketingPath("/"), true);
  assert.equal(isPublicMarketingPath("/termos"), true);
  assert.equal(isPublicMarketingPath("/excluir-conta"), true);
  assert.equal(isPublicMarketingPath("/imbituba"), true);
  assert.equal(isPublicMarketingPath("/guia"), true);
  assert.equal(isPublicMarketingPath("/google8035674d06cf6295.html"), true);
  assert.equal(isPublicMarketingPath("/para-negocios"), true);
  assert.equal(isPublicMarketingPath("/sobre"), true);
  assert.equal(isPublicMarketingPath("/baixar"), true);
  assert.equal(isPublicMarketingPath("/llms.txt"), true);
  assert.equal(isPublicMarketingPath("/lugares/foo"), true);
  assert.equal(isPublicMarketingPath("/login"), false);
});

test("getMarketingRouteAction", () => {
  assert.equal(getMarketingRouteAction("/"), "rewrite-landing");
  assert.equal(getMarketingRouteAction("/landing"), "redirect-root");
  assert.equal(getMarketingRouteAction("/termos"), "continue");
  assert.equal(getMarketingRouteAction("/excluir-conta"), "continue");
  assert.equal(getMarketingRouteAction("/sobre"), "continue");
  assert.equal(getMarketingRouteAction("/baixar"), "continue");
  assert.equal(getMarketingRouteAction("/lugares/praia-da-vila"), "continue");
  assert.equal(getMarketingRouteAction("/login"), "redirect-home");
  assert.equal(getMarketingRouteAction("/api/cron/lugares-purge"), "continue");
  assert.equal(getMarketingRouteAction("/auth/callback"), "continue");
});

test("getRequestHostname", () => {
  assert.equal(
    getRequestHostname({ headers: new Headers({ host: "guiadebolso.app:443" }) }),
    "guiadebolso.app"
  );
});
