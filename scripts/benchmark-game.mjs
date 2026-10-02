import {readFile,writeFile} from 'node:fs/promises';
import {characters,questions} from '../data.js';
import {GuessEngine} from '../engine.js';
import {questionModel} from '../question-model.js';
import {rankingModel} from '../ranking-model.js';
import {questionKind} from '../question-ranking.js';
import {isImplicitNegative} from '../answer-model.js';
const full=new GuessEngine(structuredClone(characters),questions,questionModel);
full.addDatabase(JSON.parse(await readFile('wikidata-people.json','utf8')));full.refreshGeneratedQuestions();
const names=['Olaf Scholz','Angela Merkel','Papaplatte','Gronkh','Taylor Swift','Adele','Freddie Mercury','Harry Potter','Hermione Granger','Spider-Man','Batman','Tom Hanks','Leonardo DiCaprio','Serena Williams','Roger Federer','Albert Einstein'];
// Fixed, mixed-career cohort. This is a diagnostic benchmark, not a claim about
// performance against the full 19k population or real human answer knowledge.
const targets=names.map(name=>full.characters.find(person=>person.name===name)).filter(Boolean);
const cohort=[...new Map([...targets,...full.characters.filter((_,index)=>index%97===0)].map(person=>[person.id||person.name,person])).values()];
const trials=[];
for(const scenario of ['facts','uncertain','mistake']) for(const policy of ['baseline','ranker']) for(const target of targets) {
  const engine=new GuessEngine(structuredClone(cohort),questions,{...questionModel,ranker:policy==='ranker'?rankingModel:null});
  let success=false,wrong=0;const seen=new Set(),trace=[];
  for(let step=0;step<45;step++) {
    if(engine.shouldGuess()) {
      const guess=engine.bestGuess();
      if(guess.character.name===target.name){success=true;break;}
      wrong++;engine.reject(guess.character.id||guess.character.name);
    }
    const q=engine.nextQuestion();if(!q)break;
    if(seen.has(q.id))throw Error(`Repeated question ${q.id}`);seen.add(q.id);
    const person=engine.characters.find(p=>p.name===target.name);
    let response=person.attributes[q.id];
    if(q.featureIds) {
      const values=q.featureIds.map(id=>isImplicitNegative(person,id)?0:person.attributes[id]||0);
      response=values.some(v=>v>0)?1:values.every(v=>v<0)?-1:0;
    } else if(isImplicitNegative(person,q.id)) response=0;
    response=Math.sign(response||0);
    if(scenario==='uncertain' && step%5===3)response=0;
    if(scenario==='mistake' && step===4)response=-response;
    // Same deterministic assumed user familiarity for baseline and ranker.
    const hash=[...q.id].reduce((value,c)=>(Math.imul(value,31)+c.charCodeAt(0))>>>0,0);
    if(scenario!=='facts' && hash%100/100>(rankingModel.assumptions[questionKind(q)]||.8))response=0;
    engine.answer(q.id,response);trace.push({id:q.id,answer:response});
  }
  trials.push({scenario,policy,target:target.name,success,questions:trace.length,wrongGuesses:wrong,trace});
}
const summary=Object.fromEntries(['baseline','ranker'].map(policy=>[policy,Object.fromEntries(['facts','uncertain','mistake'].map(scenario=>{
  const rows=trials.filter(t=>t.policy===policy&&t.scenario===scenario),solved=rows.filter(t=>t.success);
  return [scenario,{rounds:rows.length,solved:solved.length,meanQuestions:rows.reduce((s,t)=>s+t.questions,0)/rows.length,meanSolvedQuestions:solved.length?solved.reduce((s,t)=>s+t.questions,0)/solved.length:null,wrongGuesses:rows.reduce((s,t)=>s+t.wrongGuesses,0)}];
}))]));
await writeFile('reports/game-benchmark.json',JSON.stringify({scope:'fixed mixed-career cohort; synthetic knowledge, not full-database accuracy',cohort:cohort.length,targets:targets.length,summary,trials},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
if(summary.ranker.facts.solved<summary.baseline.facts.solved || summary.ranker.uncertain.solved<summary.baseline.uncertain.solved || summary.ranker.facts.wrongGuesses>summary.baseline.facts.wrongGuesses) {
  console.error('FAILED: diagnostic release gate regressed');process.exitCode=1;
}
