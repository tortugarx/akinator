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
  // Structured, sourced facts are open-ended: new wiki facts create new
  // discriminators without a manually maintained question for every celebrity.
  const facts = new Map();
  for (const person of people) for (const fact of person.facts || []) {
    person.attributes[fact.id] = 1;
    if(fact.kind==='office' && /mitglied.*(?:bundestag|landtag|parlament|nationalversammlung)|member of.*(?:parliament|congress|assembly|legislature)/i.test(`${fact.de} ${fact.en}`)) person.attributes.legislator=1;
    if (!facts.has(fact.id)) facts.set(fact.id, fact);
  }
  const templates = {
      genre:fact=>[`Ist deine Person für ${fact.de} bekannt?`,`Is your person known for ${fact.en}?`],
      party:fact=>[`Ist oder war deine Person Mitglied der Partei „${fact.de}“?`,`Is or was your person a member of the political party “${fact.en}”?`],
      team:fact=>[`Hat deine Person für den Sportverein „${fact.de}“ gespielt?`,`Has your person played for the sports team “${fact.en}”?`],
      member:fact=>[`Ist oder war deine Person Mitglied von „${fact.de}“?`,`Is or was your person a member of “${fact.en}”?`],
      award:fact=>[`Hat deine Person die Auszeichnung „${fact.de}“ erhalten?`,`Has your person received the award “${fact.en}”?`],
      work:fact=>[`Ist deine Person für das Werk „${fact.de}“ bekannt?`,`Is your person known for the work “${fact.en}”?`],
      universe:fact=>[`Gehört deine Figur zum Universum „${fact.de}“?`,`Does your character belong to the universe “${fact.en}”?`],
      appearance:fact=>[`Kommt deine Figur in „${fact.de}“ vor?`,`Does your character appear in “${fact.en}”?`],
      instrument:fact=>[`Spielt deine Person ${fact.de}?`,`Does your person play ${fact.en}?`],
      office:fact=>[`Hat deine Person das Amt „${fact.de}“ ausgeübt?`,`Has your person held the office “${fact.en}”?`],
      position:fact=>[`Spielt oder spielte deine Person auf der Position „${fact.de}“?`,`Does or did your person play in the position “${fact.en}”?`],
      field:fact=>[`Ist deine Person im Fachgebiet „${fact.de}“ tätig oder tätig gewesen?`,`Does or did your person work in the field “${fact.en}”?`],
      label:fact=>[`Hat deine Person Musik beim Label „${fact.de}“ veröffentlicht?`,`Has your person released music on the label “${fact.en}”?`],
      conflict:fact=>[`War deine Person am Konflikt „${fact.de}“ beteiligt?`,`Was your person involved in the conflict “${fact.en}”?`],
      birthplace:fact=>[`Wurde deine Person in „${fact.de}“ geboren?`,`Was your person born in “${fact.en}”?`],
      education:fact=>[`Hat deine Person an der Einrichtung „${fact.de}“ gelernt oder studiert?`,`Did your person study at the institution “${fact.en}”?`],
      employer:fact=>[`Hat deine Person für „${fact.de}“ gearbeitet?`,`Has your person worked for “${fact.en}”?`]
    };
  for (const fact of facts.values()) {
    const text=templates[fact.kind]?.(fact);
    const aliases=fact.kind==='party' ? terms.slice(0,8).filter(([,pattern])=>pattern.test(`${fact.de} ${fact.en}`)).map(([label])=>`evidence:${label}`) : [];
    if(fact.kind==='office' && /bundeskanzler|chancellor of germany|federal chancellor/i.test(`${fact.de} ${fact.en}`)) aliases.push('chancellor');
    if(fact.kind==='office' && /präsident der vereinigten staaten|president of the united states/i.test(`${fact.de} ${fact.en}`)) aliases.push('usPresident');
    const redundantAfterYes=[];
    if(fact.kind==='genre') {
      const broadGenres=[['popMusician',/^(?:popmusik|pop music)$/i],['rockMusician',/^(?:rockmusik|rock music)$/i],['classicalMusician',/^(?:klassische musik|classical music)$/i],['electronicMusician',/^(?:elektronische musik|electronic music)$/i],['countryMusician',/^(?:country-musik|country music)$/i]];
      for(const [id,pattern] of broadGenres) if(pattern.test(fact.de)||pattern.test(fact.en)) redundantAfterYes.push(id);
    }
    if(fact.kind==='field') {
      const broadFields=[['politician',/^(?:politik|politics|politische betätigung|political activity)$/i],['mathematician',/^(?:mathematik|mathematics)$/i],['physicist',/^(?:physik|physics)$/i],['chemist',/^(?:chemie|chemistry)$/i],['biologist',/^(?:biologie|biology)$/i],['musician',/^(?:musik|music)$/i],['legal',/^(?:recht|rechtswissenschaft|jurisprudenz|law|jurisprudence)$/i],['medical',/^(?:medizin|medicine)$/i]];
      for(const [id,pattern] of broadFields) if(pattern.test(fact.de)||pattern.test(fact.en)) redundantAfterYes.push(id);
      if(redundantAfterYes.includes('politician')) redundantAfterYes.push('chancellor','usPresident','nationalLeader');
    }
    const implies=fact.kind==='office' && /mitglied.*(?:bundestag|landtag|parlament|nationalversammlung)|member of.*(?:parliament|congress|assembly|legislature)/i.test(`${fact.de} ${fact.en}`) ? ['legislator'] : [];
    if(text) generated.push({id:fact.id,kind:fact.kind,de:text[0],en:text[1],generated:true,source:fact.source,aliases,redundantAfterYes,implies});
  }
  // Different Wikidata items can share a label (e.g. Republican parties in
  // different countries). Such wording is ambiguous, not a valid discriminator.
  const deCounts=new Map(),enCounts=new Map();
  for(const question of generated) {
    deCounts.set(question.de,(deCounts.get(question.de)||0)+1);
    enCounts.set(question.en,(enCounts.get(question.en)||0)+1);
  }
  return generated.filter(question=>deCounts.get(question.de)===1 && enCounts.get(question.en)===1);
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
