import test from "node:test";
import assert from "node:assert/strict";
import { playCount, recordConfirmedPlay, recentPlays } from "./play-stats.js";

test("counts confirmed characters locally without counting wrong guesses", () => {
  const values = new Map();
  const storage = { getItem:(key) => values.get(key), setItem:(key, next) => { values.set(key, next); } };
  assert.equal(playCount("wiki-q1", storage), 0);
  assert.equal(recordConfirmedPlay("wiki-q1", storage), 1);
  assert.equal(recordConfirmedPlay("wiki-q1", storage), 2);
  assert.equal(playCount("wiki-q1", storage), 2);
  assert.equal(playCount("wiki-q2", storage), 0);
  recordConfirmedPlay('wiki-q2', storage);
  recordConfirmedPlay('wiki-q1', storage);
  assert.deepEqual(recentPlays(storage), ['wiki-q1','wiki-q2']);
});
