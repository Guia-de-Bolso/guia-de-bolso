/**
 * @deprecated Tabela `destaques` / `planos` para highlights comerciais — legado no Supabase.
 * O app usa `lugares.eh_parceiro` e `lugares.conteudo_curadoria` (ver `lib/lugarBadges.js`).
 * Atrativos curados usam rotação diária + `rotas.rota_do_dia_fixada_ate` (ver `lib/atrativoDoDia.js`).
 */

export {
  BADGE_PARCEIRO_LABEL,
  getBadgeParceiroLabel,
  getBadgeCuradoriaLabel,
  isParceiro,
  isConteudoCuradoria,
  enrichLugarFlags,
  enrichLugaresFlags,
} from "@/lib/lugarBadges";
