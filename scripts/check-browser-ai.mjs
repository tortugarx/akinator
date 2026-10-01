import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-webgpu','--use-angle=swiftshader']});
const context = await browser.newContext({locale:'de-DE',viewport:{width:1366,height:900}});
const page = await context.newPage();
const errors = [], requests = [], modelRequests = [];
page.on('pageerror',(error)=>errors.push(error.message));
page.on('request',(request)=>{ if (request.url().includes('/assets/ai/')) requests.push(request.url()); if (request.url().includes('huggingface.co/')) modelRequests.push({url:request.url(),method:request.method()}); });
page.on('console',(message)=>{ if (['error','warning'].includes(message.type())) console.log('BROWSER',message.type(),message.text().slice(0,700)); });
await page.addInitScript(()=>{
  window.__aiEvents = [];
  const OriginalWorker = window.Worker;
  window.Worker = class extends OriginalWorker {
    constructor(...args) {
      super(...args);
      this.addEventListener('message',({data})=>window.__aiEvents.push(data));
    }
  };
});
await mkdir('artifacts',{recursive:true});
const start = Date.now();
await page.goto('http://127.0.0.1:4173');
await page.locator('#start-screen.active').waitFor({timeout:40000});
await page.locator('#start-button').click();
await page.locator('#ai-load-screen.active').waitFor();
await page.screenshot({path:'artifacts/ai-download.png'});
console.log('Actual browser model load started');
await page.waitForFunction(()=>document.querySelector('#question-screen.active #answer-grid button') && !document.querySelector('#question-screen #answer-grid button').disabled || !document.querySelector('#ai-retry-button').hidden,null,{timeout:240000});
if (await page.locator('#ai-load-screen').evaluate((element)=>element.classList.contains('active'))) {
  console.log(await page.locator('#ai-load-screen').innerText());
  console.log('REQUESTS',requests);
  console.log('EVENTS',await page.evaluate(()=>window.__aiEvents.filter((event)=>event.phase !== 'download')));
  if (process.argv.includes('--unsupported')) {
    assert.match(await page.locator('#ai-load-message').textContent(),/WebGPU/);
    assert.equal(modelRequests.length,0,'Unsupported devices must not download weights');
    await page.locator('#ai-classic-button').click();
    await page.waitForFunction(()=>document.querySelector('#question-screen.active #answer-grid button:not(:disabled)'));
    assert.equal(errors.length,0,errors.join('\n'));
    console.log('PASS: actual browser capability guard, no weight download, explicit classic mode');
    await browser.close();
    process.exit(0);
  }
  await browser.close();
  throw Error('Browser could not generate first question');
}
const first = await page.locator('#question-text').textContent();
console.log('REAL GENERATED QUESTION',first,`after ${Date.now()-start} ms`);
assert.ok(first.endsWith('?'));
const events = await page.evaluate(()=>window.__aiEvents);
assert.ok(events.some(({phase})=>phase==='ready'));
assert.ok(events.some(({result})=>typeof result === 'string' && result.includes('?')));
await page.screenshot({path:'artifacts/ai-question.png'});
await page.locator('#answer-grid button[data-answer="-1"]').click();
await page.locator('#answer-grid button[data-answer="-1"]').evaluate((button)=>button.click());
await page.waitForFunction(()=>document.querySelector('#question-label').textContent.includes('2') && !document.querySelector('#answer-grid button').disabled || !document.querySelector('#ai-retry-button').hidden,null,{timeout:240000});
assert.ok((await page.locator('#question-label').textContent()).includes('2'));
console.log('SECOND GENERATED QUESTION',await page.locator('#question-text').textContent());
const cacheSizes = await page.evaluate(async()=>{
  const names = await caches.keys();
  return Promise.all(names.filter((name)=>name.startsWith('nazar-llm-')).map(async(name)=>({name,parts:(await (await caches.open(name)).keys()).length})));
});
assert.ok(cacheSizes.some(({parts})=>parts >= 25));
assert.equal(errors.length,0,errors.join('\n'));
assert.ok(requests.every((url)=>url.startsWith('http://127.0.0.1:4173/')));
assert.ok(modelRequests.every(({method})=>method === 'GET'));
console.log(JSON.stringify({browser:'Chromium',elapsedMs:Date.now()-start,cacheSizes,modelFileRequests:modelRequests.length,errors}));
await browser.close();
