import {
  getHomeDef,
  getItemDef,
  homeIds,
  leaseRent,
  relocateBlock,
  type GameState,
  type HomeId,
  type ItemId,
  type Player,
} from "../game";
import { t } from "../i18n";
import { artImg, brokenIconUrl, itemArtUrl, roomArtUrl } from "./art";
import { blockReason, homeName, itemName } from "./copy";
import { el } from "./dom";
import { buildBoardHeading } from "./heading";
import { interpolate } from "./format";

export type HomeHandlers = {
  onRelocate(home: HomeId): void;
};

export type HomeBoard = {
  root: HTMLElement;
  sync(state: GameState, player: Player, humanTurn: boolean): void;
};

/** Punkty zaczepienia sprite'ów we wnętrzu (procenty szerokości i wysokości kadru 16:9). */
const ITEM_SPOTS: Record<ItemId | "garnitur", { x: number; y: number; scale: number }> = {
  lodowka: { x: 6, y: 58, scale: 1 },
  pralka: { x: 19, y: 60, scale: 0.95 },
  kanapa: { x: 33, y: 64, scale: 1.05 },
  telewizor: { x: 48, y: 50, scale: 0.9 },
  wieza: { x: 60, y: 50, scale: 0.85 },
  komputer: { x: 70, y: 50, scale: 0.9 },
  encyklopedia: { x: 84, y: 26, scale: 0.7 },
  rower: { x: 85, y: 62, scale: 0.95 },
  garnitur: { x: 93, y: 26, scale: 0.7 },
};

export type RoomView = {
  root: HTMLElement;
  sync(player: Player): void;
};

/** Wnętrze mieszkania z rzeczami na półkach; wchodzi w miejsce kadru lokacji, gdy gracz jest w domu. */
export function buildRoomView(): RoomView {
  const root = el("div", "room");
  const art = artImg(roomArtUrl("stancja"), "room-art", "tile");
  const layer = el("div", "room-items");
  const caption = el("span", "plaque room-caption");
  root.append(art, layer, caption);
  let key = "";
  return {
    root,
    sync(player) {
      const next = `${player.home.id}|${player.items.map((item) => `${item.id}${item.broken ? "!" : ""}`).join(",")}|${player.needs.suitWeeks > 0 ? "s" : ""}`;
      if (next === key) {
        return;
      }
      key = next;
      const src = roomArtUrl(player.home.id);
      if (!art.src.endsWith(src.slice(1))) {
        art.src = src;
      }
      layer.replaceChildren();
      const placed: (ItemId | "garnitur")[] = player.items.map((item) => item.id);
      if (player.needs.suitWeeks > 0) {
        placed.push("garnitur");
      }
      for (const id of placed) {
        const spot = ITEM_SPOTS[id];
        const node = el("span", "room-item");
        node.style.left = `${spot.x}%`;
        node.style.top = `${spot.y}%`;
        node.style.setProperty("--scale", String(spot.scale));
        node.append(artImg(itemArtUrl(id), "room-sprite", "icon"));
        const owned = id === "garnitur" ? undefined : player.items.find((item) => item.id === id);
        if (owned?.broken) {
          node.append(artImg(brokenIconUrl(), "room-broken pix", "icon"));
          node.title = `${id === "garnitur" ? t("itemGarnitur") : itemName(id)}: ${t("itemBroken")}`;
        } else {
          node.title = id === "garnitur" ? t("itemGarnitur") : itemName(id);
        }
        layer.append(node);
      }
      const slots = getHomeDef(player.home.id).slots;
      caption.hidden = player.items.length === 0;
      caption.textContent = interpolate("roomSlots", { have: player.items.length, slots });
    },
  };
}

/** Lista trzech mieszkań z powodem blokady i stawką z dnia. */
export function buildHomeBoard(handlers: HomeHandlers): HomeBoard {
  const root = el("div", "jobs home-board");
  const head = buildBoardHeading("homeTitle", "homeHint");
  const list = el("div", "leases");
  list.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const button = target.closest("[data-home]");
    if (!(button instanceof HTMLButtonElement) || button.disabled) {
      return;
    }
    const home = button.dataset.home;
    if (home !== undefined) {
      handlers.onRelocate(home as HomeId);
    }
  });
  root.append(head, list);

  return {
    root,
    sync(state, player, humanTurn) {
      list.replaceChildren();
      for (const [index, id] of homeIds.entries()) {
        const def = getHomeDef(id);
        const mine = player.home.id === id;
        const rent = leaseRent(id, state.economy.phase);
        const block = humanTurn ? relocateBlock(state, id) : null;

        // Umowa najmu jako arkusz papieru z podpisem, nie wiersz listy.
        const lease = el("button", mine ? "lease lease-mine" : "lease");
        lease.type = "button";
        lease.dataset.home = id;
        lease.disabled = !humanTurn || block !== null;
        lease.style.setProperty("--tilt", `${[-0.8, 0.6, -0.4][index % 3] ?? 0}deg`);

        const kind = el("span", "lease-kind");
        kind.textContent = t("homeTitle");
        const name = el("span", "lease-name");
        name.textContent = homeName(id);

        const terms = el("span", "lease-terms");
        terms.textContent = [
          interpolate("homeSlots", { n: def.slots }),
          def.theft ? t("homeTheft") : t("homeSafe"),
          def.happinessWeekly > 0 ? interpolate("homeComfort", { n: def.happinessWeekly }) : null,
          def.depositRents > 0 && !mine ? interpolate("homeDeposit", { n: rent * def.depositRents }) : null,
        ].filter((part): part is string => part !== null).join(" · ");

        const foot = el("span", "lease-foot");
        const rentLine = el("span", "lease-rent");
        rentLine.textContent = interpolate("homeRent", { n: mine ? player.home.rent : rent });
        const sign = el("span", "lease-sign");
        if (block !== null && !(mine && block.code === "sameHome")) {
          sign.classList.add("lease-blocked");
          sign.textContent = blockReason(block);
        } else {
          sign.textContent = mine ? t("actResign") : t("actRelocate");
        }
        foot.append(rentLine, sign);

        lease.append(kind, name, terms, foot);
        if (mine) {
          const mark = el("span", "lease-mark");
          mark.textContent = t("homeYours");
          lease.append(mark);
        }
        list.append(lease);
      }
    },
  };
}

export { getItemDef };
