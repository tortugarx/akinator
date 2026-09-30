import test from "node:test";
import assert from "node:assert/strict";
import { characters, questions } from "./data.js";
import { GuessEngine } from "./engine.js";
import { questionModel } from "./question-model.js";

test("asks each question at most once", () => {
  const engine = new GuessEngine(characters, questions);
  const seen = new Set();
  for (let index = 0; index < questions.length; index += 1) {
    const question = engine.nextQuestion();
    if (!question) break;
    assert.equal(seen.has(question.id), false);
    seen.add(question.id);
    engine.answer(question.id, 0);
  }
  assert.ok(seen.size > 10);
  assert.equal(engine.nextQuestion(), null);
});

test("catalogue contains no duplicate ids or question texts", () => {
  for (const field of ["id", "de", "en"]) {
    const values = questions.map((question) => question[field].trim().toLocaleLowerCase());
    assert.equal(new Set(values).size, values.length, `duplicate ${field}`);
  }
});

test("does not repeat equivalent movie and television questions", () => {
  const engine = new GuessEngine(characters, questions, questionModel);
  engine.answer("real", 1);
  engine.answer("actor", 1);
  engine.answer("filmActor", 1);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "movie")), false);
  engine.answer("seriesActor", -1);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "tv")), false);
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

test("requires new evidence instead of rattling through guesses after a rejection", () => {
  const localQuestions = ["one", "two", "three", "four"].map((id) => ({ id, en:id, de:id }));
  const localCharacters = [
    { id:"a", name:"A", attributes:{ one:1, two:1, three:1, four:1 } },
    { id:"b", name:"B", attributes:{ one:-1, two:-1, three:-1, four:-1 } }
  ];
  const engine = new GuessEngine(localCharacters, localQuestions);
  engine.answer("one", 1);
  assert.equal(engine.shouldGuess(), true);
  engine.reject("a");
  assert.equal(engine.shouldGuess(), false);
  engine.answer("two", -1);
  engine.answer("three", -1);
  assert.equal(engine.shouldGuess(), false);
  engine.answer("four", -1);
  assert.equal(engine.shouldGuess(), true);
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
  for (const id of ["american", "british", "french", "spanish", "italian", "canadian", "brazilian", "australian", "indian", "japanese", "southKorean", "chinese", "european", "latinAmerican"]) {
    assert.equal(engine.isRelevant(questions.find((question) => question.id === id)), false, `kept contradictory geography ${id}`);
  }
});

test("treats probable answers as decisions for inverse questions", () => {
  const engine = new GuessEngine(characters, questions);
  engine.answer("real", .55);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "fictional")), false);
});

test("does not contain letter or birth-year questions", () => {
  assert.equal(questions.some(({ id }) => id.startsWith("initial")), false);
  assert.equal(questions.some(({ id }) => id.startsWith("born")), false);
});

test("focuses on political follow-ups after politics is confirmed", () => {
  const engine = new GuessEngine(characters, questions);
  engine.answer("real", 1);
  engine.answer("politician", 1);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "nationalLeader")), true);
  for (const id of ["musician", "athlete", "actor", "blonde", "masked"]) {
    assert.ok(engine.questionFocusWeight("nationalLeader") > engine.questionFocusWeight(id), `did not deprioritize ${id}`);
  }
});

test("chooses the question with the highest expected information gain", () => {
  const localQuestions = [{ id:"unknown" }, { id:"split" }];
  const localCharacters = [
    { id:"a", name:"A", attributes:{ unknown:0, split:1 } },
    { id:"b", name:"B", attributes:{ unknown:0, split:-1 } }
  ];
  const engine = new GuessEngine(localCharacters, localQuestions);
  assert.equal(engine.nextQuestion().id, "split");
});

test("ships a substantially larger useful question catalogue", () => {
  assert.ok(questions.length >= 280);
  for (const id of ["entertainment", "journalist", "popMusician", "martialArts", "youtuber", "chancellor", "computerScientist", "novelist", "techEntrepreneur", "army", "gameOfThrones", "retired", "songwriter", "rnbSoulSinger", "twitchStreamer", "minecraftStreamer", "politicalStreamer"]) {
    assert.ok(questions.some((question) => question.id === id), `missing ${id}`);
  }
});

test("ships actor-specific franchise discriminators", () => {
  for (const id of ["marvelActor", "dcActor", "starWarsActor", "harryPotterActor", "sitcomActor", "superheroActor"]) {
    assert.ok(questions.some((question) => question.id === id), `missing ${id}`);
  }
});

