/**
 * Carrega credenciais de service account a partir de variáveis de ambiente.
 * Suporta formatos compatíveis com Vercel (sem JSON multilinha).
 *
 * Ordem de tentativa:
 * 1. `*_JSON_BASE64` — JSON inteiro em base64 (recomendado na Vercel)
 * 2. `*_JSON` — JSON em uma linha (minificado)
 * 3. `*_PROJECT_ID` + `*_CLIENT_EMAIL` + `*_PRIVATE_KEY` — campos separados
 *
 * @param {{
 *   prefix?: string,
 *   jsonVar?: string,
 *   base64Var?: string,
 *   projectIdVar?: string,
 *   clientEmailVar?: string,
 *   privateKeyVar?: string
 * }} [options]
 * @returns {Record<string, unknown> | null}
 */
export function loadServiceAccountFromEnv(options = {}) {
  const prefix = options.prefix || "FIREBASE";
  const jsonVar = options.jsonVar || `${prefix}_SERVICE_ACCOUNT_JSON`;
  const base64Var = options.base64Var || `${prefix}_SERVICE_ACCOUNT_JSON_BASE64`;
  const projectIdVar = options.projectIdVar || `${prefix}_PROJECT_ID`;
  const clientEmailVar = options.clientEmailVar || `${prefix}_CLIENT_EMAIL`;
  const privateKeyVar = options.privateKeyVar || `${prefix}_PRIVATE_KEY`;

  const fromBase64 = parseServiceAccountBase64(process.env[base64Var]);
  if (fromBase64) return fromBase64;

  const fromJson = parseServiceAccountJson(process.env[jsonVar]);
  if (fromJson) return fromJson;

  return buildServiceAccountFromParts({
    projectId: process.env[projectIdVar],
    clientEmail: process.env[clientEmailVar],
    privateKey: process.env[privateKeyVar],
  });
}

/**
 * @param {unknown} raw
 * @returns {Record<string, unknown> | null}
 */
export function parseServiceAccountJson(raw) {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return null;

  try {
    return normalizeServiceAccountCredentials(JSON.parse(trimmed));
  } catch {
    return null;
  }
}

/**
 * @param {unknown} raw
 * @returns {Record<string, unknown> | null}
 */
export function parseServiceAccountBase64(raw) {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return null;

  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8");
    return parseServiceAccountJson(decoded);
  } catch {
    return null;
  }
}

/**
 * @param {{
 *   projectId?: unknown,
 *   clientEmail?: unknown,
 *   privateKey?: unknown
 * }} parts
 * @returns {Record<string, unknown> | null}
 */
export function buildServiceAccountFromParts(parts) {
  const projectId = typeof parts.projectId === "string" ? parts.projectId.trim() : "";
  const clientEmail =
    typeof parts.clientEmail === "string" ? parts.clientEmail.trim() : "";
  const privateKey = normalizeServiceAccountPrivateKey(parts.privateKey);

  if (!projectId || !clientEmail || !privateKey) return null;

  return {
    type: "service_account",
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };
}

/**
 * Normaliza PEM colado na Vercel (`\n` literal ou quebras reais).
 * @param {unknown} raw
 * @returns {string | null}
 */
export function normalizeServiceAccountPrivateKey(raw) {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return null;

  const unescaped = trimmed.replace(/\\n/g, "\n").trim();

  if (/-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(unescaped)) {
    return unescaped;
  }

  const body = unescaped.replace(/\s+/g, "");
  if (!body) return null;

  const lines = body.match(/.{1,64}/g) ?? [body];
  return ["-----BEGIN PRIVATE KEY-----", ...lines, "-----END PRIVATE KEY-----"].join("\n");
}

/**
 * @param {unknown} credentials
 * @returns {Record<string, unknown> | null}
 */
export function normalizeServiceAccountCredentials(credentials) {
  if (!credentials || typeof credentials !== "object") return null;

  const record = /** @type {Record<string, unknown>} */ ({ ...credentials });
  const privateKey = normalizeServiceAccountPrivateKey(record.private_key);
  if (!privateKey) return null;

  record.private_key = privateKey;
  return record;
}
