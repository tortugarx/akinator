import { enrichCharacterAttributes } from "./attribute-enrichment.js?v=31";
import { predictAnswer, isImplicitNegative, invalidateAnswerTraits } from "./answer-model.js?v=31";
import {contextualQuestionText} from './question-format.js?v=31';
import { descriptionQuestions, generateGroupedQuestions } from "./generated-questions.js?v=31";
import { rankedQuestionValue } from './question-ranking.js?v=31';
import { addReviewedDetails } from './profile-details.js?v=31';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const binaryEntropy = (probability) => {
  if (probability <= 1e-12 || probability >= 1 - 1e-12) return 0;
  return -probability * Math.log(probability) - (1 - probability) * Math.log(1 - probability);
};
const relationshipQuestions = new Set(["family", "parent", "sibling", "grandparent", "yourChild", "romantic", "partner", "friend", "schoolWork", "auntUncle", "cousin", "nieceNephew", "stepParent", "spouse", "exPartner", "bestFriend", "neighbor", "roommate", "teacher", "coworker", "boss", "classmate"]);
const adultQuestions = new Set(["adultCreator", "adultFilmPerformer", "onlyFansCreator", "adultDirector"]);
const equivalentQuestionFamilies = [new Set(["movie", "filmActor"]), new Set(["tv", "seriesActor"])];
const exactCountries = new Set(["american", "british", "german", "french", "spanish", "italian", "canadian", "brazilian", "australian", "indian", "japanese", "southKorean", "chinese", "austrian", "swiss", "dutch", "swedish", "polish", "russian", "ukrainian", "turkish", "mexican", "argentine", "nigerian", "southAfrican", "portuguese", "belgian", "irish", "norwegian", "danish"]);
const regionQuestions = new Set(["european", "latinAmerican", "asian", "african"]);
const subregionQuestions = new Set(["germanSpeaking", "nordic", "easternEuropean", "southernEuropean", "westernEuropean"]);
const countryParents = new Map([
  ...["german","austrian","swiss"].map((id) => [id,["european","germanSpeaking"]]),
  ...["swedish","norwegian","danish"].map((id) => [id,["european","nordic"]]),
  ...["polish","russian","ukrainian"].map((id) => [id,["european","easternEuropean"]]),
  ...["spanish","italian","portuguese"].map((id) => [id,["european","southernEuropean"]]),
  ...["british","french","dutch","belgian","irish"].map((id) => [id,["european","westernEuropean"]]),
  ...["indian","japanese","southKorean","chinese","turkish"].map((id) => [id,["asian"]]),
  ...["brazilian","mexican","argentine"].map((id) => [id,["latinAmerican"]]),
  ...["nigerian","southAfrican"].map((id) => [id,["african"]])
]);
const nonEuropeanCountries = new Set(["american", "canadian", "brazilian", "australian", "indian", "japanese", "southKorean", "chinese", "mexican", "argentine", "nigerian", "southAfrican"]);
export const topicBranches = new Map([
  ["entertainment", new Set(["actor", "musician", "comedian", "dancer", "model", "director", "producer", "presenter", "creator", "journalist"])],
  ["musician", new Set(["musicGroup", "singer", "rapper", "composer", "dj", "instrumentalist", "popMusician", "rockMusician", "classicalMusician", "electronicMusician", "countryMusician", "musicProducer", "guitarist", "pianist", "drummer", "violinist", "conductor", "metalMusician", "reggaeMusician", "gospelSinger"])],
  ["singer", new Set(["musicGroup", "songwriter", "soloSinger", "popMusician", "rockMusician", "classicalMusician", "electronicMusician", "countryMusician", "rnbSoulSinger", "jazzSinger", "operaSinger", "kpopSinger", "latinSinger", "schlagerSinger", "folkSinger", "metalMusician", "reggaeMusician", "gospelSinger", "rapper", "retired"])],
  ["athlete", new Set(["football", "basketball", "tennis", "motorsport", "boxer", "wrestler", "racingDriver", "coach", "golfer", "cyclist", "swimmer", "runner", "baseball", "iceHockey", "gymnast", "esports", "martialArts", "cricket", "volleyball", "handball", "americanFootball", "winterSports", "retired"])],
  ["politician", new Set(["nationalLeader", "usPresident", "president", "primeMinister", "partyLeader", "cabinetMinister", "diplomat", "activist", "military", "militaryLeader", "royalty", "ministerDiplomat", "mayor", "legislator", "chancellor", "governor", "retired"])],
  ["military", new Set(["militaryLeader", "army", "navy", "airForce", "generalOfficer", "admiral", "militaryPilot", "retired"])],
  ["actor", new Set(["movie", "tv", "filmActor", "seriesActor", "childActor", "actionActor", "horrorActor", "bollywoodActor", "soapActor", "marvelActor", "dcActor", "starWarsActor", "harryPotterActor", "sitcomActor", "superheroActor", "comedian", "model", "adultCreator", "adultFilmPerformer", "onlyFansCreator", "adultDirector", "voiceActor", "theaterActor", "realityTV", "awardWinningActor", "retired"])],
  ["creator", new Set(["internet", "adultCreator", "adultFilmPerformer", "onlyFansCreator", "gamer", "esports", "youtuber", "streamer", "tiktoker", "podcaster", "challengeCreator", "commentaryCreator", "vlogger", "beautyCreator", "techCreator", "educationCreator", "foodCreator", "travelCreator", "fitnessCreator", "comedyCreator", "kidsCreator", "musicCreator", "sportsCreator", "prankCreator", "retired"])],
  ["streamer", new Set(["twitchStreamer", "youtubeStreamer", "gamingStreamer", "minecraftStreamer", "competitiveGameStreamer", "irlStreamer", "politicalStreamer", "vtuber", "varietyStreamer", "roleplayStreamer", "sportsGameStreamer", "battleRoyaleStreamer", "mobaStreamer", "shooterStreamer", "speedrunner", "youtuber", "podcaster", "retired"])],
  ["scientist", new Set(["space", "electric", "physicist", "mathematician", "chemist", "biologist", "astronaut", "engineer", "inventor", "academic", "computerScientist", "economist", "psychologist", "astronomer", "environmentalScientist", "retired"])],
  ["artist", new Set(["photographer", "architect", "retired"])], ["entrepreneur", new Set(["internet", "industrialist", "techEntrepreneur", "finance", "fashionBusiness", "chiefExecutive", "billionaire", "retired"])], ["writer", new Set(["book", "poet", "screenwriter", "philosopher", "novelist", "playwright", "childrensAuthor", "fantasyAuthor", "scifiAuthor", "crimeAuthor", "nonfictionAuthor", "retired"])],
  ["comedian", new Set()], ["model", new Set()], ["director", new Set(["movie"])], ["internet", new Set()],
  ["adultCreator", new Set(["adultFilmPerformer", "onlyFansCreator", "adultDirector"])], ["industrialist", new Set()], ["medical", new Set()], ["legal", new Set()], ["religious", new Set()],
  ["journalist", new Set(["presenter", "podcaster", "retired"])], ["producer", new Set(["musicProducer", "retired"])], ["dancer", new Set(["retired"])], ["chef", new Set(["retired"])]
]);

