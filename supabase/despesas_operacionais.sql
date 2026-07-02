-- Despesas operacionais da stack (admin-only).
-- Requer public.is_admin_or_dev() de perfis_rls_fix.sql.

-- Config global (taxa de câmbio)
CREATE TABLE IF NOT EXISTS despesas_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  taxa_cambio_usd_brl numeric(8, 4) NOT NULL DEFAULT 5.90,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO despesas_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Catálogo de despesas recorrentes / fixas
CREATE TABLE IF NOT EXISTS despesas_operacionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_plataforma text NOT NULL,
  categoria text NOT NULL CHECK (
    categoria IN (
      'infra',
      'ia',
      'auth',
      'maps',
      'lojas',
      'ferramentas',
      'dominio',
      'marketing',
      'outros'
    )
  ),
  periodicidade text NOT NULL CHECK (
    periodicidade IN ('mensal', 'trimestral', 'semestral', 'anual', 'unico')
  ),
  valor numeric(12, 4) NOT NULL CHECK (valor > 0),
  moeda text NOT NULL CHECK (moeda IN ('USD', 'BRL')),
  ativo boolean NOT NULL DEFAULT true,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  dia_vencimento smallint CHECK (dia_vencimento IS NULL OR (dia_vencimento >= 1 AND dia_vencimento <= 28)),
  notas text,
  url_referencia text,
  taxa_cambio numeric(8, 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT despesas_data_fim_check CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

CREATE INDEX IF NOT EXISTS idx_despesas_operacionais_ativo
  ON despesas_operacionais (ativo);

CREATE INDEX IF NOT EXISTS idx_despesas_operacionais_categoria
  ON despesas_operacionais (categoria);

CREATE INDEX IF NOT EXISTS idx_despesas_operacionais_data_inicio
  ON despesas_operacionais (data_inicio);

-- Histórico de pagamentos reais
CREATE TABLE IF NOT EXISTS despesas_lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  despesa_id uuid NOT NULL REFERENCES despesas_operacionais (id) ON DELETE CASCADE,
  valor numeric(12, 4) NOT NULL CHECK (valor > 0),
  moeda text NOT NULL CHECK (moeda IN ('USD', 'BRL')),
  data_pagamento date NOT NULL,
  competencia text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_despesas_lancamentos_data
  ON despesas_lancamentos (data_pagamento);

CREATE INDEX IF NOT EXISTS idx_despesas_lancamentos_despesa
  ON despesas_lancamentos (despesa_id);

-- updated_at automático
CREATE OR REPLACE FUNCTION public.set_despesas_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS despesas_operacionais_updated_at ON despesas_operacionais;
CREATE TRIGGER despesas_operacionais_updated_at
  BEFORE UPDATE ON despesas_operacionais
  FOR EACH ROW
  EXECUTE FUNCTION public.set_despesas_updated_at();

DROP TRIGGER IF EXISTS despesas_config_updated_at ON despesas_config;
CREATE TRIGGER despesas_config_updated_at
  BEFORE UPDATE ON despesas_config
  FOR EACH ROW
  EXECUTE FUNCTION public.set_despesas_updated_at();

-- RLS
ALTER TABLE despesas_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas_operacionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas_lancamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin despesas_config all" ON despesas_config;
CREATE POLICY "Admin despesas_config all"
  ON despesas_config
  FOR ALL
  TO authenticated
  USING (public.is_dev())
  WITH CHECK (public.is_dev());

DROP POLICY IF EXISTS "Admin despesas_operacionais all" ON despesas_operacionais;
CREATE POLICY "Admin despesas_operacionais all"
  ON despesas_operacionais
  FOR ALL
  TO authenticated
  USING (public.is_dev())
  WITH CHECK (public.is_dev());

DROP POLICY IF EXISTS "Admin despesas_lancamentos all" ON despesas_lancamentos;
CREATE POLICY "Admin despesas_lancamentos all"
  ON despesas_lancamentos
  FOR ALL
  TO authenticated
  USING (public.is_dev())
  WITH CHECK (public.is_dev());
