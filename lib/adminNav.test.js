import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getVisibleAdminNavGroups,
  shouldAdminNavGroupStartOpen,
} from "./adminNav.js";

describe("adminNav groups", () => {
  it("admin operacional só vê Operação", () => {
    const groups = getVisibleAdminNavGroups("admin");
    assert.deepEqual(
      groups.map((g) => g.id),
      ["operacao"]
    );
    assert.equal(groups[0].links.length, 7);
  });

  it("dev vê Operação, Comercial e Sistema", () => {
    const groups = getVisibleAdminNavGroups("dev");
    assert.deepEqual(
      groups.map((g) => g.id),
      ["operacao", "comercial", "sistema"]
    );
    assert.equal(groups.find((g) => g.id === "comercial")?.links.length, 2);
    assert.equal(groups.find((g) => g.id === "sistema")?.links.length, 6);
  });

  it("Sistema começa fechado, exceto na rota ativa", () => {
    const sistema = getVisibleAdminNavGroups("dev").find((g) => g.id === "sistema");
    assert.ok(sistema);
    assert.equal(shouldAdminNavGroupStartOpen(sistema, "/admin"), false);
    assert.equal(shouldAdminNavGroupStartOpen(sistema, "/admin/ia"), true);
    assert.equal(shouldAdminNavGroupStartOpen(sistema, "/admin/logs"), true);
  });
});
