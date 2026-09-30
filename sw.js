const cacheName = "nazar-v19";
const localAssets = [
  "./", "./index.html", "./styles.css?v=19", "./game.js?v=19",
  "./data.js?v=19", "./engine.js?v=19", "./attribute-enrichment.js?v=19", "./learning.js?v=19", "./question-model.js?v=19", "./play-stats.js?v=19", "./question-format.js?v=19", "./platform.js",
  "./wikidata-people.json?v=19", "./assets/nazar-genie.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(localAssets)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
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
