// Generate discriminators from factual descriptions, never names or birthdays.
// Terms are evidence vocabulary, not a scripted sequence of questions.
export function generateAttributeQuestions(schema) {
  return schema.map(({id,de,en}) => ({ id,
    de:de.filter(Boolean).join(' ') + '?',
    en:en.filter(Boolean).join(' ') + '?', generated:true
  }));
}
const terms = [
  ['SPD', /\bSPD\b|social democratic/i], ['CDU', /\bCDU\b|christian democratic/i],
  ['CSU', /\bCSU\b/], ['Bündnis 90 / Die Grünen', /\bgrünen\b|green party/i],
  ['FDP', /\bFDP\b|free democratic/i], ['AfD', /\bAfD\b/],
  ['Republican Party', /republican party|republican politician/i],
  ['Democratic Party', /democratic party|democratic politician/i],
  ['Minecraft', /minecraft/i], ['Fortnite', /fortnite/i],
  ['League of Legends', /league of legends/i], ['Counter-Strike', /counter.strike/i],
  ['Grand Theft Auto', /grand theft auto|\bGTA\b/i], ['YouTube', /youtube/i],
  ['Twitch', /twitch/i], ['TikTok', /tiktok/i], ['OnlyFans', /onlyfans/i],
  ['Netflix', /netflix/i], ['Eurovision', /eurovision/i], ['Olympia', /olympic|olympia/i],
  ['Nobelpreis', /nobel/i], ['Oscar', /academy award|oscar/i],
  ['Gitarre', /guitar|gitarre/i], ['Klavier', /piano|pianist|klavier/i],
  ['Schlagzeug', /drummer|drums|schlagzeug/i], ['Violine', /violin/i],
  ['Hip-Hop', /hip.hop/i], ['Jazz', /jazz/i], ['Metal', /heavy metal|metal band/i],
  ['Manchester United', /manchester united/i], ['Bayern München', /bayern munich|bayern münchen/i],
  ['Real Madrid', /real madrid/i], ['FC Barcelona', /barcelona/i],
  ['Harry Potter', /harry potter/i], ['Star Wars', /star wars/i],
  ['Marvel', /marvel/i], ['Disney', /disney/i]
];

export function descriptionQuestions(people) {
  const generated = [];
  for (const [label, pattern] of terms) {
    const matches = people.filter((person) => pattern.test(person.description || ''));
    if (matches.length < 2 || matches.length === people.length) continue;
    const id = `evidence:${label}`;
    for (const person of people) {
      // Missing description evidence is unknown, not proof of absence.
      person.attributes[id] = pattern.test(person.description || '') ? 1 : 0;
    }
    generated.push({ id, de:`Ist deine Person mit ${label} verbunden?`, en:`Is your person associated with ${label}?`, generated:true });
  }
  return generated;
}

const groups = [
  [['musician','Musik','music'],['actor','Schauspiel','acting'],['athlete','Sport','sports'],['politician','Politik','politics'],['creator','Social Media','social media'],['scientist','Wissenschaft','science'],['writer','Literatur','literature'],['entrepreneur','Unternehmen','business']],
  [['german','Deutschland','Germany'],['british','Großbritannien','Britain'],['american','USA','the USA'],['french','Frankreich','France'],['italian','Italien','Italy'],['spanish','Spanien','Spain'],['indian','Indien','India'],['japanese','Japan','Japan']],
  [['popMusician','Pop','pop'],['rockMusician','Rock','rock'],['rapper','Rap','rap'],['classicalMusician','Klassik','classical music'],['jazzSinger','Jazz','jazz'],['electronicMusician','elektronischer Musik','electronic music']],
  [['gamingStreamer','Gaming','gaming'],['irlStreamer','IRL-Streams','IRL streams'],['politicalStreamer','Politik-Streams','political streams'],['vtuber','VTubing','VTubing']]
];

export function generateGroupedQuestions(candidates, relevant, asked) {
  const result = [];
  for (const [index, group] of groups.entries()) {
    const ranked = group.filter(([id]) => !asked.has(id) && relevant({id})).map((entry) => ({entry, mass:candidates.reduce((sum,{item,probability}) => sum + (item.attributes[entry[0]] === 1 ? probability : 0), 0)})).filter(({mass}) => mass > .03 && mass < .7).sort((a,b) => b.mass - a.mass);
    const chosen = [];
    let mass = 0;
    for (const {entry,mass:part} of ranked) {
      if (chosen.length >= 4 || (chosen.length >= 2 && mass >= .45)) break;
      if (mass + part > .75) continue;
      chosen.push(entry); mass += part;
    }
    if (chosen.length < 2) continue;
    const ids = chosen.map(([id]) => id).sort();
    const join = (language) => chosen.map((entry) => entry[language]).join(language === 1 ? ' oder ' : ' or ');
    result.push({id:`group:${ids.join('|')}`, featureIds:ids,
      de:index === 1 ? `Kommt deine Person aus ${join(1)}?` : `Ist deine Person für ${join(1)} bekannt?`,
      en:index === 1 ? `Is your person from ${join(2)}?` : `Is your person known for ${join(2)}?`, generated:true});
  }
  return result;
}
