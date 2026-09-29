import test from "node:test";
import assert from "node:assert/strict";
import { questionModel } from "./question-model.js";

test("ships a trained local question model", () => {
  assert.ok(questionModel.samples >= 17000);
  assert.ok(Object.keys(questionModel.weights).length >= 80);
  assert.ok(Object.keys(questionModel.exclusions).length >= 10);
  assert.ok(questionModel.weights.politician > 0);
  for (const id of ["military", "adultCreator", "industrialist", "medical", "legal", "religious"]) assert.ok(questionModel.weights[id] > 0);
});

test("trains semantic implications and expanded geography exclusions", () => {
  assert.ok(Object.keys(questionModel.implications || {}).length >= 80);
  assert.ok(questionModel.implications.racingDriver.includes("motorsport"));
  assert.ok(questionModel.exclusions.german.includes("american"));
  assert.ok(questionModel.exclusions.german.includes("japanese"));
});
