// A small, locally trained Bayesian classifier. Missing facts are never labels.
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const logit = (p) => Math.log(p / (1 - p));
const knownSets = new WeakMap();

export function isImplicitNegative(person, id) {
  if ((person.attributes[id] || 0) >= 0 || !person.knownAttributes) return false;
  let known = knownSets.get(person.knownAttributes);
  if (!known) { known = new Set(person.knownAttributes); knownSets.set(person.knownAttributes, known); }
  return !known.has(id);
}

export function trainAnswerModel(people, ids, domains = {}) {
  const labels = people.map((person) => ids.map((id) => person.attributes[id] || 0));
  const classifiers = {};
  for (let target = 0; target < ids.length; target += 1) {
    const domain = domains[ids[target]];
    const eligible = labels.filter((_, index) => inDomain(people[index], domain));
    const positive = eligible.filter((row) => row[target] > 0);
    const negative = eligible.filter((row) => row[target] < 0);
    if (positive.length < 4 || negative.length < 4) continue;
    const prior = (positive.length + 2) / (positive.length + negative.length + 4);
    const features = [];
    for (let feature = 0; feature < ids.length; feature += 1) {
      if (feature === target) continue;
      let py = 0, pn = 0, ny = 0, nn = 0;
      for (const row of positive) { if (row[feature] > 0) py++; else if (row[feature] < 0) pn++; }
      for (const row of negative) { if (row[feature] > 0) ny++; else if (row[feature] < 0) nn++; }
      if (py + pn < 4 || ny + nn < 4) continue;
      const yes = (py + 2) / (py + pn + 4);
      const no = (ny + 2) / (ny + nn + 4);
      const reliability = Math.min(1, Math.min(py + pn, ny + nn) / 30);
      const positiveEvidence = clamp(Math.log(yes / no) * reliability, -4, 4);
      const negativeEvidence = clamp(Math.log((1 - yes) / (1 - no)) * reliability, -4, 4);
      if (Math.max(Math.abs(positiveEvidence), Math.abs(negativeEvidence)) < .2) continue;
      features.push([ids[feature], +positiveEvidence.toFixed(4), +negativeEvidence.toFixed(4)]);
    }
    classifiers[ids[target]] = { prior:+prior.toFixed(6), features, domain };
  }
  return { kind:"bayesian-answer-classifier", samples:people.length, classifiers, temperature:.3 };
}

export function predictAnswer(model, person, id) {
  const classifier = model?.classifiers?.[id];
  if (!classifier || !inDomain(person, classifier.domain)) return .5;
  const evidence = [];
  for (const [feature, yes, no] of classifier.features) {
    const value = person.attributes[feature] || 0;
    if (value < 0 && isImplicitNegative(person, feature)) continue;
    if (value) evidence.push(value > 0 ? yes : no);
  }
  if (!evidence.length) return .5;
  // Correlated facts must not multiply certainty without bound.
  evidence.sort((a, b) => Math.abs(b) - Math.abs(a));
  const score = logit(clamp(classifier.prior, .001, .999)) + (model.temperature ?? .3) * evidence.slice(0, 6).reduce((sum, n) => sum + n, 0);
  return clamp(1 / (1 + Math.exp(-score)), .25, .75);
}

export function inDomain(person, domain) {
  if (domain === "public") return person.attributes.real === 1 && person.attributes.personallyKnown !== 1;
  if (domain === "private") return person.attributes.personallyKnown === 1;
  if (domain === "fictional") return person.attributes.real === -1;
  return true;
}
