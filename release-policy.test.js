import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {safeQuestion,suitableForYouth,youthDatabase,licensedPortrait} from './release-policy.js';
import {readKnowledge} from './knowledge-loader.js';
test('youth release filters adults even when they have overlapping mainstream careers',()=>{
  assert.equal(suitableForYouth({attributes:{actor:1,adultFilmPerformer:1}}),false);
  assert.equal(suitableForYouth({description:'OnlyFans creator',attributes:{}}),false);
  assert.equal(suitableForYouth({description:'Actor',attributes:{actor:1}}),true);
  assert.equal(safeQuestion({id:'group:actor|onlyFansCreator',featureIds:['actor','onlyFansCreator']}),false);
  const input={characters:[{id:'a',attributes:{},factIds:['bad','good']}],factDefinitions:{bad:{de:'erotisch',en:'erotic'},good:{de:'Musik',en:'music'}}};
  const result=youthDatabase(input);assert.deepEqual(result.characters[0].factIds,['good']);assert.ok(!result.factDefinitions.bad);
  assert.equal(input.characters[0].factIds.length,2);
});
test('compressed release round-trips all public profiles and respects mobile budget',async()=>{
  const compressed=await readFile('assets/data/people.json.gz');
  const data=await readKnowledge(new Response(compressed),true);
  const raw=JSON.parse(await readFile('wikidata-people.json','utf8'));
  assert.equal(data.characters.length,raw.characters.length);assert.deepEqual(data.factDefinitions,raw.factDefinitions);
  const youth=JSON.parse(gunzipSync(await readFile('assets/data/people-youth.json.gz')));
  assert.ok(youth.characters.every(suitableForYouth));assert.ok(compressed.length<10_000_000);
  assert.ok(youth.characters.filter(person=>person.image).every(person=>licensedPortrait(person).image));
});
test('pictures without sufficient licensing metadata use a neutral icon in youth release',()=>{
  assert.equal(licensedPortrait({image:'example.jpg'}).image,'');
  assert.equal(licensedPortrait({image:'example.jpg',imageAttribution:{license:'CC BY 4.0',creator:'Photographer',sourceUrl:'https://commons.wikimedia.org/example',licenseUrl:'https://creativecommons.org/licenses/by/4.0/'}}).image,'example.jpg');
});
