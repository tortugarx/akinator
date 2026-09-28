export class GuessEngine {
  constructor(characters, questions) {
    this.characters = characters;
    this.questions = questions;
    this.reset();
  }

  reset() {
    this.scores = new Map(this.characters.map((character) => [character.name, 0]));
    this.asked = new Set();
    this.rejected = new Set();
    this.answerCount = 0;
  }

  probabilities() {
    const available = this.characters.filter((item) => !this.rejected.has(item.name));
    const raw = available.map((item) => ({ item, weight: Math.exp(this.scores.get(item.name)) }));
    const total = raw.reduce((sum, entry) => sum + entry.weight, 0) || 1;
    return raw.map((entry) => ({ ...entry, probability: entry.weight / total })).sort((a, b) => b.probability - a.probability);
  }

  nextQuestion() {
    const candidates = this.probabilities();
    const unasked = this.questions.filter((question) => !this.asked.has(question.id));
    if (!unasked.length) return null;

    let best = unasked[0];
    let bestValue = -Infinity;
    for (const question of unasked) {
      let yes = 0;
      let known = 0;
      for (const { item, probability } of candidates) {
        const value = item.attributes[question.id] ?? -1;
        known += probability;
        yes += probability * ((value + 1) / 2);
      }
      if (!known) continue;
      const split = yes / known;
      const balance = 1 - Math.abs(.5 - split) * 2;
      const coverage = Math.min(1, known * 1.35);
      const value = balance * coverage;
      if (value > bestValue) {
        best = question;
        bestValue = value;
      }
    }
    this.asked.add(best.id);
    return best;
  }

  answer(questionId, answer) {
    this.answerCount += 1;
    for (const character of this.characters) {
      if (this.rejected.has(character.name)) continue;
      const expected = character.attributes[questionId] ?? -1;
      if (answer === 0) continue;
      const agreement = expected * answer;
      const certainty = Math.abs(answer);
      const delta = agreement > 0 ? 1.22 * certainty : -1.65 * certainty;
      this.scores.set(character.name, this.scores.get(character.name) + delta);
    }
  }

  bestGuess() {
    const [best, second] = this.probabilities();
    if (!best) return null;
    const separation = second ? Math.max(0, best.probability - second.probability) : 1;
    return { character: best.item, confidence: Math.min(.99, .48 + best.probability * 1.9 + separation) };
  }

  shouldGuess() {
    const best = this.bestGuess();
    return this.answerCount >= 6 && (best?.confidence >= .78 || this.answerCount >= 12);
  }

  reject(name) {
    this.rejected.add(name);
  }
}
