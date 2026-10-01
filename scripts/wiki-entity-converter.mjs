const occupationMap = new Map([
  ["Q33999","actor"], ["Q177220","singer"], ["Q639669","musician"], ["Q2252262","rapper"],
  ["Q82955","politician"], ["Q49757","writer"], ["Q901","scientist"], ["Q483501","artist"],
  ["Q43845","entrepreneur"], ["Q17125263","creator"], ["Q245068","comedian"], ["Q4610556","model"],
  ["Q2526255","director"], ["Q937857","football"], ["Q3665646","basketball"], ["Q10833314","tennis"],
  ["Q2066131","athlete"], ["Q10841764","motorsport"]
]);
const europeanCountries = new Set(["Q38","Q40","Q31","Q55","Q183","Q142","Q145","Q29","Q45","Q20","Q33","Q34","Q35","Q36","Q213","Q214","Q215","Q218","Q219","Q220","Q221","Q224","Q228","Q229","Q232","Q233","Q211","Q191","Q37","Q28","Q41","Q27","Q32","Q39","Q347"]);
const asianCountries = new Set(["Q17","Q148","Q668","Q884","Q851","Q252","Q794","Q810","Q159","Q43","Q869","Q881","Q928","Q836","Q837","Q843","Q842","Q854","Q858"]);
const claimIds = (entity, property) => (entity.claims?.[property] || []).map((claim) => claim.mainsnak?.datavalue?.value?.id).filter(Boolean);
const claimValue = (entity, property) => entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
const has = (entity, property, qid) => claimIds(entity, property).includes(qid);

export function isNonCharacterEntity(entity) {
  const descriptions=Object.values(entity?.descriptions||{}).map(description=>description.value).join(' ');
  return claimIds(entity||{},'P31').includes('Q13406463') || /\blist of|liste der|liste von|alternative versions|character list|fictional (?:company|corporation|organization|town|city|place|universe)|fiktiv\w* (?:unternehmen|organisation|ort|stadt|universum)/i.test(descriptions);
}

