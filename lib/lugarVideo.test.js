import assert from "node:assert/strict";
import { lugarExibeVideo, lugarMostraVideoPublico } from "./lugarVideo.js";

assert.equal(lugarExibeVideo({ video_url: "https://cdn.test/a.mp4" }), true);
assert.equal(lugarExibeVideo({ video_url: "  " }), false);

const praia = {
  categoria: "Natureza",
  subcategoria: "Praias",
  video_url: "https://cdn.test/a.mp4",
};
assert.equal(lugarMostraVideoPublico(praia), true);

const gastroBasico = {
  categoria: "Gastronomia",
  subcategoria: "Restaurantes",
  eh_parceiro: false,
  perfil_promo_ate: null,
  video_url: "https://cdn.test/a.mp4",
};
assert.equal(lugarMostraVideoPublico(gastroBasico), false);

const gastroPromo = {
  ...gastroBasico,
  perfil_promo_ate: "2099-01-01",
};
assert.equal(lugarMostraVideoPublico(gastroPromo), true);

assert.equal(lugarMostraVideoPublico({ categoria: "Natureza" }), false);

console.log("lugarVideo.test.js: ok");
