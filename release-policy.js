// Conservative exclusion for the youth-oriented release. This is a safety
// gate, not PEGI certification; all displayed portraits still require review.
export const restrictedTraits = new Set(['adultCreator','adultFilmPerformer','onlyFansCreator','adultDirector']);
const restrictedText=/pornograph|pornograf|pornodarstell|pornographic|adult film|adult entertainment|onlyfans|erotic|erotisch|hentai|sexarbeit|sex worker/i;
export function suitableForYouth(person) {
  return ![...restrictedTraits].some(id=>person.attributes?.[id]>0) && !restrictedText.test(`${person.description||''} ${person.name||''}`);
}
export function safeQuestion(question) {
  return !restrictedTraits.has(question.id) && !(question.featureIds||[]).some(id=>restrictedTraits.has(id)) && !restrictedText.test(`${question.de||''} ${question.en||''}`);
}
export function licensedPortrait(person) {
  const credit=person.imageAttribution;
  const allowed=credit && /^(?:CC0|Public domain|CC BY(?:-SA)? \d)/i.test(credit.license||'') && credit.sourceUrl && (/^(?:CC0|Public domain)$/i.test(credit.license) || credit.creator && credit.licenseUrl);
  return person.image && !allowed ? {...person,image:'',imageAttribution:null} : person;
}
export function youthDatabase(database) {
  const characters=database.characters.filter(suitableForYouth).map(person=>({...licensedPortrait(person),factIds:person.factIds?.filter(id=>{
    const fact=database.factDefinitions?.[id];
    return fact && !restrictedText.test(`${fact.de} ${fact.en}`);
  })}));
  const used=new Set(characters.flatMap(person=>person.factIds||[]));
  return {...database,characters,count:characters.length,factDefinitions:Object.fromEntries(Object.entries(database.factDefinitions||{}).filter(([id])=>used.has(id))),releasePolicy:'youth-filter-v1'};
}
