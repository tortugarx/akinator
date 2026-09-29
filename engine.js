import { enrichCharacterAttributes } from "./attribute-enrichment.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const relationshipQuestions = new Set(["family", "parent", "sibling", "grandparent", "yourChild", "romantic", "partner", "friend", "schoolWork"]);
const exactCountries = new Set(["american", "british", "german", "french", "spanish", "italian", "canadian", "brazilian", "australian", "indian", "japanese", "southKorean", "chinese"]);
const regionQuestions = new Set(["european", "latinAmerican", "asian", "african"]);
const nonEuropeanCountries = new Set(["american", "canadian", "brazilian", "australian", "indian", "japanese", "southKorean", "chinese"]);
const topicBranches = new Map([
  ["entertainment", new Set(["actor", "musician", "comedian", "dancer", "model", "director", "producer", "presenter"])],
  ["musician", new Set(["musicGroup", "singer", "rapper", "composer", "dj", "instrumentalist"])],
  ["athlete", new Set(["football", "basketball", "tennis", "motorsport", "boxer", "wrestler", "racingDriver", "coach", "golfer", "cyclist", "swimmer", "runner", "baseball", "iceHockey", "gymnast", "esports"])],
  ["politician", new Set(["nationalLeader", "usPresident", "activist", "military", "militaryLeader", "royalty", "ministerDiplomat"])],
  ["military", new Set(["militaryLeader"])],
  ["actor", new Set(["movie", "tv", "comedian", "model", "adultCreator", "voiceActor"])],
  ["creator", new Set(["internet", "adultCreator", "gamer", "esports"])],
  ["scientist", new Set(["space", "electric", "physicist", "mathematician", "chemist", "biologist", "astronaut", "engineer", "inventor", "academic"])],
  ["artist", new Set(["photographer", "architect"])], ["entrepreneur", new Set(["internet", "industrialist"])], ["writer", new Set(["book", "poet", "screenwriter", "philosopher"])],
  ["comedian", new Set()], ["model", new Set()], ["director", new Set(["movie"])], ["internet", new Set()],
  ["adultCreator", new Set()], ["industrialist", new Set()], ["medical", new Set()], ["legal", new Set()], ["religious", new Set()],
  ["journalist", new Set(["presenter"])], ["producer", new Set()], ["dancer", new Set()], ["chef", new Set()]
]);

