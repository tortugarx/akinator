// Resumable build-time enrichment; no API or backend is needed during play.
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {convertEntity,isNonCharacterEntity} from './wiki-entity-converter.mjs';
const database = JSON.parse(await readFile('wikidata-people.json','utf8'));
const directory='artifacts/wiki-expansion';
await mkdir(directory,{recursive:true});
const entities=new Map();
const retainedProperties=new Set(['P31','P106','P21','P27','P18','P570','P569','P2031','P136','P102','P54','P463','P166','P800','P1080','P1441','P1303','P39','P413','P101','P264','P607','P19','P69','P108']);
function compact(entity) {
  return {id:entity.id,...(entity.labels ? {labels:entity.labels} : {}),...(entity.descriptions ? {descriptions:entity.descriptions} : {}),
    ...(entity.claims ? {claims:Object.fromEntries(Object.entries(entity.claims).filter(([id])=>retainedProperties.has(id)).map(([id,claims])=>[id,claims.map(claim=>({rank:claim.rank,mainsnak:claim.mainsnak}))]))} : {})};
}
for (const file of await readdir(directory)) {
  try { const data=JSON.parse(await readFile(`${directory}/${file}`,'utf8')); for(const entity of Object.values(data.entities||{})) {const previous=entities.get(entity.id);entities.set(entity.id,{...previous,...compact(entity)});} } catch {}
}
let rateLimited=false;
async function request(ids,props='labels|descriptions|claims') {
  if(rateLimited) return;
  const params=new URLSearchParams({action:'wbgetentities',format:'json',ids:ids.join('|'),props,languages:'de|en',languagefallback:'1'});
  const url=`https://www.wikidata.org/w/api.php?${params}`;
  const path=`${directory}/${createHash('sha256').update(url).digest('hex')}.json`;
  for(let attempt=0;attempt<3;attempt++) {
    try {
      const response=await fetch(url,{headers:{'User-Agent':'NazarGameBuilder/1.0 (https://github.com/tortugarx/akinator)'},signal:AbortSignal.timeout(30000)});
      if(response.status===429) { rateLimited=true;console.log('Wiki rate limit; retaining cached facts and stopping network requests.'); return; }
      if(!response.ok) throw Error(`HTTP ${response.status}`);
      const data=await response.json(); if(data.error) throw Error(data.error.info);
      await writeFile(path,JSON.stringify(data));
      for(const entity of Object.values(data.entities||{})) entities.set(entity.id,{...entities.get(entity.id),...compact(entity)});
      return;
    } catch(error) { if(attempt===2) console.log('Unresolved batch:',ids[0],error.message); }
  }
}
const removed=database.characters.filter(person=>person.attributes.real===-1 && isNonCharacterEntity(entities.get(person.id.slice(5).toUpperCase())));
const removedIds=new Set(removed.map(person=>person.id));
database.characters=database.characters.filter(person=>!removedIds.has(person.id));
database.count=database.characters.length;
if(removed.length) {database.removedInvalidProfiles=[...(database.removedInvalidProfiles||[]),...removed.map(({id,name,source})=>({id,name,source}))];console.log('Removed non-character lists/places/organizations:',removed.map(person=>person.name));}
const profiles=database.characters.filter(person=>/^wiki-q\d+$/.test(person.id));
const missing=profiles.map(person=>person.id.slice(5).toUpperCase()).filter(id=>!entities.get(id)?.claims);
let cursor=0,completed=0;
await Promise.all(Array.from({length:3},async()=>{
  while(cursor<missing.length) { const batch=missing.slice(cursor,cursor+=50); await request(batch); completed+=batch.length; console.log('Profile sources checked',completed,'/',missing.length); }
}));
const properties={
  P136:['genre','Musik-/Filmgenre','music/film genre'],
  P102:['party','politische Partei','political party'],
  P54:['team','Sportverein','sports team'],
  P463:['member','Band oder Organisation','band or organization'],
  P166:['award','Auszeichnung','award'],
  P800:['work','bekanntes Werk','notable work'],
  P1080:['universe','fiktives Universum','fictional universe'],
  P1441:['appearance','Werk mit dieser Figur','work featuring this character'],
  P1303:['instrument','Instrument','instrument'],
  P39:['office','politisches Amt','political office'],
  P413:['position','Spielposition','playing position'],
  P101:['field','Fachgebiet','field of work'],
  P264:['label','Musiklabel','record label'],
  P607:['conflict','militärischer Konflikt','military conflict'],
  P19:['birthplace','Geburtsort','place of birth'],
  P69:['education','Ausbildungsstätte','educational institution'],
  P108:['employer','Arbeitgeber','employer']
};
const targets=new Set();
for(const person of profiles) {
  const entity=entities.get(person.id.slice(5).toUpperCase());
  for(const property of Object.keys(properties)) for(const claim of entity?.claims?.[property]||[]) {
    const id=claim.mainsnak?.datavalue?.value?.id;
    if(id && claim.rank!=='deprecated') targets.add(id);
  }
}
const missingLabels=[...targets].filter(id=>!entities.get(id)?.labels);
cursor=0;
// Cached-only runs are useful after a completed source audit; retry labels in
// a later build without hammering Wikimedia after a rate-limit response.
await Promise.all(Array.from({length:process.argv.includes('--cached-only') ? 0 : 1},async()=>{
  while(cursor<missingLabels.length && !rateLimited) {const batch=missingLabels.slice(cursor,cursor+=50); await request(batch,'labels');console.log('Detail labels checked',cursor,'/',missingLabels.length);await new Promise(resolve=>setTimeout(resolve,1000));}
}));
let checked=0,withFacts=0,facts=0;
const baseline=new Set(JSON.parse((await import('node:child_process')).execFileSync('git',['show','HEAD:wikidata-people.json'],{maxBuffer:50*1024*1024}).toString()).characters.map(person=>person.id));
for(const person of profiles) {
  const entity=entities.get(person.id.slice(5).toUpperCase()); if(!entity?.claims) continue;
  checked++;
  person.aliases=[...new Set(Object.values(entity.labels||{}).map(label=>label.value))].filter(label=>label!==person.name);
  // Repair freshly imported profiles only; preserve existing curated corrections.
  if(!baseline.has(person.id)) {const converted=convertEntity(entity,person.popularity); if(converted) Object.assign(person,converted);}
  const verified=convertEntity(entity,person.popularity);
  if(verified) {
    for(const [id,value] of Object.entries(verified.attributes)) if(value>0) person.attributes[id]=value;
    if(verified.knownAttributes.includes('female')) person.attributes.female=verified.attributes.female;
    // Historical imports used -1 as a default for absent claims. Mark only
    // documented facts as known, and do not infer living status from no death.
    person.attributes.alive=entity.claims.P570?.length ? -1 : 0;
    person.knownAttributes=[...new Set([
      ...Object.entries(person.attributes).filter(([,value])=>value>0).map(([id])=>id),
      ...(verified.knownAttributes||[])
    ])];
  }
  person.facts=[];
  for(const [property,[kind,de,en]] of Object.entries(properties)) {
    for(const claim of entity.claims[property]||[]) {
      const id=claim.mainsnak?.datavalue?.value?.id;
      if(!id||claim.rank==='deprecated') continue;
      const labels=entities.get(id)?.labels;
      const labelDe=labels?.de?.value||labels?.en?.value;
      const labelEn=labels?.en?.value||labels?.de?.value;
      if(!labelDe||labelDe.length>100||/^Q\d+$/.test(labelDe)) continue;
      const key=`fact:${property}:${id}`;
      if(person.facts.some(fact=>fact.id===key)) continue;
      person.facts.push({id:key,kind,de:labelDe,en:labelEn,source:`https://www.wikidata.org/wiki/${entity.id}#${property}`});
    }
  }
  if(person.facts.length) withFacts++;
  facts+=person.facts.length;
}
database.profileEnrichment={checked,total:profiles.length,withFacts,facts,updated:new Date().toISOString(),unresolved:profiles.length-checked,unresolvedLabels:[...targets].filter(id=>!entities.get(id)?.labels).length};
// Share labels instead of repeating the same award/team/place thousands of
// times. Claim provenance remains the profile's Wikidata URL + property ID.
database.factDefinitions={};
for(const person of database.characters) {
  if(person.knownAttributes) {
    const known=new Set(person.knownAttributes);
    for(const [id,value] of Object.entries(person.attributes)) if(!value || value<0 && !known.has(id)) delete person.attributes[id];
    // Positive facts are always explicit; the list is needed only to mark
    // documented negatives, not to duplicate every positive attribute name.
    person.knownAttributes=person.knownAttributes.filter(id=>person.attributes[id]<0);
  }
  if(!person.facts) continue;
  person.factIds=person.facts.map(fact=>fact.id);
  for(const {source,...fact} of person.facts) database.factDefinitions[fact.id]={...fact,source:`https://www.wikidata.org/wiki/${fact.id.split(':')[2]}`};
  delete person.facts;
}
await writeFile('wikidata-people.json',JSON.stringify(database)+'\n');
console.log('ENRICHMENT',JSON.stringify(database.profileEnrichment));