test("focuses on singer details once the singer branch is confirmed", () => {
  const engine = new GuessEngine(characters, questions, questionModel);
  engine.answer("real", 1);
  engine.answer("musician", 1);
  engine.answer("singer", 1);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "songwriter")), true);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "rnbSoulSinger")), true);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "composer")), true);
  assert.ok(engine.questionFocusWeight("songwriter") > engine.questionFocusWeight("composer"));
});

test("focuses on streamer details once the streamer branch is confirmed", () => {
  const engine = new GuessEngine(characters, questions, questionModel);
  engine.answer("real", 1);
  engine.answer("creator", 1);
  engine.answer("streamer", 1);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "twitchStreamer")), true);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "gamingStreamer")), true);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "tiktoker")), true);
  assert.ok(engine.questionFocusWeight("gamingStreamer") > engine.questionFocusWeight("tiktoker"));
});

test("keeps overlapping adult-film paths open after acting is confirmed", () => {
  const engine = new GuessEngine(characters, questions, questionModel);
  engine.answer("real", 1);
  engine.answer("actor", 1);
  engine.answer("creator", -1);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "adultCreator")), true);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "adultFilmPerformer")), true);
});

test("removes the random century question", () => {
  assert.equal(questions.some(({ id }) => id === "historical"), false);
});

test("recognizes plain streamer descriptions and removes actor-only singer noise", () => {
  const streamer = new GuessEngine([{ id:"s", name:"Streamer", description:"spanischer Streamer und Moderator", attributes:{ real:1, creator:1 } }], questions);
  assert.equal(streamer.characters[0].attributes.streamer, 1);
  const actor = new GuessEngine([{ id:"a", name:"Actor", description:"US-amerikanische Schauspielerin", attributes:{ real:1, actor:1, singer:1, musician:1 } }], questions);
  assert.equal(actor.characters[0].attributes.singer, 0);
  assert.equal(actor.characters[0].attributes.musician, 0);
});

test("removes secondary occupations from unrelated primary categories", () => {
  const racer = new GuessEngine([{ id:"r", name:"Racer", description:"deutscher Automobilrennfahrer", attributes:{ real:1, athlete:1, motorsport:1, creator:1, actor:1 } }], questions);
  assert.equal(racer.characters[0].attributes.creator, 0);
  assert.equal(racer.characters[0].attributes.actor, 0);
});

test("gates countries behind their region and subregion", () => {
  const engine = new GuessEngine(characters, questions, questionModel);
  const german = questions.find(({ id }) => id === "german");
  assert.equal(engine.isRelevant(german), false);
  engine.answer("european", 1);
  assert.equal(engine.isRelevant(german), false);
  engine.answer("germanSpeaking", 1);
  assert.equal(engine.isRelevant(german), true);
});

test("never asks a contradictory country after Germany is confirmed", () => {
  const engine = new GuessEngine(characters, questions, questionModel);
  engine.answer("german", 1);
  for (const id of ["american", "british", "french", "austrian", "swiss", "japanese", "mexican", "nigerian"]) {
    assert.equal(engine.isRelevant(questions.find((question) => question.id === id)), false, `kept ${id}`);
  }
});

test("trained implications suppress questions whose answer is already known", () => {
  const engine = new GuessEngine(characters, questions, questionModel);
  engine.answer("racingDriver", 1);
  assert.equal(engine.isRelevant(questions.find(({ id }) => id === "motorsport")), false);
  const inverse = new GuessEngine(characters, questions, questionModel);
  inverse.answer("motorsport", -1);
  assert.equal(inverse.isRelevant(questions.find(({ id }) => id === "racingDriver")), false);
});

test("only asks retirement status for a living person", () => {
  const retired = questions.find(({ id }) => id === "retired");
  const engine = new GuessEngine(characters, questions, questionModel);
  assert.equal(engine.isRelevant(retired), false);
  engine.answer("alive", 1);
  assert.equal(engine.isRelevant(retired), true);
});

test("prefers a known near-half split over a weaker unbalanced question", () => {
  const localQuestions = [{ id:"rare" }, { id:"balanced" }];
  const localCharacters = Array.from({ length:10 }, (_, index) => ({
    id:String(index), name:String(index), attributes:{ rare:index === 0 ? 1 : -1, balanced:index < 5 ? 1 : -1 }
  }));
  const engine = new GuessEngine(localCharacters, localQuestions);
  assert.equal(engine.nextQuestion().id, "balanced");
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
