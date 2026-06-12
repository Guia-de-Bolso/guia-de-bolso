"use client";

import AvaliacaoForm from "@/components/AvaliacaoForm";
import NavigationAppSheet from "@/components/NavigationAppSheet";
import LoginModal from "@/components/LoginModal";
import LugarAvaliacoesSection from "@/components/lugar/LugarAvaliacoesSection";
import LugarBottomSheet from "@/components/lugar/LugarBottomSheet";
import LugarClimaWidget from "@/components/lugar/LugarClimaWidget";
import LugarHorariosCompact from "@/components/lugar/LugarHorariosCompact";
import LugarLocalizacaoCard from "@/components/lugar/LugarLocalizacaoCard";
import LugarQuickActions from "@/components/lugar/LugarQuickActions";
import LugarCtaBarAirbnb from "@/components/lugar/airbnb/LugarCtaBarAirbnb";
import LugarGalleryAirbnb from "@/components/lugar/airbnb/LugarGalleryAirbnb";
import LugarVideoSection from "@/components/lugar/LugarVideoSection";
import LugarSectionAirbnb, {
  LugarCardAirbnb,
  LugarDividerAirbnb,
} from "@/components/lugar/airbnb/LugarSectionAirbnb";
import LugarStickyHeader from "@/components/lugar/airbnb/LugarStickyHeader";
import {
  DESTAQUE_CHIP_PREMIUM_CLASS,
  DETALHE_CARD_OVERLAP_CLASS,
} from "@/components/lugar/airbnb/lugarAirbnbTokens";
import { getBadgeCuradoriaLabel, getBadgeParceiroLabel } from "@/lib/lugarBadges";
import { lugarExibeClima } from "@/lib/clima";
import { lugarExibeVideo } from "@/lib/lugarVideo";
import { formatHorario, getDiasHorario } from "@/lib/horarios";

/**
 * Detalhe do lugar — layout inspirado no Airbnb, paleta Guia de Bolso.
 * @param {ReturnType<import("@/hooks/useLugarDetalhe").useLugarDetalhe>} props
 * @returns {import("react").ReactElement}
 */
