const CACHE_NAME = "mirkow-v3";

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-180.png",
  "./art/brand/stamp.png",
  "./art/tiles/pup.png",
  "./art/tiles/campus.png",
  "./art/tiles/bank.png",
  "./art/tiles/cafe.png",
  "./art/tiles/gym.png",
  "./art/tiles/home.png",
  "./art/tiles/shop.png",
  "./art/tiles/kebab.png",
  "./art/tiles/park.png",
  "./art/avatars/ola.png",
  "./art/avatars/bartek.png",
  "./art/avatars/nati.png",
  "./art/avatars/marek.png",
  "./art/pawns/ola.png",
  "./art/pawns/bartek.png",
  "./art/pawns/nati.png",
  "./art/pawns/marek.png",
  "./art/events/korek.png",
  "./art/events/lotto.png",
  "./art/events/pralka.png",
  "./art/events/tesciowa.png",
  "./art/events/aukcje.png",
  "./art/events/kontrola.png",
  "./art/events/pit.png",
  "./art/events/promocja.png",
  "./art/ui/stat-money.png",
  "./art/ui/stat-happiness.png",
  "./art/ui/stat-education.png",
  "./art/ui/stat-career.png",
  "./art/ui/need-food.png",
  "./art/ui/need-clothes.png",
  "./art/ui/need-job.png",
  "./art/ui/time.png",
  "./art/ui/board-mat.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached !== undefined) {
          return cached;
        }
        if (request.mode === "navigate") {
          const page = await caches.match("./index.html");
          if (page !== undefined) {
            return page;
          }
        }
        return Response.error();
      }),
  );
});
