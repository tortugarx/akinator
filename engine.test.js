import test from "node:test";
import assert from "node:assert/strict";
import { characters, questions } from "./data.js";
import { GuessEngine } from "./engine.js";

test("asks each question at most once", () => {
  const engine = new GuessEngine(characters, questions);
  const seen = new Set();
  for (let index = 0; index < questions.length; index += 1) {
    const question = engine.nextQuestion();
    assert.ok(question);
    assert.equal(seen.has(question.id), false);
    seen.add(question.id);
    engine.answer(question.id, 0);
  }
  assert.equal(engine.nextQuestion(), null);
});

test("identifies a character from truthful answers", () => {
  const engine = new GuessEngine(characters, questions);
  const target = characters.find((character) => character.name === "Spider-Man");
  for (let index = 0; index < 14 && !engine.shouldGuess(); index += 1) {
    const question = engine.nextQuestion();
    engine.answer(question.id, target.attributes[question.id] ?? -1);
  }
  assert.equal(engine.bestGuess().character.name, "Spider-Man");
});

test("rejected guesses are removed from consideration", () => {
  const engine = new GuessEngine(characters, questions);
  const first = engine.bestGuess().character.name;
  engine.reject(first);
  assert.notEqual(engine.bestGuess().character.name, first);
});