function topicDescendants(root, found = new Set()) {
  for (const child of topicBranches.get(root) || []) {
    if (found.has(child)) continue;
    found.add(child);
    topicDescendants(child, found);
  }
  return found;
}

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
    }
    const publicQuestions = new Set(this.questions.map(({ id:questionId }) => questionId).filter((questionId) => !relationshipQuestions.has(questionId)));
    const fictionalOnly = new Set(["book", "magic", "superhero", "animated", "anime", "game", "villain", "powers", "nonhuman", "animal", "robot", "marvel", "dc", "disney", "starWars", "pokemon", "horror", "princess", "protagonist", "comic", "scienceFiction", "fantasy", "alien", "monster", "harryPotter", "lordOfTheRings", "mario", "sonic"]);
    const realOnly = new Set(["alive", "historical", ...exactCountries, ...regionQuestions, "scientist", "artist", "entrepreneur", "internet", "nationalLeader", "usPresident", "activist", "military", "militaryLeader", "adultCreator", "industrialist", "medical", "legal", "religious", "journalist", "presenter", "producer", "dancer", "composer", "dj", "instrumentalist", "gamer", "esports", "boxer", "wrestler", "racingDriver", "coach", "golfer", "cyclist", "swimmer", "runner", "baseball", "iceHockey", "gymnast", "physicist", "mathematician", "chemist", "biologist", "astronaut", "engineer", "inventor", "photographer", "architect", "chef", "poet", "philosopher", "screenwriter", "voiceActor", "academic", "ministerDiplomat"]);

    if (id === "fictional" && (this.answeredYes("real") || this.answeredNo("real"))) return false;
    if (id === "real" && (this.answeredYes("fictional") || this.answeredNo("fictional"))) return false;
    if (id === "personallyKnown" && fictionalCharacter) return false;
    if (this.answeredNo("personallyKnown") && relationshipQuestions.has(id)) return false;
    if (this.answeredYes("personallyKnown") && publicQuestions.has(id)) return false;
    if (realPerson && fictionalOnly.has(id)) return false;
    if (fictionalCharacter && realOnly.has(id)) return false;
    if (relationshipQuestions.has(id) && this.answeredNo("real")) return false;
    if (["parent", "sibling", "grandparent", "yourChild"].includes(id) && this.answeredNo("family")) return false;
    if (this.answeredYes("family") && ["romantic", "partner", "friend", "schoolWork"].includes(id)) return false;
    if (this.answeredYes("romantic") && ["friend", "schoolWork"].includes(id)) return false;
    if (this.answeredYes("friend") && ["romantic", "partner", "schoolWork"].includes(id)) return false;
    if (this.answeredYes("schoolWork") && ["romantic", "partner", "friend"].includes(id)) return false;
    const familyRoles = ["parent", "sibling", "grandparent", "yourChild"];
    if (familyRoles.includes(id) && familyRoles.some((role) => role !== id && this.answeredYes(role))) return false;
    for (const [root] of topicBranches) {
      if (topicDescendants(root).has(id) && this.answeredNo(root)) return false;
    }
    const activeTopics = [...topicBranches].filter(([root]) => this.answeredYes(root));
    if (realPerson && activeTopics.length) {
      const allowed = new Set(activeTopics.flatMap(([root]) => [root, ...topicDescendants(root)]));
      const universal = new Set(["real", "personallyKnown", "alive", "female", "historical", ...exactCountries, ...regionQuestions]);
      if (!allowed.has(id) && !universal.has(id)) return false;
    }
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
    if (confirmedCountry && ((exactCountries.has(id) && id !== confirmedCountry) || regionQuestions.has(id))) return false;
    if (this.answeredYes("european") && (nonEuropeanCountries.has(id) || [...regionQuestions].some((region) => region !== "european" && region === id))) return false;
    if (this.answeredYes("latinAmerican") && (["european", "asian", "african"].includes(id) || (exactCountries.has(id) && id !== "brazilian"))) return false;
    if (this.answeredYes("asian") && (["european", "latinAmerican", "african"].includes(id) || ["american", "british", "german", "french", "spanish", "italian", "canadian", "brazilian", "australian"].includes(id))) return false;
    if (this.answeredYes("african") && (["european", "latinAmerican", "asian"].includes(id) || exactCountries.has(id))) return false;
    const universes = ["marvel", "dc", "disney", "starWars", "pokemon"];
    if (universes.includes(id) && universes.some((universe) => universe !== id && this.answeredYes(universe))) return false;

    return true;
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
    const currentEntropy = -candidates.reduce((sum, { probability }) => sum + probability * Math.log(Math.max(probability, 1e-12)), 0);
    let best = null;
    let bestValue = 0.0001;
    let bestBalanced = null;
    let bestBalancedValue = 0.0001;
    for (const question of unasked) {
      let yesMass = 0;
      let knownMass = 0;
      for (const { item, probability } of candidates) {
        const expected = item.attributes[question.id] ?? 0;
        if (Math.abs(expected) >= .5) knownMass += probability;
        const yesLikelihood = expected >= .5 ? .88 : expected <= -.5 ? .12 : .5;
        yesMass += probability * yesLikelihood;
      }
      const noMass = 1 - yesMass;
      if (yesMass <= 1e-9 || noMass <= 1e-9) continue;
      let yesEntropy = 0;
      let noEntropy = 0;
      for (const { item, probability } of candidates) {
        const expected = item.attributes[question.id] ?? 0;
        const yesLikelihood = expected >= .5 ? .88 : expected <= -.5 ? .12 : .5;
        const yesPosterior = probability * yesLikelihood / yesMass;
        const noPosterior = probability * (1 - yesLikelihood) / noMass;
        yesEntropy -= yesPosterior * Math.log(Math.max(yesPosterior, 1e-12));
        noEntropy -= noPosterior * Math.log(Math.max(noPosterior, 1e-12));
      }
      const gain = currentEntropy - yesMass * yesEntropy - noMass * noEntropy;
      const splitQuality = 1 - Math.abs(yesMass - noMass);
      const value = gain * (this.model.weights?.[question.id] || 1) * (.72 + .28 * splitQuality);
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
    const hasRelevantQuestion = this.questions.some((question) => !this.asked.has(question.id) && this.isRelevant(question));
    if (this.answerCount > 0 && !hasRelevantQuestion) return true;
    return (best.probability >= .82 && best.ratio >= 7)
      || (best.probability >= .62 && best.ratio >= 4)
      || best.probability >= .42;
  }

  reject(idOrName) {
    const match = this.characters.find((item) => this.key(item) === idOrName || item.name === idOrName);
    this.rejected.add(match ? this.key(match) : idOrName);
    this.probabilityCache = null;
  }
}
