"use client";

import SearchListItem from "@/components/home/SearchListItem";
import { getCapaThumbFromLugar } from "@/lib/fotos";
import { getLugarPublicPath } from "@/lib/lugarPublicPath";

/**
 * IconClock - Clock icon for recently visited places.
 * @returns {import('react').ReactElement}
 */
function IconClock() {
  return (
    <svg className="h-4 w-4 text-[#5a6b66]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 11H7v-2h4V7h2v6z" />
    </svg>
  );
}

/**
 * SearchBrowsePanel - Browse view with recently visited and popular places.
 * @param {object} props
 * @param {object[]} [props.visitados] - Recently visited place records.
 * @param {object[]} [props.populares] - Popular place records.
 * @param {boolean} props.loadingPopulares - Whether popular places are loading.
 * @returns {import('react').ReactElement}
 */
export default function SearchBrowsePanel({ visitados = [], populares = [], loadingPopulares }) {
  return (
    <div className="space-y-6 pb-6">
      {visitados.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#5a6b66]">
            Visitados recentemente
          </h2>
          <div className="space-y-2">
            {visitados.slice(0, 3).map((lugar) => (
              <SearchListItem
                key={lugar.id}
                href={getLugarPublicPath(lugar)}
                imagemUrl={lugar.imagem_url}
                nome={lugar.nome}
                categoria={lugar.categoria}
                leading={<IconClock />}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#5a6b66]">
          Populares agora
        </h2>
        {loadingPopulares ? (
          <p className="py-4 text-center text-sm text-[#5a6b66]">Carregando...</p>
        ) : populares.length === 0 ? (
          <p className="py-4 text-center text-sm text-[#5a6b66]">
            Nenhum lugar popular no momento.
          </p>
        ) : (
          <div className="space-y-2">
            {populares.map((lugar) => (
              <SearchListItem
                key={lugar.id}
                href={getLugarPublicPath(lugar)}
                imagemUrl={getCapaThumbFromLugar(lugar)}
                nome={lugar.nome}
                categoria={lugar.categoria}
                leading="🔥"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
