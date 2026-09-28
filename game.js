import { characters, questions } from "./data.js";
import { GuessEngine } from "./engine.js";
import { platform } from "./platform.js";

const translations = {
  en: {
    speech:"Psst… I bet I know!", welcomeEyebrow:"THE SELF-LEARNING GUESSING GAME", welcomeTitle:"Think of <em>any</em><br>character.", welcomeText:"Real or fictional, movie star or TV character. Answer honestly – my magic does the rest.", start:"Let’s play!", welcomeHint:"The more you play, the smarter I get.", oracleAsks:"NAZAR ASKS", yes:"Yes", yesHint:"Definitely", probably:"Probably", probablyHint:"I think so", unknown:"Don't know", unknownHint:"Not sure", probablyNot:"Probably not", probablyNotHint:"I doubt it", no:"No", noHint:"Definitely not", vision:"I’VE GOT IT!", thinkingOf:"You are thinking of…", confidence:"Mind match", wasRight:"Did I read your mind?", correct:"Yes, incredible!", wrong:"No, keep trying", playAgain:"Play again", question:"QUESTION", focusing:"I’M THINKING", teachEyebrow:"YOU GOT ME", teachTitle:"Who were you thinking of?", teachText:"Tell me the name. I’ll look them up and remember your answers for the next game.", nameLabel:"Name of the person or character", learnButton:"Teach me", skip:"Start over instead", searching:"Searching the world’s knowledge…", learned:(name)=>`Got it! I’ll remember ${name}.`, learnedTitle:"I learned something new!", learnedText:(name)=>`${name} is now part of my local memory.`, successEyebrow:"MIND READ", successTitle:"Nazar knows!", successText:(n)=>`I found your character in ${n} questions.`
  },
  de: {
    speech:"Psst … ich weiß es bestimmt!", welcomeEyebrow:"DAS SELBSTLERNENDE RATESPIEL", welcomeTitle:"Denk an <em>irgendeine</em><br>Figur.", welcomeText:"Echt oder erfunden, Filmstar oder Serienfigur. Antworte ehrlich – den Rest erledigt meine Magie.", start:"Los geht’s!", welcomeHint:"Je öfter du spielst, desto schlauer werde ich.", oracleAsks:"NAZAR FRAGT", yes:"Ja", yesHint:"Ganz sicher", probably:"Wahrscheinlich", probablyHint:"Ich denke schon", unknown:"Weiß nicht", unknownHint:"Nicht sicher", probablyNot:"Eher nicht", probablyNotHint:"Ich bezweifle es", no:"Nein", noHint:"Ganz sicher nicht", vision:"ICH HAB’S!", thinkingOf:"Du denkst an …", confidence:"Gedanken-Treffer", wasRight:"Habe ich deine Gedanken gelesen?", correct:"Ja, unglaublich!", wrong:"Nein, weiterfragen", playAgain:"Noch einmal", question:"FRAGE", focusing:"ICH DENKE NACH", teachEyebrow:"DU HAST MICH ERWISCHT", teachTitle:"Wen hattest du im Kopf?", teachText:"Verrate mir den Namen. Ich suche die Figur und merke mir deine Antworten für das nächste Spiel.", nameLabel:"Name der Person oder Figur", learnButton:"Beibringen", skip:"Lieber neu starten", searching:"Ich durchsuche das Weltwissen …", learned:(name)=>`Verstanden! ${name} merke ich mir.`, learnedTitle:"Wieder etwas gelernt!", learnedText:(name)=>`${name} gehört jetzt zu meinem lokalen Gedächtnis.`, successEyebrow:"GEDANKEN GELESEN", successTitle:"Nazar weiß es!", successText:(n)=>`Ich habe deine Figur mit ${n} Fragen gefunden.`
  }
};

const $ = (selector) => document.querySelector(selector);
const screens = [...document.querySelectorAll(".screen")];
const storageKey = "nazar-learned-characters-v1";
const readLearned = () => {
  try { return JSON.parse(localStorage.getItem(storageKey) || "[]").filter((item) => item?.id && item?.name && item?.attributes); }
  catch { return []; }
};
const learnedCharacters = readLearned();
const engine = new GuessEngine([...characters, ...learnedCharacters], questions);
let language = "de";
let currentQuestion = null;
let currentGuess = null;
let soundEnabled = true;
let acceptingAnswer = true;

function showScreen(id) {
  screens.forEach((screen) => screen.classList.toggle("active", screen.id === id));
}

function setLanguage(next) {
  language = next;
  document.documentElement.lang = language;
  $("#language-button").textContent = language.toUpperCase();
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = translations[language][node.dataset.i18n];
    if (typeof value === "string") node.innerHTML = value;
  });
  $("#character-input").placeholder = language === "de" ? "z. B. Pippi Langstrumpf" : "e.g. Pippi Longstocking";
  if (currentQuestion) $("#question-text").textContent = currentQuestion[language];
  updateQuestionMeta();
}

function updateQuestionMeta() {
  $("#question-label").textContent = `${translations[language].question} ${engine.answerCount + 1}`;
  $("#focus-label").textContent = translations[language].focusing;
  $("#progress-bar").style.width = `${Math.min(96, Math.max(5, engine.answerCount / 18 * 100))}%`;
  $("#brain-count").textContent = `${engine.characters.length} ${language === "de" ? "Figuren" : "characters"}`;
}

function tone(frequency = 520) {
  if (!soundEnabled || platform.muted) return;
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine"; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.035, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .13);
    oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .14);
    oscillator.addEventListener("ended", () => context.close());
  } catch { /* Sound is optional. */ }
}