function collectTopicDescendants(root, found = new Set()) {
  for (const child of topicBranches.get(root) || []) {
    if (found.has(child)) continue;
    found.add(child);
    collectTopicDescendants(child, found);
  }
  return found;
}
const topicDescendantCache = new Map([...topicBranches.keys()].map((root) => [root, collectTopicDescendants(root)]));
const topicDescendants = (root) => topicDescendantCache.get(root) || new Set();
const fictionalOnlyQuestions = new Set(["book", "magic", "superhero", "animated", "anime", "game", "villain", "powers", "nonhuman", "animal", "robot", "marvel", "dc", "disney", "starWars", "pokemon", "horror", "princess", "protagonist", "comic", "scienceFiction", "fantasy", "alien", "monster", "harryPotter", "lordOfTheRings", "mario", "sonic", "wizard", "warrior", "policeCharacter", "studentCharacter", "sitcom", "crimeFiction", "gameOfThrones"]);
const realOnlyQuestions = new Set(["alive", "retired", ...exactCountries, ...regionQuestions, ...subregionQuestions, "medical", "legal", "religious", "chef"]);
for (const [root] of topicBranches) for (const topicId of [root, ...topicDescendants(root)]) realOnlyQuestions.add(topicId);
for (const shared of ["movie", "tv", "book", "space", "electric", "royalty"]) realOnlyQuestions.delete(shared);

export class GuessEngine {
  constructor(characters, questions, model = {}) {
    this.characters = characters.map((item) => addReviewedDetails(enrichCharacterAttributes(item)));
    this.questions = questions;
    this.generatedQuestions = [];
    this.generatedSize = -1;
    this.model = model;
    this.answerCache = new WeakMap();
    this.profileSignatures = new WeakMap();
    this.questionAliases = new Map();
    this.generatedQuestionKinds = new Map();
    this.redundantAfterYes = new Map();
    this.generatedImplications = new Map();
    this.charactersById = new Map(this.characters.map((item) => [this.key(item), item]));
    this.charactersByName = new Map(this.characters.map((item) => [this.nameKey(item), item]));
    this.charactersByAlias = new Map();
    for(const item of this.characters) this.registerAliases(item);
    this.reset();
  }

  reset() {
    this.scores = new Map(this.characters.map((item) => [this.key(item), this.prior(item)]));
    this.asked = new Set();
    this.rejected = new Set();
    this.history = [];
    this.responses = new Map();
    this.answerCount = 0;
    this.lastRejectionAnswerCount = null;
    this.probabilityCache = null;
    this.aiBestGain = 0;
  }

