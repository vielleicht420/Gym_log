var CACHE = "exam-trainer-v1";
var ASSETS = ["./", "./index.html", "./style.css", "./app.js", "./data.js", "./manifest.json", "./icon.svg"];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var networkFetch = fetch(event.request)
        .then(function (response) {
          caches.open(CACHE).then(function (cache) { cache.put(event.request, response.clone()); });
          return response;
        })
        .catch(function () { return cached; });
      return cached || networkFetch;
    })
  );
});
