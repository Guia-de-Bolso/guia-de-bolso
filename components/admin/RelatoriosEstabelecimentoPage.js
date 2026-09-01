"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import DashboardMetricCard from "@/components/admin/DashboardMetricCard";
import {
  IconEye,
  IconHeart,
  IconNavigation,
  IconQr,
  IconStar,
} from "@/components/admin/dashboardIcons";
import {
  PERIODO_RELATORIO_OPTIONS,
  buildRelatorioEstabelecimento,
  formatRelatorioWhatsApp,
  notaParaEstrelas,
  resumirComentario,
} from "@/lib/adminRelatorios";
import {
  getPlanoComercialTier,
  getPlanoComercialTierLabel,
} from "@/lib/planoLancamento";
import { downloadRelatorioPdf } from "@/lib/relatorioPdf";
import { parseSupabaseTimestamp } from "@/lib/supabaseTimestamp";
import { createClient } from "@/lib/supabase";

/**
 * @param {string} iso
 * @returns {string}
 */
function formatDataAvaliacao(iso) {
  const date = parseSupabaseTimestamp(iso);
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

/**
 * Página admin — relatórios por estabelecimento.
 * @returns {import("react").JSX.Element}
 */
export default function RelatoriosEstabelecimentoPage() {
  const { loading: authLoading } = useAdminAuth();
  const searchParams = useSearchParams();
  const lugarFromUrl = searchParams.get("lugar") || "";
  const [lugares, setLugares] = useState([]);
  const [lugaresLoading, setLugaresLoading] = useState(true);
  const [lugarId, setLugarId] = useState("");
  const [periodo, setPeriodo] = useState("ultimos_30_dias");
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [relatorio, setRelatorio] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("lugares")
      .select("id, nome, categoria, eh_parceiro, perfil_promo_ate, subcategoria")
      .eq("status", "ativo")
      .not("categoria", "in", "(Natureza,Aventura)")
      .order("nome", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("[relatorios] lugares:", error);
          setLugares([]);
        } else {
          setLugares(data ?? []);
        }
        setLugaresLoading(false);
      });
  }, []);

  useEffect(() => {
    if (lugarFromUrl) setLugarId(lugarFromUrl);
  }, [lugarFromUrl]);

  const handleGerar = useCallback(async () => {
    if (!lugarId) {
      setErro("Selecione um estabelecimento.");
      return;
    }

    const lugar = lugares.find((item) => String(item.id) === String(lugarId));
    if (!lugar) {
      setErro("Estabelecimento não encontrado.");
      return;
    }

    setGerando(true);
    setErro("");
    setRelatorio(null);
    setCopiado(false);

    try {
      const supabase = createClient();
      const result = await buildRelatorioEstabelecimento(
        supabase,
        lugar.id,
        lugar.nome,
        periodo,
        getPlanoComercialTierLabel(getPlanoComercialTier(lugar)),
        lugar.categoria
      );
      setRelatorio(result);
    } catch (error) {
      console.error("[relatorios] gerar:", error);
      setErro("Não foi possível gerar o relatório. Tente novamente.");
    } finally {
      setGerando(false);
    }
  }, [lugarId, lugares, periodo]);

  /**
   * @returns {Promise<void>}
   */
  async function handleCopiarWhatsApp() {
    if (!relatorio) return;

    const texto = formatRelatorioWhatsApp(relatorio);

    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro("Não foi possível copiar. Verifique permissões do navegador.");
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
        Carregando admin...
      </div>
    );
  }

  return (
    <AdminShell
      title="Relatórios"
      subtitle="Métricas por estabelecimento para compartilhar com parceiros"
      contentClassName="max-w-5xl"
    >
      <section className="rounded-3xl bg-white p-5 shadow-md ring-1 ring-black/5 md:p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5a6b66]">
          Filtros
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-[#1a2e28]">Estabelecimento</span>
            <select
              value={lugarId}
              onChange={(event) => setLugarId(event.target.value)}
              disabled={lugaresLoading}
              className="mt-2 w-full rounded-xl border border-[#e3e9e6] bg-[#f7faf9] px-4 py-3 text-sm text-[#1a2e28] focus:border-[#1a4a3a] focus:outline-none focus:ring-2 focus:ring-[#1a4a3a]/20"
            >
              <option value="">
                {lugaresLoading
                  ? "Carregando estabelecimentos…"
                  : "Selecione um estabelecimento"}
              </option>
              {lugares.map((lugar) => (
                <option key={lugar.id} value={lugar.id}>
                  {lugar.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#1a2e28]">Período</span>
            <select
              value={periodo}
              onChange={(event) => setPeriodo(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#e3e9e6] bg-[#f7faf9] px-4 py-3 text-sm text-[#1a2e28] focus:border-[#1a4a3a] focus:outline-none focus:ring-2 focus:ring-[#1a4a3a]/20"
            >
              {PERIODO_RELATORIO_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {erro && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {erro}
          </p>
        )}

        <button
          type="button"
          onClick={handleGerar}
          disabled={gerando || !lugarId || lugaresLoading}
          className="mt-5 w-full rounded-xl bg-[#1a4a3a] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#153d30] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:px-8"
        >
          {gerando ? "Gerando relatório…" : "Gerar relatório"}
        </button>
      </section>

      {relatorio && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-extrabold text-[#1a2e28]">
                {relatorio.lugarNome}
              </h2>
              <p className="mt-1 text-sm text-[#5a6b66]">
                {relatorio.periodoLabel}
                {relatorio.planoTierLabel ? ` · ${relatorio.planoTierLabel}` : ""}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleCopiarWhatsApp}
                className="rounded-xl border border-[#1a4a3a] bg-white px-4 py-2.5 text-sm font-semibold text-[#1a4a3a] transition-colors hover:bg-[#f0f4f3]"
              >
                {copiado ? "Copiado!" : "Copiar para WhatsApp"}
              </button>
              <button
                type="button"
                onClick={() => downloadRelatorioPdf(relatorio)}
                className="rounded-xl bg-[#1a4a3a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#153d30]"
              >
                Baixar PDF
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DashboardMetricCard
              label="Visualizações"
              value={relatorio.visualizacoes.value}
              variation={relatorio.visualizacoes.variation}
              icon={IconEye}
              iconWrap="bg-sky-50"
              iconColor="text-sky-700"
            />
            <DashboardMetricCard
              label="Escaneamentos QR"
              value={relatorio.qrScans.value}
              variation={relatorio.qrScans.variation}
              icon={IconQr}
              iconWrap="bg-teal-50"
              iconColor="text-teal-800"
            />
            <DashboardMetricCard
              label="IR AGORA"
              value={relatorio.irAgora.value}
              variation={relatorio.irAgora.variation}
              icon={IconNavigation}
              iconWrap="bg-emerald-50"
              iconColor="text-emerald-700"
            />
            <DashboardMetricCard
              label="Favoritos ativos"
              value={relatorio.favoritos.value}
              hint={relatorio.favoritos.hint}
              variation={relatorio.favoritos.variation}
              icon={IconHeart}
              iconWrap="bg-rose-50"
              iconColor="text-rose-700"
            />
            <DashboardMetricCard
              label="Avaliações aprovadas"
              value={
                relatorio.avaliacoesMedia != null
                  ? `${relatorio.avaliacoes.value} · ${relatorio.avaliacoesMedia}`
                  : relatorio.avaliacoes.value
              }
              hint={
                relatorio.avaliacoesMedia != null
                  ? "Quantidade · média de estrelas"
                  : undefined
              }
              variation={relatorio.avaliacoes.variation}
              icon={IconStar}
              iconWrap="bg-amber-50"
              iconColor="text-amber-700"
            />
            <DashboardMetricCard
              label="Pedidos de perfil"
              value={relatorio.claimPerfil.value}
              hint="Interesse em upgrade comercial"
              variation={relatorio.claimPerfil.variation}
              icon={IconStar}
              iconWrap="bg-violet-50"
              iconColor="text-violet-700"
            />
          </div>

          {relatorio.comparativoCategoria && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm md:p-6">
              <h3 className="text-lg font-bold text-[#1a2e28]">
                Comparativo · {relatorio.comparativoCategoria.categoria}
              </h3>
              <p className="mt-1 text-sm text-[#5a6b66]">
                {relatorio.comparativoCategoria.totalEstabelecimentos} estabelecimentos ativos na
                categoria · {relatorio.periodoLabel}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-amber-100">
                  <p className="text-xs font-semibold uppercase text-[#9aa8a3]">Views · posição</p>
                  <p className="mt-1 text-xl font-bold text-[#1a4a3a]">
                    #{relatorio.comparativoCategoria.posicaoVisualizacoes}
                  </p>
                  <p className="text-[11px] text-[#5a6b66]">
                    Média da categoria: {relatorio.comparativoCategoria.mediaVisualizacoes}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-amber-100">
                  <p className="text-xs font-semibold uppercase text-[#9aa8a3]">IR AGORA · posição</p>
                  <p className="mt-1 text-xl font-bold text-[#1a4a3a]">
                    #{relatorio.comparativoCategoria.posicaoIrAgora}
                  </p>
                  <p className="text-[11px] text-[#5a6b66]">
                    Média da categoria: {relatorio.comparativoCategoria.mediaIrAgora}
                  </p>
                </div>
                {relatorio.comparativoCategoria.topParceiroVisualizacoes != null && (
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-amber-100 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase text-amber-800">
                      Referência · parceiros da categoria
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#1a2e28]">
                      Top parceiro: {relatorio.comparativoCategoria.topParceiroVisualizacoes}{" "}
                      views · {relatorio.comparativoCategoria.topParceiroIrAgora} IR AGORA
                    </p>
                    <p className="mt-1 text-[11px] text-[#5a6b66]">
                      Use na conversa comercial: visibilidade premium gera mais engajamento.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="rounded-3xl bg-white p-5 shadow-md ring-1 ring-black/5 md:p-6">
            <h3 className="text-lg font-bold text-[#1a2e28]">
              Avaliações aprovadas no período
            </h3>
            {relatorio.avaliacoesLista.length === 0 ? (
              <p className="mt-4 text-sm text-[#5a6b66]">
                Nenhuma avaliação aprovada neste período.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-[#eef3f1]">
                {relatorio.avaliacoesLista.map((av) => (
                  <li key={av.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-amber-700">
                        {notaParaEstrelas(av.nota)}
                      </span>
                      <time
                        className="text-xs text-[#5a6b66]"
                        dateTime={av.created_at}
                      >
                        {formatDataAvaliacao(av.created_at)}
                      </time>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#3d4f4a]">
                      {resumirComentario(av.comentario, 280)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}
