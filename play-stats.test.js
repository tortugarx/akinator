import test from "node:test";
import assert from "node:assert/strict";
import { playCount, recordConfirmedPlay } from "./play-stats.js";

test("counts confirmed characters locally without counting wrong guesses", () => {
  let value = "";
  const storage = { getItem:() => value, setItem:(_key, next) => { value = next; } };
  assert.equal(playCount("wiki-q1", storage), 0);
  assert.equal(recordConfirmedPlay("wiki-q1", storage), 1);
  assert.equal(recordConfirmedPlay("wiki-q1", storage), 2);
  assert.equal(playCount("wiki-q1", storage), 2);
  assert.equal(playCount("wiki-q2", storage), 0);
});
