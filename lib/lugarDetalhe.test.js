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

const veterinaria = {
  id: "vet-1",
  nome: "Isabela | Veterinária | Pet Sitter Imbituba",
  categoria: "Serviços",
  subcategoria: "Saúde",
};

assert.match(
  getFraseConvencimento(veterinaria, [{ nome: "Pet" }]),
  /veterin|pet/i
);
assert.doesNotMatch(
  getFraseConvencimento(veterinaria, [{ nome: "Pet" }]),
  /pet friendly|resolve r[aá]pido|Prático e perto/i
);

assert.match(
  getFraseConvencimento(
    {
      id: "cafe-1",
      nome: "Café da Vila",
      categoria: "Gastronomia",
    },
    [{ nome: "Pet friendly" }]
  ),
  /pet friendly/i
);

assert.doesNotMatch(
  getFraseConvencimento(
    {
      id: "serv-1",
      nome: "Serviço Genérico",
      categoria: "Serviços",
    },
    [{ nome: "Pet" }]
  ),
  /pet friendly/i
);

console.log("lugarDetalhe.test.js: ok");
