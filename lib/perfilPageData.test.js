import assert from "node:assert/strict";
import { serializePerfilAuthUser } from "./perfilPageData.js";

assert.deepEqual(serializePerfilAuthUser(null), null);
assert.deepEqual(serializePerfilAuthUser({}), null);

const snapshot = serializePerfilAuthUser({
  id: "user-1",
  email: "test@example.com",
  phone: null,
  created_at: "2024-01-01T00:00:00Z",
  user_metadata: { full_name: "Bruno" },
  app_metadata: { provider: "google" },
});

assert.equal(snapshot.id, "user-1");
assert.equal(snapshot.email, "test@example.com");
assert.equal(snapshot.user_metadata.full_name, "Bruno");
assert.equal(snapshot.app_metadata.provider, "google");

console.log("perfilPageData.test.js: ok");
