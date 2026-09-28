import test from "node:test";
import assert from "node:assert/strict";
import database from "./wikidata-people.json" with { type:"json" };

test("ships a large Wikidata knowledge base with portraits", () => {
  assert.ok(database.characters.length >= 17000);
  assert.ok(database.characters.filter(({ image }) => image).length >= 14000);
  assert.ok(database.characters.every(({ id, name, attributes }) => id && name && attributes));
  assert.ok(database.characters.filter(({ attributes }) => attributes.politician === 1).length >= 1000);
  assert.ok(database.characters.filter(({ attributes }) => attributes.nationalLeader === 1).length >= 60);
  assert.equal(database.characters.some(({ attributes }) => Object.keys(attributes).some((id) => id.startsWith("initial") || id.startsWith("born"))), false);
});

test("includes correctly classified requested public people", () => {
  const byName = (name) => database.characters.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  const scholz = byName("Olaf Scholz");
  const papaplatte = byName("Papaplatte");
  const rain = byName("Sophie Rain");
  assert.deepEqual([scholz.attributes.real, scholz.attributes.politician, scholz.attributes.german, scholz.attributes.musician, scholz.attributes.athlete], [1, 1, 1, -1, -1]);
  assert.ok(scholz.image);
  assert.deepEqual([papaplatte.attributes.real, papaplatte.attributes.creator, papaplatte.attributes.german], [1, 1, 1]);
  assert.ok(papaplatte.image);
  assert.deepEqual([rain.attributes.real, rain.attributes.creator, rain.attributes.american, rain.attributes.female], [1, 1, 1, 1]);
});
