const CACHE = "guerre-v27";

const ASSETS = [
  "./",
  "./index.html",
  "./src/main.js",
  "./manifest.json",
  "./version.json",
  "./images/load-screen.png",
  "./images/hub-battle-bg.png",
  "./images/images__18_-removebg-preview (1).png",
  "./images/persos/persos.json",
  "./images/persos/solaris-vaalor.png",
  "./images/persos/reginald-roi.png",
  "./images/persos/reginald-roi-pixel.png",
  "./images/persos/reginald-roi-sheet.png",
  "./images/persos/solaris-vaalor-pixel.png",
  "./images/persos/solaris-vaalor-sheet.png",
  "./images/persos/solaris-drone.png",
  "./images/persos/gorgia.png",
  "./images/persos/gorgia-pixel.png",
  "./images/persos/gorgia-sheet.png",
  "./images/persos/judas.png",
  "./images/persos/judas-pixel.png",
  "./images/persos/judas-sheet.png",
  "./images/persos/roy.png",
  "./images/persos/roy-pixel.png",
  "./images/persos/roy-sheet.png",
  "./images/persos/rodeo.png",
  "./images/persos/rodeo-pixel.png",
  "./images/persos/rodeo-sheet.png",
  "./images/persos/sanex.png",
  "./images/persos/sanex-pixel.png",
  "./images/persos/sanex-sheet.png",
  "./images/persos/volta.png",
  "./images/persos/volta-pixel.png",
  "./images/persos/volta-sheet.png",
  "./images/persos/herminy.png",
  "./images/persos/herminy-pixel.png",
  "./images/persos/herminy-sheet.png",
  "./images/persos/reginald-scepter-toss.webm",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

const NETWORK_FIRST_RE =
  /(index\.html|src\/main\.js|sw\.js|version\.json|persos\.json)(\?|$)/i;

function wantsNetworkFirst(url) {
  const path = new URL(url, self.location.href).pathname;
  return NETWORK_FIRST_RE.test(path);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response?.status === 200) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response?.status === 200 && response.type === "basic") {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

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
  const url = event.request.url;

  if (wantsNetworkFirst(url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});