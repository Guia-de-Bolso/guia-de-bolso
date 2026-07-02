-- Contratos comerciais de parceiros (admin-only — dados sensíveis).
-- Requer perfis com role = 'admin'. Rode após lugares_parceiro_programa.sql.

CREATE OR REPLACE FUNCTION public.is_admin_only()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfis
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_only() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_only() TO authenticated;

-- ─── contratos_comerciais ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contratos_comerciais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lugar_id bigint NOT NULL REFERENCES lugares (id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (
    tipo IN ('lancamento_6_meses_gratis', 'parceiro_pago', 'aditivo')
  ),
  status text NOT NULL DEFAULT 'rascunho' CHECK (
    status IN ('rascunho', 'enviado', 'assinado', 'ativo', 'encerrado', 'inadimplente')
  ),
  ativo boolean NOT NULL DEFAULT false,
  numero_proposta text,
  valor_mensal numeric(10, 2) CHECK (valor_mensal IS NULL OR valor_mensal >= 0),
  moeda text NOT NULL DEFAULT 'BRL' CHECK (moeda IN ('BRL')),
  data_proposta date,
  data_assinatura date,
  data_inicio date,
  data_fim date,
  data_conversao_pago date,
  asaas_customer_id text,
  asaas_subscription_id text,
  asaas_link_cobranca text,
  contato_nome text,
  contato_email text,
  contato_whatsapp text,
  cnpj text,
  razao_social text,
  notas_internas text,
  created_by uuid REFERENCES perfis (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contratos_data_fim_check CHECK (data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contratos_um_ativo_por_lugar
  ON contratos_comerciais (lugar_id)
  WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_contratos_lugar_id ON contratos_comerciais (lugar_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos_comerciais (status);
CREATE INDEX IF NOT EXISTS idx_contratos_data_fim ON contratos_comerciais (data_fim)
  WHERE tipo = 'lancamento_6_meses_gratis';

-- ─── contrato_documentos ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contrato_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES contratos_comerciais (id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (
    tipo IN ('proposta', 'contrato_assinado', 'aditivo', 'comprovante', 'outro')
  ),
  nome_arquivo text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  tamanho_bytes bigint CHECK (tamanho_bytes IS NULL OR tamanho_bytes >= 0),
  uploaded_by uuid REFERENCES perfis (id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contrato_documentos_contrato
  ON contrato_documentos (contrato_id);

-- updated_at
CREATE OR REPLACE FUNCTION public.set_contratos_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contratos_comerciais_updated_at ON contratos_comerciais;
CREATE TRIGGER contratos_comerciais_updated_at
  BEFORE UPDATE ON contratos_comerciais
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contratos_updated_at();

-- Garante um único contrato ativo por lugar
CREATE OR REPLACE FUNCTION public.contratos_desativar_outros_ativos()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ativo = true THEN
    UPDATE public.contratos_comerciais
    SET ativo = false, updated_at = now()
    WHERE lugar_id = NEW.lugar_id
      AND id <> NEW.id
      AND ativo = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contratos_um_ativo ON contratos_comerciais;
CREATE TRIGGER contratos_um_ativo
  BEFORE INSERT OR UPDATE OF ativo, lugar_id ON contratos_comerciais
  FOR EACH ROW
  EXECUTE FUNCTION public.contratos_desativar_outros_ativos();

-- RLS
ALTER TABLE contratos_comerciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrato_documentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin contratos_comerciais all" ON contratos_comerciais;
CREATE POLICY "Admin contratos_comerciais all"
  ON contratos_comerciais
  FOR ALL
  TO authenticated
  USING (public.is_admin_only())
  WITH CHECK (public.is_admin_only());

DROP POLICY IF EXISTS "Admin contrato_documentos all" ON contrato_documentos;
CREATE POLICY "Admin contrato_documentos all"
  ON contrato_documentos
  FOR ALL
  TO authenticated
  USING (public.is_admin_only())
  WITH CHECK (public.is_admin_only());

-- Storage bucket privado (documentos PDF/DOCX)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contratos-parceiros',
  'contratos-parceiros',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admin contratos storage insert" ON storage.objects;
CREATE POLICY "Admin contratos storage insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contratos-parceiros' AND public.is_admin_only());

DROP POLICY IF EXISTS "Admin contratos storage select" ON storage.objects;
CREATE POLICY "Admin contratos storage select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'contratos-parceiros' AND public.is_admin_only());

DROP POLICY IF EXISTS "Admin contratos storage update" ON storage.objects;
CREATE POLICY "Admin contratos storage update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'contratos-parceiros' AND public.is_admin_only())
  WITH CHECK (bucket_id = 'contratos-parceiros' AND public.is_admin_only());

DROP POLICY IF EXISTS "Admin contratos storage delete" ON storage.objects;
CREATE POLICY "Admin contratos storage delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'contratos-parceiros' AND public.is_admin_only());
