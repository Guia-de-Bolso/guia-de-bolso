"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import AtrativoForm from "@/components/admin/AtrativoForm";
import IconBack from "@/components/IconBack";
import { createClient } from "@/lib/supabase";

/**
 * Admin page to edit an existing route and its waypoints.
 * @returns {import("react").ReactElement}
 */
export default function EditarAtrativoPage() {
  const { loading } = useAdminAuth();
  const { id } = useParams();
  const [rota, setRota] = useState(null);
  const [pontos, setPontos] = useState([]);
  const [dicas, setDicas] = useState([]);
  const [localizacao, setLocalizacao] = useState(null);
  const [tagIds, setTagIds] = useState([]);
  const [loadingRota, setLoadingRota] = useState(true);

  useEffect(() => {
    if (loading || !id) return;

    const supabase = createClient();
    Promise.all([
      supabase.from("rotas").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("rota_pontos")
        .select("*, rota_ponto_detalhes(texto, ordem)")
        .eq("rota_id", id)
        .order("ordem", { ascending: true }),
      supabase
        .from("rota_dicas")
        .select("*")
        .eq("rota_id", id)
        .order("ordem", { ascending: true }),
      supabase.from("rotas_localizacoes").select("*").eq("rota_id", id).maybeSingle(),
      supabase.from("rotas_tags").select("tag_id").eq("rota_id", id),
    ]).then(([rotaRes, pontosRes, dicasRes, localizacaoRes, tagsRes]) => {
      setRota(rotaRes.data);
      setPontos(pontosRes.data ?? []);
      setDicas(dicasRes.data ?? []);
      setLocalizacao(localizacaoRes.data);
      setTagIds((tagsRes.data ?? []).map((item) => String(item.tag_id)));
      setLoadingRota(false);
    });
  }, [loading, id]);

  if (loading || loadingRota) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
        Carregando admin...
      </div>
    );
  }

  return (
    <AdminShell title={`Editar ${rota?.nome || rota?.titulo || "roteiro"}`}>
      <Link
        href="/admin/roteiros"
        className="mb-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#1a4a3a] shadow-sm"
      >
        <IconBack className="h-4 w-4" />
        Voltar para Roteiros
      </Link>
      {rota ? (
        <AtrativoForm
          initialData={rota}
          initialPontos={pontos}
          initialDicas={dicas}
          initialLocalizacao={localizacao}
          initialTagIds={tagIds}
          editingId={rota.id}
        />
      ) : (
        <p className="rounded-2xl bg-white p-5 text-sm text-[#5a6b66] shadow-sm">
          Roteiro não encontrado.
        </p>
      )}
    </AdminShell>
  );
}
