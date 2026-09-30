import { readFile, writeFile } from "node:fs/promises";
import { questions, characters as curated } from "../data.js";
import { enrichCharacterAttributes } from "../attribute-enrichment.js";
import { topicBranches } from "../engine.js";
import { trainAnswerModel, predictAnswer, inDomain } from "../answer-model.js";

const database = JSON.parse(await readFile(new URL("../wikidata-people.json", import.meta.url), "utf8"));
const byName = new Map(curated.map((item) => [item.name.toLocaleLowerCase(), { ...item, attributes:{ ...item.attributes } }]));
for (const item of database.characters) {
  const key = item.name.toLocaleLowerCase();
  const existing = byName.get(key);
  if (!existing) byName.set(key, item);
  else for (const [id, value] of Object.entries(item.attributes || {})) if (value === 1) existing.attributes[id] = 1;
}
const characters = [...byName.values()].map(enrichCharacterAttributes);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const weights = {};
for (const { id } of questions) {
  const values = characters.map((item) => item.attributes[id] ?? 0).filter((value) => Math.abs(value) >= .5);
  const yes = values.filter((value) => value > 0).length;
  const no = values.length - yes;
  const coverage = values.length / characters.length;
  const balance = values.length ? 1 - Math.abs(yes - no) / values.length : 0;
  weights[id] = Number(clamp(.7 + .6 * Math.sqrt(coverage) * (.5 + .5 * balance), .7, 1.3).toFixed(4));
}

// Train a separate discriminator for every career branch. A globally rare
// question such as "OnlyFans?" can be extremely valuable among adult creators
// or actors even though it has little value across all 17,000 people.
const branchWeights = {};
for (const [root, children] of topicBranches) {
  const branchCharacters = characters.filter((item) => item.attributes[root] === 1);
  if (branchCharacters.length < 2) continue;
  branchWeights[root] = {};
  for (const { id } of questions) {
    const values = branchCharacters.map((item) => item.attributes[id] ?? 0).filter((value) => Math.abs(value) >= .5);
    const yes = values.filter((value) => value > 0).length;
    const no = values.length - yes;
    const coverage = values.length / branchCharacters.length;
    const balance = values.length ? 1 - Math.abs(yes - no) / values.length : 0;
    const belongsToBranch = id === root || children.has(id) ? 1.12 : 1;
    branchWeights[root][id] = Number(clamp((.62 + 1.05 * Math.sqrt(coverage) * (.25 + .75 * balance)) * belongsToBranch, .55, 1.75).toFixed(4));
  }
}

const countries = ["american", "british", "german", "french", "spanish", "italian", "canadian", "brazilian", "australian", "indian", "japanese", "southKorean", "chinese", "austrian", "swiss", "dutch", "swedish", "polish", "russian", "ukrainian", "turkish", "mexican", "argentine", "nigerian", "southAfrican", "portuguese", "belgian", "irish", "norwegian", "danish"];
const subregions = ["germanSpeaking", "nordic", "easternEuropean", "southernEuropean", "westernEuropean"];
const geography = ["european", "latinAmerican", "asian", "african", ...subregions, ...countries];
const exclusions = {};
for (const answered of countries) exclusions[answered] = geography.filter((candidate) => candidate !== answered);
const regionMembers = {
  european:new Set(["british","german","french","spanish","italian","austrian","swiss","dutch","swedish","polish","russian","ukrainian","portuguese","belgian","irish","norwegian","danish",...subregions]),
  latinAmerican:new Set(["brazilian","mexican","argentine"]),
  asian:new Set(["indian","japanese","southKorean","chinese","turkish"]),
  african:new Set(["nigerian","southAfrican"])
};
for (const [region, members] of Object.entries(regionMembers)) exclusions[region] = geography.filter((candidate) => candidate !== region && !members.has(candidate));

const positiveCounts = Object.fromEntries(questions.map(({ id }) => [id, 0]));
const intersections = new Map();
for (const character of characters) {
  const positive = questions.map(({ id }) => id).filter((id) => character.attributes[id] === 1);
  for (const from of positive) {
    positiveCounts[from] += 1;
    for (const to of positive) if (from !== to) intersections.set(`${from}\0${to}`, (intersections.get(`${from}\0${to}`) || 0) + 1);
  }
}
const implications = {};
for (const { id:from } of questions) {
  if (positiveCounts[from] < 8) continue;
  for (const { id:to } of questions) {
    if (from === to) continue;
    const overlap = intersections.get(`${from}\0${to}`) || 0;
    // Keep implications only when they are exceptionally consistent. At .98,
    // broad noisy Wikidata occupations were suppressing real cross-career paths.
    if (overlap >= 12 && overlap / positiveCounts[from] >= .995) (implications[from] ||= []).push(to);
  }
}

const ids = questions.map(({ id }) => id);
const domains = Object.fromEntries([...topicBranches].flatMap(([root, children]) => [root, ...children].map((id) => [id, "public"])));
for (const id of geography) domains[id] = "public";
for (const id of ["movie","tv","book","space","electric","royalty"]) delete domains[id];
// Legacy profiles contain default -1 entries. These are not supervised labels.
const safeNegativeIds = new Set(["real", "fictional", "alive", "female", ...geography]);
const supervised = characters.map((person) => ({ ...person, attributes:Object.fromEntries(Object.entries(person.attributes).map(([id, value]) => [id, value < 0 && !safeNegativeIds.has(id) && !person.knownAttributes?.includes(id) ? 0 : value])) }));
const validationPeople = supervised.filter((_, index) => index % 5 === 0);
const trainingPeople = supervised.filter((_, index) => index % 5 !== 0);
const validationModel = trainAnswerModel(trainingPeople, ids, domains);
let learnedLoss = 0, baselineLoss = 0, evaluations = 0;
for (const person of validationPeople) {
  for (const id of ids) {
    const answer = person.attributes[id];
    const classifier = validationModel.classifiers[id];
    if (!answer || !classifier || !inDomain(person, classifier.domain)) continue;
    const masked = { attributes:{ ...person.attributes, [id]:0 } };
    const probability = predictAnswer(validationModel, masked, id);
    learnedLoss -= Math.log(answer > 0 ? probability : 1 - probability);
    const baseline = clamp(classifier.prior, .25, .75);
    baselineLoss -= Math.log(answer > 0 ? baseline : 1 - baseline);
    evaluations++;
  }
}
const validation = { heldOutPeople:validationPeople.length, evaluations, logLoss:learnedLoss / evaluations, baselineLogLoss:baselineLoss / evaluations };
console.log("Held-out answer evaluation:", JSON.stringify(validation));
const answerModel = trainAnswerModel(supervised, ids, domains);
answerModel.validation = validation;
const model = { trained:new Date().toISOString().slice(0, 10), samples:characters.length, weights, branchWeights, exclusions, implications, positiveCounts, answerModel };
await writeFile(new URL("../question-model.js", import.meta.url), `// Generated by npm run train:model\nexport const questionModel = ${JSON.stringify(model, null, 2)};\n`);
console.log(`Trained question model on ${characters.length} characters (${Object.keys(exclusions).length} exclusion and ${Object.keys(implications).length} implication groups).`);
