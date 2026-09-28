import { writeFile } from "node:fs/promises";

const agent = "NazarGameBuilder/1.0 (https://github.com/tortugarx/akinator)";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chunks = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
const cleanTitle = (title) => !title.includes(":") && !title.startsWith("Liste_") && !title.startsWith("List_of_") && !title.startsWith("Deaths_in_");
const slug = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function getJson(url, retries = 6) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const response = await fetch(url, { headers:{ "User-Agent":agent } });
    if (response.ok) return response.json();
    if (attempt === retries - 1) throw new Error(`${response.status} from ${url}`);
    await pause(response.status === 429 ? 3000 * (attempt + 1) : 700 * (attempt + 1));
  }
}

const popularity = new Map();
const titlesByLanguage = new Map([["en", new Set()], ["de", new Set()]]);
const years = [2022, 2023, 2024, 2025];
for (const language of ["en", "de"]) {
  for (const year of years) {
    for (let month = 1; month <= 12; month += 1) {
      const stamp = `${year}/${String(month).padStart(2, "0")}/all-days`;
      const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${language}.wikipedia/all-access/${stamp}`;
      try {
        const data = await getJson(url);
        for (const [rank, article] of data.items[0].articles.entries()) {
          if (!cleanTitle(article.article)) continue;
          titlesByLanguage.get(language).add(article.article);
          const key = `${language}:${article.article}`;
          popularity.set(key, Math.max(popularity.get(key) || 0, article.views + (1000 - rank) * 100));
        }
        process.stdout.write(`\rCollected popular pages: ${language} ${year}-${String(month).padStart(2,"0")}`);
      } catch (error) {
        process.stdout.write(`\nSkipped unavailable pageview month ${language} ${year}-${String(month).padStart(2,"0")}: ${error.message}\n`);
      }
    }
  }
}
process.stdout.write("\n");

const qidScores = new Map();
for (const [language, titles] of titlesByLanguage) {
  for (const batch of chunks([...titles], 50)) {
    const params = new URLSearchParams({ action:"query", format:"json", origin:"*", redirects:"1", prop:"pageprops", ppprop:"wikibase_item", titles:batch.join("|") });
    const data = await getJson(`https://${language}.wikipedia.org/w/api.php?${params}`);
    for (const page of Object.values(data.query?.pages || {})) {
      const qid = page.pageprops?.wikibase_item;
      if (!qid) continue;
      const originalTitle = page.title.replaceAll(" ", "_");
      const score = popularity.get(`${language}:${originalTitle}`) || 1;
      qidScores.set(qid, Math.max(qidScores.get(qid) || 0, score));
    }
    await pause(120);
  }
}

const occupationMap = new Map([
  ["Q33999","actor"], ["Q177220","singer"], ["Q639669","musician"], ["Q2252262","rapper"],
  ["Q82955","politician"], ["Q49757","writer"], ["Q901","scientist"], ["Q483501","artist"],
  ["Q43845","entrepreneur"], ["Q17125263","creator"], ["Q245068","comedian"], ["Q4610556","model"],
  ["Q2526255","director"], ["Q937857","football"], ["Q3665646","basketball"], ["Q10833314","tennis"],
  ["Q2066131","athlete"], ["Q10841764","creator"]
]);
const europeanCountries = new Set(["Q38","Q40","Q31","Q55","Q183","Q142","Q145","Q29","Q45","Q20","Q33","Q34","Q35","Q36","Q213","Q214","Q215","Q218","Q219","Q220","Q221","Q224","Q228","Q229","Q232","Q233","Q211","Q191","Q37","Q28","Q41","Q27","Q32","Q39","Q347"]);
const asianCountries = new Set(["Q17","Q148","Q668","Q884","Q851","Q252","Q794","Q810","Q159","Q43","Q869","Q881","Q928","Q836","Q837","Q843","Q842","Q854","Q858"]);
const claimIds = (entity, property) => (entity.claims?.[property] || []).map((claim) => claim.mainsnak?.datavalue?.value?.id).filter(Boolean);
const claimValue = (entity, property) => entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
const has = (entity, property, qid) => claimIds(entity, property).includes(qid);

function initialAttributes(name) {
  const letter = name.normalize("NFD").replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase();
  const between = (start, end) => letter >= start && letter <= end ? 1 : -1;
  return { initialAM:between("A","M"), initialAF:between("A","F"), initialAC:between("A","C"), initialGI:between("G","I"), initialNS:between("N","S"), initialNP:between("N","P"), initialTW:between("T","W") };
}

function convert(entity, score) {
  const name = entity.labels?.de?.value || entity.labels?.en?.value;
  if (!name || name.length > 80) return null;
  const description = entity.descriptions?.de?.value || entity.descriptions?.en?.value || "Ein Eintrag aus Wikidata";
  const types = claimIds(entity, "P31");
  const isHuman = types.includes("Q5");
  const isFictional = !isHuman && /fictional|fiktiv|romanfigur|filmfigur|comicfigur|videospielcharakter|character/i.test(description);
  if (!isHuman && !isFictional) return null;

  const attributes = { ...initialAttributes(name), real:isHuman ? 1 : -1, fictional:isFictional ? 1 : -1, personallyKnown:-1 };
  if (isHuman) {
    for (const trait of ["actor","singer","musician","rapper","politician","writer","scientist","artist","entrepreneur","creator","comedian","model","director","athlete","football","basketball","tennis","motorsport"]) attributes[trait] = -1;
    attributes.alive = entity.claims?.P570?.length ? -1 : 1;
    if (has(entity,"P21","Q6581072")) attributes.female = 1;
    else if (has(entity,"P21","Q6581097")) attributes.female = -1;
    const occupations = claimIds(entity,"P106");
    for (const occupation of occupations) {
      const trait = occupationMap.get(occupation);
      if (trait) attributes[trait] = 1;
    }
    if (attributes.singer || attributes.rapper) attributes.musician = 1;
    if (attributes.football || attributes.basketball || attributes.tennis) attributes.athlete = 1;
    const text = `${name} ${description}`.toLowerCase();
    const infer = (trait, pattern) => { if (pattern.test(text)) attributes[trait] = 1; };
    infer("actor", /actor|actress|schauspiel/);
    infer("singer", /singer|vocalist|sänger|sängerin/);
    infer("rapper", /rapper|rap artist/);
    infer("musician", /musician|composer|songwriter|musiker|musikerin|komponist|singer|sänger|rapper/);
    infer("politician", /politician|political|president|prime minister|chancellor|politiker|politisch|präsident|bundeskanzler/);
    infer("writer", /writer|author|novelist|poet|schriftsteller|schriftstellerin|autor|dichter/);
    infer("scientist", /scientist|physicist|chemist|biologist|mathematician|wissenschaftler|physiker|chemiker|biologe|mathematiker/);
    infer("artist", /painter|visual artist|sculptor|maler|künstler|bildhauer/);
    infer("entrepreneur", /entrepreneur|businessman|businesswoman|unternehmer|unternehmerin/);
    infer("creator", /youtuber|streamer|influencer|content creator|tiktoker/);
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
    if (countries.includes("Q30")) attributes.american = 1;
    if (countries.includes("Q145")) attributes.british = 1;
    if (countries.includes("Q183")) attributes.german = 1;
    if (countries.includes("Q16")) attributes.canadian = 1;
    if (countries.includes("Q408")) attributes.australian = 1;
    const latinAmericanCountries = new Set(["Q155","Q414","Q96","Q298","Q739","Q77","Q419","Q736","Q717","Q750","Q733"]);
    if (countries.some((country) => latinAmericanCountries.has(country))) attributes.latinAmerican = 1;
    if (countries.some((country) => europeanCountries.has(country))) attributes.european = 1;
    if (countries.some((country) => asianCountries.has(country))) attributes.asian = 1;
    const birth = claimValue(entity,"P569")?.time;
    if (birth) {
      const year = Number(birth.slice(1,5));
      attributes.bornBefore1950 = year < 1950 ? 1 : -1;
      attributes.bornAfter1990 = year > 1990 ? 1 : -1;
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
  return { id:`wiki-${entity.id.toLowerCase()}`, name, description, icon:isHuman ? "👤" : "✨", image, source:`https://www.wikidata.org/wiki/${entity.id}`, popularity:score, attributes };
}

const sortedQids = [...qidScores].sort((a,b) => b[1] - a[1]).slice(0, 15000);
const records = [];
const entityBatches = chunks(sortedQids, 50);
let cursor = 0;
let resolved = 0;
async function resolveWorker() {
  while (cursor < entityBatches.length) {
    const batch = entityBatches[cursor++];
    const ids = batch.map(([qid]) => qid);
    const params = new URLSearchParams({ action:"wbgetentities", format:"json", origin:"*", ids:ids.join("|"), props:"labels|descriptions|claims", languages:"de|en", languagefallback:"1" });
    const data = await getJson(`https://www.wikidata.org/w/api.php?${params}`);
    for (const entity of Object.values(data.entities || {})) {
      const record = convert(entity, qidScores.get(entity.id) || 0);
      if (record) records.push(record);
    }
    resolved += batch.length;
    process.stdout.write(`\rResolved Wikidata entities: ${resolved}/${sortedQids.length}`);
  }
}
await Promise.all(Array.from({ length:6 }, resolveWorker));
process.stdout.write("\n");

const unique = [...new Map(records.sort((a,b) => b.popularity - a.popularity).map((record) => [record.id, record])).values()];
await writeFile(new URL("../wikidata-people.json", import.meta.url), `${JSON.stringify({ generated:"2026-09-28", source:"Wikidata / Wikimedia pageviews", count:unique.length, characters:unique })}\n`);
console.log(`Wrote ${unique.length} characters (${unique.filter((item) => item.image).length} with images).`);
