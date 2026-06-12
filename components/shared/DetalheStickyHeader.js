"use client";

import NavigationBackLink from "@/components/NavigationBackLink";
import {
  GALLERY_FAVORITO_ATIVO_BTN_CLASS,
  GALLERY_FLOAT_BTN_CLASS,
  GALLERY_FLOAT_ICON_CLASS,
} from "@/components/lugar/airbnb/lugarAirbnbTokens";

function FavoriteIcon({ active }) {
  return (
    <svg
      className={GALLERY_FLOAT_ICON_CLASS}
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      className={GALLERY_FLOAT_ICON_CLASS}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </svg>
  );
}

/**
 * Header fixo no scroll (lugar e rota) — animação via CSS scroll.
 * @param {object} props
 * @returns {import("react").JSX.Element}
 */
export default function DetalheStickyHeader({
  title,
  backHref = "/",
  isFavorito = false,
  onFavoritar,
  onShare,
  showFavorite = true,
}) {
  return (
    <header
      className="detalhe-sticky-header-reveal pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto max-w-md opacity-0"
      style={{ transform: "translate3d(0, -8px, 0)" }}
      aria-hidden
    >
      <div className="border-b border-[#e8eeee]/80 bg-white/88 px-3 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-[0_4px_24px_rgba(26,46,40,0.06)] backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center gap-2">
          <NavigationBackLink
            href={backHref}
            className={`${GALLERY_FLOAT_BTN_CLASS} h-10 w-10 transition-transform active:scale-95`}
            iconClassName="h-[18px] w-[18px]"
          />

          <h2 className="min-w-0 flex-1 truncate text-center text-[15px] font-bold tracking-tight text-[#1a2e28]">
            {title}
          </h2>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onShare}
              className={`${GALLERY_FLOAT_BTN_CLASS} h-10 w-10 transition-transform active:scale-95`}
              aria-label="Compartilhar"
            >
              <ShareIcon />
            </button>
            {showFavorite && onFavoritar && (
              <button
                type="button"
                onClick={onFavoritar}
                className={`${
                  isFavorito
                    ? `${GALLERY_FAVORITO_ATIVO_BTN_CLASS} h-10 w-10`
                    : `${GALLERY_FLOAT_BTN_CLASS} h-10 w-10`
                } transition-transform active:scale-95`}
                aria-label={isFavorito ? "Remover dos favoritos" : "Favoritar"}
              >
                <FavoriteIcon active={isFavorito} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
