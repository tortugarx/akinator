// Reviewed factual additions. Never infer a negative from an absent credit.
const details=[
  {names:['Papaplatte','Reeze'],id:'reviewed:edeltalk',kind:'work',de:'Edeltalk (Podcast)',en:'Edeltalk (podcast)',source:'https://www.funk.net/formate/edeltalk-12381'},
  {names:['Gronkh'],id:'reviewed:minecraft-series',kind:'work',de:'Minecraft-Let’s-Play mit über 1.000 Folgen',en:'Minecraft Let’s Play series with over 1,000 episodes',source:'https://de.wikipedia.org/wiki/Gronkh'},
  {names:['Trymacs'],id:'reviewed:clash-royale',kind:'work',de:'Clash-Royale-Gamingvideos',en:'Clash Royale gaming videos',source:'https://de.wikipedia.org/wiki/Trymacs'},
  {names:['MontanaBlack'],id:'reviewed:cod-fifa',kind:'work',de:'Call-of-Duty- und FIFA-Streams',en:'Call of Duty and FIFA streams',source:'https://de.wikipedia.org/wiki/MontanaBlack'}
];
export function addReviewedDetails(person) {
  for(const {names,...fact} of details) if(names.includes(person.name)||(person.aliases||[]).some(name=>names.includes(name))) {
    person.facts=[...new Map([...(person.facts||[]),fact].map(value=>[value.id,value])).values()];
  }
  return person;
}
