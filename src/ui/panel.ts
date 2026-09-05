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
import { actionIconUrl, artImg, homeTileArtUrl, npcArtUrl, tileArtUrl, workIconUrl } from "./art";
import { buildHomeBoard, buildRoomView, type HomeHandlers } from "./home";
import { buildElektroBoard, buildLombardBoard, type ShopHandlers } from "./shops";
import { buildBankBoard, type BankHandlers } from "./bank";
import { buildCampusBoard, type CampusHandlers } from "./campus";
import { buildJobsBoard, type JobsBoardHandlers } from "./jobs-board";
import { getJobDef } from "../game";
import { locationName } from "./board";
import { actionEffects, actionLabel, blockReason, npcLine, placeDescription } from "./copy";
import { el } from "./dom";
import { formatZl, interpolate } from "./format";
import { WORK_TIME } from "../game";

const CONFIRM_FROM = 5;

export type PanelHandlers = JobsBoardHandlers & CampusHandlers & HomeHandlers & ShopHandlers & BankHandlers & {
  onAct(id: ActionId): void;
  onEndWeek(): void;
};

export type Panel = {
  root: HTMLElement;
  sync(state: GameState, player: Player, humanTurn: boolean): void;
  /** Dolny arkusz na telefonie: rozwinięty na cały ekran albo zwinięty do paska. */
  setOpen(open: boolean): void;
};

function withPlayer(state: GameState, player: Player): GameState {
  const index = state.players.findIndex((entry) => entry.id === player.id);
  return index === -1 ? state : { ...state, active: index };
}

