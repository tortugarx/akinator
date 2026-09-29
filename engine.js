import { enrichCharacterAttributes } from "./attribute-enrichment.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const binaryEntropy = (probability) => {
  if (probability <= 1e-12 || probability >= 1 - 1e-12) return 0;
  return -probability * Math.log(probability) - (1 - probability) * Math.log(1 - probability);
};
const relationshipQuestions = new Set(["family", "parent", "sibling", "grandparent", "yourChild", "romantic", "partner", "friend", "schoolWork"]);
const exactCountries = new Set(["american", "british", "german", "french", "spanish", "italian", "canadian", "brazilian", "australian", "indian", "japanese", "southKorean", "chinese", "austrian", "swiss", "dutch", "swedish", "polish", "russian", "ukrainian", "turkish", "mexican", "argentine", "nigerian", "southAfrican", "portuguese", "belgian", "irish", "norwegian", "danish"]);
const regionQuestions = new Set(["european", "latinAmerican", "asian", "african"]);
const subregionQuestions = new Set(["germanSpeaking", "nordic", "easternEuropean", "southernEuropean", "westernEuropean"]);
const countryParents = new Map([
  ...["german","austrian","swiss"].map((id) => [id,["european","germanSpeaking"]]),
  ...["swedish","norwegian","danish"].map((id) => [id,["european","nordic"]]),
  ...["polish","russian","ukrainian"].map((id) => [id,["european","easternEuropean"]]),
  ...["spanish","italian","portuguese"].map((id) => [id,["european","southernEuropean"]]),
  ...["british","french","dutch","belgian","irish"].map((id) => [id,["european","westernEuropean"]]),
  ...["indian","japanese","southKorean","chinese","turkish"].map((id) => [id,["asian"]]),
  ...["brazilian","mexican","argentine"].map((id) => [id,["latinAmerican"]]),
  ...["nigerian","southAfrican"].map((id) => [id,["african"]])
]);
const nonEuropeanCountries = new Set(["american", "canadian", "brazilian", "australian", "indian", "japanese", "southKorean", "chinese", "mexican", "argentine", "nigerian", "southAfrican"]);
export const topicBranches = new Map([
  ["entertainment", new Set(["actor", "musician", "comedian", "dancer", "model", "director", "producer", "presenter", "creator", "journalist"])],
  ["musician", new Set(["musicGroup", "singer", "rapper", "composer", "dj", "instrumentalist", "popMusician", "rockMusician", "classicalMusician", "electronicMusician", "countryMusician", "musicProducer", "guitarist", "pianist", "drummer", "violinist", "conductor", "metalMusician", "reggaeMusician", "gospelSinger"])],
  ["singer", new Set(["musicGroup", "songwriter", "soloSinger", "popMusician", "rockMusician", "classicalMusician", "electronicMusician", "countryMusician", "rnbSoulSinger", "jazzSinger", "operaSinger", "kpopSinger", "latinSinger", "schlagerSinger", "folkSinger", "metalMusician", "reggaeMusician", "gospelSinger", "rapper", "retired"])],
  ["athlete", new Set(["football", "basketball", "tennis", "motorsport", "boxer", "wrestler", "racingDriver", "coach", "golfer", "cyclist", "swimmer", "runner", "baseball", "iceHockey", "gymnast", "esports", "martialArts", "cricket", "volleyball", "handball", "americanFootball", "winterSports", "retired"])],
  ["politician", new Set(["nationalLeader", "usPresident", "president", "primeMinister", "partyLeader", "cabinetMinister", "diplomat", "activist", "military", "militaryLeader", "royalty", "ministerDiplomat", "mayor", "legislator", "chancellor", "governor", "retired"])],
  ["military", new Set(["militaryLeader", "army", "navy", "airForce", "generalOfficer", "admiral", "militaryPilot", "retired"])],
  ["actor", new Set(["movie", "tv", "filmActor", "seriesActor", "childActor", "actionActor", "horrorActor", "bollywoodActor", "soapActor", "comedian", "model", "adultCreator", "adultFilmPerformer", "onlyFansCreator", "adultDirector", "voiceActor", "theaterActor", "realityTV", "awardWinningActor", "retired"])],
  ["creator", new Set(["internet", "adultCreator", "adultFilmPerformer", "onlyFansCreator", "gamer", "esports", "youtuber", "streamer", "tiktoker", "podcaster", "challengeCreator", "commentaryCreator", "vlogger", "beautyCreator", "techCreator", "educationCreator", "foodCreator", "travelCreator", "fitnessCreator", "comedyCreator", "kidsCreator", "musicCreator", "sportsCreator", "prankCreator", "retired"])],
  ["streamer", new Set(["twitchStreamer", "youtubeStreamer", "gamingStreamer", "minecraftStreamer", "competitiveGameStreamer", "irlStreamer", "politicalStreamer", "vtuber", "varietyStreamer", "roleplayStreamer", "sportsGameStreamer", "battleRoyaleStreamer", "mobaStreamer", "shooterStreamer", "speedrunner", "youtuber", "podcaster", "retired"])],
  ["scientist", new Set(["space", "electric", "physicist", "mathematician", "chemist", "biologist", "astronaut", "engineer", "inventor", "academic", "computerScientist", "economist", "psychologist", "astronomer", "environmentalScientist", "retired"])],
  ["artist", new Set(["photographer", "architect", "retired"])], ["entrepreneur", new Set(["internet", "industrialist", "techEntrepreneur", "finance", "fashionBusiness", "chiefExecutive", "billionaire", "retired"])], ["writer", new Set(["book", "poet", "screenwriter", "philosopher", "novelist", "playwright", "childrensAuthor", "fantasyAuthor", "scifiAuthor", "crimeAuthor", "nonfictionAuthor", "retired"])],
  ["comedian", new Set()], ["model", new Set()], ["director", new Set(["movie"])], ["internet", new Set()],
  ["adultCreator", new Set(["adultFilmPerformer", "onlyFansCreator", "adultDirector"])], ["industrialist", new Set()], ["medical", new Set()], ["legal", new Set()], ["religious", new Set()],
  ["journalist", new Set(["presenter", "podcaster", "retired"])], ["producer", new Set(["musicProducer", "retired"])], ["dancer", new Set(["retired"])], ["chef", new Set(["retired"])]
]);

