import assert from "node:assert/strict";
import {
  getClaimPerfilWhatsAppUrl,
  getTextoSobre,
  getVisibilidadePerfil,
  isPerfilBasico,
} from "./lugarVisibilidade.js";

const parceiro = getVisibilidadePerfil(true, false, true);
const gratuito = getVisibilidadePerfil(false, false, true);
const curadoriaBadge = getVisibilidadePerfil(false, true, true);
const natureza = getVisibilidadePerfil(false, true, false);
const naturezaSemBadge = getVisibilidadePerfil(false, false, false);

assert.equal(parceiro.perfil, "completo");
assert.equal(parceiro.showGaleriaCompleta, true);
assert.equal(parceiro.showGaleriaBloqueada, false);
assert.equal(parceiro.showAcoesRapidasEstabelecimento, true);
assert.equal(parceiro.showAcoesRapidasBloqueadas, false);
assert.equal(parceiro.showAvaliacoes, true);
assert.equal(parceiro.showResumoAvaliacoes, true);
assert.equal(parceiro.showClaimCta, false);
assert.equal(parceiro.showBadgeParceiro, true);

assert.equal(gratuito.perfil, "basico");
assert.equal(gratuito.showGaleriaCompleta, false);
assert.equal(gratuito.showGaleriaBloqueada, true);
assert.equal(gratuito.showDescricaoLonga, false);
assert.equal(gratuito.showAcoesRapidasEstabelecimento, false);
assert.equal(gratuito.showAcoesRapidasBloqueadas, true);
assert.equal(gratuito.showTags, false);
assert.equal(gratuito.showAvaliacoes, false);
assert.equal(gratuito.showResumoAvaliacoes, true);
assert.equal(gratuito.showVideo, false);
assert.equal(gratuito.showHistoriaCultura, false);
assert.equal(gratuito.showClaimCta, true);
assert.equal(gratuito.showBadgeParceiro, false);
assert.equal(isPerfilBasico(gratuito), true);

// Badge de curadoria em estabelecimento comercial NÃO desbloqueia perfil completo
assert.equal(curadoriaBadge.perfil, "basico");
assert.equal(curadoriaBadge.showBadgeCuradoria, true);
assert.equal(curadoriaBadge.showClaimCta, true);

assert.equal(natureza.perfil, "completo");
assert.equal(natureza.showClaimCta, false);
assert.equal(natureza.showBadgeCuradoria, true);
assert.equal(naturezaSemBadge.perfil, "completo");

assert.equal(
  getTextoSobre({ descricao: "curta", descricao_longa: "longa" }, false),
  "curta"
);
assert.equal(
  getTextoSobre({ descricao: "curta", descricao_longa: "longa" }, true),
  "longa"
);

const claimUrl = getClaimPerfilWhatsAppUrl({
  nome: "Bar do Sol",
  slug: "bar-do-sol",
});
assert.ok(claimUrl.includes("wa.me/5548991223308"));
assert.ok(claimUrl.includes("text="));
assert.ok(decodeURIComponent(claimUrl).includes("Bar do Sol"));
assert.ok(decodeURIComponent(claimUrl).includes("bar-do-sol"));

console.log("lugarVisibilidade tests OK");
