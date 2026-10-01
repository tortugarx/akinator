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

test('uses neutral wording until reality is answered, and fictional wording afterwards',()=>{
  const question = {de:'Ist diese Person weiblich?',en:'Is this person female?'};
  assert.equal(contextualQuestionText(question,'de','unknown'),'Ist diese Person oder Figur weiblich?');
  assert.equal(contextualQuestionText(question,'de','fictional'),'Ist diese Figur weiblich?');
  assert.equal(contextualQuestionText(question,'en','fictional'),'Is this character female?');
});

test('subject wording preserves real-person predicates and names of works',()=>{
  assert.equal(contextualQuestionText({de:'Ist deine Figur eine echte Person?'},'de','unknown'),'Ist diese Person oder Figur eine echte Person?');
  assert.equal(contextualQuestionText({en:'Is your character a real person?'},'en','unknown'),'Is this person or character a real person?');
  assert.equal(contextualQuestionText({de:'Ist deine Figur für das Werk „Persona“ bekannt?'},'de','person'),'Ist diese Person für das Werk „Persona“ bekannt?');
});

test('highlights sourced names and specific question terms without nested marks',()=>{
  assert.equal(highlightedQuestionHtml('Hat diese Person die Auszeichnung „Musikpreis“ erhalten?','de'),'Hat diese Person die <mark>Auszeichnung</mark> <mark>„Musikpreis“</mark> erhalten?');
});
