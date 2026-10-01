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

test('sourced wiki facts create specific questions without inventing negative evidence', () => {
  const people=[{attributes:{},facts:[{id:'fact:P54:Q15789',kind:'team',de:'FC Bayern München',en:'FC Bayern Munich',source:'https://www.wikidata.org/wiki/Q1#P54'}]},{attributes:{},facts:[]}];
  const generated=descriptionQuestions(people);
  const question=generated.find(question=>question.id==='fact:P54:Q15789');
  assert.match(question.de,/Sportverein.*Bayern/);
  assert.equal(people[0].attributes[question.id],1);
  assert.equal(people[1].attributes[question.id],undefined);
  assert.ok(question.source);
});

test('sparse structured-fact gain is identical to full candidate evaluation', () => {
  const people=Array.from({length:10},(_,i)=>({id:String(i),name:String(i),attributes:{},facts:i<3?[{id:'fact:P136:Q1',kind:'genre',de:'Jazz',en:'jazz'}]:[]}));
  const engine=new GuessEngine(people,[]);
  descriptionQuestions(engine.characters);
  const distribution=engine.probabilities();
  assert.ok(Math.abs(engine.questionGain('fact:P136:Q1',distribution)-engine.questionGain('fact:P136:Q1',distribution,engine.factMasses(distribution)))<1e-12);
});

test('wiki office facts cannot repeat an already answered chancellor question', () => {
  const engine=new GuessEngine([{id:'a',name:'A',attributes:{real:1},facts:[{id:'fact:P39:Q4970706',kind:'office',de:'Bundeskanzler',en:'chancellor of Germany'}]}],questions);
  engine.refreshGeneratedQuestions();
  engine.answer('chancellor',1);
  assert.equal(engine.isRelevant({id:'fact:P39:Q4970706'}),false);
  const reverse=new GuessEngine(structuredClone(engine.characters),questions);
  reverse.refreshGeneratedQuestions(); reverse.answer('fact:P39:Q4970706',1);
  assert.equal(reverse.isRelevant({id:'chancellor'}),false);
});

test('ambiguous wiki labels are excluded rather than repeated or falsely disambiguated', () => {
  const generated=descriptionQuestions([{attributes:{},facts:[{id:'fact:P102:Q1',kind:'party',de:'Partei',en:'Party'},{id:'fact:P102:Q2',kind:'party',de:'Partei',en:'Party'}]}]);
  assert.equal(generated.length,0);
});

test('confirmed pop genre suppresses its duplicate generic wiki genre but keeps subgenres',()=>{
  const engine=new GuessEngine([{id:'a',name:'A',attributes:{real:1},facts:[{id:'fact:P136:Q37073',kind:'genre',de:'Popmusik',en:'pop music'},{id:'fact:P136:Q211756',kind:'genre',de:'Dance-Pop',en:'dance-pop'}]}],questions);
  engine.refreshGeneratedQuestions();engine.answer('popMusician',1);
  assert.equal(engine.isRelevant({id:'fact:P136:Q37073'}),false);
  assert.equal(engine.isRelevant({id:'fact:P136:Q211756'}),true);
});

test('parliamentary membership answers imply the broad role without asking it twice',()=>{
  const engine=new GuessEngine([{id:'a',name:'A',attributes:{real:1},facts:[{id:'fact:P39:Q1939555',kind:'office',de:'Mitglied des Deutschen Bundestages',en:'member of the German Bundestag'}]}],questions);
  engine.refreshGeneratedQuestions();engine.answer('fact:P39:Q1939555',1);
  assert.equal(engine.answeredYes('legislator'),true);
  assert.ok(engine.asked.has('legislator'));
});

test('fictional instrument players retain their specific sourced questions',()=>{
  const engine=new GuessEngine([{id:'a',name:'A',attributes:{real:-1},facts:[{id:'fact:P1303:Q1',kind:'instrument',de:'Saxofon',en:'saxophone'}]}],questions);
  engine.refreshGeneratedQuestions();engine.answer('real',-1);
  assert.equal(engine.isRelevant({id:'fact:P1303:Q1'}),true);
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
