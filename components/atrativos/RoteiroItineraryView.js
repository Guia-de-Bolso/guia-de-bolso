"use client";

import { useEffect, useMemo, useState } from "react";
import RoteiroDiaBlock from "@/components/roteiro/RoteiroDiaBlock";
import RoteiroGuideHeader from "@/components/roteiro/RoteiroGuideHeader";
import { useOfflineMode } from "@/components/OfflineModeProvider";
import { getCapaThumbFromLugar } from "@/lib/fotos";
import { getLugarPublicPath } from "@/lib/lugarPublicPath";
import { buildMapsUrlsForLugar } from "@/lib/mapsCoordinates";
import { MAP_PREFERENCE_STORAGE_KEY } from "@/lib/perfil";
import { descreverDeslocamento } from "@/lib/roteiroDeslocamento";
import { textoRoteiroLimpo } from "@/lib/roteiroDisplay";
import { ROTEIRO_RETURN_PATH } from "@/lib/roteiroDraft";
import {
  countRoteiroParadas,
  parseRoteiroMarkdown,
} from "@/lib/roteiroParse";
import {
  loadParadasConcluidas,
  paradaProgressoKey,
  roteiroProgressScope,
  toggleParadaConcluida,
} from "@/lib/roteiroProgresso";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a4a3a]";

/**
 * @param {import("@/lib/roteiroParse").RoteiroDia[]} dias
 * @returns {Set<number>}
 */
function diasIniciaisAbertos(dias) {
  if (dias.length <= 2) return new Set(dias.map((dia) => dia.numero));
  return new Set(dias[0] ? [dias[0].numero] : []);
}

/**
 * @param {import("@/lib/roteiroParse").RoteiroDia} dia
 * @returns {import("@/lib/roteiroParse").RoteiroParada[]}
 */
function paradasDoDia(dia) {
  return [
    ...dia.periodos.flatMap((periodo) => periodo.paradas),
    ...dia.paradasSemPeriodo,
  ];
}

/**
 * @param {object|null|undefined} lugar
 * @returns {{ latitude: number, longitude: number }|null}
 */
