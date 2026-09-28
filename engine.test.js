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

test("never interrupts the question flow after only six answers", () => {
  const engine = new GuessEngine(characters, questions);
  const target = characters.find((character) => character.name === "Cristiano Ronaldo");
  for (let index = 0; index < 6; index += 1) {
    const question = engine.nextQuestion();
    engine.answer(question.id, target.attributes[question.id] ?? 0);
  }
  assert.equal(engine.answerCount, 6);
  assert.equal(engine.shouldGuess(), false);
  assert.ok(engine.nextQuestion());
});

test("truthful play can identify every bundled character", () => {
  for (const target of characters) {
    const engine = new GuessEngine(characters, questions);
    let found = false;
    for (let index = 0; index < 22; index += 1) {
      const question = engine.nextQuestion();
      assert.ok(question, `ran out of questions for ${target.name}`);
      engine.answer(question.id, target.attributes[question.id] ?? 0);
      if (!engine.shouldGuess()) continue;
      const guess = engine.bestGuess().character;
      if (guess.name === target.name) { found = true; break; }
      engine.reject(guess.id ?? guess.name);
    }
    assert.equal(found, true, `did not identify ${target.name}`);
  }
});

test("does not ask fictional follow-ups after a person is confirmed real", () => {
  const engine = new GuessEngine(characters, questions);
  engine.asked.add("real");
  engine.answer("real", 1);
  const forbidden = new Set(["fictional", "book", "magic", "superhero", "animated", "anime", "game", "villain", "powers", "nonhuman", "animal", "robot"]);
  for (let index = 0; index < questions.length; index += 1) {
    const question = engine.nextQuestion();
    if (!question) break;
    assert.equal(forbidden.has(question.id), false, `asked irrelevant question ${question.id}`);
    engine.answer(question.id, 0);
  }
});

test("does not ask a second region after a clear regional answer", () => {
  const engine = new GuessEngine(characters, questions);
  engine.answer("european", 1);
  const american = questions.find(({ id }) => id === "american");
  assert.equal(engine.isRelevant(american), false);
});

test("skips dependent questions after a clear no", () => {
  const engine = new GuessEngine(characters, questions);
  engine.answer("athlete", -1);
  engine.answer("musician", -1);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "football")), false);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "musicGroup")), false);
});

test("switches to private relationship questions for a personally known person", () => {
  const engine = new GuessEngine(characters, questions);
  engine.answer("real", 1);
  engine.answer("personallyKnown", 1);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "parent")), true);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "romantic")), true);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "politician")), false);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "european")), false);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "movie")), false);
});

test("skips private questions for a public person", () => {
  const engine = new GuessEngine(characters, questions);
  engine.answer("personallyKnown", -1);
  for (const id of ["family", "parent", "sibling", "grandparent", "yourChild", "romantic", "partner", "friend", "schoolWork"]) {
    assert.equal(engine.isRelevant(questions.find((question) => question.id === id)), false, `kept ${id}`);
  }
});
