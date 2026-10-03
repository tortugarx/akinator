import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {characters,questions} from '../data.js';
import {GuessEngine} from '../engine.js';
import {isImplicitNegative} from '../answer-model.js';
const baselinePath='reports/profile-gaps-baseline.json';
let baseline;
try{baseline=JSON.parse(await readFile(baselinePath,'utf8'));}catch{
 baseline=JSON.parse(execFileSync('git',['show','eec366d:reports/profile-audit.json'],{encoding:'utf8',maxBuffer:10_000_000}));
 await writeFile(baselinePath,JSON.stringify(baseline,null,2)+'\n');
}
const db=JSON.parse(await readFile('wikidata-people.json','utf8'));
const engine=new GuessEngine(structuredClone(characters),questions);
engine.addDatabase(db);engine.refreshGeneratedQuestions();
const askable=new Map([...engine.questions,...engine.generatedQuestions].map(q=>[q.id,q]));
const fingerprint=p=>JSON.stringify(Object.entries(p.attributes).filter(([id,v])=>askable.has(id)&&v&&!isImplicitNegative(p,id)).sort(([a],[b])=>a.localeCompare(b)));
const signatures=new Map();
for(const p of engine.characters){const key=fingerprint(p);if(!signatures.has(key))signatures.set(key,[]);signatures.get(key).push(p.id);}
const originals=baseline.unresolved.flat(),excluded=new Map((db.excludedProfiles||[]).map(row=>[row.profile.id,row]));
const missing=[],unresolved=[],rows=[];
for(const original of originals){
 const person=engine.charactersById.get(original.id);
 if(!person){if(!excluded.has(original.id))missing.push(original.id);continue;}
 const peers=signatures.get(fingerprint(person));if(peers.length>1)unresolved.push({id:original.id,peers});
 const before=original.facts||0,after=(person.facts||[]).length;
 const sourceQuestions=(person.facts||[]).filter(f=>askable.has(f.id)&&/^https:\/\//.test(f.source||''));
 rows.push({id:person.id,name:person.name,factsBefore:before,factsAfter:after,unique:peers.length===1,sourcedQuestionCount:sourceQuestions.length});
}
const report={scope:'Observable question fingerprints, not guaranteed recognition with unknown or mistaken answers',baselineCommit:'eec366d',originalProfiles:originals.length,retainedProfiles:rows.length,distinctProfiles:rows.filter(row=>row.unique).length,addedFactAssociations:rows.reduce((sum,row)=>sum+row.factsAfter-row.factsBefore,0),quarantined:originals.filter(p=>excluded.has(p.id)).map(p=>({id:p.id,reason:excluded.get(p.id).reason,source:excluded.get(p.id).source})),missing,unresolved,profiles:rows};
await writeFile('reports/gap-resolution.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,profiles:undefined},null,2));
if(missing.length||unresolved.length||rows.some(row=>!row.sourcedQuestionCount))throw Error('Original profile resolution gate failed');