function startGame() {
  engine.reset(); currentGuess = null; currentQuestion = null; acceptingAnswer = true;
  $("#learn-status").textContent = ""; $("#character-input").value = "";
  platform.gameplayStart(); showScreen("question-screen"); askNext(); tone(480);
}

function askNext() {
  currentQuestion = engine.nextQuestion();
  acceptingAnswer = true;
  if (!currentQuestion) return showLearn();
  $("#question-text").textContent = currentQuestion[language];
  updateQuestionMeta();
  $("#question-text").animate?.([{ opacity:0, transform:"translateY(8px)" }, { opacity:1, transform:"none" }], { duration:220 });
}

function answer(value) {
  if (!currentQuestion || !acceptingAnswer) return;
  acceptingAnswer = false;
  const answeredQuestion = currentQuestion;
  currentQuestion = null;
  engine.answer(answeredQuestion.id, value);
  tone(value > 0 ? 610 : value < 0 ? 340 : 460);
  if (engine.shouldGuess()) revealGuess(); else askNext();
}

function revealGuess() {
  currentGuess = engine.bestGuess();
  if (!currentGuess) return showLearn();
  platform.gameplayStop();
  $("#guess-portrait").textContent = currentGuess.character.icon || "🧠";
  $("#guess-name").textContent = currentGuess.character.name;
  $("#guess-description").textContent = currentGuess.character.description || (language === "de" ? "Eine Figur aus Nazars Gedächtnis" : "A character from Nazar’s memory");
  $("#confidence-value").textContent = `${Math.round(currentGuess.confidence * 100)}%`;
  showScreen("guess-screen"); tone(720);
}

function continueAfterWrong() {
  if (!currentGuess) return showLearn();
  engine.reject(currentGuess.character.id ?? currentGuess.character.name);
  currentGuess = null;
  if (engine.rejected.size >= 5 || engine.answerCount >= 22 || !engine.probabilities().length) return showLearn();
  platform.gameplayStart(); showScreen("question-screen"); askNext();
}

function showLearn() { platform.gameplayStop(); currentQuestion = null; showScreen("learn-screen"); setTimeout(() => $("#character-input").focus(), 250); }

function showResult(title, text, learned = false) {
  $("#result-symbol").textContent = learned ? "☀" : "✦";
  $("#result-eyebrow").textContent = learned ? translations[language].teachEyebrow : translations[language].successEyebrow;
  $("#result-title").textContent = title; $("#result-text").textContent = text;
  showScreen("result-screen"); tone(880);
}

function showSuccess() {
  platform.happyTime();
  showResult(translations[language].successTitle, translations[language].successText(engine.answerCount));
}

async function findKnowledge(name) {
  const params = new URLSearchParams({ action:"wbsearchentities", search:name, language, uselang:language, type:"item", limit:"1", origin:"*", format:"json" });
  try {
    const response = await fetch(`https://www.wikidata.org/w/api.php?${params}`, { signal: AbortSignal.timeout?.(5000) });
    if (!response.ok) throw new Error("Search failed");
    const match = (await response.json()).search?.[0];
    return match ? { name:match.label, description:match.description || "", sourceId:match.id } : { name, description:"" };
  } catch { return { name, description:"" }; }
}

async function learnCharacter(event) {
  event.preventDefault();
  const input = $("#character-input");
  const requestedName = input.value.trim();
  if (!requestedName) return;
  const submit = $("#learn-form button[type='submit']"); submit.disabled = true;
  $("#learn-status").textContent = translations[language].searching;
  const knowledge = await findKnowledge(requestedName);
  const attributes = Object.fromEntries(questions.map(({ id }) => [id, 0]));
  for (const { questionId, answer } of engine.history) attributes[questionId] = answer;
  const character = {
    id: `learned-${(knowledge.sourceId || knowledge.name).toLowerCase().replace(/[^a-z0-9]+/g,"-")}`,
    name: knowledge.name, icon:"🧠", description: knowledge.description, attributes, learned:true
  };
  const saved = readLearned().filter(({ id }) => id !== character.id);
  saved.unshift(character);
  try { localStorage.setItem(storageKey, JSON.stringify(saved.slice(0, 150))); } catch { /* The game still works without storage. */ }
  engine.addCharacter(character); updateQuestionMeta();
  $("#learn-status").textContent = translations[language].learned(character.name); submit.disabled = false;
  setTimeout(() => showResult(translations[language].learnedTitle, translations[language].learnedText(character.name), true), 650);
}

$("#start-button").addEventListener("click", startGame);
$("#again-button").addEventListener("click", startGame);
$("#correct-button").addEventListener("click", showSuccess);
$("#wrong-button").addEventListener("click", continueAfterWrong);
$("#skip-learn-button").addEventListener("click", startGame);
$("#learn-form").addEventListener("submit", learnCharacter);
$("#answer-grid").addEventListener("click", (event) => { const button = event.target.closest("button[data-answer]"); if (button) answer(Number(button.dataset.answer)); });
$("#language-button").addEventListener("click", () => setLanguage(language === "en" ? "de" : "en"));
$("#sound-button").addEventListener("click", () => { soundEnabled = !soundEnabled; $("#sound-button").textContent = soundEnabled ? "♪" : "×"; tone(); });
window.addEventListener("keydown", (event) => { if (!$("#question-screen").classList.contains("active")) return; const keys={"1":1,"2":.55,"3":0,"4":-.55,"5":-1}; if (event.key in keys) answer(keys[event.key]); });
window.addEventListener("platformmute", () => { $("#sound-button").disabled = platform.muted; });

setLanguage((navigator.language || "de").toLowerCase().startsWith("de") ? "de" : "en");
setTimeout(() => showScreen("start-screen"), 320);
platform.init().then(() => { setLanguage(platform.locale().toLowerCase().startsWith("de") ? "de" : "en"); platform.loadingDone(); });
