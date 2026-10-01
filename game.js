import { characters, questions } from "./data.js?v=26";
import { GuessEngine } from "./engine.js?v=26";
import { platform } from "./platform.js";
import { canStoreLearnedCharacter, findLocalKnowledge } from "./learning.js?v=26";
import { questionModel } from "./question-model.js?v=26";
import { playCount, recordConfirmedPlay, readPlayStats, recentPlays } from "./play-stats.js?v=26";
import { contextualQuestionText, highlightedQuestionHtml } from "./question-format.js?v=26";
import { LocalQuestionAI } from './llm-questions.js?v=26';

const translations = {
  en: {
    speech:"Psst… I bet I know!", welcomeEyebrow:"THE SELF-LEARNING GUESSING GAME", welcomeTitle:"Think of <em>any</em><br>character.", welcomeText:"A star, a fictional character or someone from your own life. Answer honestly – my magic does the rest.", start:"Let’s play!", welcomeHint:"The more you play, the smarter I get.", oracleAsks:"NAZAR ASKS", thinkingWait:"Nazar is narrowing down the people…", yes:"Yes", yesHint:"Definitely", probably:"Probably", probablyHint:"I think so", unknown:"Don't know", unknownHint:"Not sure", probablyNot:"Probably not", probablyNotHint:"I doubt it", no:"No", noHint:"Definitely not", vision:"I’VE GOT IT!", thinkingOf:"You are thinking of…", confidence:"Mind match", wasRight:"Did I read your mind?", correct:"Yes, incredible!", wrong:"No, keep trying", playAgain:"Play again", question:"QUESTION", focusing:"I’M THINKING", teachEyebrow:"YOU GOT ME", teachTitle:"Who were you thinking of?", teachText:"Tell me the name. I’ll search my local knowledge and remember your answers for the next game.", nameLabel:"Name of the person or character", learnButton:"Teach me", skip:"Start over instead", searching:"Searching local knowledge…", notVerified:"I could not verify this public person in the local knowledge base. Private people can only be added after answering that you know them personally.", learned:(name)=>`Got it! I’ll remember ${name}.`, learnedTitle:"I learned something new!", learnedText:(name)=>`${name} is now part of my local memory.`, successEyebrow:"MIND READ", successTitle:"Nazar knows!", successText:(n)=>`I found your character in ${n} questions.`
  },
  de: {
    speech:"Psst … ich weiß es bestimmt!", welcomeEyebrow:"DAS SELBSTLERNENDE RATESPIEL", welcomeTitle:"Denk an <em>irgendeine</em><br>Figur.", welcomeText:"Ein Star, eine fiktive Figur oder jemand aus deinem eigenen Leben. Antworte ehrlich – den Rest erledigt meine Magie.", start:"Los geht’s!", welcomeHint:"Je öfter du spielst, desto schlauer werde ich.", oracleAsks:"NAZAR FRAGT", thinkingWait:"Nazar grenzt die Personen ein …", yes:"Ja", yesHint:"Ganz sicher", probably:"Wahrscheinlich", probablyHint:"Ich denke schon", unknown:"Weiß nicht", unknownHint:"Nicht sicher", probablyNot:"Eher nicht", probablyNotHint:"Ich bezweifle es", no:"Nein", noHint:"Ganz sicher nicht", vision:"ICH HAB’S!", thinkingOf:"Du denkst an …", confidence:"Gedanken-Treffer", wasRight:"Habe ich deine Gedanken gelesen?", correct:"Ja, unglaublich!", wrong:"Nein, weiterfragen", playAgain:"Noch einmal", question:"FRAGE", focusing:"ICH DENKE NACH", teachEyebrow:"DU HAST MICH ERWISCHT", teachTitle:"Wen hattest du im Kopf?", teachText:"Verrate mir den Namen. Ich suche lokal und merke mir deine Antworten für das nächste Spiel.", nameLabel:"Name der Person oder Figur", learnButton:"Beibringen", skip:"Lieber neu starten", searching:"Ich durchsuche mein lokales Wissen …", notVerified:"Diese öffentliche Person konnte ich in der lokalen Wissensbasis nicht überprüfen. Private Personen lassen sich nur hinzufügen, wenn du zuvor angegeben hast, dass du sie persönlich kennst.", learned:(name)=>`Verstanden! ${name} merke ich mir.`, learnedTitle:"Wieder etwas gelernt!", learnedText:(name)=>`${name} gehört jetzt zu meinem lokalen Gedächtnis.`, successEyebrow:"GEDANKEN GELESEN", successTitle:"Nazar weiß es!", successText:(n)=>`Ich habe deine Figur mit ${n} Fragen gefunden.`
  }
};

