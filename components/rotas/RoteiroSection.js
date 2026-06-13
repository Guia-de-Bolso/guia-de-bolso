"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginModal from "@/components/LoginModal";
import DailyLimitCountdown from "@/components/DailyLimitCountdown";
import PremiumPaywallSheet from "@/components/PremiumPaywallSheet";
import RoteiroBottomSheet from "@/components/RoteiroBottomSheet";
import { canUseRoteiro, isDailyRoteiroLimitReached } from "@/lib/premium";
import RoteiroItineraryView from "@/components/rotas/RoteiroItineraryView";
import { fetchLugaresFromApi } from "@/lib/fetchLugaresApi";
import { formatDiasViagem } from "@/lib/roteiroDias";
import { createClient } from "@/lib/supabase";
import { LIMITS } from "@/lib/premium";
import {
  clearRoteiroDraft,
  hasRoteiroDraft,
  loadRoteiroDraft,
} from "@/lib/roteiroDraft";
import { usePremiumUsage } from "@/lib/usePremiumUsage";

/**
 * Formata data ISO para exibição em pt-BR (fuso America/Sao_Paulo).
 * @param {string} [iso] - Data em ISO 8601.
 * @returns {string} Data formatada ou string vazia.
 */
function formatData(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

/**
 * Modal de leitura de um roteiro salvo (título, data e conteúdo em markdown).
 * @param {object} props
 * @param {{ id?: string, titulo: string, created_at?: string, conteudo?: string }|null} props.roteiro - Roteiro a exibir; null fecha o modal.
 * @param {() => void} props.onClose - Fecha o modal.
 * @param {(id: string) => Promise<boolean>} [props.onExcluir] - Remove roteiro no servidor e na lista.
 * @returns {import("react").JSX.Element|null}
 */
function RoteiroViewModal({ roteiro, onClose, onExcluir, lugaresCatalog = [] }) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");

  if (!roteiro) return null;

  const diasLabel = roteiro.diasLabel || formatDiasViagem(roteiro.dias);
  const interesses = Array.isArray(roteiro.interesses) ? roteiro.interesses : [];

  /**
   * @returns {Promise<void>}
   */
  async function handleConfirmarExclusao() {
    if (!roteiro.id || !onExcluir) return;
    setExcluindo(true);
    setErroExclusao("");
    const ok = await onExcluir(roteiro.id);
    setExcluindo(false);
    if (!ok) {
      setErroExclusao("Não foi possível excluir o roteiro. Tente novamente.");
      return;
    }
    setConfirmandoExclusao(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-[24px] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="roteiro-view-title"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-gray-200" />
        <div className="shrink-0 border-b border-[#e8eeee] px-5 py-3">
          <h2 id="roteiro-view-title" className="font-display text-lg font-extrabold text-[#1a2e28]">
            {roteiro.titulo}
          </h2>
          <p className="mt-1 text-xs text-[#5a6b66]">
            {formatData(roteiro.created_at)}
            {diasLabel ? ` · ${diasLabel}` : ""}
            {roteiro.perfil ? ` · ${roteiro.perfil}` : ""}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <RoteiroItineraryView
            conteudo={roteiro.conteudo}
            diasLabel={diasLabel}
            perfil={roteiro.perfil}
            interesses={interesses}
            lugaresCatalog={lugaresCatalog}
            compactHeader
          />
        </div>
        <div className="shrink-0 border-t border-[#e8eeee] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
          {erroExclusao ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {erroExclusao}
            </p>
          ) : null}
          {confirmandoExclusao ? (
            <>
              <p className="text-center text-sm text-[#5a6b66]">
                Excluir &ldquo;{roteiro.titulo}&rdquo;? Esta ação não pode ser desfeita.
              </p>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                disabled={excluindo}
                className="w-full rounded-xl bg-[#d9534f] py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {excluindo ? "Excluindo..." : "Sim, excluir"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(false)}
                disabled={excluindo}
                className="w-full rounded-xl bg-[#f0f4f3] py-3 text-sm font-semibold text-[#5a6b66]"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-[#1a4a3a] py-3 text-sm font-semibold text-white"
              >
                Fechar
              </button>
              {roteiro.id && onExcluir ? (
                <button
                  type="button"
                  onClick={() => {
                    setErroExclusao("");
                    setConfirmandoExclusao(true);
                  }}
                  className="w-full rounded-xl border border-red-200 bg-white py-3 text-sm font-semibold text-[#d9534f]"
                >
                  Excluir roteiro
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Seção da home de rotas: CTA de roteiro com IA, lista de roteiros salvos e modais de login/paywall.
 * @param {object} props
 * @param {Array<{ id?: string, titulo: string, created_at?: string, conteudo?: string }>} [props.roteirosIniciais=[]] - Roteiros pré-carregados do servidor.
 * @returns {import("react").JSX.Element}
 */
export default function RoteiroSection({ roteirosIniciais = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingCriar, setPendingCriar] = useState(false);
  const [user, setUser] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [roteiros, setRoteiros] = useState(roteirosIniciais);
  const [roteiroVisualizando, setRoteiroVisualizando] = useState(null);
  const [lugaresCatalog, setLugaresCatalog] = useState([]);
  const [draftPendente, setDraftPendente] = useState(false);
  const [resumeDraftOnOpen, setResumeDraftOnOpen] = useState(false);

  const {
    usage,
    loading: usageLoading,
    synced: usageSynced,
    refresh: refreshUsage,
    setUsage: setPremiumUsage,
  } = usePremiumUsage(user);

  const loggedIn = Boolean(user);

  useEffect(() => {
    setRoteiros(roteirosIniciais);
  }, [roteirosIniciais]);

  useEffect(() => {
    const temDraft = hasRoteiroDraft();
    setDraftPendente(temDraft);

    if (temDraft && searchParams.get("resumeRoteiro") === "1") {
      setResumeDraftOnOpen(true);
      setSheetOpen(true);
    }
  }, [searchParams]);

  function refreshDraftState() {
    setDraftPendente(hasRoteiroDraft());
  }

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session?.user) {
        setLoginOpen(false);
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    fetchLugaresFromApi({ limit: 120 })
      .then((data) => {
        if (cancelled) return;
        setLugaresCatalog(
          (data ?? []).map((lugar) => ({
            id: String(lugar.id),
            nome: lugar.nome,
            imagem_url: lugar.imagem_url ?? null,
            fotos: lugar.fotos ?? null,
            ehParceiro: Boolean(lugar.eh_parceiro),
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setLugaresCatalog([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Insere ou atualiza um roteiro no topo da lista local após salvar no sheet.
   * @param {{ id?: string }|null|undefined} novoRoteiro - Roteiro retornado pela API.
   */
  function handleRoteiroSalvo(novoRoteiro) {
    if (!novoRoteiro) return;
    clearRoteiroDraft();
    refreshDraftState();
    setRoteiros((atual) => [
      novoRoteiro,
      ...atual.filter((item) => item.id !== novoRoteiro.id),
    ]);
    setSheetOpen(false);
    setRoteiroVisualizando(novoRoteiro);
  }

  /**
   * Remove roteiro salvo do Supabase e da lista local.
   * @param {string} roteiroId
   * @returns {Promise<boolean>}
   */
  async function handleExcluirRoteiro(roteiroId) {
    if (!user || !roteiroId) return false;

    try {
      const res = await fetch(`/api/roteiro/${encodeURIComponent(String(roteiroId))}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("Erro ao excluir roteiro:", body?.error || res.status);
        return false;
      }

      const body = await res.json().catch(() => ({}));
      if (!body?.success) return false;

      const idStr = String(roteiroId);
      setRoteiros((atual) => atual.filter((item) => String(item.id) !== idStr));
      if (roteiroVisualizando && String(roteiroVisualizando.id) === idStr) {
        setRoteiroVisualizando(null);
      }
      return true;
    } catch (err) {
      console.error("Erro ao excluir roteiro:", err);
      return false;
    }
  }

  /**
   * Abre o sheet após login confirmado (sem re-checar autenticação).
   */
  const abrirSheetSePermitido = useCallback(async () => {
    let usageForGate = usage;
    let usageSyncedForGate = usageSynced;

    if (!usageSynced || usageLoading) {
      usageForGate = (await refreshUsage()) ?? usage;
      usageSyncedForGate = true;
    }

    const access = canUseRoteiro(usageForGate, true, {
      synced: usageSyncedForGate,
    });

    if (!access.allowed) {
      if (access.code === "LIMIT_REACHED") {
        setPaywallOpen(true);
      } else if (access.code === "LOGIN_REQUIRED") {
        setPendingCriar(true);
        setLoginOpen(true);
      }
      return;
    }

    setResumeDraftOnOpen(false);
    setSheetOpen(true);
  }, [usage, usageSynced, usageLoading, refreshUsage]);

  function abrirSheetComRascunho() {
    setResumeDraftOnOpen(true);
    setSheetOpen(true);
  }

  function abrirSheetNovo() {
    setResumeDraftOnOpen(false);
    setSheetOpen(true);
  }

  /**
   * Abre o sheet de criação ou exibe login/paywall conforme sessão e limites premium.
   */
  async function handleAbrirCriar() {
    if (!user) {
      setPendingCriar(true);
      setLoginOpen(true);
      return;
    }

    await abrirSheetSePermitido();
  }

  useEffect(() => {
    if (!pendingCriar || !user) return undefined;

    setPendingCriar(false);
    void abrirSheetSePermitido();

    return undefined;
  }, [pendingCriar, user, abrirSheetSePermitido]);

  const roteiroLimiteDiarioAtingido = loggedIn && isDailyRoteiroLimitReached(usage);

  return (
    <>
      {draftPendente && !sheetOpen && (
        <section className="mb-4 overflow-hidden rounded-2xl border border-[#cfe5dd] bg-white p-4 shadow-sm ring-1 ring-[#e8eeee]">
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d4ede8] text-lg"
              aria-hidden
            >
              ✨
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-[#1a2e28]">Roteiro não salvo</h2>
              <p className="mt-1 text-xs leading-relaxed text-[#5a6b66]">
                {loadRoteiroDraft()?.titulo || "Seu roteiro gerado ainda está disponível."}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={abrirSheetComRascunho}
              className="flex-1 rounded-xl bg-[#1a4a3a] py-2.5 text-sm font-semibold text-white"
            >
              Continuar roteiro
            </button>
            <button
              type="button"
              onClick={() => {
                clearRoteiroDraft();
                refreshDraftState();
              }}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#5a6b66]"
            >
              Descartar
            </button>
          </div>
        </section>
      )}

      <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-emerald-900 p-5 text-white shadow-sm">
        <span className="text-2xl" aria-hidden>
          ✨
        </span>
        <h2 className="mt-2 text-xl font-bold leading-tight">Roteiro personalizado com IA</h2>
        <p className="mt-1 text-sm text-emerald-100/90">
          Monte seu roteiro ideal em segundos
        </p>
        {loggedIn && (
          <p className="mt-2 text-xs text-emerald-100/80">
            {usageLoading && !usage
              ? "Carregando uso de IA…"
              : usage?.premium
                ? "✨ Premium — roteiros com IA ilimitados"
                : `${usage?.roteiros?.used ?? 0}/${usage?.roteiros?.limit ?? LIMITS.roteiro} roteiros gratuitos hoje`}
          </p>
        )}
        {roteiroLimiteDiarioAtingido && (
          <div className="mt-3 rounded-xl bg-white/10 px-3 py-2">
            <DailyLimitCountdown
              compact
              prefix="Novos roteiros em"
              className="text-xs text-emerald-50"
              initialMs={usage?.msUntilReset}
            />
          </div>
        )}
        <button
          type="button"
          onClick={handleAbrirCriar}
          className="mt-4 w-full rounded-xl bg-[#1a4a3a] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#153d30]"
        >
          Criar roteiro
        </button>
      </section>

      {loggedIn && roteiros.length === 0 && (
        <section className="mb-6 rounded-2xl bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d4ede8] text-[#1a4a3a]">
            <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#1a2e28]">Nenhum roteiro salvo ainda</h2>
          <p className="mt-2 text-sm text-[#5a6b66]">
            Monte seu primeiro roteiro personalizado com IA.
          </p>
          <button
            type="button"
            onClick={handleAbrirCriar}
            className="mt-5 w-full rounded-xl bg-[#1a4a3a] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#153d30]"
          >
            Criar meu primeiro roteiro
          </button>
        </section>
      )}

      {loggedIn && roteiros.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-bold text-[#1a2e28]">Meus roteiros</h2>
          <div className="grid gap-3">
            {roteiros.map((roteiro) => (
              <article
                key={roteiro.id ?? roteiro.created_at}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-gray-950">{roteiro.titulo}</h3>
                  <p className="mt-0.5 text-xs text-gray-500">{formatData(roteiro.created_at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRoteiroVisualizando(roteiro)}
                  className="shrink-0 rounded-full bg-[#1a4a3a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#153d30]"
                >
                  Ver
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <RoteiroBottomSheet
        isOpen={sheetOpen}
        resumeDraft={resumeDraftOnOpen}
        onClose={() => {
          setSheetOpen(false);
          setResumeDraftOnOpen(false);
          refreshDraftState();
        }}
        isLoggedIn={loggedIn}
        onLoginRequired={() => {
          setPendingCriar(true);
          setLoginOpen(true);
        }}
        onLimitReached={() => setPaywallOpen(true)}
        onRoteiroSalvo={handleRoteiroSalvo}
        onUsageRefresh={(nextUsage) => {
          if (nextUsage) setPremiumUsage(nextUsage);
          else refreshUsage();
        }}
      />

      <LoginModal
        isOpen={loginOpen}
        motivo="rotas"
        redirectAfterLogin="/rotas"
        onClose={() => {
          setPendingCriar(false);
          setLoginOpen(false);
        }}
        onLoginSuccess={() => {
          setPendingCriar(true);
          setLoginOpen(false);
        }}
      />

      <PremiumPaywallSheet
        isOpen={paywallOpen}
        feature="roteiro"
        onClose={() => setPaywallOpen(false)}
      />

      <RoteiroViewModal
        roteiro={roteiroVisualizando}
        onClose={() => setRoteiroVisualizando(null)}
        onExcluir={loggedIn ? handleExcluirRoteiro : undefined}
        lugaresCatalog={lugaresCatalog}
      />
    </>
  );
}
