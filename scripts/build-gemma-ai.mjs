import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const revision = '7dba9faa7cdb58c7dc44b238c7dbb00e391fbf65';
const sourceUrl = `https://huggingface.co/ggml-org/gemma-3-270m-it-qat-GGUF/resolve/${revision}/gemma-3-270m-it-qat-Q4_0.gguf`;
const runtime = 'assets/ai/runtime/gemma', folder = 'assets/ai/models/gemma';
await mkdir(runtime,{recursive:true}); await mkdir(folder,{recursive:true});
await build({stdin:{contents:'export {Wllama} from "@wllama/wllama";',resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',minify:true,outfile:runtime+'/wllama.js'});
await cp('node_modules/@wllama/wllama/esm/wasm/wllama.wasm',runtime+'/wllama.wasm');
await cp('node_modules/@wllama/wllama-compat/wasm/wllama.wasm',runtime+'/compat.wasm');
await cp('node_modules/@wllama/wllama-compat/wasm/wllama.js',runtime+'/compat.js');
await cp('node_modules/@wllama/wllama/LICENCE',runtime+'/LICENSE.txt');
let bytes;
try { bytes = await readFile('artifacts/model-candidates/gemma-270m.gguf'); } catch {
  const response = await fetch(sourceUrl); if (!response.ok) throw Error('Model HTTP '+response.status);
  bytes = Buffer.from(await response.arrayBuffer());
}
if (bytes.length !== 241410624 || createHash('sha256').update(bytes).digest('hex') !== '3626e245220ca4a1c5911eb4010b3ecb7bdbf5bc53c79403c21355354d1e2dc6') throw Error('Pinned model hash mismatch');
const chunks = [], chunkSize = 24*1024*1024;
for (let offset=0;offset<bytes.length;offset+=chunkSize) {
  const part = bytes.subarray(offset,offset+chunkSize);
  chunks.push({path:`part-${chunks.length}.bin`,offset,size:part.length,sha256:createHash('sha256').update(part).digest('hex')});
}
await writeFile(folder+'/manifest.json',JSON.stringify({model:'Gemma 3 270M IT QAT Q4_0',revision,sourceUrl,size:bytes.length,chunks},null,2));
const terms = await fetch('https://ai.google.dev/gemma/terms'); if (!terms.ok) throw Error('Gemma terms unavailable');
await writeFile(folder+'/TERMS.html',await terms.text());
await writeFile(folder+'/NOTICE.txt','Gemma is provided under and subject to the Gemma Terms of Use found at https://ai.google.dev/gemma/terms.\nGoogle Gemma 3 270M instruction-tuned QAT weights; GGUF conversion by ggml-org. Original pinned GGUF weights are unmodified. See TERMS.html for the agreement. Runtime: wllama 3.6.1 (MIT), see ../../runtime/gemma/LICENSE.txt.\n');
console.log('Packaged CPU runtime and verified manifest: '+bytes.length+' bytes; static weights, no inference server.');
