import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {characters,questions} from '../data.js';
import {GuessEngine} from '../engine.js';
import {descriptionQuestions} from '../generated-questions.js';
import {isImplicitNegative} from '../answer-model.js';
const database=JSON.parse(await readFile('wikidata-people.json','utf8'));
const engine=new GuessEngine(structuredClone(characters),questions);
engine.addDatabase(database);
const generated=descriptionQuestions(engine.characters);
const askable=new Set([...questions,...generated].map(question=>question.id));
const signatures=new Map(),ids=new Set(),duplicates=[];
for(const person of engine.characters) {
  if(ids.has(person.id)) duplicates.push(person.id); ids.add(person.id);
  const signature=JSON.stringify(Object.entries(person.attributes).filter(([id,value])=>askable.has(id)&&value&&!isImplicitNegative(person,id)).sort(([a],[b])=>a.localeCompare(b)));
  if(!signatures.has(signature)) signatures.set(signature,[]);
  signatures.get(signature).push({id:person.id,name:person.name,source:person.source||'',facts:(person.facts||[]).length});
}
const unresolved=[...signatures.values()].filter(group=>group.length>1).sort((a,b)=>b.length-a.length);
const summary={profiles:engine.characters.length,withImages:engine.characters.filter(person=>person.image).length,questions:askable.size,structuredQuestions:generated.filter(question=>question.id.startsWith('fact:')).length,duplicateIds:duplicates.length,indistinguishableGroups:unresolved.length,indistinguishableProfiles:unresolved.reduce((sum,group)=>sum+group.length,0),distinctProfiles:engine.characters.length-unresolved.reduce((sum,group)=>sum+group.length,0),enrichment:database.profileEnrichment||null};
await mkdir('reports',{recursive:true});
await writeFile('reports/profile-audit.json',JSON.stringify({summary,duplicates,unresolved},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
