const CACHE = "guerre-v10";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./lorus-mega-anim.js",
  "./manifest.json",
  "./images/images__18_-removebg-preview (1).png",
  "./images/persos/persos.json",
  "./images/persos/solaris-vaalor.png",
  "./images/persos/reginald-roi.png",
  "./images/persos/reginald-roi-pixel.png",
  "./images/persos/reginald-roi-sheet.png",
  "./images/persos/solaris-vaalor-pixel.png",
  "./images/persos/solaris-vaalor-sheet.png",
  "./images/persos/solaris-drone.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});