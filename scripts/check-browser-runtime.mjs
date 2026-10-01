// Real tiny ONNX inference: validates the runtime without a 1.22 GB model download.
import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
const type = process.argv.includes('--webkit') ? webkit : chromium;
const browser = await type.launch({headless:true,...(type === chromium ? {args:['--no-sandbox','--enable-unsafe-webgpu','--use-angle=swiftshader']} : {})});
try {
  const page = await browser.newPage({serviceWorkers:'block'});
  await page.goto('http://127.0.0.1:4173');
  const result = await page.evaluate(async()=>{
    const {RuntimeBackend:ort} = await import('./assets/ai/runtime/transformers.js');
    const {checkRuntime} = await import('./runtime-probe.js');
    const root = new URL('./assets/ai/runtime/',location.href).href;
    ort.env.wasm.wasmPaths = {mjs:root+'ort-wasm-simd-threaded.asyncify.mjs',wasm:root+'ort-wasm-simd-threaded.asyncify.wasm'};
    ort.env.wasm.numThreads = 1;
    const gpu = !!await navigator.gpu?.requestAdapter();
    const value = await checkRuntime(ort,gpu?'webgpu':'wasm');
    return {backend:gpu?'webgpu':'wasm',value};
  });
  assert.equal(result.value,3);
  console.log(`PASS ${type.name()}: actual ONNX inference using ${result.backend}, output ${result.value}`);
} finally {await browser.close();}
