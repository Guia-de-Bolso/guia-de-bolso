"use client";

import RemotePhoto from "@/components/shared/RemotePhoto";
import { IconBookmark } from "@/components/roteiro/roteiroIcons";

/**
 * Capa do roteiro: foto real da primeira parada, ou composição sem imagem.
 * @param {object} props
 * @param {string} props.titleId
 * @param {string} props.titulo
 * @param {string} [props.perfil]
 * @param {string} [props.diasTexto]
 * @param {string} [props.paradasTexto]
 * @param {string} [props.interessesTexto]
 * @param {string} [props.capaUrl]
 * @param {string} [props.capaAlt]
 * @param {boolean} [props.jaSalvo]
 * @param {boolean} [props.salvando]
 * @param {() => void} [props.onSalvar]
 * @returns {import("react").JSX.Element}
 */
export default function RoteiroGuideHeader({
  titleId,
  titulo,
  perfil = "",
  diasTexto = "",
  paradasTexto = "",
  interessesTexto = "",
  capaUrl = "",
  capaAlt = "",
  jaSalvo = false,
  salvando = false,
  onSalvar,
}) {
  const perfilVisivel =
    perfil && titulo && !titulo.toLowerCase().includes(perfil.toLowerCase()) ? perfil : "";
  const meta = [diasTexto, paradasTexto].filter(Boolean);
  const mostrarSalvar = Boolean(onSalvar) || jaSalvo;

  const saveButton = mostrarSalvar ? (
    <button
      type="button"
      onClick={onSalvar}
      disabled={!onSalvar || salvando || jaSalvo}
      aria-label={jaSalvo ? "Roteiro salvo" : salvando ? "Salvando roteiro" : "Salvar roteiro"}
      className={`absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition-transform active:scale-95 disabled:opacity-100 disabled:active:scale-100 ${
        jaSalvo
          ? "bg-[#1a4a3a] text-white"
          : "bg-black/35 text-white"
      }`}
    >
      <IconBookmark filled={jaSalvo} />
    </button>
  ) : null;

  const copy = (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
        Imbituba
      </p>
      <h2
        id={titleId}
        className="mt-1 font-display text-[1.7rem] font-bold leading-[1.12] tracking-tight text-white"
      >
        {titulo || "Seu roteiro"}
      </h2>
      {perfilVisivel ? (
        <p className="mt-2 line-clamp-2 text-sm leading-snug text-white/88">{perfilVisivel}</p>
      ) : null}
      {meta.length > 0 ? (
        <p className="mt-3 text-sm font-medium text-white/90">{meta.join(" · ")}</p>
      ) : null}
      {interessesTexto ? (
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/75">
          {interessesTexto}
        </p>
      ) : null}
      {jaSalvo ? (
        <p className="mt-3 text-[13px] font-semibold text-white">Salvo no seu guia</p>
      ) : null}
    </>
  );

  if (!capaUrl) {
    return (
      <header className="relative overflow-hidden rounded-[28px] bg-[#1a4a3a] px-5 pb-6 pt-5">
        <div
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-14 left-6 h-36 w-36 rounded-full bg-[#8fc9b6]/25"
          aria-hidden
        />
        {saveButton}
        <div className={mostrarSalvar ? "pr-12" : ""}>{copy}</div>
      </header>
    );
  }

  return (
    <header className="relative flex min-h-[15.5rem] flex-col justify-end overflow-hidden rounded-[28px] bg-[#1a2e28]">
      <RemotePhoto
        src={capaUrl}
        alt={capaAlt || titulo || "Capa do roteiro"}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 420px"
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#10241d] via-[#10241d]/70 to-[#10241d]/20"
        aria-hidden
      />
      {saveButton}
      <div className="relative z-10 px-5 pb-5 pt-20">{copy}</div>
    </header>
  );
}
