import {
  buyItemBlock,
  getItemDef,
  itemIds,
  ownedItem,
  repairItemBlock,
  repairPrice,
  sellItemBlock,
  sellPrice,
  usedPrice,
  type GameState,
  type ItemId,
  type Player,
} from "../game";
import { t } from "../i18n";
import { artImg, brokenIconUrl, buyItemIconUrl, itemArtUrl, repairIconUrl, sellIconUrl } from "./art";
import { blockReason, itemEffect, itemName } from "./copy";
import { el } from "./dom";
import { buildBoardHeading } from "./heading";
import { formatZl } from "./format";

export type ShopHandlers = {
  onBuy(item: ItemId, used: boolean): void;
  onSell(item: ItemId): void;
  onRepair(item: ItemId): void;
};

export type ShopBoard = {
  root: HTMLElement;
  sync(state: GameState, player: Player, humanTurn: boolean): void;
};

type RowKind = "buy" | "used" | "sell" | "repair";

/** Towar stojący na półce z wiszącą metką, zamiast wiersza z ceną po prawej. */
function buildGood(
  kind: RowKind,
  item: ItemId,
  price: number,
  reason: string | null,
  enabled: boolean,
  extra: string | null,
): HTMLButtonElement {
  const good = el("button", `good good-${kind}`);
  good.type = "button";
  good.dataset.item = item;
  good.dataset.kind = kind;
  good.disabled = !enabled;

  good.append(artImg(itemArtUrl(item), "good-img", "icon"));

  const name = el("span", "good-name");
  name.textContent = itemName(item);
  good.append(name);

  const note = el("span", "good-note");
  if (reason !== null) {
    note.classList.add("good-blocked");
    note.textContent = reason;
  } else {
    note.textContent = extra === null ? itemEffect(item) : `${extra} · ${itemEffect(item)}`;
  }
  good.append(note);

  const tag = el("span", "good-tag");
  tag.textContent = `${kind === "sell" ? "+" : ""}${formatZl(price)}`;
  good.append(tag);
  return good;
}

/** Tabliczka nad półką: co tu stoi. */
function buildSign(icon: string, label: string): HTMLElement {
  const sign = el("div", "shelf-sign");
  sign.append(artImg(icon, "pix", "icon"));
  const text = el("span");
  text.textContent = label;
  sign.append(text);
  return sign;
}

function attach(list: HTMLElement, handlers: ShopHandlers): void {
  list.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const button = target.closest("[data-item]");
    if (!(button instanceof HTMLButtonElement) || button.disabled) {
      return;
    }
    const item = button.dataset.item as ItemId | undefined;
    const kind = button.dataset.kind as RowKind | undefined;
    if (item === undefined || kind === undefined) {
      return;
    }
    if (kind === "buy") {
      handlers.onBuy(item, false);
    } else if (kind === "used") {
      handlers.onBuy(item, true);
    } else if (kind === "sell") {
      handlers.onSell(item);
    } else {
      handlers.onRepair(item);
    }
  });
}

/** Elektro-Mir: nowe sprzęty i naprawa zepsutych. */
export function buildElektroBoard(handlers: ShopHandlers): ShopBoard {
  const root = el("div", "jobs shop-board");
  const head = buildBoardHeading("elektroTitle", "elektroHint");
  const list = el("div", "shelf");
  attach(list, handlers);
  root.append(head, list);
  return {
    root,
    sync(state, player, humanTurn) {
      list.replaceChildren();
      const broken = player.items.filter((item) => item.broken);
      if (broken.length > 0) {
        list.append(buildSign(repairIconUrl(), t("actRepairItem")));
        for (const item of broken) {
          const block = humanTurn ? repairItemBlock(state, item.id) : null;
          list.append(buildGood("repair", item.id, repairPrice(item.id), block === null ? null : blockReason(block), humanTurn && block === null, t("itemBroken")));
        }
      }
      list.append(buildSign(buyItemIconUrl(), t("actBuyItem")));
      for (const id of itemIds) {
        const owned = ownedItem(player, id);
        const block = humanTurn && owned === undefined ? buyItemBlock(state, id, false) : null;
        const reason = owned !== undefined ? t("blockAlreadyOwned") : block === null ? null : blockReason(block);
        list.append(buildGood("buy", id, getItemDef(id).price, reason, humanTurn && owned === undefined && block === null, null));
      }
    },
  };
}

/** Lombard: używane sprzęty i skup własnych. */
export function buildLombardBoard(handlers: ShopHandlers): ShopBoard {
  const root = el("div", "jobs shop-board");
  const head = buildBoardHeading("lombardTitle", "lombardHint");
  const list = el("div", "shelf");
  attach(list, handlers);
  root.append(head, list);
  return {
    root,
    sync(state, player, humanTurn) {
      list.replaceChildren();
      if (player.items.length > 0) {
        list.append(buildSign(sellIconUrl(), t("lombardSell")));
        for (const item of player.items) {
          const block = humanTurn ? sellItemBlock(state, item.id) : null;
          const price = item.broken ? Math.round(sellPrice(item.id) / 2 / 10) * 10 : sellPrice(item.id);
          list.append(buildGood("sell", item.id, price, block === null ? null : blockReason(block), humanTurn && block === null, item.broken ? t("itemBroken") : null));
        }
      }
      list.append(buildSign(buyItemIconUrl(), t("actBuyUsed")));
      for (const id of itemIds) {
        const owned = ownedItem(player, id);
        const block = humanTurn && owned === undefined ? buyItemBlock(state, id, true) : null;
        const reason = owned !== undefined ? t("blockAlreadyOwned") : block === null ? null : blockReason(block);
        list.append(buildGood("used", id, usedPrice(id), reason, humanTurn && owned === undefined && block === null, t("itemUsed")));
      }
    },
  };
}

export { brokenIconUrl };
