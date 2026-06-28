-- Plano comercial único (V1): Parceiro · R$ 299/mês
-- Rode no SQL Editor do Supabase após revisar destaques existentes.

INSERT INTO planos (nome, frequencia, preco)
SELECT 'Parceiro', 'mensal', 299.00
WHERE NOT EXISTS (
  SELECT 1 FROM planos WHERE nome = 'Parceiro'
);

UPDATE planos
SET nome = 'Parceiro',
    frequencia = 'mensal',
    preco = 299.00
WHERE nome = 'Parceiro'
   OR nome ILIKE '%parceiro oficial%'
   OR preco IN (199.00, 229.00);

-- Opcional: apontar destaques órfãos para o plano Parceiro
-- UPDATE destaques SET plano_id = (SELECT id FROM planos WHERE nome = 'Parceiro' LIMIT 1)
-- WHERE plano_id NOT IN (SELECT id FROM planos WHERE nome = 'Parceiro');
