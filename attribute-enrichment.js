// Deterministic, offline enrichment for traits that can be read safely from the
// short Wikidata description already bundled with the game.
const rules = {
  journalist:/journalist|reporter|publizist|reporterin/i,
  presenter:/presenter|television host|radio host|show host|fernsehmoderator|radiomoderator/i,
  producer:/film producer|music producer|record producer|filmproduzent|musikproduzent/i,
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
  filmActor:/film actor|film actress|movie actor|movie actress|filmschauspiel/i,
  seriesActor:/television actor|television actress|tv actor|series actor|fernsehschauspiel/i,
  childActor:/child actor|child actress|kinderdarsteller/i,
  actionActor:/action star|action actor|actionfilm/i,
  horrorActor:/horror actor|horror actress|horrorfilm/i,
  bollywoodActor:/bollywood|indian film actor|indian film actress/i,
  soapActor:/soap opera actor|soap opera actress|soapdarsteller/i,
  adultFilmPerformer:/pornographic actor|pornographic actress|porn actor|porn actress|adult film actor|adult film actress|pornodarsteller/i,
  onlyFansCreator:/onlyfans/i,
  adultDirector:/porn director|adult film director|pornoregisseur/i,
  academic:/professor|academic|hochschullehrer|hochschullehrerin/i,
  ministerDiplomat:/diplomat|government minister|foreign minister|innenminister|außenminister|diplomatin/i,
  primeMinister:/prime minister|premierminister/i,
  president:/president of|president von|staatspräsident/i,
  partyLeader:/party leader|parteivorsitz|parteichef/i,
  cabinetMinister:/cabinet minister|government minister|bundesminister|staatsminister/i,
  diplomat:/\bdiplomat|diplomatin|ambassador|botschafter/i,
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
  vlogger:/\bvlogger\b|video blogger/i,
  beautyCreator:/beauty youtuber|beauty influencer|make-?up artist|fashion influencer/i,
  techCreator:/technology youtuber|tech youtuber|technology reviewer/i,
  educationCreator:/educational youtuber|science youtuber|educational content creator/i,
  foodCreator:/food youtuber|cooking youtuber|food blogger|mukbang|mok-bang/i,
  travelCreator:/travel youtuber|travel vlogger|travel blogger/i,
  fitnessCreator:/fitness youtuber|fitness influencer|bodybuilder.*youtuber/i,
  comedyCreator:/comedy youtuber|comedy creator|sketch comedian/i,
  kidsCreator:/children's youtuber|kids youtuber|family youtuber/i,
  musicCreator:/music youtuber|musical youtuber/i,
  sportsCreator:/sports youtuber|football youtuber|sports influencer/i,
  prankCreator:/prankster|prank youtuber/i,
  roleplayStreamer:/gta roleplay|roleplay streamer/i,
  sportsGameStreamer:/fifa streamer|ea sports fc streamer|sports game streamer/i,
  battleRoyaleStreamer:/fortnite streamer|pubg streamer|battle royale streamer/i,
  mobaStreamer:/league of legends streamer|dota streamer|moba streamer/i,
  shooterStreamer:/counter-strike streamer|valorant streamer|call of duty streamer|shooter streamer/i,
  speedrunner:/speedrunner|speedrunning/i,
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
  fantasyAuthor:/fantasy author|fantasy writer|fantasy novelist/i,
  scifiAuthor:/science fiction author|science-fiction writer|sci-fi author/i,
  crimeAuthor:/crime writer|crime novelist|detective fiction writer|krimiautor/i,
  nonfictionAuthor:/nonfiction writer|non-fiction writer|sachbuchautor/i,
  theaterActor:/stage actor|theatre actor|theater actor|theaterschauspieler/i,
  realityTV:/reality television|reality tv|reality-tv/i,
  awardWinningActor:/academy award-winning actor|oscar-winning actor|emmy award-winning actor|oscarpreisträger/i,
  techEntrepreneur:/technology entrepreneur|tech entrepreneur|software entrepreneur|internet entrepreneur|technologieunternehmer/i,
  finance:/investor|financier|investment banker|hedge fund|bankier|investorin/i,
  fashionBusiness:/fashion designer|fashion entrepreneur|modedesigner|modeunternehmer/i,
  army:/army officer|army general|army soldier|heeresoffizier/i,
  navy:/naval officer|navy admiral|navy officer|marineoffizier/i,
  airForce:/air force officer|air force general|luftwaffenoffizier/i,
  generalOfficer:/army general|general officer|field marshal|feldmarschall|heer.*general/i,
  admiral:/\badmiral\b/i,
  militaryPilot:/military pilot|fighter pilot|luftwaffenpilot/i,
  chiefExecutive:/chief executive|\bceo\b|business executive|vorstandsvorsitz/i,
  billionaire:/\bbillionaire\b|milliardär/i,
  guitarist:/guitarist|gitarrist/i,
  pianist:/pianist|pianistin/i,
  drummer:/drummer|schlagzeuger/i,
  violinist:/violinist|geiger|geigerin/i,
  conductor:/orchestra conductor|music conductor|dirigent/i,
  metalMusician:/heavy metal|metal musician|metal singer|metal band/i,
  reggaeMusician:/reggae musician|reggae singer/i,
  gospelSinger:/gospel singer|gospel musician/i,
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

const singerDetails = ["songwriter","soloSinger","rnbSoulSinger","jazzSinger","operaSinger","kpopSinger","latinSinger","schlagerSinger","folkSinger","metalMusician","reggaeMusician","gospelSinger"];
const streamerDetails = ["twitchStreamer","youtubeStreamer","gamingStreamer","minecraftStreamer","competitiveGameStreamer","irlStreamer","politicalStreamer","vtuber","varietyStreamer","roleplayStreamer","sportsGameStreamer","battleRoyaleStreamer","mobaStreamer","shooterStreamer","speedrunner"];
const creatorDetails = ["challengeCreator","commentaryCreator","vlogger","beautyCreator","techCreator","educationCreator","foodCreator","travelCreator","fitnessCreator","comedyCreator","kidsCreator","musicCreator","sportsCreator","prankCreator"];
const branchDetailDefaults = {
  actor:["filmActor","seriesActor","childActor","actionActor","horrorActor","bollywoodActor","soapActor","adultFilmPerformer","onlyFansCreator","adultDirector","marvelActor","dcActor","starWarsActor","harryPotterActor","sitcomActor","superheroActor"],
  musician:["guitarist","pianist","drummer","violinist","conductor","metalMusician","reggaeMusician","gospelSinger","popMusician","rockMusician","classicalMusician","electronicMusician","countryMusician","musicProducer","songwriter","soloSinger","rnbSoulSinger","jazzSinger","operaSinger","kpopSinger","latinSinger","schlagerSinger","folkSinger"],
  creator:[...creatorDetails,"youtuber","streamer","tiktoker","podcaster","gamer","esports","adultCreator","onlyFansCreator","adultFilmPerformer"],
  politician:["primeMinister","president","partyLeader","cabinetMinister","diplomat","nationalLeader","usPresident","mayor","legislator","chancellor","governor","activist","militaryLeader"],
  writer:["fantasyAuthor","scifiAuthor","crimeAuthor","nonfictionAuthor"],
  military:["generalOfficer","admiral","militaryPilot"],
  entrepreneur:["chiefExecutive","billionaire"]
};

const primaryCareerSignals = {
  actor:/\bactor\b|\bactress\b|schauspiel|darsteller|filmschauspiel|fernsehschauspiel/i,
  singer:/\bsinger\b|vocalist|sänger|sängerin/i,
  musician:/\bmusician\b|musiker|musikerin|composer|komponist|songwriter|rapper|rockmusiker|jazzmusiker/i,
  athlete:/\bathlete\b|sportler|sportlerin|footballer|soccer player|basketball player|tennis player|racing driver|rennfahrer|boxer|wrestler/i,
  politician:/\bpolitician\b|political activist|politiker|politikerin|president|prime minister|chancellor|bundeskanzler|ministerpräsident/i,
  creator:/youtuber|streamer|influencer|content creator|social media personality|internet personality|webvideoproduzent|livestreamer|tiktoker|vlogger/i,
  scientist:/\bscientist\b|physicist|chemist|biologist|mathematician|wissenschaftler|physiker|chemiker|biologe|mathematiker/i,
  writer:/\bwriter\b|\bauthor\b|novelist|poet|schriftsteller|autor|dichter/i,
  entrepreneur:/entrepreneur|businessman|businesswoman|unternehmer|business magnate/i,
  comedian:/comedian|komiker|stand-up comedian/i,
  model:/fashion model|fotomodell/i,
  director:/film director|filmmaker|regisseur|regisseurin/i,
  artist:/visual artist|painter|sculptor|maler|bildhauer/i,
  military:/military officer|army officer|soldier|admiral|general|militär|soldat|offizier/i,
  journalist:/journalist|reporter|publizist/i
};
const primaryCareerRoots = Object.keys(primaryCareerSignals);

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
  "Papaplatte": ["streamer","twitchStreamer","gamingStreamer","minecraftStreamer","varietyStreamer","podcaster","vlogger"],
  "IShowSpeed": ["streamer","youtubeStreamer","gamingStreamer","sportsGameStreamer","varietyStreamer","musicCreator","sportsCreator"],
  "Hasan Piker": ["streamer","twitchStreamer","politicalStreamer","irlStreamer","commentaryCreator"],
  "Ibai Llanos": ["streamer","twitchStreamer","gamingStreamer","competitiveGameStreamer","sportsGameStreamer","varietyStreamer","sportsCreator"],
  "Kai Cenat": ["streamer","twitchStreamer","irlStreamer","varietyStreamer","comedyCreator"],
  "Adin Ross": ["streamer","twitchStreamer","irlStreamer"],
  "Amouranth": ["streamer","twitchStreamer","irlStreamer","varietyStreamer","adultCreator","onlyFansCreator"],
  "Sophie Rain": ["creator","adultCreator","onlyFansCreator"],
  "Mia Khalifa": ["creator","adultCreator","adultFilmPerformer"],
  "Dr Disrespect": ["streamer","youtubeStreamer","gamingStreamer","competitiveGameStreamer","shooterStreamer","varietyStreamer"],
  "Angryginge": ["streamer","twitchStreamer","gamingStreamer","sportsGameStreamer"],
  "Sketch": ["streamer","twitchStreamer","gamingStreamer","sportsGameStreamer"],
  "Inoxtag": ["streamer","youtubeStreamer","gamingStreamer","vlogger"],
  "PewDiePie": ["youtuber","gamingStreamer","commentaryCreator"],
  "MrBeast": ["creator","youtuber","challengeCreator"],
  "Matthew Perry": ["seriesActor","sitcomActor"],
  "Jenna Ortega": ["seriesActor","horrorActor","childActor"],
  "Johnny Depp": ["filmActor"],
  "Val Kilmer": ["filmActor","actionActor","dcActor","superheroActor"],
  "Betty White": ["seriesActor","sitcomActor"],
  "Robert Redford": ["filmActor","awardWinningActor"],
  "Gene Hackman": ["filmActor","awardWinningActor"],
  "Maggie Smith": ["filmActor","seriesActor","harryPotterActor","awardWinningActor"],
  "Brendan Fraser": ["filmActor","actionActor","awardWinningActor"],
  "Cillian Murphy": ["filmActor","seriesActor","awardWinningActor"],
  "Margot Robbie": ["filmActor","dcActor","superheroActor"],
  "Pedro Pascal": ["seriesActor","starWarsActor"],
  "Michelle Yeoh": ["filmActor","actionActor","awardWinningActor"],
  "Arnold Schwarzenegger": ["filmActor","actionActor"],
  "Will Smith": ["filmActor","actionActor","awardWinningActor"],
  "Macaulay Culkin": ["filmActor","childActor"],
  "Emma Stone": ["filmActor","awardWinningActor"],
  "Adrien Brody": ["filmActor","awardWinningActor"],
  "Tom Cruise": ["filmActor","actionActor"],
  "Sydney Sweeney": ["seriesActor","filmActor"],
  "Jamie Lee Curtis": ["filmActor","horrorActor","awardWinningActor"],
  "Charlie Sheen": ["seriesActor","sitcomActor","filmActor"],
  "Bella Ramsey": ["seriesActor"],
  "Millie Bobby Brown": ["seriesActor","childActor"],
  "Zendaya": ["seriesActor","filmActor","marvelActor","superheroActor"],
  "Blake Lively": ["seriesActor","filmActor"],
  "Jeremy Renner": ["filmActor","actionActor","marvelActor","superheroActor"],
  "Ryan Gosling": ["filmActor"],
  "Keanu Reeves": ["filmActor","actionActor","dcActor"],
  "Alan Rickman": ["filmActor","theaterActor","harryPotterActor"],
  "Scarlett Johansson": ["filmActor","actionActor","marvelActor","superheroActor"],
  "Robert Downey Jr.": ["filmActor","marvelActor","superheroActor"],
  "Chris Evans": ["filmActor","actionActor","marvelActor","superheroActor"],
  "Chris Hemsworth": ["filmActor","actionActor","marvelActor","superheroActor"],
  "Tom Holland": ["filmActor","marvelActor","superheroActor"],
  "Benedict Cumberbatch": ["filmActor","seriesActor","marvelActor","superheroActor"],
  "Mark Ruffalo": ["filmActor","marvelActor","superheroActor"],
  "Elizabeth Olsen": ["filmActor","seriesActor","marvelActor","superheroActor"],
  "Ryan Reynolds": ["filmActor","actionActor","marvelActor","superheroActor"],
  "Hugh Jackman": ["filmActor","actionActor","marvelActor","superheroActor"],
  "Gal Gadot": ["filmActor","actionActor","dcActor","superheroActor"],
  "Henry Cavill": ["filmActor","seriesActor","actionActor","dcActor","superheroActor"],
  "Christian Bale": ["filmActor","actionActor","dcActor","superheroActor","awardWinningActor"],
  "Ben Affleck": ["filmActor","dcActor","superheroActor","awardWinningActor"],
  "Robert Pattinson": ["filmActor","dcActor","superheroActor"],
  "Jason Momoa": ["filmActor","seriesActor","actionActor","dcActor","superheroActor"],
  "Mark Hamill": ["filmActor","voiceActor","starWarsActor"],
  "Harrison Ford": ["filmActor","actionActor","starWarsActor"],
  "Carrie Fisher": ["filmActor","starWarsActor"],
  "Natalie Portman": ["filmActor","starWarsActor","marvelActor","awardWinningActor"],
  "Ewan McGregor": ["filmActor","seriesActor","starWarsActor"],
  "Daniel Radcliffe": ["filmActor","harryPotterActor","childActor"],
  "Emma Watson": ["filmActor","harryPotterActor","childActor"],
  "Rupert Grint": ["filmActor","harryPotterActor","childActor"],
  "Ralph Fiennes": ["filmActor","harryPotterActor"],
  "Tom Felton": ["filmActor","harryPotterActor","childActor"],
  "Jennifer Aniston": ["seriesActor","sitcomActor","filmActor"],
  "Courteney Cox": ["seriesActor","sitcomActor","horrorActor"],
  "Lisa Kudrow": ["seriesActor","sitcomActor"],
  "Jim Parsons": ["seriesActor","sitcomActor"],
  "Kaley Cuoco": ["seriesActor","sitcomActor","voiceActor"],
  "Jackie Chan": ["filmActor","actionActor","martialArts"],
  "Jason Statham": ["filmActor","actionActor"],
  "Vin Diesel": ["filmActor","actionActor","marvelActor","voiceActor"],
  "Dwayne Johnson": ["filmActor","actionActor","dcActor","superheroActor"],
  "Bruce Lee": ["filmActor","actionActor","martialArts"],
  "Olaf Scholz": ["politician","chancellor","nationalLeader","legislator"],
  "Angela Merkel": ["politician","chancellor","nationalLeader","scientist"],
  "Donald Trump": ["politician","president","nationalLeader","entrepreneur","realityTV"],
  "Barack Obama": ["politician","usPresident","president","nationalLeader","writer"],
  "Joe Biden": ["politician","usPresident","president","nationalLeader"],
  "Emmanuel Macron": ["politician","president","nationalLeader"],
  "Volodymyr Zelenskyy": ["politician","president","nationalLeader","actor","comedian"],
  "Vladimir Putin": ["politician","president","nationalLeader","militaryLeader"],
  "Ursula von der Leyen": ["politician","president","nationalLeader","medical"],
  "Friedrich Merz": ["politician","chancellor","nationalLeader","entrepreneur"],
  "Axl Rose": ["singer","songwriter","rockMusician","musicGroup"],
  "Ozzy Osbourne": ["singer","rockMusician","metalMusician","musicGroup"],
  "Eminem": ["rapper","singer","songwriter","soloSinger"],
  "Kendrick Lamar": ["rapper","singer","songwriter","soloSinger"],
  "Cardi B": ["rapper","singer","soloSinger"],
  "Lana Del Rey": ["singer","songwriter","soloSinger","popMusician"],
  "Sabrina Carpenter": ["singer","songwriter","soloSinger","popMusician","actor"],
  "Chappell Roan": ["singer","songwriter","soloSinger","popMusician"],
  "Sia": ["singer","songwriter","soloSinger","popMusician"],
  "Katy Perry": ["singer","songwriter","soloSinger","popMusician"],
  "Demi Lovato": ["singer","songwriter","soloSinger","popMusician","actor"],
  "J. Cole": ["rapper","singer","songwriter","soloSinger"],
  "Travis Scott": ["rapper","singer","songwriter","soloSinger"],
  "Megan Thee Stallion": ["rapper","singer","soloSinger"],
  "Rammstein": ["musicGroup","rockMusician","metalMusician"],
  "Metallica": ["musicGroup","rockMusician","metalMusician"],
  "Björk": ["singer","songwriter","soloSinger","electronicMusician"],
  "Hans Zimmer": ["musician","composer","classicalMusician","musicProducer"],
  "Ludwig van Beethoven": ["musician","composer","classicalMusician","pianist"],
  "Lewis Hamilton": ["athlete","racingDriver","motorsport"],
  "Max Verstappen": ["athlete","racingDriver","motorsport"],
  "Sebastian Vettel": ["athlete","racingDriver","motorsport","retired"],
  "Michael Schumacher": ["athlete","racingDriver","motorsport","retired"],
  "Cristiano Ronaldo": ["athlete","football"],
  "Lionel Messi": ["athlete","football"],
  "Serena Williams": ["athlete","tennis","retired"],
  "Novak Djokovic": ["athlete","tennis"],
  "Roger Federer": ["athlete","tennis","retired"],
  "LeBron James": ["athlete","basketball"],
  "Stephen Curry": ["athlete","basketball"],
  "Mike Tyson": ["athlete","boxer"],
  "Conor McGregor": ["athlete","martialArts","boxer"],
  "Markiplier": ["creator","youtuber","gamingStreamer","horrorActor"],
  "Jacksepticeye": ["creator","youtuber","gamingStreamer"],
  "Ludwig Ahgren": ["creator","streamer","twitchStreamer","varietyStreamer","podcaster"],
  "xQc": ["creator","streamer","twitchStreamer","gamingStreamer","varietyStreamer"],
  "Ninja": ["creator","streamer","twitchStreamer","gamingStreamer","battleRoyaleStreamer"],
  "Pokimane": ["creator","streamer","twitchStreamer","gamingStreamer","varietyStreamer"],
  "TheGrefg": ["creator","streamer","twitchStreamer","gamingStreamer","battleRoyaleStreamer"],
  "MontanaBlack": ["creator","streamer","twitchStreamer","gamingStreamer","varietyStreamer"],
  "Trymacs": ["creator","streamer","twitchStreamer","gamingStreamer","varietyStreamer"],
  "Rezo": ["creator","youtuber","commentaryCreator","musicCreator"],
  "Gronkh": ["creator","youtuber","gamingStreamer","minecraftStreamer"],
  "HandOfBlood": ["creator","youtuber","gamingStreamer","commentaryCreator"],
  "Shroud": ["creator","streamer","twitchStreamer","gamingStreamer","shooterStreamer"],
  "Valkyrae": ["creator","streamer","youtubeStreamer","gamingStreamer","varietyStreamer"],
  "LilyPichu": ["creator","streamer","twitchStreamer","musicCreator","varietyStreamer"],
  "Riley Reid": ["creator","adultCreator","adultFilmPerformer"],
  "Abella Danger": ["creator","adultCreator","adultFilmPerformer"],
  "Mia Malkova": ["creator","adultCreator","adultFilmPerformer"],
  "Lana Rhoades": ["creator","adultCreator","adultFilmPerformer","onlyFansCreator"],
  "Jenna Jameson": ["creator","adultCreator","adultFilmPerformer"],
  "Johnny Sins": ["creator","adultCreator","adultFilmPerformer"],
  "Mia Khalifa": ["creator","adultCreator","adultFilmPerformer"],
  "Rocco Siffredi": ["creator","adultCreator","adultFilmPerformer","adultDirector"]
}));

