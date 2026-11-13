import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import {
  decodeAppleJwsPayload,
  isUnverifiedAppleJwsAllowed,
  normalizeApplePrivateKey,
  validateAppleTransactionPayload,
  verifyAppleSubscription,
  verifyAppleSubscriptionFromJws,
} from "./appleBillingVerify.js";

const PRODUCT_ID = "guia_premium_mensal";
const TRANSACTION_ID = "2000000123456789";
const ORIGINAL_ID = "2000000000000001";
const futureExpiry = Date.now() + 86_400_000;
const pastExpiry = Date.now() - 86_400_000;

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" });

function jws(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `e30.${body}.c2ln`;
}

function subscriptionPayload(overrides = {}) {
  return {
    bundleId: "app.guiadebolso",
    productId: PRODUCT_ID,
    transactionId: TRANSACTION_ID,
    originalTransactionId: ORIGINAL_ID,
    environment: "Sandbox",
    expiresDate: futureExpiry,
    ...overrides,
  };
}

const ENV_KEYS = [
  "APPLE_IAP_PRIVATE_KEY",
  "APPLE_IAP_ISSUER_ID",
  "APPLE_IAP_KEY_ID",
  "APPLE_IAP_BUNDLE_ID",
  "APPLE_IAP_USE_SANDBOX",
  "APPLE_IAP_ALLOW_UNVERIFIED_JWS",
  "VERCEL_ENV",
];

/**
 * @param {NodeJS.ProcessEnv} extra
 * @param {() => Promise<void>} fn
 */
async function withAppleEnv(extra, fn) {
  const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  try {
    for (const key of ENV_KEYS) delete process.env[key];
    Object.assign(process.env, extra);
    await fn();
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

function apiCredentials() {
  return {
    APPLE_IAP_PRIVATE_KEY: privateKeyPem,
    APPLE_IAP_ISSUER_ID: "issuer-test",
    APPLE_IAP_KEY_ID: "key-test",
    APPLE_IAP_BUNDLE_ID: "app.guiadebolso",
  };
}

test("decode e normalização da chave Apple", () => {
  const decoded = decodeAppleJwsPayload(jws({ productId: PRODUCT_ID }));
  assert.equal(decoded?.productId, PRODUCT_ID);

  const normalized = normalizeApplePrivateKey("MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgabc123");
  assert.match(normalized ?? "", /^-----BEGIN PRIVATE KEY-----\n/);
  assert.match(normalized ?? "", /\n-----END PRIVATE KEY-----\n?$/);
});

test("payload da API exige bundle, produto, transação, original, ambiente e expiração", () => {
  const valid = validateAppleTransactionPayload(subscriptionPayload(), PRODUCT_ID, {
    expectedTransactionId: TRANSACTION_ID,
    allowedEnvironments: ["Sandbox"],
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.originalTransactionId, ORIGINAL_ID);
  assert.equal(valid.transactionId, TRANSACTION_ID);

  assert.equal(
    validateAppleTransactionPayload(subscriptionPayload({ bundleId: "" }), PRODUCT_ID).valid,
    false
  );
  assert.equal(
    validateAppleTransactionPayload(subscriptionPayload({ bundleId: "outro.app" }), PRODUCT_ID).valid,
    false
  );
  assert.equal(
    validateAppleTransactionPayload(subscriptionPayload({ productId: "outro" }), PRODUCT_ID).valid,
    false
  );
  assert.equal(
    validateAppleTransactionPayload(subscriptionPayload({ originalTransactionId: "" }), PRODUCT_ID, {
      expectedTransactionId: TRANSACTION_ID,
    }).valid,
    false
  );
  assert.equal(
    validateAppleTransactionPayload(subscriptionPayload({ environment: "Production" }), PRODUCT_ID, {
      expectedTransactionId: TRANSACTION_ID,
      allowedEnvironments: ["Sandbox"],
    }).valid,
    false
  );
  assert.equal(
    validateAppleTransactionPayload(subscriptionPayload({ environment: "Xcode" }), PRODUCT_ID).valid,
    false
  );
  assert.equal(
    validateAppleTransactionPayload(subscriptionPayload({ expiresDate: undefined }), PRODUCT_ID).valid,
    false
  );
  assert.equal(
    validateAppleTransactionPayload(subscriptionPayload({ expiresDate: pastExpiry }), PRODUCT_ID).valid,
    false
  );
  assert.equal(
    validateAppleTransactionPayload(
      subscriptionPayload({ revocationDate: Date.now() }),
      PRODUCT_ID
    ).valid,
    false
  );
  assert.equal(
    validateAppleTransactionPayload(subscriptionPayload({ transactionId: "outra" }), PRODUCT_ID, {
      expectedTransactionId: TRANSACTION_ID,
    }).valid,
    false
  );
});

test("renovação e restauração aceitam transação nova com a mesma assinatura original", () => {
  const renewalId = "2000000999888777";
  const verified = validateAppleTransactionPayload(
    subscriptionPayload({
      transactionId: renewalId,
      originalTransactionId: ORIGINAL_ID,
      environment: "Production",
    }),
    PRODUCT_ID,
    { expectedTransactionId: renewalId, allowedEnvironments: ["Production"] }
  );

  assert.equal(verified.valid, true);
  assert.equal(verified.transactionId, renewalId);
  assert.equal(verified.originalTransactionId, ORIGINAL_ID);
});

test("flag de JWS local não liga em produção, valor ausente ou incorreto", () => {
  assert.equal(isUnverifiedAppleJwsAllowed({ APPLE_IAP_ALLOW_UNVERIFIED_JWS: "true" }), false);
  assert.equal(
    isUnverifiedAppleJwsAllowed({
      APPLE_IAP_ALLOW_UNVERIFIED_JWS: "true",
      VERCEL_ENV: "production",
    }),
    false
  );
  assert.equal(
    isUnverifiedAppleJwsAllowed({
      APPLE_IAP_ALLOW_UNVERIFIED_JWS: "true",
      VERCEL_ENV: "prod",
    }),
    false
  );
  assert.equal(
    isUnverifiedAppleJwsAllowed({
      APPLE_IAP_ALLOW_UNVERIFIED_JWS: "true",
      VERCEL_ENV: "Production",
    }),
    false
  );
  assert.equal(
    isUnverifiedAppleJwsAllowed({
      APPLE_IAP_ALLOW_UNVERIFIED_JWS: "true",
      VERCEL_ENV: "",
    }),
    false
  );
  assert.equal(
    isUnverifiedAppleJwsAllowed({
      APPLE_IAP_ALLOW_UNVERIFIED_JWS: "true",
      VERCEL_ENV: "development",
    }),
    true
  );
  assert.equal(
    isUnverifiedAppleJwsAllowed({
      APPLE_IAP_ALLOW_UNVERIFIED_JWS: "false",
      VERCEL_ENV: "preview",
    }),
    false
  );
});

test("JWS forjado não ativa quando a API não confirma a transação", async () => {
  const forged = jws(subscriptionPayload());
  const logged = [];
  const originalError = console.error;
  console.error = (...args) => {
    logged.push(args.map(String).join(" "));
  };

  try {
    await withAppleEnv(apiCredentials(), async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 404,
        json: async () => ({}),
        text: async () => forged,
      });

      const result = await verifyAppleSubscription({
        transactionId: TRANSACTION_ID,
        productId: PRODUCT_ID,
        jwsRepresentation: forged,
      });

      assert.equal(result.valid, false);
      assert.equal(logged.some((line) => line.includes(forged)), false);
    });
  } finally {
    console.error = originalError;
  }
});

