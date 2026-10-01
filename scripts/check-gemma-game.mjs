// Real packaged worker, verified weights and CPU inference. Only transport is local.
import {chromium,webkit} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {GuessEngine} from '../engine.js';
import {characters,questions} from '../data.js';
import {questionModel} from '../question-model.js';
const database = JSON.parse(await readFile('wikidata-people.json','utf8'));
const weights = await readFile('artifacts/model-candidates/gemma-270m.gguf');
const type = process.argv.includes('--webkit') ? webkit : chromium;
const browser = await type.launch({headless:true,...(type===chromium?{args:['--no-sandbox']}:{})});
try {
  const page = await browser.newPage({serviceWorkers:'block'});
  await page.route('https://huggingface.co/**',async(route)=>{
    const range = route.request().headers().range;
    const match = range?.match(/bytes=(\d+)-(\d+)/);
    const start = match ? Number(match[1]) : 0, end = match ? Number(match[2])+1 : weights.length;
    await route.fulfill({status:match?206:200,body:weights.subarray(start,end),headers:{'access-control-allow-origin':'*','content-type':'application/octet-stream',...(match?{'content-range':`bytes ${start}-${end-1}/${weights.length}`}:{})}});
  });
  await page.goto('http://127.0.0.1:4173');
  await page.evaluate(async()=>{
    const {LocalQuestionAI} = await import('./llm-questions.js');
    window.__realAI = new LocalQuestionAI({onProgress:event=>{window.__phase=event.phase;}});
    await window.__realAI.load();
  });
  const scenarios = [[],[['real',1],['chancellor',1]],[['real',1],['adultFilmPerformer',1]],[['real',1],['singer',1]],[['real',1],['streamer',1]],[['personallyKnown',1]]];
  for (const answers of scenarios) {
    const engine = new GuessEngine(structuredClone(characters),questions,questionModel);
    for (const person of database.characters) engine.addCharacter(structuredClone(person));
    for (const [id,value] of answers) engine.answer(id,value);
    const context = await engine.aiQuestionContext('de');
    const started = Date.now();
    const proposals = await page.evaluate(context=>window.__realAI.propose(context,'de'),context);
    const question = engine.chooseAIQuestion(proposals,'de');
    console.log(JSON.stringify({browser:type.name(),answers,meaning:context.features[0]?.meaning,question,ms:Date.now()-started}));
    assert.ok(question,'Must generate a grounded new question, not silently fall back');
  }
  if (process.argv.includes('--round')) {
    const engine = new GuessEngine(structuredClone(characters),questions,questionModel);
    for (const person of database.characters) engine.addCharacter(structuredClone(person));
    const target = engine.characters.find(person=>person.name === 'Olaf Scholz');
    assert.ok(target,'Round target must exist');
    engine.answer('real',1); engine.answer('chancellor',1);
    let count = 0;
    while (!engine.shouldGuess() && count < 20) {
      const context = await engine.aiQuestionContext('de');
      const proposals = await page.evaluate(context=>window.__realAI.propose(context,'de'),context);
      const question = engine.chooseAIQuestion(proposals,'de');
      assert.ok(question,'Round must continue with an actual generated question');
      const values = question.featureIds.map(id=>target.attributes[id] || 0);
      const answer = question.operator === 'all'
        ? values.some(value=>value<0) ? -1 : values.every(value=>value>0) ? 1 : 0
        : values.some(value=>value>0) ? 1 : values.every(value=>value<0) ? -1 : 0;
      console.log('ROUND',++count,question.text,answer);
      engine.answer(question.id,answer);
    }
    console.log('ROUND SUMMARY',count,'questions, readyToGuess:',engine.shouldGuess());
    assert.ok(engine.shouldGuess(),'Round must reach a confident result');
    assert.equal(engine.bestGuess().character.id,target.id,'Round must identify the intended person');
  }
  await page.evaluate(()=>window.__realAI.cancel());
  if (process.argv.includes('--ui')) {
    await page.locator('#start-screen.active').waitFor();
    await page.locator('#start-button').click();
    await page.waitForFunction(()=>document.querySelector('#question-screen.active #answer-grid button:not(:disabled)'),null,{timeout:120000});
    assert.match(await page.locator('#question-text').textContent(),/\?$/);
    console.log('PASS: actual start button reaches a playable AI question');
  }
  console.log('PASS: real Gemma CPU worker, all scenarios, no WebGPU, no inference backend');
} finally {await browser.close();}