const $ = (selector) => document.querySelector(selector);
const screens = [...document.querySelectorAll(".screen")];
const storageKey = "nazar-learned-characters-v1";
const buildVersion = 26;
const readLearned = () => {
  try { return JSON.parse(localStorage.getItem(storageKey) || "[]").filter((item) => item?.id && item?.name && item?.attributes); }
  catch { return []; }
};
const learnedCharacters = readLearned();
const engine = new GuessEngine([...characters, ...learnedCharacters], questions, questionModel);
let language = "de";
let currentQuestion = null;
let currentGuess = null;
let soundEnabled = true;
let acceptingAnswer = true;
let addingFromHome = false;
let thinkingTimer = null;
let engineMode = 'ai';
let aiEpoch = 0;
let retryQuestion = false;
try { engineMode = localStorage.getItem('nazar-engine-mode') === 'classic' ? 'classic' : 'ai'; } catch { /* Optional preferences. */ }
const localAI = new LocalQuestionAI({onProgress:updateAIProgress});
try { soundEnabled = localStorage.getItem('nazar-sound') !== 'off'; } catch { /* Optional preferences. */ }

function showScreen(id) {
  if (id === 'start-screen') renderHome();
  screens.forEach((screen) => screen.classList.toggle("active", screen.id === id));
}

function updateAIProgress(event) {
  const message = $('#ai-load-message');
  const progress = $('#ai-load-progress');
  if (!message || !progress) return;
  const de = language === 'de';
  const text = {
    init:de ? 'Das lokale Modell wird geladen …' : 'Loading the local model …',
    download:de ? 'Modellteile werden geladen und geprüft …' : 'Loading and verifying model parts …',
    compile:de ? 'Das Modell wird auf diesem Gerät eingerichtet …' : 'Preparing the model on this device …',
    ready:de ? 'Lokale KI bereit.' : 'Local AI ready.',
    thinking:de ? 'Die lokale KI formuliert eine neue Frage …' : 'The local AI is generating a new question …'
  };
  message.textContent = text[event.phase] || '';
  if (event.total) { progress.value = Math.round(event.loaded/event.total*100); $('#ai-load-detail').textContent = `${Math.round(event.loaded/1e6)} / ${Math.round(event.total/1e6)} MB`; }
  else if (event.phase === 'ready') progress.value = 100;
  else progress.removeAttribute?.('value');
}

function setEngineMode(mode) {
  engineMode = mode;
  try { localStorage.setItem('nazar-engine-mode',mode); } catch { /* Optional. */ }
  if ($('#ai-mode')) $('#ai-mode').checked = mode === 'ai';
  renderHome();
}

function aiError(error,questionStage = false) {
  retryQuestion = questionStage;
  showScreen('ai-load-screen');
  $('#ai-load-title').textContent = language === 'de' ? 'KI konnte nicht fortfahren' : 'AI could not continue';
  $('#ai-load-message').textContent = error.message;
  $('#ai-retry-button').hidden = false;
  $('#ai-load-progress').hidden = true;
  $('#ai-load-detail').textContent = language === 'de' ? 'Es wurde nicht heimlich in den klassischen Modus gewechselt.' : 'The game has not silently switched to classic mode.';
}

