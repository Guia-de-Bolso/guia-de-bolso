/**
 * Contador para ignorar refetches de favoritos após toggle otimista.
 * @returns {{ bump: () => number, isCurrent: (gen: number) => boolean }}
 */
export function createFavoritosSyncGuard() {
  let generation = 0;
  return {
    bump: () => {
      generation += 1;
      return generation;
    },
    isCurrent: (gen) => gen === generation,
  };
}
