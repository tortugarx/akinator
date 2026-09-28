import test from "node:test";
import assert from "node:assert/strict";
import database from "./wikidata-people.json" with { type:"json" };

test("ships a large Wikidata knowledge base with portraits", () => {
  assert.ok(database.characters.length >= 8000);
  assert.ok(database.characters.filter(({ image }) => image).length >= 7000);
  assert.ok(database.characters.every(({ id, name, attributes }) => id && name && attributes));
  assert.ok(database.characters.filter(({ attributes }) => attributes.politician === 1).length >= 1000);
  assert.ok(database.characters.filter(({ attributes }) => attributes.nationalLeader === 1).length >= 60);
  assert.equal(database.characters.some(({ attributes }) => Object.keys(attributes).some((id) => id.startsWith("initial") || id.startsWith("born"))), false);
});