function questionText(question) {
  return contextualQuestionText(question, language, engine.isRealPerson());
}

function renderQuestion(question) {
  const node = $("#question-text");
  const text = questionText(question);
  node.textContent = text;
  node.innerHTML = highlightedQuestionHtml(text, language);
}

const nextPaint = () => new Promise((resolve) => {
  const frame = globalThis.requestAnimationFrame || ((callback) => setTimeout(callback, 0));
  frame(() => frame(resolve));
});

function resetAnswerButtons() {
  document.querySelectorAll("#answer-grid button[data-answer]").forEach((button) => {
    button.disabled = false;
    button.classList.toggle("is-selected", false);
    button.blur?.();
  });
}

function setThinking(active, selectedButton = null) {
  const lock = $("#thinking-lock");
  clearTimeout(thinkingTimer);
  if (lock) lock.hidden = true;
  if (active) thinkingTimer = setTimeout(() => { if (lock) lock.hidden = false; }, 350);
  if ($('#thinking-cancel')) $('#thinking-cancel').hidden = engineMode !== 'ai';
  document.querySelectorAll("#answer-grid button[data-answer]").forEach((button) => {
    button.disabled = active;
    button.classList.toggle("is-selected", active && button === selectedButton);
  });
}

function renderHome() {
  const stats = readPlayStats();
  const render = (selector, ids) => {
    const node = $(selector);
    if (!node) return;
    node.replaceChildren();
    for (const id of ids.slice(0, 8)) {
      const person = engine.charactersById.get(id);
      if (!person) continue;
      const tile = document.createElement('div'); tile.className = 'person-tile';
      const portrait = document.createElement(person.image ? 'img' : 'span');
      if (person.image) { portrait.src = person.image; portrait.alt = person.name; portrait.loading = 'lazy'; portrait.referrerPolicy = 'no-referrer'; portrait.addEventListener('error', () => { portrait.hidden = true; }, { once:true }); }
      else { portrait.className = 'person-icon'; portrait.textContent = person.icon || '👤'; }
      const name = document.createElement('strong'); name.textContent = person.name;
      const count = document.createElement('small'); count.textContent = `${Number(stats[id] || 0)} ×`;
      tile.append(portrait, name, count); node.append(tile);
      if (person.imageAttribution) {
        const allowed = person.imageAttribution.sourceUrl && platform.externalLinksAllowed();
        const credit = document.createElement(allowed ? 'a' : 'small');
        if (allowed) { credit.href = person.imageAttribution.sourceUrl; credit.target = '_blank'; credit.rel = 'noopener noreferrer'; }
        credit.className = 'tile-credit';
        credit.textContent = `${person.imageAttribution.creator} · ${person.imageAttribution.license}`;
        tile.append(credit);
      }
    }
    if (!node.childNodes?.length) node.textContent = language === 'de' ? 'Noch keine bestätigten Spiele. Dein erster Treffer erscheint hier.' : 'No confirmed games yet. Your first match will appear here.';
  };
  render('#recent-people', recentPlays());
  render('#popular-people', Object.keys(stats).sort((a,b) => Number(stats[b]) - Number(stats[a])));
  const labels = { 'add-person-button':['Person hinzufügen','Add person'], 'share-button':['Teilen','Share'], 'settings-button':['Einstellungen','Settings'], 'recent-title':['Zuletzt gespielt','Recently played'], 'popular-title':['Meistgespielt','Most played'], 'stats-scope':['Auf diesem Gerät · bestätigte Treffer','On this device · confirmed matches'], 'settings-title':['Einstellungen','Settings'], 'settings-back':['Zur Startseite','Home'], 'info-title':['Über das Spiel','About the game'], 'info-text':['Ein lokales Ratespiel. Antworten und Statistiken bleiben auf diesem Gerät. Keine globale Synchronisierung.','A local guessing game. Answers and statistics stay on this device. No global synchronization.'] };
  Object.assign(labels,{'ai-mode-label':['Echtes lokales Sprachmodell verwenden','Use real local language model'],'ai-mode-help':['Ohne Haken: klassischer Merkmalsmodus, kein Sprachmodell. Mit KI: ca. 1,25 GB Download; geeignete WebGPU-Grafik und mehrere GB freier Arbeitsspeicher erforderlich.','Unchecked: classic feature mode, no language model. AI: about 1.25 GB download; suitable WebGPU graphics and several GB of free memory required.'],'ai-download-hint':[engineMode === 'ai' ? 'Lokale KI (experimentell): WebGPU erforderlich, einmalig ca. 1,25 GB Download. Berechnung auf deinem Gerät.' : 'Klassischer Merkmalsmodus · ohne Sprachmodell.',engineMode === 'ai' ? 'Local AI (experimental): WebGPU required, about 1.25 GB download once. Computation on your device.' : 'Classic feature mode · no language model.'],'ai-retry-button':['Erneut versuchen','Retry'],'ai-classic-button':['Klassisch ohne Sprachmodell spielen','Play classic without language model'],'ai-cancel-button':['Abbrechen','Cancel'],'thinking-cancel':['Abbrechen · zur Startseite','Cancel · go home']});
  for (const [id, values] of Object.entries(labels)) if ($(`#${id}`)) $(`#${id}`).textContent = values[language === 'de' ? 0 : 1];
  if ($('#settings-sound')) $('#settings-sound').textContent = `Sound: ${soundEnabled ? (language === 'de' ? 'An' : 'On') : (language === 'de' ? 'Aus' : 'Off')}`;
  if ($('#ai-mode')) $('#ai-mode').checked = engineMode === 'ai';
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  try { localStorage.setItem('nazar-sound', soundEnabled ? 'on' : 'off'); } catch { /* Optional. */ }
  $('#sound-button').textContent = soundEnabled ? '♪' : '×'; renderHome(); tone();
}

