import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getDashboardHeroShortcuts } from "./adminDashboardShortcuts.js";

describe("getDashboardHeroShortcuts", () => {
  it("admin operacional não vê Logs nem Parceiros CMS", () => {
    const hrefs = getDashboardHeroShortcuts("admin").map((item) => item.href);
    assert.ok(hrefs.includes("/admin/avaliacoes?tab=pendente"));
    assert.ok(hrefs.includes("/admin/locais?status=em_analise"));
    assert.ok(!hrefs.includes("/admin/logs"));
    assert.ok(!hrefs.includes("/admin/parceiros"));
  });

  it("dev vê Parceiros e Logs", () => {
    const hrefs = getDashboardHeroShortcuts("dev").map((item) => item.href);
    assert.ok(hrefs.includes("/admin/parceiros"));
    assert.ok(hrefs.includes("/admin/logs"));
  });
});