export default function LugarDetalheAirbnb(props) {
  const {
    lugar,
    user,
    isFavorito,
    toast,
    showQrBanner,
    setShowQrBanner,
    showHorarios,
    setShowHorarios,
    showRotas,
    setShowRotas,
    mapPreference,
    sobreExpandido,
    setSobreExpandido,
    avaliacoes,
    jaAvaliou,
    showAvaliacaoForm,
    setShowAvaliacaoForm,
    isModalOpen,
    setIsModalOpen,
    motivoModal,
    setMotivoModal,
    localizacao,
    subcategoria,
    visibilidade,
    imagens,
    status,
    diaAtual,
    enderecoExibicao,
    descricaoLonga,
    historiaCultura,
    historiaExpandido,
    setHistoriaExpandido,
    totalAvaliacoes,
    mediaAvaliacoes,
    distancia,
    tagsExibidas,
    fraseConvencimento,
    ehEstabelecimento,
    ctaLabel,
    staticMapSrc,
    mapsLink,
    acoesRapidas,
    modoAcoes,
    badgeStyle,
    horarioResumo,
    handleFavoritar,
    handleShare,
    handleOpenAvaliacao,
    handleAvaliacaoEnviada,
    launchNavigationApp,
    openRoute,
    backHref = "/",
  } = props;

  const temNota = totalAvaliacoes > 0 && mediaAvaliacoes > 0;
  const localSubtitle = [
    lugar.subcategoria,
    distancia,
    enderecoExibicao ? enderecoExibicao.split(",")[0]?.trim() : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-[#f0f4f3] pb-28 text-[#1a2e28]">
      {toast && (
        <div className="fixed left-4 right-4 top-4 z-[60] mx-auto max-w-md rounded-xl bg-[#1a4a3a] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <LugarStickyHeader
        title={lugar.nome}
        backHref={backHref}
        isFavorito={isFavorito}
        onFavoritar={handleFavoritar}
        onShare={handleShare}
      />

      <div className="mx-auto max-w-md">
        <div className="detalhe-hero-sticky sticky top-0 z-0">
          <LugarGalleryAirbnb
            nome={lugar.nome}
            imagens={imagens}
            backHref={backHref}
            isFavorito={isFavorito}
            onFavoritar={handleFavoritar}
            onShare={handleShare}
            parceiroBadgeLabel={
              visibilidade.showBadgeParceiro
                ? getBadgeParceiroLabel().toUpperCase()
                : null
            }
            curadoriaBadgeLabel={
              visibilidade.showBadgeCuradoria
                ? getBadgeCuradoriaLabel().toUpperCase()
                : null
            }
          />
        </div>

        <div className={`${DETALHE_CARD_OVERLAP_CLASS} px-7 pt-8 pb-2`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${badgeStyle}`}
                >
                  {lugar.categoria}
                </span>
                {visibilidade.showBadgeParceiro && (
                  <span className="rounded-md bg-[#f5e6b8] px-2 py-0.5 text-[11px] font-bold text-[#7a6520]">
                    {getBadgeParceiroLabel()}
                  </span>
                )}
                {visibilidade.showBadgeCuradoria && (
                  <span className="rounded-md bg-[#d4ede8] px-2 py-0.5 text-[11px] font-bold text-[#1a4a3a]">
                    {getBadgeCuradoriaLabel()}
                  </span>
                )}
                {ehEstabelecimento && (
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      status.aberto
                        ? "bg-[#d4ede8] text-[#1a4a3a]"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {status.aberto ? "Aberto" : "Fechado"}
                  </span>
                )}
              </div>

              <h2 className="font-display text-[28px] font-bold leading-[1.15] tracking-tight text-[#1a2e28]">
                {lugar.nome}
              </h2>

              {localSubtitle && (
                <p className="mt-2 text-[13px] leading-snug text-[#5a6b66]">{localSubtitle}</p>
              )}
            </div>

            {temNota && (
              <div className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                <span className="text-sm font-semibold text-amber-500">★</span>
                <span className="text-sm font-bold text-amber-600">
                  {mediaAvaliacoes.toFixed(1)}
                </span>
                <span className="text-xs font-medium text-amber-700/90">
                  ({totalAvaliacoes})
                </span>
              </div>
            )}
          </div>

          {showQrBanner && (
            <div className="mt-4 rounded-xl bg-[#eef8f4] px-4 py-3 text-sm text-[#1a4a3a] ring-1 ring-[#1a4a3a]/10">
              Você abriu o guia pelo QR de{" "}
              <span className="font-semibold">{lugar.nome}</span>
              <button
                type="button"
                onClick={() => setShowQrBanner(false)}
                className="ml-2 text-xs font-semibold text-[#5a6b66] underline"
              >
                Fechar
              </button>
            </div>
          )}

          {lugarExibeVideo(lugar) && (
            <>
              <div className="-mx-1 mt-5">
                <LugarVideoSection
                  videoUrl={lugar.video_url}
                  posterUrl={imagens[0] || lugar.imagem_url}
                  nome={lugar.nome}
                />
              </div>
              <LugarDividerAirbnb />
            </>
          )}

          <p className="mt-5 text-[15px] leading-[1.65] text-[#3d4f4a]">
            {fraseConvencimento}
          </p>

          <LugarDividerAirbnb />

          {acoesRapidas.length > 0 && (
            <LugarSectionAirbnb title={ehEstabelecimento ? "Contato" : "Informações"}>
              <LugarQuickActions modo={modoAcoes} variant="premium" acoes={acoesRapidas} />
            </LugarSectionAirbnb>
          )}

          {tagsExibidas.length > 0 && (
            <>
              <LugarDividerAirbnb />
              <LugarSectionAirbnb title="Destaques">
                <div className="flex flex-wrap gap-2">
                  {tagsExibidas.map((tag) => (
                    <span key={tag.id} className={DESTAQUE_CHIP_PREMIUM_CLASS}>
                      {tag.icone && (
                        <span className="shrink-0 text-base leading-none" aria-hidden>
                          {tag.icone}
                        </span>
                      )}
                      <span className="text-[#5a6b66]">{tag.nome}</span>
                    </span>
                  ))}
                </div>
              </LugarSectionAirbnb>
            </>
          )}

          {lugar.mostrar_horarios && (
            <>
              <LugarDividerAirbnb />
              <LugarSectionAirbnb title="Horários">
                <LugarHorariosCompact
                  resumo={horarioResumo}
                  aberto={status.aberto}
                  onVerCompletos={() => setShowHorarios(true)}
                />
              </LugarSectionAirbnb>
            </>
          )}

          {lugarExibeClima(lugar, localizacao) && (
            <>
              <LugarDividerAirbnb />
              <LugarSectionAirbnb title="Clima na região">
                <LugarClimaWidget
                  variant="premium"
                  nomeLugar={lugar.nome}
                  latitude={Number(localizacao.latitude)}
                  longitude={Number(localizacao.longitude)}
                  user={user}
                  onLoginRequired={() => {
                    setMotivoModal("clima");
                    setIsModalOpen(true);
                  }}
                />
              </LugarSectionAirbnb>
            </>
          )}

          {lugar.mostrar_endereco && enderecoExibicao && (
            <>
              <LugarDividerAirbnb />
              <LugarSectionAirbnb title="Onde fica">
                <LugarLocalizacaoCard
                  variant="airbnb"
                  nome={lugar.nome}
                  endereco={enderecoExibicao}
                  mapUrl={mapsLink}
                  staticMapSrc={staticMapSrc}
                  latitude={localizacao?.latitude}
                  longitude={localizacao?.longitude}
                  onAbrirMapa={() => openRoute()}
                />
              </LugarSectionAirbnb>
            </>
          )}

          {descricaoLonga && (
            <>
              <LugarDividerAirbnb />
              <LugarSectionAirbnb title="Sobre este lugar">
                <LugarCardAirbnb>
                  <p
                    className={`text-[15px] leading-relaxed text-[#5a6b66] ${
                      sobreExpandido ? "" : "line-clamp-6"
                    }`}
                  >
                    {descricaoLonga}
                  </p>
                  {!sobreExpandido && descricaoLonga.length > 220 && (
                    <button
                      type="button"
                      onClick={() => setSobreExpandido(true)}
                      className="mt-3 text-sm font-semibold text-[#1a4a3a] underline"
                    >
                      Mostrar mais
                    </button>
                  )}
                </LugarCardAirbnb>
              </LugarSectionAirbnb>
            </>
          )}

          {historiaCultura && (
            <>
              <LugarDividerAirbnb />
              <LugarSectionAirbnb title="História e cultura">
                <LugarCardAirbnb>
                  <p
                    className={`text-[15px] leading-relaxed text-[#5a6b66] ${
                      historiaExpandido ? "" : "line-clamp-6"
                    }`}
                  >
                    {historiaCultura}
                  </p>
                  {!historiaExpandido && historiaCultura.length > 220 && (
                    <button
                      type="button"
                      onClick={() => setHistoriaExpandido(true)}
                      className="mt-3 text-sm font-semibold text-[#1a4a3a] underline"
                    >
                      Mostrar mais
                    </button>
                  )}
                </LugarCardAirbnb>
              </LugarSectionAirbnb>
            </>
          )}

          <LugarDividerAirbnb />

          <div className="pb-4">
            <LugarAvaliacoesSection
              avaliacoes={avaliacoes}
              jaAvaliou={jaAvaliou}
              onAvaliar={handleOpenAvaliacao}
              toast={toast}
            />
          </div>
        </div>
      </div>

      <LugarCtaBarAirbnb label={ctaLabel} onClick={() => openRoute()} />

      <LugarBottomSheet
        isOpen={showHorarios}
        onClose={() => setShowHorarios(false)}
        title="Horários completos"
      >
        <div className="space-y-2">
          {getDiasHorario().map(({ key, label }) => {
            const value = lugar.horarios?.[key] ?? "fechado";
            const isToday = key === diaAtual;
            return (
              <div
                key={key}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${
                  isToday ? "bg-[#d4ede8] font-bold text-[#1a4a3a]" : "text-[#5a6b66]"
                }`}
              >
                <span className="capitalize">{label}</span>
                {value === "fechado" ? (
                  <span className="rounded-full bg-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-600">
                    Fechado
                  </span>
                ) : (
                  <span>{formatHorario(value)}</span>
                )}
              </div>
            );
          })}
        </div>
      </LugarBottomSheet>

      <NavigationAppSheet
        isOpen={showRotas}
        onClose={() => setShowRotas(false)}
        preferredKey={mapPreference}
        onSelect={(appKey, remember) => launchNavigationApp(appKey, remember)}
      />

      <AvaliacaoForm
        isOpen={showAvaliacaoForm}
        onClose={() => setShowAvaliacaoForm(false)}
        lugar={{
          id: lugar.id,
          nome: lugar.nome,
          categoria: lugar.categoria,
          subcategoria: lugar.subcategoria,
        }}
        onSuccess={handleAvaliacaoEnviada}
      />

      <LoginModal
        isOpen={isModalOpen}
        motivo={motivoModal}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
