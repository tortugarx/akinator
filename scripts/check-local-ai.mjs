import { readFile, mkdir, writeFile, cp, mkdtemp } from 'node:fs/promises';
import { join,resolve } from 'node:path';
import { env, pipeline } from '@huggingface/transformers';
import { questionPrompt, parseQuestionProposals } from '../llm-questions.js';
import {characters,questions} from '../data.js';
import {GuessEngine} from '../engine.js';
import {questionModel} from '../question-model.js';

const folder = 'assets/ai/models/qwen';
// /tmp can be RAM-backed; do not retain GB-sized diagnostics there.
await mkdir('artifacts',{recursive:true});
const temporary = await mkdtemp(join(resolve('artifacts'),'nazar-llm-test-'));
await mkdir(join(temporary,'qwen','onnx'),{recursive:true});
for (const file of ['config.json','generation_config.json','tokenizer.json','tokenizer_config.json']) await cp(join(folder,file),join(temporary,'qwen',file));
const manifest = JSON.parse(await readFile(join(folder,'manifest.json'),'utf8'));
const model = new Uint8Array(manifest.size);
let offset = 0;
for (const chunk of manifest.chunks) { const bytes = await readFile(join(folder,chunk.path)); model.set(bytes,offset); offset += bytes.length; }
await writeFile(join(temporary,'qwen',manifest.file),model);
env.allowRemoteModels = false; env.localModelPath = temporary+'/';
const start = performance.now();
const generate = await pipeline('text-generation','qwen',{dtype:manifest.dtype,device:'cpu',session_options:{intraOpNumThreads:2,interOpNumThreads:1}});
console.log(`Loaded real local model in ${Math.round(performance.now()-start)} ms`);
const database = JSON.parse(await readFile('wikidata-people.json','utf8'));
for (const answers of [[],[['real',1],['chancellor',1]],[['real',1],['adultFilmPerformer',1]],[['real',1],['singer',1]]]) {
  const engine = new GuessEngine(structuredClone(characters),questions,questionModel);
  engine.addDatabase(database);
  for (const [id,value] of answers) engine.answer(id,value);
  const context = await engine.aiQuestionContext('de');
  if (!context.features.length) throw Error('No informative context');
  let question;
  for (let attempt=0;attempt<2 && !question;attempt++) {
    const request = attempt ? {...context,features:context.features.slice(0,1)} : context;
    const output = await generate(questionPrompt(request,'de'),{max_new_tokens:64,do_sample:false,return_full_text:false});
    const content = output[0].generated_text;
    const result = typeof content === 'string' ? content : content.at(-1).content;
    console.log(JSON.stringify({answers,attempt,result}));
    question = engine.chooseAIQuestion(parseQuestionProposals(result,request));
  }
  if (!question) throw Error('Real model failed factual AND information-gain validation');
}
console.log(JSON.stringify({validQuestions:4,elapsedMs:Math.round(performance.now()-start)}));
await generate.dispose();
console.log(`Diagnostic artifacts retained in ${temporary}`);
