import { getStatusFuncionamento } from "@/lib/horarios";
import { getFraseConvencimento } from "@/lib/lugarDetalhe";
import {
  getDistanciaKmLugar,
  getLocalizacaoFromLugar,
  getTempoCarroEstimado,
  formatarDistancia,
} from "@/lib/localizacao";
import { getTagsFromLugar } from "@/lib/tags";

/**
 * @param {object} [lugar]
 * @returns {number|null}
 */
export function getRatingMedioLugar(lugar) {
  const value = lugar?.rating_medio ?? lugar?.media_avaliacoes;
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Resumo curto do endereço para listagens.
 * @param {object} [lugar]
 * @returns {string|null}
 */
export function getEnderecoResumo(lugar) {
  const endereco = getLocalizacaoFromLugar(lugar)?.endereco_completo?.trim();
  if (!endereco) return null;

  const partes = endereco
    .split(",")
    .map((parte) => parte.trim())
    .filter(Boolean);

  if (partes.length >= 2) {
    return partes.slice(-2).join(" · ");
  }

  return endereco.length > 48 ? `${endereco.slice(0, 45)}…` : endereco;
}

/**
 * Metadados de exibição para cards de listagem de lugares.
 * @param {object} lugar
 * @param {{ latitude: number, longitude: number }|null} [userPosition]
 */
export function buildLugarListMeta(lugar, userPosition = null) {
  const tags = getTagsFromLugar(lugar);
  const status = getStatusFuncionamento(lugar?.horarios, lugar?.mostrar_horarios);
  const distanciaKm = getDistanciaKmLugar(lugar, userPosition);
  const distancia =
    lugar?.distancia_calculada ||
    lugar?.distancia ||
    formatarDistancia(distanciaKm, { deVoce: Boolean(userPosition) });
  const tempoCarro = getTempoCarroEstimado(distanciaKm);
  const endereco = getEnderecoResumo(lugar);
  const frase = getFraseConvencimento(lugar, tags);
  const descricao = String(lugar?.descricao ?? "").trim();
  const subtitulo = frase || descricao;

  return {
    tags: tags.slice(0, 4),
    status,
    distancia,
    tempoCarro,
    endereco,
    subtitulo,
    rating: getRatingMedioLugar(lugar),
    subcategoria: String(lugar?.subcategoria ?? "").trim() || null,
  };
}
