"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import IconApple from "@/components/IconApple";
import IconBack from "@/components/IconBack";
import LegalConsentLine from "@/components/legal/LegalConsentLine";
import { ensurePerfil } from "@/lib/ensurePerfil";
import { signInWithAppleAuth, signInWithGoogleOAuth } from "@/lib/capacitorOAuth";
import { canUseNativeAppleSignIn, formatNativeAppleError } from "@/lib/nativeAppleAuth";
import { formatNativeGoogleError } from "@/lib/nativeGoogleAuth";
import { safeRedirectPath } from "@/lib/safeRedirectPath";
import {
  otpDigitsFromInput,
  otpDigitsToCode,
  requestWebSmsOtp,
} from "@/lib/smsOtpAutofill";
import { createClient } from "@/lib/supabase";
import { SITE_CONTACT_PHONE_DISPLAY } from "@/lib/siteContact";

/**
 * IconGoogle - Google brand icon for OAuth button.
 * @param {object} props
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
function IconGoogle({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/**
 * IconMessage - Message icon for SMS login option.
 * @param {object} props
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
function IconMessage({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-6 4V6a2 2 0 012-2zm2 5v2h12V9H6zm0 4v2h8v-2H6z" />
    </svg>
  );
}

/**
 * Botão Sign in with Apple (iOS nativo).
 * @param {object} props
 * @param {boolean} props.compact
 * @param {boolean} props.loading
 * @param {() => void} props.onClick
 * @returns {import("react").ReactElement}
 */
function AppleSignInButton({ compact, loading, onClick }) {
  const appleBtn = `${compact ? "border border-[#1a2e28]/10 " : ""}flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-[#1a2e28] py-3.5 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-60`;

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      aria-label="Entrar com Apple"
      className={appleBtn}
    >
      <IconApple dark />
      {loading ? "Conectando..." : "Continuar com Apple"}
    </button>
  );
}

/**
 * @param {string} value
 * @returns {string}
 */
function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/**
 * @param {string} value
 * @returns {string}
 */
function cleanPhone(value) {
  return value.replace(/\D/g, "").slice(0, 11);
}

/**
 * AuthFlow — Google, Apple (iOS nativo) e SMS OTP.
 * @param {object} props
 * @param {boolean} [props.compact] - Modal LoginModal.
 * @param {"default" | "immersive"} [props.variant] - Visual da página /login.
 * @param {boolean} [props.hideCopy] - Oculta título e subtítulo (ex.: perfil já explica o contexto).
 * @returns {import('react').ReactElement}
 */
