const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class GuessEngine {
  constructor(characters, questions) {
    this.characters = [...characters];
    this.questions = questions;
    this.reset();
  }

  reset() {
    this.scores = new Map(this.characters.map((item) => [this.key(item), 0]));
    this.asked = new Set();
    this.rejected = new Set();
    this.history = [];
    this.responses = new Map();
    this.answerCount = 0;
  }

  key(item) { return item.id ?? item.name; }

  addCharacter(character) {
    if (this.characters.some((item) => this.key(item) === this.key(character))) return;
    this.characters.push(character);
    this.scores.set(this.key(character), 0);
  }

  probabilities() {
    const available = this.characters.filter((item) => !this.rejected.has(this.key(item)));
    if (!available.length) return [];
    const ceiling = Math.max(...available.map((item) => this.scores.get(this.key(item)) ?? 0));
    const weighted = available.map((item) => ({ item, weight: Math.exp((this.scores.get(this.key(item)) ?? 0) - ceiling) }));
    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0) || 1;
    return weighted
      .map((entry) => ({ ...entry, probability: entry.weight / total }))
      .sort((a, b) => b.probability - a.probability);
  }

  response(id) { return this.responses.get(id); }

  answeredYes(id) { return (this.response(id) ?? 0) >= .8; }

  answeredNo(id) { return (this.response(id) ?? 0) <= -.8; }

  isRelevant(question) {
    const id = question.id;
    const realPerson = this.answeredYes("real") || this.answeredNo("fictional");
    const fictionalCharacter = this.answeredNo("real") || this.answeredYes("fictional");
    const fictionalOnly = new Set(["book", "magic", "superhero", "animated", "anime", "game", "villain", "powers", "nonhuman", "animal", "robot"]);
    const realOnly = new Set(["alive", "historical", "scientist", "artist", "entrepreneur", "internet"]);

    if (id === "fictional" && (this.answeredYes("real") || this.answeredNo("real"))) return false;
    if (id === "real" && (this.answeredYes("fictional") || this.answeredNo("fictional"))) return false;
    if (realPerson && fictionalOnly.has(id)) return false;
    if (fictionalCharacter && realOnly.has(id)) return false;
    if (id === "musicGroup" && this.answeredNo("musician")) return false;
    if (id === "football" && this.answeredNo("athlete")) return false;
    if (id === "anime" && this.answeredNo("animated")) return false;
    if ((id === "animal" || id === "robot" || id === "nonhuman") && this.answeredYes("human")) return false;
    if (id === "animal" && this.answeredNo("nonhuman")) return false;
    if (id === "robot" && this.answeredYes("animal")) return false;

    const regions = ["american", "european"];
    if (regions.includes(id) && regions.some((region) => region !== id && this.answeredYes(region))) return false;
    return true;
  }

  nextQuestion() {
    const candidates = this.probabilities();
    const unasked = this.questions.filter((question) => !this.asked.has(question.id) && this.isRelevant(question));
    if (!unasked.length || !candidates.length) return null;
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
    if (!best || this.answerCount < 8) return false;
    return (best.probability >= .34 && best.ratio >= 2.4) || this.answerCount >= 17;
  }

  reject(idOrName) {
    const match = this.characters.find((item) => this.key(item) === idOrName || item.name === idOrName);
    this.rejected.add(match ? this.key(match) : idOrName);
  }
}
