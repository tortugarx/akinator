export function normalizeCharacterName(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function findLocalKnowledge(name, characters) {
  const normalized = normalizeCharacterName(name);
  const names=item=>[item.name,...(item.aliases||[])].map(normalizeCharacterName);
  const exact = characters.filter((item) => names(item).includes(normalized));
  const partial = normalized.length >= 4 ? characters.filter((item) => names(item).some(value=>value.includes(normalized))) : [];
  const match = exact.length===1 ? exact[0] : exact.length ? null : partial.length===1 ? partial[0] : null;
  if (!match) return { matched:false, verified:false, name, description:"", attributes:{} };
  return {
    matched:true,
    verified:Boolean(match.source || String(match.id || "").startsWith("wiki-")),
    name:match.name,
    description:match.description || "",
    sourceId:match.id,
    image:match.image || "",
    imageAttribution:match.imageAttribution || null,
    source:match.source || "",
    attributes:{ ...match.attributes }
  };
}

export function canStoreLearnedCharacter(knowledge, personallyKnown, realityResponse = 0) {
  if (personallyKnown) return true;
  if (!knowledge.matched || !knowledge.verified) return false;
  if (realityResponse >= .5) return knowledge.attributes.real === 1;
  if (realityResponse <= -.5) return knowledge.attributes.real === -1 || knowledge.attributes.fictional === 1;
  return true;
}
