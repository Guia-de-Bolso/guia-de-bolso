"use client";

import { useEffect, useId, useState } from "react";
import PerfilBottomSheet from "@/components/perfil/PerfilBottomSheet";
import UserErrorAlert from "@/components/UserErrorAlert";
import { FEEDBACK_TIPOS } from "@/lib/feedback";
import { buildReportContext } from "@/lib/reportContext";
import { mapApiErrorResponse, USER_MESSAGES } from "@/lib/userMessages";
import { fetchApi } from "@/lib/fetchApi";

/**
 * @param {object} [initial]
 * @param {string} [initial.tipo]
 * @param {string} [initial.mensagem]
 * @param {string} [initial.assunto]
 * @param {object} [initial.contexto_tecnico]
 * @param {{ nome?: string, email?: string }} [initial.contato]
 */
function getInitialState(initial) {
  return {
    tipo: initial?.tipo ?? "sugestao",
    assunto: initial?.assunto ?? "",
    mensagem: initial?.mensagem ?? "",
    nome: initial?.contato?.nome ?? "",
    email: initial?.contato?.email ?? "",
    contexto: initial?.contexto_tecnico ?? null,
  };
}

/**
 * Sheet de envio de feedback.
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {boolean} [props.isLoggedIn]
 * @param {object} [props.initial] - Pré-preenchimento (ex.: reporte de erro).
 * @returns {import("react").ReactElement|null}
 */
export default function FeedbackSheet({ isOpen, onClose, isLoggedIn = false, initial }) {
  const detailsId = useId();
  const [form, setForm] = useState(() => getInitialState(initial));
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setForm(getInitialState(initial));
    setSucesso(false);
    setErro("");
    setEnviando(false);
  }, [isOpen, initial]);

  /**
   * @returns {Promise<void>}
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setEnviando(true);

    try {
      const paginaOrigem =
        typeof window !== "undefined" ? window.location.pathname : null;

      const response = await fetchApi("/api/feedback", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: form.tipo,
          assunto: form.assunto,
          mensagem: form.mensagem,
          nome_contato: form.nome,
          email_contato: form.email,
          pagina_origem: paginaOrigem,
          contexto_tecnico:
            form.contexto ??
            buildReportContext({
              route: paginaOrigem,
              code: "feedback_form",
            }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const mapped = mapApiErrorResponse(data, response.status);
        setErro(mapped.message);
        return;
      }

      setSucesso(true);
    } catch {
      setErro(USER_MESSAGES.NETWORK);
    } finally {
      setEnviando(false);
    }
  }

  if (!isOpen) return null;

  return (
    <PerfilBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={sucesso ? "Obrigado!" : "Enviar feedback"}
    >
      {sucesso ? (
        <div className="pb-4 text-center">
          <p className="text-4xl" aria-hidden>
            ✓
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#5a6b66]">
            {USER_MESSAGES.FEEDBACK_SUCCESS} Sua mensagem ajuda a melhorar o Guia de Bolso.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#1a4a3a] text-sm font-semibold text-white"
          >
            Fechar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pb-2">
          <p className="text-sm text-[#5a6b66]">
            Conte sugestões, dúvidas, elogios ou problemas que encontrou no app.
          </p>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#5a6b66]">
              Tipo
            </p>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_TIPOS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tipo: item.id }))}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    form.tipo === item.id
                      ? "bg-[#1a4a3a] text-white"
                      : "bg-[#f0f4f3] text-[#1a4a3a] ring-1 ring-[#e3ebe7]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-[#5a6b66]">
              Assunto (opcional)
            </span>
            <input
              type="text"
              maxLength={120}
              value={form.assunto}
              onChange={(e) => setForm((f) => ({ ...f, assunto: e.target.value }))}
              className="mt-1.5 w-full rounded-2xl border border-[#e3ebe7] bg-white px-4 py-3 text-sm text-[#1a2e28] outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/25"
              placeholder="Resumo em uma linha"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-[#5a6b66]">
              Mensagem *
            </span>
            <textarea
              required
              minLength={10}
              maxLength={4000}
              rows={5}
              value={form.mensagem}
              onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))}
              className="mt-1.5 w-full resize-y rounded-2xl border border-[#e3ebe7] bg-white px-4 py-3 text-sm text-[#1a2e28] outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/25"
              placeholder="Descreva com o máximo de detalhes que puder"
            />
          </label>

          {!isLoggedIn && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-[#5a6b66]">
                  Seu nome (opcional)
                </span>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="mt-1.5 w-full rounded-2xl border border-[#e3ebe7] bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/25"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-[#5a6b66]">
                  E-mail (opcional)
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1.5 w-full rounded-2xl border border-[#e3ebe7] bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/25"
                  placeholder="para resposta"
                />
              </label>
            </div>
          )}

          {form.contexto ? (
            <details className="rounded-2xl bg-[#f0f4f3] px-4 py-3 text-xs text-[#5a6b66]">
              <summary className="cursor-pointer font-semibold text-[#1a4a3a]">
                Detalhes para suporte
              </summary>
              <pre
                id={detailsId}
                className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px]"
              >
                {JSON.stringify(form.contexto, null, 2)}
              </pre>
            </details>
          ) : null}

          {erro ? (
            <UserErrorAlert message={erro} showReportHint={false} />
          ) : null}

          <button
            type="submit"
            disabled={enviando || form.mensagem.trim().length < 10}
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#1a4a3a] text-sm font-semibold text-white disabled:opacity-60"
          >
            {enviando ? "Enviando..." : "Enviar feedback"}
          </button>
        </form>
      )}
    </PerfilBottomSheet>
  );
}
