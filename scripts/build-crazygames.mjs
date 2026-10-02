import { cp, mkdir, rm, readFile, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "dist");
const files = ["index.html", "styles.css", "game.js", "llm-questions.js", "data.js", "feature-schema.js", "generated-questions.js", "engine.js", "attribute-enrichment.js", "answer-model.js", "learning.js", "play-stats.js", "question-format.js", "question-model.js", "question-ranking.js", "ranking-model.js", "profile-details.js", "release-policy.js", "knowledge-loader.js", "platform.js", "version.json"];
// Validate inputs without generating a CrazyGames package on ordinary turns.
const compressed=join(root,'assets/data/people-youth.json.gz');
const total=(await Promise.all([...files.map(file=>join(root,file)),compressed,join(root,'assets/nazar-genie.png')].map(async path=>(await stat(path)).size))).reduce((sum,bytes)=>sum+bytes,0);
if(total>20_000_000) throw Error(`Release exceeds our conservative 20MB budget: ${total}`);
if(process.argv.includes('--check')) {console.log(`Release inputs: ${total} bytes; no mandatory LLM/runtime; package not generated. Youth filtering is not PEGI certification.`);process.exit(0);}

await rm(output, { recursive:true, force:true });
await mkdir(join(output, "assets"), { recursive:true });
await Promise.all(files.map((file) => cp(join(root, file), join(output, file))));
await cp(join(root, "assets", "nazar-genie.png"), join(output, "assets", "nazar-genie.png"));
await mkdir(join(output,'assets','data'),{recursive:true});
await cp(compressed,join(output,'assets/data/people-youth.json.gz'));
const html=await readFile(join(output,'index.html'),'utf8');
await writeFile(join(output,'index.html'),html.replace('<html lang="de">','<html lang="en" data-release="crazygames">'));
console.log(`CrazyGames build written to ${output}`);