export function convertEntity(entity, score = 1) {
  const name = entity.labels?.de?.value || entity.labels?.en?.value;
  if (!name || name.length > 80) return null;
  const description = entity.descriptions?.de?.value || entity.descriptions?.en?.value || "Ein Eintrag aus Wikidata";
  const types = claimIds(entity, "P31");
  const isHuman = types.includes("Q5");
  const isCollection=isNonCharacterEntity(entity);
  const isFictional = !isHuman && !isCollection && (types.some(id=>['Q15773347','Q1114461','Q95074'].includes(id)) || /fictional|fiktiv|romanfigur|filmfigur|comicfigur|mangafigur|serienfigur|hauptfigur|zeichentrickfigur|märchenfigur|videospielcharakter|charakter|character|superheld/i.test(description));
  if (!isHuman && !isFictional) return null;

  const attributes = { real:isHuman ? 1 : -1, fictional:isFictional ? 1 : -1, personallyKnown:-1 };
  // Wikidata also records genders for fictional characters.
  if (has(entity,'P21','Q6581072')) attributes.female=1;
  else if (has(entity,'P21','Q6581097')) attributes.female=-1;
  if (isHuman) {
    for (const trait of ["actor","singer","musician","rapper","politician","nationalLeader","usPresident","activist","military","militaryLeader","adultCreator","industrialist","medical","legal","religious","writer","scientist","artist","entrepreneur","creator","comedian","model","director","athlete","football","basketball","tennis","motorsport"]) attributes[trait] = -1;
    attributes.alive = entity.claims?.P570?.length ? -1 : 0;
    if (attributes.alive === 1 && entity.claims?.P2031?.length) attributes.retired = 1;
    if (has(entity,"P21","Q6581072")) attributes.female = 1;
    else if (has(entity,"P21","Q6581097")) attributes.female = -1;
    const occupations = claimIds(entity,"P106");
    for (const occupation of occupations) {
      const trait = occupationMap.get(occupation);
      if (trait) attributes[trait] = 1;
    }
    if (attributes.singer === 1 || attributes.rapper === 1) attributes.musician = 1;
    if (attributes.football === 1 || attributes.basketball === 1 || attributes.tennis === 1) attributes.athlete = 1;
    const text = `${name} ${description}`.toLowerCase();
    const infer = (trait, pattern) => { if (pattern.test(text)) attributes[trait] = 1; };
    infer("actor", /actor|actress|schauspiel/);
    infer("singer", /singer|vocalist|sänger|sängerin/);
    infer("rapper", /rapper|rap artist/);
    infer("musician", /musician|composer|songwriter|musiker|musikerin|komponist|singer|sänger|rapper/);
    infer("politician", /politician|political|president|prime minister|chancellor|politiker|politisch|präsident|bundeskanzler/);
    infer("nationalLeader", /president of|prime minister|head of government|chancellor|president von|staatspräsident|premierminister|bundeskanzler/);
    infer("usPresident", /president of the united states|u\.s\. president|us-amerikanischer präsident|präsident der vereinigten staaten/);
    infer("activist", /activist|civil rights leader|campaigner|aktivist|bürgerrechtler|menschenrechtler/);
    infer("militaryLeader", /military leader|military commander|army general|field marshal|militärführer|feldherr|general /);
    infer("military", /military|army officer|soldier|admiral|general|militär|soldat|offizier|admiral/);
    infer("adultCreator", /pornographic|porn actor|porn actress|adult film|adult content|onlyfans|erotic model|pornodarsteller/);
    infer("industrialist", /industrialist|manufacturer|manufacturing|factory owner|industriell|industrieller|fabrikant/);
    infer("medical", /physician|doctor|surgeon|medical researcher|mediziner|arzt|ärztin|chirurg/);
    infer("legal", /lawyer|attorney|judge|jurist|rechtsanwalt|richter|jurist/);
    infer("religious", /religious leader|priest|bishop|pope|imam|rabbi|pastor|geistlicher|bischof|papst/);
    if (attributes.militaryLeader === 1) attributes.military = 1;
    if (attributes.usPresident === 1) attributes.nationalLeader = 1;
    if (["nationalLeader", "usPresident", "activist", "militaryLeader"].some((trait) => attributes[trait] === 1)) attributes.politician = 1;
    infer("writer", /writer|author|novelist|poet|schriftsteller|schriftstellerin|autor|dichter/);
    infer("scientist", /scientist|physicist|chemist|biologist|mathematician|wissenschaftler|physiker|chemiker|biologe|mathematiker/);
    infer("artist", /painter|visual artist|sculptor|maler|künstler|bildhauer/);
    infer("entrepreneur", /entrepreneur|businessman|businesswoman|unternehmer|unternehmerin/);
    infer("creator", /youtuber|streamer|influencer|content creator|social media personality|webvideoproduzent|livestreamer|tiktoker/);
    infer("comedian", /comedian|komiker|komikerin/);
    infer("model", /fashion model|fotomodell/);
    infer("director", /film director|filmmaker|regisseur|regisseurin/);
    infer("football", /footballer|soccer player|fußballspieler|fußballspielerin/);
    infer("basketball", /basketball player|basketballspieler/);
    infer("tennis", /tennis player|tennisspieler/);
    infer("motorsport", /racing driver|formula one|rennfahrer|formel-1/);
    if (attributes.football === 1 || attributes.basketball === 1 || attributes.tennis === 1 || attributes.motorsport === 1 || /athlete|sportler/.test(text)) attributes.athlete = 1;
    if (/\bfilm\b|movie/.test(text) && attributes.actor === 1) attributes.movie = 1;
    if (/television|tv |fernseh/.test(text)) attributes.tv = 1;
    const countries = claimIds(entity,"P27");
    for (const trait of ["american","british","german","french","spanish","italian","canadian","latinAmerican","brazilian","australian","indian","japanese","southKorean","chinese","austrian","swiss","dutch","swedish","polish","russian","ukrainian","turkish","mexican","argentine","nigerian","southAfrican","portuguese","belgian","irish","norwegian","danish"]) attributes[trait] = -1;
    if (countries.includes("Q30")) attributes.american = 1;
    if (countries.includes("Q145")) attributes.british = 1;
    if (countries.includes("Q183")) attributes.german = 1;
    if (countries.includes("Q142")) attributes.french = 1;
    if (countries.includes("Q29")) attributes.spanish = 1;
    if (countries.includes("Q38")) attributes.italian = 1;
    if (countries.includes("Q16")) attributes.canadian = 1;
    if (countries.includes("Q408")) attributes.australian = 1;
    if (countries.includes("Q668")) attributes.indian = 1;
    if (countries.includes("Q17")) attributes.japanese = 1;
    if (countries.includes("Q884")) attributes.southKorean = 1;
    if (countries.includes("Q148")) attributes.chinese = 1;
    if (countries.includes("Q40")) attributes.austrian = 1;
    if (countries.includes("Q39")) attributes.swiss = 1;
    if (countries.includes("Q55")) attributes.dutch = 1;
    if (countries.includes("Q34")) attributes.swedish = 1;
    if (countries.includes("Q36")) attributes.polish = 1;
    if (countries.includes("Q159")) attributes.russian = 1;
    if (countries.includes("Q212")) attributes.ukrainian = 1;
    if (countries.includes("Q43")) attributes.turkish = 1;
    if (countries.includes("Q96")) attributes.mexican = 1;
    if (countries.includes("Q414")) attributes.argentine = 1;
    if (countries.includes("Q1033")) attributes.nigerian = 1;
    if (countries.includes("Q258")) attributes.southAfrican = 1;
    if (countries.includes("Q45")) attributes.portuguese = 1;
    if (countries.includes("Q31")) attributes.belgian = 1;
    if (countries.includes("Q27")) attributes.irish = 1;
    if (countries.includes("Q20")) attributes.norwegian = 1;
    if (countries.includes("Q35")) attributes.danish = 1;
    const latinAmericanCountries = new Set(["Q155","Q414","Q96","Q298","Q739","Q77","Q419","Q736","Q717","Q750","Q733"]);
    if (countries.some((country) => latinAmericanCountries.has(country))) attributes.latinAmerican = 1;
    if (countries.includes("Q155")) attributes.brazilian = 1;
    if (countries.some((country) => europeanCountries.has(country))) attributes.european = 1;
    if (countries.some((country) => asianCountries.has(country))) attributes.asian = 1;
    const birth = claimValue(entity,"P569")?.time;
    if (birth) {
      const year = Number(birth.slice(1,5));
      if (year < 1900) attributes.historical = 1;
    }
  } else {
    const text = `${name} ${description}`.toLowerCase();
    if (/marvel/.test(text)) attributes.marvel = 1;
    if (/\bdc\b|dc comics/.test(text)) attributes.dc = 1;
    if (/disney/.test(text)) attributes.disney = 1;
    if (/star wars/.test(text)) { attributes.starWars = 1; attributes.space = 1; }
    if (/pokémon|pokemon/.test(text)) attributes.pokemon = 1;
    if (/anime|manga/.test(text)) { attributes.anime = 1; attributes.animated = 1; }
    if (/video game|videospiel/.test(text)) attributes.game = 1;
    if (/comic|superhero|superheld/.test(text)) attributes.superhero = 1;
    if (/princess|prinzessin/.test(text)) attributes.princess = 1;
  }
  const imageName = claimValue(entity,"P18");
  const image = typeof imageName === "string" ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageName)}?width=420` : "";
  const knownAttributes = Object.entries(attributes).filter(([id,value])=>value > 0 || value < 0 && ['real','fictional','female','alive','personallyKnown'].includes(id)).map(([id])=>id);
  const aliases=[...new Set(Object.values(entity.labels||{}).map(label=>label.value))].filter(label=>label!==name);
  return { id:`wiki-${entity.id.toLowerCase()}`, name,aliases, description, icon:isHuman ? "👤" : "✨", image, source:`https://www.wikidata.org/wiki/${entity.id}`, popularity:score, attributes,knownAttributes };
}
