/**
 * Catálogo enxuto de lugares usado para foto, link e mapa no roteiro.
 * @module lib/roteiroCatalog
 */

import { parseFotos } from "./fotos.js";
import { getLocalizacaoFromLugar } from "./localizacao.js";

/**
 * Mantém só a primeira foto para não inflar o rascunho do roteiro.
 * @param {unknown} fotos
 * @returns {Array<unknown>|null}
 */
export function trimFotosCapa(fotos) {
  const lista = parseFotos(fotos);
  if (!lista.length) return null;
  return [lista[0]];
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function hasValue(value) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return true;
}

/**
 * Normaliza um lugar (cru do banco ou já achatado) para o catálogo do roteiro.
 * @param {object|null|undefined} lugar
 * @param {{ apenasCapa?: boolean }} [options]
 * @returns {object|null}
 */
export function toRoteiroCatalogItem(lugar, { apenasCapa = false } = {}) {
  if (!lugar?.id) return null;

  const localizacao = getLocalizacaoFromLugar(lugar);
  const latitudeDireta = Number(lugar.latitude);
  const longitudeDireta = Number(lugar.longitude);
  const latitude = Number.isFinite(latitudeDireta)
    ? latitudeDireta
    : Number(localizacao?.latitude);
  const longitude = Number.isFinite(longitudeDireta)
    ? longitudeDireta
    : Number(localizacao?.longitude);

  const flag = lugar.ehParceiro ?? lugar.eh_parceiro;
  const endereco =
    (typeof localizacao?.endereco_completo === "string" &&
      localizacao.endereco_completo.trim()) ||
    (typeof lugar.endereco === "string" && lugar.endereco.trim()) ||
    "";
  const slug = typeof lugar.slug === "string" ? lugar.slug.trim() : "";
  const fotos = apenasCapa ? trimFotosCapa(lugar.fotos) : lugar.fotos ?? null;

  return {
    id: String(lugar.id),
    nome: String(lugar.nome ?? "").trim(),
    ...(slug ? { slug } : {}),
    ...(flag == null ? {} : { ehParceiro: Boolean(flag) }),
    ...(lugar.imagem_url ? { imagem_url: lugar.imagem_url } : {}),
    ...(hasValue(fotos) ? { fotos } : {}),
    ...(Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { latitude, longitude }
      : {}),
    ...(endereco ? { endereco } : {}),
  };
}

/**
 * Completa o catálogo do roteiro com dados da listagem pública.
 * O primeiro argumento prevalece quando os dois trazem o mesmo campo.
 * @param {Array<object>} [primario]
 * @param {Array<object>} [complemento]
 * @returns {object[]}
 */
export function mergeRoteiroCatalogos(primario = [], complemento = []) {
  /** @type {Map<string, object>} */
  const porId = new Map();

  /**
   * @param {object} item
   * @param {boolean} sobrescreve
   */
  function absorver(item, sobrescreve) {
    const normal = toRoteiroCatalogItem(item);
    if (!normal) return;

    const anterior = porId.get(normal.id);
    if (!anterior) {
      porId.set(normal.id, normal);
      return;
    }

    const proximo = { ...anterior };
    for (const [chave, valor] of Object.entries(normal)) {
      if (!hasValue(valor)) continue;
      if (sobrescreve || !hasValue(proximo[chave])) {
        proximo[chave] = valor;
      }
    }
    porId.set(normal.id, proximo);
  }

  for (const item of complemento) absorver(item, false);
  for (const item of primario) absorver(item, true);

  return [...porId.values()];
}
