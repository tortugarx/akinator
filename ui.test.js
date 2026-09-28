import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("the result portrait stays clipped inside its card", async () => {
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");
  assert.match(css, /\.reveal-card[^}]*overflow:\s*hidden/);
  assert.match(css, /\.portrait[^}]*overflow:\s*hidden/);
  assert.match(css, /\.portrait img[^}]*height:\s*100%/);
});
