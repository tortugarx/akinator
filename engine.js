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

  nextQuestion() {
    const candidates = this.probabilities();
    const unasked = this.questions.filter(({ id }) => !this.asked.has(id));
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
