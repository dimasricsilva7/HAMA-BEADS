import { test } from "node:test";
import assert from "node:assert/strict";
import {
  catalogFamilyKey,
  deduplicateCatalogColorways,
  filterCatalogByCollection,
} from "../src/lib/catalog-display";

const swatch = (id: string, value: string) => ({
  id, slug: id, value, imageUrl: null, priceCents: 36900, listPriceCents: null, available: true,
});

const product = (id: string, name: string, memberships: string[], colors: ReturnType<typeof swatch>[]) => ({
  id, name, category: "CLOGS", sourceCollectionId: memberships[0] ?? null,
  sourceCollectionIds: memberships, colorFamily: colors,
});

test("masculino e feminino usam somente vínculos oficiais de coleção", () => {
  const maleOnly = product("m", "Classic Clog", ["146"], [swatch("m", "Black")]);
  const femaleOnly = product("f", "Classic Clog", ["111"], [swatch("f", "Pink")]);
  const unisex = product("u", "Bayaband Clog", ["111", "146"], [swatch("u", "Winter White/Multi")]);
  assert.deepEqual(filterCatalogByCollection([maleOnly, femaleOnly, unisex], "146").map((p) => p.id), ["m", "u"]);
  assert.deepEqual(filterCatalogByCollection([maleOnly, femaleOnly, unisex], "111").map((p) => p.id), ["f", "u"]);
});

test("um modelo com várias cores gera um card e conserva os swatches da coleção", () => {
  const navy = product("navy", "Crocband Clog", ["146"], [swatch("navy", "Navy"), swatch("slate", "Slate")]);
  const slate = product("slate", "Crocband Clog", ["146"], [swatch("navy", "Navy"), swatch("slate", "Slate")]);
  const pink = product("pink", "Crocband Clog", ["111"], [swatch("navy", "Navy"), swatch("slate", "Slate"), swatch("pink", "Pink")]);
  const maleCards = deduplicateCatalogColorways(filterCatalogByCollection([navy, slate, pink], "146"));
  assert.equal(maleCards.length, 1);
  assert.deepEqual(maleCards[0].colorFamily.map((color) => color.id), ["navy", "slate"]);
});

test("modelos diferentes não são mesclados por nome semelhante", () => {
  assert.notEqual(catalogFamilyKey({ category: "CLOGS", name: "Bayaband Clog" }), catalogFamilyKey({ category: "SANDALS", name: "Bayaband Clog" }));
  const products = [
    product("a", "Crocband Clog", ["146"], [swatch("a", "Black")]),
    product("b", "Crocband Clog Infantil", ["146"], [swatch("b", "Blue")]),
  ];
  assert.equal(deduplicateCatalogColorways(products).length, 2);
});
