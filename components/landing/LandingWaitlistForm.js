"use client";

import Link from "next/link";
import { useId, useState } from "react";
import LandingButton from "@/components/landing/LandingButton";
import { mapApiErrorResponse, USER_MESSAGES } from "@/lib/userMessages";
import { WAITLIST_MESSAGES } from "@/lib/waitlist";

/** @typedef {"hero" | "dark"} LandingWaitlistVariant */

const VARIANT_STYLES = {
  hero: {
    wrapper: "mt-8 max-w-md border-t border-white/20 pt-8 sm:mt-10",
    kicker: "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7fd4ae]",
    title: "mt-2 font-display text-lg font-semibold tracking-tight text-white",
    hint: "mt-1 text-sm leading-relaxed text-white/70",
    input:
      "h-12 w-full rounded-2xl border border-white/20 bg-white/10 px-4 text-[15px] text-white placeholder:text-white/45 backdrop-blur-sm transition-colors focus:border-[#7fd4ae]/60 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#7fd4ae]/25",
    label: "mb-2 block text-xs font-medium text-white/75",
    checkboxLabel: "text-xs leading-relaxed text-white/75",
    checkboxLink: "text-[#9de3c2] underline-offset-2 hover:underline",
    success: "text-sm font-medium text-[#9de3c2]",
    error: "text-sm text-[#ffb4a8]",
    submitClass: "",
  },
  dark: {
    wrapper: "relative mx-auto mt-10 max-w-md text-center",
    kicker: "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7fd4ae]",
    title: "mt-2 font-display text-xl font-semibold tracking-tight text-white",
    hint: "mx-auto mt-1 max-w-sm text-sm leading-relaxed text-white/65",
    input:
      "h-12 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-left text-[15px] text-white placeholder:text-white/45 backdrop-blur-sm transition-colors focus:border-[#7fd4ae]/60 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#7fd4ae]/25",
    label: "mb-2 block text-left text-xs font-medium text-white/75",
    checkboxLabel: "text-xs leading-relaxed text-white/75",
    checkboxLink: "text-[#9de3c2] underline-offset-2 hover:underline",
    success: "text-sm font-medium text-[#9de3c2]",
    error: "text-sm text-[#ffb4a8]",
    submitClass: "!w-full !bg-white !text-[#1a4a3a] hover:!bg-[#f0f4f3]",
  },
};

/**
 * Formulário inline da lista de espera (landing).
 * @param {object} props
 * @param {LandingWaitlistVariant} [props.variant]
 * @param {string} [props.origem]
 * @param {string} [props.id]
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function LandingWaitlistForm({
  variant = "hero",
  origem = "landing-hero",
  id = "lista-espera",
  className = "",
}) {
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.hero;
  const emailId = useId();
  const lgpdId = useId();
  const statusId = useId();

  const [email, setEmail] = useState("");
  const [lgpdAceito, setLgpdAceito] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  /**
   * @param {import('react').FormEvent<HTMLFormElement>} event
   * @returns {Promise<void>}
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    if (!email.trim()) {
      setErro(WAITLIST_MESSAGES.EMAIL_REQUIRED);
      return;
    }

    if (!lgpdAceito) {
      setErro(WAITLIST_MESSAGES.LGPD_REQUIRED);
      return;
    }

    setEnviando(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          lgpd_aceito: lgpdAceito,
          origem,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const mapped = mapApiErrorResponse(data, response.status);
        setErro(mapped.message);
        return;
      }

      setSucesso(true);
      setMensagem(data.message ?? WAITLIST_MESSAGES.SUCCESS);
      setEmail("");
      setLgpdAceito(false);
    } catch {
      setErro(USER_MESSAGES.NETWORK);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div id={id} className={`${styles.wrapper} ${className}`.trim()}>
      <p className={styles.kicker}>Em breve nas lojas</p>
      <h3 className={styles.title}>Avise-me sobre o lançamento</h3>
      <p className={styles.hint}>
        Entre na lista e receba um e-mail quando o app estiver disponível para download.
      </p>

      {sucesso ? (
        <p
          id={statusId}
          role="status"
          className={`mt-5 rounded-2xl border border-[#7fd4ae]/30 bg-[#7fd4ae]/10 px-4 py-3 ${styles.success}`}
        >
          {mensagem}
        </p>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor={emailId} className={styles.label}>
              Seu e-mail
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={enviando}
              className={styles.input}
              required
            />
          </div>

          <label htmlFor={lgpdId} className="flex cursor-pointer items-start gap-3 text-left">
            <input
              id={lgpdId}
              name="lgpd_aceito"
              type="checkbox"
              checked={lgpdAceito}
              onChange={(event) => setLgpdAceito(event.target.checked)}
              disabled={enviando}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-white/10 text-[#1a4a3a] focus:ring-[#7fd4ae]/40"
              required
            />
            <span className={styles.checkboxLabel}>
              Aceito receber novidades sobre o lançamento do Guia de Bolso e concordo com a{" "}
              <Link href="/privacidade" className={styles.checkboxLink}>
                Política de Privacidade
              </Link>
              .
            </span>
          </label>

          <LandingButton
            type="submit"
            variant={variant === "dark" ? "primary" : "primary"}
            size="lg"
            disabled={enviando}
            className={`!min-w-0 !w-full sm:!w-auto ${styles.submitClass}`}
            aria-describedby={erro ? statusId : undefined}
          >
            {enviando ? "Cadastrando…" : "Avise-me sobre o lançamento"}
          </LandingButton>

          {erro ? (
            <p id={statusId} role="alert" className={styles.error}>
              {erro}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
