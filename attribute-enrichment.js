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
  sonic:/sonic the hedgehog/i,
  retired:/\bretired\b|\bformer\b|ehemalig|im ruhestand|career ended/i,
  singer:/\bsinger\b|\bvocalist\b|sänger|sängerin|gesangssolist/i,
  songwriter:/singer-songwriter|songwriter|liedermacher|songschreiber/i,
  soloSinger:/solo singer|solo artist|solosänger|solosängerin/i,
  rnbSoulSinger:/r&b|rhythm and blues|soul singer|soulsänger/i,
  jazzSinger:/jazz singer|jazz vocalist|jazzsänger/i,
  operaSinger:/opera singer|operatic singer|operasänger/i,
  kpopSinger:/k-pop|kpop/i,
  latinSinger:/latin singer|latin music|reggaeton|salsa singer|latin-pop/i,
  schlagerSinger:/schlager/i,
  folkSinger:/folk singer|folk musician|singer-songwriter|liedermacher/i,
  popMusician:/pop singer|pop musician|pop ?star|popsänger|popmusiker/i,
  rockMusician:/rock singer|rock musician|rock guitarist|heavy metal|rockmusiker|rocksänger|metal-musiker/i,
  classicalMusician:/classical musician|classical composer|opera singer|klassische musik|operasänger/i,
  electronicMusician:/electronic musician|electronic music|techno|house music|electro-musiker/i,
  countryMusician:/country singer|country musician|country-musiker/i,
  musicProducer:/music producer|record producer|musikproduzent/i,
  martialArts:/mixed martial artist|martial artist|mma fighter|judoka|karateka|kampfsportler/i,
  cricket:/cricketer|cricket player/i,
  volleyball:/volleyball player|volleyballspieler/i,
  handball:/handball player|handballspieler/i,
  americanFootball:/american football player|nfl player|american-football-spieler/i,
  winterSports:/skier|ski jumper|snowboarder|biathlete|speed skater|skispringer|biathlet|eisschnellläufer/i,
  youtuber:/youtuber|youtube personality|webvideoproduzent/i,
  streamer:/\bstreamer\b|livestreamer|live streamer/i,
  twitchStreamer:/twitch/i,
  youtubeStreamer:/youtube streamer|streams? on youtube/i,
  gamingStreamer:/gaming streamer|game streamer|videospiel-streamer/i,
  minecraftStreamer:/minecraft (?:streamer|youtuber|creator)|minecraft content/i,
  competitiveGameStreamer:/esports streamer|competitive gamer|counter-strike|valorant|league of legends|fortnite streamer/i,
  irlStreamer:/irl streamer|just chatting/i,
  politicalStreamer:/political streamer|political commentator|politics streamer/i,
  vtuber:/\bvtuber\b|virtual youtuber/i,
  varietyStreamer:/variety streamer/i,
  challengeCreator:/challenge youtuber|online challenges|stunt youtuber/i,
  commentaryCreator:/commentary youtuber|reaction youtuber|video essayist/i,
  tiktoker:/tiktoker|tik tok personality/i,
  podcaster:/podcaster|podcast host/i,
  mayor:/\bmayor\b|bürgermeister/i,
  legislator:/member of parliament|member of congress|legislator|abgeordnete|abgeordneter/i,
  chancellor:/\bchancellor\b|bundeskanzler|bundeskanzlerin/i,
  governor:/\bgovernor\b|ministerpräsident|ministerpräsidentin/i,
  computerScientist:/computer scientist|informatiker|informatikerin/i,
  economist:/economist|wirtschaftswissenschaftler|ökonom/i,
  psychologist:/psychologist|psychologe|psychologin/i,
  astronomer:/astronomer|astronomin|astronom /i,
  environmentalScientist:/climate scientist|environmental scientist|klimaforscher|umweltwissenschaftler/i,
  novelist:/novelist|romanautor|romanschriftsteller/i,
  playwright:/playwright|dramatist|dramatiker|theaterautor/i,
  childrensAuthor:/children's author|children’s author|kinderbuchautor/i,
  theaterActor:/stage actor|theatre actor|theater actor|theaterschauspieler/i,
  realityTV:/reality television|reality tv|reality-tv/i,
  awardWinningActor:/academy award-winning actor|oscar-winning actor|emmy award-winning actor|oscarpreisträger/i,
  techEntrepreneur:/technology entrepreneur|tech entrepreneur|software entrepreneur|internet entrepreneur|technologieunternehmer/i,
  finance:/investor|financier|investment banker|hedge fund|bankier|investorin/i,
  fashionBusiness:/fashion designer|fashion entrepreneur|modedesigner|modeunternehmer/i,
  army:/army officer|army general|army soldier|heeresoffizier/i,
  navy:/naval officer|navy admiral|navy officer|marineoffizier/i,
  airForce:/air force officer|air force general|luftwaffenoffizier/i,
  wizard:/wizard|witch|zauberer|hexe/i,
  warrior:/warrior|fighter character|krieger|kämpfer/i,
  policeCharacter:/fictional police|police officer character|polizist.*figur/i,
  studentCharacter:/fictional student|school student|schüler.*figur|student.*figur/i,
  sitcom:/sitcom/i,
  crimeFiction:/crime fiction|crime drama|detective fiction|kriminalroman|krimiserie/i,
  gameOfThrones:/game of thrones|a song of ice and fire/i,
  austrian:/austrian|österreichisch/i,
  swiss:/swiss|schweizerisch/i,
  dutch:/dutch|niederländisch/i,
  swedish:/swedish|schwedisch/i,
  polish:/polish|polnisch/i,
  russian:/russian|russisch/i,
  ukrainian:/ukrainian|ukrainisch/i,
  turkish:/turkish|türkisch/i,
  mexican:/mexican|mexikanisch/i,
  argentine:/argentine|argentinian|argentinisch/i,
  nigerian:/nigerian|nigerianisch/i,
  southAfrican:/south african|südafrikanisch/i,
  portuguese:/portuguese|portugiesisch/i,
  belgian:/belgian|belgisch/i,
  irish:/\birish\b|irisch/i,
  norwegian:/norwegian|norwegisch/i,
  danish:/\bdanish\b|dänisch/i
};

