import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const db=JSON.parse(await readFile('wikidata-people.json','utf8'));
const audit=JSON.parse(await readFile('reports/profile-audit.json','utf8'));
const ids=audit.unresolved.flat().filter(p=>/^wiki-q\d+$/.test(p.id)).map(p=>p.id.slice(5).toUpperCase());
const directory='artifacts/inverse-works';await mkdir(directory,{recursive:true});
const kinds={P161:'castWork',P725:'voiceWork',P50:'authorWork',P175:'performerWork',P86:'composerWork',P57:'directorWork',P674:'appearance'};
const people=new Map(db.characters.map(p=>[p.id.slice(5).toUpperCase(),p]));
let added=0,checked=0;
for(let offset=0;offset<ids.length;offset+=35) {
  const group=ids.slice(offset,offset+35);
  const query=`SELECT DISTINCT ?person ?work ?property ?workLabel ?date WHERE { VALUES ?person { ${group.map(id=>'wd:'+id).join(' ')} } VALUES ?property { ${Object.keys(kinds).map(p=>'wdt:'+p).join(' ')} } ?work ?property ?person . OPTIONAL { ?work wdt:P577 ?date } SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". } }`;
  const path=`${directory}/${createHash('sha256').update(query).digest('hex')}.json`;
  let data;
  try{data=JSON.parse(await readFile(path,'utf8'));}catch{
    if(process.argv.includes('--cached-only'))continue;
    await new Promise(resolve=>setTimeout(resolve,1000));
    const response=await fetch('https://query.wikidata.org/sparql?'+new URLSearchParams({query,format:'json'}),{headers:{'User-Agent':'NazarProfileAudit/1.0 (https://github.com/tortugarx/akinator)'},signal:AbortSignal.timeout(30000)});
    if(response.status===429)throw Error('Rate-limited: stop, cached results preserved.');
    if(!response.ok)throw Error(`Inverse work batch ${offset}: HTTP ${response.status}`);
    data=await response.json();await writeFile(path,JSON.stringify(data));
  }
  for(const row of data.results?.bindings||[]) {
    const pid=row.person.value.split('/').at(-1),work=row.work.value.split('/').at(-1),property=row.property.value.split('/').at(-1),label=row.workLabel?.value;
    if(!label||/^Q\d+$/.test(label)||label.length>120||pid===work)continue;
    const person=people.get(pid);if(!person)continue;
    const id=`fact:inverse-${property}:${work}`;
    const date=row.date?.value?.match(/^\d{4}/)?.[0];
    const name=date?`${label} (${date})`:label;
    db.factDefinitions[id]||={id,kind:kinds[property],de:name,en:name,source:`https://www.wikidata.org/wiki/${work}#${property}`};
    person.factIds||=[];
    if(!person.factIds.includes(id)){person.factIds.push(id);added++;}
  }
  checked+=group.length;
  // Save every batch: a timeout cannot discard a completed source pass.
  db.inverseWorkEnrichment={updated:new Date().toISOString(),checked,total:ids.length,added};
  await writeFile('wikidata-people.json',JSON.stringify(db)+'\n');
  console.log('Inverse works',checked,'/',ids.length,'new statements',added);
}
await writeFile('reports/inverse-work-enrichment.json',JSON.stringify(db.inverseWorkEnrichment,null,2)+'\n');
