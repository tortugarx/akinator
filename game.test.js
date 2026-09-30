import test from "node:test";
import assert from "node:assert/strict";

test("the start button opens the first question", async () => {
  const listeners = new Map();
  const element = (id = "") => ({
    id, textContent: "", innerHTML: "", value: "", placeholder: "", disabled: false,
    style: {}, dataset: {},
    classList: {
      active: false,
      toggle(name, enabled) { if (name === "active") this.active = enabled; },
      contains(name) { return name === "active" && this.active; }
    },
    addEventListener(type, handler) { listeners.set(`${id}:${type}`, handler); },
    focus() {}, animate() {}, replaceChildren() {}, append() {}
  });
  const ids = ["language-button","character-input","question-text","question-label","focus-label","progress-bar","brain-count","learn-status","guess-portrait","guess-name","guess-description","confidence-value","result-symbol","result-eyebrow","result-title","result-text","start-button","again-button","correct-button","wrong-button","skip-learn-button","learn-form","answer-grid","sound-button","settings-button","settings-back","settings-sound","add-person-button","share-button","home-status","recent-people","popular-people","thinking-lock"];
  const elements = Object.fromEntries(ids.map((id) => [id, element(id)]));
  const screens = ["loading-screen","start-screen","question-screen","guess-screen","learn-screen","result-screen","settings-screen"].map(element);
  globalThis.document = {
    documentElement: { lang: "" },
    addEventListener() {},
    querySelector(selector) {
      if (selector === "#learn-form button[type='submit']") return element("submit");
      return elements[selector.slice(1)] || null;
    },
    querySelectorAll(selector) {
      if (selector === ".screen") return screens;
      return [];
    }
  };
  globalThis.window = { addEventListener() {}, CrazyGames: undefined };
  Object.defineProperty(globalThis, "navigator", { value: { language: "de" }, configurable: true });
  const stored = new Map();
  globalThis.localStorage = { getItem(key) { return stored.get(key); }, setItem(key,value) { stored.set(key,value); } };
  globalThis.fetch = async () => ({ ok:true, json:async () => ({ characters:[] }) });

  await import(`./game.js?start-test=${Date.now()}`);
  assert.equal(typeof listeners.get("start-button:click"), "function");
  await listeners.get("start-button:click")();
  assert.equal(screens.find(({ id }) => id === "question-screen").classList.active, true);
  assert.match(elements["question-text"].textContent, /\?$/);
  const answer = (value) => listeners.get("answer-grid:click")({ target:{ closest:() => ({ dataset:{ answer:String(value) } }) } });
  await answer(1);
  await answer(-1);
  assert.match(elements["question-text"].textContent, /\?$/);
  assert.equal(elements['thinking-lock'].hidden,true);
  listeners.get('settings-button:click')();
  assert.equal(screens.find(({id})=>id==='settings-screen').classList.active,true);
  listeners.get('settings-sound:click')();
  assert.equal(stored.get('nazar-sound'),'off');
  listeners.get('settings-back:click')();
  assert.equal(screens.find(({id})=>id==='start-screen').classList.active,true);
  listeners.get('add-person-button:click')();
  assert.equal(screens.find(({id})=>id==='learn-screen').classList.active,true);
});
