import { readFile, writeFile } from "node:fs/promises";

const databaseUrl = new URL("../wikidata-people.json", import.meta.url);
const cacheUrl = new URL("../image-enrichment-cache.json", import.meta.url);
const userAgent = "NazarGameBuilder/1.0 (https://github.com/tortugarx/akinator)";
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=");
  return [key, value];
}));
const recordLimit = Number(args["record-limit"] || Infinity);
const openverseLimit = Number(args["openverse-limit"] || 18);
const openverseDelay = Number(args["openverse-delay"] || 3200);
const retryMisses = args["retry-misses"] === "true";
const allowedLicenses = new Set(["cc0", "pdm", "by", "by-sa"]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chunks = (items, size) => Array.from({ length:Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

async function readCache() {
  try { return JSON.parse(await readFile(cacheUrl, "utf8")); }
  catch { return { commonsDepicts:{}, commonsSearch:{}, openverse:{} }; }
}

async function getJson(url, retries = 5) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const response = await fetch(url, { headers:{ "User-Agent":userAgent } });
    if (response.ok) return response.json();
    if (attempt === retries - 1) throw new Error(`${response.status} from ${url}`);
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    await sleep(Math.max(retryAfter * 1000, response.status === 429 ? 4000 * (attempt + 1) : 700 * (attempt + 1)));
  }
}

const decodeHtml = (value = "") => value
  .replace(/<[^>]*>/g, " ")
  .replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#039;", "'").replaceAll("&nbsp;", " ")
  .replace(/\s+/g, " ").trim();
const normalize = (value = "") => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const commonsFileName = (image) => {
  const match = image?.match(/Special:FilePath\/([^?]+)/);
  return match ? decodeURIComponent(match[1]) : "";
};
const licenseKey = (name = "") => {
  const lower = name.toLowerCase();
  if (lower.includes("public domain")) return "pdm";
  if (lower.includes("cc0")) return "cc0";
  if (lower.includes("cc by-sa")) return "by-sa";
  if (lower.includes("cc by")) return "by";
  return "";
};

function commonsCandidate(page) {
  const info = page?.imageinfo?.[0];
  const metadata = info?.extmetadata || {};
  const license = decodeHtml(metadata.LicenseShortName?.value);
  if (!info?.thumburl || !allowedLicenses.has(licenseKey(license))) return null;
  return {
    image:info.thumburl,
    imageAttribution:{
      creator:decodeHtml(metadata.Artist?.value) || "Unbekannter Urheber",
      license,
      licenseUrl:metadata.LicenseUrl?.value || "",
      source:"Wikimedia Commons",
      sourceUrl:info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
      title:page.title.replace(/^File:/i, "")
    }
  };
}

function titleLooksLikePerson(title, name) {
  const extension = title.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
  if (extension && !["jpg", "jpeg", "png", "webp"].includes(extension)) return false;
  const titleWithoutExtension = title.replace(/\.[a-z0-9]{2,5}$/i, "");
  const candidate = normalize(titleWithoutExtension);
  const person = normalize(name);
  if (!person || !candidate.includes(person)) return false;
  if (/\b(booklet|page|poster|logo|memorial|grave|signature|album|cast|team|group|family|mural|statue|drawing|painting|house|home|school|street|building|flagon|plate|bowl|vase|medal|tomb|murder|crime scene|nga)\b/.test(candidate)) return false;
  const parenthetical = titleWithoutExtension.match(/\(([^)]+)\)/)?.[1] || "";
  if (parenthetical && !/cropped|portrait|photo|headshot|\b\d{4}\b/i.test(parenthetical)) return false;
  if (candidate === person) return true;
  if (candidate.startsWith(`${person} `)) {
    const suffix = candidate.slice(person.length).trim();
    return /^(?:\d{4}\b|at\b|in\b|during\b|portrait\b|photo\b|photograph\b|cropped\b|speaking\b|with\b|and\b|on\b|from\b|cosplay\b)/.test(suffix);
  }
  if (candidate.endsWith(` ${person}`)) {
    const prefix = candidate.slice(0, -person.length).trim();
    return /^(?:portrait|photo|photograph|headshot|image) of$/.test(prefix);
  }
  return false;
}

