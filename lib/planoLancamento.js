/**
 * Planos comerciais da fase de lançamento (ago/2026 → fev/2027).
 *
 * - presenca: perfil básico permanente (farmácias, mercados, utilitários).
 * - lancamento: perfil completo gratuito até `perfil_promo_ate`.
 * - parceiro: Plano Parceiro pago (`eh_parceiro`) — visibilidade premium.
 */

import { hojeISO } from "./homeRotation.js";
import { isLugarEstabelecimento } from "./lugarDetalhe.js";
import { isParceiro } from "./lugarBadges.js";
import { normalizeDateISO } from "./parceiroAdmin.js";

/** Fim padrão da promo de perfil completo (final do verão 2026/27). */
export const PERFIL_PROMO_FIM_PADRAO = "2027-02-28";

export const PLANO_TIER = {
  PUBLICO: "publico",
  PRESENCA: "presenca",
  LANCAMENTO: "lancamento",
  PARCEIRO: "parceiro",
};

/** @type {Record<string, string>} */
export const PLANO_TIER_LABELS = {
  [PLANO_TIER.PUBLICO]: "Público (Natureza/Aventura)",
  [PLANO_TIER.PRESENCA]: "Presença (básico)",
  [PLANO_TIER.LANCAMENTO]: "Lançamento (completo grátis)",
  [PLANO_TIER.PARCEIRO]: "Parceiro (pago)",
};

/** Subcategorias com perfil Presença permanente (utilitário — WhatsApp liberado, sem promo completa). */
export const SUBCATEGORIAS_PRESENCA = [
  "Farmácias",
  "Mercados",
  "Mecânicos",
  "Saúde",
];

/**
 * @param {string|null|undefined} subcategoria
 * @returns {boolean}
 */
export function isSubcategoriaPresenca(subcategoria) {
  const sub = String(subcategoria ?? "").trim();
  if (!sub) return false;
  return SUBCATEGORIAS_PRESENCA.includes(sub);
}

/**
 * Estabelecimento comercial que deve ficar no plano Presença (sem perfil completo gratuito).
 * @param {object|null|undefined} lugar
 * @returns {boolean}
 */
export function shouldLugarDefaultPresenca(lugar) {
  if (!lugar || !isLugarEstabelecimento(lugar)) return false;
  if (isParceiro(lugar)) return false;
  return isSubcategoriaPresenca(lugar.subcategoria);
}

/**
 * @param {string|null|undefined} perfilPromoAte
 * @param {string} [hoje]
 * @returns {boolean}
 */
export function isPerfilPromoAtivo(perfilPromoAte, hoje = hojeISO()) {
  const fim = normalizeDateISO(perfilPromoAte);
  if (!fim) return false;
  return fim >= hoje;
}

/**
 * Tier comercial efetivo do lugar.
 * @param {object|null|undefined} lugar
 * @param {string} [hoje]
 * @returns {string}
 */
export function getPlanoComercialTier(lugar, hoje = hojeISO()) {
  if (!lugar) return PLANO_TIER.PRESENCA;
  if (!isLugarEstabelecimento(lugar)) return PLANO_TIER.PUBLICO;
  if (isParceiro(lugar)) return PLANO_TIER.PARCEIRO;
  if (isPerfilPromoAtivo(lugar.perfil_promo_ate, hoje)) return PLANO_TIER.LANCAMENTO;
  return PLANO_TIER.PRESENCA;
}

/**
 * @param {string|null|undefined} tier
 * @returns {string}
 */
export function getPlanoComercialTierLabel(tier) {
  return PLANO_TIER_LABELS[tier] || "—";
}

/**
 * Perfil completo no app (galeria, links, avaliações) sem ser parceiro pago.
 * @param {object|null|undefined} lugar
 * @param {string} [hoje]
 * @returns {boolean}
 */
export function hasPerfilCompletoGratuito(lugar, hoje = hojeISO()) {
  if (!lugar || !isLugarEstabelecimento(lugar)) return false;
  if (isParceiro(lugar)) return false;
  return isPerfilPromoAtivo(lugar.perfil_promo_ate, hoje);
}

/**
 * Estabelecimento ativo com perfil básico (teaser) — sem parceiro nem promo.
 * @param {object|null|undefined} lugar
 * @param {string} [hoje]
 * @returns {boolean}
 */
export function isLugarPerfilPresenca(lugar, hoje = hojeISO()) {
  if (!lugar || !isLugarEstabelecimento(lugar)) return false;
  if (isParceiro(lugar)) return false;
  return !isPerfilPromoAtivo(lugar.perfil_promo_ate, hoje);
}

/**
 * @param {string|null|undefined} perfilPromoAte
 * @param {string} [hoje]
 * @returns {number|null}
 */
export function getDiasRestantesPerfilPromo(perfilPromoAte, hoje = hojeISO()) {
  const fim = normalizeDateISO(perfilPromoAte);
  if (!fim) return null;
  const start = new Date(`${hoje}T12:00:00`);
  const end = new Date(`${fim}T12:00:00`);
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * @param {number|null} diasRestantes
 * @returns {string}
 */
export function formatDiasRestantesPerfilPromo(diasRestantes) {
  if (diasRestantes === null) return "";
  if (diasRestantes < 0) return `expirou há ${Math.abs(diasRestantes)} dias`;
  if (diasRestantes === 0) return "expira hoje";
  if (diasRestantes === 1) return "expira amanhã";
  return `expira em ${diasRestantes} dias`;
}

/**
 * Normaliza payload admin de `perfil_promo_ate`.
 * @param {object} form
 * @returns {{ perfil_promo_ate: string|null }}
 */
export function buildPerfilPromoPayload(form) {
  const raw = form.perfil_promo_ativo
    ? normalizeDateISO(form.perfil_promo_ate) || PERFIL_PROMO_FIM_PADRAO
    : normalizeDateISO(form.perfil_promo_ate);

  if (form.perfil_promo_ativo === false) {
    return { perfil_promo_ate: null };
  }

  return { perfil_promo_ate: raw || null };
}

/**
 * Metadados de plano incluídos em eventos de analytics.
 * @param {object|null|undefined} lugar
 * @param {Record<string, unknown>} [extra]
 * @param {string} [hoje]
 * @returns {Record<string, unknown>}
 */
export function buildLugarLogDetalhes(lugar, extra = {}, hoje = hojeISO()) {
  const tier = getPlanoComercialTier(lugar, hoje);
  return {
    lugar_id: lugar?.id ?? null,
    lugar_nome: lugar?.nome ?? null,
    plano_tier: tier,
    eh_parceiro: Boolean(lugar?.eh_parceiro),
    perfil_promo_ativo: isPerfilPromoAtivo(lugar?.perfil_promo_ate, hoje),
    ...extra,
  };
}

/**
 * @param {object|null|undefined} error
 * @returns {boolean}
 */
export function isMissingPerfilPromoColumnError(error) {
  const msg = String(error?.message || error?.details || "").toLowerCase();
  return msg.includes("perfil_promo_ate");
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<boolean>}
 */
export async function fetchPerfilPromoColumnReady(supabase) {
  const { error } = await supabase.from("lugares").select("perfil_promo_ate").limit(1);

  if (!error) return true;
  if (isMissingPerfilPromoColumnError(error)) return false;
  console.error("[fetchPerfilPromoColumnReady]", error.message);
  return false;
}
