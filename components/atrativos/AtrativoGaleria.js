"use client";

import { useEffect, useRef, useState } from "react";
import GalleryHeroAirbnb from "@/components/shared/GalleryHeroAirbnb";
import LoginModal from "@/components/LoginModal";
import { toggleRotasFavorita, createFavoritosSyncGuard, FAVORITO_OFFLINE_SAVED_MESSAGE } from "@/lib/rotasFavoritas";
import { isMissingTableError } from "@/lib/supabaseErrors";
import { createClient } from "@/lib/supabase";
import {
  getAtrativoShareUrl,
  shareContent,
  SHARE_COPIED_MESSAGE,
} from "@/lib/shareContent";

/**
 * Carrossel de fotos da rota — mesmo layout do detalhe de lugar.
 * @param {object} props
 * @param {string} props.rotaId - UUID da rota curada.
 * @param {string} props.nome - Nome da rota (alt das imagens e share).
 * @param {string[]} props.imagens - URLs das fotos.
 * @param {string} [props.descricao] - Texto opcional para Web Share API.
 * @param {string} [props.backHref="/atrativos"] - Link do botão voltar.
 * @returns {import("react").ReactElement}
 */
export default function AtrativoGaleria({
  rotaId,
  nome,
  imagens,
  descricao = "",
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
          console.error("[rotas_favoritas] fetch galeria:", error);
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
    const result = await toggleRotasFavorita(supabase, user, rotaId, nome, setIsFavorito);
    if (result === "failed") {
      setToast("Não foi possível salvar o favorito. Tente novamente em instantes.");
      setTimeout(() => setToast(""), 3000);
    } else if (result === "added") {
      setToast(FAVORITO_OFFLINE_SAVED_MESSAGE);
      setTimeout(() => setToast(""), 3500);
    }
  }

  async function handleShare() {
    if (!rotaId) return;

    const url = getAtrativoShareUrl(rotaId);

    try {
      const outcome = await shareContent({
        title: nome,
        text: descricao || undefined,
        url,
      });

      if (outcome === "copied") {
        setToast(SHARE_COPIED_MESSAGE);
        setTimeout(() => setToast(""), 2500);
      }
    } catch {
      setToast("Não foi possível compartilhar.");
      setTimeout(() => setToast(""), 2500);
    }
  }

  return (
    <>
      {toast && (
        <div className="fixed left-4 right-4 top-4 z-[60] mx-auto max-w-md rounded-xl bg-[#1a4a3a] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="detalhe-hero-sticky sticky top-0 z-0">
        <GalleryHeroAirbnb
          nome={nome}
          imagens={imagens}
          backHref={backHref}
          isFavorito={isFavorito}
          onFavoritar={handleFavoritar}
          onShare={handleShare}
          immersiveScroll
        />
      </div>

      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        motivo="favoritar"
      />
    </>
  );
}
