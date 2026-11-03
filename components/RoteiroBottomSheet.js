"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BottomSheetShell from "@/components/BottomSheetShell";
import Logo from "@/components/Logo";
import RoteiroItineraryView from "@/components/atrativos/RoteiroItineraryView";

import UserErrorAlert from "@/components/UserErrorAlert";
import { ROTEIRO_RETURN_PATH, clearRoteiroDraft, loadRoteiroDraft, saveRoteiroDraft } from "@/lib/roteiroDraft";
import {
  ROTEIRO_DIAS_EXTENDED_MIN,
  ROTEIRO_DIAS_EXTENDED_OPCOES,
  ROTEIRO_DIAS_OPCOES,
  formatDiasOpcaoLabel,
  isDiasExtendedOpcao,
  resolveDiasParaRoteiro,
  splitDiasFormState,
} from "@/lib/roteiroDias";
import {
  ROTEIRO_GASTRONOMIA_TIPOS,
  isGastronomiaInteresseAtivo,
} from "@/lib/roteiroGastronomia";
import { mergeRoteiroCatalogos } from "@/lib/roteiroCatalog";
import {
  ROTEIRO_PERFIL_MAX,
  buildTituloRoteiro,
  limitarPerfilRoteiro,
  sanitizePerfilRoteiro,
} from "@/lib/roteiroPerfil";
import { buildReportContext } from "@/lib/reportContext";
import {
  getNetworkErrorMessage,
  getUserMessage,
  mapApiErrorResponse,
} from "@/lib/userMessages";
import { fetchApi } from "@/lib/fetchApi";

const DIAS_OPCOES = ROTEIRO_DIAS_OPCOES;

const PERFIS = [
  { id: "familia", label: "Família com crianças", emoji: "👨‍👩‍👧" },
  { id: "casal", label: "Casal", emoji: "💑" },
  { id: "solo", label: "Solo", emoji: "🧍" },
  { id: "grupo", label: "Grupo de amigos", emoji: "👥" },
];

const INTERESSES_OPCOES = [
  "Praias",
  "Trilhas",
  "Gastronomia",
  "Vida noturna",
  "Cultura",
  "Aventura",
  "Bem-estar",
];

const LOADING_MESSAGES = [
  "Consultando os melhores lugares...",
  "Montando seu roteiro personalizado...",
  "Organizando paradas e horários...",
  "Quase pronto...",
];

/**
 * Estado de carregamento da geração de roteiro com IA.
 * @param {object} props
 * @param {string} props.message
 * @returns {import("react").JSX.Element}
 */
