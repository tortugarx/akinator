const highlightTerms = {
  de:["Inhalte für Erwachsene", "Wirtschaftswissenschaften", "Science-Fiction", "Technologieunternehmen", "American Football", "deutschsprachigen", "Unterhaltung", "Journalismus", "Livestreaming", "Ingenieurwesen", "Schauspiel", "Wissenschaft", "Basketball", "Motorsport", "Produktion", "Fabriken", "Industrie", "Fußball", "E-Sport", "YouTube", "TikTok", "Internet", "Politik", "Militär", "Medizin", "Gerichte", "religiös", "Popmusik", "Rock", "Musik", "Tennis", "Gaming", "Film", "Recht", "Magie"],
  en:["adult content", "computer science", "science fiction", "technology company", "American football", "German-speaking", "entertainment", "social media", "livestreaming", "journalism", "engineering", "manufacturing", "acting", "science", "basketball", "motorsport", "industry", "football", "esports", "YouTube", "TikTok", "internet", "politics", "military", "medicine", "courts", "religious", "pop music", "rock", "gaming", "music", "tennis", "movies", "law", "magic"]
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
