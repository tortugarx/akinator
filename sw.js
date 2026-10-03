const cacheName = "nazar-v31";
const localAssets = [
  "./", "./index.html", "./styles.css?v=31", "./game.js?v=31",
  "./data.js?v=31", "./engine.js?v=31", "./attribute-enrichment.js?v=31", "./answer-model.js?v=31", "./learning.js?v=31", "./question-model.js?v=31", "./play-stats.js?v=31", "./question-format.js?v=31", "./platform.js",
  "./llm-questions.js?v=31", "./local-ai-worker.js", "./model-download.js", "./runtime-probe.js", "./feature-schema.js?v=31", "./generated-questions.js?v=31", "./assets/data/people.json.gz?v=31", "./question-ranking.js?v=31", "./ranking-model.js?v=31", "./release-policy.js?v=31", "./knowledge-loader.js?v=31", "./profile-details.js?v=31", "./assets/nazar-genie.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(localAssets)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== cacheName && !key.startsWith('nazar-llm-')).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  // The worker owns verified model-shard caching. Do not duplicate hundreds of
  // MB in the general app cache or re-download the model on every update.
  if (url.pathname.includes('/assets/ai/models/')) return;
  if (url.origin === self.location.origin && url.pathname.includes('/assets/ai/runtime/')) {
    event.respondWith(caches.match(event.request).then((cached)=>cached || fetch(event.request).then((response)=>{
      if (response.ok) caches.open(cacheName).then((cache)=>cache.put(event.request,response.clone()));
      return response;
    })));
    return;
  }
  if (url.hostname === "commons.wikimedia.org") {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(cacheName).then((cache) => cache.put(event.request, copy));
      return response;
    })));
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(cacheName).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});
