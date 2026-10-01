const highlightTerms = {
  de:["Inhalte für Erwachsene", "Erwachsenenfilmen", "Gesellschaftskommentare", "Wirtschaftswissenschaften", "Singer-Songwriter", "Science-Fiction", "League of Legends", "Technologieunternehmen", "American Football", "deutschsprachigen", "Just-Chatting", "Battle-Royale", "Unterhaltung", "Journalismus", "Livestreaming", "Ingenieurwesen", "Schauspiel", "Wissenschaft", "Basketball", "Motorsport", "Minecraft", "OnlyFans", "Bollywood", "Produktion", "Fabriken", "Industrie", "Fußball", "E-Sport", "YouTube", "Twitch", "TikTok", "Internet", "Politik", "Militär", "Medizin", "Gerichte", "religiös", "Popmusik", "Schlagermusik", "Latin-Musik", "K-Pop", "R&B", "Soul", "Jazz", "Oper", "Reggae", "Metal", "Rock", "Musik", "Tennis", "Gaming", "Film", "Recht", "Magie"],
  en:["adult-film", "adult content", "social commentary", "computer science", "singer-songwriter", "science fiction", "League of Legends", "technology company", "American football", "German-speaking", "Just Chatting", "battle-royale", "entertainment", "social media", "livestreaming", "journalism", "engineering", "manufacturing", "acting", "science", "basketball", "motorsport", "Minecraft", "OnlyFans", "Bollywood", "industry", "football", "esports", "YouTube", "Twitch", "TikTok", "internet", "politics", "military", "medicine", "courts", "religious", "pop music", "Latin music", "K-pop", "R&B", "soul", "jazz", "opera", "reggae", "metal", "rock", "gaming", "music", "tennis", "movies", "law", "magic"]
};

export function contextualQuestionText(question, language, kind) {
  const person = kind === true || kind === 'person';
  const fictional = kind === false || kind === 'fictional';
  const text = question[language];
  if (language === 'de') {
    const noun = person ? 'Person' : fictional ? 'Figur' : 'Person oder Figur';
    return text
      .replace(/\b(deine|deiner|diese|dieser) (?:Figur(?: oder Person)?|Person(?: oder Figur)?)/g,(_,pronoun)=>(pronoun.endsWith('r') ? 'dieser ' : 'diese ')+noun);
  }
  const noun = person ? 'person' : fictional ? 'character' : 'person or character';
  return text.replace(/\b(?:your|this) (?:character(?: or person)?|person(?: or character)?)/g,'this '+noun);
}

export function highlightedQuestionHtml(text, language) {
  const specific=language==='de' ? ['Auszeichnung','Partei','Sportverein','Position','Fachgebiet','Label','Konflikt','Universum','Instrument','Band'] : ['award','party','sports team','position','field','label','conflict','universe','instrument','band'];
  const terms = [...highlightTerms[language],...specific].map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).sort((a,b) => b.length - a.length);
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(new RegExp(`(„[^“]+“|“[^”]+”|${terms.join("|")})`, "giu"), "<mark>$1</mark>");
}
