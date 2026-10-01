// Candidate research only: this never changes the published game's model.
// Downloads public weights, then performs inference entirely on this machine.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pipeline} from '@huggingface/transformers';
import {GuessEngine} from '../engine.js';
import {characters,questions} from '../data.js';
import {questionModel} from '../question-model.js';
import {parseQuestionProposals} from '../llm-questions.js';

const candidates = [
  {repo:'Xenova/flan-t5-small',revision:'311454e83bc784267fd7eef5940ee854144abbec',task:'text2text-generation',dtype:'q8',bytes:95098458},
  {repo:'onnx-community/SmolLM2-135M-Instruct-ONNX',revision:'b8a5c0f183b78c55955a5364f610c36668b5e681',task:'text-generation',dtype:'q4f16',bytes:117266133}
];
const database = JSON.parse(await readFile('wikidata-people.json','utf8'));
const scenarios = [[],[['real',1],['chancellor',1]],[['real',1],['adultFilmPerformer',1]],[['real',1],['singer',1]]];
for (const candidate of candidates) {
  const started = performance.now();
  console.log('CANDIDATE',JSON.stringify(candidate));
  const generate = await pipeline(candidate.task,candidate.repo,{
    dtype:candidate.dtype,revision:candidate.revision,device:'cpu',cache_dir:resolve('artifacts/model-candidates'),
    session_options:{intraOpNumThreads:2,interOpNumThreads:1}
  });
  const loadMs = Math.round(performance.now()-started);
  let accepted = 0;
  for (const answers of scenarios) {
    const engine = new GuessEngine(structuredClone(characters),questions,questionModel);
    for (const person of database.characters) engine.addCharacter(structuredClone(person));
    for (const [id,value] of answers) engine.answer(id,value);
    const context = await engine.aiQuestionContext('de');
    const meaning = context.features[0].meaning;
    const prompt = `Rewrite this German yes/no question in German, preserving its meaning. Output only the question: ${meaning}`;
    const input = candidate.task === 'text-generation' ? [{role:'user',content:prompt}] : prompt;
    const t = performance.now();
    const output = await generate(input,{max_new_tokens:48,do_sample:false,return_full_text:false});
    const generated = output[0].generated_text;
    const result = typeof generated === 'string' ? generated : generated.at(-1).content;
    const selected = engine.chooseAIQuestion(parseQuestionProposals(result,context));
    if (selected) accepted++;
    console.log(JSON.stringify({answers,meaning,result,accepted:!!selected,inferenceMs:Math.round(performance.now()-t)}));
  }
  console.log('SUMMARY',JSON.stringify({repo:candidate.repo,bytes:candidate.bytes,loadMs,accepted,total:scenarios.length}));
  await generate.dispose();
}
