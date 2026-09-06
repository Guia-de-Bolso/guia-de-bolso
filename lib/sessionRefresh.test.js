import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTH_REFRESH_WINDOW_MS,
  isStrictAuthPath,
  sessionNeedsRefresh,
  shouldRefreshAuthWithServer,
} from "./sessionRefresh.js";

test("isStrictAuthPath", () => {
  assert.equal(isStrictAuthPath("/admin"), true);
  assert.equal(isStrictAuthPath("/api/admin/usuarios"), true);
  assert.equal(isStrictAuthPath("/api/buscar"), true);
  assert.equal(isStrictAuthPath("/api/roteiro/salvar"), true);
  assert.equal(isStrictAuthPath("/"), false);
  assert.equal(isStrictAuthPath("/lugares/praia-da-vila"), false);
  assert.equal(isStrictAuthPath("/favoritos"), false);
});

test("sessionNeedsRefresh", () => {
  const now = 1_700_000_000_000;
  assert.equal(sessionNeedsRefresh(null, now), false);
  assert.equal(
    sessionNeedsRefresh({ expires_at: (now + AUTH_REFRESH_WINDOW_MS + 60_000) / 1000 }, now),
    false
  );
  assert.equal(
    sessionNeedsRefresh({ expires_at: (now + 60_000) / 1000 }, now),
    true
  );
});

test("shouldRefreshAuthWithServer", () => {
  const now = 1_700_000_000_000;
  const fresh = { expires_at: (now + 40 * 60 * 1000) / 1000 };
  assert.equal(shouldRefreshAuthWithServer("/", null, now), false);
  assert.equal(shouldRefreshAuthWithServer("/", fresh, now), false);
  assert.equal(shouldRefreshAuthWithServer("/admin", fresh, now), true);
  assert.equal(shouldRefreshAuthWithServer("/api/buscar", fresh, now), true);
});
