import test from 'node:test';
import assert from 'node:assert/strict';
import { characters, questions } from './data.js';
import { GuessEngine } from './engine.js';
import { descriptionQuestions, generateGroupedQuestions } from './generated-questions.js';

test('a confirmed chancellor focuses on chancellors rather than touring professions', () => {
  const engine = new GuessEngine(structuredClone(characters), questions);
  engine.answer('chancellor', 1);
  const mass = engine.probabilities().filter(({item}) => item.attributes.chancellor === 1).reduce((sum,{probability}) => sum + probability,0);
  assert.ok(mass > .98, `chancellor posterior ${mass}`);
  assert.ok(engine.focusedTopics().some(([root]) => root === 'politician'));
  assert.equal(engine.isRelevant({id:'politician'}), false);
  const unrelated = new Set(['musician','actor','athlete','creator','writer','journalist','adultCreator']);
  for (let i=0;i<5;i++) {
    const question = engine.nextQuestion();
    if (!question) break;
    assert.ok(!unrelated.has(question.id), question.id);
    engine.answer(question.id, 0);
  }
});

test('description evidence is generated from records and missing facts remain unknown', () => {
  const people = [{attributes:{},description:'SPD politician'}, {attributes:{},description:'SPD chancellor'}, {attributes:{},description:'actor'}];
  const generated = descriptionQuestions(people);
  assert.ok(generated.some(({id}) => id === 'evidence:SPD'));
  assert.equal(people[2].attributes['evidence:SPD'], 0);
  assert.ok(!generated.some(({id}) => id === 'evidence:Twitch'));
});

test('dynamic combined questions split candidates and a no denies every member', () => {
  const people = ['musician','actor','athlete','politician'].map((id,i) => ({id:String(i),name:`Person ${i}`,attributes:{[id]:1, real:1}}));
  const candidates = people.map((item) => ({item,probability:.25}));
  const generated = generateGroupedQuestions(candidates,()=>true,new Set());
  assert.ok(generated.length);
  const question = generated[0];
  const engine = new GuessEngine(people, questions);
  engine.answer(question.id, -1);
  for (const id of question.featureIds) assert.equal(engine.answeredNo(id),true);
  const positive = new GuessEngine(people,questions);
  positive.answer(question.id,1);
  for (const id of question.featureIds) assert.equal(positive.answeredYes(id),false);
});

test('cooperative and synchronous selection return the same question', async () => {
  const a = new GuessEngine(structuredClone(characters),questions);
  const b = new GuessEngine(structuredClone(characters),questions);
  assert.equal((await a.nextQuestionAsync())?.id,b.nextQuestion()?.id);
});
