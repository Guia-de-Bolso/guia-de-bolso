/** Estilo compartilhado dos chips/cards de informação no layout Airbnb. */
export const INFO_CHIP_CLASS =
  "shrink-0 rounded-lg border border-[#b8d4cc] bg-[#f0f4f3] text-[#1a4a3a] shadow-sm";

export const DESTAQUE_CHIP_CLASS = `${INFO_CHIP_CLASS} inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold leading-tight`;

export const INFO_CHIP_PUBLIC_CLASS = `${INFO_CHIP_CLASS} flex min-w-[4.25rem] max-w-[7rem] snap-start flex-col items-center justify-center gap-0.5 px-2 py-2`;

/** Ícone dentro dos botões flutuantes da galeria. */
export const GALLERY_FLOAT_ICON_CLASS = "h-5 w-5 shrink-0";

/** Botões flutuantes da galeria (voltar, compartilhar). */
export const GALLERY_FLOAT_BTN_CLASS =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e8eeee] bg-white text-[#1a4a3a] shadow-md";

/** Favorito ativo — classes isoladas para não conflitar com fundo branco do botão padrão. */
export const GALLERY_FAVORITO_ATIVO_BTN_CLASS =
  "flex h-11 w-11 items-center justify-center rounded-full border border-[#1a4a3a] bg-[#1a4a3a] text-white shadow-md";

export const PARCEIRO_BADGE_GALLERY_CLASS =
  "shrink-0 rounded-md border border-[#c9a227] bg-[#f5e6b8]/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7a6520] shadow-sm backdrop-blur-[2px]";

/** Contador 1/N — vidro fosco estilo Apple. */
export const GALLERY_GLASS_PILL_CLASS =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/35 bg-white/22 px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150";

/** Faixa inferior da galeria (badge + contador alinhados). */
export const GALLERY_FOOTER_ROW_CLASS =
  "absolute inset-x-4 bottom-11 z-20 flex items-center justify-between gap-3";

/** Card branco sobreposto à imagem (detalhe lugar/rota). */
export const DETALHE_CARD_OVERLAP_CLASS =
  "relative z-10 -mt-7 overflow-hidden rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(26,46,40,0.08)]";

export const DESTAQUE_CHIP_PREMIUM_CLASS =
  "inline-flex items-center gap-2 rounded-full bg-[#f5f7f6] px-4 py-2.5 text-[13px] font-medium ring-1 ring-[#e8eeee] transition-transform active:scale-[0.98]";

export const INFO_CARD_PREMIUM_CLASS =
  "flex min-h-[108px] min-w-[5.25rem] flex-1 basis-[calc(50%-0.375rem)] flex-col items-center justify-center gap-2 rounded-2xl bg-[#f5f7f6] px-3 py-5 ring-1 ring-[#e8eeee] transition-transform active:scale-[0.98] sm:basis-[calc(25%-0.5625rem)]";

/** Uma única ação comercial — linha compacta em vez do tile alto. */
export const INFO_ROW_CONTATO_CLASS =
  "flex h-[52px] w-full items-center gap-3 rounded-2xl bg-[#f5f7f6] px-3 ring-1 ring-[#e8eeee] transition-transform active:scale-[0.99]";

export const PARCEIRO_BADGE_GRADIENT_CLASS =
  "shrink-0 rounded-lg border border-[#e8c66a]/80 bg-gradient-to-r from-[#f0a830] to-[#f5e6b8] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#5c4a12] shadow-sm";
