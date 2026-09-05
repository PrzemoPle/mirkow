const CACHE_NAME = "mirkow-v5";

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
  "./art/avatars/kowalski.png",
  "./art/pawns/ola.png",
  "./art/pawns/bartek.png",
  "./art/pawns/nati.png",
  "./art/pawns/marek.png",
  "./art/pawns/kowalski.png",
  "./art/events/korek.png",
  "./art/events/lotto.png",
  "./art/events/pralka.png",
  "./art/events/tesciowa.png",
  "./art/events/aukcje.png",
  "./art/events/kontrola.png",
  "./art/events/pit.png",
  "./art/events/promocja.png",
  "./art/events/napiwki.png",
  "./art/events/spokoj.png",
  "./art/ui/stat-money.png",
  "./art/ui/stat-happiness.png",
  "./art/ui/stat-education.png",
  "./art/ui/stat-career.png",
  "./art/ui/need-food.png",
  "./art/ui/need-clothes.png",
  "./art/ui/need-job.png",
  "./art/ui/time.png",
  "./art/ui/board-mat.png",
  "./art/ui/board-mat-dark.png",
  "./art/tiles/zajezdnia.png",
  "./art/tiles/elektro.png",
  "./art/tiles/lombard.png",
  "./art/tiles/home-kawalerka.png",
  "./art/tiles/home-apartament.png",
  "./art/rooms/stancja.png",
  "./art/rooms/kawalerka.png",
  "./art/rooms/apartament.png",
  "./art/items/lodowka.png",
  "./art/items/pralka.png",
  "./art/items/kanapa.png",
  "./art/items/telewizor.png",
  "./art/items/wieza.png",
  "./art/items/komputer.png",
  "./art/items/encyklopedia.png",
  "./art/items/rower.png",
  "./art/items/garnitur.png",
  "./art/diplomas/kurs.png",
  "./art/diplomas/matura.png",
  "./art/diplomas/zarzadzanie.png",
  "./art/diplomas/ekonomia.png",
  "./art/diplomas/administracja.png",
  "./art/diplomas/inzynieria.png",
  "./art/diplomas/magister.png",
  "./art/events/zwolnienie.png",
  "./art/events/redukcja.png",
  "./art/events/podwyzka.png",
  "./art/events/awans.png",
  "./art/events/oblany-egzamin.png",
  "./art/events/dyplom.png",
  "./art/events/zdzichu.png",
  "./art/events/przeprowadzka.png",
  "./art/events/kieszonkowiec.png",
  "./art/events/komornik.png",
  "./art/ui/reliability.png",
  "./art/ui/experience.png",
  "./art/ui/boom.png",
  "./art/ui/recession.png",
  "./art/ui/broken.png",
  "./art/actions/work-shop.png",
  "./art/actions/work-bank.png",
  "./art/actions/work-pup.png",
  "./art/actions/work-depot.png",
  "./art/actions/apply.png",
  "./art/actions/raise.png",
  "./art/actions/suit.png",
  "./art/actions/exam.png",
  "./art/actions/move.png",
  "./art/actions/buy-item.png",
  "./art/actions/sell.png",
  "./art/actions/repair.png",
  "./art/actions/eat.png",
  "./art/actions/account.png",
  "./art/actions/loan.png",
  "./art/actions/stocks.png",
  "./art/brand/panorama.png",
  "./art/brand/stamp-win.png",
  "./art/actions/search-job.png",
  "./art/actions/apply-kierownik.png",
  "./art/actions/open-lokal.png",
  "./art/actions/work-kebab.png",
  "./art/actions/study-course.png",
  "./art/actions/study-degree.png",
  "./art/actions/buy-food.png",
  "./art/actions/buy-clothes.png",
  "./art/actions/rest-home.png",
  "./art/actions/rest-cafe.png",
  "./art/actions/rest-gym.png",
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