export default function AuthFlow({
  compact = false,
  variant = "default",
  hideCopy = false,
  redirectAfterLogin = "/",
  onLoginSuccess,
}) {
  const immersive = variant === "immersive" && !compact;
  const router = useRouter();
  const postLoginPath = safeRedirectPath(redirectAfterLogin);
  const [screen, setScreen] = useState("main");
  const [oauthLoading, setOauthLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [oauthError, setOauthError] = useState("");
  const showAppleSignIn = canUseNativeAppleSignIn();
  const socialLoading = oauthLoading || appleLoading;
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(30);
  const [resendCount, setResendCount] = useState(0);
  const inputsRef = useRef([]);

  const digits = cleanPhone(phone);
  const phoneE164 = `+55${digits}`;
  const codeValue = code.join("");

  const titleClass = compact
    ? "text-xl font-bold text-[#1a2e28]"
    : immersive
      ? "text-xl font-bold tracking-tight text-[#1a2e28]"
      : "text-2xl font-bold tracking-tight text-[#1a2e28]";
  const subtitleClass = compact
    ? "mt-1.5 text-sm leading-relaxed text-[#5a6b66]"
    : "mt-2 text-sm leading-relaxed text-[#5a6b66]";
  const backLinkClass =
    "mb-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#1a4a3a]";
  const primaryBtn =
    "flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl py-3.5 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-60";
  const googleBtn = `${primaryBtn} border border-[#e3ebe7] bg-white text-[#1a2e28] shadow-sm`;
  const smsBtn = `${primaryBtn} border-2 border-[#1a4a3a]/15 bg-[#f0f4f3] text-[#1a4a3a]`;
  const ctaBtn = `${primaryBtn} bg-[#1a4a3a] text-white shadow-md shadow-[#1a4a3a]/25`;
  const inputClass =
    "mt-6 w-full min-h-[52px] rounded-2xl border border-[#e3ebe7] bg-white px-4 py-3 text-base text-[#1a2e28] outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/25";

  const applyOtpDigits = useCallback((raw) => {
    const digits = otpDigitsFromInput(raw);
    const next = otpDigitsToCode(digits);
    if (!next) return false;

    setCode(next);
    setCodeError("");
    setTimeout(() => inputsRef.current[5]?.focus(), 0);
    return true;
  }, []);

  useEffect(() => {
    if (screen !== "code" || resendSeconds <= 0) return undefined;
    const timer = setTimeout(() => setResendSeconds((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [screen, resendSeconds]);

  useEffect(() => {
    if (screen !== "code") return undefined;

    const controller = new AbortController();

    requestWebSmsOtp({ signal: controller.signal }).then((otpCode) => {
      if (otpCode) applyOtpDigits(otpCode);
    });

    return () => controller.abort();
  }, [screen, resendCount, applyOtpDigits]);

  async function handleApple() {
    setAppleLoading(true);
    setOauthError("");

    try {
      const supabase = createClient();
      if (!supabase) {
        setOauthError("Serviço indisponível. Tente novamente.");
        setAppleLoading(false);
        return;
      }

      const { error, cancelled } = await signInWithAppleAuth(supabase, postLoginPath);

      if (cancelled) {
        setAppleLoading(false);
        return;
      }

      if (error) {
        setOauthError(
          error.message || "Não foi possível iniciar o login com Apple."
        );
        setAppleLoading(false);
        return;
      }
    } catch (error) {
      console.error("handleApple:", error);
      setOauthError(formatNativeAppleError(error));
      setAppleLoading(false);
    }
  }

  async function handleGoogle() {
    setOauthLoading(true);
    setOauthError("");

    try {
      const supabase = createClient();
      if (!supabase) {
        setOauthError("Serviço indisponível. Tente novamente.");
        return;
      }

      const { error, cancelled } = await signInWithGoogleOAuth(
        supabase,
        postLoginPath
      );

      if (cancelled) {
        return;
      }

      if (error) {
        setOauthError(
          error.message || "Não foi possível iniciar o login com Google."
        );
      }
    } catch (error) {
      console.error("handleGoogle:", error);
      setOauthError(formatNativeGoogleError(error));
    } finally {
      setOauthLoading(false);
    }
  }

  async function sendCode(isResend = false) {
    setPhoneError("");
    setCodeError("");

    if (digits.length !== 11) {
      setPhoneError("Digite um número válido com DDD e 9 dígitos.");
      return;
    }

    if (isResend && resendCount >= 3) {
      setCodeError("Muitas tentativas. Aguarde alguns minutos.");
      return;
    }

    setSendingCode(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: phoneE164 });
    setSendingCode(false);

    if (error) {
      setPhoneError("Falha ao enviar SMS. Verifique o número e tente novamente.");
      setCodeError("Falha ao reenviar SMS. Tente novamente.");
      return;
    }

    if (isResend) setResendCount((current) => current + 1);
    setResendSeconds(30);
    setScreen("code");
    setTimeout(() => inputsRef.current[0]?.focus(), 50);
  }

  async function verifyCode() {
    setCodeError("");
    setVerifying(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      phone: phoneE164,
      token: codeValue,
      type: "sms",
    });
    setVerifying(false);

    if (error) {
      setCode(["", "", "", "", "", ""]);
      setCodeError(
        error.message?.toLowerCase().includes("expired")
          ? "Código expirado. Solicite um novo código."
          : "Código incorreto. Tente novamente."
      );
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
      return;
    }

    const {
      data: { user: verifiedUser },
    } = await supabase.auth.getUser();
    if (verifiedUser) {
      await ensurePerfil(supabase, verifiedUser);
    }

    if (compact && onLoginSuccess) {
      onLoginSuccess();
      return;
    }

    setScreen("success");
    setTimeout(() => router.push(postLoginPath), 1500);
  }

  function updateCode(index, value) {
    const digits = value.replace(/\D/g, "");
    if (digits.length > 1 && applyOtpDigits(digits)) return;

    const digit = digits.slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setCodeError("");
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  }

  function handleCodeKeyDown(index, event) {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event) {
    if (!applyOtpDigits(event.clipboardData.getData("text"))) return;
    event.preventDefault();
  }

  function resetPhone() {
    setScreen("phone");
    setCode(["", "", "", "", "", ""]);
    setCodeError("");
    setResendSeconds(30);
    setResendCount(0);
  }

  if (screen === "success") {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#d4ede8] text-3xl font-bold text-[#1a4a3a]">
          ✓
        </div>
        <h2 className="mt-5 text-xl font-bold text-[#1a2e28]">Pronto para explorar!</h2>
        <p className="mt-2 text-sm text-[#5a6b66]">Abrindo o guia…</p>
      </div>
    );
  }

  if (screen === "phone") {
    return (
      <div className="pb-2">
        <button type="button" onClick={() => setScreen("main")} className={backLinkClass}>
          <IconBack className="h-4 w-4" />
          Voltar
        </button>
        <h2 className={titleClass}>Seu celular</h2>
        <p className={subtitleClass}>Enviaremos um código de 6 dígitos por SMS.</p>
        <label htmlFor="auth-phone" className="sr-only">
          Telefone com DDD
        </label>
        <input
          id="auth-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => {
            setPhone(formatPhone(event.target.value));
            setPhoneError("");
          }}
          placeholder={SITE_CONTACT_PHONE_DISPLAY}
          className={inputClass}
        />
        {phoneError && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {phoneError}
          </p>
        )}
        <button
          type="button"
          disabled={digits.length !== 11 || sendingCode}
          onClick={() => sendCode(false)}
          className={`${ctaBtn} mt-5`}
        >
          {sendingCode ? "Enviando..." : "Enviar código"}
        </button>
      </div>
    );
  }

  if (screen === "code") {
    const complete = code.every(Boolean);
    const maxResends = resendCount >= 3;

    return (
      <div className="pb-2">
        <button type="button" onClick={resetPhone} className={backLinkClass}>
          <IconBack className="h-4 w-4" />
          Usar outro número
        </button>
        <h2 className={titleClass}>Código SMS</h2>
        <p className={subtitleClass}>Enviamos para {phone}</p>

        <div
          className={`mt-6 grid w-full grid-cols-6 ${compact ? "gap-1" : "gap-1.5"}`}
          onPaste={handlePaste}
          role="group"
          aria-label="Código de 6 dígitos"
        >
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputsRef.current[index] = node;
              }}
              value={digit}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Dígito ${index + 1}`}
              maxLength={1}
              onChange={(event) => updateCode(index, event.target.value)}
              onKeyDown={(event) => handleCodeKeyDown(index, event)}
              className={`aspect-square w-full min-w-0 max-h-12 rounded-xl border bg-white text-center font-bold text-[#1a2e28] outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/30 ${
                compact ? "text-base" : "text-lg"
              } ${
                codeError
                  ? "border-red-400"
                  : digit
                    ? "border-[#1a4a3a]"
                    : "border-[#e3ebe7]"
              }`}
            />
          ))}
        </div>

        {codeError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {codeError}
          </p>
        )}

        {complete && (
          <button
            type="button"
            disabled={verifying}
            onClick={verifyCode}
            className={`${ctaBtn} mt-5`}
          >
            {verifying ? "Verificando..." : "Confirmar e entrar"}
          </button>
        )}

        <button
          type="button"
          disabled={resendSeconds > 0 || maxResends || sendingCode}
          onClick={() => sendCode(true)}
          className="mt-5 flex min-h-11 w-full items-center justify-center text-sm font-semibold text-[#1a4a3a] disabled:opacity-50"
        >
          {maxResends
            ? "Muitas tentativas. Aguarde alguns minutos."
            : resendSeconds > 0
              ? `Reenviar em ${resendSeconds}s`
              : "Reenviar código"}
        </button>
      </div>
    );
  }

  return (
    <div>
      {hideCopy ? null : immersive ? (
        <>
          <h2 className={titleClass}>Entre e desbloqueie tudo</h2>
          <p className={subtitleClass}>
            Favoritos, busca com IA, avaliações e clima nas praias — em uma conta gratuita.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#1a4a3a]">
            <li className="rounded-full bg-[#d4ede8] px-3 py-1">Grátis para viajantes</li>
            <li className="rounded-full bg-[#f0f4f3] px-3 py-1 ring-1 ring-[#e3ebe7]">
              Sem cartão
            </li>
          </ul>
        </>
      ) : (
        <>
          {!compact && (
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1a4a3a]">
              Imbituba, SC
            </p>
          )}
          <h2 className={compact ? titleClass : `${titleClass} ${!compact ? "mt-1" : ""}`}>
            {compact ? "Entre para continuar" : "Sua conta no guia"}
          </h2>
          <p className={subtitleClass}>
            {compact
              ? "Salve favoritos, avalie lugares e use a busca com IA."
              : showAppleSignIn
                ? "Google, Apple e SMS."
                : "Google e SMS."}
          </p>
        </>
      )}

      <div className={`flex flex-col gap-3 ${hideCopy ? "" : immersive ? "mt-5" : "mt-6"}`}>
        <button
          type="button"
          disabled={socialLoading}
          onClick={handleGoogle}
          className={googleBtn}
          aria-label="Entrar com Google"
        >
          <IconGoogle />
          {oauthLoading ? "Conectando..." : "Continuar com Google"}
        </button>

        {showAppleSignIn ? (
          <AppleSignInButton
            compact={compact || immersive}
            loading={appleLoading}
            onClick={handleApple}
          />
        ) : null}

        {oauthError ? (
          <p className="text-sm text-red-600" role="alert">
            {oauthError}
          </p>
        ) : null}

        <div className="flex items-center gap-3 py-0.5">
          <div className="h-px flex-1 bg-[#e3ebe7]" />
          <span className="text-xs font-medium text-[#9aa8a3]">ou</span>
          <div className="h-px flex-1 bg-[#e3ebe7]" />
        </div>

        <button
          type="button"
          onClick={() => setScreen("phone")}
          className={smsBtn}
          aria-label="Entrar com SMS"
        >
          <IconMessage />
          Continuar com SMS
        </button>
      </div>

      {compact && (
        <div className="mt-5">
          <LegalConsentLine />
        </div>
      )}
    </div>
  );
}
