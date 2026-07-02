-- Programa Parceiro: prazos (6 meses grátis), status e curadoria trimestral de avaliações.
-- Rode no SQL Editor do Supabase após lugares_parceiro_curadoria.sql.

ALTER TABLE lugares ADD COLUMN IF NOT EXISTS parceiro_modalidade text;
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS parceiro_inicio_em date;
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS parceiro_fim_em date;
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS parceiro_status text;
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS ultima_curadoria_avaliacoes_em date;
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS proxima_curadoria_avaliacoes_em date;
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS parceiro_notas_internas text;

COMMENT ON COLUMN lugares.parceiro_modalidade IS 'lancamento_gratis | pago';
COMMENT ON COLUMN lugares.parceiro_status IS 'ativo | renovacao_pendente | convertido_pago | encerrado';
COMMENT ON COLUMN lugares.parceiro_fim_em IS 'Fim do período gratuito; null se plano pago';
COMMENT ON COLUMN lugares.proxima_curadoria_avaliacoes_em IS 'Próxima revisão trimestral de avaliações aprovadas';

-- Parceiros ativos sem datas: início = created_at::date, fim = +6 meses, curadoria = +3 meses
UPDATE lugares
SET
  parceiro_modalidade = COALESCE(parceiro_modalidade, 'lancamento_gratis'),
  parceiro_inicio_em = COALESCE(parceiro_inicio_em, (created_at AT TIME ZONE 'America/Sao_Paulo')::date),
  parceiro_fim_em = COALESCE(
    parceiro_fim_em,
    (COALESCE(parceiro_inicio_em, (created_at AT TIME ZONE 'America/Sao_Paulo')::date) + INTERVAL '6 months')::date
  ),
  parceiro_status = COALESCE(parceiro_status, 'ativo'),
  proxima_curadoria_avaliacoes_em = COALESCE(
    proxima_curadoria_avaliacoes_em,
    (COALESCE(parceiro_inicio_em, (created_at AT TIME ZONE 'America/Sao_Paulo')::date) + INTERVAL '3 months')::date
  )
WHERE eh_parceiro = true
  AND status = 'ativo';

CREATE INDEX IF NOT EXISTS idx_lugares_parceiro_fim
  ON lugares (parceiro_fim_em)
  WHERE eh_parceiro = true AND parceiro_modalidade = 'lancamento_gratis';

CREATE INDEX IF NOT EXISTS idx_lugares_proxima_curadoria
  ON lugares (proxima_curadoria_avaliacoes_em)
  WHERE eh_parceiro = true;
