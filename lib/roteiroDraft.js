const STORAGE_KEY = "gb_roteiro_draft_v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function getSessionStorage() {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage;
}

/**
 * @typedef {Object} RoteiroDraft
 * @property {string} titulo
 * @property {string} conteudo
 * @property {string} dias
 * @property {number|null} [diasExatos]
 * @property {string} perfil
 * @property {string[]} interesses
 * @property {string[]} [tiposGastronomia]
 * @property {Array<{ id: string, nome: string, imagem_url?: string|null, fotos?: unknown, ehParceiro?: boolean }>} lugaresCatalog
 * @property {number} [savedAt]
 */

/**
 * @param {Omit<RoteiroDraft, "savedAt">} draft
 */
export function saveRoteiroDraft(draft) {
  const storage = getSessionStorage();
  if (!storage) return;
  if (!draft?.conteudo?.trim()) return;

  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...draft,
        savedAt: Date.now(),
      })
    );
  } catch {
    /* quota ou modo privado */
  }
}

/**
 * @returns {RoteiroDraft|null}
 */
export function loadRoteiroDraft() {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data?.conteudo?.trim()) {
      clearRoteiroDraft();
      return null;
    }

    if (Date.now() - (data.savedAt || 0) > MAX_AGE_MS) {
      clearRoteiroDraft();
      return null;
    }

    return data;
  } catch {
    clearRoteiroDraft();
    return null;
  }
}

export function clearRoteiroDraft() {
  const storage = getSessionStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
}

export function hasRoteiroDraft() {
  return Boolean(loadRoteiroDraft());
}

/** Query usada ao voltar do detalhe de um lugar para retomar o rascunho. */
export const ROTEIRO_RESUME_QUERY = "resumeRoteiro=1";

export const ROTEIRO_RETURN_PATH = `/roteiros?${ROTEIRO_RESUME_QUERY}`;