const characterKey = (character) => character.id ?? character.name;
const localPlayText = (count) => language === "de"
  ? `${count}-mal auf diesem Gerät bestätigt`
  : `Confirmed ${count} time${count === 1 ? "" : "s"} on this device`;

function setLanguage(next) {
  language = next;
  document.documentElement.lang = language;
  $("#language-button").textContent = language.toUpperCase();
  $("#sound-button").textContent = soundEnabled ? '♪' : '×';
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = translations[language][node.dataset.i18n];
    if (typeof value === "string") node.innerHTML = value;
  });
  $("#character-input").placeholder = language === "de" ? "z. B. Pippi Langstrumpf" : "e.g. Pippi Longstocking";
  if (currentQuestion) renderQuestion(currentQuestion);
  updateQuestionMeta();
  renderHome();
}

function updateQuestionMeta() {
  $("#question-label").textContent = `${translations[language].question} ${engine.answerCount + 1}`;
  $("#focus-label").textContent = translations[language].focusing;
  $("#progress-bar").style.width = `${Math.round(5 + engine.certainty() * 91)}%`;
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

async function startGame() {
  if (!acceptingAnswer) return;
  const epoch = ++aiEpoch;
  acceptingAnswer = false;
  retryQuestion = false;
  if (engineMode === 'ai' && !localAI.ready) {
    showScreen('ai-load-screen');
    $('#ai-load-title').textContent = language === 'de' ? 'KI wird vorbereitet' : 'Preparing local AI';
    $('#ai-retry-button').hidden = true; $('#ai-load-progress').hidden = false;
    try { await localAI.load(); }
    catch (error) { if (epoch === aiEpoch) { aiError(error); acceptingAnswer = true; } return; }
    if (epoch !== aiEpoch) return;
  }
  addingFromHome = false;
  engine.reset(); currentGuess = null; currentQuestion = null; acceptingAnswer = true;
  $("#learn-status").textContent = ""; $("#character-input").value = "";
  platform.gameplayStart(); showScreen("question-screen"); setThinking(true);
  try { await askNext(); tone(480); }
  catch (error) { if (epoch === aiEpoch) { console.error('Could not choose the first question.',error); engineMode === 'ai' ? aiError(error,true) : showLearn(); } }
  finally { if (epoch === aiEpoch) { acceptingAnswer = true; setThinking(false); } }
}

async function askNext() {
  const epoch = aiEpoch;
  const checkEpoch = () => { if (epoch !== aiEpoch) throw Error('KI-Vorgang abgebrochen.'); };
  acceptingAnswer = false;
  if (engineMode === 'ai') {
    const context = await engine.aiQuestionContext(language);
    checkEpoch();
    if (!context.features.length) currentQuestion = null;
    else {
      currentQuestion = null;
      for (let attempt=0;attempt<2 && !currentQuestion;attempt++) {
        const requestContext = attempt === 0 ? context : {...context,features:context.features.slice(0,1)};
        const proposals = await localAI.propose(requestContext,language);
        checkEpoch();
        currentQuestion = engine.chooseAIQuestion(proposals,language);
      }
      if (!currentQuestion) throw Error(language === 'de' ? 'Das Modell hat keine ausreichend belegte, neue Frage erzeugt. Du kannst erneut versuchen oder den klassischen Modus wählen.' : 'The model did not generate a grounded new question. Retry or explicitly choose classic mode.');
    }
  } else { currentQuestion = await engine.nextQuestionAsync(); checkEpoch(); }
  acceptingAnswer = true;
  if (!currentQuestion) return engine.shouldGuess() ? revealGuess() : showLearn();
  resetAnswerButtons();
  renderQuestion(currentQuestion);
  updateQuestionMeta();
  $("#question-text").getAnimations?.().forEach((animation) => animation.cancel());
  $("#question-text").animate?.([{ opacity:0, transform:"translateY(8px)" }, { opacity:1, transform:"none" }], { duration:220 });
}

async function answer(value, selectedButton = null) {
  if (!currentQuestion || !acceptingAnswer) return;
  acceptingAnswer = false;
  const epoch = aiEpoch;
  const answeredQuestion = currentQuestion;
  currentQuestion = null;
  setThinking(true, selectedButton);
  await nextPaint();
  try {
    engine.answer(answeredQuestion.id, value);
    tone(value > 0 ? 610 : value < 0 ? 340 : 460);
    if (engine.shouldGuess()) revealGuess(); else await askNext();
  } catch (error) {
    if (epoch === aiEpoch) {
      console.error("The question flow recovered from an error.", error);
      engineMode === 'ai' ? aiError(error,true) : showLearn();
    }
  } finally {
    if (epoch === aiEpoch) { acceptingAnswer = true; setThinking(false); }
  }
}

function revealGuess() {
  currentGuess = engine.bestGuess();
  if (!currentGuess) return showLearn();
  platform.gameplayStop();
  const portrait = $("#guess-portrait");
  portrait.replaceChildren();
  if (currentGuess.character.image) {
    const image = document.createElement("img");
    image.src = currentGuess.character.image;
    image.alt = currentGuess.character.name;
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => { portrait.textContent = currentGuess.character.icon || "👤"; }, { once:true });
    portrait.append(image);
  } else {
    portrait.textContent = currentGuess.character.icon || "🧠";
  }
  $("#guess-name").textContent = currentGuess.character.name;
  $("#guess-description").textContent = currentGuess.character.description || (language === "de" ? "Eine Figur aus Nazars Gedächtnis" : "A character from Nazar’s memory");
  const source = $("#guess-source");
  source.hidden = !currentGuess.character.source || !platform.externalLinksAllowed();
  source.href = currentGuess.character.source || "#";
  const credit = $("#image-credit");
  const attribution = currentGuess.character.imageAttribution;
  const creditLinkAllowed = attribution?.sourceUrl && platform.externalLinksAllowed();
  credit.hidden = !attribution;
  if (creditLinkAllowed) credit.href = attribution.sourceUrl;
  else credit.removeAttribute("href");
  credit.textContent = attribution
    ? `${language === "de" ? "Bild" : "Image"}: ${attribution.creator} · ${attribution.license}${creditLinkAllowed ? " ↗" : ""}`
    : "";
  $("#guess-play-count").textContent = localPlayText(playCount(characterKey(currentGuess.character)));
  $("#confidence-value").textContent = `${Math.round(currentGuess.confidence * 100)}%`;
  showScreen("guess-screen"); tone(720);
}