function collectTopicDescendants(root, found = new Set()) {
  for (const child of topicBranches.get(root) || []) {
    if (found.has(child)) continue;
    found.add(child);
    collectTopicDescendants(child, found);
  }
  return found;
}
const topicDescendantCache = new Map([...topicBranches.keys()].map((root) => [root, collectTopicDescendants(root)]));
const topicDescendants = (root) => topicDescendantCache.get(root) || new Set();
const fictionalOnlyQuestions = new Set(["book", "magic", "superhero", "animated", "anime", "game", "villain", "powers", "nonhuman", "animal", "robot", "marvel", "dc", "disney", "starWars", "pokemon", "horror", "princess", "protagonist", "comic", "scienceFiction", "fantasy", "alien", "monster", "harryPotter", "lordOfTheRings", "mario", "sonic", "wizard", "warrior", "policeCharacter", "studentCharacter", "sitcom", "crimeFiction", "gameOfThrones"]);
const realOnlyQuestions = new Set(["alive", "retired", ...exactCountries, ...regionQuestions, ...subregionQuestions, "medical", "legal", "religious", "chef"]);
for (const [root] of topicBranches) for (const topicId of [root, ...topicDescendants(root)]) realOnlyQuestions.add(topicId);
for (const shared of ["movie", "tv", "book", "space", "electric", "royalty"]) realOnlyQuestions.delete(shared);

export class GuessEngine {
  constructor(characters, questions, model = {}) {
    this.characters = characters.map((item) => enrichCharacterAttributes(item));
    this.questions = questions;
    this.model = model;
    this.charactersById = new Map(this.characters.map((item) => [this.key(item), item]));
    this.charactersByName = new Map(this.characters.map((item) => [this.nameKey(item), item]));
    this.reset();
  }

  reset() {
    this.scores = new Map(this.characters.map((item) => [this.key(item), this.prior(item)]));
    this.asked = new Set();
    this.rejected = new Set();
    this.history = [];
    this.responses = new Map();
    this.answerCount = 0;
    this.lastRejectionAnswerCount = null;
    this.probabilityCache = null;
  }

  key(item) { return item.id ?? item.name; }

