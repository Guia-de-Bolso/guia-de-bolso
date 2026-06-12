"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/BottomNav";
import CategoriaDestaquesCarousel from "@/components/categoria/CategoriaDestaquesCarousel";
import CategoriaEmptyState from "@/components/categoria/CategoriaEmptyState";
import CategoriaHero from "@/components/categoria/CategoriaHero";
import CategoriaSubcategoriaChips from "@/components/categoria/CategoriaSubcategoriaChips";
import CategoriaLugarCard from "@/components/categoria/CategoriaLugarCard";
import CategoriaLugarCardSkeleton from "@/components/categoria/CategoriaLugarCardSkeleton";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import SupabaseConfigAlert from "@/components/SupabaseConfigAlert";
import UserErrorAlert from "@/components/UserErrorAlert";
import { fetchLugaresFromApi } from "@/lib/fetchLugaresApi";
import { getCapaFromLugar } from "@/lib/fotos";
import { isSupabasePublicConfigured } from "@/lib/supabase/publicEnv";
import { buildReportContext } from "@/lib/reportContext";
import { createClient } from "@/lib/supabase";
import { withDistanciaDinamica } from "@/lib/localizacao";
import {
  filterLugaresByCategoria,
  normalizeLugaresTaxonomia,
} from "@/lib/lugarTaxonomia";

/**
 * Listagem por categoria — hero editorial, destaques, filtros e grid de lugares.
 */
