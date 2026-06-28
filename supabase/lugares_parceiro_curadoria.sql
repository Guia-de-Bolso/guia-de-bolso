-- Parceiro (plano R$ 299) e Curadoria do Guia (conteúdo autoral) em lugares.
-- Substitui uso de `destaques` no app (tabela legada mantida no banco).

ALTER TABLE lugares ADD COLUMN IF NOT EXISTS eh_parceiro boolean NOT NULL DEFAULT false;
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS conteudo_curadoria boolean NOT NULL DEFAULT false;

-- Parceiros vigentes em destaques → flag no lugar
UPDATE lugares l
SET eh_parceiro = true
WHERE EXISTS (
  SELECT 1
  FROM destaques d
  WHERE d.lugar_id = l.id
    AND d.ativo = true
    AND (d.data_inicio IS NULL OR d.data_inicio <= CURRENT_DATE)
    AND (d.data_fim IS NULL OR d.data_fim >= CURRENT_DATE)
);

-- Curadoria: Natureza/Cultura/Aventura sem parceiro comercial típico (ajuste no admin depois)
UPDATE lugares
SET conteudo_curadoria = true
WHERE eh_parceiro = false
  AND status = 'ativo'
  AND categoria IN ('Natureza', 'Cultura', 'Aventura')
  AND (
    subcategoria IN (
      'Praias', 'Trilhas', 'Cachoeiras', 'Mirantes', 'Lagoas', 'Parques',
      'Piscinas naturais', 'Dunas', 'Ilhas',
      'Museus', 'Monumentos', 'Igrejas e templos', 'Eventos',
      'Esportes radicais', 'Passeios de barco', 'Escalada', 'Ciclismo'
    )
    OR subcategoria IS NULL
  );

CREATE INDEX IF NOT EXISTS idx_lugares_eh_parceiro_ativo
  ON lugares (eh_parceiro)
  WHERE status = 'ativo' AND eh_parceiro = true;

CREATE INDEX IF NOT EXISTS idx_lugares_conteudo_curadoria_ativo
  ON lugares (conteudo_curadoria)
  WHERE status = 'ativo' AND conteudo_curadoria = true;
