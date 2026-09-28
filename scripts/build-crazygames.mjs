import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "dist");
const files = ["index.html", "styles.css", "game.js", "data.js", "engine.js", "learning.js", "play-stats.js", "question-format.js", "question-model.js", "platform.js", "version.json", "wikidata-people.json"];

await rm(output, { recursive:true, force:true });
await mkdir(join(output, "assets"), { recursive:true });
await Promise.all(files.map((file) => cp(join(root, file), join(output, file))));
await cp(join(root, "assets", "nazar-genie.png"), join(output, "assets", "nazar-genie.png"));
console.log(`CrazyGames build written to ${output}`);