  key(item) { return item.id ?? item.name; }

  nameKey(item) { return item.name.trim().toLocaleLowerCase(); }

  aliasKey(name) { return name.normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase().replace(/^(?:queen|princess|lord|the)\s+/,'').replace(/[^\p{L}\p{N}]/gu,''); }

  registerAliases(item) {
    for(const name of [item.name,...(item.aliases||[])]) {
      const key=this.aliasKey(name);
      if(!this.charactersByAlias.has(key)) this.charactersByAlias.set(key,new Set());
      this.charactersByAlias.get(key).add(item);
    }
  }

  prior(item) {
    if (item.learned) return .35;
    if (!item.source) return .25;
    return Math.min(.32, Math.log10(1 + (item.popularity || 1)) * .045);
  }

  addCharacter(character) {
    addReviewedDetails(enrichCharacterAttributes(character));
    const candidates=new Set([character.name,...(character.aliases||[])].flatMap(name=>[...(this.charactersByAlias.get(this.aliasKey(name))||[])]));
    const entityId=item=>item.source?.match(/wikidata\.org\/wiki\/(Q\d+)/i)?.[1]?.toUpperCase();
    const compatible=[...candidates].filter(item=>!(item.attributes.real && character.attributes.real && item.attributes.real!==character.attributes.real) && !(entityId(item)&&entityId(character)&&entityId(item)!==entityId(character)));
    const existing = this.charactersById.get(this.key(character)) || (compatible.length===1 ? compatible[0] : null);
    if (existing) {
      existing.image ||= character.image;
      existing.imageAttribution ||= character.imageAttribution;
      existing.source ||= character.source;
      existing.aliases=[...new Set([...(existing.aliases||[]),character.name,...(character.aliases||[])])].filter(name=>name!==existing.name);
      this.registerAliases(existing);
      this.charactersById.set(this.key(character),existing);
      if (character.facts?.length) {
        existing.facts = [...new Map([...(existing.facts || []), ...character.facts].map(fact=>[fact.id,fact])).values()];
        this.generatedSize = -1;
      }
      existing.popularity = Math.max(existing.popularity || 0, character.popularity || 0);
      for (const [id, value] of Object.entries(character.attributes || {})) {
        if (value === 1 || (character.learned && value !== 0)) existing.attributes[id] = value;
      }
      this.probabilityCache = null;
      this.answerCache.delete(existing);
      invalidateAnswerTraits(existing);
      this.profileSignatures.delete(existing);
      return;
    }
    this.characters.push(character);
    this.charactersById.set(this.key(character), character);
    this.charactersByName.set(this.nameKey(character), character);
    this.registerAliases(character);
    this.scores.set(this.key(character), this.prior(character));
    this.probabilityCache = null;
  }

  addDatabase(database) {
    for(const item of database.characters || []) {
      if((database.excludedProfiles||[]).some(record=>record.profile?.id===item.id))continue;
      const facts=item.facts || item.factIds?.map(id=>database.factDefinitions?.[id]).filter(Boolean);
      this.addCharacter({...item,attributes:{...item.attributes},...(facts ? {facts} : {})});
    }
    for(const supplement of database.curatedFactSupplements || []) {
      const person=this.charactersById.get(supplement.id);
      if(!person) continue; // Supplements never create an unverified profile.
      const facts=supplement.factIds?.map(id=>database.factDefinitions?.[id]).filter(Boolean)||[];
      person.facts=[...new Map([...(person.facts||[]),...facts].map(fact=>[fact.id,fact])).values()];
      this.generatedSize=-1;
      invalidateAnswerTraits(person);
      this.profileSignatures.delete(person);
    }
  }