  nameKey(item) { return item.name.trim().toLocaleLowerCase(); }

  prior(item) {
    if (item.learned) return .35;
    if (!item.source) return .25;
    return Math.min(.32, Math.log10(1 + (item.popularity || 1)) * .045);
  }

  addCharacter(character) {
    enrichCharacterAttributes(character);
    const existing = this.charactersById.get(this.key(character)) || this.charactersByName.get(this.nameKey(character));
    if (existing) {
      existing.image ||= character.image;
      existing.imageAttribution ||= character.imageAttribution;
      existing.source ||= character.source;
      existing.popularity = Math.max(existing.popularity || 0, character.popularity || 0);
      for (const [id, value] of Object.entries(character.attributes || {})) {
        if (value === 1 || (character.learned && value !== 0)) existing.attributes[id] = value;
      }
      this.probabilityCache = null;
      return;
    }
    this.characters.push(character);
    this.charactersById.set(this.key(character), character);
    this.charactersByName.set(this.nameKey(character), character);
    this.scores.set(this.key(character), this.prior(character));
    this.probabilityCache = null;
  }

  probabilities() {
    if (this.probabilityCache) return this.probabilityCache;
    const available = this.characters.filter((item) => !this.rejected.has(this.key(item)));
    if (!available.length) return [];
    const ceiling = Math.max(...available.map((item) => this.scores.get(this.key(item)) ?? 0));
    const weighted = available.map((item) => ({ item, weight: Math.exp((this.scores.get(this.key(item)) ?? 0) - ceiling) }));
    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0) || 1;
    this.probabilityCache = weighted
      .map((entry) => ({ ...entry, probability: entry.weight / total }))
      .sort((a, b) => b.probability - a.probability);
    return this.probabilityCache;
  }

  certainty() {
    const probabilities = this.probabilities().map(({ probability }) => probability);
    if (probabilities.length <= 1) return 1;
    const entropy = -probabilities.reduce((sum, probability) => sum + probability * Math.log(Math.max(probability, 1e-12)), 0);
    return clamp(1 - entropy / Math.log(probabilities.length), 0, 1);
  }

  response(id) { return this.responses.get(id); }

  answeredYes(id) { return (this.response(id) ?? 0) >= .5; }

  answeredNo(id) { return (this.response(id) ?? 0) <= -.5; }

  isRelevant(question) {
    const id = question.id;
    const realPerson = this.answeredYes("real") || this.answeredNo("fictional");
    const fictionalCharacter = this.answeredNo("real") || this.answeredYes("fictional");
    for (const [answeredId, answer] of this.responses) {
      if (answer >= .5 && this.model.exclusions?.[answeredId]?.includes(id)) return false;
      if (answer >= .5 && this.model.implications?.[answeredId]?.includes(id)) return false;
      if (answer <= -.5 && this.model.implications?.[id]?.includes(answeredId)) return false;
    }
    if (id === "fictional" && (this.answeredYes("real") || this.answeredNo("real"))) return false;
    if (id === "real" && (this.answeredYes("fictional") || this.answeredNo("fictional"))) return false;
    if (id === "personallyKnown" && fictionalCharacter) return false;
    if (id === "retired" && !this.answeredYes("alive")) return false;
    if (this.answeredNo("personallyKnown") && relationshipQuestions.has(id)) return false;
    if (this.answeredYes("personallyKnown") && !relationshipQuestions.has(id)) return false;
    if (realPerson && fictionalOnlyQuestions.has(id)) return false;
    if (fictionalCharacter && realOnlyQuestions.has(id)) return false;
    if (relationshipQuestions.has(id) && this.answeredNo("real")) return false;
    if (["parent", "sibling", "grandparent", "yourChild"].includes(id) && this.answeredNo("family")) return false;
    if (this.answeredYes("family") && ["romantic", "partner", "friend", "schoolWork"].includes(id)) return false;
    if (this.answeredYes("romantic") && ["friend", "schoolWork"].includes(id)) return false;
    if (this.answeredYes("friend") && ["romantic", "partner", "schoolWork"].includes(id)) return false;
    if (this.answeredYes("schoolWork") && ["romantic", "partner", "friend"].includes(id)) return false;
    const familyRoles = ["parent", "sibling", "grandparent", "yourChild"];
    if (familyRoles.includes(id) && familyRoles.some((role) => role !== id && this.answeredYes(role))) return false;
    const parentTopics = [...topicBranches].filter(([, children]) => children.has(id) || [...children].some((child) => topicDescendants(child).has(id)));
    // A detail can belong to several careers. It is impossible only when every
    // possible parent was denied; one denied sibling must never close the path.
    if (parentTopics.length && parentTopics.every(([root]) => this.answeredNo(root))) return false;
    if (id === "musicGroup" && this.answeredNo("musician")) return false;
    if ((id === "singer" || id === "rapper") && this.answeredNo("musician")) return false;
    if (id === "football" && this.answeredNo("athlete")) return false;
    if (["basketball", "tennis", "motorsport"].includes(id) && this.answeredNo("athlete")) return false;
    if (id === "militaryLeader" && this.answeredNo("military")) return false;
    if (id === "anime" && this.answeredNo("animated")) return false;
    if ((id === "animal" || id === "robot" || id === "nonhuman") && this.answeredYes("human")) return false;
    if (id === "animal" && this.answeredNo("nonhuman")) return false;
    if (id === "robot" && this.answeredYes("animal")) return false;

    const confirmedCountry = [...exactCountries].find((country) => this.answeredYes(country));
    if (countryParents.has(id) && countryParents.get(id).some((parent) => !this.answeredYes(parent))) return false;
    const confirmedSubregion = [...subregionQuestions].find((region) => this.answeredYes(region));
    if (confirmedSubregion && subregionQuestions.has(id) && id !== confirmedSubregion) return false;
    if (subregionQuestions.has(id) && !this.answeredYes("european")) return false;
    if (confirmedCountry && ((exactCountries.has(id) && id !== confirmedCountry) || regionQuestions.has(id) || subregionQuestions.has(id))) return false;
    if (this.answeredYes("european") && (nonEuropeanCountries.has(id) || [...regionQuestions].some((region) => region !== "european" && region === id))) return false;
    if (this.answeredYes("latinAmerican") && (["european", "asian", "african"].includes(id) || (exactCountries.has(id) && id !== "brazilian"))) return false;
    if (this.answeredYes("asian") && (["european", "latinAmerican", "african"].includes(id) || ["american", "british", "german", "french", "spanish", "italian", "canadian", "brazilian", "australian"].includes(id))) return false;
    if (this.answeredYes("african") && (["european", "latinAmerican", "asian"].includes(id) || exactCountries.has(id))) return false;
    const universes = ["marvel", "dc", "disney", "starWars", "pokemon"];
    if (universes.includes(id) && universes.some((universe) => universe !== id && this.answeredYes(universe))) return false;

    return true;
  }

  focusedTopics() {
    const confirmed = [...topicBranches].filter(([root]) => this.answeredYes(root));
    return confirmed.filter(([root]) => !confirmed.some(([other]) => other !== root && topicDescendants(root).has(other)));
  }

  questionFocusWeight(id, focused = this.focusedTopics()) {
    if (!focused.length) return 1;
    const universal = new Set(["real", "personallyKnown", "alive", "female", ...exactCountries, ...regionQuestions, ...subregionQuestions]);
    if (universal.has(id)) return .82;
    if (focused.some(([root]) => root === id || topicDescendants(root).has(id))) return 1.2;
    // Other profession roots remain available to discover overlapping careers,
    // but their low priority prevents a tour through every unrelated industry.
    if (topicBranches.has(id)) return .42;
    return .18;
  }

  nextQuestion() {
    const candidates = this.probabilities();
    const unasked = this.questions.filter((question) => !this.asked.has(question.id) && this.isRelevant(question));
    if (!unasked.length || !candidates.length) return null;
    const realityQuestion = unasked.find(({ id }) => id === "real");
    if (realityQuestion && this.answerCount === 0) {
      this.asked.add(realityQuestion.id);
      return realityQuestion;
    }
    const personalBranch = unasked.find(({ id }) => id === "personallyKnown");
    if (personalBranch && (this.answeredYes("real") || this.answeredNo("fictional"))) {
      this.asked.add(personalBranch.id);
      return personalBranch;
    }
    // The most probable candidates carry the useful decision boundary. Limiting
    // scoring to this normalized beam keeps 17k-person games responsive without
    // changing the final probability table or removing any candidate.
    const beam = candidates.length > 4000 ? candidates.slice(0, 4000) : candidates;
    const beamMass = beam.reduce((sum, { probability }) => sum + probability, 0) || 1;
    const selectionCandidates = beam.map((entry) => ({ ...entry, probability:entry.probability / beamMass }));
    let best = null;
    let bestValue = 0.0001;
    let bestBalanced = null;
    let bestBalancedValue = 0.0001;
    const focusedTopics = this.focusedTopics();
    for (const question of unasked) {
      let yesMass = 0;
      let knownMass = 0;
      let conditionalEntropy = 0;
      for (const { item, probability } of selectionCandidates) {
        const expected = item.attributes[question.id] ?? 0;
        if (Math.abs(expected) >= .5) knownMass += probability;
        const yesLikelihood = expected >= .5 ? .88 : expected <= -.5 ? .12 : .5;
        yesMass += probability * yesLikelihood;
        conditionalEntropy += probability * binaryEntropy(yesLikelihood);
      }
      const noMass = 1 - yesMass;
      if (yesMass <= 1e-9 || noMass <= 1e-9) continue;
      const gain = binaryEntropy(yesMass) - conditionalEntropy;
      const splitQuality = 1 - Math.abs(yesMass - noMass);
      const trainedBranchWeights = focusedTopics.map(([root]) => this.model.branchWeights?.[root]?.[question.id]).filter(Number.isFinite);
      const branchWeight = trainedBranchWeights.length ? Math.max(...trainedBranchWeights) : 1;
      const value = gain * (this.model.weights?.[question.id] || 1) * branchWeight * this.questionFocusWeight(question.id, focusedTopics) * (.72 + .28 * splitQuality);
      if (value > bestValue) { best = question; bestValue = value; }
      // Prefer a genuine near-half split when enough of the remaining probability
      // mass has a known trait. Fall back to maximum information gain otherwise.
      if (knownMass >= .55 && Math.max(yesMass, noMass) <= .62 && value > bestBalancedValue) {
        bestBalanced = question;
        bestBalancedValue = value;
      }
    }
    best = bestBalanced || best;
    if (!best) return null;
    this.asked.add(best.id);
    return best;
  }

  answer(questionId, answer) {
    const response = clamp(Number(answer), -1, 1);
    this.answerCount += 1;
    this.history.push({ questionId, answer: response });
    this.responses.set(questionId, response);
    this.probabilityCache = null;
    if (response === 0) return;
    for (const character of this.characters) {
      const key = this.key(character);
      if (this.rejected.has(key)) continue;
      const expected = character.attributes[questionId] ?? 0;
      const agreement = 1 - Math.abs(response - expected) / 2;
      const likelihood = expected === 0 ? .48 : .12 + .88 * agreement ** 2;
      this.scores.set(key, (this.scores.get(key) ?? 0) + Math.log(Math.max(.08, likelihood)));
    }
  }

  bestGuess() {
    const [best, second] = this.probabilities();
    if (!best) return null;
    const ratio = second ? best.probability / Math.max(.0001, second.probability) : 99;
    const evidence = clamp((this.answerCount - 4) / 10, 0, 1);
    const confidence = clamp(.38 + best.probability * 1.25 + Math.min(.22, Math.log2(ratio) * .055) + evidence * .1, .38, .98);
    return { character: best.item, confidence, probability: best.probability, ratio };
  }

  shouldGuess() {
    const best = this.bestGuess();
    if (!best) return false;
    if (this.lastRejectionAnswerCount !== null && this.answerCount - this.lastRejectionAnswerCount < 3) return false;
    const hasRelevantQuestion = this.questions.some((question) => !this.asked.has(question.id) && this.isRelevant(question));
    if (this.answerCount > 0 && !hasRelevantQuestion) return true;
    return (best.probability >= .82 && best.ratio >= 7)
      || (best.probability >= .62 && best.ratio >= 4)
      || best.probability >= .42;
  }

  reject(idOrName) {
    const match = this.characters.find((item) => this.key(item) === idOrName || item.name === idOrName);
    this.rejected.add(match ? this.key(match) : idOrName);
    this.lastRejectionAnswerCount = this.answerCount;
    this.probabilityCache = null;
  }
}
