"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  clearPercursoProgresso,
  getPercursoPercentual,
  getProximoPontoIndex,
  readPercursoProgresso,
  togglePontoConcluido,
  writePercursoProgresso,
} from "@/lib/atrativoPercursoProgresso";

/** @type {Set<() => void>} */
const listeners = new Set();

/** @type {Map<string, { completedIds: string[], updatedAt: number|null }>} */
const snapshotCache = new Map();

const EMPTY_SNAPSHOT = Object.freeze({ completedIds: Object.freeze([]), updatedAt: null });

/**
 * @param {string} key
 * @param {{ completedIds: string[], updatedAt: number|null }} snapshot
 */
function cacheSnapshot(key, snapshot) {
  const frozen = {
    completedIds: Object.freeze([...snapshot.completedIds]),
    updatedAt: snapshot.updatedAt,
  };
  snapshotCache.set(key, frozen);
  return frozen;
}

/**
 * @param {string|number|null|undefined} rotaId
 */
function getSnapshotFor(rotaId) {
  if (rotaId == null || rotaId === "") return EMPTY_SNAPSHOT;
  const key = String(rotaId);
  const fresh = readPercursoProgresso(rotaId);
  const cached = snapshotCache.get(key);
  if (
    cached &&
    cached.updatedAt === fresh.updatedAt &&
    cached.completedIds.length === fresh.completedIds.length &&
    cached.completedIds.every((id, index) => id === fresh.completedIds[index])
  ) {
    return cached;
  }
  return cacheSnapshot(key, fresh);
}

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

/**
 * Progresso do percurso (localStorage) para um atrativo.
 * @param {string|number|null|undefined} rotaId
 * @param {Array<{ id?: string }>} pontos
 */
export function useAtrativoPercursoProgresso(rotaId, pontos = []) {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => getSnapshotFor(rotaId),
    () => EMPTY_SNAPSHOT
  );

  const completedIds = snapshot.completedIds;

  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);

  const total = pontos.length;
  const completedCount = useMemo(() => {
    if (!total) return 0;
    return pontos.filter((ponto) => {
      const id = String(ponto?.id ?? "").trim();
      return id && completedSet.has(id);
    }).length;
  }, [pontos, completedSet, total]);

  const percentual = getPercursoPercentual(completedCount, total);
  const proximoIndex = getProximoPontoIndex(pontos, completedIds);
  const isComplete = total > 0 && completedCount >= total;

  const persist = useCallback(
    (nextIds) => {
      if (rotaId == null || rotaId === "") return;
      const written = writePercursoProgresso(rotaId, nextIds);
      cacheSnapshot(String(rotaId), written);
      emitChange();
    },
    [rotaId]
  );

  const setPontoDone = useCallback(
    (pontoId, done) => {
      persist(togglePontoConcluido(completedIds, pontoId, done));
    },
    [completedIds, persist]
  );

  const togglePonto = useCallback(
    (pontoId) => {
      const id = String(pontoId ?? "").trim();
      if (!id) return;
      setPontoDone(id, !completedSet.has(id));
    },
    [completedSet, setPontoDone]
  );

  const resetProgresso = useCallback(() => {
    if (rotaId == null || rotaId === "") return;
    clearPercursoProgresso(rotaId);
    cacheSnapshot(String(rotaId), { completedIds: [], updatedAt: null });
    emitChange();
  }, [rotaId]);

  const isPontoDone = useCallback(
    (pontoId) => completedSet.has(String(pontoId ?? "").trim()),
    [completedSet]
  );

  return {
    completedIds,
    completedCount,
    total,
    percentual,
    proximoIndex,
    isComplete,
    isPontoDone,
    setPontoDone,
    togglePonto,
    resetProgresso,
  };
}
