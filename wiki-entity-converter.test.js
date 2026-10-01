import test from 'node:test';
import assert from 'node:assert/strict';
import {convertEntity,isNonCharacterEntity} from './scripts/wiki-entity-converter.mjs';
import {isImplicitNegative} from './answer-model.js';
const claim=id=>({mainsnak:{datavalue:{value:{id}}}});

test('wiki imports distinguish unknown life/career facts from documented demographic negatives',()=>{
  const person=convertEntity({id:'Q1',labels:{de:{value:'Beispiel'},en:{value:'Example'}},descriptions:{de:{value:'deutscher Politiker'}},claims:{P31:[claim('Q5')],P21:[claim('Q6581097')]}});
  assert.equal(person.attributes.alive,0);
  assert.ok(!person.knownAttributes.includes('alive'));
  assert.equal(isImplicitNegative(person,'actor'),true);
  assert.equal(isImplicitNegative(person,'female'),false);
  assert.ok(person.aliases.includes('Example'));
});

test('fictional classes work independently of localized description wording',()=>{
  const person=convertEntity({id:'Q2',labels:{de:{value:'Held'}},descriptions:{de:{value:'Hauptfigur einer Manga-Reihe'}},claims:{P31:[claim('Q15773347')],P21:[claim('Q6581097')]}});
  assert.equal(person.attributes.real,-1);
  assert.equal(person.attributes.female,-1);
  assert.ok(person.knownAttributes.includes('female'));
});

test('fictional places, organizations and list articles are not playable individual people',()=>{
  for(const description of ['fiktive Stadt','fictional company','list of fictional characters']) {
    const entity={id:'Q3',labels:{de:{value:'Beispiel'}},descriptions:{en:{value:description}},claims:{}};
    assert.equal(convertEntity(entity),null);
  }
  assert.equal(isNonCharacterEntity({claims:{P31:[claim('Q13406463')]}}),true);
});
