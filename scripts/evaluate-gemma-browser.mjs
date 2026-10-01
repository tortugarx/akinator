// Research probe only. No changes to the game or deployment.
import {chromium,webkit} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GuessEngine} from '../engine.js';
import {characters,questions} from '../data.js';
import {questionModel} from '../question-model.js';
import {parseQuestionProposals} from '../llm-questions.js';

const repo = 'ggml-org/gemma-3-270m-it-qat-GGUF';
const revision = '7dba9faa7cdb58c7dc44b238c7dbb00e391fbf65';
const file = 'gemma-3-270m-it-qat-Q4_0.gguf';
const local = 'artifacts/model-candidates/gemma-270m.gguf';
const smaller = process.argv.includes('--smaller');
const testedLocal = smaller ? 'artifacts/model-candidates/gemma-270m-small.gguf' : local;
const promptStyle = process.argv.includes('--few-shot') ? 'few-shot' : process.argv.includes('--german') ? 'german' : 'english';
await mkdir('artifacts/model-candidates',{recursive:true});
const meta = await (await fetch(`https://huggingface.co/api/models/${repo}/revision/${revision}?blobs=true`)).json();
const expected = meta.siblings.find(({rfilename})=>rfilename === file);
let bytes;
try {bytes=await readFile(local);} catch { /* First probe downloads once. */ }
if (!bytes || bytes.byteLength !== expected.size || createHash('sha256').update(bytes).digest('hex') !== expected.lfs.sha256) {
  console.log('Downloading pinned candidate:',expected.size,'bytes');
  const response = await fetch(`https://huggingface.co/${repo}/resolve/${revision}/${file}`);
  if (!response.ok) throw Error('Model download HTTP '+response.status);
  bytes = Buffer.from(await response.arrayBuffer());
  if (createHash('sha256').update(bytes).digest('hex') !== expected.lfs.sha256) throw Error('Candidate hash mismatch');
  await writeFile(local,bytes);
}
const database = JSON.parse(await readFile('wikidata-people.json','utf8'));
const scenarios = [[],[['real',1],['chancellor',1]],[['real',1],['adultFilmPerformer',1]],[['real',1],['singer',1]]];
const contexts = [];
for (const answers of scenarios) {
  const engine = new GuessEngine(structuredClone(characters),questions,questionModel);
  for (const person of database.characters) engine.addCharacter(structuredClone(person));
  for (const [id,value] of answers) engine.answer(id,value);
  contexts.push({answers,engine,context:await engine.aiQuestionContext('de')});
}
const type = process.argv.includes('--webkit') ? webkit : chromium;
const browser = await type.launch({headless:true,...(type === chromium ? {args:['--no-sandbox']} : {})});
try {
  const page = await browser.newPage();
  page.on('console',message=>{if(message.type() === 'error')console.log('BROWSER ERROR',message.text().slice(0,200));});
  await page.goto('http://127.0.0.1:4173');
  const loadMs = await page.evaluate(async(testedLocal)=>{
    const {Wllama} = await import('./artifacts/wllama-probe/node_modules/@wllama/wllama/esm/index.js');
    const base = new URL('./artifacts/wllama-probe/node_modules/@wllama/',location.href).href;
    const w = new Wllama({default:base+'wllama/esm/wasm/wllama.wasm'},{logger:{debug(){},log(){},warn(){},error:console.error}});
    w.setCompat({wasm:base+'wllama-compat/wasm/wllama.wasm',worker:base+'wllama-compat/wasm/wllama.js'});
    window.__candidate = w;
    const t = performance.now();
    const response = await fetch(new URL('./'+testedLocal,location.href).href);
    const blob = await response.blob();
    console.log('Candidate fetched',blob.size);
    await w.loadModel([blob],{n_gpu_layers:0,n_threads:1,n_ctx:512});
    return Math.round(performance.now()-t);
  },testedLocal);
  let accepted = 0;
  for (const {answers,engine,context} of contexts) {
    const meaning = context.features[0].meaning;
    const {result,inferenceMs} = await page.evaluate(async({meaning,promptStyle})=>{
      const t = performance.now();
      const messages = promptStyle === 'few-shot' ? [
          {role:'user',content:'Rewrite the following German yes/no question in German. Preserve its meaning. Do NOT answer it. Output only the question: Ist diese Person für Musik bekannt?'},
          {role:'assistant',content:'Ist diese Person durch Musik bekannt?'},
          {role:'user',content:`Rewrite the following German yes/no question in German. Preserve its meaning. Do NOT answer it. Output only the question: ${meaning}`}
        ] : [{role:'user',content:promptStyle === 'german'
          ? `Formuliere diese Frage auf Deutsch. Behalte die Bedeutung bei. Gib nur die Frage aus, keine Antwort, keine Erklärung: ${meaning}`
          : `Rewrite this German yes/no question in German. Preserve its meaning. Output only one question ending in a question mark, no explanation: ${meaning}`}];
      const response = await window.__candidate.createChatCompletion({
        messages,
        max_tokens:48,temperature:0
      });
      return {result:response.choices[0].message.content,inferenceMs:Math.round(performance.now()-t)};
    },{meaning,promptStyle});
    const valid = !!engine.chooseAIQuestion(parseQuestionProposals(result,context));
    if (valid) accepted++;
    console.log(JSON.stringify({answers,meaning,result,accepted:valid,inferenceMs}));
  }
  console.log('SUMMARY',JSON.stringify({repo,revision,bytes:(await readFile(testedLocal)).byteLength,promptStyle,embeddingQuantized:smaller,browser:type.name(),backend:'CPU WASM, one thread, no GPU',loadMs,accepted,total:contexts.length}));
  await page.evaluate(()=>window.__candidate.exit());
} finally {await browser.close();}
