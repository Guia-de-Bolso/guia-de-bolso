/**
 * Texto acessível para estados de carregamento de rota.
 * @returns {import("react").ReactElement}
 */
export default function RouteLoadingStatus() {
  return (
    <p className="sr-only" role="status" aria-live="polite" aria-busy="true">
      Carregando…
    </p>
  );
}
