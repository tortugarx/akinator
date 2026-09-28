import test from "node:test";
import assert from "node:assert/strict";
import { questionModel } from "./question-model.js";

test("ships a trained local question model", () => {
  assert.ok(questionModel.samples >= 17000);
  assert.ok(Object.keys(questionModel.weights).length >= 80);
  assert.ok(Object.keys(questionModel.exclusions).length >= 10);
  assert.ok(questionModel.weights.politician > 0);
});
