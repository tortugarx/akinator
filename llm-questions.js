// Pure, auditable boundary between generated language and the factual engine.
import {featureSchema} from './feature-schema.js?v=31';
const blocked = /geburt|birthday|birth date|vorname|nachname|first name|last name|buchstab|letter of/i;
const stop = new Set('ist sind war wurde hat haben diese dieser dieses person figur deine deiner deinem einen eine einer einem einem oder und mit von aus für hauptsächlich bekannt als the is was your this person character does has have from with for known mainly through part of'.split(' '));
for (const word of 'gesuchte gesuchten gesuchter gesucht kommt kommen kennst kennen kannst kann wird werden noch heute you thinking think about famous someone jemanden jemand that which whom ihrer ihrem ihrer seine seiner seinem ihre kommt gibt exist exists'.split(' ')) stop.add(word);
const synonyms = {female:['weiblich','frau','woman','female'],german:['deutsch','german'],actor:['schauspiel','actor','actress','acting'],athlete:['profisport','sportler','athlet','athlete','sports'],alive:['lebt','leben','lebendig','alive','living'],musician:['musik','music','musician'],singer:['sänger','sängerin','singer','singing']};
const schemaById = new Map(featureSchema.map((feature)=>[feature.id,feature]));
const matchesWord = (word,allowed) => allowed.some((term)=>word.includes(term.slice(0,Math.max(4,term.length-2))));
const words = (text) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter((word) => (word.length > 3 || /^(usa|spd|cdu|csu|fdp|afd|rap|pop|rnb|dj|mma)$/.test(word)) && !stop.has(word)) || [];

export function questionPrompt(context, language = 'de') {
  const german = language === 'de';
  return [
    // The small model is a language generator, not a reliable numerical
    // optimizer. Let the engine rank facts; supply its best discriminator.
    {role:'user',content:german ? `Rewrite this German yes/no question in German. Preserve its meaning. Output only one question ending in a question mark, no explanation: ${context.features[0].meaning}` : `Rewrite this English yes/no question in English. Preserve its meaning. Output only one question ending in a question mark, no explanation: ${context.features[0].meaning}`}
  ];
}

const discriminatingWords = {entertainment:['unterhaltung','entertainment'],musician:['musik','music'],alive:['lebt','leben','lebendig','alive','living'],female:['weiblich','female','frau','woman']};

function inferTextProposal(text,context) {
  const tokens = words(text);
  const exact = context.features.find(feature=>words(feature.meaning).join(' ') === tokens.join(' '));
  if (exact) return {text,operator:'any',ids:[exact.id]};
  const ranked = context.features.map((feature)=>{
    const terms = discriminatingWords[feature.id] || [...words(feature.meaning),...(synonyms[feature.id] || [])];
    const matched = terms.filter((term)=>tokens.some((word)=>matchesWord(word,[term])));
    return {feature,matched,score:matched.length/Math.max(1,terms.length)};
  }).filter(({matched})=>matched.length).sort((a,b)=>b.score-a.score || b.feature.gain-a.feature.gain);
  const chosen = [];
  const covered = new Set();
  for (const {feature,matched} of ranked) {
    if (matched.every((term)=>covered.has(term))) continue;
    chosen.push(feature.id); matched.forEach((term)=>covered.add(term));
    if (chosen.length >= 3) break;
  }
  if (!chosen.length) return null;
  const operator = chosen.length > 1 && /\bund\b|\band\b/i.test(text) ? 'all' : 'any';
  return {text,operator,ids:chosen};
}

