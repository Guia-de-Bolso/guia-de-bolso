-- Vídeo opcional por lugar (1 por local). Path no Storage: lugares-fotos/{lugar_id}/videos/…
-- Limites no app: até 60 s, até 25 MB, MP4 ou WebM (pré-comprimido no admin).

ALTER TABLE lugares ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS tem_video boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN lugares.video_url IS 'URL pública do vídeo no bucket lugares-fotos (subpasta videos/). Máx. 1 por lugar.';
COMMENT ON COLUMN lugares.tem_video IS 'Habilita upload de vídeo no admin fora de Natureza/Aventura.';
