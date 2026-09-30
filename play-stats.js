export const playStatsKey = "nazar-confirmed-plays-v1";
export const recentPlaysKey = "nazar-recent-plays-v1";

export function recentPlays(storage = globalThis.localStorage) {
  try { const data = JSON.parse(storage?.getItem(recentPlaysKey) || '[]'); return Array.isArray(data) ? data.filter((id) => typeof id === 'string').slice(0, 12) : []; }
  catch { return []; }
}

export function readPlayStats(storage = globalThis.localStorage) {
  try { const value = JSON.parse(storage?.getItem(playStatsKey) || "{}"); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  catch { return {}; }
}

export function playCount(id, storage = globalThis.localStorage) {
  return Number(readPlayStats(storage)[id] || 0);
}

export function recordConfirmedPlay(id, storage = globalThis.localStorage) {
  const stats = readPlayStats(storage);
  stats[id] = Number(stats[id] || 0) + 1;
  try { storage?.setItem(playStatsKey, JSON.stringify(stats)); } catch { /* Statistics are optional. */ }
  try { storage?.setItem(recentPlaysKey, JSON.stringify([id, ...recentPlays(storage).filter((key) => key !== id)].slice(0, 12))); } catch { /* Optional. */ }
  return stats[id];
}
