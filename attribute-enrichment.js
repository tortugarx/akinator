// Deterministic, offline enrichment for traits that can be read safely from the
// short Wikidata description already bundled with the game.
const rules = {
  journalist:/journalist|reporter|publizist|reporterin/i,
  presenter:/presenter|television host|radio host|show host|fernsehmoderator|radiomoderator/i,
  producer:/film producer|music producer|record producer|produzent/i,
  dancer:/dancer|tänzer|tänzerin/i,
  composer:/composer|komponist|komponistin/i,
  dj:/disc jockey|\bdj\b/i,
  instrumentalist:/guitarist|pianist|violinist|drummer|gitarrist|pianistin|geiger|schlagzeuger/i,
  gamer:/gamer|game streamer|gaming streamer|videospiel-streamer/i,
  esports:/esports player|e-sports player|e-sportler/i,
  boxer:/\bboxer|boxing champion|boxerin/i,
  wrestler:/wrestler|professional wrestling|wrestlerin/i,
  racingDriver:/racing driver|formula one driver|rennfahrer|formel-1-fahrer/i,
  coach:/sports coach|football manager|basketball coach|trainer|fußballtrainer/i,
  golfer:/\bgolfer|golf player/i,
  cyclist:/cyclist|racing cyclist|radrennfahrer|radsportler/i,
  swimmer:/\bswimmer|schwimmer|schwimmerin/i,
  runner:/sprinter|long-distance runner|middle-distance runner|läufer|sprinterin/i,
  baseball:/baseball player|baseballspieler/i,
  iceHockey:/ice hockey player|eishockeyspieler/i,
  gymnast:/\bgymnast|turner|turnerin/i,
  physicist:/physicist|physiker|physikerin/i,
  mathematician:/mathematician|mathematiker|mathematikerin/i,
  chemist:/\bchemist|chemiker|chemikerin/i,
  biologist:/biologist|biologe|biologin/i,
  astronaut:/astronaut|cosmonaut|kosmonaut/i,
  engineer:/\bengineer|ingenieur|ingenieurin/i,
  inventor:/inventor|erfinder|erfinderin/i,
  photographer:/photographer|fotograf|fotografin/i,
  architect:/architect|architekt|architektin/i,
  chef:/\bchef\b|cookbook author|celebrity cook|koch|köchin/i,
  poet:/\bpoet|dichter|dichterin/i,
  philosopher:/philosopher|philosoph|philosophin/i,
  screenwriter:/screenwriter|drehbuchautor|drehbuchautorin/i,
  voiceActor:/voice actor|voice actress|synchronsprecher|synchronsprecherin/i,
  academic:/professor|academic|hochschullehrer|hochschullehrerin/i,
  ministerDiplomat:/diplomat|government minister|foreign minister|innenminister|außenminister|diplomatin/i,
  comic:/comic book character|comics character|comicfigur/i,
  scienceFiction:/science fiction|sci-fi/i,
  fantasy:/fantasy character|fantasy novel|fantasy film/i,
  alien:/extraterrestrial|alien character|außerirdisch/i,
  monster:/monster|supernatural creature|dämon|vampire|werwolf/i,
  harryPotter:/harry potter/i,
  lordOfTheRings:/lord of the rings|herr der ringe/i,
  mario:/mario franchise|mario series|super mario/i,
  sonic:/sonic the hedgehog/i
};

const sports = ["boxer","wrestler","racingDriver","golfer","cyclist","swimmer","runner","baseball","iceHockey","gymnast","esports"];
const sciences = ["physicist","mathematician","chemist","biologist","astronaut","engineer","inventor","academic"];

export function enrichCharacterAttributes(character) {
  character.attributes ||= {};
  const text = `${character.name || ""} ${character.description || ""}`;
  for (const [id, pattern] of Object.entries(rules)) if (pattern.test(text)) character.attributes[id] = 1;
  if (["composer","dj","instrumentalist"].some((id) => character.attributes[id] === 1)) character.attributes.musician = 1;
  if (sports.some((id) => character.attributes[id] === 1)) character.attributes.athlete = 1;
  if (sciences.some((id) => character.attributes[id] === 1)) character.attributes.scientist = 1;
  if (character.attributes.gamer === 1 || character.attributes.esports === 1) {
    character.attributes.internet = 1;
    character.attributes.creator ||= character.attributes.gamer === 1 ? 1 : character.attributes.creator;
  }
  if (character.attributes.poet === 1 || character.attributes.screenwriter === 1) character.attributes.writer = 1;
  if (character.attributes.photographer === 1 || character.attributes.architect === 1) character.attributes.artist = 1;
  const entertainmentTraits = ["actor","musician","comedian","dancer","model","director","producer","presenter"];
  if (entertainmentTraits.some((id) => character.attributes[id] === 1)) character.attributes.entertainment = 1;
  else if (character.attributes.real === 1 && character.attributes.personallyKnown !== 1) character.attributes.entertainment = -1;
  if (["comic","scienceFiction","fantasy","alien","monster","harryPotter","lordOfTheRings","mario","sonic"].some((id) => character.attributes[id] === 1)) {
    character.attributes.real = -1;
    character.attributes.fictional = 1;
  }
  return character;
}
