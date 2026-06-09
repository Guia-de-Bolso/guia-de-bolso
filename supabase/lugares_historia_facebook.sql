-- História/cultura (CMS manual) e link do Facebook em lugares.

ALTER TABLE lugares ADD COLUMN IF NOT EXISTS historia_cultura text;
ALTER TABLE lugares ADD COLUMN IF NOT EXISTS facebook_url text;
