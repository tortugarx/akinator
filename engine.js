const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class GuessEngine {
  constructor(characters, questions) {
    this.characters = [...characters];
    this.questions = questions;
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
    const existing = this.charactersById.get(this.key(character)) || this.charactersByName.get(this.nameKey(character));
    if (existing) {
      existing.image ||= character.image;
      existing.source ||= character.source;
      existing.popularity = Math.max(existing.popularity || 0, character.popularity || 0);
      for (const [id, value] of Object.entries(character.attributes || {})) {
        if (value === 1) existing.attributes[id] = 1;
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
    const relationshipQuestions = new Set(["family", "parent", "sibling", "grandparent", "yourChild", "romantic", "partner", "friend", "schoolWork"]);
    const publicQuestions = new Set(["historical", "bornBefore1950", "bornAfter1990", "musician", "musicGroup", "singer", "rapper", "athlete", "football", "basketball", "tennis", "motorsport", "creator", "comedian", "model", "director", "politician", "scientist", "artist", "entrepreneur", "internet", "royalty", "american", "european", "british", "german", "canadian", "latinAmerican", "australian", "fictional", "magic", "superhero", "masked", "animated", "anime", "game", "space", "detective", "villain", "powers", "electric", "nonhuman", "movie", "tv", "book", "marvel", "dc", "disney", "starWars", "pokemon", "horror", "princess", "protagonist", "glasses", "hat", "blonde", "actor", "writer", "animal", "robot", "red", "initialAM", "initialAF", "initialAC", "initialGI", "initialNS", "initialNP", "initialTW"]);
    const fictionalOnly = new Set(["book", "magic", "superhero", "animated", "anime", "game", "villain", "powers", "nonhuman", "animal", "robot", "marvel", "dc", "disney", "starWars", "pokemon", "horror", "princess", "protagonist"]);
    const realOnly = new Set(["alive", "historical", "bornBefore1950", "bornAfter1990", "british", "german", "canadian", "latinAmerican", "australian", "scientist", "artist", "entrepreneur", "internet"]);

    if (id.startsWith("initial") && this.answerCount < 9) return false;

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
    if (id === "musicGroup" && this.answeredNo("musician")) return false;
    if ((id === "singer" || id === "rapper") && this.answeredNo("musician")) return false;
    if (id === "football" && this.answeredNo("athlete")) return false;
    if (["basketball", "tennis", "motorsport"].includes(id) && this.answeredNo("athlete")) return false;
    if (id === "anime" && this.answeredNo("animated")) return false;
    if ((id === "animal" || id === "robot" || id === "nonhuman") && this.answeredYes("human")) return false;
    if (id === "animal" && this.answeredNo("nonhuman")) return false;
    if (id === "robot" && this.answeredYes("animal")) return false;

    const regions = ["american", "european"];
    if (regions.includes(id) && regions.some((region) => region !== id && this.answeredYes(region))) return false;
    const countries = ["british", "german", "canadian", "latinAmerican", "australian"];
    if (countries.includes(id) && countries.some((country) => country !== id && this.answeredYes(country))) return false;
    const europeanCountries = ["british", "german"];
    const nonEuropeanCountries = ["american", "canadian", "latinAmerican", "australian"];
    if (this.answeredYes("european") && nonEuropeanCountries.includes(id)) return false;
    if (europeanCountries.some((country) => this.answeredYes(country)) && nonEuropeanCountries.includes(id)) return false;
    if (nonEuropeanCountries.some((country) => this.answeredYes(country)) && (id === "european" || europeanCountries.includes(id))) return false;
    if (this.answeredYes("american") && countries.includes(id)) return false;
    const universes = ["marvel", "dc", "disney", "starWars", "pokemon"];
    if (universes.includes(id) && universes.some((universe) => universe !== id && this.answeredYes(universe))) return false;

    if (["initialAF", "initialAC", "initialGI"].includes(id) && this.answeredNo("initialAM")) return false;
    if (["initialNS", "initialNP", "initialTW"].includes(id) && this.answeredYes("initialAM")) return false;
    if (id === "initialAC" && this.answeredNo("initialAF")) return false;
    if (id === "initialGI" && this.answeredYes("initialAF")) return false;
    if (id === "initialNP" && this.answeredNo("initialNS")) return false;
    if (id === "initialTW" && this.answeredYes("initialNS")) return false;
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
    let best = unasked[0];
    let bestValue = -1;
    for (const question of unasked) {
      const mean = candidates.reduce((sum, { item, probability }) => sum + probability * (item.attributes[question.id] ?? 0), 0);
      const variance = candidates.reduce((sum, { item, probability }) => {
        const expected = item.attributes[question.id] ?? 0;
        return sum + probability * ((expected - mean) ** 2);
      }, 0);
      const coverage = candidates.reduce((sum, { item, probability }) => sum + probability * Math.abs(item.attributes[question.id] ?? 0), 0);
      const value = variance * (.35 + .65 * coverage);
      if (value > bestValue) { best = question; bestValue = value; }
    }
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
