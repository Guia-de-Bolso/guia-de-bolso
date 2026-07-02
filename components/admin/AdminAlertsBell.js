"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { canAccessDevAdmin } from "@/lib/adminRoles";
import {
  ALERTA_PRIORIDADE,
  enrichAlertasComLidas,
  fetchAdminAlertas,
  filtrarAlertas,
  formatTempoRelativoAlerta,
  marcarAlertaLida,
  marcarTodasLidas,
} from "@/lib/adminAlertas";
import { createClient } from "@/lib/supabase";

const FILTROS = [
  { id: "nao_lidas", label: "Não lidas" },
  { id: "importantes", label: "Importantes" },
  { id: "todas", label: "Todas" },
];

/**
 * @param {string} prioridade
 * @returns {string}
 */
function prioridadeChipClass(prioridade) {
  if (prioridade === ALERTA_PRIORIDADE.ALTA) {
    return "bg-amber-100 text-amber-900";
  }
  return "bg-[#e8eeee] text-[#5a6b66]";
}

/**
 * Sino de alertas operacionais do painel admin.
 * @param {object} [props]
 * @param {string} [props.userId] - Namespace do localStorage de lidas.
 * @param {string} [props.adminRole] - Filtra alertas sensíveis (contratos) para role dev.
 * @returns {import("react").JSX.Element}
 */
export default function AdminAlertsBell({ userId, adminRole }) {
  const router = useRouter();
  const panelId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState("nao_lidas");
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAlertas = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const raw = await fetchAdminAlertas(supabase);
    const visible = raw.filter(
      (alerta) => !alerta.devOnly || canAccessDevAdmin(adminRole)
    );
    setAlertas(enrichAlertasComLidas(visible, userId));
    setLoading(false);
  }, [userId, adminRole, refreshKey]);

  useEffect(() => {
    loadAlertas();
    const interval = setInterval(loadAlertas, 120000);
    return () => clearInterval(interval);
  }, [loadAlertas]);

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const naoLidas = alertas.filter((a) => !a.lida);
  const badgeCount = naoLidas.length;
  const exibidos = filtrarAlertas(alertas, filtro);
  const unreadKeys = naoLidas.map((a) => a.dedupeKey);

  /**
   * @param {object} alerta
   */
  function handleAlertClick(alerta) {
    marcarAlertaLida(alerta.dedupeKey, userId);
    setAlertas((items) =>
      items.map((item) =>
        item.dedupeKey === alerta.dedupeKey ? { ...item, lida: true } : item
      )
    );
    setOpen(false);
    router.push(alerta.href);
  }

  function handleMarcarTodas() {
    marcarTodasLidas(unreadKeys, userId);
    setAlertas((items) => items.map((item) => ({ ...item, lida: true })));
    setRefreshKey((k) => k + 1);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) loadAlertas();
        }}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg shadow-sm ring-1 ring-black/5 transition hover:bg-[#f7faf9]"
        aria-label={
          badgeCount > 0
            ? `Alertas do admin, ${badgeCount} não lidos`
            : "Alertas do admin"
        }
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span aria-hidden>🔔</span>
        {badgeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d9534f] px-1 text-[10px] font-bold text-white">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            id={panelId}
            role="dialog"
            aria-label="Painel de alertas"
            className="fixed inset-x-3 bottom-3 top-auto z-50 flex max-h-[min(70vh,520px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 md:absolute md:inset-x-auto md:bottom-auto md:left-auto md:right-0 md:top-full md:mt-2 md:w-[min(100vw-2rem,380px)]"
          >
            <div className="flex items-center justify-between border-b border-[#e8eeee] px-4 py-3">
              <h2 className="text-base font-bold text-[#1a2e28]">Alertas</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-[#5a6b66] hover:bg-[#f0f4f3]"
                aria-label="Fechar painel"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-1 border-b border-[#e8eeee] px-3 py-2">
              {FILTROS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFiltro(item.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    filtro === item.id
                      ? "bg-[#1a4a3a] text-white"
                      : "bg-[#f0f4f3] text-[#5a6b66] hover:text-[#1a2e28]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {unreadKeys.length > 0 && (
              <div className="border-b border-[#e8eeee] px-4 py-2">
                <button
                  type="button"
                  onClick={handleMarcarTodas}
                  className="text-xs font-semibold text-[#1a4a3a] hover:underline"
                >
                  Marcar todas como lidas
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-2 py-2">
              {loading && alertas.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-[#5a6b66]">
                  Carregando alertas…
                </p>
              ) : exibidos.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-[#5a6b66]">
                  {filtro === "nao_lidas"
                    ? "Nenhum alerta pendente. Tudo em dia."
                    : "Nenhum alerta neste filtro."}
                </p>
              ) : (
                <ul className="space-y-1">
                  {exibidos.map((alerta) => (
                    <li key={alerta.dedupeKey}>
                      <button
                        type="button"
                        onClick={() => handleAlertClick(alerta)}
                        className={`flex w-full gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#f0f4f3] ${
                          !alerta.lida ? "bg-[#eef8f4]/80" : ""
                        }`}
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f4f3] text-lg"
                          aria-hidden
                        >
                          {alerta.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-sm font-semibold leading-snug ${
                                alerta.lida ? "text-[#5a6b66]" : "text-[#1a2e28]"
                              }`}
                            >
                              {alerta.titulo}
                            </span>
                            {!alerta.lida && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#1a4a3a]" />
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-[#5a6b66]">
                            {alerta.mensagem}
                          </span>
                          <span className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${prioridadeChipClass(alerta.prioridade)}`}
                            >
                              {alerta.prioridade === ALERTA_PRIORIDADE.ALTA
                                ? "Importante"
                                : "Info"}
                            </span>
                            <span className="text-[10px] text-[#9aa8a3]">
                              {formatTempoRelativoAlerta(alerta.createdAt)}
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-[#e8eeee] px-4 py-2 text-center">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-[#1a4a3a] hover:underline"
              >
                Ir ao dashboard →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
