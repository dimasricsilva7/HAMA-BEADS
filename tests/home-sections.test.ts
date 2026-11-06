import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaultHomeSectionSelection,
  homeProductFamilyKey,
  parseHomeSectionSelection,
} from "../src/lib/home-sections";

const base = {
  category: "CLOGS",
  sourceCollectionId: "111",
  sourceCollectionIds: ["111"],
  homeBlackFriday: false,
  badge: null,
  priceCents: 29900,
  listPriceCents: null,
};

test("vitrine agrupa cores do mesmo modelo em um único produto", () => {
  const navy = { ...base, id: "navy", name: "Classic Clog" };
  const slate = { ...base, id: "slate", name: "Classic Clog" };
  assert.equal(homeProductFamilyKey(navy), homeProductFamilyKey(slate));
});

test("agrupamento normaliza acentos e espaços sem misturar categorias", () => {
  const a = { ...base, id: "a", name: "Crocband  Clog" };
  const b = { ...base, id: "b", name: "Crocband Clog" };
  const kids = { ...base, id: "c", category: "KIDS", name: "Crocband Clog" };
  assert.equal(homeProductFamilyKey(a), homeProductFamilyKey(b));
  assert.notEqual(homeProductFamilyKey(a), homeProductFamilyKey(kids));
});

test("vitrines iniciais usam um card por família e respeitam as coleções", () => {
  const products = [
    { ...base, id: "adult-navy", name: "Classic Clog", homeBlackFriday: true, listPriceCents: 29900, priceCents: 17940 },
    { ...base, id: "adult-slate", name: "Classic Clog", homeBlackFriday: true, listPriceCents: 29900, priceCents: 17940 },
    { ...base, id: "kids-car", name: "Crocband Lightning", category: "KIDS", sourceCollectionId: "173", sourceCollectionIds: ["173"] },
    { ...base, id: "jibbitz", name: "Jibbitz Pack", category: "JIBBITZ", sourceCollectionId: "215", sourceCollectionIds: ["215"] },
  ];
  const selection = defaultHomeSectionSelection(products);
  assert.deepEqual(selection.black, ["adult-navy"]);
  assert.deepEqual(selection.adult, ["adult-navy"]);
  assert.deepEqual(selection.kids, ["kids-car"]);
  assert.deepEqual(selection.jibbitz, ["jibbitz"]);
});

test("seleção salva aceita seção vazia e remove IDs duplicados dentro da mesma seção", () => {
  const parsed = parseHomeSectionSelection(JSON.stringify({
    black: ["p1", "p1"],
    kids: [],
    adult: ["p2"],
    jibbitz: [],
  }));
  assert.deepEqual(parsed, { black: ["p1"], kids: [], adult: ["p2"], jibbitz: [] });
  assert.deepEqual(parseHomeSectionSelection("not-json"), null);
});
