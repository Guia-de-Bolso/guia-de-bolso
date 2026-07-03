-- Status `pausado`: cadastro fora do app, sem exclusão automática.
-- `desativado` mantém retenção de 30 dias (local que estava publicado).
-- Idempotente — rode no SQL Editor do Supabase.

COMMENT ON COLUMN lugares.status IS
  'ativo | pausado (fora do app, sem purge) | desativado (inativo 30d) | em_analise';

-- Cadastros que hoje estão como inativo passam a pausado (desativado no admin).
UPDATE public.lugares
SET status = 'pausado',
    desativado_em = NULL
WHERE status = 'desativado';
