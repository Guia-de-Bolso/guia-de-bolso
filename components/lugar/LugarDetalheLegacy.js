"use client";

import Link from "next/link";
import AvaliacaoForm from "@/components/AvaliacaoForm";
import NavigationAppSheet from "@/components/NavigationAppSheet";
import IconBack from "@/components/IconBack";
import UserErrorAlert from "@/components/UserErrorAlert";
import LoginModal from "@/components/LoginModal";
import LugarAvaliacoesSection from "@/components/lugar/LugarAvaliacoesSection";
import LugarBottomSheet from "@/components/lugar/LugarBottomSheet";
import LugarCtaFixo from "@/components/lugar/LugarCtaFixo";
import LugarHero from "@/components/lugar/LugarHero";
import LugarClimaWidget from "@/components/lugar/LugarClimaWidget";
import LugarHorariosCompact from "@/components/lugar/LugarHorariosCompact";
import LugarLocalizacaoCard from "@/components/lugar/LugarLocalizacaoCard";
import LugarQuickActions from "@/components/lugar/LugarQuickActions";
import LugarTags from "@/components/lugar/LugarTags";
import { getBadgeCuradoriaLabel, getBadgeParceiroLabel } from "@/lib/lugarBadges";
import { buildReportContext } from "@/lib/reportContext";
import { lugarExibeClima } from "@/lib/clima";
import { formatHorario, getDiasHorario } from "@/lib/horarios";

/**
 * Layout legado do detalhe do lugar (pré-redesign).
 * @param {ReturnType<import("@/hooks/useLugarDetalhe").useLugarDetalhe>} props
 * @returns {import("react").ReactElement}
 */
