import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { characters, questions } from "./data.js";
import { GuessEngine } from "./engine.js";
import { questionModel } from "./question-model.js";

test("asks each question at most once", () => {
  const engine = new GuessEngine(characters, questions);
  const seen = new Set();
  for (let index = 0; index < 1000; index += 1) {
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

test("continues with private-role questions after personally-known yes", () => {
  const strangers = Array.from({ length:2000 }, (_, index) => ({ id:`stranger-${index}`, name:`Stranger ${index}`, attributes:{ real:1, personallyKnown:-1, family:0, female:0 } }));
  const family = characters.filter(({ name }) => ["Deine Mutter", "Dein Vater", "Deine Tante", "Dein Onkel"].includes(name));
  const engine = new GuessEngine([...strangers, ...family], questions, questionModel);
  engine.answer("real", 1);
  engine.answer("personallyKnown", 1);
  assert.ok(engine.probabilities().filter(({ item }) => item.attributes.personallyKnown === 1).reduce((sum, { probability }) => sum + probability, 0) > .9);
  assert.ok(["female", "family", "parent", "auntUncle"].includes(engine.nextQuestion()?.id));
});

test("confirmed adult films keep follow-up questions on relevant traits", () => {
  const unrelated = Array.from({ length:2000 }, (_, index) => ({ id:`unrelated-${index}`, name:`Unrelated ${index}`, attributes:{ real:1, personallyKnown:-1, adultCreator:-1, adultFilmPerformer:-1, politician:index % 2 ? 1 : -1, journalist:index % 3 ? 1 : -1, writer:index % 5 ? 1 : -1 } }));
  const adults = characters.filter(({ name }) => ["Bonnie Blue", "Abella Danger", "Angela White", "Eva Elfie"].includes(name));
  const engine = new GuessEngine([...unrelated, ...adults], questions, questionModel);
  engine.answer("real", 1);
  engine.answer("personallyKnown", -1);
  engine.answer("adultFilmPerformer", 1);
  assert.ok(engine.probabilities().filter(({ item }) => item.attributes.adultCreator === 1).reduce((sum, { probability }) => sum + probability, 0) > .9);
  for (let index = 0; index < 4; index += 1) {
    if (engine.shouldGuess()) break;
    const question = engine.nextQuestion();
    assert.ok(question);
    assert.equal(["politician", "journalist", "writer"].includes(question.id), false);
    engine.answer(question.id, adults[0].attributes[question.id] ?? 0);
  }
  assert.equal(engine.bestGuess().character.name, 'Bonnie Blue');
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
  // The only remaining candidate still contradicts the earlier confident yes.
  assert.equal(engine.shouldGuess(), false);
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

test('popularity cannot manufacture certainty between identical observable profiles', () => {
  const engine=new GuessEngine([{id:'a',name:'A',attributes:{real:1,female:-1}},{id:'b',name:'B',attributes:{real:1,female:-1}}],[{id:'real'},{id:'female'}]);
  engine.scores.set('a',20);
  engine.scores.set('b',0);
  assert.ok(engine.bestGuess().probability>.9);
  assert.equal(engine.shouldGuess(),false);
});

test('sparse living-status evidence cannot become a rare branch anchor',()=>{
  const people=Array.from({length:100},(_,i)=>({id:String(i),name:String(i),attributes:{real:1,alive:i===0?1:0,female:i===0?1:-1}}));
  const engine=new GuessEngine(people,[{id:'alive'},{id:'female'}]);
  engine.answer('female',-1);engine.answer('alive',1);engine.probabilities();
  assert.ok(!engine.activeAnchors.includes('alive'));
  assert.notEqual(engine.bestGuess().character.id,'0');
});

test('packed wiki facts share their dictionary while profile attributes remain isolated',()=>{
  const database={factDefinitions:{'fact:P54:Q1':{id:'fact:P54:Q1',kind:'team',de:'Verein',en:'Club'}},characters:[{id:'a',name:'A',attributes:{real:1},factIds:['fact:P54:Q1']}]};
  const engine=new GuessEngine([],questions);
  engine.addDatabase(database);engine.refreshGeneratedQuestions();
  assert.equal(engine.characters[0].facts[0],database.factDefinitions['fact:P54:Q1']);
  assert.equal(engine.characters[0].attributes['fact:P54:Q1'],1);
  assert.equal(database.characters[0].attributes['fact:P54:Q1'],undefined);
});

test('wiki language aliases merge the same person but not distinct Wikidata identities',()=>{
  const engine=new GuessEngine([{id:'mrbeast',name:'MrBeast',attributes:{real:1}}],questions);
  engine.addCharacter({id:'wiki-q57618112',name:'Jimmy Donaldson',aliases:['MrBeast'],source:'https://www.wikidata.org/wiki/Q57618112',attributes:{real:1},image:'portrait.jpg'});
  assert.equal(engine.characters.length,1);
  assert.equal(engine.characters[0].image,'portrait.jpg');
  engine.addCharacter({id:'wiki-q2',name:'Jimmy Donaldson',source:'https://www.wikidata.org/wiki/Q2',attributes:{real:1}});
  assert.equal(engine.characters.length,2);
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

test('does not infer real-person language from a mostly human database',()=>{
  const engine = new GuessEngine([{id:'human',name:'Human',attributes:{real:1,female:1}}],questions);
  assert.equal(engine.subjectKind(),'unknown');
  engine.answer('real',-1);
  assert.equal(engine.subjectKind(),'fictional');
});

test('opening prefers easy cross-domain discriminators over an industry tour',()=>{
  const local = [
    {id:'a',name:'A',attributes:{female:1,actor:1}},
    {id:'b',name:'B',attributes:{female:-1,actor:-1}}
  ];
  const engine = new GuessEngine(local,[{id:'actor',de:'Schauspiel?',en:'Acting?'},{id:'female',de:'Weiblich?',en:'Female?'}]);
  assert.equal(engine.nextQuestion().id,'female');
});

test("full database identifies public and private regression cases without cycling guesses", async () => {
  const database = JSON.parse(await readFile(new URL("./wikidata-people.json", import.meta.url), "utf8"));
  for (const name of ["Bonnie Blue", "Deine Tante"]) {
    const engine = new GuessEngine(characters.map((person) => ({ ...person, attributes:{ ...person.attributes } })), questions, questionModel);
    engine.addDatabase(database);
    const target = engine.characters.find((person) => person.name === name);
    for (let index = 0; index < 40; index += 1) {
      const question = engine.nextQuestion();
      if (!question) break;
      engine.answer(question.id, target.attributes[question.id] ?? 0);
      if (!engine.shouldGuess()) continue;
      break;
    }
    assert.equal(engine.bestGuess().character.name, name, `did not identify ${name}`);
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

test("does not treat secondary occupation credits as known primary identities or factual no answers", () => {
  const racer = new GuessEngine([{ id:"r", name:"Racer", description:"deutscher Automobilrennfahrer", attributes:{ real:1, athlete:1, motorsport:1, creator:1, actor:1 } }], questions);
  assert.equal(racer.characters[0].attributes.creator, 0);
  assert.equal(racer.characters[0].attributes.actor, 0);
});

test("allows useful country questions before a region yes but excludes denied regions", () => {
  const engine = new GuessEngine(characters, questions, questionModel);
  const german = questions.find(({ id }) => id === "german");
  assert.equal(engine.isRelevant(german), true);
  engine.answer("european", 1);
  assert.equal(engine.isRelevant(german), true);
  engine.answer("germanSpeaking", 1);
  assert.equal(engine.isRelevant(german), true);
  engine.reset();
  engine.answer("european", -1);
  assert.equal(engine.isRelevant(german), false);
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

test("allows retirement before an alive yes and excludes it after an alive no", () => {
  const retired = questions.find(({ id }) => id === "retired");
  const engine = new GuessEngine(characters, questions, questionModel);
  assert.equal(engine.isRelevant(retired), true);
  engine.answer("alive", 1);
  assert.equal(engine.isRelevant(retired), true);
  engine.reset();
  engine.answer("alive", -1);
  assert.equal(engine.isRelevant(retired), false);
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

test("does not force the personal branch when another question separates more candidates", () => {
  const profiles = Array.from({ length:20 }, (_, index) => ({ id:String(index), name:String(index), attributes:{ real:1, personallyKnown:index === 0 ? 1 : -1, split:index < 10 ? 1 : -1 } }));
  const engine = new GuessEngine(profiles, [{ id:"personallyKnown" }, { id:"split" }]);
  engine.asked.add("real");
  engine.answer("real", 1);
  assert.equal(engine.nextQuestion().id, "split");
});

test("skips private questions for a public person", () => {
  const engine = new GuessEngine(characters, questions);
  engine.answer("personallyKnown", -1);
  for (const id of ["family", "parent", "sibling", "grandparent", "yourChild", "romantic", "partner", "friend", "schoolWork"]) {
    assert.equal(engine.isRelevant(questions.find((question) => question.id === id)), false, `kept ${id}`);
  }
});
