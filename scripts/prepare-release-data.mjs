import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {youthDatabase} from '../release-policy.js';
const database=JSON.parse(await readFile('wikidata-people.json','utf8'));
await mkdir('assets/data',{recursive:true});
const report={sourceProfiles:database.characters.length};
for(const [name,data] of [['people',database],['people-youth',youthDatabase(database)]]) {
  const bytes=gzipSync(JSON.stringify(data),{level:9});
  await writeFile(`assets/data/${name}.json.gz`,bytes);
  report[name]={profiles:data.characters.length,downloadBytes:bytes.length};
}
await writeFile('reports/release-data.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
