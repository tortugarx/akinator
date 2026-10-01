import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalQuestionAI,parseQuestionProposals,questionPrompt} from './llm-questions.js';
import {GuessEngine} from './engine.js';

const context = {features:[{id:'female',meaning:'Ist diese Person weiblich?',gain:.4},{id:'german',meaning:'Ist diese Person deutsch?',gain:.3}]};

test('accepts grounded novel wording and rejects invented fields, dates and mismatched logic',()=>{
  assert.equal(parseQuestionProposals(JSON.stringify({text:'Ist die gesuchte Person weiblich?',operator:'any',ids:['female']}),context).length,1);
  for (const proposal of [
    {text:'Ist diese Person weiblich?',operator:'any',ids:['invented']},
    {text:'Ist diese Person 1980 geboren?',operator:'any',ids:['female']},
    {text:'Ist diese Person nicht weiblich?',operator:'any',ids:['female']},
    {text:'Ist diese Person deutsch und lebendig?',operator:'any',ids:['german']},
    {text:'Ist diese Person deutsch oder weiblich?',operator:'all',ids:['german','female']},
    {text:'Ist diese Person ein Schauspieler?',operator:'any',ids:['female']}
  ]) assert.deepEqual(parseQuestionProposals(JSON.stringify(proposal),context),[]);
});

test('generated conjunctions and disjunctions have distinct, correct answer semantics',()=>{
  const people = [
    {id:'a',name:'A',attributes:{real:1,german:1,female:1}},
    {id:'b',name:'B',attributes:{real:1,german:-1,female:1}},
    {id:'c',name:'C',attributes:{real:1,german:-1,female:-1}}
  ];
  const engine = new GuessEngine(people,[]);
  assert.equal(engine.yesProbability(people[1],'all:female|german'),.06);
  assert.equal(engine.yesProbability(people[1],'group:female|german'),.94);
  engine.answer('all:female|german',1);
  assert.equal(engine.answeredYes('german'),true);
  assert.equal(engine.answeredYes('female'),true);
  const negative = new GuessEngine(people,[]);
  negative.answer('all:female|german',-1);
  assert.equal(negative.answeredNo('female'),false);
  assert.equal(negative.answeredNo('german'),false);
});

test('worker client loads a real-generation route without silently using a catalogue',async()=>{
  const messages = [];
  const worker = {postMessage(message){
    messages.push(message);
    queueMicrotask(()=>worker.onmessage({data:{id:message.id,result:message.type === 'load' ? true : JSON.stringify({text:'Ist die gesuchte Person weiblich?',operator:'any',ids:['female']})}}));
  },terminate(){}};
  const client = new LocalQuestionAI({workerFactory:()=>worker});
  await client.load();
  assert.equal(client.ready,true);
  const questions = await client.propose(context,'de');
  assert.equal(questions[0].llm,true);
  assert.deepEqual(messages.map(({type})=>type),['load','generate']);
  assert.ok(messages[1].messages.some(({role})=>role === 'user'));
  client.cancel();
});

test('cancelling generation terminates the worker and rejects pending work',async()=>{
  let terminated = false;
  const client = new LocalQuestionAI({workerFactory:()=>({postMessage(){},terminate(){terminated=true;}})});
  const request = client.load();
  client.cancel();
  await assert.rejects(request,/abgebrochen/);
  assert.equal(terminated,true);
  assert.equal(client.ready,false);
});

test('unknown answer does not invent a condition and semantic ids prevent paraphrase duplicates',()=>{
  const people = [{id:'a',name:'A',attributes:{female:1}},{id:'b',name:'B',attributes:{female:-1}}];
  const engine = new GuessEngine(people,[{id:'female',de:'Ist diese Person weiblich?',en:'Is this person female?'}]);
  const proposals = parseQuestionProposals(JSON.stringify({text:'Ist die gesuchte Person weiblich?',operator:'any',ids:['female']}),context);
  const question = engine.chooseAIQuestion(proposals);
  assert.equal(question.id,'female');
  engine.answer(question.id,0);
  assert.equal(engine.chooseAIQuestion(proposals),null);
});

test('prompt contains only supplied facts and does not include candidate names',()=>{
  const prompt = questionPrompt(context,'de');
  assert.ok(prompt.at(-1).content.includes('weiblich'));
  assert.ok(!prompt.at(-1).content.includes('Angela Merkel'));
});

test('infers conditions from free model text including acronyms and rejects extra claims',()=>{
  assert.equal(parseQuestionProposals('Ist die gesuchte Person weiblich?',context)[0]?.id,'female');
  assert.equal(parseQuestionProposals('Ja, ist diese Person weiblich?',context)[0]?.text,'Ist diese Person weiblich?');
  assert.equal(parseQuestionProposals('Ist diese Person deutsch und weiblich?',context)[0]?.id,'all:female|german');
  assert.deepEqual(parseQuestionProposals('Ist diese deutsche Person Schauspielerin?',context),[]);
  const countries = {features:[{id:'american',meaning:'Kommt diese Person aus den USA?',gain:.4}]};
  assert.equal(parseQuestionProposals('Kommt diese Person aus den USA?',countries)[0]?.id,'american');
});