function coordsDoLugar(lugar) {
  const latitude = Number(lugar?.latitude);
  const longitude = Number(lugar?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

/**
 * Guia visual do roteiro gerado ou salvo.
 * @param {object} props
 * @param {string} props.conteudo
 * @param {string} [props.titulo]
 * @param {string} [props.diasLabel]
 * @param {string} [props.perfil]
 * @param {string[]} [props.interesses]
 * @param {Array<object>} [props.lugaresCatalog]
 * @param {boolean} [props.compactHeader]
 * @param {string} [props.className]
 * @param {string} [props.returnPath]
 * @param {string} [props.roteiroId]
 * @param {boolean} [props.jaSalvo]
 * @param {boolean} [props.salvando]
 * @param {() => void} [props.onSalvar]
 * @param {string} [props.titleId]
 * @returns {import("react").JSX.Element}
 */
export default function RoteiroItineraryView({
  conteudo,
  titulo = "",
  diasLabel = "",
  perfil = "",
  interesses = [],
  lugaresCatalog = [],
  compactHeader = false,
  className = "",
  returnPath = ROTEIRO_RETURN_PATH,
  roteiroId = "",
  jaSalvo = false,
  salvando = false,
  onSalvar,
  titleId = "roteiro-guide-title",
}) {
  const { offlineLimited } = useOfflineMode();
  const parsed = useMemo(
    () => parseRoteiroMarkdown(conteudo, lugaresCatalog),
    [conteudo, lugaresCatalog]
  );

  const catalogoPorId = useMemo(() => {
    const map = new Map();
    for (const item of lugaresCatalog ?? []) {
      if (item?.id) map.set(String(item.id), item);
    }
    return map;
  }, [lugaresCatalog]);

  const capaPorId = useMemo(() => {
    const map = new Map();
    for (const item of lugaresCatalog ?? []) {
      if (!item?.id) continue;
      const capa = getCapaThumbFromLugar(item);
      if (capa) map.set(String(item.id), capa);
    }
    return map;
  }, [lugaresCatalog]);

  const capaRoteiro = useMemo(() => {
    for (const dia of parsed.dias) {
      for (const parada of paradasDoDia(dia)) {
        const url = parada.lugarId ? capaPorId.get(String(parada.lugarId)) : "";
        if (url) return { url, alt: textoRoteiroLimpo(parada.nome) };
      }
    }
    return { url: "", alt: "" };
  }, [parsed.dias, capaPorId]);

  const totalParadas = countRoteiroParadas(parsed);
  const scope = roteiroProgressScope(roteiroId, conteudo);
  const [concluidas, setConcluidas] = useState(() => loadParadasConcluidas(scope));
  const [diasAbertos, setDiasAbertos] = useState(() => diasIniciaisAbertos(parsed.dias));
  const [diaAtivo, setDiaAtivo] = useState(parsed.dias[0]?.numero ?? null);

  useEffect(() => {
    const nodes = [...document.querySelectorAll("[data-dia]")];
    if (nodes.length < 2) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visivel = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const numero = Number(visivel?.target?.getAttribute("data-dia"));
        if (Number.isFinite(numero) && numero > 0) setDiaAtivo(numero);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.2, 0.45] }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [conteudo, parsed.dias.length]);

  const proximaKey = useMemo(() => {
    for (const dia of parsed.dias) {
      for (const parada of paradasDoDia(dia)) {
        const key = paradaProgressoKey(dia.numero, parada.ordem);
        if (!concluidas.has(key)) return key;
      }
    }
    return null;
  }, [parsed.dias, concluidas]);

  const todasFeitas = totalParadas > 0 && proximaKey == null && concluidas.size > 0;

  /**
   * @param {string} key
   */
  function handleToggleConcluida(key) {
    setConcluidas(new Set(toggleParadaConcluida(scope, key)));
  }

  /**
   * @param {number} numero
   */
  function irParaDia(numero) {
    setDiasAbertos((atual) => {
      const proximo = new Set(atual);
      proximo.add(numero);
      return proximo;
    });
    setDiaAtivo(numero);
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      document.getElementById(`roteiro-dia-${numero}`)?.scrollIntoView({
        behavior: reduzir ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  /**
   * @param {import("@/lib/roteiroParse").RoteiroParada} parada
   * @param {object|null|undefined} lugar
   * @returns {string|null}
   */
  function getHref(parada, lugar) {
    if (!parada.lugarId) return null;
    return getLugarPublicPath(lugar ?? { id: parada.lugarId }, { from: returnPath });
  }

  /**
   * @param {import("@/lib/roteiroParse").RoteiroParada} atual
   * @param {import("@/lib/roteiroParse").RoteiroParada} proxima
   * @returns {string|null}
   */
  function getDeslocamento(atual, proxima) {
    const origem = coordsDoLugar(
      atual.lugarId ? catalogoPorId.get(String(atual.lugarId)) : null
    );
    const destino = coordsDoLugar(
      proxima.lugarId ? catalogoPorId.get(String(proxima.lugarId)) : null
    );
    return descreverDeslocamento(origem, destino);
  }

  /**
   * @param {import("@/lib/roteiroParse").RoteiroParada} parada
   * @param {object|null|undefined} lugar
   */
  function handleIrAgora(parada, lugar) {
    const nome = lugar?.nome || textoRoteiroLimpo(parada.nome);
    if (!nome) return;

    const coords = coordsDoLugar(lugar);
    const localizacao = coords
      ? { ...coords, endereco_completo: lugar?.endereco || "" }
      : lugar?.endereco
        ? { endereco_completo: lugar.endereco }
        : null;
    const urls = buildMapsUrlsForLugar({ nome }, localizacao);
    if (!urls) return;

    let app = "google";
    try {
      const salvo = localStorage.getItem(MAP_PREFERENCE_STORAGE_KEY);
      if (salvo && urls[salvo]) app = salvo;
    } catch {
      app = "google";
    }

    window.open(urls[app], "_blank", "noopener,noreferrer");
  }

  if (!conteudo?.trim()) {
    return (
      <EstadoRoteiro
        titulo="Não foi possível montar o roteiro"
        texto="Tente gerar novamente."
      />
    );
  }

  const diasTexto =
    diasLabel ||
    (parsed.dias.length
      ? `${parsed.dias.length} ${parsed.dias.length === 1 ? "dia" : "dias"}`
      : "");
  const paradasTexto = totalParadas
    ? `${totalParadas} ${totalParadas === 1 ? "parada" : "paradas"}`
    : "";
  const interessesTexto = (interesses ?? []).map(textoRoteiroLimpo).filter(Boolean).join(" · ");

  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <style>{`
        @keyframes roteiroDiaIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        .roteiro-dia-panel { animation: roteiroDiaIn 280ms ease; }
        @media (prefers-reduced-motion: reduce) {
          .roteiro-dia-panel { animation: none; }
        }
      `}</style>

      {!compactHeader ? (
        <RoteiroGuideHeader
          titleId={titleId}
          titulo={titulo}
          perfil={perfil}
          diasTexto={diasTexto}
          paradasTexto={paradasTexto}
          interessesTexto={interessesTexto}
          capaUrl={capaRoteiro.url}
          capaAlt={capaRoteiro.alt}
          jaSalvo={jaSalvo}
          salvando={salvando}
          onSalvar={onSalvar}
        />
      ) : null}

      {parsed.fallbackTexto && parsed.intro.length > 0 ? (
        <div className={`${compactHeader ? "" : "mt-5"} space-y-3 text-[15px] leading-relaxed text-[#3d4f4a]`}>
          {parsed.intro.map((line) => (
            <p key={line.slice(0, 48)}>{textoRoteiroLimpo(line)}</p>
          ))}
        </div>
      ) : null}

      {!parsed.fallbackTexto && parsed.intro.length > 0 ? (
        <p className="mt-5 text-[15px] leading-relaxed text-[#3d4f4a]">
          {parsed.intro.slice(0, 2).map(textoRoteiroLimpo).filter(Boolean).join(" ")}
        </p>
      ) : null}

      {!parsed.fallbackTexto && parsed.dias.length === 0 ? (
        <EstadoRoteiro
          className="mt-5"
          titulo="Roteiro sem paradas estruturadas"
          texto="Gere novamente para reorganizar."
        />
      ) : null}

      {parsed.dias.length > 1 ? (
        <div className="sticky top-0 z-10 mt-5 bg-white/95 py-2.5 backdrop-blur-md">
          <div
            className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Dias do roteiro"
          >
            {parsed.dias.map((dia) => {
              const ativo = diaAtivo === dia.numero;
              return (
                <button
                  key={`nav-${dia.numero}`}
                  type="button"
                  role="tab"
                  aria-selected={ativo}
                  onClick={() => irParaDia(dia.numero)}
                  className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${FOCUS_RING} ${
                    ativo ? "bg-[#1a4a3a] text-white" : "bg-[#f0f4f3] text-[#1a4a3a]"
                  }`}
                >
                  Dia {dia.numero}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {parsed.dias.length > 0 ? (
        <div className={`space-y-8 ${parsed.dias.length > 1 ? "mt-4" : "mt-6"}`} role="list">
          {parsed.dias.map((dia) => (
            <RoteiroDiaBlock
              key={`dia-${dia.numero}-${dia.titulo}`}
              dia={dia}
              open={diasAbertos.has(dia.numero)}
              onToggle={() =>
                setDiasAbertos((atual) => {
                  const proximo = new Set(atual);
                  if (proximo.has(dia.numero)) proximo.delete(dia.numero);
                  else proximo.add(dia.numero);
                  return proximo;
                })
              }
              catalogoPorId={catalogoPorId}
              capaPorId={capaPorId}
              getHref={getHref}
              getDeslocamento={getDeslocamento}
              onIrAgora={offlineLimited ? undefined : handleIrAgora}
              proximaKey={proximaKey}
              concluidas={concluidas}
              onToggleConcluida={handleToggleConcluida}
              paradaKey={paradaProgressoKey}
            />
          ))}
        </div>
      ) : null}

      {todasFeitas ? (
        <p className="mt-6 rounded-2xl bg-[#e7f3ee] px-4 py-3 text-sm leading-relaxed text-[#1a4a3a]">
          Todas as paradas marcadas como feitas nesta consulta. A marcação fica neste aparelho
          até você fechar a aba.
        </p>
      ) : null}
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} props.titulo
 * @param {string} props.texto
 * @param {string} [props.className]
 * @returns {import("react").JSX.Element}
 */
function EstadoRoteiro({ titulo, texto, className = "" }) {
  return (
    <div className={`rounded-[24px] bg-[#f4f8f6] px-5 py-10 text-center ${className}`.trim()}>
      <p className="font-display text-lg font-bold text-[#1a2e28]">{titulo}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#5a6b66]">{texto}</p>
    </div>
  );
}
