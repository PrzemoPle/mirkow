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
import { formatZl, interpolate } from "./format";

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

function buildRow(
  kind: RowKind,
  item: ItemId,
  price: number,
  reason: string | null,
  enabled: boolean,
  extra: string | null,
): HTMLButtonElement {
  const row = el("button", "act job-row item-row");
  row.type = "button";
  row.dataset.item = item;
  row.dataset.kind = kind;
  row.disabled = !enabled;
  row.append(artImg(itemArtUrl(item), "act-icon item-icon", "icon"));
  const name = el("span", "act-name");
  name.textContent = itemName(item);
  if (extra !== null) {
    const tag = el("span", "plaque job-tag");
    tag.textContent = extra;
    name.append(" ", tag);
  }
  const meta = el("span", "act-meta");
  if (reason !== null) {
    const why = el("span", "act-reason");
    why.textContent = reason;
    meta.append(why);
  } else {
    const effect = el("span");
    effect.textContent = itemEffect(item);
    meta.append(effect);
  }
  const cost = el("span", "act-cost");
  const money = el("span", kind === "sell" ? "act-money act-money-plus" : "act-money");
  money.textContent = `${kind === "sell" ? "+" : "-"}${formatZl(price)}`;
  const time = el("span", "ticket");
  time.textContent = interpolate("timeCost", { n: 1 });
  cost.append(money, time);
  row.append(name, meta, cost);
  return row;
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
  const title = el("p", "acts-title");
  title.textContent = t("elektroTitle");
  const hint = el("p", "jobs-hint");
  hint.textContent = t("elektroHint");
  const list = el("div", "jobs-list");
  attach(list, handlers);
  root.append(title, hint, list);
  return {
    root,
    sync(state, player, humanTurn) {
      list.replaceChildren();
      const broken = player.items.filter((item) => item.broken);
      if (broken.length > 0) {
        const head = el("div", "jobs-company");
        head.append(artImg(repairIconUrl(), "pix", "icon"));
        const label = el("span");
        label.textContent = t("actRepairItem");
        head.append(label);
        list.append(head);
        for (const item of broken) {
          const block = humanTurn ? repairItemBlock(state, item.id) : null;
          list.append(buildRow("repair", item.id, repairPrice(item.id), block === null ? null : blockReason(block), humanTurn && block === null, t("itemBroken")));
        }
      }
      const head = el("div", "jobs-company");
      head.append(artImg(buyItemIconUrl(), "pix", "icon"));
      const label = el("span");
      label.textContent = t("actBuyItem");
      head.append(label);
      list.append(head);
      for (const id of itemIds) {
        const owned = ownedItem(player, id);
        const block = humanTurn && owned === undefined ? buyItemBlock(state, id, false) : null;
        const reason = owned !== undefined ? t("blockAlreadyOwned") : block === null ? null : blockReason(block);
        list.append(buildRow("buy", id, getItemDef(id).price, reason, humanTurn && owned === undefined && block === null, null));
      }
    },
  };
}

/** Lombard: używane sprzęty i skup własnych. */
export function buildLombardBoard(handlers: ShopHandlers): ShopBoard {
  const root = el("div", "jobs shop-board");
  const title = el("p", "acts-title");
  title.textContent = t("lombardTitle");
  const hint = el("p", "jobs-hint");
  hint.textContent = t("lombardHint");
  const list = el("div", "jobs-list");
  attach(list, handlers);
  root.append(title, hint, list);
  return {
    root,
    sync(state, player, humanTurn) {
      list.replaceChildren();
      if (player.items.length > 0) {
        const head = el("div", "jobs-company");
        head.append(artImg(sellIconUrl(), "pix", "icon"));
        const label = el("span");
        label.textContent = t("lombardSell");
        head.append(label);
        list.append(head);
        for (const item of player.items) {
          const block = humanTurn ? sellItemBlock(state, item.id) : null;
          const price = item.broken ? Math.round(sellPrice(item.id) / 2 / 10) * 10 : sellPrice(item.id);
          list.append(buildRow("sell", item.id, price, block === null ? null : blockReason(block), humanTurn && block === null, item.broken ? t("itemBroken") : null));
        }
      }
      const head = el("div", "jobs-company");
      head.append(artImg(buyItemIconUrl(), "pix", "icon"));
      const label = el("span");
      label.textContent = t("actBuyUsed");
      head.append(label);
      list.append(head);
      for (const id of itemIds) {
        const owned = ownedItem(player, id);
        const block = humanTurn && owned === undefined ? buyItemBlock(state, id, true) : null;
        const reason = owned !== undefined ? t("blockAlreadyOwned") : block === null ? null : blockReason(block);
        list.append(buildRow("used", id, usedPrice(id), reason, humanTurn && owned === undefined && block === null, t("itemUsed")));
      }
    },
  };
}

export { brokenIconUrl };
