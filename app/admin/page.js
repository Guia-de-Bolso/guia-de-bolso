"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import DashboardAtividadeSection from "@/components/admin/DashboardAtividadeSection";
import DashboardHero from "@/components/admin/DashboardHero";
import DashboardMetricCard from "@/components/admin/DashboardMetricCard";
import DashboardOperacionalSidebar from "@/components/admin/DashboardOperacionalSidebar";
import DashboardPendentesSection from "@/components/admin/DashboardPendentesSection";
import DashboardSkeleton from "@/components/admin/DashboardSkeleton";
import {
  IconClipboard,
  IconMap,
  IconNavigation,
  IconPin,
  IconSparkles,
  IconStar,
  IconUserPlus,
} from "@/components/admin/dashboardIcons";
import {
  buildResumoOperacional,
  calcVariation,
  countParceirosAtivos,
  countPremiumAtivos,
  fetchAtrativosPublicadosCount,
  fetchCount,
  fetchCountInPeriod,
  fetchParceiroProgramaPendencias,
  getCutoffIso,
  getSaudacao,
} from "@/lib/adminDashboard";
import { createClient } from "@/lib/supabase";

/**
 * Seletor de período para métricas do dashboard.
 * @param {{ period: string, onChange: (period: string) => void }} props
 * @returns {import("react").JSX.Element}
 */
function PeriodSelector({ period, onChange }) {
  return (
    <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => onChange("semana")}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/30 ${
          period === "semana"
            ? "bg-[#1a4a3a] text-white"
            : "text-[#5a6b66] hover:bg-[#f7faf9]"
        }`}
      >
        Esta semana
      </button>
      <button
        type="button"
        onClick={() => onChange("mes")}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/30 ${
          period === "mes"
            ? "bg-[#1a4a3a] text-white"
            : "text-[#5a6b66] hover:bg-[#f7faf9]"
        }`}
      >
        Este mês
      </button>
    </div>
  );
}

/**
 * Admin dashboard: métricas, moderação e atividade.
 * @returns {import("react").JSX.Element}
 */
