import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
  getAdminDashboardPeriod,
  getAdminSidebarCollapsed,
  setAdminDashboardPeriod,
  setAdminSidebarCollapsed,
} from "./adminUiPrefs.js";

describe("adminUiPrefs", () => {
  /** @type {Map<string, string>} */
  const store = new Map();
  const previousWindow = globalThis.window;

  before(() => {
    store.clear();
    globalThis.window = {
      localStorage: {
        getItem(key) {
          return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
          store.set(key, String(value));
        },
      },
    };
  });

  after(() => {
    if (previousWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = previousWindow;
    }
  });

  it("sidebar collapsed round-trip", () => {
    setAdminSidebarCollapsed(true);
    assert.equal(getAdminSidebarCollapsed(), true);
    setAdminSidebarCollapsed(false);
    assert.equal(getAdminSidebarCollapsed(), false);
  });

  it("dashboard period defaults and validates", () => {
    setAdminDashboardPeriod("mes");
    assert.equal(getAdminDashboardPeriod(), "mes");
    setAdminDashboardPeriod("invalid");
    assert.equal(getAdminDashboardPeriod(), "semana");
  });
});
