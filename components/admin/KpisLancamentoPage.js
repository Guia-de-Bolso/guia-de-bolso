"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import DashboardMetricCard from "@/components/admin/DashboardMetricCard";
import {
  IconEye,
  IconHeart,
  IconNavigation,
  IconQr,
  IconStar,
} from "@/components/admin/dashboardIcons";
import { PERIODO_RELATORIO_OPTIONS } from "@/lib/adminRelatorios";
import { buildKpisLancamento } from "@/lib/adminKpis";
import { createClient } from "@/lib/supabase";

/**
 * Dashboard de KPIs da fase de lançamento (uso real antes da cobrança).
 * @returns {import("react").JSX.Element}
 */
export default function KpisLancamentoPage() {
  const { loading: authLoading } = useAdminAuth();
  const [periodo, setPeriodo] = useState("ultimos_30_dias");
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [kpis, setKpis] = useState(null);

  const handleGerar = useCallback(async () => {
    setGerando(true);
    setErro("");
    setKpis(null);

    try {
      const supabase = createClient();
      const result = await buildKpisLancamento(supabase, periodo);
      setKpis(result);
    } catch (error) {
      console.error("[kpis] gerar:", error);
      setErro("Não foi possível carregar os KPIs. Tente novamente.");
    } finally {
      setGerando(false);
    }
  }, [periodo]);

  useEffect(() => {
    if (authLoading) return undefined;
    const timer = setTimeout(() => {
      handleGerar();
    }, 0);
    return () => clearTimeout(timer);
  }, [authLoading, handleGerar]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
        Carregando admin...
      </div>
    );
  }

  return (
    <AdminShell
      title="KPIs de lançamento"
      subtitle="Métricas agregadas para tracionar o app e preparar a cobrança"
      contentClassName="max-w-5xl"
    >
      <section className="rounded-3xl bg-white p-5 shadow-md ring-1 ring-black/5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="block flex-1">
            <span className="text-sm font-semibold text-[#1a2e28]">Período</span>
            <select
              value={periodo}
              onChange={(event) => setPeriodo(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#e3e9e6] bg-[#f7faf9] px-4 py-3 text-sm text-[#1a2e28] focus:border-[#1a4a3a] focus:outline-none focus:ring-2 focus:ring-[#1a4a3a]/20"
            >
              {PERIODO_RELATORIO_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleGerar}
            disabled={gerando}
            className="rounded-xl bg-[#1a4a3a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#153d31] disabled:opacity-60"
          >
            {gerando ? "Atualizando…" : "Atualizar KPIs"}
          </button>
        </div>

        {erro && <p className="mt-4 text-sm font-semibold text-red-600">{erro}</p>}
      </section>

      {kpis && (
        <>
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#5a6b66]">
              Uso do app · {kpis.periodoLabel}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DashboardMetricCard
                label="Usuários ativos"
                value={kpis.usuariosAtivos.value}
                variation={kpis.usuariosAtivos.variation}
                icon={IconEye}
                hint="Logins únicos com acesso ao app"
              />
              <DashboardMetricCard
                label="Views de locais"
                value={kpis.visualizacoes.value}
                variation={kpis.visualizacoes.variation}
                icon={IconEye}
                hint="Páginas de estabelecimentos abertas"
              />
              <DashboardMetricCard
                label="IR AGORA"
                value={kpis.irAgora.value}
                variation={kpis.irAgora.variation}
                icon={IconNavigation}
              />
              <DashboardMetricCard
                label="Buscas IA"
                value={kpis.buscasIa.value}
                variation={kpis.buscasIa.variation}
                icon={IconStar}
              />
              <DashboardMetricCard
                label="Favoritos"
                value={kpis.favoritos.value}
                variation={kpis.favoritos.variation}
                icon={IconHeart}
              />
              <DashboardMetricCard
                label="QR Code"
                value={kpis.qrScans.value}
                variation={kpis.qrScans.variation}
                icon={IconQr}
              />
              <DashboardMetricCard
                label="Pedidos de perfil"
                value={kpis.claimPerfil.value}
                variation={kpis.claimPerfil.variation}
                icon={IconStar}
                hint="Interesse em upgrade comercial"
              />
            </div>
          </section>

          <section className="mt-6 rounded-3xl bg-white p-5 shadow-md ring-1 ring-black/5 md:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#5a6b66]">
              Cadastro por plano
            </h2>
            <p className="mt-1 text-xs text-[#5a6b66]">
              {kpis.lugaresPorTier.totalAtivos} locais ativos no app
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-[#f7faf9] p-4">
                <p className="text-xs font-semibold uppercase text-[#9aa8a3]">Presença</p>
                <p className="mt-1 text-2xl font-bold text-sky-800">
                  {kpis.lugaresPorTier.presenca}
                </p>
                <p className="text-[11px] text-[#5a6b66]">Perfil básico permanente</p>
              </div>
              <div className="rounded-2xl bg-[#f7faf9] p-4">
                <p className="text-xs font-semibold uppercase text-[#9aa8a3]">Lançamento</p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  {kpis.lugaresPorTier.lancamento}
                </p>
                <p className="text-[11px] text-[#5a6b66]">Perfil completo grátis</p>
              </div>
              <div className="rounded-2xl bg-[#f7faf9] p-4">
                <p className="text-xs font-semibold uppercase text-[#9aa8a3]">Parceiro</p>
                <p className="mt-1 text-2xl font-bold text-amber-800">
                  {kpis.lugaresPorTier.parceiro}
                </p>
                <p className="text-[11px] text-[#5a6b66]">Plano pago</p>
              </div>
              <div className="rounded-2xl bg-[#f7faf9] p-4">
                <p className="text-xs font-semibold uppercase text-[#9aa8a3]">Público</p>
                <p className="mt-1 text-2xl font-bold text-[#1a4a3a]">
                  {kpis.lugaresPorTier.publico}
                </p>
                <p className="text-[11px] text-[#5a6b66]">Natureza / Aventura</p>
              </div>
            </div>
          </section>

          {kpis.topLugares.length > 0 && (
            <section className="mt-6 rounded-3xl bg-white p-5 shadow-md ring-1 ring-black/5 md:p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#5a6b66]">
                Top locais por engajamento
              </h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#eef3f1] text-xs uppercase text-[#9aa8a3]">
                      <th className="py-2 pr-4">Local</th>
                      <th className="py-2 pr-4">Categoria</th>
                      <th className="py-2 pr-4">Views</th>
                      <th className="py-2 pr-4">IR AGORA</th>
                      <th className="py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.topLugares.map((item) => (
                      <tr key={item.id} className="border-b border-[#f7faf9]">
                        <td className="py-2.5 pr-4 font-semibold text-[#1a2e28]">{item.nome}</td>
                        <td className="py-2.5 pr-4 text-[#5a6b66]">{item.categoria}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{item.visualizacoes}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{item.irAgora}</td>
                        <td className="py-2.5 tabular-nums font-semibold text-[#1a4a3a]">
                          {item.engajamento}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </AdminShell>
  );
}
