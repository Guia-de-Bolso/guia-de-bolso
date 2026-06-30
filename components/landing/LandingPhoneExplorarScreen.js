"use client";

import RemotePhoto from "@/components/shared/RemotePhoto";
import { getCategoriasVisiveis, getCategoriasEmDestaque } from "@/lib/categorias";

/**
 * Card de categoria em miniatura (grid Explorar).
 * @param {object} props
 * @param {import('@/lib/categorias').CategoriaExplore} props.categoria
 * @param {number} props.count
 * @param {string|null} props.capa
 * @returns {import('react').ReactElement}
 */
function MockExplorarCategoriaCard({ categoria, count, capa }) {
  return (
    <div className="flex min-h-[72px] flex-col overflow-hidden rounded-[14px] bg-white ring-1 ring-[#e8eeee]">
      <div className="relative h-[52px] w-full overflow-hidden">
        {capa ? (
          <RemotePhoto src={capa} alt="" fill className="object-cover" />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${categoria.gradient}`} />
        )}
        <span
          className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${categoria.chipClass}`}
        >
          {categoria.icone}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center px-2 py-1.5">
        <p className="line-clamp-1 text-[10px] font-bold text-[#1a2e28]">{categoria.nome}</p>
        <p className="text-[9px] font-medium text-[#1a4a3a]">
          {count > 0 ? `${count} lugares` : "Em breve"}
        </p>
      </div>
    </div>
  );
}

/**
 * Card destaque horizontal (carrossel Explorar).
 * @param {object} props
 * @param {import('@/lib/categorias').CategoriaExplore} props.categoria
 * @param {number} props.count
 * @param {string|null} props.capa
 * @returns {import('react').ReactElement}
 */
function MockExplorarDestaqueCard({ categoria, count, capa }) {
  return (
    <div className="relative flex h-[88px] w-[148px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[16px] ring-1 ring-[#e8eeee]">
      {capa ? (
        <RemotePhoto src={capa} alt="" fill className="object-cover" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${categoria.gradient}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#061612]/80 via-[#061612]/30 to-transparent" />
      <div className="relative p-2.5 text-white">
        <span className="text-sm" aria-hidden>
          {categoria.icone}
        </span>
        <p className="mt-0.5 line-clamp-1 text-[12px] font-bold leading-tight">{categoria.nome}</p>
        <p className="text-[9px] font-medium text-white/85">
          {count > 0 ? `${count} lugares` : "Em breve"}
        </p>
      </div>
    </div>
  );
}

/**
 * Prévia da tela Explorar (/categorias) no mockup.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingPageData['categorias']} [props.categorias]
 * @param {import('@/lib/landingPageData').LandingPageData['stats']} [props.stats]
 * @returns {import('react').ReactElement}
 */
export default function LandingPhoneExplorarScreen({ categorias = [], stats }) {
  const counts = Object.fromEntries(categorias.map((c) => [c.nome, c.count ?? 0]));
  const capas = Object.fromEntries(categorias.map((c) => [c.nome, c.capa ?? null]));

  const destaques = getCategoriasEmDestaque(getCategoriasVisiveis(), counts, 3).filter(
    (c) => (counts[c.nome] || 0) > 0
  );

  const gridCats = getCategoriasVisiveis().filter((c) =>
    categorias.some((row) => row.nome === c.nome)
  ).slice(0, 4);

  const totalLugares = stats?.totalLugares ?? 0;
  const categoriasComLugares = stats?.categoriasComLugares ?? categorias.length;

  return (
    <div className="flex h-full flex-col bg-[#f0f4f3] pb-2">
      <div className="px-3 pt-0.5">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1a4a3a] text-[9px] font-bold text-white">
            GB
          </div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#1a4a3a]/70">
            Guia de Bolso
          </p>
        </div>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#1a4a3a]/75">
          Descoberta local
        </p>
        <h2 className="font-display text-[1.2rem] font-bold leading-tight tracking-tight text-[#1a2e28]">
          Explorar
        </h2>
        <p className="mt-1 text-[10px] font-medium text-[#5a6b66]">
          {totalLugares > 0
            ? `${totalLugares} lugares em ${categoriasComLugares} categorias`
            : "Lugares da região"}
        </p>
      </div>

      <div className="mx-3 mt-2.5 flex items-center gap-2 rounded-[16px] bg-white/95 px-2.5 py-2 ring-1 ring-[#e8eeee]/80">
        <span className="text-[#8a9b94]" aria-hidden>
          ✨
        </span>
        <span className="text-[11px] text-[#8a9b94]">Buscar com IA…</span>
      </div>

      {destaques.length > 0 ? (
        <section className="mt-3">
          <p className="px-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#1a4a3a]/75">
            Em destaque
          </p>
          <p className="px-3 font-display text-[12px] font-bold text-[#1a2e28]">Mais visitadas</p>
          <div className="mt-1.5 flex gap-2 overflow-x-hidden px-3 pb-0.5">
            {destaques.map((cat) => (
              <MockExplorarDestaqueCard
                key={cat.nome}
                categoria={cat}
                count={counts[cat.nome] || 0}
                capa={capas[cat.nome]}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-3 flex-1 px-3">
        <p className="font-display text-[12px] font-bold text-[#1a2e28]">Todas as categorias</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {gridCats.map((cat) => (
            <MockExplorarCategoriaCard
              key={cat.nome}
              categoria={cat}
              count={counts[cat.nome] || 0}
              capa={capas[cat.nome]}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
