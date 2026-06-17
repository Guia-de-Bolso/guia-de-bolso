"use client";

import RemotePhoto from "@/components/shared/RemotePhoto";
import { HOME_CAROUSEL_TRACK_CLASS } from "@/components/home/homeTokens";
import { CATEGORIAS_EXPLORE } from "@/lib/categorias";

/**
 * Card “Em alta” em escala reduzida (fiel ao EmAltaCard).
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingLugarCard} props.lugar
 * @param {boolean} [props.priority]
 * @returns {import('react').ReactElement}
 */
function MockEmAltaCard({ lugar, priority = false }) {
  return (
    <div className="flex w-[168px] shrink-0 snap-start flex-col overflow-hidden rounded-[18px] bg-white ring-1 ring-[#e8eeee]">
      <div className="relative h-[96px] overflow-hidden">
        {lugar.capa ? (
          <RemotePhoto
            src={lugar.capa}
            alt=""
            fill
            className="object-cover"
            priority={priority}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        {lugar.ehParceiro ? (
          <span className="absolute left-2 top-2 rounded-full bg-[#f5e6b8]/95 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#7a6520]">
            Parceiro
          </span>
        ) : null}
      </div>
      <div className="p-2.5">
        <p className="line-clamp-1 text-[13px] font-bold tracking-tight text-[#1a2e28]">{lugar.nome}</p>
        <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-[#5a6b66]">{lugar.categoria}</p>
      </div>
    </div>
  );
}

/**
 * Card parceiro em escala reduzida (fiel ao ParceirosCarrossel).
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingLugarCard} props.lugar
 * @returns {import('react').ReactElement}
 */
function MockParceiroCard({ lugar }) {
  return (
    <div className="relative flex h-[140px] w-[220px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[20px] ring-1 ring-[#e8eeee]">
      {lugar.capa ? (
        <RemotePhoto src={lugar.capa} alt="" fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#061612] via-[#061612]/55 to-transparent" />
      <span className="absolute left-2.5 top-2.5 rounded-full bg-[#f5e6b8]/95 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#7a6520]">
        Parceiro
      </span>
      <div className="relative p-3 pb-3.5">
        <p className="line-clamp-2 text-[14px] font-bold leading-tight text-white drop-shadow-sm">
          {lugar.nome}
        </p>
        <p className="mt-0.5 text-[10px] font-medium text-white/85">{lugar.categoria}</p>
      </div>
    </div>
  );
}

/**
 * Prévia estática da home do app dentro do mockup iPhone.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingLugarCard[]} [props.emAlta]
 * @param {import('@/lib/landingPageData').LandingLugarCard[]} [props.parceiros]
 * @param {import('@/lib/landingPageData').LandingPageData['categorias']} [props.categorias]
 * @returns {import('react').ReactElement}
 */
export default function LandingPhoneHomeScreen({
  emAlta = [],
  parceiros = [],
  categorias = [],
}) {
  const altaComFoto = emAlta.filter((l) => l.capa).slice(0, 4);
  const parceirosComFoto = (
    parceiros.length > 0 ? parceiros : emAlta.filter((l) => l.ehParceiro && l.capa)
  )
    .filter((l) => l.capa)
    .slice(0, 3);

  const chips =
    categorias.length > 0
      ? categorias.slice(0, 5)
      : CATEGORIAS_EXPLORE.slice(0, 5).map((c) => ({
          nome: c.nome,
          icone: c.icone,
          chipClass: c.chipClass,
        }));

  return (
    <div className="h-full bg-[#f0f4f3] pb-3">
      <div className="px-3.5 pt-0.5">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a4a3a] text-[10px] font-bold text-white"
            aria-hidden
          >
            GB
          </div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#1a4a3a]/70">
            Guia de Bolso
          </p>
        </div>

        <p className="mt-2 text-[11px] font-medium text-[#5a6b66]">Boa tarde 👋</p>
        <h2 className="mt-0.5 font-display text-[1.35rem] font-bold leading-[1.1] tracking-tight text-[#1a2e28]">
          O que fazer <span className="text-[#1a4a3a]">agora?</span>
        </h2>

        <div className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-[#e8eeee]/90 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[#1a4a3a] shadow-sm">
          <span aria-hidden>📍</span>
          Imbituba, SC
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-[18px] bg-white/95 px-3 py-2.5 ring-1 ring-[#e8eeee]/80">
          <span className="text-[#8a9b94]" aria-hidden>
            ✨
          </span>
          <span className="text-[12px] text-[#8a9b94]">Buscar com IA…</span>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-hidden pb-0.5">
          {chips.map((cat) => (
            <span
              key={cat.nome}
              className={`flex shrink-0 items-center gap-1 rounded-full border border-[#e8eeee] px-2.5 py-1.5 text-[11px] font-medium ${cat.chipClass || "bg-white text-[#1a4a3a]"}`}
            >
              <span aria-hidden>{cat.icone}</span>
              {cat.nome}
            </span>
          ))}
        </div>
      </div>

      {altaComFoto.length > 0 ? (
        <section className="mt-4">
          <div className="px-3.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#1a4a3a]/75">
              Tendências
            </p>
            <p className="font-display text-[15px] font-bold tracking-tight text-[#1a2e28]">
              🔥 Em alta hoje
            </p>
          </div>
          <div className={`${HOME_CAROUSEL_TRACK_CLASS} mt-2.5 px-3.5`}>
            {altaComFoto.map((lugar, i) => (
              <MockEmAltaCard key={lugar.id} lugar={lugar} priority={i === 0} />
            ))}
          </div>
        </section>
      ) : null}

      {parceirosComFoto.length > 0 ? (
        <section className="mt-4">
          <div className="px-3.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#1a4a3a]/75">
              Parceiros
            </p>
            <p className="font-display text-[15px] font-bold tracking-tight text-[#1a2e28]">
              Parceiros do Guia
            </p>
          </div>
          <div className={`${HOME_CAROUSEL_TRACK_CLASS} mt-2.5 px-3.5`}>
            {parceirosComFoto.map((lugar) => (
              <MockParceiroCard key={lugar.id} lugar={lugar} />
            ))}
          </div>
        </section>
      ) : null}

      {altaComFoto.length === 0 && parceirosComFoto.length === 0 ? (
        <div className="mt-6 space-y-2 px-3.5">
          <div className="h-24 rounded-2xl bg-white/80" />
          <div className="h-24 rounded-2xl bg-white/60" />
        </div>
      ) : null}
    </div>
  );
}
