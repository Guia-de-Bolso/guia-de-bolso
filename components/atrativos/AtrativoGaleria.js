"use client";

import { useEffect, useRef, useState } from "react";
import GalleryHeroAirbnb from "@/components/shared/GalleryHeroAirbnb";
import LoginModal from "@/components/LoginModal";
import { toggleRotasFavorita, createFavoritosSyncGuard } from "@/lib/rotasFavoritas";
import { isMissingTableError } from "@/lib/supabaseErrors";
import { createClient } from "@/lib/supabase";

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
    const ok = await toggleRotasFavorita(supabase, user, rotaId, nome, setIsFavorito);
    if (ok === false) {
      setToast("Não foi possível salvar o favorito. Tente novamente em instantes.");
      setTimeout(() => setToast(""), 3000);
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
