import { assertNever } from "../game/assert-never";
import type { LocationId } from "../game/catalog";
import type { ActionId, AvatarId, DiplomaId, EventId, HomeId, ItemId, NoticeId } from "../game/types";
import { el } from "./dom";

/** Placeholder dla bitmap, które jeszcze nie przyszły od ilustratora (brief P3). */
const MISSING_TILE = "./art/tiles/park.webp";
const MISSING_ICON = "./art/ui/need-job.webp";
const MISSING_DIPLOMA = "./art/ui/stat-education.webp";
const MISSING_CARD = "./art/events/spokoj.webp";

export function tileArtUrl(id: LocationId): string {
  switch (id) {
    case "pup":
      return "./art/tiles/pup.webp";
    case "campus":
      return "./art/tiles/campus.webp";
    case "bank":
      return "./art/tiles/bank.webp";
    case "zajezdnia":
      return "./art/tiles/zajezdnia.webp";
    case "cafe":
      return "./art/tiles/cafe.webp";
    case "elektro":
      return "./art/tiles/elektro.webp";
    case "gym":
      return "./art/tiles/gym.webp";
    case "home":
      return "./art/tiles/home.webp";
    case "shop":
      return "./art/tiles/shop.webp";
    case "lombard":
      return "./art/tiles/lombard.webp";
    case "kebab":
      return "./art/tiles/kebab.webp";
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
      return "./art/tiles/home.webp";
    case "kawalerka":
      return "./art/tiles/home-kawalerka.webp";
    case "apartament":
      return "./art/tiles/home-apartament.webp";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function roomArtUrl(id: HomeId): string {
  switch (id) {
    case "stancja":
      return "./art/rooms/stancja.webp";
    case "kawalerka":
      return "./art/rooms/kawalerka.webp";
    case "apartament":
      return "./art/rooms/apartament.webp";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function itemArtUrl(id: ItemId | "garnitur"): string {
  switch (id) {
    case "lodowka":
      return "./art/items/lodowka.webp";
    case "pralka":
      return "./art/items/pralka.webp";
    case "kanapa":
      return "./art/items/kanapa.webp";
    case "telewizor":
      return "./art/items/telewizor.webp";
    case "wieza":
      return "./art/items/wieza.webp";
    case "komputer":
      return "./art/items/komputer.webp";
    case "encyklopedia":
      return "./art/items/encyklopedia.webp";
    case "rower":
      return "./art/items/rower.webp";
    case "garnitur":
      return "./art/items/garnitur.webp";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function accountIconUrl(): string {
  return "./art/actions/account.webp";
}

export function loanIconUrl(): string {
  return "./art/actions/loan.webp";
}

export function stocksIconUrl(): string {
  return "./art/actions/stocks.webp";
}

export function brokenIconUrl(): string {
  return "./art/ui/broken.webp";
}

export function moveIconUrl(): string {
  return "./art/actions/move.webp";
}

export function buyItemIconUrl(): string {
  return "./art/actions/buy-item.webp";
}

export function sellIconUrl(): string {
  return "./art/actions/sell.webp";
}

export function repairIconUrl(): string {
  return "./art/actions/repair.webp";
}

export function parkArtUrl(): string {
  return "./art/tiles/park.webp";
}

export function avatarArtUrl(id: AvatarId): string {
  switch (id) {
    case "ola":
      return "./art/avatars/ola.webp";
    case "bartek":
      return "./art/avatars/bartek.webp";
    case "nati":
      return "./art/avatars/nati.webp";
    case "marek":
      return "./art/avatars/marek.webp";
    case "kowalski":
      return "./art/avatars/kowalski.webp";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export type RivalMood = "neutral" | "happy" | "angry";

/** Mina Kowalskiego na jego karcie: te same okulary i wąs, inna mina. */
export function rivalMoodUrl(id: AvatarId, mood: RivalMood): string {
  if (id !== "kowalski" || mood === "neutral") {
    return avatarArtUrl(id);
  }
  return mood === "happy" ? "./art/avatars/kowalski-zadowolony.webp" : "./art/avatars/kowalski-wkurzony.webp";
}

export type NpcId =
  | "krysia"
  | "urzedniczka"
  | "wykladowca"
  | "kasjerka-banku"
  | "brygadzista"
  | "sprzedawczyni"
  | "lombardzista"
  | "kebabiarz"
  | "elektryk"
  | "barista"
  | "trener";

export type WeekendArtId = "spokoj" | "impreza" | "deszcz" | "wycieczka" | "dom" | "kasa";

/** Winieta na pasku weekendu karty eventu: sześć obrazków na 22 linijki. */
export function weekendArtUrl(id: WeekendArtId): string {
  return `./art/weekends/${id}.webp`;
}

export function instructionArtUrl(): string {
  return "./art/brand/instrukcja.webp";
}

export function npcArtUrl(id: NpcId): string {
  return `./art/npc/${id}.webp`;
}

export function pawnArtUrl(id: AvatarId): string {
  switch (id) {
    case "ola":
      return "./art/pawns/ola.webp";
    case "bartek":
      return "./art/pawns/bartek.webp";
    case "nati":
      return "./art/pawns/nati.webp";
    case "marek":
      return "./art/pawns/marek.webp";
    case "kowalski":
      return "./art/pawns/kowalski.webp";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function stampArtUrl(): string {
  return "./art/brand/stamp.webp";
}

export function eventArtUrl(id: EventId): string {
  switch (id) {
    case "korek":
      return "./art/events/korek.webp";
    case "lotto":
      return "./art/events/lotto.webp";
    case "pralka":
      return "./art/events/pralka.webp";
    case "tesciowa":
      return "./art/events/tesciowa.webp";
    case "aukcje":
      return "./art/events/aukcje.webp";
    case "kontrola":
      return "./art/events/kontrola.webp";
    case "pit":
      return "./art/events/pit.webp";
    case "promocja":
      return "./art/events/promocja.webp";
    case "napiwki":
      return "./art/events/napiwki.webp";
    case "spokoj":
      return "./art/events/spokoj.webp";
    case "kieszonkowiec":
      return "./art/events/kieszonkowiec.webp";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function noticeArtUrl(id: NoticeId): string {
  switch (id) {
    case "zwolnienie":
      return "./art/events/zwolnienie.webp";
    case "redukcja":
      return "./art/events/redukcja.webp";
    case "podwyzka":
      return "./art/events/podwyzka.webp";
    case "awans":
      return "./art/events/awans.webp";
    case "oblanyEgzamin":
      return "./art/events/oblany-egzamin.webp";
    case "dyplom":
      return "./art/events/dyplom.webp";
    case "zdzichu":
      return "./art/events/zdzichu.webp";
    case "przeprowadzka":
      return "./art/events/przeprowadzka.webp";
    case "komornik":
      return "./art/events/komornik.webp";
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
      return "./art/ui/stat-money.webp";
    case "stat-happiness":
      return "./art/ui/stat-happiness.webp";
    case "stat-education":
      return "./art/ui/stat-education.webp";
    case "stat-career":
      return "./art/ui/stat-career.webp";
    case "need-food":
      return "./art/ui/need-food.webp";
    case "need-clothes":
      return "./art/ui/need-clothes.webp";
    case "need-job":
      return "./art/ui/need-job.webp";
    case "time":
      return "./art/ui/time.webp";
    case "reliability":
      return "./art/ui/reliability.webp";
    case "experience":
      return "./art/ui/experience.webp";
    case "boom":
      return "./art/ui/boom.webp";
    case "recession":
      return "./art/ui/recession.webp";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function boardMatUrl(): string {
  return "./art/ui/board-mat-dark.webp";
}

export function panoramaUrl(): string {
  return "./art/brand/panorama.webp";
}

export function stampWinUrl(): string {
  return "./art/brand/stamp-win.webp";
}

export function actionIconUrl(id: ActionId): string {
  switch (id) {
    case "work":
      return "./art/actions/work-kebab.webp";
    case "openLokal":
      return "./art/actions/open-lokal.webp";
    case "attendClass":
      return "./art/actions/study-course.webp";
    case "takeExam":
      return "./art/actions/exam.webp";
    case "buyFood":
      return "./art/actions/buy-food.webp";
    case "buyClothes":
      return "./art/actions/buy-clothes.webp";
    case "buySuit":
      return "./art/actions/suit.webp";
    case "restHome":
      return "./art/actions/rest-home.webp";
    case "restCafe":
      return "./art/actions/rest-cafe.webp";
    case "restGym":
      return "./art/actions/rest-gym.webp";
    case "deposit":
      return "./art/actions/deposit.webp";
    case "eatOut":
      return "./art/actions/eat.webp";
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
      return "./art/actions/work-kebab.webp";
    case "shop":
      return "./art/actions/work-shop.webp";
    case "bank":
      return "./art/actions/work-bank.webp";
    case "pup":
      return "./art/actions/work-pup.webp";
    case "depot":
      return "./art/actions/work-depot.webp";
    default: {
      const exhaustive: never = company;
      return assertNever(exhaustive);
    }
  }
}

export function diplomaArtUrl(id: DiplomaId): string {
  switch (id) {
    case "kurs":
      return "./art/diplomas/kurs.webp";
    case "matura":
      return "./art/diplomas/matura.webp";
    case "zarzadzanie":
      return "./art/diplomas/zarzadzanie.webp";
    case "ekonomia":
      return "./art/diplomas/ekonomia.webp";
    case "administracja":
      return "./art/diplomas/administracja.webp";
    case "inzynieria":
      return "./art/diplomas/inzynieria.webp";
    case "magister":
      return "./art/diplomas/magister.webp";
    default: {
      const exhaustive: never = id;
      return assertNever(exhaustive);
    }
  }
}

export function applyIconUrl(): string {
  return "./art/actions/apply.webp";
}

export function raiseIconUrl(): string {
  return "./art/actions/raise.webp";
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

const ART_SIZES: Record<Exclude<ArtKind, "none">, { width: number; height: number }> = {
  tile: { width: 512, height: 384 },
  icon: { width: 64, height: 64 },
  card: { width: 768, height: 1024 },
  diploma: { width: 128, height: 128 },
};

export function artImg(src: string, className: string, kind: ArtKind = "none"): HTMLImageElement {
  const img = el("img", className);
  if (kind !== "none") {
    img.width = ART_SIZES[kind].width;
    img.height = ART_SIZES[kind].height;
  }
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
