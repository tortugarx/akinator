import test from "node:test";
import assert from "node:assert/strict";
import { contextualQuestionText, highlightedQuestionHtml } from "./question-format.js";

test("uses person wording after the real-person branch is known", () => {
  const question = { de:"Ist deine Figur für Musik bekannt?", en:"Is your character known for music?" };
  assert.equal(contextualQuestionText(question, "de", true), "Ist diese Person für Musik bekannt?");
  assert.equal(contextualQuestionText(question, "en", true), "Is this person known for music?");
});

test("highlights important question words and escapes markup", () => {
  assert.equal(highlightedQuestionHtml("Ist Musik <wichtig>?", "de"), "Ist <mark>Musik</mark> &lt;wichtig&gt;?");
});