export function parseQuestionProposals(output, context) {
  const start = output.indexOf('{'), end = output.lastIndexOf('}');
  let parsed;
  if (start < 0 || end <= start) {
    const text = output.trim().replace(/^['"“]|['"”]$/g,'').replace(/^(?:Ja|Nein|Yes|No),\s*/i,'').replace(/^([a-zäöü])/,(letter)=>letter.toUpperCase());
    if (text.includes('\n') || text.split('?').length !== 2) return [];
    parsed = inferTextProposal(text,context);
    if (!parsed) return [];
  } else try { parsed = JSON.parse(output.slice(start,end+1)); } catch { return []; }
  if (parsed.text) parsed = {questions:[parsed]};
  if (!Array.isArray(parsed.questions)) return [];
  const available = new Map(context.features.map((feature) => [feature.id,feature]));
  const seen = new Set();
  return parsed.questions.slice(0,4).flatMap((proposal) => {
    const {text,operator,ids} = proposal;
    if (typeof text !== 'string' || text.length < 12 || text.length > 220 || !text.trim().endsWith('?') || blocked.test(text)) return [];
    if (/^(?:wie|wer|was|wo|wann|warum|welch|how|who|what|where|when|why)\b/i.test(text.trim())) return [];
    if (!['any','all'].includes(operator) || !Array.isArray(ids) || ids.length < 1 || ids.length > 3 || new Set(ids).size !== ids.length || ids.some((id) => !available.has(id))) return [];
    // Reject omitted feature meanings, wrong connective, and negated conditions.
    // This conservative lexical check is not a general semantic proof.
    const normalized = words(text).join(' ');
    if (/\bnicht\b|\bkein\w*\b|\bnot\b|\bnever\b/i.test(text)) return [];
    if (ids.length === 1 && /\bund\b|\boder\b|\band\b|\bor\b/i.test(text) && !/\bund\b|\boder\b|\band\b|\bor\b/i.test(available.get(ids[0]).meaning)) return [];
    if (ids.length > 1 && !(operator === 'any' ? /\boder\b|\bor\b/i : /\bund\b|\band\b/i).test(text)) return [];
    if (ids.length > 1 && (operator === 'any' ? /\bund\b|\band\b/i : /\boder\b|\bor\b/i).test(text)) return [];
    if (ids.some((id) => ![...words(available.get(id).meaning),...(synonyms[id] || [])].some((word) => normalized.includes(word.slice(0, Math.max(4,word.length-2)))))) return [];
    if (!ids.includes('female') && !(context.known || []).some(({id,answer})=>id === 'female' && answer >= .5) && /\b(Athletin|Sportlerin|Sängerin|Schauspielerin|Politikerin)\b/i.test(text) && !/\boder\b/i.test(text)) return [];
    const allowed = ids.flatMap((id)=>[...words(available.get(id).meaning),...(synonyms[id] || [])]);
    for (const fact of context.known || []) if (fact.answer >= .5 && schemaById.has(fact.id)) {
      const schema = schemaById.get(fact.id);
      allowed.push(...words(schema.de.join(' ')),...words(schema.en.join(' ')),...(synonyms[fact.id] || []));
    }
    // Additional occupations/places/claims are not justified just because the
    // sentence also contains one correct keyword. Reject unfamiliar content.
    if (words(text).some((word)=>!matchesWord(word,allowed))) return [];
    const sorted = [...ids].sort();
    const id = ids.length === 1 ? ids[0] : `${operator === 'any' ? 'group' : 'all'}:${sorted.join('|')}`;
    if (seen.has(id)) return [];
    seen.add(id);
    return [{id,featureIds:sorted,operator,text:text.trim(),generated:true,llm:true}];
  });
}

export class LocalQuestionAI {
  constructor({workerFactory,onProgress = () => {},timeoutMs = 180000} = {}) {
    this.workerFactory = workerFactory || (() => new Worker(new URL('./local-ai-worker.js',import.meta.url),{type:'module'}));
    this.onProgress = onProgress; this.timeoutMs = timeoutMs; this.sequence = 0; this.pending = new Map(); this.ready = false;
  }
  request(type,payload = {}) {
    if (!this.worker) {
      this.worker = this.workerFactory();
      this.worker.onmessage = ({data}) => {
        if (data.type === 'progress') {
          for (const task of this.pending.values()) { clearTimeout(task.timer); task.timer = setTimeout(() => this.cancel('Die lokale KI reagiert nicht mehr. Bitte erneut versuchen.'),this.timeoutMs); }
          this.onProgress(data); return;
        }
        const task = this.pending.get(data.id);
        if (!task) return;
        clearTimeout(task.timer); this.pending.delete(data.id);
        if (data.error) task.reject(Error(data.error)); else task.resolve(data.result);
      };
      this.worker.onerror = () => this.cancel('Die lokale KI konnte auf diesem Gerät nicht ausgeführt werden.');
    }
    const id = ++this.sequence;
    return new Promise((resolve,reject) => {
      const timer = setTimeout(() => this.cancel('Die lokale KI hat zu lange gebraucht. Bitte erneut versuchen oder ausdrücklich den klassischen Modus wählen.'),this.timeoutMs);
      this.pending.set(id,{resolve,reject,timer});
      this.worker.postMessage({id,type,...payload});
    });
  }
  async load() { await this.request('load'); this.ready = true; }
  async propose(context,language) {
    const verb = context.features[0]?.meaning.match(/^([A-Za-zÄÖÜäöüß]+)/)?.[1];
    // Preserve the interrogative verb as well as requiring a question mark.
    // Otherwise "Streamt ...?" can become the meaningless "Ist ... Spiele?".
    const starts = verb ? [verb] : language === 'de' ? ['Ist','Hat','Lebt'] : ['Is','Has','Does'];
    // Constrain syntax, not a catalogue of questions or model-selected words.
    const grammar = `root ::= (${starts.map(JSON.stringify).join(' | ')}) " " [^?\\n]{10,210} "?"`;
    const output = await this.request('generate',{messages:questionPrompt(context,language),grammar});
    return parseQuestionProposals(output,context);
  }
  cancel(message = 'KI-Vorgang abgebrochen.') {
    this.worker?.terminate(); this.worker = null; this.ready = false;
    for (const task of this.pending.values()) { clearTimeout(task.timer); task.reject(Error(message)); }
    this.pending.clear();
  }
}
