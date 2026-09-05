import {
  actionBlock,
  actionsAt,
  resolveAction,
  type ActionDef,
  type ActionId,
  type GameState,
  type Player,
} from "../game";
import { t } from "../i18n";
import { actionIconUrl, artImg, tileArtUrl } from "./art";
import { locationName } from "./board";
import { actionEffects, actionLabel, blockReason } from "./copy";
import { el } from "./dom";
import { formatZl, interpolate } from "./format";

const CONFIRM_FROM = 3;

export type PanelHandlers = {
  onAct(id: ActionId): void;
  onEndWeek(): void;
};

export type Panel = {
  root: HTMLElement;
  sync(state: GameState, player: Player, humanTurn: boolean): void;
};

function withPlayer(state: GameState, player: Player): GameState {
  const index = state.players.findIndex((entry) => entry.id === player.id);
  return index === -1 ? state : { ...state, active: index };
}

function buildActionRow(def: ActionDef, reason: string | null, enabled: boolean): HTMLButtonElement {
  const button = el("button", "act");
  button.type = "button";
  button.dataset.action = def.id;
  button.disabled = !enabled;

  const icon = artImg(actionIconUrl(def.id), "act-icon pix");
  const name = el("span", "act-name");
  name.textContent = actionLabel(def.id);

  const meta = el("span", "act-meta");
  if (reason !== null) {
    const why = el("span", "act-reason");
    why.textContent = reason;
    meta.append(why);
  } else {
    for (const effect of actionEffects(def)) {
      const chip = el("span");
      chip.textContent = effect;
      meta.append(chip);
    }
  }

  const cost = el("span", "act-cost");
  const time = el("span", "ticket");
  time.textContent = interpolate("timeCost", { n: def.timeCost });
  cost.append(time);
  if (def.wage > 0) {
    const money = el("span", "act-money act-money-plus");
    money.textContent = `+${formatZl(def.wage)}`;
    cost.append(money);
  } else if (def.moneyCost > 0) {
    const money = el("span", "act-money");
    money.textContent = `-${formatZl(def.moneyCost)}`;
    cost.append(money);
  }

  button.append(icon, name, meta, cost);
  return button;
}

export function buildPanel(handlers: PanelHandlers): Panel {
  const root = el("aside", "panel");

  const place = el("div", "place");
  const art = artImg(tileArtUrl("home"), "place-art");
  const copy = el("div", "place-copy");
  const placeName = el("span", "plaque place-name");
  const here = el("span", "plaque plaque-accent place-here");
  here.textContent = t("youAreHere");
  copy.append(placeName, here);
  place.append(art, copy);

  const acts = el("div", "acts");
  acts.setAttribute("role", "group");
  acts.setAttribute("aria-label", t("actionsLabel"));
  const actsTitle = el("p", "acts-title");
  actsTitle.textContent = t("placeActions");
  const list = el("div", "acts-list");
  list.className = "acts";
  acts.append(actsTitle, list);

  const endweek = el("div", "endweek");
  const confirm = el("div", "confirm");
  confirm.hidden = true;
  const confirmText = el("span");
  const yes = el("button", "btn btn-primary");
  yes.type = "button";
  yes.textContent = t("endWeekYes");
  const no = el("button", "btn");
  no.type = "button";
  no.textContent = t("endWeekNo");
  confirm.append(confirmText, yes, no);
  const endButton = el("button", "btn btn-primary");
  endButton.type = "button";
  endButton.textContent = t("endWeek");
  endweek.append(confirm, endButton);

  root.append(place, acts, endweek);

  let timeLeft = 0;

  list.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const button = target.closest("[data-action]");
    if (!(button instanceof HTMLButtonElement) || button.disabled) {
      return;
    }
    const id = button.dataset.action;
    if (id === undefined) {
      return;
    }
    handlers.onAct(id as ActionId);
  });

  endButton.addEventListener("click", () => {
    if (timeLeft >= CONFIRM_FROM) {
      confirmText.textContent = interpolate("endWeekConfirm", { n: timeLeft });
      confirm.hidden = false;
      yes.focus();
      return;
    }
    handlers.onEndWeek();
  });
  yes.addEventListener("click", () => {
    confirm.hidden = true;
    handlers.onEndWeek();
  });
  no.addEventListener("click", () => {
    confirm.hidden = true;
    endButton.focus();
  });

  let lastPlace: string | null = null;

  return {
    root,
    sync(state, player, humanTurn) {
      timeLeft = state.timeLeft;
      confirm.hidden = true;

      const src = tileArtUrl(player.locationId);
      if (lastPlace !== src) {
        lastPlace = src;
        art.src = src;
      }
      placeName.textContent = t(locationName(player.locationId));

      const scoped = withPlayer(state, player);
      const ids = actionsAt(player.locationId, player);
      if (ids.length === 0) {
        const empty = el("p", "acts-empty");
        empty.textContent = t("actionEmpty");
        list.replaceChildren(empty);
      } else {
        const rows = ids.map((id) => {
          const def = resolveAction(scoped, id);
          const block = humanTurn ? actionBlock(scoped, id) : null;
          const reason = block === null ? null : blockReason(block);
          return buildActionRow(def, reason, humanTurn && block === null);
        });
        list.replaceChildren(...rows);
      }

      endButton.disabled = !humanTurn;
      endButton.classList.toggle("endweek-urgent", humanTurn && state.timeLeft === 0);
    },
  };
}
