import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "dist");
const files = ["index.html", "styles.css", "game.js", "llm-questions.js", "local-ai-worker.js", "model-download.js", "runtime-probe.js", "data.js", "feature-schema.js", "generated-questions.js", "engine.js", "attribute-enrichment.js", "answer-model.js", "learning.js", "play-stats.js", "question-format.js", "question-model.js", "platform.js", "version.json", "wikidata-people.json"];

await rm(output, { recursive:true, force:true });
await mkdir(join(output, "assets"), { recursive:true });
await Promise.all(files.map((file) => cp(join(root, file), join(output, file))));
await cp(join(root, "assets", "nazar-genie.png"), join(output, "assets", "nazar-genie.png"));
// Include the active CPU runtime only, not the retired Qwen/ONNX diagnostic assets.
await mkdir(join(output,'assets','ai','runtime'),{recursive:true});
await mkdir(join(output,'assets','ai','models'),{recursive:true});
await cp(join(root,'assets','ai','runtime','gemma'),join(output,'assets','ai','runtime','gemma'),{recursive:true});
await cp(join(root,'assets','ai','models','gemma'),join(output,'assets','ai','models','gemma'),{recursive:true});
console.log(`CrazyGames build written to ${output}`);
