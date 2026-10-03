// Build-time, resumable enrichment of the audit's ambiguous profiles only.
// All new discriminators point to actual statements; no IDs/name letters/DOB.
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const db=JSON.parse(await readFile('wikidata-people.json','utf8'));
const audit=JSON.parse(await readFile('reports/profile-audit.json','utf8'));
const targets=audit.unresolved.flat().filter(p=>/^wiki-q\d+$/.test(p.id));
const wanted=new Set(targets.map(p=>p.id.slice(5).toUpperCase()));
const cache='artifacts/profile-gaps';await mkdir(cache,{recursive:true});
const entities=new Map();
const properties={P106:'occupation',P1412:'language',P103:'nativeLanguage',P135:'movement',P170:'creator',P144:'inspiration',P22:'father',P25:'mother',P26:'spouse',P40:'child',P3373:'sibling',P451:'partner',P463:'member',P800:'work',P1080:'universe',P1441:'appearance',P1303:'instrument',P166:'award',P39:'office',P54:'team',P69:'education',P108:'employer',P19:'birthplace',P119:'burial',P509:'deathCause'};
Object.assign(properties,{P4584:'firstAppearance',P31:'entityType',P793:'event',P1344:'participation',P241:'militaryBranch',P410:'militaryRank'});
function compact(entity) {return {id:entity.id,labels:entity.labels,descriptions:entity.descriptions,sitelinks:entity.sitelinks,claims:Object.fromEntries(Object.entries(entity.claims||{}).filter(([p])=>p in properties).map(([p,claims])=>[p,claims.map(c=>({rank:c.rank,mainsnak:c.mainsnak}))]))};}
// Reuse full source caches, but retain only useful entities/properties in RAM.
for(const directory of ['artifacts/wiki-expansion',cache]) {
  for(const file of await readdir(directory).catch(()=>[])) {
    const data=JSON.parse(await readFile(`${directory}/${file}`,'utf8'));
    for(const entity of Object.values(data.entities||{})) if(wanted.has(entity.id)||directory===cache) {
      const prev=entities.get(entity.id)||{};const next=compact(entity);
      entities.set(entity.id,{...prev,...next,claims:{...prev.claims,...next.claims}});
    }
  }
}
let requests=0;
async function request(url) {
  const path=`${cache}/${createHash('sha256').update(url).digest('hex')}.json`;
  try{return JSON.parse(await readFile(path,'utf8'));}catch{}
  if(process.argv.includes('--cached-only'))return {};
  await new Promise(resolve=>setTimeout(resolve,500));
  const response=await fetch(url,{headers:{'User-Agent':'NazarProfileAudit/1.0 (https://github.com/tortugarx/akinator)'},signal:AbortSignal.timeout(45000)});
  if(response.status===429)throw Error('Rate-limited; stop and resume later, cache retained.');
  if(!response.ok)throw Error(`HTTP ${response.status}: ${url.slice(0,120)}`);
  const data=await response.json();if(data.error)throw Error(data.error.info);
  await writeFile(path,JSON.stringify(data));requests++;return data;
}
async function getEntities(ids,props='labels|descriptions|claims|sitelinks') {
  for(let i=0;i<ids.length;i+=50) {
    const query=new URLSearchParams({action:'wbgetentities',format:'json',ids:ids.slice(i,i+50).join('|'),props,languages:'de|en',languagefallback:'1',maxlag:'5'});
    const data=await request(`https://www.wikidata.org/w/api.php?${query}`);
    for(const entity of Object.values(data.entities||{})) {const prev=entities.get(entity.id)||{};entities.set(entity.id,{...prev,...compact(entity),claims:{...prev.claims,...compact(entity).claims}});}
    console.log('source batches',Math.min(ids.length,i+50),'/',ids.length);
  }
}
// Existing caches may omit sitelinks; obtain these to enable article research.
await getEntities([...wanted].filter(id=>!entities.get(id)?.sitelinks));
const labelIds=new Set();
for(const id of wanted)for(const claims of Object.values(entities.get(id)?.claims||{}))for(const c of claims) {
  const q=c.mainsnak?.datavalue?.value?.id;if(q&&c.rank!=='deprecated')labelIds.add(q);
}
await getEntities([...labelIds].filter(id=>!entities.get(id)?.labels),'labels|descriptions');
let added=0;
const unresolved=[];
for(const target of targets) {
  const person=db.characters.find(p=>p.id===target.id),entity=entities.get(target.id.slice(5).toUpperCase());
  if(!entity){unresolved.push(target.id);continue;}
  person.factIds||=[];
  for(const [property,kind] of Object.entries(properties))for(const claim of entity.claims?.[property]||[]) {
    const id=claim.mainsnak?.datavalue?.value?.id;if(!id||claim.rank==='deprecated'||id===entity.id)continue;
    if(property==='P31' && ['Q5','Q95074','Q15632617','Q15773347','Q1114461'].includes(id))continue;
    const other=entities.get(id),de=other?.labels?.de?.value||other?.labels?.en?.value,en=other?.labels?.en?.value||other?.labels?.de?.value;
    if(!de||/^Q\d+$/.test(de)||de.length>120)continue;
    const key=`fact:${property}:${id}`;
    db.factDefinitions[key]||={id:key,kind,de,en,source:`https://www.wikidata.org/wiki/${id}`};
    if(!person.factIds.includes(key)){person.factIds.push(key);added++;}
  }
}
db.gapEnrichment={updated:new Date().toISOString(),targetProfiles:targets.length,added,requests,unresolved};
await writeFile('wikidata-people.json',JSON.stringify(db)+'\n');
await writeFile('reports/gap-enrichment.json',JSON.stringify(db.gapEnrichment,null,2)+'\n');
// Save article identities, not scraped text, for the next targeted pass.
await writeFile('artifacts/profile-gap-sitelinks.json',JSON.stringify(Object.fromEntries([...wanted].map(id=>[id,entities.get(id)?.sitelinks||{}])))+'\n');
console.log('ENRICHED',db.gapEnrichment);