const singerDetails = ["songwriter","soloSinger","rnbSoulSinger","jazzSinger","operaSinger","kpopSinger","latinSinger","schlagerSinger","folkSinger"];
const streamerDetails = ["twitchStreamer","youtubeStreamer","gamingStreamer","minecraftStreamer","competitiveGameStreamer","irlStreamer","politicalStreamer","vtuber","varietyStreamer"];

// Short Wikidata descriptions cannot express every useful distinction. These
// local profiles cover especially popular singers and streamers deterministically;
// they are also fed back into the generated question model during training.
const knownProfiles = new Map(Object.entries({
  "Taylor Swift": ["singer","songwriter","soloSinger","popMusician","countryMusician"],
  "Beyoncé": ["singer","songwriter","soloSinger","popMusician","rnbSoulSinger","musicGroup"],
  "Michael Jackson": ["singer","songwriter","soloSinger","popMusician","rnbSoulSinger","musicGroup"],
  "Elvis Presley": ["singer","soloSinger","rockMusician","countryMusician"],
  "Freddie Mercury": ["singer","songwriter","rockMusician","musicGroup"],
  "Adele": ["singer","songwriter","soloSinger","popMusician","rnbSoulSinger"],
  "Rihanna": ["singer","soloSinger","popMusician","rnbSoulSinger"],
  "Billie Eilish": ["singer","songwriter","soloSinger","popMusician"],
  "Ed Sheeran": ["singer","songwriter","soloSinger","popMusician","folkSinger"],
  "Lady Gaga": ["singer","songwriter","soloSinger","popMusician"],
  "Ariana Grande": ["singer","soloSinger","popMusician","rnbSoulSinger"],
  "Selena Gomez": ["singer","soloSinger","popMusician"],
  "Justin Bieber": ["singer","soloSinger","popMusician"],
  "Drake": ["singer","songwriter","soloSinger","rnbSoulSinger","rapper"],
  "Whitney Houston": ["singer","soloSinger","popMusician","rnbSoulSinger"],
  "Madonna": ["singer","songwriter","soloSinger","popMusician"],
  "Britney Spears": ["singer","soloSinger","popMusician"],
  "Bruno Mars": ["singer","songwriter","soloSinger","popMusician","rnbSoulSinger"],
  "Dua Lipa": ["singer","songwriter","soloSinger","popMusician"],
  "Shakira": ["singer","songwriter","soloSinger","popMusician","latinSinger"],
  "Bad Bunny": ["singer","soloSinger","latinSinger","rapper"],
  "The Weeknd": ["singer","songwriter","soloSinger","popMusician","rnbSoulSinger"],
  "Post Malone": ["singer","songwriter","soloSinger","popMusician","rapper"],
  "Miley Cyrus": ["singer","songwriter","soloSinger","popMusician","rockMusician"],
  "Olivia Rodrigo": ["singer","songwriter","soloSinger","popMusician","rockMusician"],
  "Harry Styles": ["singer","songwriter","soloSinger","popMusician","rockMusician","musicGroup"],
  "Mariah Carey": ["singer","songwriter","soloSinger","popMusician","rnbSoulSinger"],
  "Céline Dion": ["singer","soloSinger","popMusician"],
  "Celine Dion": ["singer","soloSinger","popMusician"],
  "Frank Sinatra": ["singer","soloSinger","jazzSinger"],
  "Andrea Bocelli": ["singer","soloSinger","operaSinger","classicalMusician"],
  "Helene Fischer": ["singer","soloSinger","schlagerSinger","popMusician"],
  "BTS": ["singer","kpopSinger","popMusician","musicGroup"],
  "Jungkook": ["singer","soloSinger","kpopSinger","popMusician","musicGroup"],
  "Papaplatte": ["streamer","twitchStreamer","gamingStreamer","minecraftStreamer","varietyStreamer","podcaster"],
  "IShowSpeed": ["streamer","youtubeStreamer","gamingStreamer","varietyStreamer"],
  "Hasan Piker": ["streamer","twitchStreamer","politicalStreamer","irlStreamer"],
  "Ibai Llanos": ["streamer","twitchStreamer","gamingStreamer","competitiveGameStreamer","varietyStreamer"],
  "Kai Cenat": ["streamer","twitchStreamer","irlStreamer","varietyStreamer"],
  "Adin Ross": ["streamer","twitchStreamer","irlStreamer"],
  "Amouranth": ["streamer","twitchStreamer","irlStreamer","varietyStreamer"],
  "Dr Disrespect": ["streamer","youtubeStreamer","gamingStreamer","competitiveGameStreamer","varietyStreamer"],
  "Angryginge": ["streamer","twitchStreamer","gamingStreamer"],
  "Sketch": ["streamer","twitchStreamer","gamingStreamer"],
  "Inoxtag": ["streamer","youtubeStreamer","gamingStreamer"],
  "PewDiePie": ["youtuber","gamingStreamer","commentaryCreator"],
  "MrBeast": ["youtuber","challengeCreator"]
}));