test("API sandbox confirma compra sandbox e produção confirma renovação", async () => {
  await withAppleEnv(apiCredentials(), async () => {
    globalThis.fetch = async (url) => {
      const sandbox = String(url).includes("storekit-sandbox");
      if (!sandbox) {
        return { ok: false, status: 404, json: async () => ({}), text: async () => "" };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ signedTransactionInfo: jws(subscriptionPayload()) }),
        text: async () => "",
      };
    };

    const sandboxPurchase = await verifyAppleSubscription({
      transactionId: TRANSACTION_ID,
      productId: PRODUCT_ID,
      jwsRepresentation: jws({ productId: "forjado" }),
    });
    assert.equal(sandboxPurchase.valid, true);
    assert.equal(sandboxPurchase.originalTransactionId, ORIGINAL_ID);
  });

  const renewalId = "2000000888777666";
  await withAppleEnv(apiCredentials(), async () => {
    globalThis.fetch = async (url) => {
      const sandbox = String(url).includes("storekit-sandbox");
      if (sandbox) {
        return { ok: false, status: 404, json: async () => ({}), text: async () => "" };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          signedTransactionInfo: jws(
            subscriptionPayload({
              transactionId: renewalId,
              environment: "Production",
            })
          ),
        }),
        text: async () => "",
      };
    };

    const productionRenewal = await verifyAppleSubscription({
      transactionId: renewalId,
      productId: PRODUCT_ID,
    });
    assert.equal(productionRenewal.valid, true);
    assert.equal(productionRenewal.transactionId, renewalId);
    assert.equal(productionRenewal.originalTransactionId, ORIGINAL_ID);
  });
});

test("resposta sandbox com ambiente Production é recusada", async () => {
  await withAppleEnv(apiCredentials(), async () => {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        signedTransactionInfo: jws(subscriptionPayload({ environment: "Production" })),
      }),
      text: async () => "",
    });

    const result = await verifyAppleSubscription({
      transactionId: TRANSACTION_ID,
      productId: PRODUCT_ID,
    });
    assert.equal(result.valid, false);
    assert.equal(result.code, "PURCHASE_INVALID");
  });
});

test("atalho de JWS local só existe em development ou preview", async () => {
  const localJws = jws(subscriptionPayload({ environment: "Xcode" }));

  await withAppleEnv(
    { APPLE_IAP_ALLOW_UNVERIFIED_JWS: "true", VERCEL_ENV: "development" },
    async () => {
      const allowed = await verifyAppleSubscription({
        transactionId: TRANSACTION_ID,
        productId: PRODUCT_ID,
        jwsRepresentation: localJws,
      });
      assert.equal(allowed.valid, true);
      assert.equal(allowed.originalTransactionId, ORIGINAL_ID);
    }
  );

  await withAppleEnv(
    { APPLE_IAP_ALLOW_UNVERIFIED_JWS: "true", VERCEL_ENV: "production" },
    async () => {
      const blocked = await verifyAppleSubscription({
        transactionId: TRANSACTION_ID,
        productId: PRODUCT_ID,
        jwsRepresentation: localJws,
      });
      assert.equal(blocked.valid, false);
    }
  );

  const direct = verifyAppleSubscriptionFromJws(localJws, PRODUCT_ID, {
    expectedTransactionId: TRANSACTION_ID,
    allowedEnvironments: ["Xcode"],
  });
  assert.equal(direct.valid, true);
});
