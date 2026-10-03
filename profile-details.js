// Reviewed factual additions. Never infer a negative from an absent credit.
const details=[
  {names:['Papaplatte','Reeze'],id:'reviewed:edeltalk',kind:'work',de:'Edeltalk (Podcast)',en:'Edeltalk (podcast)',source:'https://www.funk.net/formate/edeltalk-12381'},
  {names:['Gronkh'],id:'reviewed:minecraft-series',kind:'work',de:'Minecraft-Let’s-Play mit über 1.000 Folgen',en:'Minecraft Let’s Play series with over 1,000 episodes',source:'https://de.wikipedia.org/wiki/Gronkh'},
  {names:['Trymacs'],id:'reviewed:clash-royale',kind:'work',de:'Clash-Royale-Gamingvideos',en:'Clash Royale gaming videos',source:'https://de.wikipedia.org/wiki/Trymacs'},
  {names:['MontanaBlack'],id:'reviewed:cod-fifa',kind:'work',de:'Call-of-Duty- und FIFA-Streams',en:'Call of Duty and FIFA streams',source:'https://de.wikipedia.org/wiki/MontanaBlack'},
  {names:['Bluey'],id:'reviewed:blue-heeler',kind:'entityType',de:'Blue Heeler (Hunderasse)',en:'Blue Heeler dog',source:'https://www.bluey.tv/characters/bluey/'},
  {names:['Bluey'],id:'reviewed:bingo-sibling',kind:'sibling',de:'Bingo',en:'Bingo',source:'https://www.bluey.tv/characters/bluey/'},
  {names:['Peppa Pig'],id:'reviewed:pig-character',kind:'entityType',de:'Schwein',en:'pig',source:'https://www.peppapig.com/en-us/'},
  {names:['Optimus Prime'],id:'reviewed:truck-transformation',kind:'transformation',de:'einen Lastwagen',en:'a truck',source:'https://transformers-bios.hasbro.com/en-us/optimus-prime-armada-autobot'},
  {names:['Bumblebee'],id:'reviewed:car-transformation',kind:'transformation',de:'einen Sportwagen',en:'a sports car',source:'https://consumercare.hasbro.com/en-us/product/transformers-authentics-bumblebee/F9F95F51-D7AA-407B-A9C6-4B1238945B18'},
  {ids:['wiki-q7557064'],id:'reviewed:david-oliphant-creator',kind:'creator',de:'David Oliphant',en:'David Oliphant',source:'https://en.wikipedia.org/w/index.php?oldid=1376993942'},
  {ids:['wiki-q7557064'],id:'reviewed:deborah-kalman-creator',kind:'creator',de:'Deborah Kalman',en:'Deborah Kalman',source:'https://en.wikipedia.org/w/index.php?oldid=1376993942'},
  {ids:['wiki-q7441548'],id:'reviewed:new-gen-appearance',kind:'appearance',de:'NEW-GEN',en:'NEW-GEN',source:'https://en.wikipedia.org/w/index.php?oldid=1326054673'},
  {ids:['wiki-q7441548'],id:'reviewed:jd-matonti-creator',kind:'creator',de:'J. D. Matonti',en:'J. D. Matonti',source:'https://en.wikipedia.org/w/index.php?oldid=1326054673'},
  {ids:['wiki-q7758838'],id:'reviewed:duracell-advert',kind:'adBrand',de:'Duracell-Batterien',en:'Duracell batteries',source:'https://en.wikipedia.org/w/index.php?oldid=1372808455'},
  {ids:['wiki-q7544224'],id:'reviewed:smash-advert',kind:'adBrand',de:'Smash-Kartoffelpüree',en:'Smash instant mashed potato',source:'https://en.wikipedia.org/w/index.php?oldid=1354286381'},
  {ids:['wiki-q3701838'],id:'reviewed:tg2-credit',kind:'creditedWork',de:'TG2 (italienische Nachrichtensendung)',en:'TG2 (Italian news programme)',source:'https://fr.wikipedia.org/w/index.php?oldid=213458668'},
  {ids:['wiki-q30076167'],id:'reviewed:oggi-credit',kind:'creditedWork',de:'Oggi è un altro giorno',en:'Oggi è un altro giorno',source:'https://ca.wikipedia.org/w/index.php?oldid=38455777'},
  {ids:['wiki-q105258739'],id:'reviewed:big-baby-book',kind:'work',de:'Big Baby (Fotobuch)',en:'Big Baby (photo book)',source:'https://fr.wikipedia.org/w/index.php?oldid=239777294'},
  {ids:['wiki-q18817666'],id:'reviewed:runa-book',kind:'authorWork',de:'るな砲イキます なぜ私があのホテルにいたか (E-Book)',en:'るな砲イキます なぜ私があのホテルにいたか (e-book)',source:'https://ja.wikipedia.org/w/index.php?oldid=111122002'},
  {ids:['wiki-q113490321'],id:'reviewed:danny-home',kind:'performerWork',de:'HOME (Album, 2022)',en:'HOME (album, 2022)',source:'https://ko.wikipedia.org/w/index.php?oldid=42045554'},
  {ids:['wiki-q113490321'],id:'reviewed:danny-violin',kind:'instrument',de:'Violine',en:'violin',source:'https://ko.wikipedia.org/w/index.php?oldid=42045554'},
  {ids:['wiki-q134508376'],id:'reviewed:fukui-police-chief',kind:'office',de:'Leitung der Polizei der Präfektur Fukui',en:'chief of Fukui prefectural police',source:'https://ja.wikipedia.org/w/index.php?oldid=110557665'},
  {ids:['wiki-q12521974'],id:'reviewed:parma-kidnapping',kind:'event',de:'Entführung eines Kleinkinds in Parma (2006)',en:'kidnapping of a toddler in Parma (2006)',source:'https://en.wikipedia.org/w/index.php?oldid=1375605448'},
  {ids:['wiki-q1783949'],id:'reviewed:scottish-house-spirit',kind:'entityType',de:'schottischer Hausgeist',en:'Scottish household spirit',source:'https://en.wikipedia.org/w/index.php?oldid=1367670102'},
  {ids:['wiki-q11418662'],id:'reviewed:zengakuren-chair',kind:'office',de:'Vorsitz der japanischen Studierendenvereinigung Zengakuren',en:'chair of the Japanese student federation Zengakuren',source:'https://ja.wikipedia.org/w/index.php?oldid=111171717'},
  {ids:['wiki-q28415986'],id:'reviewed:wen-college',kind:'education',de:'Tamsui Junior College (Vorgänger der Aletheia-Universität)',en:'Tamsui Junior College (predecessor of Aletheia University)',source:'https://zh.wikipedia.org/w/index.php?oldid=94391590'},
  {ids:['wiki-q5528636'],id:'reviewed:shhh-first',kind:'firstAppearance',de:'Shhh… Don’t Tell',en:'Shhh… Don’t Tell',source:'https://en.wikipedia.org/w/index.php?oldid=1366053107'},
  {names:['Yoshi'],id:'reviewed:super-mario-world-first',kind:'firstAppearance',de:'Super Mario World',en:'Super Mario World',source:'https://en.wikipedia.org/w/index.php?oldid=1377982761'},
  {ids:['wiki-q6220409'],id:'reviewed:dahmer-incident',kind:'event',de:'Rückgabe eines verletzten Jugendlichen an Jeffrey Dahmer durch Polizisten',en:'police returning an injured teenager to Jeffrey Dahmer',source:'https://en.wikipedia.org/w/index.php?oldid=1376165880'},
  {ids:['wiki-q134404125'],id:'reviewed:sindoor-briefing',kind:'work',de:'Pressebriefings zur Operation Sindoor',en:'press briefings on Operation Sindoor',source:'https://www.pib.gov.in/Photoshare.aspx?GalleryID=183209&LID=1&RegID=3'},
  {ids:['wiki-q130518501'],id:'reviewed:thai-narcotics-chief',kind:'office',de:'Leitung des thailändischen Narcotics Suppression Bureau',en:'head of the Thai Narcotics Suppression Bureau',source:'https://th.wikipedia.org/w/index.php?oldid=13308838'},
  {names:['Rapunzel'],id:'reviewed:tangled-first',kind:'firstAppearance',de:'Rapunzel – Neu verföhnt (Tangled)',en:'Tangled',source:'https://en.wikipedia.org/w/index.php?oldid=1375812745'},
  {names:['Sykkuno'],id:'reviewed:among-us-streams',kind:'work',de:'Among-Us-Livestreams',en:'Among Us live streams',source:'https://en.wikipedia.org/w/index.php?oldid=1361683076'},
  {names:['Sykkuno'],id:'reviewed:valorant-streams',kind:'work',de:'Valorant-Livestreams',en:'Valorant live streams',source:'https://en.wikipedia.org/w/index.php?oldid=1361683076'},
  {ids:['wiki-q16206320'],id:'reviewed:melbourne-abductions',kind:'event',de:'ungelöste Entführungen in Melbourne',en:'unsolved abductions in Melbourne',source:'https://en.wikipedia.org/w/index.php?oldid=1372936484'},
  {ids:['wiki-q111112766'],id:'reviewed:kyoto-international-school',kind:'employer',de:'Kyoto International High School',en:'Kyoto International High School',source:'https://ja.wikipedia.org/w/index.php?oldid=111217018'},
  {ids:['wiki-q125022506'],id:'reviewed:cba-chief',kind:'office',de:'Leitung des polnischen Zentralen Antikorruptionsbüros (CBA)',en:'head of Poland’s Central Anticorruption Bureau (CBA)',source:'https://pl.wikipedia.org/w/index.php?oldid=76894011'},
  {ids:['wiki-q114972914'],id:'reviewed:lightweight-mma',kind:'weightClass',de:'Leichtgewicht (MMA)',en:'Lightweight (MMA)',source:'https://pl.wikipedia.org/w/index.php?oldid=80860137'}
];
export function addReviewedDetails(person) {
  for(const {names=[],ids=[],...fact} of details) if(ids.includes(person.id)||names.includes(person.name)||(person.aliases||[]).some(name=>names.includes(name))) {
    person.facts=[...new Map([...(person.facts||[]),fact].map(value=>[value.id,value])).values()];
  }
  return person;
}
