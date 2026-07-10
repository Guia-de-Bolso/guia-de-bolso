import assert from "node:assert/strict";
import { getSessionUser } from "./session.js";

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

console.log("session.test.js: ok");
