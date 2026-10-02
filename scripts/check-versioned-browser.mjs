// Emulate a previous service worker retaining stale, unversioned JS modules.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  const page=await browser.newPage({serviceWorkers:'block'});
  const changed=new Set(['data.js','engine.js','attribute-enrichment.js','answer-model.js','question-format.js','generated-questions.js','feature-schema.js','llm-questions.js','learning.js','question-model.js','question-ranking.js','ranking-model.js','profile-details.js','release-policy.js','knowledge-loader.js']);
  const stale=[];
  await page.route('**/*.js*',async route=>{
    const url=new URL(route.request().url());
    if(changed.has(url.pathname.split('/').at(-1))&&!url.searchParams.has('v')) {
      stale.push(url.href);return route.fulfill({contentType:'application/javascript',body:'throw new Error("Stale module from old cache");'});
    }
    await route.continue();
  });
  await page.goto('http://127.0.0.1:4173');
  await page.locator('#start-screen.active').waitFor();
  const result=await page.evaluate(async()=>{
    const {GuessEngine}=await import('./engine.js?v=30');
    const {characters,questions}=await import('./data.js?v=30');
    const database=await (await fetch('./wikidata-people.json?v=30')).json();
    const engine=new GuessEngine(structuredClone(characters),questions);
    engine.addDatabase(database);
    const first=engine.nextQuestion();
    return {profiles:engine.characters.length,questions:engine.generatedQuestions.length,first:first?.id};
  });
  assert.deepEqual(stale,[],'Changed nested modules must never use unversioned cache entries');
  assert.ok(result.profiles>19000);
  assert.ok(result.questions>40000);
  assert.equal(result.first,'female');
  console.log('PASS: stale nested-module cache cannot mix old and new engine code',result);
} finally {await browser.close();}