export default function AdminDashboard() {
  const { loading: authLoading, user, perfil } = useAdminAuth();
  const [period, setPeriod] = useState("semana");
  const [dataLoading, setDataLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    avaliacoesPendentes: { total: 0, variation: { text: "", className: "", direction: "flat" } },
    lugaresAtivos: { total: 0, variation: { text: "", className: "", direction: "flat" } },
    atrativosPublicados: { total: 0, variation: { text: "", className: "", direction: "flat" } },
    parceirosVigentes: { total: 0, variation: { text: "Parceiros ativos hoje", className: "text-[#5a6b66]", direction: "flat" } },
    usuariosNovos: { total: 0, variation: { text: "", className: "", direction: "flat" } },
    irAgora: { total: 0, variation: { text: "", className: "", direction: "flat" } },
    emAnalise: { total: 0, variation: { text: "Aguardando publicação", className: "text-[#5a6b66]", direction: "flat" } },
  });

  const [operacional, setOperacional] = useState({
    emAnalise: 0,
    parceirosAtivos: 0,
    premiumAtivos: 0,
    feedbackNovos: 0,
  });

  const [pendentes, setPendentes] = useState([]);
  const [logsRecentes, setLogsRecentes] = useState([]);
  const [perfis, setPerfis] = useState([]);

  const loadDashboard = useCallback(async () => {
    setDataLoading(true);
    const supabase = createClient();
    const days = period === "mes" ? 30 : 7;
    const periodLabel = period === "mes" ? "período anterior" : "semana anterior";
    const cutoff = getCutoffIso(days);

    const [
      lugaresCounts,
      atrativosCounts,
      avaliacoesCounts,
      emAnaliseCounts,
      usuariosNovosCounts,
      irAgoraCounts,
      parceirosAtivos,
      premiumAtivos,
      avaliacoes,
      logsRes,
      perfisRes,
      feedbackNovosRes,
      parceiroPendencias,
    ] = await Promise.all([
      fetchCount(supabase, "lugares", {
        eq: { field: "status", value: "ativo" },
        ltCreatedAt: cutoff,
      }),
      fetchAtrativosPublicadosCount(supabase, { ltCreatedAt: cutoff }),
      fetchCount(supabase, "avaliacoes", {
        eq: { field: "status", value: "pendente" },
        ltCreatedAt: cutoff,
      }),
      fetchCount(supabase, "lugares", {
        eq: { field: "status", value: "em_analise" },
      }),
      fetchCountInPeriod(supabase, "perfis", days),
      fetchCountInPeriod(supabase, "logs", days, {
        eq: { field: "acao", value: "ir_agora" },
      }),
      countParceirosAtivos(supabase),
      countPremiumAtivos(supabase),
      supabase
        .from("avaliacoes")
        .select("*, lugares(nome)")
        .eq("status", "pendente")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase.from("perfis").select("id, nome"),
      supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("status", "novo"),
      fetchParceiroProgramaPendencias(supabase),
    ]);

    setMetrics({
      avaliacoesPendentes: {
        total: avaliacoesCounts.total,
        variation: calcVariation(
          avaliacoesCounts.total,
          avaliacoesCounts.past,
          periodLabel
        ),
      },
      lugaresAtivos: {
        total: lugaresCounts.total,
        variation: calcVariation(lugaresCounts.total, lugaresCounts.past, periodLabel),
      },
      atrativosPublicados: {
        total: atrativosCounts.total,
        variation: calcVariation(
          atrativosCounts.total,
          atrativosCounts.past,
          periodLabel
        ),
      },
      parceirosVigentes: {
        total: parceirosAtivos,
        variation: {
          text: "Lugares com Parceiro do Guia ativo",
          className: "text-[#5a6b66]",
          direction: "flat",
        },
      },
      usuariosNovos: {
        total: usuariosNovosCounts.total,
        variation: calcVariation(
          usuariosNovosCounts.total,
          usuariosNovosCounts.past,
          periodLabel
        ),
      },
      irAgora: {
        total: irAgoraCounts.total,
        variation: calcVariation(irAgoraCounts.total, irAgoraCounts.past, periodLabel),
      },
      emAnalise: {
        total: emAnaliseCounts.total,
        variation: {
          text: "Cadastros aguardando revisão",
          className: "text-[#5a6b66]",
          direction: "flat",
        },
      },
    });

    setOperacional({
      emAnalise: emAnaliseCounts.total,
      parceirosAtivos,
      parceirosVencendo: parceiroPendencias.vencendo + parceiroPendencias.vencido,
      curadoriaAtrasada: parceiroPendencias.curadoriaAtrasada,
      premiumAtivos,
      feedbackNovos: feedbackNovosRes.count ?? 0,
    });

    setPendentes(avaliacoes.data ?? []);
    setLogsRecentes(logsRes.data ?? []);
    setPerfis(perfisRes.data ?? []);
    setDataLoading(false);
  }, [period]);

  useEffect(() => {
    if (authLoading) return;
    loadDashboard();
  }, [authLoading, loadDashboard]);

  const resumoHero = useMemo(
    () =>
      buildResumoOperacional({
        avaliacoesPendentes: metrics.avaliacoesPendentes.total,
        emAnalise: operacional.emAnalise,
        parceirosAtivos: operacional.parceirosAtivos,
      }),
    [metrics.avaliacoesPendentes.total, operacional]
  );

  const nomeAdmin =
    perfil?.nome ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Admin";

  const dataFormatada = useMemo(() => {
    const raw = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, []);

  const periodoHint = period === "mes" ? "Neste mês" : "Nesta semana";

  /**
   * @param {string} id
   * @param {string} status
   * @returns {Promise<void>}
   */
  async function updateStatus(id, status) {
    const supabase = createClient();
    await supabase.from("avaliacoes").update({ status }).eq("id", id);
    setPendentes((items) => items.filter((item) => item.id !== id));
    setMetrics((current) => ({
      ...current,
      avaliacoesPendentes: {
        ...current.avaliacoesPendentes,
        total: Math.max(0, current.avaliacoesPendentes.total - 1),
      },
    }));
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
      title="Dashboard"
      subtitle="Visão geral do Guia de Bolso"
      showPageHeading={false}
      headerAction={<PeriodSelector period={period} onChange={setPeriod} />}
    >
      {dataLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6 md:space-y-8">
          <DashboardHero
            saudacao={getSaudacao()}
            nome={nomeAdmin}
            dataFormatada={dataFormatada}
            resumo={resumoHero}
            subtitle="Visão geral do Guia de Bolso"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
            <DashboardMetricCard
              hero
              className="sm:col-span-2 lg:col-span-6"
              label="Avaliações pendentes"
              hint="Aguardam moderação"
              value={metrics.avaliacoesPendentes.total}
              icon={IconStar}
              iconWrap="bg-amber-100"
              iconColor="text-amber-600"
              variation={metrics.avaliacoesPendentes.variation}
              href="/admin/avaliacoes?tab=pendente"
            />
            <DashboardMetricCard
              className="sm:col-span-1 lg:col-span-3"
              label="Locais publicados"
              hint="Status ativo"
              value={metrics.lugaresAtivos.total}
              icon={IconPin}
              iconWrap="bg-[#d4ede8]"
              iconColor="text-[#1a4a3a]"
              variation={metrics.lugaresAtivos.variation}
              href="/admin/locais"
            />
            <DashboardMetricCard
              className="sm:col-span-1 lg:col-span-3"
              label="Atrativos publicados"
              hint="Status publicado"
              value={metrics.atrativosPublicados.total}
              icon={IconMap}
              iconWrap="bg-[#d4ede8]"
              iconColor="text-[#1a4a3a]"
              variation={metrics.atrativosPublicados.variation}
              href="/admin/atrativos"
            />
            <DashboardMetricCard
              className="sm:col-span-1 lg:col-span-3"
              label="Parceiros do Guia"
              hint="Flag eh_parceiro ativo"
              value={metrics.parceirosVigentes.total}
              icon={IconSparkles}
              iconWrap="bg-amber-100"
              iconColor="text-amber-700"
              variation={metrics.parceirosVigentes.variation}
              href="/admin/parceiros"
            />
            <DashboardMetricCard
              className="sm:col-span-1 lg:col-span-3"
              label="Usuários novos"
              hint={periodoHint}
              value={metrics.usuariosNovos.total}
              icon={IconUserPlus}
              iconWrap="bg-blue-100"
              iconColor="text-blue-600"
              variation={metrics.usuariosNovos.variation}
              href="/admin/usuarios"
            />
            <DashboardMetricCard
              className="sm:col-span-1 lg:col-span-3"
              label="IR AGORA"
              hint={periodoHint}
              value={metrics.irAgora.total}
              icon={IconNavigation}
              iconWrap="bg-emerald-100"
              iconColor="text-emerald-700"
              variation={metrics.irAgora.variation}
              href="/admin/logs?acao=ir_agora"
            />
            <DashboardMetricCard
              className="sm:col-span-2 lg:col-span-3"
              label="Em análise"
              hint="Locais não publicados"
              value={metrics.emAnalise.total}
              icon={IconClipboard}
              iconWrap="bg-orange-100"
              iconColor="text-orange-700"
              variation={metrics.emAnalise.variation}
              href="/admin/locais?status=em_analise"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-5 lg:items-start lg:gap-8">
            <div className="min-w-0 lg:col-span-3">
              <DashboardPendentesSection
                pendentes={pendentes}
                totalPendentes={metrics.avaliacoesPendentes.total}
                onUpdateStatus={updateStatus}
              />
            </div>
            <div className="min-w-0 lg:col-span-2">
              <DashboardOperacionalSidebar counts={operacional} />
            </div>
          </div>

          <DashboardAtividadeSection logs={logsRecentes} perfis={perfis} />
        </div>
      )}
    </AdminShell>
  );
}
