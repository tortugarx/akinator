const highlightTerms = {
  de:["Inhalte für Erwachsene", "Gesellschaftskommentare", "Wirtschaftswissenschaften", "Singer-Songwriter", "Science-Fiction", "Technologieunternehmen", "American Football", "deutschsprachigen", "Just-Chatting", "Unterhaltung", "Journalismus", "Livestreaming", "Ingenieurwesen", "Schauspiel", "Wissenschaft", "Basketball", "Motorsport", "Minecraft", "Produktion", "Fabriken", "Industrie", "Fußball", "E-Sport", "YouTube", "Twitch", "TikTok", "Internet", "Politik", "Militär", "Medizin", "Gerichte", "religiös", "Popmusik", "Schlagermusik", "Latin-Musik", "K-Pop", "R&B", "Soul", "Jazz", "Oper", "Rock", "Musik", "Tennis", "Gaming", "Film", "Recht", "Magie"],
  en:["adult content", "social commentary", "computer science", "singer-songwriter", "science fiction", "technology company", "American football", "German-speaking", "Just Chatting", "entertainment", "social media", "livestreaming", "journalism", "engineering", "manufacturing", "acting", "science", "basketball", "motorsport", "Minecraft", "industry", "football", "esports", "YouTube", "Twitch", "TikTok", "internet", "politics", "military", "medicine", "courts", "religious", "pop music", "Latin music", "K-pop", "R&B", "soul", "jazz", "opera", "rock", "gaming", "music", "tennis", "movies", "law", "magic"]
};

export function contextualQuestionText(question, language, isPerson) {
  const text = question[language];
  if (!isPerson) return text;
  if (language === "de") return text
    .replaceAll("deine Figur oder Person", "diese Person")
    .replaceAll("deine Figur", "diese Person")
    .replaceAll("deiner Figur", "dieser Person")
    .replaceAll("Figur", "Person");
  return text
    .replaceAll("your character or person", "this person")
    .replaceAll("your character", "this person")
    .replaceAll("character", "person");
}

export function highlightedQuestionHtml(text, language) {
  const terms = highlightTerms[language].map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).sort((a,b) => b.length - a.length);
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(new RegExp(`(${terms.join("|")})`, "giu"), "<mark>$1</mark>");
}
