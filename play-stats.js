export const playStatsKey = "nazar-confirmed-plays-v1";

export function readPlayStats(storage = globalThis.localStorage) {
  try { return JSON.parse(storage?.getItem(playStatsKey) || "{}"); }
  catch { return {}; }
}

export function playCount(id, storage = globalThis.localStorage) {
  return Number(readPlayStats(storage)[id] || 0);
}

export function recordConfirmedPlay(id, storage = globalThis.localStorage) {
  const stats = readPlayStats(storage);
  stats[id] = Number(stats[id] || 0) + 1;
  try { storage?.setItem(playStatsKey, JSON.stringify(stats)); } catch { /* Statistics are optional. */ }
  return stats[id];
}
