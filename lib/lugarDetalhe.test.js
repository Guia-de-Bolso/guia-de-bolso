import assert from "node:assert/strict";
import {
  categoriaUsaCardapio,
  getAcoesRapidasBloqueadas,
  getAcoesRapidasLocais,
  getAcoesRapidasPresenca,
  getFraseConvencimento,
  isLugarEstabelecimento,
  isLugarPublico,
} from "./lugarDetalhe.js";

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

const museuUsina = {
  id: "museu-usina-1",
  nome: "Museu Usina",
  categoria: "Cultura",
  subcategoria: "Museus",
  descricao: "Antiga usina elétrica desativada e patrimônio histórico de Imbituba.",
};
assert.match(
  getFraseConvencimento(museuUsina, [{ nome: "Patrimônio histórico" }]),
  /patrim[oô]nio|cultur|hist[oó]ric/i
);
assert.doesNotMatch(
  getFraseConvencimento(museuUsina, [{ nome: "Patrimônio histórico" }]),
  /servi[cç]o el[eé]tric/i
);

assert.match(
  getFraseConvencimento(
    {
      id: "elet-1",
      nome: "Eletricista do Bairro",
      categoria: "Serviços",
      subcategoria: "Serviços gerais",
    },
    []
  ),
  /servi[cç]o el[eé]tric/i
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

const skatepark = {
  nome: "Skatepark",
  categoria: "Aventura",
  subcategoria: "Esportes radicais",
};
assert.equal(isLugarPublico(skatepark), false);
assert.equal(isLugarEstabelecimento(skatepark), true);
assert.equal(isLugarPublico({ categoria: "Natureza", subcategoria: "Praias" }), true);
assert.equal(isLugarEstabelecimento({ categoria: "Gastronomia" }), true);

assert.equal(categoriaUsaCardapio({ categoria: "Gastronomia" }), true);
assert.equal(categoriaUsaCardapio({ categoria: "Bem-estar" }), false);
assert.equal(categoriaUsaCardapio({ categoria: "Serviços" }), false);

const bloqueadasGastro = getAcoesRapidasBloqueadas({ categoria: "Gastronomia" });
assert.ok(bloqueadasGastro.some((a) => a.id === "cardapio"));
assert.ok(!bloqueadasGastro.some((a) => a.id === "facebook"));

const bloqueadasAcademia = getAcoesRapidasBloqueadas({ categoria: "Bem-estar" });
assert.ok(bloqueadasAcademia.some((a) => a.id === "facebook"));
assert.ok(!bloqueadasAcademia.some((a) => a.id === "cardapio"));

const presencaGastro = getAcoesRapidasPresenca({
  telefone: "(48) 9 9999-8888",
  categoria: "Gastronomia",
});
assert.ok(presencaGastro.find((a) => a.id === "whatsapp")?.href?.includes("wa.me"));
assert.equal(presencaGastro.find((a) => a.id === "instagram")?.href, null);
assert.ok(presencaGastro.some((a) => a.id === "cardapio"));

const mirante = getAcoesRapidasLocais(
  { categoria: "Natureza", subcategoria: "Mirantes" },
  [],
  null
);
const duracaoMirante = mirante.find((a) => a.id === "duracao");
const horarioMirante = mirante.find((a) => a.id === "horario");
assert.equal(duracaoMirante.valor, "30–45 min");
assert.equal(duracaoMirante.subtitulo, "Tempo médio");
assert.equal(horarioMirante.valor, "Fim da tarde");
assert.equal(horarioMirante.subtitulo, "Melhor horário");
assert.doesNotMatch(
  `${duracaoMirante.valor} ${duracaoMirante.subtitulo}`,
  /Parada tempo médio/i
);
assert.doesNotMatch(
  `${horarioMirante.valor} ${horarioMirante.subtitulo}`,
  /Ideal Melhor/i
);

console.log("lugarDetalhe.test.js: ok");
