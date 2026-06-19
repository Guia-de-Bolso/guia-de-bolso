/**
 * SMS OTP autofill — Web OTP API (Android Chrome) e parsing de códigos de 6 dígitos.
 *
 * Para Web OTP no Android, o SMS deve terminar com:
 *   @seu-dominio #123456
 * (hostname da página, ex.: app.guiadebolso.app)
 *
 * Configure o template em Supabase → Authentication → Phone → SMS message, por exemplo:
 *   Seu código Guia de Bolso: {{ .Code }}
 *
 *   @app.guiadebolso.app #{{ .Code }}
 */

/**
 * @param {string} value
 * @returns {string}
 */
export function otpDigitsFromInput(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 6);
}

/**
 * @param {string} digits
 * @returns {string[] | null}
 */
export function otpDigitsToCode(digits) {
  if (digits.length !== 6) return null;
  return digits.split("");
}

/**
 * @returns {boolean}
 */
export function supportsWebSmsOtp() {
  return (
    typeof window !== "undefined" &&
    "OTPCredential" in window &&
    typeof navigator?.credentials?.get === "function"
  );
}

/**
 * Android Chrome: lê OTP do SMS quando o formato inclui @hostname #código.
 *
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string | null>}
 */
export async function requestWebSmsOtp(options = {}) {
  if (!supportsWebSmsOtp()) return null;

  try {
    const credential = await navigator.credentials.get({
      otp: { transport: ["sms"] },
      signal: options.signal,
    });

    const code = credential?.code;
    if (typeof code !== "string") return null;

    const digits = otpDigitsFromInput(code);
    return digits.length === 6 ? digits : null;
  } catch {
    return null;
  }
}
