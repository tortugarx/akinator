import {chromium,webkit} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
for(const type of [chromium,webkit]) for(const youth of [false,true]) {
  const browser=await type.launch({headless:true,...(type===chromium?{args:['--no-sandbox']}:{})});
  try {
    const page=await browser.newPage({serviceWorkers:'block',viewport:{width:907,height:510}}),errors=[],requests=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>requests.push(request.url()));
    if(youth) {
      const html=(await readFile('index.html','utf8')).replace('<html lang="de">','<html lang="en" data-release="crazygames">');
      await page.route('**/index.html',route=>route.fulfill({contentType:'text/html',body:html}));
      // Even a previously opted-in large-model preference cannot re-enable it
      // in the lightweight release. GitHub retains its explicit option.
      await page.addInitScript(()=>localStorage.setItem('nazar-engine-mode','ai'));
    }
    const start=Date.now();
    await page.goto('http://localhost:4173/index.html');
    await page.locator('#start-screen.active').waitFor({timeout:20000});
    await page.locator('#start-button').click();
    await page.waitForFunction(()=>document.querySelector('#question-screen.active #answer-grid button:not(:disabled)'),null,{timeout:20000});
    assert.match(await page.locator('#question-text').textContent(),/\?$/);
    const firstPlayableMs=Date.now()-start;
    const first=await page.locator('#question-text').textContent();
    await page.locator('#answer-grid button[data-answer="-1"]').click();
    await page.waitForFunction(first=>document.querySelector('#question-text')?.textContent!==first&&!document.querySelector('#answer-grid button')?.disabled,first);
    assert.deepEqual(errors,[]);
    assert.ok(!requests.some(url=>/huggingface|\.gguf|\.wasm/.test(url)),'default must never load LLM weights/runtime');
    assert.ok(requests.some(url=>url.includes(youth?'people-youth.json.gz':'people.json.gz')));
    assert.ok(firstPlayableMs<20000,`Local time to first gameplay exceeded 20s: ${firstPlayableMs}`);
    console.log('PASS',type.name(),youth?'youth release':'GitHub default',firstPlayableMs,'ms to first playable question; no LLM download',await page.locator('#brain-count').textContent());
    await page.locator('.brand').click();
    await page.locator('#settings-button').click();
    assert.equal(await page.locator('#ai-mode').isDisabled(),youth);
    if(!youth) {await page.locator('#ai-mode').check();assert.equal(await page.locator('#ai-mode').isChecked(),true);}
  } finally {await browser.close();}
}
