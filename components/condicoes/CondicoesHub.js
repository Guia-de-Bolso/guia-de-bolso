"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NavigationBackLink from "@/components/NavigationBackLink";
import {
  avaliarCondicoes,
  buildDailyHighlights,
  CONDICOES_ATIVIDADES,
  fetchCondicoes,
  normalizePicosAquaticos,
} from "@/lib/condicoes";
import { degreesToCompass, formatNumber } from "@/lib/clima";
import { createClient } from "@/lib/supabase";

/**
 * @param {'great'|'good'|'fair'|'poor'} tone
 * @returns {string}
 */
function ratingClass(tone) {
  if (tone === "great") return "bg-emerald-500 text-white";
  if (tone === "good") return "bg-teal-100 text-teal-900";
  if (tone === "fair") return "bg-amber-100 text-amber-900";
  return "bg-slate-200 text-slate-700";
}

/**
 * @param {string} time
 * @returns {string}
 */
function formatHour(time) {
  return time?.slice(11, 16) ?? "—";
}

/**
 * @param {string} time
 * @returns {string}
 */
function formatUpdatedAt(time) {
  if (!time) return "agora";
  return `às ${formatHour(time)}`;
}

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {string} props.detail
 * @returns {import("react").ReactElement}
 */
function MetricCard({ label, value, detail }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#e3ebe8]">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6f837d]">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tracking-tight text-[#1a2e28]">{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-[#6f837d]">{detail}</p>
    </div>
  );
}

/**
 * Hub público de condições para surf, kite/wind e SUP/caiaque.
 * @returns {import("react").ReactElement}
 */
