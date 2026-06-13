import assert from "node:assert/strict";
import {
  ROTEIRO_RETURN_PATH,
  clearRoteiroDraft,
  hasRoteiroDraft,
  loadRoteiroDraft,
  saveRoteiroDraft,
} from "./roteiroDraft.js";

const store = {};
global.sessionStorage = {
  setItem(key, value) {
    store[key] = value;
  },
  getItem(key) {
    return store[key] ?? null;
  },
  removeItem(key) {
    delete store[key];
  },
};

const draft = {
  titulo: "Roteiro 2 dias - Casal",
  conteudo: "# Dia 1 — Praias",
  dias: "2 dias",
  perfil: "Casal",
  interesses: ["Praias"],
  lugaresCatalog: [{ id: "1", nome: "Praia da Vila" }],
};

saveRoteiroDraft(draft);
assert.equal(hasRoteiroDraft(), true);
assert.equal(loadRoteiroDraft()?.titulo, draft.titulo);
clearRoteiroDraft();
assert.equal(hasRoteiroDraft(), false);
assert.equal(ROTEIRO_RETURN_PATH.includes("resumeRoteiro=1"), true);

console.log("roteiroDraft.test.js: ok");
