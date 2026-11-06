import { test } from "node:test";
import assert from "node:assert/strict";
import { crocsCategoryCollectionIds } from "../src/lib/crocs-catalog";

test("preserva vínculos oficiais quando a Crocs classifica o modelo em feminino e masculino", () => {
  const ids = crocsCategoryCollectionIds([
    "/111/112/113/",
    "/111/",
    "/146/147/148/",
    "/146/",
  ]);
  assert.deepEqual(ids, ["111", "146"]);
});

test("ignora taxonomias que não pertencem às coleções da loja", () => {
  assert.deepEqual(crocsCategoryCollectionIds(["/596/"]), []);
});

test("usa fallback apenas quando a origem não retorna categorias", () => {
  assert.deepEqual(crocsCategoryCollectionIds([], "146"), ["146"]);
});
