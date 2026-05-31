/**
 * Envio transacional via Resend (fetch — sem SDK).
 * Requer RESEND_API_KEY no ambiente. Opcional: RESEND_FROM.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * @param {object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} params.html
 * @param {string} [params.text]
 * @param {string} [params.from]
 * @returns {Promise<{ ok: boolean, skipped?: boolean, id?: string, error?: string }>}
 */
export async function sendResendEmail({ to, subject, html, text, from }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("[resend] RESEND_API_KEY ausente — e-mail não enviado");
    return { ok: false, skipped: true };
  }

  const fromAddress =
    from ?? process.env.RESEND_FROM ?? "Guia de Bolso <contato@guiadebolso.app>";

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html,
        ...(text ? { text } : {}),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("[resend] falha:", response.status, data);
      return {
        ok: false,
        error: data?.message ?? `HTTP ${response.status}`,
      };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("[resend] erro de rede:", err);
    return { ok: false, error: "network" };
  }
}
