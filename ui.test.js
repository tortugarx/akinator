import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("the result portrait stays clipped inside its card", async () => {
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");
  assert.match(css, /\.reveal-card[^}]*overflow:\s*hidden/);
  assert.match(css, /\.portrait[^}]*overflow:\s*hidden/);
  assert.match(css, /\.portrait img[^}]*height:\s*100%/);
});

test("the result card provides an image attribution link", async () => {
  const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
  const game = await readFile(new URL("./game.js", import.meta.url), "utf8");
  assert.match(html, /id="image-credit"/);
  assert.match(game, /imageAttribution/);
});

test("locks input while thinking and resets answer-button animations", async () => {
  const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");
  const game = await readFile(new URL("./game.js", import.meta.url), "utf8");
  assert.match(html, /id="thinking-lock"/);
  assert.match(css, /\.thinking-lock/);
  assert.match(game, /setThinking\(true/);
  assert.match(game, /resetAnswerButtons\(\)/);
  assert.match(game, /getAnimations\?\.\(\)/);
});
