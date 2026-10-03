import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {characters,questions} from './data.js';
import {GuessEngine} from './engine.js';
import {isImplicitNegative} from './answer-model.js';
import {contextualQuestionText} from './question-format.js';
import {youthDatabase} from './release-policy.js';

test('all 1,155 original gaps are resolved by askable traits, with only the verified non-person quarantined',async()=>{
 const baseline=JSON.parse(await readFile('reports/profile-gaps-baseline.json','utf8'));
 const db=JSON.parse(await readFile('wikidata-people.json','utf8'));
 const engine=new GuessEngine(structuredClone(characters),questions);
 engine.addDatabase(db);engine.refreshGeneratedQuestions();
 const askable=new Set([...engine.questions,...engine.generatedQuestions].map(q=>q.id));
 const signatures=new Map();
 for(const p of engine.characters){
  const signature=JSON.stringify(Object.entries(p.attributes).filter(([id,v])=>v&&askable.has(id)&&!isImplicitNegative(p,id)).sort(([a],[b])=>a.localeCompare(b)));
  assert.ok(!signatures.has(signature),`${p.name} still matches ${signatures.get(signature)}`);
  signatures.set(signature,p.name);
 }
 const original=baseline.unresolved.flat();assert.equal(original.length,1155);
 for(const p of original){
  if(p.id==='wiki-q121072373'){assert.ok(!engine.charactersById.has(p.id));continue;}
  const retained=engine.charactersById.get(p.id);assert.ok(retained,`${p.name} was dropped`);
  assert.ok(retained.facts.some(f=>askable.has(f.id)&&f.source?.startsWith('https://')),`${p.name} lacks usable sourced evidence`);
 }
 assert.equal(db.excludedProfiles.length,1);
 assert.equal(db.excludedProfiles[0].profile.id,'wiki-q121072373');
});

test('curated supplements merge into an existing profile without creating an unverified person',()=>{
 const engine=new GuessEngine([{id:'a',name:'A',attributes:{real:1}}],[]);
 engine.addDatabase({curatedFactSupplements:[{id:'a',factIds:['fact:P800:Q1']},{id:'unknown',factIds:['fact:P800:Q1']}],factDefinitions:{'fact:P800:Q1':{id:'fact:P800:Q1',kind:'work',de:'Werk',en:'Work',source:'https://example.org'}}});
 engine.refreshGeneratedQuestions();
 assert.equal(engine.characters.length,1);assert.equal(engine.characters[0].attributes['fact:P800:Q1'],1);
});

test('reviewed and wiki questions share reality guards and correct person/character wording',()=>{
 const engine=new GuessEngine(structuredClone(characters),questions);engine.refreshGeneratedQuestions();
 const truck=engine.generatedQuestions.find(q=>q.id==='reviewed:truck-transformation');
 assert.ok(truck);engine.answer('real',1);assert.equal(engine.isRelevant(truck),false);
 assert.equal(engine.isRelevant({id:truck.id}),false);
 assert.match(contextualQuestionText(truck,'de','fictional'),/Figur/);
 const sibling=engine.generatedQuestions.find(q=>q.id==='reviewed:bingo-sibling');
 assert.ok(!contextualQuestionText(sibling,'de','fictional').includes('Person'));
});

test('native-language confirmation suppresses the repeated spoken-language question',()=>{
 const engine=new GuessEngine([{id:'a',name:'A',attributes:{real:1},facts:[{id:'fact:P1412:Q188',kind:'language',de:'Deutsch',en:'German'},{id:'fact:P103:Q188',kind:'nativeLanguage',de:'Deutsch',en:'German'}]}],questions);
 engine.refreshGeneratedQuestions();engine.answer('fact:P103:Q188',1);
 assert.equal(engine.isRelevant({id:'fact:P1412:Q188'}),false);
});

test('a sourced occupation yes establishes the topic instead of silently disabling its broad question',()=>{
 const engine=new GuessEngine([{id:'a',name:'A',attributes:{real:1,politician:1},facts:[{id:'fact:P106:Q82955',kind:'occupation',de:'Politiker',en:'politician'}]}],questions);
 engine.refreshGeneratedQuestions();engine.answer('fact:P106:Q82955',1);
 assert.equal(engine.answeredYes('politician'),true);
 assert.equal(engine.isRelevant({id:'politician'}),false);
 const office=new GuessEngine([{id:'b',name:'B',attributes:{real:1,chancellor:1},facts:[{id:'fact:P39:Q4970706',kind:'office',de:'Bundeskanzler',en:'chancellor of Germany'}]}],questions);
 office.refreshGeneratedQuestions();office.answer('fact:P39:Q4970706',1);
 assert.equal(office.answeredYes('chancellor'),true);
 assert.equal(office.isRelevant({id:'usPresident'}),false);
});

test('a secondary singing occupation does not assert mainly-singer identity',()=>{
 const engine=new GuessEngine([{id:'a',name:'A',attributes:{real:1,actor:1},facts:[{id:'fact:P106:Q177220',kind:'occupation',de:'Sänger',en:'singer'}]}],questions);
 engine.refreshGeneratedQuestions();engine.answer('fact:P106:Q177220',1);
 assert.equal(engine.answeredYes('singer'),false);
 assert.equal(engine.isRelevant({id:'singer'}),true);
});

test('youth data retains safe supplement definitions while excluding unsafe facts',()=>{
 const input={characters:[],curatedFactSupplements:[{id:'a',factIds:['good','bad']}],factDefinitions:{good:{de:'Serie',en:'series'},bad:{de:'erotisch',en:'erotic'}}};
 const youth=youthDatabase(input);
 assert.deepEqual(youth.curatedFactSupplements[0].factIds,['good']);assert.ok(youth.factDefinitions.good);assert.ok(!youth.factDefinitions.bad);
});
