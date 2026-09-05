import assert from "node:assert/strict";
import test from "node:test";
import { LUGAR_SELECT_LIST, queryLugaresForCategoria } from "./lugaresQuery.js";
import { buildCategoriaMatchOrFilter } from "./lugarTaxonomia.js";

function createPagedClient(pages) {
  const calls = [];
  let pageIndex = 0;

  return {
    calls,
    from() {
      const state = { select: null, eqs: [], or: null, range: null };

      const builder = {
        select(value) {
          state.select = value;
          return builder;
        },
        eq(column, value) {
          state.eqs.push([column, value]);
          return builder;
        },
        or(value) {
          state.or = value;
          return builder;
        },
        range(from, to) {
          state.range = [from, to];
          calls.push({
            select: state.select,
            eqs: [...state.eqs],
            or: state.or,
            range: [...state.range],
          });
          const page = pages[pageIndex] ?? { data: [], error: null };
          pageIndex += 1;
          return Promise.resolve(page);
        },
      };

      return builder;
    },
  };
}

test("LUGAR_SELECT_LIST inclui taxonomia, horário, tags e coordenadas", () => {
  assert.ok(LUGAR_SELECT_LIST.includes("categoria"));
  assert.ok(LUGAR_SELECT_LIST.includes("subcategoria"));
  assert.ok(LUGAR_SELECT_LIST.includes("horarios"));
  assert.ok(LUGAR_SELECT_LIST.includes("localizacoes(latitude, longitude"));
  assert.ok(LUGAR_SELECT_LIST.includes("lugares_tags(tags("));
});

test("queryLugaresForCategoria pré-filtra no banco e aplica taxonomia efetiva", async () => {
  const pubNaNatureza = {
    id: "pub",
    nome: "Empório Zimbeer",
    categoria: "Natureza",
    subcategoria: "Pubs",
  };
  const praia = {
    id: "praia",
    nome: "Praia da Vila",
    categoria: "Natureza",
    subcategoria: "Praias",
  };

  const supabase = createPagedClient([
    { data: [pubNaNatureza, praia], error: null },
  ]);

  const { data, error } = await queryLugaresForCategoria(supabase, "Noite", 100);

  assert.equal(error, null);
  assert.equal(supabase.calls.length, 1);
  assert.equal(supabase.calls[0].select, LUGAR_SELECT_LIST);
  assert.deepEqual(supabase.calls[0].eqs, [["status", "ativo"]]);
  assert.equal(supabase.calls[0].or, buildCategoriaMatchOrFilter("Noite"));
  assert.deepEqual(
    data.map((lugar) => lugar.id),
    ["pub"]
  );
  assert.equal(data[0].categoria, "Noite");
});

test("queryLugaresForCategoria recua para varredura se o .or() falhar", async () => {
  const praia = {
    id: "praia",
    nome: "Praia da Vila",
    categoria: "Natureza",
    subcategoria: "Praias",
  };
  const supabase = createPagedClient([
    { data: null, error: { message: "or() syntax" } },
    { data: [praia], error: null },
  ]);

  const { data, error } = await queryLugaresForCategoria(supabase, "Natureza", 100);

  assert.equal(error, null);
  assert.equal(supabase.calls.length, 2);
  assert.ok(supabase.calls[0].or);
  assert.equal(supabase.calls[1].or, null);
  assert.deepEqual(
    data.map((lugar) => lugar.id),
    ["praia"]
  );
});
