import assert from "node:assert/strict";
import test from "node:test";
import {
  getSessionUser,
  getVerifiedUser,
  serviceRoleUserId,
  verifiedUserMatches,
} from "./session.js";

assert.equal(await getSessionUser(null), null);

const fakeUser = { id: "user-1", email: "a@b.com" };
const supabaseWithSession = {
  auth: {
    getSession: async () => ({ data: { session: { user: fakeUser } }, error: null }),
    getUser: async () => {
      throw new Error("getUser should not be called");
    },
  },
};

assert.equal(await getSessionUser(supabaseWithSession), fakeUser);

const supabaseEmpty = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
  },
};

assert.equal(await getSessionUser(supabaseEmpty), null);

const supabaseError = {
  auth: {
    getSession: async () => ({
      data: { session: null },
      error: new Error("cookie corrupt"),
    }),
  },
};

assert.equal(await getSessionUser(supabaseError), null);

test("id adulterado no cookie não entra em exclusão, avatar, push nem feedback", async () => {
  const cookieUser = { id: "conta-alvo", email: "alvo@example.com" };
  const authUser = { id: "conta-real", email: "real@example.com" };
  const supabase = {
    auth: {
      getSession: async () => ({ data: { session: { user: cookieUser } }, error: null }),
      getUser: async () => ({ data: { user: authUser }, error: null }),
    },
  };

  const verified = await getVerifiedUser(supabase);
  const actorId = serviceRoleUserId(verified);

  assert.equal(verified?.id, "conta-real");
  assert.equal(actorId, "conta-real");
  assert.notEqual(actorId, cookieUser.id);
  assert.equal(verifiedUserMatches(actorId, verified), true);
  assert.equal(verifiedUserMatches(cookieUser.id, verified), false);
});

test("sessão expirada e token inválido não produzem id de escrita", async () => {
  const expired = {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: "conta-alvo" }, expires_at: 1 } },
        error: null,
      }),
      getUser: async () => ({ data: { user: null }, error: new Error("JWT expired") }),
    },
  };
  const invalid = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error("invalid JWT") }),
    },
  };

  assert.equal(await getVerifiedUser(expired), null);
  assert.equal(await getVerifiedUser(invalid), null);
  assert.equal(serviceRoleUserId(null), null);
  assert.equal(serviceRoleUserId({ id: "  " }), null);
});

test("renovação de sessão usa o usuário devolvido pelo Auth, não o cookie antigo", async () => {
  const supabase = {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: "id-antes-do-refresh" } } },
        error: null,
      }),
      getUser: async () => ({
        data: { user: { id: "id-depois-do-refresh", email: "real@example.com" } },
        error: null,
      }),
    },
  };

  const verified = await getVerifiedUser(supabase);
  assert.equal(serviceRoleUserId(verified), "id-depois-do-refresh");
  assert.equal((await getSessionUser(supabase))?.id, "id-antes-do-refresh");
});

console.log("session.test.js: ok");
