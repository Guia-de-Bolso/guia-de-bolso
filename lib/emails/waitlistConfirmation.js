import { SITE_PUBLIC_URL } from "@/lib/siteContact";

const BRAND = {
  primary: "#1a4a3a",
  mint: "#7fd4ae",
  ink: "#0a1612",
  muted: "#5c6f68",
  bg: "#f7f8f7",
};

/**
 * @param {string} [email]
 * @returns {string}
 */
export function getWaitlistConfirmationSubject() {
  return "O app já está nas lojas — Guia de Bolso";
}

/**
 * @returns {string}
 */
export function buildWaitlistConfirmationText() {
  return [
    "Olá!",
    "",
    "Seu e-mail foi cadastrado. O Guia de Bolso já está disponível na App Store e no Google Play.",
    "",
    "Baixe o app no seu celular:",
    `${SITE_PUBLIC_URL}/baixar`,
    "",
    `Ou explore o guia no navegador: ${SITE_PUBLIC_URL}`,
    "",
    "Obrigado por fazer parte da comunidade que descobre Imbituba com confiança.",
    "",
    "— Equipe Guia de Bolso",
    "Imbituba, Santa Catarina",
  ].join("\n");
}

/**
 * @returns {string}
 */
export function buildWaitlistConfirmationHtml() {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Guia de Bolso — baixe o app</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(10,22,18,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.primary} 0%,#0f2e24 100%);padding:32px 28px;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.mint};">Guia de Bolso</p>
              <h1 style="margin:0;font-size:26px;font-weight:600;line-height:1.2;color:#ffffff;letter-spacing:-0.03em;">O app já está nas lojas</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 24px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:${BRAND.ink};">
                Olá! O Guia de Bolso já está disponível para download.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:${BRAND.muted};">
                Baixe grátis na App Store ou no Google Play — praias, gastronomia e atrativos curados de Imbituba no bolso.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="border-radius:999px;background:${BRAND.primary};">
                    <a href="${SITE_PUBLIC_URL}/baixar" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
                      Baixar o app
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
                Obrigado por fazer parte da comunidade que descobre Imbituba com confiança.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;border-top:1px solid rgba(10,22,18,0.06);text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:${BRAND.muted};">Equipe Guia de Bolso · Imbituba, SC</p>
              <p style="margin:0;font-size:11px;color:#9aa8a3;">© ${year} Guia de Bolso</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
