/** Snapshot guest da aba Perfil para export estático do Capacitor. */
export const CAPACITOR_GUEST_PERFIL_INITIAL = {
  user: null,
  perfil: null,
  stats: { favoritos: 0, avaliacoes: 0, roteiros: 0 },
};

/**
 * Build estático para bundle local no app nativo (Capacitor).
 * @returns {boolean}
 */
export function isCapacitorBuild() {
  return process.env.CAPACITOR_BUILD === "1";
}

/**
 * @returns {'force-static' | undefined}
 */
export function capacitorPageDynamic() {
  return isCapacitorBuild() ? "force-static" : undefined;
}