const sports = ["boxer","wrestler","racingDriver","golfer","cyclist","swimmer","runner","baseball","iceHockey","gymnast","esports","martialArts","cricket","volleyball","handball","americanFootball","winterSports"];
const sciences = ["physicist","mathematician","chemist","biologist","astronaut","engineer","inventor","academic","computerScientist","economist","psychologist","astronomer","environmentalScientist"];

export function enrichCharacterAttributes(character) {
  character.attributes ||= {};
  const text = `${character.name || ""} ${character.description || ""}`;
  for (const [id, pattern] of Object.entries(rules)) if (pattern.test(text)) character.attributes[id] = 1;
  for (const id of knownProfiles.get(character.name) || []) character.attributes[id] = 1;

  // Wikidata occupations are unordered and often include secondary careers.
  // Resolve the broad category from the short primary description first.
  const primaryCareerMatches = primaryCareerRoots.filter((id) => primaryCareerSignals[id].test(character.description || ""));
  if (primaryCareerMatches.length) {
    for (const id of primaryCareerMatches) character.attributes[id] = 1;
    for (const id of primaryCareerRoots) {
      if (!primaryCareerMatches.includes(id) && !knownProfiles.get(character.name)?.includes(id)) character.attributes[id] = -1;
    }
  }

  // Wikidata occupations often include singing as a minor side activity. The
  // question explicitly asks whether singing is the person's main identity, so
  // actor/director-only descriptions remain unknown instead of polluting the
  // singer branch.
  const mainSinger = rules.singer.test(text) || singerDetails.some((id) => character.attributes[id] === 1) || knownProfiles.get(character.name)?.includes("singer");
  const clearlyDifferentMainRole = /actor|actress|schauspiel|film director|regisseur|politician|politiker|athlete|sportler|model|comedian|komiker/i.test(character.description || "");
  if (character.attributes.singer === 1 && !mainSinger && clearlyDifferentMainRole) character.attributes.singer = 0;
  const explicitlyActor = /actor|actress|schauspiel|darsteller/i.test(character.description || "");
  // Occupation lists contain many side jobs. Root questions ask what someone is
  // known for, therefore the primary description wins over a secondary credit.
  if (character.attributes.actor === 1 && !explicitlyActor && primaryCareerMatches.length) character.attributes.actor = -1;
  const explicitlyCreator = /youtuber|streamer|influencer|content creator|social media personality|internet personality|webvideoproduzent|livestreamer|tiktoker|vlogger/i.test(character.description || "")
    || knownProfiles.get(character.name)?.some((id) => ["creator","streamer","youtuber","tiktoker"].includes(id));
  if (character.attributes.creator === 1 && !explicitlyCreator && primaryCareerMatches.length) character.attributes.creator = -1;
  const primaryStreamer = character.attributes.streamer === 1;
  if (primaryStreamer && !explicitlyActor) character.attributes.actor = -1;
  if (primaryStreamer && !/musician|music|singer|songwriter|rapper|musiker|sänger/i.test(character.description || "")) {
    character.attributes.musician = -1;
    character.attributes.rapper = -1;
  }
  if (character.attributes.musician === 1 && character.attributes.singer === 0
      && !/musician|composer|songwriter|rapper|music|musiker|komponist|sänger|rapper/i.test(text)) character.attributes.musician = -1;
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
  if (["guitarist","pianist","drummer","violinist","conductor"].some((id) => character.attributes[id] === 1)) {
    character.attributes.instrumentalist = 1;
    character.attributes.musician = 1;
  }
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
  if (creatorDetails.some((id) => character.attributes[id] === 1)) {
    character.attributes.creator = 1;
    character.attributes.internet = 1;
  }
  if (["adultFilmPerformer","onlyFansCreator","adultDirector"].some((id) => character.attributes[id] === 1)) character.attributes.adultCreator = 1;
  if (character.attributes.adultFilmPerformer === 1) character.attributes.actor = 1;
  if (["primeMinister","president","partyLeader","cabinetMinister","diplomat"].some((id) => character.attributes[id] === 1)) character.attributes.politician = 1;
  if (["primeMinister","president"].some((id) => character.attributes[id] === 1)) character.attributes.nationalLeader = 1;
  if (["fantasyAuthor","scifiAuthor","crimeAuthor","nonfictionAuthor"].some((id) => character.attributes[id] === 1)) character.attributes.writer = 1;
  if (["generalOfficer","admiral","militaryPilot"].some((id) => character.attributes[id] === 1)) character.attributes.military = 1;
  if (["chiefExecutive","billionaire"].some((id) => character.attributes[id] === 1)) character.attributes.entrepreneur = 1;
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
  for (const [root, details] of Object.entries(branchDetailDefaults)) {
    if (character.attributes[root] === 1) for (const id of details) character.attributes[id] ??= -1;
  }
  if (["comic","scienceFiction","fantasy","alien","monster","harryPotter","lordOfTheRings","mario","sonic","wizard","warrior","policeCharacter","studentCharacter","sitcom","crimeFiction","gameOfThrones"].some((id) => character.attributes[id] === 1)) {
    character.attributes.real = -1;
    character.attributes.fictional = 1;
  }
  return character;
}
