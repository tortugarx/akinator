import { characters, questions } from "./data.js";
import { GuessEngine } from "./engine.js";
import { platform } from "./platform.js";

const translations = {
  en: {
    welcomeEyebrow:"THE MIND-READING GAME", welcomeTitle:"Think of a character.<br><em>I’ll find them.</em>", welcomeText:"Real or fictional, famous or mysterious. Keep your character secret and answer honestly.", start:"Begin the ritual", welcomeHint:"No typing. No tricks. Just questions.", oracleAsks:"THE ORACLE ASKS", yes:"Yes", yesHint:"Definitely", probably:"Probably", probablyHint:"I think so", unknown:"Don't know", unknownHint:"Not sure", probablyNot:"Probably not", probablyNotHint:"I doubt it", no:"No", noHint:"Definitely not", vision:"THE VISION IS CLEAR", thinkingOf:"You are thinking of…", confidence:"Mind match", wasRight:"Did I read your mind?", correct:"Yes, incredible!", wrong:"No, keep trying", playAgain:"Play again",
    question:"QUESTION", focusing:"FOCUSING", successEyebrow:"MIND READ", successTitle:"The stars never lie.", successText:(n)=>`I found your character in ${n} questions.`, failEyebrow:"THE VISION FADES", failTitle:"You outsmarted the oracle.", failText:"Your character is not in my crystal ball… yet. Try another one!"
  },
  de: {
    welcomeEyebrow:"DAS GEDANKENLESE-SPIEL", welcomeTitle:"Denk an eine Figur.<br><em>Ich finde sie.</em>", welcomeText:"Echt oder erfunden, berühmt oder geheimnisvoll. Behalte deine Figur für dich und antworte ehrlich.", start:"Ritual beginnen", welcomeHint:"Kein Tippen. Keine Tricks. Nur Fragen.", oracleAsks:"DAS ORAKEL FRAGT", yes:"Ja", yesHint:"Ganz sicher", probably:"Wahrscheinlich", probablyHint:"Ich denke schon", unknown:"Weiß nicht", unknownHint:"Nicht sicher", probablyNot:"Eher nicht", probablyNotHint:"Ich bezweifle es", no:"Nein", noHint:"Ganz sicher nicht", vision:"DIE VISION IST KLAR", thinkingOf:"Du denkst an …", confidence:"Gedanken-Treffer", wasRight:"Habe ich deine Gedanken gelesen?", correct:"Ja, unglaublich!", wrong:"Nein, weiterfragen", playAgain:"Noch einmal",
    question:"FRAGE", focusing:"FOKUS", successEyebrow:"GEDANKEN GELESEN", successTitle:"Die Sterne lügen nie.", successText:(n)=>`Ich habe deine Figur mit ${n} Fragen gefunden.`, failEyebrow:"DIE VISION VERBLASST", failTitle:"Du hast das Orakel überlistet.", failText:"Deine Figur ist noch nicht in meiner Kristallkugel. Versuch es mit einer anderen!"
  }
};

const $ = (selector) => document.querySelector(selector);
const screens = [...document.querySelectorAll(".screen")];
const engine = new GuessEngine(characters, questions);
let language = "en";
let currentQuestion = null;
let currentGuess = null;
let soundEnabled = true;

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
  if (currentQuestion) $("#question-text").textContent = currentQuestion[language];
  updateQuestionMeta();
}

function updateQuestionMeta() {
  $("#question-label").textContent = `${translations[language].question} ${engine.answerCount + 1}`;
  $("#focus-label").textContent = translations[language].focusing;
  $("#progress-bar").style.width = `${Math.min(100, Math.max(6, engine.answerCount / 12 * 100))}%`;
}

function tone(frequency = 520) {
  if (!soundEnabled || platform.muted) return;
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.05, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .14);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + .15);
    oscillator.addEventListener("ended", () => context.close());
  } catch { /* Audio is optional. */ }
}

function startGame() {
  engine.reset();
  currentGuess = null;
  platform.gameplayStart();
  showScreen("question-screen");
  askNext();
  tone(480);
}

function askNext() {
  currentQuestion = engine.nextQuestion();
  if (!currentQuestion) return showFailure();
  $("#question-text").textContent = currentQuestion[language];
  updateQuestionMeta();
  $("#question-text").animate?.([{ opacity: 0, transform: "translateY(7px)" }, { opacity: 1, transform: "none" }], { duration: 260 });
}

function answer(value) {
  if (!currentQuestion) return;
  engine.answer(currentQuestion.id, value);
  tone(value > 0 ? 610 : value < 0 ? 340 : 460);
  if (engine.shouldGuess()) revealGuess(); else askNext();
}

function revealGuess() {
  currentGuess = engine.bestGuess();
  if (!currentGuess) return showFailure();
  platform.gameplayStop();
  $("#guess-portrait").textContent = currentGuess.character.icon;
  $("#guess-name").textContent = currentGuess.character.name;
  $("#guess-description").textContent = currentGuess.character.description;
  $("#confidence-value").textContent = `${Math.round(currentGuess.confidence * 100)}%`;
  showScreen("guess-screen");
  tone(720);
}

function continueAfterWrong() {
  engine.reject(currentGuess.character.name);
  if (engine.rejected.size >= 3 || engine.answerCount >= 20) return showFailure();
  platform.gameplayStart();
  showScreen("question-screen");
  askNext();
}

function showSuccess() {
  platform.happyTime();
  $("#result-symbol").textContent = "✦";
  $("#result-eyebrow").textContent = translations[language].successEyebrow;
  $("#result-title").textContent = translations[language].successTitle;
  $("#result-text").textContent = translations[language].successText(engine.answerCount);
  showScreen("result-screen");
  tone(880);
}

function showFailure() {
  platform.gameplayStop();
  $("#result-symbol").textContent = "☾";
  $("#result-eyebrow").textContent = translations[language].failEyebrow;
  $("#result-title").textContent = translations[language].failTitle;
  $("#result-text").textContent = translations[language].failText;
  showScreen("result-screen");
}

$("#start-button").addEventListener("click", startGame);
$("#again-button").addEventListener("click", startGame);
$("#correct-button").addEventListener("click", showSuccess);
$("#wrong-button").addEventListener("click", continueAfterWrong);
$("#answer-grid").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-answer]");
  if (button) answer(Number(button.dataset.answer));
});
$("#language-button").addEventListener("click", () => setLanguage(language === "en" ? "de" : "en"));
$("#sound-button").addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  $("#sound-button").textContent = soundEnabled ? "♪" : "×";
  $("#sound-button").setAttribute("aria-pressed", String(!soundEnabled));
  tone(520);
});

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", " "].includes(event.key)) event.preventDefault();
  if (!$("#question-screen").classList.contains("active")) return;
  const keys = { "1": 1, "2": .55, "3": 0, "4": -.55, "5": -1 };
  if (event.key in keys) answer(keys[event.key]);
});
window.addEventListener("wheel", (event) => event.preventDefault(), { passive: false });
window.addEventListener("platformmute", () => { $("#sound-button").disabled = platform.muted; });

setLanguage((navigator.language || "en").toLowerCase().startsWith("de") ? "de" : "en");
setTimeout(() => showScreen("start-screen"), 450);

// The public preview is hosted outside CrazyGames. Its SDK initialization can
// remain pending there, so the game must never wait for it before becoming playable.
platform.init().then(() => {
  setLanguage(platform.locale().toLowerCase().startsWith("de") ? "de" : "en");
  platform.loadingDone();
});
