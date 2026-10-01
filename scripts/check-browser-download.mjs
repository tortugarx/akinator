// Exercises actual browser fetch/ReadableStream transport, not LLM inference.
import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const type = process.argv.includes('--webkit') ? webkit : chromium;
const browser = await type.launch({headless:true,...(type === chromium ? {args:['--no-sandbox']} : {})});
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4173');
  const bytes = Buffer.from([1,2,3,4,5,6,7,8,9]);
  let calls = 0, status = 200;
  await page.route('**/model-fixture',async(route)=>{
    calls++;
    let body = bytes;
    if (status === 206) {
      const [,start,end] = route.request().headers().range.match(/bytes=(\d+)-(\d+)/);
      body = bytes.subarray(Number(start),Number(end)+1);
    }
    await route.fulfill({status,body,contentType:'application/octet-stream'});
  });
  for (const responseStatus of [200,206]) {
    calls = 0; status = responseStatus;
    const output = await page.evaluate(async()=>{
      const {ModelDownloader} = await import('./model-download.js');
      const downloader = new ModelDownloader(new URL('./model-fixture',location.href).href);
      const parts = [];
      for (const offset of [0,3,6]) parts.push([...new Uint8Array(await downloader.chunk({offset,size:3}))]);
      await downloader.close();
      return parts;
    });
    assert.deepEqual(output,[[1,2,3],[4,5,6],[7,8,9]]);
    assert.equal(calls,status === 200 ? 1 : 3);
    console.log(`PASS ${type.name()}: HTTP ${status}, ${calls} requests, correct bytes`);
  }
  if (process.argv.includes('--remote')) {
    const {sourceUrl} = JSON.parse(await readFile('assets/ai/models/qwen/manifest.json','utf8'));
    const result = await page.evaluate(async(url)=>{
      const response = await fetch(url,{headers:{Range:'bytes=0-1023'},cache:'no-store',credentials:'omit'});
      const reader = response.body.getReader();
      const first = await reader.read();
      await reader.cancel(); // Never download a full GB file in this probe.
      return {status:response.status,firstBytes:[...first.value.subarray(0,16)]};
    },sourceUrl);
    assert.ok([200,206].includes(result.status));
    const local = await readFile('assets/ai/models/qwen/model-000.bin');
    assert.deepEqual(result.firstBytes,[...local.subarray(0,16)]);
    console.log(`PASS ${type.name()}: actual immutable model host, HTTP ${result.status}, matching ONNX prefix (stream cancelled)`);
  }
} finally {await browser.close();}
