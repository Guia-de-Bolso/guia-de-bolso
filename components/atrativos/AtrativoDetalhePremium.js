"use client";

import { useEffect, useRef, useState } from "react";
import BottomNav from "@/components/BottomNav";
import LoginModal from "@/components/LoginModal";
import DetalheStickyHeader from "@/components/shared/DetalheStickyHeader";
import GalleryHeroAirbnb from "@/components/shared/GalleryHeroAirbnb";
import AtrativoMapsCta from "@/components/atrativos/AtrativoMapsCta";
import AtrativoMetrics from "@/components/atrativos/AtrativoMetrics";
import AtrativoSobreSection from "@/components/atrativos/AtrativoSobreSection";
import AtrativoDicasSection from "@/components/atrativos/AtrativoDicasSection";
import AtrativoTimeline from "@/components/atrativos/AtrativoTimeline";
import {
  DESTAQUE_CHIP_PREMIUM_CLASS,
  DETALHE_CARD_OVERLAP_CLASS,
} from "@/components/lugar/airbnb/lugarAirbnbTokens";
import { toggleRotasFavorita, createFavoritosSyncGuard, FAVORITO_OFFLINE_SAVED_MESSAGE } from "@/lib/rotasFavoritas";
import { isMissingTableError } from "@/lib/supabaseErrors";
import { createClient } from "@/lib/supabase";

function VerifiedIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-[#3b82f6]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

/**
 * Detalhe premium da rota/trilha — parallax, header colapsável e timeline.
 * @param {object} props
 */
export default function AtrativoDetalhePremium({
  rotaId,
  rota,
  localizacao,
  nome,
  descricao,
  fotos,
  categoria,
  tags,
  duracao,
  distancia,
  dificuldade,
  mapsHref,
  mapsSubtitulo,
  infoCards,
  pontos,
  dicas,
  backHref = "/atrativos",
}) {
  const [user, setUser] = useState(null);
  const [isFavorito, setIsFavorito] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const favoritoSyncGuardRef = useRef(createFavoritosSyncGuard());

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !rotaId) {
      setIsFavorito(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    const fetchGen = favoritoSyncGuardRef.current.bump();

    supabase
      .from("rotas_favoritas")
      .select("rota_id")
      .eq("user_id", user.id)
      .eq("rota_id", rotaId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!favoritoSyncGuardRef.current.isCurrent(fetchGen)) return;
        if (error) {
          if (isMissingTableError(error)) return;
          console.error("[rotas_favoritas] fetch detalhe:", error);
          return;
        }
        setIsFavorito(Boolean(data));
      });
  }, [user, rotaId]);

  async function handleFavoritar() {
    if (!user) {
      setIsModalOpen(true);
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    favoritoSyncGuardRef.current.bump();
    const wasFavorito = isFavorito;
    const ok = await toggleRotasFavorita(supabase, user, rotaId, nome, setIsFavorito);
    if (ok === false) {
      setToast("Não foi possível salvar o favorito. Tente novamente em instantes.");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    if (ok && !wasFavorito) {
      setToast(FAVORITO_OFFLINE_SAVED_MESSAGE);
      setTimeout(() => setToast(""), 3500);
    }
  }

  async function handleShare() {
    const shareData = {
      title: nome,
      text: descricao || undefined,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setToast("Link copiado!");
      setTimeout(() => setToast(""), 2500);
    } catch {
      // Cancelamento do share nativo.
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f4f3] pb-28 text-[#1a2e28]">
      {toast && (
        <div className="fixed left-4 right-4 top-4 z-[60] mx-auto max-w-md rounded-xl bg-[#1a4a3a] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <DetalheStickyHeader
        title={nome}
        backHref={backHref}
        isFavorito={isFavorito}
        onFavoritar={handleFavoritar}
        onShare={handleShare}
      />

      <div className="mx-auto max-w-md">
        <div className="detalhe-hero-sticky sticky top-0 z-0">
          <GalleryHeroAirbnb
            nome={nome}
            imagens={fotos}
            backHref={backHref}
            isFavorito={isFavorito}
            onFavoritar={handleFavoritar}
            onShare={handleShare}
            immersiveScroll
          />
        </div>

        <main className={`${DETALHE_CARD_OVERLAP_CLASS} px-7 pb-28 pt-8`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1a4a3a]">
            <span className="mr-1.5" aria-hidden>
              {categoria.icone}
            </span>
            {categoria.nome}
          </p>

          <div className="mt-3 flex items-start gap-2">
            <h2 className="font-display min-w-0 flex-1 text-[28px] font-bold leading-[1.12] tracking-tight text-[#1a2e28]">
              {nome}
            </h2>
            <VerifiedIcon />
          </div>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
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
          )}

          <AtrativoMetrics duracao={duracao} distancia={distancia} dificuldade={dificuldade} />

          <AtrativoMapsCta
            href={mapsHref}
            subtitulo={mapsSubtitulo}
            rota={rota}
            localizacao={localizacao}
          />

          <AtrativoSobreSection descricao={descricao} infoCards={infoCards} />

          <AtrativoTimeline pontos={pontos} />

          <AtrativoDicasSection dicas={dicas} />
        </main>
      </div>

      <BottomNav />

      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        motivo="favoritar"
      />
    </div>
  );
}
