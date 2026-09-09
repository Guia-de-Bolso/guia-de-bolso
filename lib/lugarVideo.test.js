import assert from "node:assert/strict";
import {
  isLugarElegivelVideo,
  lugarExibeVideo,
  lugarMostraVideoPublico,
} from "./lugarVideo.js";

const skatepark = {
  categoria: "Aventura",
  subcategoria: "Esportes radicais",
  video_url: "https://cdn.test/skate.mp4",
  eh_parceiro: false,
  perfil_promo_ate: null,
};

assert.equal(isLugarElegivelVideo({ categoria: "Aventura" }), true);
assert.equal(lugarExibeVideo(skatepark), true);
assert.equal(lugarMostraVideoPublico(skatepark), false);
assert.equal(
  lugarMostraVideoPublico({ ...skatepark, conteudo_curadoria: true }),
  true
);

const bar = {
  categoria: "Gastronomia",
  video_url: "https://cdn.test/bar.mp4",
  eh_parceiro: false,
  perfil_promo_ate: null,
};
assert.equal(lugarMostraVideoPublico(bar), false);

console.log("lugarVideo tests OK");