async function attachExistingCommonsMetadata(records) {
  const withFiles = records.map((record) => ({ record, file:commonsFileName(record.image) })).filter(({ file, record }) => file && !record.imageAttribution);
  const batches = chunks(withFiles, 25);
  let batchCursor = 0;
  async function metadataWorker() {
    while (batchCursor < batches.length) {
      const batch = batches[batchCursor++];
    const params = new URLSearchParams({ action:"query", format:"json", origin:"*", titles:batch.map(({ file }) => `File:${file}`).join("|"), prop:"imageinfo", iiprop:"url|extmetadata", iiurlwidth:"420" });
    const data = await getJson(`https://commons.wikimedia.org/w/api.php?${params}`);
    const pages = new Map(Object.values(data.query?.pages || {}).map((page) => [normalize(page.title.replace(/^File:/i, "")), page]));
    for (const { record, file } of batch) {
      const candidate = commonsCandidate(pages.get(normalize(file)));
      if (candidate) Object.assign(record, candidate);
      else if (args['verified-only'] === 'true') { record.image='';delete record.imageAttribution; }
    }
      if (batchCursor % 50 === 0) process.stdout.write(`\rCommons credits: ${Math.min(batchCursor, batches.length)}/${batches.length}`);
    }
  }
  await Promise.all(Array.from({ length:Number(args['metadata-concurrency'] || 4) }, metadataWorker));
  process.stdout.write("\n");
}

async function commonsSearch(record, query) {
  const params = new URLSearchParams({ action:"query", format:"json", origin:"*", generator:"search", gsrsearch:query, gsrnamespace:"6", gsrlimit:"8", prop:"imageinfo", iiprop:"url|extmetadata", iiurlwidth:"420" });
  const data = await getJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const pages = Object.values(data.query?.pages || {});
  const page = pages.find((item) => titleLooksLikePerson(item.title.replace(/^File:/i, ""), record.name));
  return page ? commonsCandidate(page) : null;
}

function validCachedCandidate(candidate, record) {
  if (!candidate || candidate === "miss") return null;
  if (candidate.imageAttribution?.source === "Openverse") {
    const { title = record.name, sourceUrl = "", catalogSource = "" } = candidate.imageAttribution;
    if (normalize(record.name).split(" ").length < 2 || (title.includes(",") && !record.name.includes(",")) || !titleLooksLikePerson(title, record.name)) return null;
    const upstream = catalogSource || (sourceUrl.includes("commons.wikimedia.org") ? "wikimedia" : "other");
    if (upstream === "wikimedia") return candidate;
    const normalizedTitle = normalize(title);
    const person = normalize(record.name);
    const suffix = normalizedTitle.startsWith(`${person} `) ? normalizedTitle.slice(person.length).trim() : "";
    return /^(?:\d{4}\b|at\b|in\b|during\b|portrait\b|photo\b|photograph\b|cropped\b|cosplay\b)/.test(suffix) ? candidate : null;
  }
  const title = candidate.imageAttribution?.title || decodeURIComponent((candidate.imageAttribution?.sourceUrl || "").split("/").pop() || "").replace(/^File:/i, "");
  return titleLooksLikePerson(title, record.name) ? candidate : null;
}

function removeUnsafeFallbacks(records, cache) {
  for (const record of records) {
    for (const group of [cache.commonsDepicts, cache.commonsSearch, cache.openverse]) {
      const cached = group[record.id];
      if (!cached || cached === "miss" || validCachedCandidate(cached, record)) continue;
      if (record.image === cached.image) { delete record.image; delete record.imageAttribution; }
      group[record.id] = "miss";
    }
  }
}

async function openverseSearch(record) {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", `"${record.name}"`);
  url.searchParams.set("license", "cc0,pdm,by,by-sa");
  url.searchParams.set("page_size", "10");
  const data = await getJson(url);
  const result = (data.results || []).find((item) => {
    if (!allowedLicenses.has(item.license) || !item.thumbnail || !item.foreign_landing_url || !titleLooksLikePerson(item.title, record.name)) return false;
    if (normalize(record.name).split(" ").length < 2 || (item.title.includes(",") && !record.name.includes(","))) return false;
    if (item.source === "wikimedia") return true;
    const title = normalize(item.title);
    const person = normalize(record.name);
    if (title === person || !title.startsWith(`${person} `)) return false;
    return /^(?:\d{4}\b|at\b|in\b|during\b|portrait\b|photo\b|photograph\b|cropped\b|cosplay\b)/.test(title.slice(person.length).trim());
  });
  if (!result) return null;
  const license = result.license === "pdm" ? "Public Domain" : result.license === "cc0" ? "CC0" : `CC ${result.license.toUpperCase()}${result.license_version ? ` ${result.license_version}` : ""}`;
  return {
    image:result.thumbnail,
    imageAttribution:{ creator:result.creator || "Unbekannter Urheber", license, licenseUrl:result.license_url || "", source:"Openverse", sourceUrl:result.foreign_landing_url, title:result.title, catalogSource:result.source }
  };
}