function buildActionRow(def: ActionDef, reason: string | null, enabled: boolean, player: Player): HTMLButtonElement {
  const button = el("button", "act");
  button.type = "button";
  button.dataset.action = def.id;
  button.disabled = !enabled;

  const iconSrc = def.isWork && player.job !== null ? workIconUrl(getJobDef(player.job.id).company) : actionIconUrl(def.id);
  const icon = artImg(iconSrc, "act-icon pix", "icon");
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
  const room = buildRoomView();
  room.root.hidden = true;
  const copy = el("div", "place-copy");
  const placeName = el("span", "plaque place-name");
  const here = el("span", "plaque plaque-accent place-here");
  here.textContent = t("youAreHere");
  copy.append(placeName, here);
  place.append(art, room.root, copy);
  const desc = el("p", "place-desc");
  const npc = el("div", "npc");
  const npcFace = el("div", "npc-face");
  const npcBubble = el("div", "npc-bubble");
  const npcName = el("span", "npc-name");
  const npcText = el("p", "npc-text");
  npcBubble.append(npcName, npcText);
  npc.append(npcFace, npcBubble);
  let npcKey = "";

  const sheetToggle = el("button", "btn sheet-toggle");
  sheetToggle.type = "button";
  sheetToggle.setAttribute("aria-expanded", "false");
  const sheetLabel = el("span");
  sheetToggle.append(sheetLabel);
  const sheetClose = el("button", "btn-quiet sheet-close");
  sheetClose.type = "button";
  sheetClose.textContent = t("sheetClose");

  const acts = el("div", "acts");
  acts.setAttribute("role", "group");
  acts.setAttribute("aria-label", t("actionsLabel"));
  const actsTitle = el("h3", "acts-title");
  actsTitle.textContent = t("placeActions");
  const list = el("div", "acts-list");
  list.className = "acts";
  acts.append(actsTitle, list);
  const jobs = buildJobsBoard({ onApply: handlers.onApply, onRaise: handlers.onRaise });
  jobs.root.hidden = true;
  const campus = buildCampusBoard({ onEnroll: handlers.onEnroll });
  campus.root.hidden = true;
  const homeBoard = buildHomeBoard({ onRelocate: handlers.onRelocate });
  homeBoard.root.hidden = true;
  const shopHandlers = { onBuy: handlers.onBuy, onSell: handlers.onSell, onRepair: handlers.onRepair };
  const elektro = buildElektroBoard(shopHandlers);
  elektro.root.hidden = true;
  const lombard = buildLombardBoard(shopHandlers);
  lombard.root.hidden = true;
  const bank = buildBankBoard({ onBank: handlers.onBank });
  bank.root.hidden = true;

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

  const body = el("div", "panel-body");
  body.append(desc, npc, acts, jobs.root, campus.root, homeBoard.root, elektro.root, lombard.root, bank.root);
  root.append(sheetClose, place, sheetToggle, body, endweek);

  let timeLeft = 0;
  let hasLegalAction = false;

  function setOpen(open: boolean): void {
    root.classList.toggle("panel-open", open);
    sheetToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      root.scrollTop = 0;
    }
    if (!open) {
      confirm.hidden = true;
    }
  }
  sheetToggle.addEventListener("click", () => setOpen(!root.classList.contains("panel-open")));
  sheetClose.addEventListener("click", () => setOpen(false));

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
    if (timeLeft >= CONFIRM_FROM && hasLegalAction) {
      confirmText.textContent = interpolate(timeLeft >= WORK_TIME ? "endWeekConfirmShift" : "endWeekConfirm", { n: timeLeft });
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

      const atHome = player.locationId === "home";
      const src = atHome ? homeTileArtUrl(player.home.id) : tileArtUrl(player.locationId);
      if (lastPlace !== src) {
        lastPlace = src;
        art.src = src;
      }
      art.hidden = atHome;
      room.root.hidden = !atHome;
      if (atHome) {
        room.sync(player);
      }
      placeName.textContent = t(locationName(player.locationId));
      desc.textContent = placeDescription(player.locationId);
      const line = npcLine(state, player);
      npc.hidden = line === null;
      if (line !== null) {
        if (npcKey !== line.id) {
          npcKey = line.id;
          npcFace.replaceChildren(artImg(npcArtUrl(line.id), "", "icon"));
        }
        npcName.textContent = line.name;
        npcText.textContent = line.text;
      }

      const scoped = withPlayer(state, player);
      const ids = actionsAt(player.locationId, player);
      const atPup = player.locationId === "pup";
      jobs.root.hidden = !atPup;
      if (atPup) {
        jobs.sync(scoped, player, humanTurn);
      }
      const atCampus = player.locationId === "campus";
      campus.root.hidden = !atCampus;
      if (atCampus) {
        campus.sync(scoped, player, humanTurn);
      }
      homeBoard.root.hidden = !atHome;
      if (atHome) {
        homeBoard.sync(scoped, player, humanTurn);
      }
      const atElektro = player.locationId === "elektro";
      elektro.root.hidden = !atElektro;
      if (atElektro) {
        elektro.sync(scoped, player, humanTurn);
      }
      const atBank = player.locationId === "bank";
      bank.root.hidden = !atBank;
      if (atBank) {
        bank.sync(scoped, player, humanTurn);
      }
      const atLombard = player.locationId === "lombard";
      lombard.root.hidden = !atLombard;
      if (atLombard) {
        lombard.sync(scoped, player, humanTurn);
      }
      acts.hidden = (atPup || atCampus || atElektro) && ids.length === 0;
      hasLegalAction = false;
      const boards = [atPup, atCampus, atHome, atElektro, atLombard, atBank].filter(Boolean).length;
      sheetLabel.textContent = interpolate("sheetActions", { n: ids.length + boards });
      if (ids.length === 0) {
        const empty = el("p", "acts-empty");
        empty.textContent = t("actionEmpty");
        list.replaceChildren(empty);
      } else {
        const rows = ids.map((id) => {
          const def = resolveAction(scoped, id);
          const block = humanTurn ? actionBlock(scoped, id) : null;
          const reason = block === null ? null : blockReason(block);
          if (block === null && humanTurn) {
            hasLegalAction = true;
          }
          return buildActionRow(def, reason, humanTurn && block === null, player);
        });
        list.replaceChildren(...rows);
      }

      endButton.disabled = !humanTurn;
      endButton.classList.toggle("endweek-urgent", humanTurn && state.timeLeft === 0);
    },
    setOpen,
  };
}
