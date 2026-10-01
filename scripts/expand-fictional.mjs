import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {convertEntity} from './wiki-entity-converter.mjs';
await mkdir('artifacts/wiki-expansion',{recursive:true});
async function api(host,params) {
  const url=`https://${host}/w/api.php?${new URLSearchParams({...params,format:'json'})}`;
  const path=`artifacts/wiki-expansion/${createHash('sha256').update(url).digest('hex')}.json`;
  try {return JSON.parse(await readFile(path,'utf8'));} catch {}
  const response=await fetch(url,{headers:{'User-Agent':'NazarGameBuilder/1.0 (https://github.com/tortugarx/akinator)'},signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw Error(`HTTP ${response.status}`);
  const data=await response.json(); if(data.error) throw Error(data.error.info);
  await writeFile(path,JSON.stringify(data)); return data;
}
const titles=new Set();
for(const category of ['Marvel Comics superheroes','DC Comics superheroes','Harry Potter characters','Star Wars characters','Nintendo characters','Disney animated characters','Dragon Ball characters','One Piece characters','Naruto characters','The Simpsons characters','Game of Thrones characters','Video game protagonists','Anime and manga protagonists','Fictional detectives','Fictional robots']) {
  try {
    const data=await api('en.wikipedia.org',{action:'query',list:'categorymembers',cmtitle:`Category:${category}`,cmtype:'page',cmlimit:'500'});
    for(const page of data.query?.categorymembers||[]) if(page.ns===0) titles.add(page.title);
    console.log(category,titles.size);
  } catch(error) {console.log('Category unresolved',category,error.message);}
}
const ids=new Set(),list=[...titles];
for(let offset=0;offset<list.length;offset+=20) {
  try {
    const data=await api('en.wikipedia.org',{action:'query',redirects:'1',prop:'pageprops',ppprop:'wikibase_item',titles:list.slice(offset,offset+20).join('|')});
    for(const page of Object.values(data.query?.pages||{})) if(page.pageprops?.wikibase_item) ids.add(page.pageprops.wikibase_item);
  } catch(error) {console.log('Mapping unresolved',error.message);}
}
const database=JSON.parse(await readFile('wikidata-people.json','utf8'));
const existing=new Set(database.characters.map(person=>person.id)),names=new Set(database.characters.map(person=>person.name.toLocaleLowerCase()));
const candidates=[...ids].filter(id=>!existing.has('wiki-'+id.toLowerCase()));
let added=0,images=0;
for(let offset=0;offset<candidates.length;offset+=50) {
  const data=await api('www.wikidata.org',{action:'wbgetentities',ids:candidates.slice(offset,offset+50).join('|'),props:'labels|descriptions|claims',languages:'de|en',languagefallback:'1'});
  for(const entity of Object.values(data.entities||{})) {
    const person=convertEntity(entity);
    if(!person||person.attributes.fictional!==1||existing.has(person.id)||names.has(person.name.toLocaleLowerCase())) continue;
    database.characters.push(person); existing.add(person.id); names.add(person.name.toLocaleLowerCase()); added++; if(person.image) images++;
  }
}
database.count=database.characters.length;
await writeFile('wikidata-people.json',JSON.stringify(database)+'\n');
console.log('FICTIONAL IMPORT',JSON.stringify({added,images,total:database.count}));
