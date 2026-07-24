"use client";

import DailyLimitCountdown from "@/components/DailyLimitCountdown";
import LoginModal from "@/components/LoginModal";
import PremiumPaywallSheet from "@/components/PremiumPaywallSheet";
import SearchBrowsePanel from "@/components/home/SearchBrowsePanel";
import SearchResultsPanel from "@/components/home/SearchResultsPanel";
import SearchStatusFilter from "@/components/home/SearchStatusFilter";
import SmartSearch from "@/components/home/SmartSearch";
import { useSmartSearch } from "@/hooks/useSmartSearch";

/**
 * Barra de busca IA completa (mesmo design/comportamento da home) + painéis e gates.
 *
 * @param {object} props
 * @param {import("react").ReactNode} [props.children] - Conteúdo oculto enquanto a busca está aberta.
 * @param {((node: HTMLDivElement | null) => void) | import("react").RefObject<HTMLDivElement|null>} [props.stickyShellRef]
 * @param {string} [props.shellClassName]
 * @param {string} [props.reportRoute]
 * @returns {import("react").JSX.Element}
 */
export default function SmartSearchExperience({
  children,
  stickyShellRef,
  shellClassName = "",
  reportRoute = "/",
}) {
  const search = useSmartSearch({ reportRoute });

  return (
    <>
      <div ref={stickyShellRef} className={shellClassName}>
        <SmartSearch
          searchContainerRef={search.searchContainerRef}
          searchInputRef={search.searchInputRef}
          termoBusca={search.termoBusca}
          searchMode={search.searchMode}
          onSubmit={(e) => {
            e.preventDefault();
            void search.executarBusca(search.termoBusca);
          }}
          onFocus={search.handleSearchFocus}
          onBlur={search.handleSearchBlur}
          onChange={search.setTermoBusca}
          onClose={search.fecharBusca}
          onChipClick={search.handleChipClick}
          showChips={!search.searchMode}
          voiceSupported={search.voiceSupported}
          voiceListening={search.voiceListening}
          voiceError={search.voiceError}
          onVoiceToggle={search.onVoiceToggle}
        />
      </div>

      <div
        className={`transition-all duration-300 ease-out ${
          search.searchMode
            ? "translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-3 overflow-hidden opacity-0"
        }`}
      >
        {search.searchMode && (
          <SearchStatusFilter
            value={search.filtroBuscaStatus}
            onChange={search.handleFiltroBuscaChange}
          />
        )}
        {search.user && search.searchMode && (
          <p className="mb-2 text-center text-[10px] text-[#8a9a95]">
            {search.premiumUsageLoading && !search.premiumUsage
              ? "Carregando uso de IA…"
              : search.premiumUsage?.premium
                ? "Premium · buscas ilimitadas"
                : `IA ${search.premiumUsage?.buscas?.used ?? 0}/${search.premiumUsage?.buscas?.limit ?? search.limitsBusca} hoje · renova à meia-noite`}
          </p>
        )}
        {search.buscaLimiteDiarioAtingido && search.searchMode && (
          <div className="mb-3">
            <DailyLimitCountdown initialMs={search.premiumUsage?.msUntilReset} />
          </div>
        )}
        {search.searchMode === "browse" && (
          <SearchBrowsePanel
            visitados={search.visitadosRecentes}
            populares={search.lugaresPopulares}
            loadingPopulares={search.loadingPopulares}
          />
        )}
        {search.searchMode === "results" && (
          <SearchResultsPanel
            termo={search.termoResultado}
            loading={search.loadingBusca}
            resultados={search.resultadosBusca}
            erro={search.erroBusca}
            erroReportavel={search.erroBuscaReportavel}
            erroReportContext={search.erroBuscaContext}
            onSugestaoClick={search.executarBusca}
            isFavorito={search.isFavorito}
            onFavoritar={search.handleFavoritar}
          />
        )}
      </div>

      <div
        className={`transition-all duration-300 ease-out ${
          search.searchMode
            ? "pointer-events-none max-h-0 -translate-y-3 overflow-hidden opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        {children}
      </div>

      <LoginModal
        isOpen={search.isModalOpen}
        motivo={search.motivoModal}
        onClose={() => search.setIsModalOpen(false)}
      />

      <PremiumPaywallSheet
        isOpen={search.paywallOpen}
        feature={search.paywallFeature}
        user={search.user}
        onLoginRequired={() => {
          search.setPaywallOpen(false);
          search.setMotivoModal("premium");
          search.setIsModalOpen(true);
        }}
        onPremiumActivated={(nextUsage) => {
          if (nextUsage) search.setPremiumUsage(nextUsage);
          else search.refreshPremiumUsage();
        }}
        onClose={() => search.setPaywallOpen(false)}
      />
    </>
  );
}
