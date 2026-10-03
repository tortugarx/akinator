// Small learned readability/answerability ranker. The numerical engine remains
// authoritative: no generated biography or learned score can bypass relevance.
export const rankingKinds = ['basic','group','evidence','genre','party','team','member','award','work','universe','appearance','instrument','office','position','field','label','conflict','birthplace','education','employer'];
rankingKinds.push('occupation','language','nativeLanguage','movement','creator','inspiration','father','mother','spouse','child','sibling','partner','burial','deathCause','castWork','voiceWork','authorWork','performerWork','composerWork','directorWork','firstAppearance','comicDebut','entityType','event','participation','militaryBranch','militaryRank');
rankingKinds.push('militaryUnit','constituency','creditedWork','weightClass');
rankingKinds.push('transformation','adBrand');
export function questionKind(question) {
  if (question.kind) return question.kind;
  const properties={P136:'genre',P102:'party',P54:'team',P463:'member',P166:'award',P800:'work',P1080:'universe',P1441:'appearance',P1303:'instrument',P39:'office',P413:'position',P101:'field',P264:'label',P607:'conflict',P19:'birthplace',P69:'education',P108:'employer'};
  return question.id.startsWith('group:') ? 'group' : question.id.startsWith('evidence:') ? 'evidence' : properties[question.id.split(':')[1]] || 'basic';
}
export function rankingFeatures(question, stage=0) {
  const kind=questionKind(question), text=question.en || question.de || '';
  return [1,...rankingKinds.map(value=>Number(value===kind)),Math.min(1,text.length/200),Math.min(1,stage/20)];
}
export function answerability(question, stage, model) {
  if (!model?.weights) return 1;
  const features=rankingFeatures(question,stage);
  return Math.max(.12,Math.min(.98,features.reduce((sum,value,index)=>sum+value*(model.weights[index]||0),0)));
}
export function rankedQuestionValue(question, gain, focus, stage, model) {
  // Lower expected answerability means more wasted questions. This is a
  // synthetic bootstrap estimate, not a measured probability for a real user.
  if(!gain) return 0;
  return gain*focus*answerability(question,stage,model);
}
