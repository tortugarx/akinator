import test from "node:test";
import assert from "node:assert/strict";
import database from "./wikidata-people.json" with { type:"json" };

test("ships a large Wikidata knowledge base with portraits", () => {
  assert.ok(database.characters.length >= 17000);
  assert.ok(database.characters.filter(({ image }) => image).length >= 14000);
  assert.ok(database.characters.filter(({ imageAttribution }) => imageAttribution).length >= 13800);
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
  // Missing wiki career statements are unknown, never fabricated negatives.
  assert.deepEqual([scholz.attributes.real, scholz.attributes.politician, scholz.attributes.german, scholz.attributes.musician, scholz.attributes.athlete], [1, 1, 1, undefined, undefined]);
  assert.ok(scholz.image);
  assert.deepEqual([papaplatte.attributes.real, papaplatte.attributes.creator, papaplatte.attributes.german], [1, 1, 1]);
  assert.ok(papaplatte.image);
  assert.deepEqual([rain.attributes.real, rain.attributes.creator, rain.attributes.american, rain.attributes.female], [1, 1, 1, 1]);
  assert.ok(rain.image);
  assert.equal(rain.imageAttribution.source, "Openverse");
});

test("image fallbacks keep reusable licenses and attribution links", () => {
  const attributed = database.characters.filter(({ imageAttribution }) => imageAttribution);
  assert.ok(attributed.every(({ imageAttribution }) => imageAttribution.creator && imageAttribution.license && imageAttribution.sourceUrl));
  assert.equal(attributed.some(({ imageAttribution }) => /\bNC\b|noncommercial/i.test(imageAttribution.license)), false);
});

test("covers additional real-world fields", () => {
  const count = (trait) => database.characters.filter(({ attributes }) => attributes[trait] === 1).length;
  assert.ok(count("military") >= 180);
  assert.ok(count("adultCreator") >= 30);
  assert.ok(count("industrialist") >= 15);
  assert.ok(count("medical") >= 60);
  assert.ok(count("legal") >= 200);
  assert.ok(count("religious") >= 80);
});
