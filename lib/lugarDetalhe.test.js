import assert from "node:assert/strict";
import { getFraseConvencimento } from "./lugarDetalhe.js";

const salao = {
  id: "salao-1",
  nome: "Beauty Lounge By Sara Melo",
  categoria: "Serviços",
  subcategoria: "Salões",
};

assert.match(
  getFraseConvencimento(salao, [{ nome: "Manicure" }]),
  /visual|hair|unhas|autocuidado/i
);

assert.doesNotMatch(
  getFraseConvencimento(salao, [{ nome: "Vista do mar" }]),
  /areia|beira-mar/i
);

assert.match(
  getFraseConvencimento(
    { id: "praia-1", categoria: "Natureza", subcategoria: "Praias" },
    [{ nome: "Vista do mar" }]
  ),
  /areia|mar|praia/i
);

assert.match(
  getFraseConvencimento(
    { id: "2", categoria: "Serviços", subcategoria: "Salões" },
    [{ nome: "Comercial" }]
  ),
  /visual|hair|unhas|autocuidado|Serviço/i
);

console.log("lugarDetalhe.test.js: ok");
