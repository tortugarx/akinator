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
    if (response.status === 414) throw new Error(`414 from ${url}`);
    if (attempt === retries - 1) throw new Error(`${response.status} from ${url}`);
    await pause(response.status === 429 ? 3000 * (attempt + 1) : 700 * (attempt + 1));
  }
}

const popularity = new Map();
const sourceLanguages = new Map([
  ["en", [2022, 2023, 2024, 2025]], ["de", [2022, 2023, 2024, 2025]],
  ["es", [2024, 2025]], ["fr", [2024, 2025]], ["pt", [2024, 2025]], ["it", [2024, 2025]],
  ["pl", [2024, 2025]], ["tr", [2024, 2025]], ["ja", [2024, 2025]], ["ko", [2024, 2025]],
  ["id", [2024, 2025]], ["hi", [2024, 2025]]
]);
const titlesByLanguage = new Map([...sourceLanguages].map(([language]) => [language, new Set()]));
for (const [language, languageYears] of sourceLanguages) {
  for (const year of languageYears) {
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
const pageTasks = [...titlesByLanguage].flatMap(([language, titles]) => chunks([...titles], 50).map((batch) => ({ language, batch })));
const totalPages = pageTasks.reduce((sum, task) => sum + task.batch.length, 0);
let pageCursor = 0;
let mappedPages = 0;
async function mapPageBatch(language, batch) {
  const params = new URLSearchParams({ action:"query", format:"json", origin:"*", redirects:"1", prop:"pageprops", ppprop:"wikibase_item", titles:batch.join("|") });
  let data;
  try {
    data = await getJson(`https://${language}.wikipedia.org/w/api.php?${params}`);
  } catch (error) {
    if (error.message.startsWith("414") && batch.length > 1) {
      const middle = Math.ceil(batch.length / 2);
      await mapPageBatch(language, batch.slice(0, middle));
      await mapPageBatch(language, batch.slice(middle));
      return;
    }
    throw error;
  }
  for (const page of Object.values(data.query?.pages || {})) {
    const qid = page.pageprops?.wikibase_item;
    if (!qid) continue;
    const originalTitle = page.title.replaceAll(" ", "_");
    const score = popularity.get(`${language}:${originalTitle}`) || 1;
    qidScores.set(qid, Math.max(qidScores.get(qid) || 0, score));
  }
  mappedPages += batch.length;
  process.stdout.write(`\rMapped Wikipedia pages: ${mappedPages}/${totalPages}`);
}
async function mapPageWorker() {
  while (pageCursor < pageTasks.length) {
    const { language, batch } = pageTasks[pageCursor++];
    await mapPageBatch(language, batch);
  }
}
await Promise.all(Array.from({ length:8 }, mapPageWorker));
process.stdout.write("\n");

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

function convert(entity, score) {
  const name = entity.labels?.de?.value || entity.labels?.en?.value;
  if (!name || name.length > 80) return null;
  const description = entity.descriptions?.de?.value || entity.descriptions?.en?.value || "Ein Eintrag aus Wikidata";
  const types = claimIds(entity, "P31");
  const isHuman = types.includes("Q5");
  const isFictional = !isHuman && /fictional|fiktiv|romanfigur|filmfigur|comicfigur|videospielcharakter|character/i.test(description);
  if (!isHuman && !isFictional) return null;

  const attributes = { real:isHuman ? 1 : -1, fictional:isFictional ? 1 : -1, personallyKnown:-1 };
  if (isHuman) {
    for (const trait of ["actor","singer","musician","rapper","politician","nationalLeader","usPresident","activist","military","militaryLeader","adultCreator","industrialist","medical","legal","religious","writer","scientist","artist","entrepreneur","creator","comedian","model","director","athlete","football","basketball","tennis","motorsport"]) attributes[trait] = -1;
    attributes.alive = entity.claims?.P570?.length ? -1 : 1;
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
  return { id:`wiki-${entity.id.toLowerCase()}`, name, description, icon:isHuman ? "👤" : "✨", image, source:`https://www.wikidata.org/wiki/${entity.id}`, popularity:score, attributes };
}

for (const qid of ["Q61053", "Q123118096", "Q128567830"]) qidScores.set(qid, Number.MAX_SAFE_INTEGER);
const sortedQids = [...qidScores].sort((a,b) => b[1] - a[1]).slice(0, 30000);
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
