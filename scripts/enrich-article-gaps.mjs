// Supplement remaining gaps using named, structured Wikipedia infobox fields.
// Never turn free prose, names, dates of birth or absent claims into answers.
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const db=JSON.parse(await readFile('wikidata-people.json','utf8'));
const audit=JSON.parse(await readFile('reports/profile-audit.json','utf8'));
const sitelinks=JSON.parse(await readFile('artifacts/profile-gap-sitelinks.json','utf8'));
for(const file of await readdir('artifacts/profile-gaps')) {
 const data=JSON.parse(await readFile(`artifacts/profile-gaps/${file}`,'utf8'));
 for(const entity of Object.values(data.entities||{}))if(entity.sitelinks)sitelinks[entity.id]=entity.sitelinks;
}
const curated={
 'donkey-kong':['Donkey Kong (character)','Q12389'],yoshi:['Yoshi','Q214174'],
 'crash-bandicoot':['Crash Bandicoot (character)','Q1063506'],cinderella:['Cinderella (Disney character)','Q2559332'],
 rapunzel:['Rapunzel (Tangled)','Q4902053'],'jason-voorhees':['Jason Voorhees','Q366957'],
 ghostface:['Ghostface (identity)','Q2444720'],'optimus-prime':['Optimus Prime','Q151583'],
 bumblebee:['Bumblebee (Transformers)','Q305245'],sykkuno:['Sykkuno','Q104883362'],asmongold:['Asmongold','Q104589878'],
 // These are series articles, deliberately not assigned to the character IDs.
 'peppa-pig':['Peppa Pig',null],bluey:['Bluey (2018 TV series)',null]
};
const fields={creator:'creator',creators:'creator',alliance:'member',alliances:'member',affiliations:'member',species:'entityType',race:'entityType',occupation:'occupation',occupations:'occupation',employer:'employer',education:'education',alma_mater:'education',team:'team',teams:'team',instrument:'instrument',instruments:'instrument',known_for:'work',notable_works:'work',organization:'member',organisations:'member',organizations:'member',party:'party'};
Object.assign(fields,{club:'team',clubs1:'team',clubs2:'team',clubs3:'team',clubs4:'team',clubs5:'team',club1:'team',club2:'team',club3:'team',club4:'team',currentclub:'team',current_team:'team',school:'education',college:'education',highschool:'education',unit:'militaryUnit',commands:'militaryUnit',commands1:'militaryUnit',battles:'conflict',constituency:'constituency',constituency1:'constituency',constituency2:'constituency',constituency3:'constituency',birth_place:'birthplace',birthplace:'birthplace',主な作品:'work',著名な実績:'work',事務所:'employer',所属:'member',学歴:'education',職業:'occupation',nghề_nghiệp:'occupation',đơn_vị:'militaryUnit',alma_mater:'education'});
Object.assign(fields,{weight_class:'weightClass',constituency_mp:'constituency',constituency_mp1:'constituency',office:'office',office1:'office',office2:'office',office3:'office',competitions:'participation',ocupación:'occupation',ocupação:'occupation',afiliações:'member',alma_máter:'education',zespół:'member',gatunek:'genre',miejsce_urodzenia:'birthplace',最終学歴:'education',所属事務所:'employer',在籍局:'employer',過去の担当番組:'creditedWork',過去の出演番組:'creditedWork',現在の出演番組:'creditedWork',出生地:'birthplace'});
Object.assign(fields,{소속사:'employer',악기:'instrument',مكان_الولادة:'birthplace',nơi_sinh:'birthplace',conviction_status:'deathCause'});
const rebuild=process.argv.includes('--rebuild-articles');
const requested=rebuild?[...db.characters.filter(p=>p.factIds?.some(id=>id.startsWith('fact:article-'))),...(db.curatedFactSupplements||[])]:process.argv.includes('--review-gaps')?JSON.parse(await readFile('reports/gap-resolution.json','utf8')).profiles.filter(p=>!p.sourcedQuestionCount):audit.unresolved.flat();
if(rebuild){
 for(const person of [...db.characters,...(db.curatedFactSupplements||[])])if(person.factIds)person.factIds=person.factIds.filter(id=>!id.startsWith('fact:article-'));
 for(const id of Object.keys(db.factDefinitions))if(id.startsWith('fact:article-'))delete db.factDefinitions[id];
}
const targets=requested.map(p=>{
 const custom=curated[p.id],links=sitelinks[p.id.slice(5).toUpperCase()]||{};
 const wiki=links.enwiki?'enwiki':Object.keys(links).find(key=>key.endsWith('wiki')&&!['commonswiki','specieswiki','wikidatawiki'].includes(key));
 const article=custom?.[0]||links[wiki]?.title;
 return article?{...p,article,language:custom?'en':wiki.slice(0,-4).replace('_','-'),custom:!!custom}:null;
}).filter(Boolean);
await mkdir('artifacts/article-gaps',{recursive:true});
let added=0,requests=0;const skipped=[];
function infobox(text){
 const start=text.search(/\{\{(?:[Ii]nfobox[ _]|ActorActress|基礎情報 アナウンサー|Ficha de persona|Info\/(?:Biografia|Criminoso)|Artysta muzyczny infobox|음악가 정보|معلومات ممثل|Thông tin viên chức)/);if(start<0)return {};
 let depth=0,link=0,field='',chunks=[];
 for(let i=start+2;i<text.length;i++){
  const pair=text.slice(i,i+2);
  if(pair==='{{'){depth++;field+=pair;i++;continue;}
  if(pair==='}}'){if(!depth){chunks.push(field);break;}depth--;field+=pair;i++;continue;}
  if(pair==='[['){link++;field+=pair;i++;continue;}
  if(pair===']]'){link--;field+=pair;i++;continue;}
  if(text[i]==='|'&&!depth&&!link){chunks.push(field);field='';}else field+=text[i];
 }
 return Object.fromEntries(chunks.slice(1).map(c=>{const i=c.indexOf('=');return i<0?[]:[c.slice(0,i).trim().toLowerCase().replaceAll(' ','_'),c.slice(i+1)];}).filter(c=>c.length===2));
}
function insert(person,kind,label,source){
 label=label.replace(/\s+/g,' ').trim();
 if(!label||label.length>120||/^(?:human|humans|homo sapiens|fictional character)$/i.test(label)||label.toLowerCase()===person.name.toLowerCase())return;
 const existing=Object.values(db.factDefinitions).find(f=>f.kind===kind&&[f.de,f.en].some(s=>s?.toLowerCase()===label.toLowerCase()));
 const id=existing?.id||`fact:article-${kind}:${createHash('sha256').update(label.toLowerCase()).digest('hex').slice(0,16)}`;
 db.factDefinitions[id]||={id,kind,de:label,en:label,source};
 person.factIds||=[];if(!person.factIds.includes(id)){person.factIds.push(id);added++;}
}
const withoutReferences=text=>text.replace(/<!--[\s\S]*?-->/g,'').replace(/<ref\b[^>]*\/>/gi,'').replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi,'');
for(const language of new Set(targets.map(p=>p.language))) {
const localized=targets.filter(p=>p.language===language);
for(let i=0;i<localized.length;i+=25){
 const batch=localized.slice(i,i+25),params=new URLSearchParams({action:'query',format:'json',prop:'revisions',rvprop:'ids|content',rvslots:'main',redirects:'1',titles:batch.map(p=>p.article).join('|'),maxlag:'5'});
 const url=`https://${language}.wikipedia.org/w/api.php?${params}`,cache=`artifacts/article-gaps/${createHash('sha256').update(url).digest('hex')}.json`;
 let data;try{data=JSON.parse(await readFile(cache,'utf8'));}catch{
  await new Promise(r=>setTimeout(r,600));
  const response=await fetch(url,{headers:{'User-Agent':'NazarProfileAudit/1.0 (https://github.com/tortugarx/akinator)'},signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error(`Wikipedia ${response.status}`);data=await response.json();if(data.error)throw Error(data.error.info);
  await writeFile(cache,JSON.stringify(data));requests++;
 }
 const rename=new Map([...(data.query?.normalized||[]),...(data.query?.redirects||[])].map(p=>[p.from,p.to]));
 for(const target of batch){
  let title=target.article;for(let hop=0;hop<5&&rename.has(title);hop++)title=rename.get(title);
  const page=Object.values(data.query?.pages||{}).find(p=>p.title===title);
  const revision=page?.revisions?.[0],text=revision?.slots?.main?.['*']||'';
  const box=infobox(text),person=db.characters.find(p=>p.id===target.id);
  // Curated entries reside in data.js; retain sourced supplements separately.
  const record=person||(db.curatedFactSupplements||=[]).find(p=>p.id===target.id)||{id:target.id,name:target.name,factIds:[]};
  if(!person&&!db.curatedFactSupplements.includes(record))db.curatedFactSupplements.push(record);
  const source=`https://${language}.wikipedia.org/w/index.php?oldid=${revision?.revid}`;
  if(!revision){skipped.push(target.id);continue;}
  // Series infobox data is not a character biography.
  if(['peppa-pig','bluey'].includes(target.id))continue;
  for(const [field,kind] of Object.entries(fields)){
   const value=withoutReferences(box[field]||'');
   for(const match of value.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g)){
    if(/^(?:File|Image|Category):/i.test(match[1]))continue;
    insert(record,kind,(match[2]||match[1]).replace(/''/g,''),source);
   }
  }
  // Individual credits in filmography/出演 lists: first linked production only.
  // Do not harvest every link in prose (co-stars are not works).
  const creditSections=text.split(/^==\s*(?:Filmography|出演(?:作品|番組)?|現在出演中の番組|過去の出演番組|Works|Selected filmography)\s*==\s*$/m).slice(1);
  for(const section of creditSections)for(const line of withoutReferences(section.split(/^==[^=].*==\s*$/m)[0]).split('\n')){
   if(!/^\*\s*\[\[/.test(line))continue;
   const match=line.match(/^\*\s*\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
   if(match&&!/^(File|Image|Category):/i.test(match[1]))insert(record,'creditedWork',match[2]||match[1],source);
  }
  for(const value of [box.debut,box.first,box.first_appearance].filter(Boolean).map(withoutReferences)){
   for(const match of value.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\](?:''|\s)*#\s*(\d+[a-z]?)/gi))insert(record,'comicDebut',`${(match[2]||match[1]).replace(/''/g,'')} #${match[3]}`,source);
  }
 }
 console.log('articles',language,Math.min(i+25,localized.length),'/',localized.length,'added',added);
}
}
db.articleEnrichment={updated:new Date().toISOString(),checked:targets.length,added,requests,skipped};
await writeFile('wikidata-people.json',JSON.stringify(db)+'\n');
await writeFile('reports/article-enrichment.json',JSON.stringify(db.articleEnrichment,null,2)+'\n');
console.log(db.articleEnrichment);
