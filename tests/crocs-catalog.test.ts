import { test } from "node:test";
import assert from "node:assert/strict";
import { crocsCategoryCollectionIds } from "../src/lib/crocs-catalog";

test("preserva vínculos oficiais quando a Crocs classifica o modelo em feminino e masculino", () => {
  const ids = crocsCategoryCollectionIds([
    "/Feminino/Style/Clogs/",
    "/Feminino/",
    "/Masculino/Style/Clogs/",
    "/Masculino/",
  ]);
  assert.deepEqual(ids, ["111", "146"]);
});

test("ignora taxonomias que não pertencem às coleções da loja", () => {
  assert.deepEqual(crocsCategoryCollectionIds(["/Campanhas/Black-Friday/"]), []);
});

test("usa fallback apenas quando a origem não retorna categorias", () => {
  assert.deepEqual(crocsCategoryCollectionIds([], "146"), ["146"]);
});