export default function CondicoesHub() {
  const [picos, setPicos] = useState([]);
  const [picoSelecionado, setPicoSelecionado] = useState(null);
  const [buscaPraia, setBuscaPraia] = useState("");
  const [atividade, setAtividade] = useState("surf");
  const [condicoes, setCondicoes] = useState(null);
  const [loadingPicos, setLoadingPicos] = useState(true);
  const [loadingCondicoes, setLoadingCondicoes] = useState(false);
  const [erro, setErro] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadPicos() {
      setLoadingPicos(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("lugares")
        .select(
          "id, nome, slug, categoria, subcategoria, localizacoes(latitude, longitude)"
        )
        .in("categoria", ["Natureza", "Aventura"])
        .eq("status", "ativo");

      if (cancelled) return;

      if (error) {
        console.error("Erro ao carregar picos aquáticos:", error);
        setErro("Não foi possível carregar as praias agora.");
        setLoadingPicos(false);
        return;
      }

      const normalized = normalizePicosAquaticos(data);
      setPicos(normalized);
      setPicoSelecionado(normalized[0] ?? null);
      setLoadingPicos(false);
    }

    loadPicos();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!picoSelecionado) return undefined;
    let cancelled = false;

    async function loadCondicoes() {
      setLoadingCondicoes(true);
      setErro("");

      try {
        const data = await fetchCondicoes(
          picoSelecionado.latitude,
          picoSelecionado.longitude
        );
        if (!cancelled) setCondicoes(data);
      } catch (error) {
        console.error("Erro ao carregar condições:", error);
        if (!cancelled) {
          setCondicoes(null);
          setErro("A previsão está indisponível no momento. Tente novamente.");
        }
      } finally {
        if (!cancelled) setLoadingCondicoes(false);
      }
    }

    loadCondicoes();
    return () => {
      cancelled = true;
    };
  }, [picoSelecionado, retryKey]);

  const currentRating = useMemo(
    () =>
      condicoes?.current
        ? avaliarCondicoes(atividade, condicoes.current)
        : null,
    [atividade, condicoes]
  );
  const dailyHighlights = useMemo(
    () =>
      condicoes?.timeline
        ? buildDailyHighlights(condicoes.timeline, atividade)
        : [],
    [atividade, condicoes]
  );
  const next24Hours = condicoes?.timeline?.slice(0, 8) ?? [];
  const picosFiltrados = useMemo(() => {
    const termo = buscaPraia.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return picos;
    return picos.filter((pico) =>
      pico.nome.toLocaleLowerCase("pt-BR").includes(termo)
    );
  }, [buscaPraia, picos]);

  return (
    <main className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <div className="mx-auto max-w-md px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-safe-top">
        <header className="flex items-center gap-3 py-4">
          <NavigationBackLink
            href="/"
            ariaLabel="Voltar para o início"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1a4a3a] shadow-sm ring-1 ring-[#e3ebe8]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </NavigationBackLink>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a4a3a]/70">
              Imbituba agora
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Condições do mar
            </h1>
          </div>
        </header>

        <section
          className="rounded-[28px] bg-gradient-to-br from-[#143f35] via-[#1a5947] to-[#28745d] p-5 text-white shadow-[0_18px_45px_rgba(20,63,53,0.22)]"
          aria-labelledby="condicoes-intro"
        >
          <p className="text-3xl" aria-hidden>
            🌊
          </p>
          <h2 id="condicoes-intro" className="mt-3 text-xl font-bold">
            Escolha o esporte e confira a melhor janela
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-white/75">
            Vento, rajadas, ondas, swell e nível do mar em uma leitura rápida.
          </p>
        </section>

        <section className="mt-5" aria-label="Escolha o esporte">
          <div className="grid grid-cols-3 gap-2">
            {CONDICOES_ATIVIDADES.map((item) => {
              const selected = atividade === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAtividade(item.id)}
                  aria-pressed={selected}
                  className={`rounded-2xl px-2 py-3 text-center text-xs font-bold transition ${
                    selected
                      ? "bg-[#1a4a3a] text-white shadow-md"
                      : "bg-white text-[#4e625c] ring-1 ring-[#e3ebe8]"
                  }`}
                >
                  <span className="mb-1 block text-xl" aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5" aria-labelledby="picos-title">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a4a3a]/70">
                Picos locais
              </p>
              <h2 id="picos-title" className="mt-0.5 text-lg font-bold">
                Onde você vai entrar?
              </h2>
            </div>
            {condicoes ? (
              <span className="text-[10px] text-[#6f837d]">
                Atualizado {formatUpdatedAt(condicoes.updatedAt)}
              </span>
            ) : null}
          </div>

          {loadingPicos ? (
            <div className="mt-3 flex gap-2 overflow-hidden" aria-label="Carregando praias">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-[#dce6e2]"
                />
              ))}
            </div>
          ) : picos.length ? (
            <>
              <label className="mt-3 block">
                <span className="sr-only">Buscar praia ou pico</span>
                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f837d]"
                    aria-hidden
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  <input
                    type="search"
                    value={buscaPraia}
                    onChange={(event) => setBuscaPraia(event.target.value)}
                    placeholder="Buscar praia ou pico…"
                    autoComplete="off"
                    className="w-full rounded-2xl border-0 bg-white py-3 pl-10 pr-4 text-sm text-[#1a2e28] shadow-sm ring-1 ring-[#e3ebe8] placeholder:text-[#8a9a95] focus:outline-none focus:ring-2 focus:ring-[#1a4a3a]/35"
                  />
                </div>
              </label>

              {picosFiltrados.length ? (
                <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
                  {picosFiltrados.map((pico) => {
                    const selected = picoSelecionado?.id === pico.id;
                    return (
                      <button
                        key={pico.id}
                        type="button"
                        onClick={() => setPicoSelecionado(pico)}
                        aria-pressed={selected}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                          selected
                            ? "bg-[#d4ede8] text-[#133b31] ring-1 ring-[#93caba]"
                            : "bg-white text-[#52665f] ring-1 ring-[#e3ebe8]"
                        }`}
                      >
                        {pico.nome}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-[#5a6b66]">
                  Nenhuma praia encontrada para “{buscaPraia.trim()}”.
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-[#5a6b66]">
              Nenhum pico com coordenadas foi encontrado.
            </p>
          )}
        </section>

        {loadingCondicoes ? (
          <section className="mt-5 animate-pulse rounded-[28px] bg-white p-5">
            <div className="h-5 w-28 rounded bg-[#e3e9e6]" />
            <div className="mt-4 h-14 w-40 rounded bg-[#e3e9e6]" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-24 rounded-2xl bg-[#edf2f0]" />
              ))}
            </div>
          </section>
        ) : erro ? (
          <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">{erro}</p>
            {picoSelecionado ? (
              <button
                type="button"
                onClick={() => setRetryKey((value) => value + 1)}
                className="mt-3 text-sm font-bold text-[#1a4a3a]"
              >
                Tentar novamente
              </button>
            ) : null}
          </section>
        ) : condicoes?.current && currentRating ? (
          <>
            <section className="mt-5 overflow-hidden rounded-[28px] bg-white shadow-[0_12px_35px_rgba(26,46,40,0.08)] ring-1 ring-[#e3ebe8]">
              <div className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f837d]">
                    Potencial agora · {picoSelecionado?.nome}
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-5xl font-bold tracking-[-0.06em] text-[#1a2e28]">
                      {currentRating.score}
                    </span>
                    <span className="pb-1 text-sm font-semibold text-[#6f837d]">/100</span>
                  </div>
                  <p className="mt-2 max-w-[220px] text-sm text-[#5a6b66]">
                    {currentRating.summary}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${ratingClass(
                    currentRating.tone
                  )}`}
                >
                  {currentRating.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#f7faf9] p-4">
                <MetricCard
                  label="Ondas"
                  value={`${formatNumber(condicoes.current.waveHeight)} m`}
                  detail={`${formatNumber(condicoes.current.wavePeriod, 1)} s · ${condicoes.current.waveCompass}`}
                />
                <MetricCard
                  label="Swell"
                  value={`${formatNumber(condicoes.current.swellHeight)} m`}
                  detail={`${formatNumber(condicoes.current.swellPeriod, 1)} s · ${condicoes.current.swellCompass}`}
                />
                <MetricCard
                  label="Vento"
                  value={`${formatNumber(condicoes.current.windSpeed, 0)} km/h`}
                  detail={`${condicoes.current.windCompass} · rajadas ${formatNumber(
                    condicoes.current.windGusts,
                    0
                  )}`}
                />
                <MetricCard
                  label="Água"
                  value={`${formatNumber(condicoes.current.seaTemperature, 1)}°C`}
                  detail={`${condicoes.current.weatherEmoji} ${condicoes.current.condition}`}
                />
              </div>
            </section>

            <section className="mt-5 rounded-[24px] bg-[#dfeeea] p-4 ring-1 ring-[#c9dfd8]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1a4a3a]/70">
                    Maré estimada
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold">
                    {condicoes.current.tideTrend.label}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {formatNumber(condicoes.current.seaLevel, 2)} m
                  </p>
                  <p className="text-[10px] text-[#5a6b66]">nível médio global</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-[#52665f]">
                Tendência por modelo oceânico. Use como referência; não substitui tábua de
                marés nem avaliação no local.
              </p>
            </section>

            <section className="mt-6" aria-labelledby="horas-title">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a4a3a]/70">
                    Planeje o dia
                  </p>
                  <h2 id="horas-title" className="mt-0.5 text-lg font-bold">
                    Próximas 24 horas
                  </h2>
                </div>
                <p className="text-[10px] text-[#6f837d]">intervalos de 3h</p>
              </div>
              <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide">
                {next24Hours.map((point) => {
                  const rating = avaliarCondicoes(atividade, point);
                  return (
                    <article
                      key={point.time}
                      className="w-[145px] shrink-0 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-[#e3ebe8]"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold">{formatHour(point.time)}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ratingClass(
                            rating.tone
                          )}`}
                        >
                          {rating.score}
                        </span>
                      </div>
                      <dl className="mt-3 space-y-1.5 text-[11px] text-[#5a6b66]">
                        <div className="flex justify-between gap-2">
                          <dt>Ondas</dt>
                          <dd className="font-semibold text-[#1a2e28]">
                            {formatNumber(point.waveHeight)} m
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Swell</dt>
                          <dd className="font-semibold text-[#1a2e28]">
                            {formatNumber(point.swellPeriod, 1)} s
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Vento</dt>
                          <dd className="font-semibold text-[#1a2e28]">
                            {formatNumber(point.windSpeed, 0)}{" "}
                            {degreesToCompass(point.windDirection)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Maré</dt>
                          <dd className="font-semibold text-[#1a2e28]">
                            {formatNumber(point.seaLevel, 2)} m
                          </dd>
                        </div>
                      </dl>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mt-5" aria-labelledby="dias-title">
              <h2 id="dias-title" className="text-lg font-bold">
                Melhores janelas em 3 dias
              </h2>
              <div className="mt-3 space-y-2">
                {dailyHighlights.map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-[#e3ebe8]"
                  >
                    <div className="w-12 shrink-0">
                      <p className="text-sm font-bold capitalize">{day.label}</p>
                      <p className="text-[10px] text-[#6f837d]">{formatHour(day.best.time)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {formatNumber(day.best.waveHeight)} m ·{" "}
                        {formatNumber(day.best.windSpeed, 0)} km/h{" "}
                        {degreesToCompass(day.best.windDirection)}
                      </p>
                      <p className="text-[11px] text-[#6f837d]">
                        swell {formatNumber(day.best.swellPeriod, 1)} s
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${ratingClass(
                        day.rating.tone
                      )}`}
                    >
                      {day.rating.score}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {picoSelecionado?.slug ? (
              <Link
                href={`/lugares/${picoSelecionado.slug}`}
                className="mt-5 flex w-full items-center justify-center rounded-2xl bg-[#1a4a3a] px-4 py-3.5 text-sm font-bold text-white shadow-sm"
              >
                Ver detalhes e como chegar
              </Link>
            ) : null}
          </>
        ) : null}

        <footer className="mt-7 border-t border-[#d9e5e1] pt-4 text-[10px] leading-relaxed text-[#71837d]">
          <p>
            Previsões por Open-Meteo, DWD e modelos parceiros. Resolução costeira
            limitada; condições reais podem mudar rapidamente.
          </p>
          <p className="mt-1">
            O potencial é uma estimativa informativa e não avalia segurança, fundo,
            correntes, crowd ou habilidade do praticante.
          </p>
        </footer>
      </div>
    </main>
  );
}
