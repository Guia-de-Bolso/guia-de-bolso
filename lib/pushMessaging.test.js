import assert from "node:assert/strict";
import test from "node:test";
import { chunkArray, loadFirebaseServiceAccount } from "./pushMessaging.js";

const originalJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const originalBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
const originalProjectId = process.env.FIREBASE_PROJECT_ID;
const originalClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const originalPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

const sampleAccount = {
  type: "service_account",
  project_id: "guia-de-bolso",
  client_email: "firebase@guia-de-bolso.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n",
};

test.after(() => {
  if (originalJson === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  else process.env.FIREBASE_SERVICE_ACCOUNT_JSON = originalJson;

  if (originalBase64 === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  else process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 = originalBase64;

  if (originalProjectId === undefined) delete process.env.FIREBASE_PROJECT_ID;
  else process.env.FIREBASE_PROJECT_ID = originalProjectId;

  if (originalClientEmail === undefined) delete process.env.FIREBASE_CLIENT_EMAIL;
  else process.env.FIREBASE_CLIENT_EMAIL = originalClientEmail;

  if (originalPrivateKey === undefined) delete process.env.FIREBASE_PRIVATE_KEY;
  else process.env.FIREBASE_PRIVATE_KEY = originalPrivateKey;
});

test("chunkArray divide em lotes", () => {
  assert.deepEqual(chunkArray([1, 2, 3, 4, 5], 2), [
    [1, 2],
    [3, 4],
    [5],
  ]);
  assert.deepEqual(chunkArray([], 500), []);
});

test("loadFirebaseServiceAccount retorna null sem env", () => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.FIREBASE_PRIVATE_KEY;
  assert.equal(loadFirebaseServiceAccount(), null);
});

test("loadFirebaseServiceAccount parseia JSON válido", () => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify(sampleAccount);

  const credentials = loadFirebaseServiceAccount();
  assert.equal(credentials?.project_id, "guia-de-bolso");
});

test("loadFirebaseServiceAccount parseia base64", () => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 = Buffer.from(
    JSON.stringify(sampleAccount),
    "utf8"
  ).toString("base64");

  const credentials = loadFirebaseServiceAccount();
  assert.equal(credentials?.client_email, sampleAccount.client_email);
});

test("loadFirebaseServiceAccount monta a partir de campos separados", () => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  process.env.FIREBASE_PROJECT_ID = sampleAccount.project_id;
  process.env.FIREBASE_CLIENT_EMAIL = sampleAccount.client_email;
  process.env.FIREBASE_PRIVATE_KEY = sampleAccount.private_key;

  const credentials = loadFirebaseServiceAccount();
  assert.equal(credentials?.type, "service_account");
});

test("loadFirebaseServiceAccount rejeita JSON inválido", () => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.FIREBASE_PRIVATE_KEY;
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = "{invalid";
  assert.equal(loadFirebaseServiceAccount(), null);
});