const database = JSON.parse(await readFile(databaseUrl, "utf8"));
const cache = await readCache();
cache.commonsDepicts ||= {}; cache.commonsSearch ||= {}; cache.openverse ||= {};
let selected=database.characters;
if(args['only-new']==='true') {
  const {execFileSync}=await import('node:child_process');
  const baseline=new Set(JSON.parse(execFileSync('git',['show','HEAD:wikidata-people.json'],{maxBuffer:50*1024*1024}).toString()).characters.map(person=>person.id));
  selected=selected.filter(person=>!baseline.has(person.id));
}
const records = selected.slice(0, recordLimit);
removeUnsafeFallbacks(records, cache);
await attachExistingCommonsMetadata(records);
await writeFile(databaseUrl, `${JSON.stringify(database)}\n`);
if(args['metadata-only']==='true') {
  console.log('Checked portrait licenses:',records.length,'profiles;',records.filter(person=>person.imageAttribution).length,'attributed portraits.');
  process.exit(0);
}

let addedCommons = 0;
const missing = records.filter((record) => !record.image).sort((a,b) => (b.popularity || 0) - (a.popularity || 0));
let cursor = 0;
async function commonsWorker() {
  while (cursor < missing.length) {
    const record = missing[cursor++];
    const qid = record.id?.replace(/^wiki-/i, "").toUpperCase();
    let candidate = null;
    const depictsCache = cache.commonsDepicts[record.id];
    const searchCache = cache.commonsSearch[record.id];
    const depictsUnchecked = qid && (depictsCache !== "miss" || retryMisses);
    const searchUnchecked = searchCache !== "miss" || retryMisses;
    let combinedAttempted = false;
    if (depictsUnchecked && searchUnchecked && !validCachedCandidate(depictsCache, record) && !validCachedCandidate(searchCache, record)) {
      combinedAttempted = true;
      candidate = await commonsSearch(record, `haswbstatement:P180=${qid} OR "${record.name}"`);
      cache.commonsDepicts[record.id] = candidate || "miss";
      cache.commonsSearch[record.id] = candidate || "miss";
    }
    if (!candidate && depictsUnchecked && !combinedAttempted) {
      candidate = validCachedCandidate(depictsCache, record) || await commonsSearch(record, `haswbstatement:P180=${qid}`);
      cache.commonsDepicts[record.id] = candidate || "miss";
    }
    if (!candidate && searchUnchecked && !combinedAttempted) {
      candidate = validCachedCandidate(searchCache, record) || await commonsSearch(record, `"${record.name}"`);
      cache.commonsSearch[record.id] = candidate || "miss";
    }
    if (candidate) { Object.assign(record, candidate); addedCommons += 1; }
    if (cursor % 100 === 0) {
      process.stdout.write(`\rCommons fallback: ${Math.min(cursor, missing.length)}/${missing.length}`);
      await writeFile(cacheUrl, `${JSON.stringify(cache, null, 2)}\n`);
    }
  }
}
await Promise.all(Array.from({ length:18 }, commonsWorker));
process.stdout.write("\n");

let addedOpenverse = 0;
let openverseQueries = 0;
const stillMissing = records.filter((record) => !record.image && !cache.openverse[record.id]).sort((a,b) => (b.popularity || 0) - (a.popularity || 0));
for (const record of stillMissing) {
  if (openverseQueries >= openverseLimit) break;
  const candidate = await openverseSearch(record);
  cache.openverse[record.id] = candidate || "miss";
  openverseQueries += 1;
  if (candidate) { Object.assign(record, candidate); addedOpenverse += 1; }
  if (openverseQueries < openverseLimit) await sleep(openverseDelay);
}

database.imageEnrichment = { updated:new Date().toISOString().slice(0,10), services:["Wikimedia Commons", "Openverse"] };
await writeFile(databaseUrl, `${JSON.stringify(database)}\n`);
await writeFile(cacheUrl, `${JSON.stringify(cache, null, 2)}\n`);
const total = database.characters.filter((record) => record.image).length;
const attributed = database.characters.filter((record) => record.imageAttribution).length;
console.log(`Added ${addedCommons} Commons and ${addedOpenverse} Openverse images. ${total}/${database.characters.length} now have images; ${attributed} have attribution metadata.`);
