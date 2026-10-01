import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

test('ships the native WebGPU Asyncify factory, not the incompatible legacy JSEP factory',async()=>{
  const worker = await readFile('local-ai-worker.js','utf8');
  assert.match(worker,/mjs:runtimeRoot\+'ort-wasm-simd-threaded\.asyncify\.mjs'/);
  assert.match(worker,/wasm:runtimeRoot\+'ort-wasm-simd-threaded\.asyncify\.wasm'/);
  const factory = await readFile('assets/ai/runtime/ort-wasm-simd-threaded.asyncify.mjs','utf8');
  assert.match(factory,/\.webgpuInit=/);
  for (const suffix of ['mjs','wasm']) {
    const name = `ort-wasm-simd-threaded.asyncify.${suffix}`;
    const hash = async(path)=>createHash('sha256').update(await readFile(path)).digest('hex');
    assert.equal(await hash('assets/ai/runtime/'+name),await hash('node_modules/onnxruntime-web/dist/'+name));
  }
});