function RoteiroLoadingView({ message }) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center px-4 py-10 text-center">
      <Logo size="sm" className="mx-auto opacity-90" />
      <div className="roteiro-progress-track mt-8 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#e8eeee]">
        <div className="roteiro-progress-bar h-full w-1/3 rounded-full bg-[#1a4a3a]" />
      </div>
      <p
        key={message}
        className="roteiro-loading-message mt-6 text-base font-semibold text-[#1a2e28]"
      >
        {message}
      </p>
      <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-[#5a6b66]">
        A IA está montando o melhor roteiro para você. Isso leva cerca de 15–30
        segundos.
      </p>
      <style>{`
        @keyframes roteiroProgress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes roteiroMessageIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .roteiro-progress-bar {
          animation: roteiroProgress 1.4s ease-in-out infinite;
        }
        .roteiro-loading-message {
          animation: roteiroMessageIn 0.35s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .roteiro-progress-bar {
            animation: none;
            width: 66%;
            margin-left: auto;
            margin-right: auto;
          }
          .roteiro-loading-message {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * RoteiroBottomSheet - Multi-step bottom sheet to create and save AI itineraries.
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the sheet is visible.
 * @param {() => void} props.onClose - Called when the sheet is dismissed.
 * @param {boolean} props.isLoggedIn - Whether the user is authenticated.
 * @param {() => void} [props.onLoginRequired] - Called when login is required.
 * @param {() => void} [props.onLimitReached] - Called when free tier limit is reached.
 * @param {() => Promise<boolean>} [props.onValidateBeforeGenerate] - Gate client-side antes de chamar a API.
 * @param {(usage: object|null) => void} [props.onUsageRefresh] - Called after generation with updated usage.
 * @param {(roteiro: object) => void} [props.onRoteiroSalvo] - Called after a successful save.
 * @param {boolean} [props.resumeDraft=false] - Restaura rascunho não salvo ao abrir.
 * @param {Array<object>} [props.catalogoReferencia] - Lugares da listagem, para foto e mapa.
 * @returns {import('react').ReactElement|null}
 */
export default function RoteiroBottomSheet({
  isOpen,
  onClose,
  isLoggedIn,
  onLoginRequired,
  onLimitReached,
  onValidateBeforeGenerate,
  onUsageRefresh,
  onRoteiroSalvo,
  resumeDraft = false,
  catalogoReferencia = [],
}) {
  const [diasOpcao, setDiasOpcao] = useState("");
  const [diasExatos, setDiasExatos] = useState(null);
  const [dias, setDias] = useState("");
  const [perfil, setPerfil] = useState("");
  const [perfilLivre, setPerfilLivre] = useState("");
  const [perfilLivreAtivo, setPerfilLivreAtivo] = useState(false);
  const [interesses, setInteresses] = useState([]);
  const [tiposGastronomia, setTiposGastronomia] = useState([]);
  const [view, setView] = useState("form");
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [lugaresCatalog, setLugaresCatalog] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [erroContext, setErroContext] = useState(null);
  const scrollRef = useRef(null);

  const diasResolvido = resolveDiasParaRoteiro(diasOpcao, diasExatos);
  const gastronomiaAtiva = isGastronomiaInteresseAtivo(interesses);
  const perfilLimpo = sanitizePerfilRoteiro(perfil);
  const formularioCompleto = Boolean(
    diasResolvido && perfilLimpo.length >= 2 && interesses.length > 0
  );
  const catalogoVista = useMemo(
    () => mergeRoteiroCatalogos(lugaresCatalog, catalogoReferencia),
    [lugaresCatalog, catalogoReferencia]
  );

  /**
   * Restaura rascunho não salvo (ex.: após voltar do detalhe de um lugar).
   * @param {import("@/lib/roteiroDraft").RoteiroDraft} draft
   */
  function applyDraft(draft) {
    const split = splitDiasFormState(draft.dias);
    setDiasOpcao(split.dias);
    setDiasExatos(split.diasExatos);
    setDias(draft.dias ?? "");
    const perfilSalvo = draft.perfil ?? "";
    const perfilPreset = PERFIS.some((item) => item.label === perfilSalvo);
    setPerfilLivreAtivo(!perfilPreset && Boolean(perfilSalvo));
    setPerfilLivre(perfilPreset ? "" : perfilSalvo);
    setPerfil(perfilSalvo);
    setInteresses(Array.isArray(draft.interesses) ? draft.interesses : []);
    setTiposGastronomia(
      Array.isArray(draft.tiposGastronomia) ? draft.tiposGastronomia : []
    );
    setTitulo(draft.titulo ?? "");
    setConteudo(draft.conteudo ?? "");
    setLugaresCatalog(Array.isArray(draft.lugaresCatalog) ? draft.lugaresCatalog : []);
    setErro("");
    setErroContext(null);
    setView("result");
  }

  /**
   * Persiste o roteiro gerado enquanto ainda não foi salvo.
   */
  function persistDraft() {
    if (view !== "result" || !conteudo.trim()) return;
    saveRoteiroDraft({
      titulo,
      conteudo,
      dias,
      diasExatos,
      perfil: perfilLimpo,
      interesses,
      tiposGastronomia,
      lugaresCatalog,
    });
  }

  useEffect(() => {
    if (!isOpen || !resumeDraft) return undefined;

    const draft = loadRoteiroDraft();
    if (draft?.conteudo?.trim()) {
      applyDraft(draft);
    }

    return undefined;
  }, [isOpen, resumeDraft]);

  useEffect(() => {
    if (!isOpen || view !== "result" || !conteudo.trim()) return undefined;
    persistDraft();
    return undefined;
  }, [isOpen, view, titulo, conteudo, dias, diasExatos, perfil, interesses, tiposGastronomia, lugaresCatalog]);

  useEffect(() => {
    if (view !== "loading") return undefined;

    const interval = setInterval(() => {
      setLoadingMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [view]);

  /**
   * Clears form state and returns to the form view.
   * @returns {void}
   */
  function resetFormulario() {
    clearRoteiroDraft();
    setDiasOpcao("");
    setDiasExatos(null);
    setDias("");
    setPerfil("");
    setPerfilLivre("");
    setPerfilLivreAtivo(false);
    setInteresses([]);
    setTiposGastronomia([]);
    setTitulo("");
    setConteudo("");
    setLugaresCatalog([]);
    setErro("");
    setLoadingMessageIndex(0);
    setView("form");
  }

  /**
   * Closes the sheet and resets the form when not loading or saving.
   * @returns {void}
   */
  function handleClose() {
    if (loading || salvando) return;

    if (view === "result" && conteudo.trim()) {
      persistDraft();
      onClose();
      return;
    }

    resetFormulario();
    onClose();
  }

  /**
   * Atualiza a opção de dias no formulário.
   * @param {string} opcao
   */
  function handleSelectDias(opcao) {
    setDiasOpcao(opcao);

    if (isDiasExtendedOpcao(opcao)) {
      const proximo = diasExatos ?? ROTEIRO_DIAS_EXTENDED_MIN;
      setDiasExatos(proximo);
      setDias(resolveDiasParaRoteiro(opcao, proximo));
      return;
    }

    setDiasExatos(null);
    setDias(opcao);
  }

  /**
   * Define quantidade exata de dias quando "4+ dias" está selecionado.
   * @param {number} quantidade
   */
  function handleSelectDiasExatos(quantidade) {
    setDiasExatos(quantidade);
    setDias(resolveDiasParaRoteiro("4+ dias", quantidade));
  }

  /**
   * Toggles an interest chip in the selection list.
   * @param {string} item - Interest label.
   * @returns {void}
   */
  function toggleInteresse(item) {
    setInteresses((atual) => {
      const proximo = atual.includes(item)
        ? atual.filter((i) => i !== item)
        : [...atual, item];

      if (item === "Gastronomia" && atual.includes(item)) {
        setTiposGastronomia([]);
      }

      return proximo;
    });
  }

  /**
   * Toggles a gastronomy specialty chip.
   * @param {string} tag
   */
  function toggleTipoGastronomia(tag) {
    setTiposGastronomia((atual) =>
      atual.includes(tag) ? atual.filter((item) => item !== tag) : [...atual, tag]
    );
  }

  /**
   * Submits the form to the AI itinerary API and shows the result.
   * @returns {Promise<void>}
   */
  async function handleGerar() {
    if (!formularioCompleto || loading) return;

    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }

    if (onValidateBeforeGenerate) {
      const allowed = await onValidateBeforeGenerate();
      if (!allowed) return;
    }

    setErro("");
    setErroContext(null);
    setView("loading");
    setLoading(true);
    setLoadingMessageIndex(0);

    try {
      const diasEnvio = diasResolvido;
      const response = await fetchApi("/api/roteiro", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dias: diasEnvio,
          perfil: perfilLimpo,
          interesses,
          tiposGastronomia,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "LOGIN_REQUIRED") {
          onLoginRequired?.();
          setView("form");
          return;
        }
        if (data.code === "LIMIT_REACHED") {
          onUsageRefresh?.(data.usage ?? null);
          onLimitReached?.();
          setView("form");
          return;
        }
        const mapped = mapApiErrorResponse(data, response.status);
        setErro(mapped.message);
        setErroContext(
          buildReportContext({
            code: mapped.code ?? data.code,
            route: "/roteiros",
            message: mapped.message,
          })
        );
        onUsageRefresh?.(null);
        setView("form");
        return;
      }

      const tituloGerado = data.titulo ?? buildTituloRoteiro(diasEnvio, perfilLimpo);
      setTitulo(tituloGerado);
      setConteudo(data.conteudo ?? "");
      setLugaresCatalog(Array.isArray(data.lugaresCatalog) ? data.lugaresCatalog : []);
      setDias(diasEnvio);
      setView("result");
      saveRoteiroDraft({
        titulo: tituloGerado,
        conteudo: data.conteudo ?? "",
        dias: diasEnvio,
        diasExatos: isDiasExtendedOpcao(diasOpcao) ? diasExatos : null,
        perfil: perfilLimpo,
        interesses,
        tiposGastronomia,
        lugaresCatalog: Array.isArray(data.lugaresCatalog) ? data.lugaresCatalog : [],
      });
      onUsageRefresh?.(data.usage ?? null);
    } catch {
      setErro(getNetworkErrorMessage());
      setErroContext(buildReportContext({ code: "NETWORK", route: "/roteiros" }));
      onUsageRefresh?.(null);
      setView("form");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Persists the generated itinerary via the save API.
   * @returns {Promise<void>}
   */
  async function handleSalvar() {
    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }

    setSalvando(true);
    setErro("");
    setErroContext(null);

    try {
      const response = await fetchApi("/api/roteiro/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          dias,
          perfil: perfilLimpo,
          interesses,
          tiposGastronomia,
          conteudo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const mapped = mapApiErrorResponse(data, response.status);
        setErro(mapped.message);
        setErroContext(
          buildReportContext({
            code: mapped.code ?? data.code,
            route: "/roteiros",
            message: mapped.message,
          })
        );
        return;
      }

      const salvo = data.roteiro ?? {
        titulo,
        dias,
        perfil: perfilLimpo,
        interesses,
        conteudo,
        created_at: new Date().toISOString(),
      };

      const payload = {
        ...salvo,
        diasLabel: formatDiasViagem(salvo.dias ?? dias),
      };

      onRoteiroSalvo?.(payload);
      resetFormulario();
      onClose();
    } catch {
      setErro(getUserMessage("SERVER"));
      setErroContext(buildReportContext({ code: "NETWORK", route: "/roteiros" }));
    } finally {
      setSalvando(false);
    }
  }

  if (!isOpen) return null;

  const sheetFooter =
    view === "result" ? (
      <div className="shrink-0 border-t border-[#e8eeee] bg-white px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(26,46,40,0.05)]">
        {erro ? (
          <UserErrorAlert className="mb-3" message={erro} reportContext={erroContext} />
        ) : null}
        <button
          type="button"
          onClick={handleSalvar}
          disabled={salvando || !conteudo.trim()}
          aria-busy={salvando}
          className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#1a4a3a] text-[15px] font-semibold text-white transition-transform active:scale-[0.99] disabled:opacity-60"
        >
          {salvando ? "Salvando…" : "Salvar meu roteiro"}
        </button>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={resetFormulario}
            className="min-h-11 flex-1 text-sm font-semibold text-[#1a4a3a]"
          >
            Novo roteiro
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="min-h-11 flex-1 text-sm font-medium text-[#5a6b66]"
          >
            Fechar
          </button>
        </div>
      </div>
    ) : null;

  return (
    <BottomSheetShell
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabelledBy="roteiro-sheet-title"
      maxHeight="92vh"
      scrollRef={scrollRef}
      footer={sheetFooter}
    >
      <div
        className={`px-5 pt-4 ${
          view === "result"
            ? "pb-4"
            : "pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        }`}
      >
        {view === "form" && (
          <>
            <h2 id="roteiro-sheet-title" className="text-xl font-bold text-gray-950">
              Criar roteiro com IA
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Responda as perguntas para montar seu roteiro personalizado.
            </p>

                <section className="mt-6">
                  <h3 className="text-sm font-bold text-gray-800">1. Quantos dias?</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DIAS_OPCOES.map((opcao) => {
                      const selected = diasOpcao === opcao;
                      return (
                        <button
                          key={opcao}
                          type="button"
                          onClick={() => handleSelectDias(opcao)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                            selected
                              ? "bg-[#1a4a3a] text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {opcao}
                        </button>
                      );
                    })}
                  </div>

                  {isDiasExtendedOpcao(diasOpcao) ? (
                    <div className="mt-4 rounded-2xl border border-[#cfe5dd] bg-[#f7fbfa] p-4">
                      <p className="text-sm font-semibold text-[#1a2e28]">
                        Quantos dias exatamente?
                      </p>
                      <p className="mt-1 text-xs text-[#5a6b66]">
                        Escolha a duração precisa da sua viagem.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {ROTEIRO_DIAS_EXTENDED_OPCOES.map((quantidade) => {
                          const selected = diasExatos === quantidade;
                          return (
                            <button
                              key={quantidade}
                              type="button"
                              onClick={() => handleSelectDiasExatos(quantidade)}
                              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                                selected
                                  ? "bg-[#1a4a3a] text-white"
                                  : "bg-white text-gray-700 ring-1 ring-[#d8dfdc] hover:bg-gray-50"
                              }`}
                            >
                              {formatDiasOpcaoLabel(quantidade)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </section>

            <section className="mt-6">
              <h3 className="text-sm font-bold text-gray-800">2. Qual o perfil da viagem?</h3>
              <p className="mt-1 text-xs text-gray-500">
                Escolha um perfil ou descreva com suas palavras.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {PERFIS.map((item) => {
                  const selected = !perfilLivreAtivo && perfil === item.label;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setPerfilLivreAtivo(false);
                        setPerfil(item.label);
                      }}
                      className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-3 text-center text-sm font-semibold transition-colors ${
                        selected
                          ? "border-[#1a4a3a] bg-[#d4ede8] text-[#1a4a3a]"
                          : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200"
                      }`}
                    >
                      <span className="text-2xl" aria-hidden>
                        {item.emoji}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                aria-pressed={perfilLivreAtivo}
                onClick={() => {
                  setPerfilLivreAtivo(true);
                  setPerfil(perfilLivre);
                }}
                className={`mt-2 flex min-h-14 w-full flex-col items-start justify-center rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                  perfilLivreAtivo
                    ? "border-[#1a4a3a] bg-[#d4ede8] text-[#1a4a3a]"
                    : "border-gray-100 bg-gray-50 text-gray-700"
                }`}
              >
                <span className="text-sm font-semibold">Escrever o que eu quero</span>
                <span className="mt-0.5 text-xs font-medium text-[#5a6b66]">
                  A IA usa esse texto para montar o roteiro
                </span>
              </button>
              {perfilLivreAtivo ? (
                <div className="mt-3">
                  <label htmlFor="roteiro-perfil-livre" className="text-sm font-semibold text-[#1a2e28]">
                    Como é essa viagem?
                  </label>
                  <textarea
                    id="roteiro-perfil-livre"
                    value={perfilLivre}
                    maxLength={ROTEIRO_PERFIL_MAX}
                    rows={3}
                    placeholder="Ex.: lua de mel, viagem com cachorro, aniversário"
                    className="mt-2 w-full resize-none rounded-2xl border border-[#d8dfdc] bg-white px-3.5 py-3 text-base leading-relaxed text-[#1a2e28] outline-none ring-[#1a4a3a] placeholder:text-[#8a9994] focus:border-[#1a4a3a] focus:ring-2"
                    onChange={(event) => {
                      const next = limitarPerfilRoteiro(event.target.value);
                      setPerfilLivre(next);
                      setPerfil(next);
                    }}
                  />
                  <p className="mt-1 text-right text-xs text-[#5a6b66]">
                    {perfilLivre.length}/{ROTEIRO_PERFIL_MAX}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="mt-6">
              <h3 className="text-sm font-bold text-gray-800">3. Interesses</h3>
              <p className="mt-1 text-xs text-gray-500">Selecione um ou mais</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {INTERESSES_OPCOES.map((item) => {
                  const selected = interesses.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInteresse(item)}
                      className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                        selected
                          ? "bg-[#1a4a3a] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
                </section>

                {gastronomiaAtiva ? (
                  <section className="mt-6">
                    <h3 className="text-sm font-bold text-gray-800">Tipos de comida</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Opcional — priorize estes estilos nas refeições do roteiro
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ROTEIRO_GASTRONOMIA_TIPOS.map((item) => {
                        const selected = tiposGastronomia.includes(item.tag);
                        return (
                          <button
                            key={item.tag}
                            type="button"
                            onClick={() => toggleTipoGastronomia(item.tag)}
                            className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                              selected
                                ? "bg-[#1a4a3a] text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <span aria-hidden>{item.emoji} </span>
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {erro && (
              <UserErrorAlert
                className="mt-4"
                message={erro}
                reportContext={erroContext}
              />
            )}

            <button
              type="button"
              onClick={handleGerar}
              disabled={!formularioCompleto}
              className="mt-6 w-full rounded-xl bg-[#1a4a3a] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#153d30] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Gerar meu roteiro
            </button>
          </>
        )}

        {view === "loading" && (
          <RoteiroLoadingView message={LOADING_MESSAGES[loadingMessageIndex]} />
        )}

        {view === "result" && (
          <RoteiroItineraryView
            key={conteudo}
            conteudo={conteudo}
            titulo={titulo}
            diasLabel={dias}
            perfil={perfilLimpo}
            interesses={[...interesses, ...tiposGastronomia]}
            lugaresCatalog={catalogoVista}
            returnPath={ROTEIRO_RETURN_PATH}
            salvando={salvando}
            onSalvar={handleSalvar}
            titleId="roteiro-sheet-title"
            className="pb-2"
          />
        )}
      </div>
    </BottomSheetShell>
  );
}