  probabilities() {
    if (this.probabilityCache) return this.probabilityCache;
    const available = this.characters.filter((item) => !this.rejected.has(this.key(item)));
    if (!available.length) return [];
    const ceiling = Math.max(...available.map((item) => this.scores.get(this.key(item)) ?? 0));
    const personalFocus = this.answeredYes("personallyKnown");
    const adultFocus = [...adultQuestions].some((id) => this.answeredYes(id));
    const anchors = [...this.responses].filter(([id, value]) => {
      // Sparse living-status/gender facts are NOT rare topic memberships.
      // Treating "alive" as an anchor used to suppress living people merely
      // because their wiki profile had no explicit current-status statement.
      const branch = topicBranches.has(id) || [...topicBranches.values()].some(children=>children.has(id)) || fictionalOnlyQuestions.has(id) || relationshipQuestions.has(id) || id==='personallyKnown';
      if (value < .9 || !branch) return false;
      const count = available.filter((person) => person.attributes[id] === 1).length;
      return count >= 1 && count / available.length < .12;
    }).map(([id]) => id);
    this.activeAnchors = anchors;
    const weighted = available.map((item) => {
      let weight = Math.exp((this.scores.get(this.key(item)) ?? 0) - ceiling);
      const reality = this.response("real") ?? -(this.response("fictional") ?? 0);
      if (Math.abs(reality) >= .5 && item.attributes.real && Math.sign(item.attributes.real) !== Math.sign(reality)) weight *= .001;
      // A confirmed, rare branch should not be drowned out by thousands of
      // unrelated profiles whose corresponding detail happens to be unknown.
      if (personalFocus && item.attributes.personallyKnown !== 1) weight *= .0001;
      if (adultFocus && item.attributes.adultCreator !== 1 && ![...adultQuestions].some((id) => item.attributes[id] === 1)) weight *= .0005;
      for (const id of anchors) if (item.attributes[id] !== 1) weight *= item.attributes[id] < 0 && !isImplicitNegative(item,id) ? .00001 : .0001;
      return { item, weight };
    });
    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0) || 1;
    this.probabilityCache = weighted
      .map((entry) => ({ ...entry, probability: entry.weight / total }))
      .sort((a, b) => b.probability - a.probability);
    return this.probabilityCache;
  }

  yesProbability(person, id) {
    if (id.startsWith('all:')) {
      const facts = id.slice(4).split('|').map((key) => isImplicitNegative(person,key) ? 0 : person.attributes[key] || 0);
      if (facts.some((fact) => fact === -1)) return .06;
      return facts.every((fact) => fact === 1) ? .94 : .5;
    }
    if (id.startsWith('group:')) {
      const facts = id.slice(6).split('|').map((key) => isImplicitNegative(person,key) ? 0 : person.attributes[key] || 0);
      if (facts.some((fact) => fact === 1)) return .94;
      return facts.every((fact) => fact === -1) ? .06 : .5;
    }
    const known = person.attributes[id] || 0;
    const implicitNo = isImplicitNegative(person, id);
    if (known && !implicitNo) return .5 + .44 * clamp(known, -1, 1);
    let cached = this.answerCache.get(person);
    if (!cached) { cached = new Map(); this.answerCache.set(person, cached); }
    if (!cached.has(id)) cached.set(id, predictAnswer(this.model.answerModel, person, id));
    return cached.get(id);
  }

  certainty() {
    const probabilities = this.probabilities().map(({ probability }) => probability);
    if (probabilities.length <= 1) return 1;
    const entropy = -probabilities.reduce((sum, probability) => sum + probability * Math.log(Math.max(probability, 1e-12)), 0);
    return clamp(1 - entropy / Math.log(probabilities.length), 0, 1);
  }

  response(id) { return this.responses.get(id); }

  answeredYes(id) { return (this.response(id) ?? 0) >= .5; }

  answeredNo(id) { return (this.response(id) ?? 0) <= -.5; }

  isRealPerson() {
    if (this.answeredNo("real") || this.answeredYes("fictional")) return false;
    if (this.answeredYes("real") || this.answeredNo("fictional") || this.answeredYes("personallyKnown")) return true;
    return false; // Database proportions are not evidence that the user's target is real.
  }

  subjectKind() {
    if (this.answeredNo('real') || this.answeredYes('fictional')) return 'fictional';
    return this.isRealPerson() ? 'person' : 'unknown';
  }

  isRelevant(question) {
    if(this.model.questionFilter && !this.model.questionFilter(question)) return false;
    const id = question.id;
    const kind=question.kind || this.generatedQuestionKinds.get(id);
    if (['universe','appearance','creator','inspiration','firstAppearance','comicDebut','transformation','adBrand'].includes(kind) && this.isRealPerson()) return false;
    if (['burial','deathCause'].includes(kind) && this.answeredYes('alive')) return false;
    if ((this.questionAliases.get(id)||[]).some(alias=>this.responses.has(alias)||this.asked.has(alias))) return false;
    if ((this.redundantAfterYes.get(id)||[]).some(parent=>this.answeredYes(parent))) return false;
    if (this.answeredYes('chancellor') && ['politician','nationalLeader','usPresident'].includes(id)) return false;
    if (id.startsWith('evidence:')) {
      const equivalents = {YouTube:'youtuber',Twitch:'twitchStreamer',TikTok:'tiktoker',OnlyFans:'onlyFansCreator',Minecraft:'minecraftStreamer','League of Legends':'mobaStreamer',Marvel:'marvel',Disney:'disney','Harry Potter':'harryPotter','Star Wars':'starWars'};
      const equivalent = equivalents[id.slice(9)];
      if (equivalent && this.responses.has(equivalent)) return false;
    }
    if (id.startsWith('fact:')) {
      const property=id.split(':')[1];
      if(property==='P102' && [...this.responses].some(([other,value])=>value>=.5 && other!==id && (other.startsWith('fact:P102:') || /^evidence:(?:SPD|CDU|CSU|FDP|AfD|Bündnis|Republican Party|Democratic Party)/.test(other)))) return false;
      // Fictional people can also play instruments, hold offices or belong to
      // teams. Their sourced facts remain usable with "Figur" wording.
      return !this.answeredYes('personallyKnown');
    }
    const realPerson = this.isRealPerson();
    const fictionalCharacter = this.answeredNo("real") || this.answeredYes("fictional");
    if (equivalentQuestionFamilies.some((family) => family.has(id) && [...family].some((other) => other !== id && this.responses.has(other)))) return false;
    for (const [answeredId, answer] of this.responses) {
      if (answer >= .5 && this.model.exclusions?.[answeredId]?.includes(id)) return false;
      if (answer >= .5 && this.model.implications?.[answeredId]?.includes(id)) return false;
      if (answer <= -.5 && this.model.implications?.[id]?.includes(answeredId)) return false;
    }
    if (id === "fictional" && (this.answeredYes("real") || this.answeredNo("real"))) return false;
    if (id === "real" && (this.answeredYes("fictional") || this.answeredNo("fictional"))) return false;
    if (id === "personallyKnown" && fictionalCharacter) return false;
    if (id === "retired" && this.answeredNo("alive")) return false;
    if (this.answeredNo("personallyKnown") && relationshipQuestions.has(id)) return false;
    if (this.answeredYes("personallyKnown") && !relationshipQuestions.has(id) && !["female","alive"].includes(id)) return false;
    if (realPerson && fictionalOnlyQuestions.has(id)) return false;
    if (fictionalCharacter && realOnlyQuestions.has(id)) return false;
    if (relationshipQuestions.has(id) && this.answeredNo("real")) return false;
    if (["parent", "sibling", "grandparent", "yourChild", "auntUncle", "cousin", "nieceNephew", "stepParent"].includes(id) && this.answeredNo("family")) return false;
    if (this.answeredYes("family") && ["romantic", "partner", "spouse", "exPartner", "friend", "bestFriend", "schoolWork", "neighbor", "roommate"].includes(id)) return false;
    if (this.answeredYes("romantic") && ["friend", "schoolWork"].includes(id)) return false;
    if (this.answeredYes("friend") && ["romantic", "partner", "schoolWork"].includes(id)) return false;
    if (this.answeredYes("schoolWork") && ["romantic", "partner", "friend"].includes(id)) return false;
    if (id === "stepParent" && this.answeredNo("parent")) return false;
    if (id === "spouse" && this.answeredNo("partner")) return false;
    if (id === "bestFriend" && this.answeredNo("friend")) return false;
    if (["teacher", "coworker", "boss", "classmate"].includes(id) && this.answeredNo("schoolWork")) return false;
    const familyRoles = ["parent", "sibling", "grandparent", "yourChild", "auntUncle", "cousin", "nieceNephew"];
    if (familyRoles.includes(id) && familyRoles.some((role) => role !== id && this.answeredYes(role))) return false;
    const parentTopics = [...topicBranches].filter(([, children]) => children.has(id) || [...children].some((child) => topicDescendants(child).has(id)));
    // A detail can belong to several careers. It is impossible only when every
    // possible parent was denied; one denied sibling must never close the path.
    if (parentTopics.length && parentTopics.every(([root]) => this.answeredNo(root))) return false;
    if (id === "musicGroup" && this.answeredNo("musician")) return false;
    if ((id === "singer" || id === "rapper") && this.answeredNo("musician")) return false;
    if (id === "football" && this.answeredNo("athlete")) return false;
    if (["basketball", "tennis", "motorsport"].includes(id) && this.answeredNo("athlete")) return false;
    if (id === "militaryLeader" && this.answeredNo("military")) return false;
    if (id === "anime" && this.answeredNo("animated")) return false;
    if ((id === "animal" || id === "robot" || id === "nonhuman") && this.answeredYes("human")) return false;
    if (id === "animal" && this.answeredNo("nonhuman")) return false;
    if (id === "robot" && this.answeredYes("animal")) return false;

    const confirmedCountry = [...exactCountries].find((country) => this.answeredYes(country));
    if (countryParents.has(id) && countryParents.get(id).some((parent) => this.answeredNo(parent))) return false;
    const confirmedSubregion = [...subregionQuestions].find((region) => this.answeredYes(region));
    if (confirmedSubregion && subregionQuestions.has(id) && id !== confirmedSubregion) return false;
    if (subregionQuestions.has(id) && this.answeredNo("european")) return false;
    if (confirmedCountry && ((exactCountries.has(id) && id !== confirmedCountry) || regionQuestions.has(id) || subregionQuestions.has(id))) return false;
    if (this.answeredYes("european") && (nonEuropeanCountries.has(id) || [...regionQuestions].some((region) => region !== "european" && region === id))) return false;
    if (this.answeredYes("latinAmerican") && (["european", "asian", "african"].includes(id) || (exactCountries.has(id) && id !== "brazilian"))) return false;
    if (this.answeredYes("asian") && (["european", "latinAmerican", "african"].includes(id) || ["american", "british", "german", "french", "spanish", "italian", "canadian", "brazilian", "australian"].includes(id))) return false;
    if (this.answeredYes("african") && (["european", "latinAmerican", "asian"].includes(id) || exactCountries.has(id))) return false;
    const universes = ["marvel", "dc", "disney", "starWars", "pokemon"];
    if (universes.includes(id) && universes.some((universe) => universe !== id && this.answeredYes(universe))) return false;

    return true;
  }

  focusedTopics() {
    const confirmed = [...topicBranches].filter(([root]) => this.answeredYes(root));
    for (const [root, children] of topicBranches) {
      if (confirmed.some(([id]) => id === root)) continue;
      const specificYes = [...children].some((child) => this.answeredYes(child) && [...topicBranches.values()].filter((set) => set.has(child)).length === 1);
      if (specificYes) confirmed.push([root, children]);
    }
    if (["adultFilmPerformer", "onlyFansCreator", "adultDirector"].some((id) => this.answeredYes(id)) && !confirmed.some(([root]) => root === "adultCreator")) confirmed.push(["adultCreator", topicBranches.get("adultCreator")]);
    return confirmed.filter(([root]) => !confirmed.some(([other]) => other !== root && topicDescendants(root).has(other)));
  }

  questionFocusWeight(id, focused = this.focusedTopics()) {
    // Opening questions should be easy to answer across all careers/universes.
    // Weight is an answerability cost, not a hardcoded gender question.
    if (this.responses.size < 2) return ['real','fictional','female','personallyKnown'].includes(id) ? 1 : .45;
    if (id.startsWith('fact:')) return /^fact:(?:P166|P19|P69):/.test(id) ? .55 : 1.2;
    if (!focused.length) return 1;
    const universal = new Set(["real", "personallyKnown", "alive", "female", ...exactCountries, ...regionQuestions, ...subregionQuestions]);
    if (universal.has(id)) return .82;
    if (focused.some(([root]) => root === "adultCreator")) {
      if (adultQuestions.has(id)) return 1.4;
      if (["actor","creator","model","streamer","director","internet","retired","movie","tv"].includes(id)) return .36;
      return .025;
    }
    if (focused.some(([root]) => root === id || topicDescendants(root).has(id))) return 1.2;
    // Other profession roots remain available to discover overlapping careers,
    // but their low priority prevents a tour through every unrelated industry.
    if (topicBranches.has(id)) return .42;
    return .18;
  }

  nextQuestion() {
    const iterator = this.selectQuestion();
    let result;
    do { result = iterator.next(); } while (!result.done);
    return result.value;
  }

  async nextQuestionAsync() {
    const iterator = this.selectQuestion();
    let result;
    do {
      result = iterator.next();
      if (!result.done) await new Promise((resolve) => setTimeout(resolve, 0));
    } while (!result.done);
    return result.value;
  }

  selectionDistribution() {
    const candidates = this.probabilities();
    let selection = candidates;
    if (this.activeAnchors?.length) {
      const focused = candidates.filter(({item}) => this.activeAnchors.every((id) => item.attributes[id] === 1));
      const mass = focused.reduce((sum,{probability}) => sum+probability,0);
      if (mass >= .95) selection = focused.map((entry) => ({...entry,probability:entry.probability/mass}));
    }
    if (selection.length <= 2000) return selection;
    const head = selection.slice(0,1000), tail = selection.slice(1000);
    const mass = tail.reduce((sum,{probability}) => sum+probability,0);
    const sampled = [];
    let cursor = 0, cumulative = tail[0].probability;
    for (let index=0;index<1000;index++) {
      const quantile = (index+.5)*mass/1000;
      while (cumulative < quantile && cursor < tail.length-1) cumulative += tail[++cursor].probability;
      sampled.push({item:tail[cursor].item,probability:mass/1000});
    }
    return [...head,...sampled];
  }

  factMasses(distribution) {
    const masses=new Map();
    for(const {item,probability} of distribution) for(const fact of item.facts || []) masses.set(fact.id,(masses.get(fact.id)||0)+probability);
    return masses;
  }

  questionGain(id, distribution = this.selectionDistribution(), factMasses) {
    if(id.startsWith('fact:') && factMasses) {
      const mass=factMasses.get(id)||0;
      return Math.max(0,binaryEntropy(.5+.44*mass)-(1-mass)*binaryEntropy(.5)-mass*binaryEntropy(.94));
    }
    let mass = 0, conditionalEntropy = 0;
    for (const {item,probability} of distribution) {
      const yes = this.yesProbability(item,id);
      mass += probability*yes; conditionalEntropy += probability*binaryEntropy(yes);
    }
    return Math.max(0,binaryEntropy(mass)-conditionalEntropy);
  }

  async aiQuestionContext(language = 'de') {
    this.refreshGeneratedQuestions();
    const distribution = this.selectionDistribution();
    const factMasses = this.factMasses(distribution);
    const focused=this.focusedTopics();
    const features = [];
    let count = 0;
    for (const question of [...this.questions,...this.generatedQuestions]) {
      if (this.asked.has(question.id) || this.responses.has(question.id) || !this.isRelevant(question)) continue;
      const gain = rankedQuestionValue(question,this.questionGain(question.id,distribution,factMasses),this.questionFocusWeight(question.id,focused),this.answerCount,this.model.ranker);
      if (gain > .001) features.push({id:question.id,meaning:contextualQuestionText(question,language,this.subjectKind()),gain:Number(gain.toFixed(4))});
      if (++count % (question.id.startsWith('fact:') ? 128 : 12) === 0) await new Promise((resolve)=>setTimeout(resolve,0));
    }
    features.sort((a,b)=>b.gain-a.gain);
    this.aiBestGain = features[0]?.gain || 0;
    const eligible = features.slice(0,10);
    return {
      subject:this.isRealPerson() ? 'real person' : 'person or fictional character',
      known:[...this.responses].map(([id,answer])=>({id,answer})),
      features:eligible,
      candidates:distribution.slice(0,5).map(({item,probability})=>({
        // No need to reveal candidate names to the generator. It generates a
        // discriminator, never an answer/name question.
        probability:Number(probability.toFixed(3)),
        yes:eligible.filter(({id})=>item.attributes[id] === 1).map(({id})=>id),
        no:eligible.filter(({id})=>item.attributes[id] === -1 && !isImplicitNegative(item,id)).map(({id})=>id)
      }))
    };
  }

  chooseAIQuestion(proposals,language = 'de') {
    const distribution = this.selectionDistribution();
    let best = null, value = Math.max(.001,(this.aiBestGain || 0)*.8);
    for (const proposal of proposals) {
      if (this.asked.has(proposal.id) || proposal.featureIds.some((id)=>this.responses.has(id) || !this.isRelevant({id}))) continue;
      const gain = rankedQuestionValue({...proposal,en:proposal.text},this.questionGain(proposal.id,distribution),Math.max(...proposal.featureIds.map((id)=>this.questionFocusWeight(id))),this.answerCount,this.model.ranker);
      if (gain > value) { best = proposal; value = gain; }
    }
    if (!best) return null;
    this.asked.add(best.id);
    return {...best,de:best.text,en:best.text,generatedLanguage:language};
  }

  refreshGeneratedQuestions() {
    if (this.generatedSize !== this.characters.length) {
      this.generatedQuestions = descriptionQuestions(this.characters);
      for(const person of this.characters) invalidateAnswerTraits(person);
      this.generatedSize = this.characters.length;
      this.answerCache = new WeakMap();
      this.profileSignatures = new WeakMap();
      this.questionAliases = new Map();
      this.generatedQuestionKinds = new Map(this.generatedQuestions.map(question=>[question.id,question.kind]));
      this.redundantAfterYes = new Map(this.generatedQuestions.map(question=>[question.id,question.redundantAfterYes||[]]));
      this.generatedImplications = new Map(this.generatedQuestions.map(question=>[question.id,question.implies||[]]));
      for(const question of this.generatedQuestions) for(const alias of question.aliases || []) {
        this.questionAliases.set(question.id,[...(this.questionAliases.get(question.id)||[]),alias]);
        this.questionAliases.set(alias,[...(this.questionAliases.get(alias)||[]),question.id]);
      }
    }
  }

  *selectQuestion() {
    this.refreshGeneratedQuestions();
    const candidates = this.probabilities();
    const grouped = generateGroupedQuestions(candidates.slice(0,2000), (question) => this.isRelevant(question), this.asked);
    const unasked = [...this.questions, ...this.generatedQuestions, ...grouped].filter((question) => !this.asked.has(question.id) && this.isRelevant(question));
    if (!unasked.length || !candidates.length) return null;
    // The most probable candidates carry the useful decision boundary. Limiting
    // scoring to this normalized beam keeps 17k-person games responsive without
    // changing the final probability table or removing any candidate.
    let selectionCandidates = candidates;
    if (this.activeAnchors?.length) {
      const focused = candidates.filter(({item}) => this.activeAnchors.every((id) => item.attributes[id] === 1));
      const mass = focused.reduce((sum,{probability}) => sum + probability,0);
      if (mass >= .95) selectionCandidates = focused.map((entry) => ({...entry,probability:entry.probability / mass}));
    }
    if (selectionCandidates.length > 2000) {
      const head = selectionCandidates.slice(0, 1000);
      const tail = selectionCandidates.slice(1000);
      const mass = tail.reduce((sum, entry) => sum + entry.probability, 0);
      const sampled = [];
      let cursor = 0, cumulative = tail[0].probability;
      for (let index = 0; index < 1000; index++) {
        const quantile = (index + .5) * mass / 1000;
        while (cumulative < quantile && cursor < tail.length - 1) cumulative += tail[++cursor].probability;
        sampled.push({ item:tail[cursor].item, probability:mass / 1000 });
      }
      selectionCandidates = [...head, ...sampled];
    }
    let best = null;
    const factMasses=this.factMasses(selectionCandidates);
    const focused=this.focusedTopics();
    let bestValue = 0.0001;
    let evaluated = 0;
    for (const question of unasked) {
      // Once a concrete occupation is known, use questions that discriminate
      // inside that posterior, not a fixed tour through unrelated professions.
      const focus = question.featureIds ? Math.max(...question.featureIds.map((id) => this.questionFocusWeight(id,focused))) : this.questionFocusWeight(question.id,focused);
      // Information gain cannot exceed binary entropy. Skip work only when a
      // mathematical upper bound already loses, preserving the exact winner.
      const fact=question.id.startsWith('fact:');
      if(fact && !factMasses.get(question.id)) continue;
      const upperBound=fact ? Math.log(2)-binaryEntropy(.94) : Math.log(2);
      if(upperBound*focus<=bestValue) continue;
      if (++evaluated % (fact ? 512 : 12) === 0) yield;
      const gain = this.questionGain(question.id,selectionCandidates,factMasses);
      const value = rankedQuestionValue(question,gain,focus,this.answerCount,this.model.ranker);
      if (value > bestValue) { best = question; bestValue = value; }
    }
    if (!best) return null;
    this.asked.add(best.id);
    return best;
  }

  answer(questionId, answer) {
    const response = clamp(Number(answer), -1, 1);
    this.answerCount += 1;
    this.history.push({ questionId, answer: response });
    this.responses.set(questionId, response);
    if(response>=.5) for(const implied of this.generatedImplications.get(questionId)||[]) {
      if(!this.answeredNo(implied)) this.responses.set(implied,response);
      this.asked.add(implied);
    }
    // A denied disjunction denies each member; a positive disjunction does not
    // imply any individual member. Never store group answers as individual facts.
    if (questionId.startsWith('group:') && response <= -.5) {
      for (const id of questionId.slice(6).split('|')) { this.responses.set(id, response); this.asked.add(id); }
    }
    if (questionId.startsWith('all:') && response >= .5) {
      for (const id of questionId.slice(4).split('|')) { this.responses.set(id,response); this.asked.add(id); }
    }
    this.probabilityCache = null;
    if (response === 0) return;
    for (const character of this.characters) {
      const key = this.key(character);
      if (this.rejected.has(key)) continue;
      const yesProbability = this.yesProbability(character, questionId);
      const likelihood = response > 0 ? yesProbability : 1 - yesProbability;
      // Uncertainty is already represented by the answer likelihood. Applying
      // another .4 exponent to unknown facts made the scorer inconsistent with
      // information-gain selection and barely rewarded specific true facts.
      this.scores.set(key, (this.scores.get(key) ?? 0) + Math.abs(response) * Math.log(Math.max(.01, likelihood)));
    }
  }

  bestGuess() {
    const [best, second] = this.probabilities();
    if (!best) return null;
    const ratio = second ? best.probability / Math.max(.0001, second.probability) : 99;
    const confidence = clamp(best.probability, 0, .99);
    return { character: best.item, confidence, probability: best.probability, ratio };
  }

  shouldGuess() {
    const best = this.bestGuess();
    if (!best) return false;
    if (this.lastRejectionAnswerCount !== null && this.answerCount - this.lastRejectionAnswerCount < 3) return false;
    // A concentrated posterior is not enough if the winner contradicts known answers.
    const contradicts = [...this.responses].some(([id,answer])=>{
      const fact = best.character.attributes[id];
      return Math.abs(answer) >= .9 && fact && !isImplicitNegative(best.character,id) && Math.sign(answer) !== Math.sign(fact);
    });
    if (contradicts || best.probability < .9 || best.ratio < 9) return false;
    // Popularity must not decide between identical factual profiles. Compare
    // the full observable signature, not names, images, IDs or ranking priors.
    const askable=new Set([...this.questions,...this.generatedQuestions].map(question=>question.id));
    const signature = (item) => {
      if(!this.profileSignatures.has(item)) {
        const facts=Object.entries(item.attributes).filter(([id,value])=>askable.has(id) && value && !isImplicitNegative(item,id));
        this.profileSignatures.set(item,JSON.stringify(facts.sort(([a],[b])=>a.localeCompare(b))));
      }
      return this.profileSignatures.get(item);
    };
    return !this.probabilities().slice(1).some(({item})=>signature(item)===signature(best.character));
  }

  reject(idOrName) {
    const match = this.characters.find((item) => this.key(item) === idOrName || item.name === idOrName);
    this.rejected.add(match ? this.key(match) : idOrName);
    this.lastRejectionAnswerCount = this.answerCount;
    this.probabilityCache = null;
  }
}
