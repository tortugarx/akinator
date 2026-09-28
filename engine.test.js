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

test("Wikidata enriches an existing curated character instead of duplicating it", () => {
  const engine = new GuessEngine([{ id:"known", name:"Known Person", icon:"👤", attributes:{ real:1, singer:-1 } }], questions);
  engine.addCharacter({ id:"wiki-q1", name:"Known Person", image:"portrait.jpg", source:"wikidata", popularity:100, attributes:{ real:1, singer:1 } });
  assert.equal(engine.characters.length, 1);
  assert.equal(engine.characters[0].image, "portrait.jpg");
  assert.equal(engine.characters[0].attributes.singer, 1);
});

test("does not guess early while candidates are still tied", () => {
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

test("can guess immediately when the evidence is already decisive", () => {
  const tinyQuestions = [{ id:"only", en:"", de:"" }];
  const tinyCharacters = [
    { id:"yes", name:"Yes", attributes:{ only:1 } },
    { id:"no", name:"No", attributes:{ only:-1 } }
  ];
  const engine = new GuessEngine(tinyCharacters, tinyQuestions);
  const question = engine.nextQuestion();
  engine.answer(question.id, 1);
  assert.equal(engine.shouldGuess(), true);
  assert.equal(engine.bestGuess().character.name, "Yes");
});

test("truthful play can identify every bundled character", () => {
  for (const target of characters) {
    const engine = new GuessEngine(characters, questions);
    let found = false;
    for (let index = 0; index < questions.length + 10; index += 1) {
      const question = engine.nextQuestion();
      if (!question) {
        const guess = engine.bestGuess().character;
        if (guess.name === target.name) { found = true; break; }
        engine.reject(guess.id ?? guess.name);
        continue;
      }
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
  engine.answer("european", .55);
  const american = questions.find(({ id }) => id === "american");
  assert.equal(engine.isRelevant(american), false);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "canadian")), false);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "australian")), false);
});

test("a specific country suppresses contradictory region questions", () => {
  const engine = new GuessEngine(characters, questions);
  engine.answer("german", 1);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "american")), false);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "canadian")), false);
});

test("treats probable answers as decisions for inverse questions", () => {
  const engine = new GuessEngine(characters, questions);
  engine.answer("real", .55);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "fictional")), false);
});

test("only asks name-range questions after semantic narrowing", () => {
  const engine = new GuessEngine(characters, questions);
  const initialQuestion = questions.find(({ id }) => id === "initialAM");
  assert.equal(engine.isRelevant(initialQuestion), false);
  engine.answerCount = 9;
  assert.equal(engine.isRelevant(initialQuestion), true);
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

test("asks about personal acquaintance immediately after confirming a real person", () => {
  const engine = new GuessEngine(characters, questions);
  engine.asked.add("real");
  engine.answer("real", 1);
  assert.equal(engine.nextQuestion().id, "personallyKnown");
});

test("skips private questions for a public person", () => {
  const engine = new GuessEngine(characters, questions);
  engine.answer("personallyKnown", -1);
  for (const id of ["family", "parent", "sibling", "grandparent", "yourChild", "romantic", "partner", "friend", "schoolWork"]) {
    assert.equal(engine.isRelevant(questions.find((question) => question.id === id)), false, `kept ${id}`);
  }
});
