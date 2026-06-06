import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import RoteiroSection from "@/components/rotas/RoteiroSection";
import RotasCatalogo from "@/components/rotas/RotasCatalogo";
import { createClient } from "@/lib/supabase/server";

function IconMapEmpty() {
  return (
    <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

/**
 * Routes listing with featured route, AI roteiro section, and saved roteiros.
 * @returns {Promise<import("react").ReactElement>}
 */
export default async function RotasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("rotas")
    .select("*, rotas_tags(tags(*))")
    .eq("ativa", true)
    .order("created_at", { ascending: false });

  let roteiros = [];
  if (user) {
    const { data: roteirosData } = await supabase
      .from("roteiros")
      .select("id, titulo, dias, perfil, interesses, conteudo, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    roteiros = roteirosData ?? [];
  }

  const rotas = data ?? [];

  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <header className="sticky top-0 z-30 border-b border-[#e3e9e6]/70 bg-[#f0f4f3]/95 px-4 py-5 backdrop-blur">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold tracking-tight text-[#1a2e28]">Rotas</h1>
          <p className="mt-1 text-sm text-[#5a6b66]">Trilhas e caminhos selecionados</p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-28 pt-5">
        <RoteiroSection roteirosIniciais={roteiros} />

        {rotas.length === 0 ? (
          <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d4ede8] text-[#1a4a3a]">
              <IconMapEmpty />
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#1a2e28]">
              Nenhuma rota cadastrada ainda
            </h2>
            <p className="mt-2 text-sm text-[#5a6b66]">
              Em breve novas trilhas e caminhos aparecerão aqui.
            </p>
          </section>
        ) : (
          <RotasCatalogo rotas={rotas} />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
