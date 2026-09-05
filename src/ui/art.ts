import { assertNever } from "../game/assert-never";
import type { LocationId } from "../game/catalog";
import type { ActionId, AvatarId, EventId, NoticeId } from "../game/types";
import { el } from "./dom";

/** Placeholder dla bitmap, które jeszcze nie przyszły od ilustratora (brief P3). */
const MISSING_TILE = "./art/tiles/park.png";
const MISSING_ICON = "./art/ui/need-job.png";
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
    case "studyCourse":
      return "./art/actions/study-course.png";
    case "studyDegree":
      return "./art/actions/study-degree.png";
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
      return "./art/ui/stat-money.png";
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

export function applyIconUrl(): string {
  return "./art/actions/apply.png";
}

export function raiseIconUrl(): string {
  return "./art/actions/raise.png";
}

type ArtKind = "tile" | "icon" | "card" | "none";

function fallbackFor(kind: ArtKind): string | null {
  switch (kind) {
    case "tile":
      return MISSING_TILE;
    case "icon":
      return MISSING_ICON;
    case "card":
      return MISSING_CARD;
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