export default function LugarDetalheLegacy(props) {
  const {
    id,
    router,
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
    handleFavoritar,
    handleShare,
    handleOpenAvaliacao,
    handleAvaliacaoEnviada,
    launchNavigationApp,
    openRoute,
  } = props;

  return (
    <div className="min-h-screen bg-[#f0f4f3] pb-28 text-[#1a2e28]">
      {toast && (
        <div className="fixed left-4 right-4 top-4 z-[60] mx-auto max-w-md rounded-2xl bg-[#1a4a3a] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
      <div className="mx-auto max-w-md">
        <LugarHero
          nome={lugar.nome}
          imagens={imagens}
          categoria={lugar.categoria}
          categoriaStyle={badgeStyle}
          subcategoria={lugar.subcategoria}
          subcategoriaIcone={subcategoria?.icone}
          distancia={distancia}
          mediaAvaliacoes={mediaAvaliacoes}
          totalAvaliacoes={totalAvaliacoes}
          status={status}
          mostrarStatusAbertura={ehEstabelecimento}
          isFavorito={isFavorito}
          onFavoritar={handleFavoritar}
          onShare={handleShare}
        />

        {showQrBanner && (
          <div className="mx-4 mt-3 rounded-xl bg-[#eef8f4] px-4 py-3 text-sm text-[#1a4a3a] ring-1 ring-[#1a4a3a]/10">
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

        <div className="px-4 pb-8 pt-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {visibilidade.showBadgeParceiro && (
              <span className="inline-flex rounded-full bg-[#f5e6b8] px-3 py-1 text-xs font-bold text-[#7a6520]">
                {getBadgeParceiroLabel()}
              </span>
            )}
            {visibilidade.showBadgeCuradoria && (
              <span className="inline-flex rounded-full bg-[#d4ede8] px-3 py-1 text-xs font-bold text-[#1a4a3a]">
                {getBadgeCuradoriaLabel()}
              </span>
            )}
          </div>
          <p className="text-base font-semibold leading-snug text-[#1a4a3a]">
            {fraseConvencimento}
          </p>

          {acoesRapidas.length > 0 && (
            <LugarQuickActions modo={modoAcoes} acoes={acoesRapidas} />
          )}

          {tagsExibidas.length > 0 && <LugarTags tags={tagsExibidas} />}

          {lugar.mostrar_horarios && (
            <LugarHorariosCompact
              resumo={props.horarioResumo}
              aberto={status.aberto}
              onVerCompletos={() => setShowHorarios(true)}
            />
          )}

          {lugarExibeClima(lugar, localizacao) && (
            <LugarClimaWidget
              nomeLugar={lugar.nome}
              latitude={Number(localizacao.latitude)}
              longitude={Number(localizacao.longitude)}
              user={user}
              onLoginRequired={() => {
                props.setMotivoModal("clima");
                setIsModalOpen(true);
              }}
            />
          )}

          {lugar.mostrar_endereco && enderecoExibicao && (
            <LugarLocalizacaoCard
              nome={lugar.nome}
              endereco={enderecoExibicao}
              mapUrl={mapsLink}
              staticMapSrc={staticMapSrc}
              latitude={localizacao?.latitude}
              longitude={localizacao?.longitude}
              onAbrirMapa={() => openRoute()}
            />
          )}

          {descricaoLonga && (
            <section className="mt-6">
              <h2 className="mb-3 text-sm font-bold text-[#1a2e28]">Sobre</h2>
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e8eeee]">
                <p
                  className={`text-sm leading-relaxed text-[#5a6b66] ${
                    sobreExpandido ? "" : "line-clamp-4"
                  }`}
                >
                  {descricaoLonga}
                </p>
                {!sobreExpandido && descricaoLonga.length > 180 && (
                  <button
                    type="button"
                    onClick={() => setSobreExpandido(true)}
                    className="mt-2 text-sm font-semibold text-[#1a4a3a] underline"
                  >
                    Mostrar mais
                  </button>
                )}
              </div>
            </section>
          )}

          {historiaCultura && (
            <section className="mt-6">
              <h2 className="mb-3 text-sm font-bold text-[#1a2e28]">História e cultura</h2>
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e8eeee]">
                <p
                  className={`text-sm leading-relaxed text-[#5a6b66] ${
                    historiaExpandido ? "" : "line-clamp-4"
                  }`}
                >
                  {historiaCultura}
                </p>
                {!historiaExpandido && historiaCultura.length > 180 && (
                  <button
                    type="button"
                    onClick={() => setHistoriaExpandido(true)}
                    className="mt-2 text-sm font-semibold text-[#1a4a3a] underline"
                  >
                    Mostrar mais
                  </button>
                )}
              </div>
            </section>
          )}

          <LugarAvaliacoesSection
            avaliacoes={avaliacoes}
            jaAvaliou={jaAvaliou}
            onAvaliar={handleOpenAvaliacao}
            toast={toast}
          />
        </div>
      </div>

      <LugarCtaFixo label={ctaLabel} onClick={() => openRoute()} />

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
                className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm ${
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

/** Estados de carregamento/erro do detalhe (compartilhados). */
export function LugarDetalheShell({ id, loading, fetchError, router, children }) {
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
        Carregando...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#f0f4f3] px-4 py-6 text-[#1a2e28]">
        <div className="mx-auto max-w-md">
          <UserErrorAlert
            message="Erro ao carregar o lugar. Tente novamente."
            reportContext={buildReportContext({
              code: "NOT_FOUND",
              route: `/lugares/${id}`,
            })}
            action={
              <button
                type="button"
                onClick={() => router.refresh()}
                className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-800"
              >
                Tentar novamente
              </button>
            }
          />
        </div>
      </div>
    );
  }

  if (!children) {
    return (
      <div className="min-h-screen bg-[#f0f4f3] px-4 py-6 text-[#1a2e28]">
        <div className="mx-auto max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a4a3a] transition-opacity hover:opacity-80"
          >
            <IconBack className="h-4 w-4" />
            Voltar
          </Link>
          <p className="mt-8 text-sm text-[#5a6b66]">Lugar não encontrado.</p>
        </div>
      </div>
    );
  }

  return children;
}
