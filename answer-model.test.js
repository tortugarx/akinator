import test from "node:test";
import assert from "node:assert/strict";
import { trainAnswerModel, predictAnswer, invalidateAnswerTraits } from "./answer-model.js";
import { GuessEngine } from "./engine.js";
import { questionModel } from "./question-model.js";

test("learns from negative evidence and updates candidates after a no", () => {
  const people = Array.from({ length:80 }, (_, index) => ({ attributes:{ target:index < 40 ? 1 : -1, feature:index < 40 ? 1 : -1 } }));
  const model = trainAnswerModel(people, ["target", "feature"]);
  assert.ok(predictAnswer(model, { attributes:{ feature:1 } }, "target") > .5);
  assert.ok(predictAnswer(model, { attributes:{ feature:-1 } }, "target") < .5);
  const engine = new GuessEngine([
    { id:"yes", name:"Yes", attributes:{ feature:1 } },
    { id:"no", name:"No", attributes:{ feature:-1 } }
  ], [{ id:"target" }], { answerModel:model });
  engine.answer("target", -1);
  assert.equal(engine.bestGuess().character.id, "no");
});

test("unspecified legacy negatives do not become factual no answers", () => {
  const engine = new GuessEngine([{ id:"unknown", name:"Unknown", knownAttributes:["real"], attributes:{ real:1, singer:-1 } }], [{ id:"singer" }]);
  assert.equal(engine.yesProbability(engine.characters[0], "singer"), .5);
});

test("chooses a discriminating question after a no without needing any yes", () => {
  const people = [
    { id:"a", name:"A", attributes:{ first:1, detail:-1 } },
    { id:"b", name:"B", attributes:{ first:1, detail:-1 } },
    { id:"c", name:"C", attributes:{ first:-1, detail:1 } },
    { id:"d", name:"D", attributes:{ first:-1, detail:-1 } }
  ];
  const engine = new GuessEngine(people, [{ id:"first" }, { id:"detail" }]);
  engine.asked.add("first");
  engine.answer("first", -1);
  assert.equal(engine.nextQuestion().id, "detail");
  assert.ok(engine.probabilities().filter(({ item }) => item.attributes.first < 0).reduce((sum, row) => sum + row.probability, 0) > .9);
});

test("trained answer model improves held-out prediction over trait frequency", () => {
  const model = questionModel.answerModel;
  assert.equal(model.kind, "bayesian-answer-classifier");
  assert.ok(model.validation.heldOutPeople > 3000);
  assert.ok(model.validation.logLoss < model.validation.baselineLogLoss);
});

test("does not claim certainty when remaining profiles cannot be distinguished", () => {
  const people = ["One", "Two", "Three"].map((name) => ({ id:name, name, attributes:{ shared:1 } }));
  const engine = new GuessEngine(people, [{ id:"shared" }]);
  engine.answer("shared", 1);
  engine.asked.add("shared");
  assert.equal(engine.nextQuestion(), null);
  assert.equal(engine.shouldGuess(), false);
  assert.ok(engine.bestGuess().confidence <= .34);
});
test('compiled sparse predictions preserve feature order and explicitly invalidate changed profiles',()=>{
  const model={classifiers:{target:{prior:.5,features:[['b',1,-1],['a',2,-2]]}},temperature:.3};
  const person={attributes:{a:1,b:-1}};
  assert.equal(predictAnswer(model,person,'target'),1/(1+Math.exp(-.3)));
  person.attributes.a=-1;invalidateAnswerTraits(person);
  assert.ok(Math.abs(predictAnswer(model,person,'target')-1/(1+Math.exp(.9)))<1e-12);
});
