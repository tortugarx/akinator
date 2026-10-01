import { env, Qwen2Tokenizer, Qwen2ForCausalLM, TextGenerationPipeline } from './assets/ai/runtime/transformers.js';

const modelRoot = new URL('./assets/ai/models/',import.meta.url).href;
const runtimeRoot = new URL('./assets/ai/runtime/',import.meta.url).href;
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = modelRoot;
env.useBrowserCache = false; // Cache verified shards, not a second full model copy.
env.useWasmCache = false;
env.backends.onnx.wasm.wasmPaths = {mjs:runtimeRoot+'ort-wasm-simd-threaded.jsep.mjs',wasm:runtimeRoot+'ort-wasm-simd-threaded.jsep.wasm'};
env.backends.onnx.wasm.numThreads = 1; // Also works without COOP/COEP in game iframes.
env.backends.onnx.wasm.proxy = false;
let generator = null;
let loading = null;
const nativeFetch = globalThis.fetch.bind(globalThis);
const assetCacheName = 'nazar-llm-6287331f475a3e20e8c879be8fd4bf3551ad9d34-q4f16';

async function smallAsset(url) {
  let cache;
  try { cache = await caches.open(assetCacheName); } catch { /* Optional persistence. */ }
  const cached = await cache?.match(String(url));
  if (cached) return cached;
  const response = await nativeFetch(url);
  if (response.ok) try { await cache?.put(String(url),response.clone()); } catch { /* Optional persistence. */ }
  return response;
}

async function modelResponse() {
  const folder = new URL('qwen/',modelRoot).href;
  const response = await smallAsset(folder+'manifest.json');
  if (!response.ok) throw Error('Lokales Modellpaket fehlt.');
  const manifest = await response.json();
  let cache;
  try { cache = await caches.open(`nazar-llm-${manifest.revision}-${manifest.dtype}`); } catch { /* Still playable without persistent cache. */ }
  let index = 0, loaded = 0;
  return new Response(new ReadableStream({
    async pull(controller) {
      try {
        if (index >= manifest.chunks.length) { controller.close(); return; }
        const chunk = manifest.chunks[index++], url = folder+chunk.path;
        let response = await cache?.match(url);
        const cached = !!response;
        if (!response) {
          response = await nativeFetch(manifest.sourceUrl,{headers:{Range:`bytes=${chunk.offset}-${chunk.offset+chunk.size-1}`}});
          if (response.status !== 206) throw Error('Der Modellhost unterstützt diesen Teil-Download nicht.');
        }
        if (!response.ok) throw Error(`Modellteil nicht verfügbar: ${chunk.path}`);
        const bytes = await response.arrayBuffer();
        const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map((value) => value.toString(16).padStart(2,'0')).join('');
        if (bytes.byteLength !== chunk.size || digest !== chunk.sha256) {
          await cache?.delete(url); throw Error('Ein Modellteil ist beschädigt. Bitte erneut laden.');
        }
        if (!cached) try { await cache?.put(url,new Response(bytes)); } catch { /* Cache quota is optional. */ }
        loaded += bytes.byteLength;
        postMessage({type:'progress',phase:'download',loaded,total:manifest.size,cached});
        controller.enqueue(new Uint8Array(bytes));
      } catch (error) { controller.error(error); }
    }
  }),{headers:{'content-length':String(manifest.size),'content-type':'application/octet-stream'}});
}

env.fetch = (input,options) => {
  const url = String(input);
  if (!url.startsWith(modelRoot)) throw Error('Externe Modellabfragen sind gesperrt.');
  return url.endsWith('/onnx/model_q4f16.onnx') ? modelResponse() : smallAsset(input);
};

async function load() {
  if (generator) return;
  loading ||= (async () => {
    postMessage({type:'progress',phase:'init'});
    let adapter;
    try { adapter = await navigator.gpu?.requestAdapter(); } catch { /* Friendly capability error below. */ }
    if (!adapter?.features.has('shader-f16') || adapter.limits.maxStorageBufferBindingSize < 512*1024*1024) {
      throw Error('Dieses Gerät bietet keine ausreichend leistungsfähige WebGPU-Grafikbeschleunigung für das lokale Sprachmodell. Es wurde noch kein großer Modelldownload gestartet. Bitte nutze den ausdrücklich auswählbaren klassischen Modus.');
    }
    const device = 'webgpu';
    const options = {dtype:'q4f16',device,progress_callback:(event) => {
      if (event.status === 'done' && event.file?.includes('.onnx')) postMessage({type:'progress',phase:'compile'});
    }};
    // Transformers 4's metadata probe does not discover HTTP-local tokenizer
    // files when remote models are disabled. Load the pinned tokenizer directly.
    const [tokenizerJSON,tokenizerConfig] = await Promise.all(['tokenizer.json','tokenizer_config.json'].map(async(file)=>{
      const response = await smallAsset(new URL('qwen/'+file,modelRoot));
      if (!response.ok) throw Error('Lokale Tokenizer-Datei fehlt: '+file);
      return response.json();
    }));
    const tokenizer = new Qwen2Tokenizer(tokenizerJSON,tokenizerConfig);
    let model;
    model = await Qwen2ForCausalLM.from_pretrained('qwen',options);
    generator = new TextGenerationPipeline({task:'text-generation',model,tokenizer});
    postMessage({type:'progress',phase:'ready',device});
  })();
  try { await loading; } catch (error) { loading = null; throw error; }
}

self.onmessage = async ({data}) => {
  const {id,type,messages} = data;
  try {
    await load();
    let result = true;
    if (type === 'generate') {
      postMessage({type:'progress',phase:'thinking'});
      const output = await generator(messages,{max_new_tokens:64,do_sample:false,return_full_text:false});
      const generated = output[0]?.generated_text;
      result = typeof generated === 'string' ? generated : generated?.at(-1)?.content || '';
    }
    postMessage({id,result});
  } catch (error) { postMessage({id,error:String(error.message || error)}); }
};
