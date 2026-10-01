import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

test('ships a pinned CPU-only Gemma runtime with Safari compatibility assets',async()=>{
  const worker = await readFile('local-ai-worker.js','utf8');
  assert.match(worker,/n_gpu_layers:0,n_threads:1/);
  assert.match(worker,/setCompat/);
  assert.doesNotMatch(worker,/navigator\.gpu|Qwen2|onnxruntime/);
  for (const [name,source] of [
    ['wllama.wasm','node_modules/@wllama/wllama/esm/wasm/wllama.wasm'],
    ['compat.wasm','node_modules/@wllama/wllama-compat/wasm/wllama.wasm'],
    ['compat.js','node_modules/@wllama/wllama-compat/wasm/wllama.js']
  ]) {
    const hash = async(path)=>createHash('sha256').update(await readFile(path)).digest('hex');
    assert.equal(await hash('assets/ai/runtime/gemma/'+name),await hash(source));
  }
  const manifest = JSON.parse(await readFile('assets/ai/models/gemma/manifest.json','utf8'));
  assert.equal(manifest.size,241410624);
  assert.equal(manifest.chunks.reduce((sum,chunk)=>sum+chunk.size,0),manifest.size);
});
