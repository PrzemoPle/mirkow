import { assertNever } from "../game/assert-never";
import type { LocationId } from "../game/catalog";
import type { ActionId, AvatarId, DiplomaId, EventId, HomeId, ItemId, NoticeId } from "../game/types";
import { el } from "./dom";

/** Placeholder dla bitmap, które jeszcze nie przyszły od ilustratora (brief P3). */
const MISSING_TILE = "./art/tiles/park.png";
const MISSING_ICON = "./art/ui/need-job.png";
const MISSING_DIPLOMA = "./art/ui/stat-education.png";
const MISSING_CARD = "./art/events/spokoj.png";

export function tileArtUrl(id: LocationId): string {
  switch (id) {
    case "pup":
      return "./art/tiles/pup.png";
    case "campus":
      return "./art/tiles/campus.png";
    case "bank":
      return "./art/tiles/bank.png";
    case "zajezdnia":
      return "./art/tiles/zajezdnia.png";
    case "cafe":
      return "./art/tiles/cafe.png";
    case "elektro":
      return "./art/tiles/elektro.png";
    case "gym":
      return "./art/tiles/gym.png";
    case "home":
      return "./art/tiles/home.png";
    case "shop":
      return "./art/tiles/shop.png";
    case "lombard":
      return "./art/tiles/lombard.png";
    case "kebab":
      return "./art/tiles/kebab.png";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

/** Kafelek domu zależy od mieszkania z umowy. */
export function homeTileArtUrl(id: HomeId): string {
  switch (id) {
    case "stancja":
      return "./art/tiles/home.png";
    case "kawalerka":
      return "./art/tiles/home-kawalerka.png";
    case "apartament":
      return "./art/tiles/home-apartament.png";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function roomArtUrl(id: HomeId): string {
  switch (id) {
    case "stancja":
      return "./art/rooms/stancja.png";
    case "kawalerka":
      return "./art/rooms/kawalerka.png";
    case "apartament":
      return "./art/rooms/apartament.png";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function itemArtUrl(id: ItemId | "garnitur"): string {
  switch (id) {
    case "lodowka":
      return "./art/items/lodowka.png";
    case "pralka":
      return "./art/items/pralka.png";
    case "kanapa":
      return "./art/items/kanapa.png";
    case "telewizor":
      return "./art/items/telewizor.png";
    case "wieza":
      return "./art/items/wieza.png";
    case "komputer":
      return "./art/items/komputer.png";
    case "encyklopedia":
      return "./art/items/encyklopedia.png";
    case "rower":
      return "./art/items/rower.png";
    case "garnitur":
      return "./art/items/garnitur.png";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function accountIconUrl(): string {
  return "./art/actions/account.png";
}

export function loanIconUrl(): string {
  return "./art/actions/loan.png";
}

export function stocksIconUrl(): string {
  return "./art/actions/stocks.png";
}

export function brokenIconUrl(): string {
  return "./art/ui/broken.png";
}

export function moveIconUrl(): string {
  return "./art/actions/move.png";
}

export function buyItemIconUrl(): string {
  return "./art/actions/buy-item.png";
}

export function sellIconUrl(): string {
  return "./art/actions/sell.png";
}

export function repairIconUrl(): string {
  return "./art/actions/repair.png";
}

export function parkArtUrl(): string {
  return "./art/tiles/park.png";
}

export function avatarArtUrl(id: AvatarId): string {
  switch (id) {
    case "ola":
      return "./art/avatars/ola.png";
    case "bartek":
      return "./art/avatars/bartek.png";
    case "nati":
      return "./art/avatars/nati.png";
    case "marek":
      return "./art/avatars/marek.png";
    case "kowalski":
      return "./art/avatars/kowalski.png";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function pawnArtUrl(id: AvatarId): string {
  switch (id) {
    case "ola":
      return "./art/pawns/ola.png";
    case "bartek":
      return "./art/pawns/bartek.png";
    case "nati":
      return "./art/pawns/nati.png";
    case "marek":
      return "./art/pawns/marek.png";
    case "kowalski":
      return "./art/pawns/kowalski.png";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function stampArtUrl(): string {
  return "./art/brand/stamp.png";
}

export function eventArtUrl(id: EventId): string {
  switch (id) {
    case "korek":
      return "./art/events/korek.png";
    case "lotto":
      return "./art/events/lotto.png";
    case "pralka":
      return "./art/events/pralka.png";
    case "tesciowa":
      return "./art/events/tesciowa.png";
    case "aukcje":
      return "./art/events/aukcje.png";
    case "kontrola":
      return "./art/events/kontrola.png";
    case "pit":
      return "./art/events/pit.png";
    case "promocja":
      return "./art/events/promocja.png";
    case "napiwki":
      return "./art/events/napiwki.png";
    case "spokoj":
      return "./art/events/spokoj.png";
    case "kieszonkowiec":
      return "./art/events/kieszonkowiec.png";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function noticeArtUrl(id: NoticeId): string {
  switch (id) {
    case "zwolnienie":
      return "./art/events/zwolnienie.png";
    case "redukcja":
      return "./art/events/redukcja.png";
    case "podwyzka":
      return "./art/events/podwyzka.png";
    case "awans":
      return "./art/events/awans.png";
    case "oblanyEgzamin":
      return "./art/events/oblany-egzamin.png";
    case "dyplom":
      return "./art/events/dyplom.png";
    case "zdzichu":
      return "./art/events/zdzichu.png";
    case "przeprowadzka":
      return "./art/events/przeprowadzka.png";
    case "komornik":
      return "./art/events/komornik.png";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export const hudIconIds = [
  "stat-money",
  "stat-happiness",
  "stat-education",
  "stat-career",
  "need-food",
  "need-clothes",
  "need-job",
  "time",
  "reliability",
  "experience",
  "boom",
  "recession",
] as const;

export type HudIconId = (typeof hudIconIds)[number];

export function hudIconUrl(id: HudIconId): string {
  switch (id) {
    case "stat-money":
      return "./art/ui/stat-money.png";
    case "stat-happiness":
      return "./art/ui/stat-happiness.png";
    case "stat-education":
      return "./art/ui/stat-education.png";
    case "stat-career":
      return "./art/ui/stat-career.png";
    case "need-food":
      return "./art/ui/need-food.png";
    case "need-clothes":
      return "./art/ui/need-clothes.png";
    case "need-job":
      return "./art/ui/need-job.png";
    case "time":
      return "./art/ui/time.png";
    case "reliability":
      return "./art/ui/reliability.png";
    case "experience":
      return "./art/ui/experience.png";
    case "boom":
      return "./art/ui/boom.png";
    case "recession":
      return "./art/ui/recession.png";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function boardMatUrl(): string {
  return "./art/ui/board-mat-dark.png";
}

export function panoramaUrl(): string {
  return "./art/brand/panorama.png";
}

export function stampWinUrl(): string {
  return "./art/brand/stamp-win.png";
}

export function actionIconUrl(id: ActionId): string {
  switch (id) {
    case "work":
      return "./art/actions/work-kebab.png";
    case "openLokal":
      return "./art/actions/open-lokal.png";
    case "attendClass":
      return "./art/actions/study-course.png";
    case "takeExam":
      return "./art/actions/exam.png";
    case "buyFood":
      return "./art/actions/buy-food.png";
    case "buyClothes":
      return "./art/actions/buy-clothes.png";
    case "buySuit":
      return "./art/actions/suit.png";
    case "restHome":
      return "./art/actions/rest-home.png";
    case "restCafe":
      return "./art/actions/rest-cafe.png";
    case "restGym":
      return "./art/actions/rest-gym.png";
    case "deposit":
      return "./art/actions/account.png";
    case "eatOut":
      return "./art/actions/eat.png";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

/** Ikona zmiany zależna od firmy; brakujące pliki wracają do ikony kebaba. */
export function workIconUrl(company: "kebab" | "shop" | "bank" | "pup" | "depot"): string {
  switch (company) {
    case "kebab":
      return "./art/actions/work-kebab.png";
    case "shop":
      return "./art/actions/work-shop.png";
    case "bank":
      return "./art/actions/work-bank.png";
    case "pup":
      return "./art/actions/work-pup.png";
    case "depot":
      return "./art/actions/work-depot.png";
    default: {
      const exhaustive: never = company;
      return assertNever(exhaustive);
    }
  }
}

export function diplomaArtUrl(id: DiplomaId): string {
  switch (id) {
    case "kurs":
      return "./art/diplomas/kurs.png";
    case "matura":
      return "./art/diplomas/matura.png";
    case "zarzadzanie":
      return "./art/diplomas/zarzadzanie.png";
    case "ekonomia":
      return "./art/diplomas/ekonomia.png";
    case "administracja":
      return "./art/diplomas/administracja.png";
    case "inzynieria":
      return "./art/diplomas/inzynieria.png";
    case "magister":
      return "./art/diplomas/magister.png";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function applyIconUrl(): string {
  return "./art/actions/apply.png";
}

export function raiseIconUrl(): string {
  return "./art/actions/raise.png";
}

type ArtKind = "tile" | "icon" | "card" | "diploma" | "none";

function fallbackFor(kind: ArtKind): string | null {
  switch (kind) {
    case "tile":
      return MISSING_TILE;
    case "icon":
      return MISSING_ICON;
    case "card":
      return MISSING_CARD;
    case "diploma":
      return MISSING_DIPLOMA;
    case "none":
      return null;
  }
}

export function artImg(src: string, className: string, kind: ArtKind = "none"): HTMLImageElement {
  const img = el("img", className);
  img.src = src;
  img.alt = "";
  img.draggable = false;
  img.setAttribute("aria-hidden", "true");
  const fallback = fallbackFor(kind);
  if (fallback !== null) {
    img.addEventListener(
      "error",
      () => {
        if (img.src.endsWith(fallback.slice(1))) {
          return;
        }
        img.src = fallback;
        img.classList.add("art-missing");
      },
      { once: true },
    );
  }
  return img;
}

export function paintBitmap(host: HTMLElement, src: string, className: string): void {
  if (host.dataset.src === src) {
    return;
  }
  host.dataset.src = src;
  host.replaceChildren(artImg(src, className));
}
