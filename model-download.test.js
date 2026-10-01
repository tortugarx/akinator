import test from 'node:test';
import assert from 'node:assert/strict';
import {ModelDownloader,withDeadline} from './model-download.js';

const bytes = new Uint8Array([1,2,3,4,5,6,7,8,9]);
const parts = [{offset:0,size:3},{offset:3,size:3},{offset:6,size:3}];
const stream = () => new ReadableStream({start(controller){
  controller.enqueue(bytes.slice(0,2));controller.enqueue(bytes.slice(2,7));
  controller.enqueue(bytes.slice(7));controller.close();
}});

test('uses byte ranges when the host supports them',async()=>{
  const calls = [];
  const download = new ModelDownloader('https://example.test/model',async(url,options)=>{
    calls.push(options);
    const [,start,end] = options.headers.Range.match(/bytes=(\d+)-(\d+)/);
    return new Response(bytes.slice(Number(start),Number(end)+1),{status:206});
  });
  for (const part of parts) assert.deepEqual(new Uint8Array(await download.chunk(part)),bytes.slice(part.offset,part.offset+part.size));
  assert.equal(calls.length,3);
  assert.equal(calls[0].cache,'no-store');
  assert.equal(calls[0].credentials,'omit');
});

test('ignored Range (HTTP 200) streams the full model exactly once',async()=>{
  let calls = 0;
  const download = new ModelDownloader('https://example.test/model',async()=>{calls++;return new Response(stream());});
  for (const part of parts) assert.deepEqual(new Uint8Array(await download.chunk(part)),bytes.slice(part.offset,part.offset+part.size));
  assert.equal(calls,1);
  await download.close();
});

test('full-file fallback resumes after cached chunks and skips later cached gaps',async()=>{
  let calls = 0;
  const download = new ModelDownloader('https://example.test/model',async()=>{calls++;return new Response(stream());});
  assert.deepEqual(new Uint8Array(await download.chunk(parts[1])),bytes.slice(3,6));
  assert.deepEqual(new Uint8Array(await download.chunk({offset:8,size:1})),bytes.slice(8));
  assert.equal(calls,1);
  await download.close();
});

test('truncated full downloads fail instead of saving a partial chunk',async()=>{
  const download = new ModelDownloader('https://example.test/model',async()=>new Response(bytes.slice(0,2)));
  await assert.rejects(download.chunk(parts[0]),/vorzeitig/);
  await download.close();
});

test('HTTP errors do not attempt a full-file fallback',async()=>{
  const download = new ModelDownloader('https://example.test/model',async()=>new Response('Unavailable',{status:503}));
  await assert.rejects(download.chunk(parts[0]),/HTTP 503/);
});

test('cancelling a full-file fallback closes the network stream',async()=>{
  let cancelled = false;
  const download = new ModelDownloader('https://example.test/model',async()=>new Response(new ReadableStream({
    start(controller){controller.enqueue(bytes);},cancel(){cancelled=true;}
  })));
  await download.chunk(parts[0]);
  await download.close();
  assert.equal(cancelled,true);
});

test('reports progress inside a range before its entire part finishes',async()=>{
  const progress = [];
  const download = new ModelDownloader('https://example.test/model',async()=>new Response(stream(),{status:206}),{onProgress:value=>progress.push(value)});
  assert.deepEqual(new Uint8Array(await download.chunk({offset:0,size:9})),bytes);
  assert.deepEqual(progress,[2,7,9]);
});

test('stalled response headers time out and abort the request',async()=>{
  let signal;
  const download = new ModelDownloader('https://example.test/model',async(url,options)=>{
    signal = options.signal;
    return new Promise(()=>{});
  },{idleTimeoutMs:10});
  await assert.rejects(download.chunk(parts[0]),/gespeicherte Teile/);
  assert.equal(signal.aborted,true);
});

test('a stalled body times out, cancels, and preserves earlier progress',async()=>{
  let cancelled = false;
  const progress = [];
  const download = new ModelDownloader('https://example.test/model',async()=>new Response(new ReadableStream({
    start(controller){controller.enqueue(bytes.slice(0,2));},cancel(){cancelled=true;}
  })),{idleTimeoutMs:10,onProgress:value=>progress.push(value)});
  await assert.rejects(download.chunk(parts[0]),/gespeicherte Teile/);
  assert.equal(cancelled,true);
  assert.deepEqual(progress,[2]);
});

test('optional cache operations cannot wait forever',async()=>{
  await assert.rejects(withDeadline(new Promise(()=>{}),10),/erneut versuchen/);
  assert.equal(await withDeadline(Promise.resolve('cached'),10),'cached');
});
