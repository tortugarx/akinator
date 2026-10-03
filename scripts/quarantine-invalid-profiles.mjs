import {readFile,writeFile} from 'node:fs/promises';
const db=JSON.parse(await readFile('wikidata-people.json','utf8'));
const profile=db.characters.find(p=>p.id==='wiki-q121072373');
// Verified article describes proceedings, not the defendant or victim.
if(profile && !(db.excludedProfiles||[]).some(row=>row.profile.id===profile.id)) {
 db.excludedProfiles||=[];
 db.excludedProfiles.push({profile,reason:'Criminal case/proceedings, not a real person or fictional character',source:'https://vi.wikipedia.org/w/index.php?oldid=75471372'});
 await writeFile('wikidata-people.json',JSON.stringify(db)+'\n');
}
console.log('Excluded from play, original retained:',db.excludedProfiles?.map(row=>row.profile.id));