async function continueAfterWrong() {
  const epoch = aiEpoch;
  if (!currentGuess) return showLearn();
  engine.reject(currentGuess.character.id ?? currentGuess.character.name);
  currentGuess = null;
  if (engine.rejected.size >= 8 || !engine.probabilities().length) return showLearn();
  platform.gameplayStart(); showScreen("question-screen"); setThinking(true);
  await nextPaint();
  try { await askNext(); }
  catch (error) { if (epoch === aiEpoch) engineMode === 'ai' ? aiError(error,true) : showLearn(); }
  finally { if (epoch === aiEpoch) { acceptingAnswer = true; setThinking(false); } }
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
  const count = currentGuess ? recordConfirmedPlay(characterKey(currentGuess.character)) : 0;
  showResult(translations[language].successTitle, `${translations[language].successText(engine.answerCount)} ${localPlayText(count)}.`);
}

async function findKnowledge(name) {
  return findLocalKnowledge(name, engine.characters);
}

async function learnCharacter(event) {
  event.preventDefault();
  const input = $("#character-input");
  const requestedName = input.value.trim();
  if (!requestedName) return;
  const submit = $("#learn-form button[type='submit']"); submit.disabled = true;
  $("#learn-status").textContent = translations[language].searching;
  const knowledge = await findKnowledge(requestedName);
  const privatePerson = engine.answeredYes("personallyKnown");
  if (!canStoreLearnedCharacter(knowledge, privatePerson, engine.response("real"))) {
    $("#learn-status").textContent = translations[language].notVerified;
    submit.disabled = false;
    return;
  }
  const attributes = { ...Object.fromEntries(questions.map(({ id }) => [id, 0])), ...knowledge.attributes };
  if (!addingFromHome) for (const { questionId, answer } of engine.history) if (answer !== 0 && !questionId.startsWith('group:') && !questionId.startsWith('all:')) attributes[questionId] = answer;
  const character = {
    id: `learned-${(knowledge.sourceId || knowledge.name).toLowerCase().replace(/[^a-z0-9]+/g,"-")}`,
    name: knowledge.name, icon:"🧠", description: knowledge.description, image:knowledge.image, imageAttribution:knowledge.imageAttribution, source:knowledge.source, attributes, learned:true
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
$("#answer-grid").addEventListener("click", (event) => { const button = event.target.closest("button[data-answer]"); if (button) return answer(Number(button.dataset.answer), button); });
$("#language-button").addEventListener("click", () => setLanguage(language === "en" ? "de" : "en"));
$("#sound-button").addEventListener("click", toggleSound);
$('#settings-sound')?.addEventListener('click', toggleSound);
$('#ai-mode')?.addEventListener('change',(event)=>setEngineMode(event.target.checked ? 'ai' : 'classic'));
$('#ai-cancel-button')?.addEventListener('click',()=>{ ++aiEpoch; localAI.cancel(); acceptingAnswer = true; setThinking(false); showScreen('start-screen'); });
$('#thinking-cancel')?.addEventListener('click',()=>{ ++aiEpoch; localAI.cancel(); acceptingAnswer = true; setThinking(false); platform.gameplayStop(); showScreen('start-screen'); });
$('#ai-classic-button')?.addEventListener('click',()=>{ ++aiEpoch; localAI.cancel(); acceptingAnswer = true; setEngineMode('classic'); startGame(); });
$('#ai-retry-button')?.addEventListener('click',async()=>{
  if (!acceptingAnswer) return;
  if (!retryQuestion || !localAI.ready) return startGame();
  const epoch = aiEpoch;
  showScreen('question-screen'); setThinking(true);
  try { await askNext(); } catch (error) { if (epoch === aiEpoch) aiError(error,true); }
  finally { if (epoch === aiEpoch) { acceptingAnswer = true; setThinking(false); } }
});
$('#settings-button')?.addEventListener('click', () => { renderHome(); showScreen('settings-screen'); });
$('#settings-back')?.addEventListener('click', () => showScreen('start-screen'));
$('.brand')?.addEventListener('click', (event) => { event.preventDefault(); ++aiEpoch; if (!acceptingAnswer) localAI.cancel(); acceptingAnswer = true; setThinking(false); platform.gameplayStop(); showScreen('start-screen'); });
$('#add-person-button')?.addEventListener('click', () => { engine.reset(); addingFromHome = true; $('#learn-status').textContent = ''; $('#character-input').value = ''; showLearn(); });
$('#share-button')?.addEventListener('click', async () => {
  const status = $('#home-status');
  if (!platform.externalLinksAllowed()) { status.textContent = language === 'de' ? 'Teilen ist auf dieser Plattform nicht verfügbar.' : 'Sharing is unavailable on this platform.'; return; }
  const url = 'https://tortugarx.github.io/akinator/';
  try { if (navigator.share) await navigator.share({ title:'Nazar', text:'Kann Nazar deine Gedanken lesen?', url }); else { await navigator.clipboard.writeText(url); status.textContent = language === 'de' ? 'Link kopiert!' : 'Link copied!'; } }
  catch (error) { if (error.name !== 'AbortError') status.textContent = url; }
});
window.addEventListener("keydown", (event) => { if (!$("#question-screen").classList.contains("active")) return; const keys={"1":1,"2":.55,"3":0,"4":-.55,"5":-1}; if (event.key in keys) answer(keys[event.key], document.querySelector(`#answer-grid button[data-answer="${keys[event.key]}"]`)); });
window.addEventListener("platformmute", () => { $("#sound-button").disabled = platform.muted; });
document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive:false });
document.addEventListener("dblclick", (event) => event.preventDefault(), { passive:false });

async function loadKnowledgeBase() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`wikidata-people.json?v=${buildVersion}`, { signal:controller.signal });
    if (!response.ok) throw new Error("Knowledge base unavailable");
    const database = await response.json();
    for (const character of database.characters || []) engine.addCharacter(character);
  } catch (error) {
    console.info("Using the compact offline knowledge base.", error);
  } finally {
    clearTimeout(timeout);
    updateQuestionMeta();
  }
}

setLanguage((navigator.language || "de").toLowerCase().startsWith("de") ? "de" : "en");
const knowledgeReady = loadKnowledgeBase().finally(() => showScreen("start-screen"));
const platformReady = platform.init().then(() => setLanguage(platform.locale().toLowerCase().startsWith("de") ? "de" : "en"));
Promise.allSettled([knowledgeReady, platformReady]).then(() => platform.loadingDone());

if ("serviceWorker" in navigator && (globalThis.location?.hostname || "").endsWith("github.io")) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

fetch(`version.json?t=${Date.now()}`, { cache:"no-store" })
  .then((response) => response.json())
  .then(({ version }) => {
    if (Number(version) <= buildVersion) return;
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(version));
    window.location.replace(url);
  })
  .catch(() => {});
