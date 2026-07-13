import assert from "node:assert/strict";
import test from "node:test";
import {
  buildServiceAccountFromParts,
  normalizeServiceAccountPrivateKey,
  parseServiceAccountBase64,
  parseServiceAccountJson,
} from "./serviceAccountEnv.js";

const sampleAccount = {
  type: "service_account",
  project_id: "guia-de-bolso",
  client_email: "firebase@guia-de-bolso.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n",
};

test("parseServiceAccountJson aceita JSON minificado", () => {
  const parsed = parseServiceAccountJson(JSON.stringify(sampleAccount));
  assert.equal(parsed?.project_id, "guia-de-bolso");
  assert.match(String(parsed?.private_key), /BEGIN PRIVATE KEY/);
});

test("parseServiceAccountBase64 decodifica JSON", () => {
  const encoded = Buffer.from(JSON.stringify(sampleAccount), "utf8").toString("base64");
  const parsed = parseServiceAccountBase64(encoded);
  assert.equal(parsed?.client_email, sampleAccount.client_email);
});

test("buildServiceAccountFromParts monta credencial", () => {
  const built = buildServiceAccountFromParts({
    projectId: "guia-de-bolso",
    clientEmail: "firebase@guia-de-bolso.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\\nXYZ\\n-----END PRIVATE KEY-----\\n",
  });

  assert.equal(built?.type, "service_account");
  assert.match(String(built?.private_key), /XYZ/);
});

test("normalizeServiceAccountPrivateKey aceita corpo sem cabeçalho PEM", () => {
  const key = normalizeServiceAccountPrivateKey("YWJjZGVmZ2hpams=");
  assert.match(String(key), /BEGIN PRIVATE KEY/);
});
