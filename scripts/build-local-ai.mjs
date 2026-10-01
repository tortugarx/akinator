import { mkdir, writeFile, cp, readFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { join } from 'node:path';

// Pinned model revision. Packaging only; inference never contacts Hugging Face.
const revision = '6287331f475a3e20e8c879be8fd4bf3551ad9d34';
const source = `https://huggingface.co/onnx-community/Qwen2.5-1.5B-Instruct/resolve/${revision}/`;
const folder = 'assets/ai/models/qwen';
let previous;
try { previous = JSON.parse(await readFile(join(folder,'manifest.json'),'utf8')); } catch { /* First build. */ }
await mkdir(folder, {recursive:true});
await mkdir('assets/ai/runtime', {recursive:true});
// Ship only the Qwen2 language-generation API, not unrelated model registries.
await build({stdin:{contents:'export {env,Qwen2Tokenizer,Qwen2ForCausalLM,TextGenerationPipeline} from "./node_modules/@huggingface/transformers/dist/transformers.web.js";',resolveDir:process.cwd(),sourcefile:'nazar-runtime.js'}, bundle:true, format:'esm', platform:'browser', minify:true, outfile:'assets/ai/runtime/transformers.js',plugins:[{
  name:'qwen-only-registry',setup(build) {
    build.onLoad({filter:/transformers\.web\.js$/},async({path})=>{
      const source = await readFile(path,'utf8');
      const registry = /var MODEL_CLASS_TYPE_MAPPING = \[[\s\S]*?\n\];/;
      if (!registry.test(source)) throw Error('Pinned runtime registry changed; review packaging.');
      let contents = source.replace(registry,'var MODEL_CLASS_TYPE_MAPPING = [[new Map([["qwen2", "Qwen2ForCausalLM"]]), MODEL_TYPES.DecoderOnly]];');
      contents = contents.replace(/var (MODEL_\w*MAPPING_NAMES\w*) = \/\* @__PURE__ \*\/ new Map\((\[[\s\S]*?\])\);/g,(_,name,entries)=>{
        const qwen = [...entries.matchAll(/\["([^"]+)", "([^"]+)"\]/g)].filter((match)=>match[2] === 'Qwen2ForCausalLM').map((match)=>match[0]);
        return `var ${name} = new Map([${qwen.join(',')}]);`;
      });
      return {contents,loader:'js'};
    });
  }
}]});
for (const file of ['ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm']) await cp(join('node_modules/onnxruntime-web/dist',file),join('assets/ai/runtime',file));
await cp('node_modules/@huggingface/transformers/LICENSE','assets/ai/transformers-LICENSE.txt');
await cp('node_modules/@huggingface/tokenizers/LICENSE','assets/ai/tokenizers-LICENSE.txt');
await cp('node_modules/@huggingface/jinja/LICENSE','assets/ai/jinja-LICENSE.txt');
const ortLicense = await fetch('https://raw.githubusercontent.com/microsoft/onnxruntime/main/LICENSE');
if (!ortLicense.ok) throw Error('Runtime license unavailable');
await writeFile('assets/ai/onnxruntime-LICENSE.txt',await ortLicense.text());
if (process.argv.includes('--runtime-only')) process.exit(0);
for (const name of ['config.json','generation_config.json','tokenizer.json','tokenizer_config.json']) {
  const response = await fetch(source+name);
  if (!response.ok) throw Error(`${name}: ${response.status}`);
  await writeFile(join(folder,name),new Uint8Array(await response.arrayBuffer()));
}
const license = await fetch('https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct/raw/main/LICENSE');
if (!license.ok) throw Error('Model license unavailable');
await writeFile(join(folder,'LICENSE.txt'),await license.text());

const modelFile = 'onnx/model_q4f16.onnx';
const chunkSize = 48 * 1024 * 1024; // Bounded download/verification/cache units; not committed weights.
const response = await fetch(source+modelFile);
if (!response.ok) throw Error(`Model: ${response.status}`);
const reader = response.body.getReader();
let buffer = new Uint8Array(chunkSize), used = 0, total = 0;
const chunks = [];
const flush = async () => {
  const bytes = buffer.subarray(0,used);
  const path = `model-${String(chunks.length).padStart(3,'0')}.bin`;
  await writeFile(join(folder,path),bytes);
  chunks.push({path,size:used,offset:total-used,sha256:createHash('sha256').update(bytes).digest('hex')});
  console.log(`Packaged ${path}: ${used} bytes`);
  buffer = new Uint8Array(chunkSize); used = 0;
};
while (true) {
  const {value,done} = await reader.read();
  if (done) break;
  let offset = 0;
  while (offset < value.length) {
    const count = Math.min(chunkSize-used,value.length-offset);
    buffer.set(value.subarray(offset,offset+count),used); used += count; offset += count; total += count;
    if (used === chunkSize) await flush();
  }
}
if (used) await flush();
await writeFile(join(folder,'manifest.json'),JSON.stringify({model:'Qwen2.5-1.5B-Instruct',revision,license:'Apache-2.0',dtype:'q4f16',file:modelFile,sourceUrl:source+modelFile,size:total,chunks},null,2));
for (const chunk of previous?.chunks || []) if (/^model-\d{3}\.bin$/.test(chunk.path) && !chunks.some(({path})=>path === chunk.path)) await unlink(join(folder,chunk.path));
console.log(`Packaged local model: ${Math.round(total/1e6)} MB`);
