import test from 'node:test';
import assert from 'node:assert/strict';
import {answerability,rankedQuestionValue,rankingFeatures} from './question-ranking.js';
import {rankingModel} from './ranking-model.js';
import {enrichCharacterAttributes} from './attribute-enrichment.js';
import {GuessEngine} from './engine.js';
import {addReviewedDetails} from './profile-details.js';
import {safeQuestion} from './release-policy.js';
test('ranker is genuinely fitted and validated on held-out feature IDs',()=>{
  assert.ok(rankingModel.training>5000);assert.ok(rankingModel.holdout>1000);
  assert.ok(rankingModel.validation.brier<rankingModel.validation.constantBrier);
  assert.match(rankingModel.source,/synthetic/);
  assert.equal(rankingFeatures({id:'female',en:'Is your person female?'}).length,rankingModel.weights.length);
});
test('known works outrank obscure education at equal information gain',()=>{
  const work={id:'fact:P800:Q1',en:'Is your person known for this work?'};
  const school={id:'fact:P69:Q1',en:'Did your person study here?'};
  assert.ok(rankedQuestionValue(work,.2,1,10,rankingModel)>rankedQuestionValue(school,.2,1,10,rankingModel));
  assert.equal(rankedQuestionValue(work,0,1,10,rankingModel),0);
  assert.equal(answerability(work,10,null),1);
});
test('former office does not establish retirement from all work',()=>{
  const person=enrichCharacterAttributes({name:'Example',description:'The former German chancellor',attributes:{real:1,alive:1}});
  assert.notEqual(person.attributes.retired,1);
  const athlete=enrichCharacterAttributes({name:'Example',description:'A retired tennis champion',attributes:{real:1,alive:1}});
  assert.equal(athlete.attributes.retired,1);
});
test('reviewed details carry sources and never fabricate negative evidence',()=>{
  const person=addReviewedDetails({name:'Papaplatte',attributes:{real:1}});
  assert.ok(person.facts.some(fact=>fact.id==='reviewed:edeltalk'&&fact.source.startsWith('https://www.funk.net/')));
  assert.equal(person.attributes['reviewed:minecraft-series'],undefined);
});
test('youth question safety persists when dynamic questions refresh',()=>{
  const engine=new GuessEngine([{id:'a',name:'A',attributes:{real:1},facts:[{id:'fact:P136:Q1',kind:'genre',de:'erotisch',en:'erotic',source:'https://example.com'}]}],[],{questionFilter:safeQuestion});
  assert.equal(engine.nextQuestion(),null);
});
