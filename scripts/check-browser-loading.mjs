// UI integration test with a deliberately delayed worker fixture.
// This does NOT assert actual model inference; check-browser-ai.mjs does that.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  const page = await browser.newPage({locale:'de-DE',viewport:{width:1024,height:768}});
  await page.addInitScript(()=>{
    window.__generated = 0;
    window.Worker = class {
      postMessage(message) {
        const emit = (data)=>this.onmessage?.({data});
        if (message.type === 'load') {
          emit({type:'progress',phase:'download',loaded:50,total:100});
          this.timer = setTimeout(()=>{emit({type:'progress',phase:'ready'});emit({id:message.id,result:true});},600);
        } else {
          window.__generated++;
          const meaning = message.messages.at(-1).content.replace(/^Formuliere diese Frage als deutsche Ja\/Nein-Frage um: /,'');
          this.timer = setTimeout(()=>emit({id:message.id,result:meaning}),1000);
        }
      }
      terminate(){clearTimeout(this.timer);}
    };
  });
  await page.goto('http://127.0.0.1:4173');
  await page.locator('#start-button').click();
  await page.locator('#ai-load-screen.active').waitFor();
  assert.equal(await page.locator('#ai-load-progress').getAttribute('value'),'50');
  await page.waitForFunction(()=>document.querySelector('#question-screen.active #answer-grid button:not(:disabled)'));
  await page.locator('#answer-grid button[data-answer="-1"]').click();
  assert.equal(await page.locator('#answer-grid button:disabled').count(),5);
  await page.locator('#answer-grid button[data-answer="-1"]').evaluate((button)=>button.click());
  await page.locator('#thinking-lock').waitFor({state:'visible'});
  await mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/loading-lock.png'});
  await page.waitForFunction(()=>document.querySelector('#question-label').textContent.includes('2') && !document.querySelector('#answer-grid button').disabled);
  assert.equal(await page.evaluate(()=>window.__generated),2,'Repeated taps must not generate extra questions');
  assert.equal(await page.locator('#answer-grid .is-selected').count(),0);
  assert.equal(await page.locator('#thinking-lock').isVisible(),false);
  await page.locator('#answer-grid button[data-answer="-1"]').click();
  await page.locator('#thinking-lock').waitFor({state:'visible'});
  await page.locator('#thinking-cancel').click();
  await page.locator('#start-screen.active').waitFor();
  await page.waitForTimeout(1200);
  assert.equal(await page.locator('#start-screen').evaluate((element)=>element.classList.contains('active')),true);
  console.log('PASS: delayed UI fixture, progress, immediate touch lock, duplicate taps, selection reset, cancellation');
} finally { await browser.close(); }
