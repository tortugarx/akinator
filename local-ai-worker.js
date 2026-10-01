import {Wllama} from './assets/ai/runtime/gemma/wllama.js';
import {ModelDownloader,withDeadline} from './model-download.js';
const root = new URL('./assets/ai/',import.meta.url).href;
const runtime = root+'runtime/gemma/';
let generator, loading;
const notify = (phase,extra={})=>postMessage({type:'progress',phase,...extra});

async function downloadModel() {
  const response = await fetch(root+'models/gemma/manifest.json',{cache:'no-store'});
  if (!response.ok) throw Error('Das lokale Modellpaket fehlt.');
  const manifest = await response.json();
  let cache;
  try { cache = await withDeadline(caches.open('nazar-llm-gemma-'+manifest.revision),3000); } catch {}
  let lastProgress = 0;
  const downloader = new ModelDownloader(manifest.sourceUrl,fetch.bind(globalThis),{onProgress(loaded){
    if (performance.now()-lastProgress < 200) return;
    lastProgress = performance.now();
    notify('download',{loaded,total:manifest.size});
  }});
  const parts = [];
  try {
    for (const chunk of manifest.chunks) {
      const key = root+'models/gemma/'+chunk.path;
      let cached;
      try { cached = await withDeadline(cache?.match(key),3000); } catch { cache = null; }
      let bytes;
      try { bytes = cached ? await withDeadline(cached.arrayBuffer(),15000) : null; } catch { cached = null; cache = null; }
      bytes ||= await downloader.chunk(chunk);
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
      if (bytes.byteLength !== chunk.size || hash !== chunk.sha256) {
        try { await withDeadline(cache?.delete(key),3000); } catch {}
        throw Error('Ein Modellteil ist beschädigt. Bitte erneut versuchen.');
      }
      if (!cached) try { await withDeadline(cache?.put(key,new Response(bytes)),3000); } catch { cache = null; }
      // Blob storage avoids concatenating a second model-size ArrayBuffer.
      parts.push(new Blob([bytes]));
      notify('download',{loaded:chunk.offset+chunk.size,total:manifest.size});
    }
    return new Blob(parts,{type:'application/octet-stream'});
  } finally { await downloader.close(); }
}

async function load() {
  if (generator) return;
  loading ||= (async()=>{
    notify('init');
    const model = await downloadModel();
    notify('compile');
    const w = new Wllama({default:runtime+'wllama.wasm'},{logger:{debug(){},log(){},warn(){},error:console.error}});
    w.setCompat({wasm:runtime+'compat.wasm',worker:runtime+'compat.js'});
    // CPU single-thread: no WebGPU, COOP/COEP or SharedArrayBuffer requirement.
    try { await w.loadModel([model],{n_gpu_layers:0,n_threads:1,n_ctx:512,n_batch:128}); }
    catch(error) { await w.exit().catch(()=>{}); throw error; }
    generator = w;
    notify('ready',{device:'cpu-wasm'});
  })();
  try { await loading; } catch(error) { loading = null; throw error; }
}
self.onmessage = async({data})=>{
  const {id,type,messages} = data;
  try {
    await load();
    let result = true;
    if (type === 'generate') {
      notify('thinking');
      const output = await generator.createChatCompletion({messages,max_tokens:64,temperature:0,grammar:data.grammar});
      result = output.choices[0].message.content;
    }
    postMessage({id,result});
  } catch(error) { postMessage({id,error:String(error.message || error)}); }
};
