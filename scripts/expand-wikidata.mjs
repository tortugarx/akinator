// Incremental, resumable import. Does not replace existing portraits or verified profiles.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {convertEntity} from './wiki-entity-converter.mjs';
const database = JSON.parse(await readFile('wikidata-people.json','utf8'));
const existing = new Set(database.characters.map(person=>person.id));
await mkdir('artifacts/wiki-expansion',{recursive:true});
async function json(url) {
  // Hash URLs so long API queries never collide.
  const path = 'artifacts/wiki-expansion/'+createHash('sha256').update(url).digest('hex')+'.json';
  try { return JSON.parse(await readFile(path,'utf8')); } catch {}
  const response = await fetch(url,{headers:{'User-Agent':'NazarGameBuilder/1.0 (https://github.com/tortugarx/akinator)'},signal:AbortSignal.timeout(20000)});
  if (!response.ok) throw Error('HTTP '+response.status);
  const data = await response.json();
  if (data.error) throw Error(data.error.info || data.error.code);
  await writeFile(path,JSON.stringify(data)); return data;
}
const ids = new Set();
for (const language of ['ar','ru','zh','bn','vi','th','fa','uk']) {
  const titles = new Set();
  for (const month of ['07','08','09']) {
    try {
      const data = await json(`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${language}.wikipedia/all-access/2026/${month}/all-days`);
      for (const article of data.items[0].articles.slice(0,300)) if (!article.article.includes(':')) titles.add(article.article);
    } catch(error) { console.log('Skipping month',language,month,error.message); }
  }
  const list = [...titles];
  for (let offset=0;offset<list.length;offset+=50) {
    const params = new URLSearchParams({action:'query',format:'json',redirects:'1',prop:'pageprops',ppprop:'wikibase_item',titles:list.slice(offset,offset+50).join('|')});
    try {
      const data = await json(`https://${language}.wikipedia.org/w/api.php?${params}`);
      for (const page of Object.values(data.query?.pages || {})) {
        const id = page.pageprops?.wikibase_item;
        if (id && !existing.has('wiki-'+id.toLowerCase())) ids.add(id);
      }
    } catch(error) { console.log('Skipping pages',language,error.message); }
  }
  console.log('Mapped',language,'new entity candidates:',ids.size);
}
const added = [], names = new Set(database.characters.map(person=>person.name.toLocaleLowerCase()));
const list = [...ids];
for (let offset=0;offset<list.length;offset+=50) {
  const params = new URLSearchParams({action:'wbgetentities',format:'json',ids:list.slice(offset,offset+50).join('|'),props:'labels|descriptions|claims',languages:'de|en',languagefallback:'1'});
  try {
    const data = await json(`https://www.wikidata.org/w/api.php?${params}`);
    for (const entity of Object.values(data.entities || {})) {
      const person = convertEntity(entity);
      if (!person || existing.has(person.id) || names.has(person.name.toLocaleLowerCase())) continue;
      names.add(person.name.toLocaleLowerCase()); existing.add(person.id); added.push(person);
    }
  } catch(error) { console.log('Skipping entities',error.message); }
  console.log('Verified new people/characters:',added.length);
}
if (added.length) {
  database.characters.push(...added); database.count = database.characters.length;
  database.expanded = new Date().toISOString();
  await writeFile('wikidata-people.json',JSON.stringify(database)+'\n');
}
console.log('IMPORT RESULT',JSON.stringify({added:added.length,total:database.characters.length,images:added.filter(person=>person.image).length}));