export default function CategoriaPageClient({
  categoria,
  categoriaMeta,
  initialLugares = [],
  initialSubcategorias = [],
}) {
  const [lugares, setLugares] = useState(initialLugares);
  const [subcategorias, setSubcategorias] = useState(initialSubcategorias);
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState("Todos");
  const [userPosition, setUserPosition] = useState(null);
  const [loading, setLoading] = useState(initialLugares.length === 0);
  const [fetchError, setFetchError] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!categoria) return;

    if (!isSupabasePublicConfigured()) {
      setFetchError(true);
      setLoading(false);
      return undefined;
    }

    const supabase = createClient();

    if (initialLugares.length === 0) {
      fetchLugaresFromApi({ categoria, limit: 100 })
        .then((data) => {
          setFetchError(false);
          setLugares(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("[categoria] lugares:", err);
          setFetchError(true);
          setLugares([]);
          setLoading(false);
        });
    } else {
      setLoading(false);
      setFetchError(false);
    }

    if (!supabase || initialSubcategorias.length > 0) {
      return undefined;
    }

    supabase
      .from("subcategorias")
      .select("*")
      .eq("categoria", categoria)
      .order("nome")
      .then(({ data }) => setSubcategorias(data ?? []));

    return undefined;
  }, [categoria, initialLugares.length, initialSubcategorias.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSubcategoriaSelecionada("Todos");
    }, 0);

    return () => clearTimeout(timer);
  }, [categoria]);

  const lugaresNaCategoria = useMemo(
    () => filterLugaresByCategoria(normalizeLugaresTaxonomia(lugares), categoria),
    [lugares, categoria]
  );

  const capaUrl = useMemo(() => {
    for (const lugar of lugaresNaCategoria) {
      const capa = getCapaFromLugar(lugar);
      if (capa) return capa;
    }
    return "";
  }, [lugaresNaCategoria]);

  const subcategoriasComLocais = useMemo(() => {
    const counts = new Map();

    for (const lugar of lugaresNaCategoria) {
      const nome = lugar.subcategoria?.trim();
      if (!nome) continue;
      counts.set(nome, (counts.get(nome) || 0) + 1);
    }

    return subcategorias
      .filter((item) => counts.has(item.nome))
      .map((item) => ({
        ...item,
        count: counts.get(item.nome) || 0,
      }))
      .sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome, "pt-BR"));
  }, [lugaresNaCategoria, subcategorias]);

  const chipOpcoes = useMemo(
    () => [
      { id: "todos", nome: "Todos", icone: "", count: lugaresNaCategoria.length },
      ...subcategoriasComLocais,
    ],
    [lugaresNaCategoria.length, subcategoriasComLocais]
  );

  useEffect(() => {
    if (
      subcategoriaSelecionada !== "Todos" &&
      !subcategoriasComLocais.some((item) => item.nome === subcategoriaSelecionada)
    ) {
      setSubcategoriaSelecionada("Todos");
    }
  }, [subcategoriasComLocais, subcategoriaSelecionada]);

  const lugaresFiltrados =
    subcategoriaSelecionada === "Todos"
      ? lugaresNaCategoria
      : lugaresNaCategoria.filter(
          (lugar) => lugar.subcategoria === subcategoriaSelecionada
        );

  const lugaresComDistancia = useMemo(
    () => lugaresFiltrados.map((lugar) => withDistanciaDinamica(lugar, userPosition)),
    [lugaresFiltrados, userPosition]
  );

  const destaques = useMemo(() => lugaresComDistancia.slice(0, 6), [lugaresComDistancia]);

  const listaTitulo =
    subcategoriaSelecionada === "Todos"
      ? "Todos os lugares"
      : subcategoriaSelecionada;

  const listaSubtitulo = loading
    ? "Atualizando lista…"
    : `${lugaresFiltrados.length} ${
        lugaresFiltrados.length === 1 ? "lugar disponível" : "lugares disponíveis"
      }`;

  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <div className="sr-only">
        <h1>
          {categoria} em Imbituba — {categoriaMeta.descricao}
        </h1>
      </div>

      <div className="mx-auto max-w-md px-4 pb-32">
        <CategoriaHero
          meta={categoriaMeta}
          capaUrl={capaUrl}
          totalLugares={lugaresNaCategoria.length}
          totalSubcategorias={subcategoriasComLocais.length}
          loading={loading}
        />

        <SupabaseConfigAlert />

        {fetchError && (
          <UserErrorAlert
            className="mb-5"
            message="Não foi possível carregar os lugares."
            reportContext={buildReportContext({
              code: "SERVER",
              route: `/categoria/${encodeURIComponent(categoria)}`,
            })}
            action={
              <Link
                href="/categorias"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-800 underline"
              >
                Voltar para Explorar
              </Link>
            }
          />
        )}

        {!fetchError && loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((item) => (
              <CategoriaLugarCardSkeleton key={item} />
            ))}
          </div>
        ) : null}

        {!fetchError && !loading && lugaresNaCategoria.length === 0 ? (
          <CategoriaEmptyState meta={categoriaMeta} />
        ) : null}

        {!fetchError && !loading && lugaresNaCategoria.length > 0 ? (
          <>
            {subcategoriaSelecionada === "Todos" ? (
              <CategoriaDestaquesCarousel lugares={destaques} returnPath={returnPath} />
            ) : null}

            <CategoriaSubcategoriaChips
              selecionada={subcategoriaSelecionada}
              onSelecionar={setSubcategoriaSelecionada}
              opcoes={chipOpcoes}
            />

            <section
              className="home-reveal"
              style={{ animationDelay: "120ms" }}
              aria-labelledby="categoria-lista-title"
            >
              <HomeSectionHeader
                eyebrow={subcategoriaSelecionada === "Todos" ? "Catálogo completo" : "Filtrado"}
                title={listaTitulo}
                titleId="categoria-lista-title"
              />
              <p className="-mt-2 mb-4 text-sm font-medium text-[#5a6b66]">{listaSubtitulo}</p>

              {lugaresFiltrados.length === 0 ? (
                <div className="rounded-[24px] bg-white px-5 py-10 text-center ring-1 ring-[#e8eeee]">
                  <p className="text-sm text-[#5a6b66]">
                    Nenhum lugar neste filtro. Tente outro tipo ou volte para{" "}
                    <button
                      type="button"
                      onClick={() => setSubcategoriaSelecionada("Todos")}
                      className="font-semibold text-[#1a4a3a] underline"
                    >
                      Todos
                    </button>
                    .
                  </p>
                </div>
              ) : (
                <ul className="grid list-none gap-3 p-0">
                  {lugaresComDistancia.map((lugar) => (
                    <li key={lugar.id}>
                      <CategoriaLugarCard
                        lugar={lugar}
                        userPosition={userPosition}
                        returnPath={returnPath}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}
