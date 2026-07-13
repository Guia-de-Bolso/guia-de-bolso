import assert from "node:assert/strict";
import test from "node:test";
import { disablePushTokens, getEnabledPushTokensForUsers, upsertPushToken } from "./pushTokens.js";

test("upsertPushToken grava token habilitado", async () => {
  const calls = [];

  const admin = {
    from(table) {
      return {
        upsert(row, options) {
          calls.push({ table, row, options });
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  const result = await upsertPushToken(admin, "user-1", {
    token: "token-abc",
    platform: "ios",
  });

  assert.equal(result.ok, true);
  assert.equal(calls[0].table, "push_tokens");
  assert.equal(calls[0].row.user_id, "user-1");
  assert.equal(calls[0].row.enabled, true);
});

test("getEnabledPushTokensForUsers deduplica tokens", async () => {
  const admin = {
    from() {
      return {
        select() {
          return this;
        },
        in() {
          return this;
        },
        eq() {
          return Promise.resolve({
            data: [{ token: "a" }, { token: "a" }, { token: "b" }],
            error: null,
          });
        },
      };
    },
  };

  const result = await getEnabledPushTokensForUsers(admin, ["user-1"]);
  assert.deepEqual(result.tokens, ["a", "b"]);
});

test("disablePushTokens desativa por usuário", async () => {
  let updated = 0;

  const admin = {
    from() {
      return {
        update() {
          return {
            eq() {
              return {
                eq() {
                  return {
                    select() {
                      updated += 1;
                      return Promise.resolve({ data: [{ id: "1" }], error: null });
                    },
                  };
                },
                select() {
                  updated += 1;
                  return Promise.resolve({ data: [{ id: "1" }, { id: "2" }], error: null });
                },
              };
            },
          };
        },
      };
    },
  };

  const result = await disablePushTokens(admin, "user-1");
  assert.equal(result.ok, true);
  assert.equal(result.disabled, 2);
  assert.equal(updated, 1);
});
