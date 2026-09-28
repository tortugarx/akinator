import test from "node:test";
import assert from "node:assert/strict";
import { canStoreLearnedCharacter, findLocalKnowledge } from "./learning.js";

const people = [
  { id:"wiki-q76", name:"Barack Obama", source:"wikidata", image:"obama.jpg", attributes:{ real:1, politician:1 } },
  { id:"private-father", name:"Vater", attributes:{ real:1, personallyKnown:1 } }
];

test("public additions are verified locally and inherit traits and portraits", () => {
  const result = findLocalKnowledge("Obama", people);
  assert.equal(result.verified, true);
  assert.equal(result.image, "obama.jpg");
  assert.equal(result.attributes.politician, 1);
  assert.equal(canStoreLearnedCharacter(result, false, 1), true);
});

test("unknown public names are rejected while private people remain learnable", () => {
  const unknown = findLocalKnowledge("Nicht Vorhanden", people);
  assert.equal(canStoreLearnedCharacter(unknown, false, 1), false);
  assert.equal(canStoreLearnedCharacter(unknown, true, 1), true);
});

test("a local private role does not count as a verified public person", () => {
  const result = findLocalKnowledge("Vater", people);
  assert.equal(result.matched, true);
  assert.equal(result.verified, false);
  assert.equal(canStoreLearnedCharacter(result, false, 1), false);
});

test("verification rejects a real person after a fictional answer", () => {
  const result = findLocalKnowledge("Barack Obama", people);
  assert.equal(canStoreLearnedCharacter(result, false, -1), false);
});