const sports = ["boxer","wrestler","racingDriver","golfer","cyclist","swimmer","runner","baseball","iceHockey","gymnast","esports","martialArts","cricket","volleyball","handball","americanFootball","winterSports"];
const sciences = ["physicist","mathematician","chemist","biologist","astronaut","engineer","inventor","academic","computerScientist","economist","psychologist","astronomer","environmentalScientist"];

export function enrichCharacterAttributes(character) {
  character.attributes ||= {};
  const text = `${character.name || ""} ${character.description || ""}`;
  for (const [id, pattern] of Object.entries(rules)) if (pattern.test(text)) character.attributes[id] = 1;
  for (const id of knownProfiles.get(character.name) || []) character.attributes[id] = 1;

  // Wikidata occupations often include singing as a minor side activity. The
  // question explicitly asks whether singing is the person's main identity, so
  // actor/director-only descriptions remain unknown instead of polluting the
  // singer branch.
  const mainSinger = rules.singer.test(text) || singerDetails.some((id) => character.attributes[id] === 1) || knownProfiles.get(character.name)?.includes("singer");
  const clearlyDifferentMainRole = /actor|actress|schauspiel|film director|regisseur|politician|politiker|athlete|sportler|model|comedian|komiker/i.test(character.description || "");
  if (character.attributes.singer === 1 && !mainSinger && clearlyDifferentMainRole) character.attributes.singer = 0;
  const explicitlyActor = /actor|actress|schauspiel/i.test(character.description || "");
  if (character.attributes.actor === 1 && mainSinger && !explicitlyActor) character.attributes.actor = 0;
  const primaryStreamer = character.attributes.streamer === 1;
  if (primaryStreamer && !explicitlyActor) character.attributes.actor = 0;
  if (primaryStreamer && !/musician|music|singer|songwriter|rapper|musiker|sänger/i.test(character.description || "")) {
    character.attributes.musician = 0;
    character.attributes.rapper = 0;
  }
  if (character.attributes.musician === 1 && character.attributes.singer === 0
      && !/musician|composer|songwriter|rapper|music|musiker|komponist|sänger|rapper/i.test(text)) character.attributes.musician = 0;
  if (character.attributes.singer === 1) {
    character.attributes.musician = 1;
    for (const id of singerDetails) character.attributes[id] ??= -1;
    character.attributes.soloSinger ??= character.attributes.musicGroup === 1 ? -1 : 1;
  }
  if (character.attributes.streamer === 1) {
    for (const id of streamerDetails) character.attributes[id] ??= -1;
  } else if (character.attributes.creator === 1 && character.attributes.streamer == null) {
    character.attributes.streamer = -1;
  }
  if (["composer","dj","instrumentalist"].some((id) => character.attributes[id] === 1)) character.attributes.musician = 1;
  if (["popMusician","rockMusician","classicalMusician","electronicMusician","countryMusician","musicProducer"].some((id) => character.attributes[id] === 1)) character.attributes.musician = 1;
  if (sports.some((id) => character.attributes[id] === 1)) character.attributes.athlete = 1;
  if (sciences.some((id) => character.attributes[id] === 1)) character.attributes.scientist = 1;
  if (character.attributes.gamer === 1 || character.attributes.esports === 1) {
    character.attributes.internet = 1;
    character.attributes.creator ||= character.attributes.gamer === 1 ? 1 : character.attributes.creator;
  }
  if (["youtuber","streamer","tiktoker","podcaster"].some((id) => character.attributes[id] === 1)) {
    character.attributes.creator = 1;
    character.attributes.internet = 1;
  }
  if (character.attributes.creator === 1 && character.attributes.streamer == null) character.attributes.streamer = -1;
  if (["mayor","legislator","chancellor","governor"].some((id) => character.attributes[id] === 1)) character.attributes.politician = 1;
  if (["novelist","playwright","childrensAuthor"].some((id) => character.attributes[id] === 1)) character.attributes.writer = 1;
  if (["techEntrepreneur","finance","fashionBusiness"].some((id) => character.attributes[id] === 1)) character.attributes.entrepreneur = 1;
  if (["army","navy","airForce"].some((id) => character.attributes[id] === 1)) character.attributes.military = 1;
  if (character.attributes.poet === 1 || character.attributes.screenwriter === 1) character.attributes.writer = 1;
  if (character.attributes.photographer === 1 || character.attributes.architect === 1) character.attributes.artist = 1;
  const entertainmentTraits = ["actor","musician","comedian","dancer","model","director","producer","presenter","creator","journalist"];
  if (entertainmentTraits.some((id) => character.attributes[id] === 1)) character.attributes.entertainment = 1;
  else if (character.attributes.real === 1 && character.attributes.personallyKnown !== 1) character.attributes.entertainment = -1;
  const europeanGroups = {
    germanSpeaking:["german","austrian","swiss"],
    nordic:["swedish","norwegian","danish"],
    easternEuropean:["polish","russian","ukrainian"],
    southernEuropean:["spanish","italian","portuguese"],
    westernEuropean:["british","french","dutch","belgian","irish"]
  };
  if (Object.values(europeanGroups).flat().some((id) => character.attributes[id] === 1)) {
    for (const region of Object.keys(europeanGroups)) character.attributes[region] = -1;
  }
  const setRegion = (region, members) => {
    if (members.some((id) => character.attributes[id] === 1)) character.attributes[region] = 1;
  };
  for (const [region, members] of Object.entries(europeanGroups)) setRegion(region, members);
  const careerRoots = ["athlete","politician","military","actor","creator","scientist","artist","entrepreneur","writer","journalist","producer","dancer","chef","musician"];
  if (character.attributes.real === 1 && character.attributes.alive === 1 && careerRoots.some((id) => character.attributes[id] === 1) && character.attributes.retired !== 1) character.attributes.retired = -1;
  if (["comic","scienceFiction","fantasy","alien","monster","harryPotter","lordOfTheRings","mario","sonic","wizard","warrior","policeCharacter","studentCharacter","sitcom","crimeFiction","gameOfThrones"].some((id) => character.attributes[id] === 1)) {
    character.attributes.real = -1;
    character.attributes.fictional = 1;
  }
  return character;
}
