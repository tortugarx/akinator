const highlightTerms = {
  de:["Inhalte für Erwachsene", "Schauspiel", "Wissenschaft", "Basketball", "Motorsport", "Produktion", "Fabriken", "Industrie", "Fußball", "Internet", "Politik", "Militär", "Medizin", "Gerichte", "religiös", "Musik", "Tennis", "Film", "Recht", "Magie"],
  en:["adult content", "social media", "manufacturing", "acting", "science", "basketball", "motorsport", "industry", "football", "internet", "politics", "military", "medicine", "courts", "religious", "music", "tennis", "movies", "law", "magic"]
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
