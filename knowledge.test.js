import test from "node:test";
import assert from "node:assert/strict";
import database from "./wikidata-people.json" with { type:"json" };

test("ships a large Wikidata knowledge base with portraits", () => {
  assert.ok(database.characters.length >= 2500);
  assert.ok(database.characters.filter(({ image }) => image).length >= 2000);
  assert.ok(database.characters.every(({ id, name, attributes }) => id && name && attributes));
});
