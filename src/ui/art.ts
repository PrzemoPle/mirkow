import { assertNever } from "../game/assert-never";
import type { LocationId } from "../game/catalog";
import type { AvatarId, EventId } from "../game/types";
import { el } from "./dom";

export function tileArtUrl(id: LocationId): string {
  switch (id) {
    case "pup":
      return "./art/tiles/pup.png";
    case "campus":
      return "./art/tiles/campus.png";
    case "bank":
      return "./art/tiles/bank.png";
    case "cafe":
      return "./art/tiles/cafe.png";
    case "gym":
      return "./art/tiles/gym.png";
    case "home":
      return "./art/tiles/home.png";
    case "shop":
      return "./art/tiles/shop.png";
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
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function boardMatUrl(): string {
  return "./art/ui/board-mat.png";
}

export function artImg(src: string, className: string): HTMLImageElement {
  const img = el("img", className);
  img.src = src;
  img.alt = "";
  img.draggable = false;
  img.setAttribute("aria-hidden", "true");
  return img;
}

export function paintBitmap(
  host: HTMLElement,
  src: string,
  className: string,
): void {
  if (host.dataset.src === src) {
    return;
  }
  host.dataset.src = src;
  host.replaceChildren(artImg(src, className));
}
