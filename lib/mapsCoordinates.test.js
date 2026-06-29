import assert from "node:assert/strict";
import {
  buildMapsUrlsForAtrativo,
  buildMapsUrlsForLugar,
  formatCoordinatesLabel,
  getMapAddressLabel,
  parseMapCoordinates,
} from "./mapsCoordinates.js";

assert.deepEqual(parseMapCoordinates({ latitude: -28.24, longitude: -48.67 }), {
  latitude: -28.24,
  longitude: -48.67,
});

assert.equal(parseMapCoordinates({ latitude: "x", longitude: 1 }), null);
assert.equal(parseMapCoordinates(null), null);

assert.equal(
  formatCoordinatesLabel({ latitude: -28.24, longitude: -48.67 }),
  "-28.240000, -48.670000"
);
assert.equal(formatCoordinatesLabel(null), null);

const lugarUrls = buildMapsUrlsForLugar(
  { nome: "Praia da Vila" },
  { latitude: -28.24, longitude: -48.67 }
);
assert.ok(lugarUrls.google.includes("-28.24,-48.67"));
assert.ok(lugarUrls.apple.includes("-28.24,-48.67"));
assert.ok(lugarUrls.waze.includes("-28.24,-48.67"));

const lugarQueryUrls = buildMapsUrlsForLugar({ nome: "Praia da Vila" }, null);
assert.ok(lugarQueryUrls.google.includes("Praia"));

const atrativoUrls = buildMapsUrlsForAtrativo(
  { titulo: "Trilha do Morro" },
  { latitude: -28.1, longitude: -48.5 }
);
assert.ok(atrativoUrls.waze.includes("navigate=yes"));

assert.equal(getMapAddressLabel({ endereco_completo: "  Rua A, 10 " }), "Rua A, 10");
assert.equal(getMapAddressLabel({}), null);

console.log("mapsCoordinates.test.js: ok");
