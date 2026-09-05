import {
  avatarColor,
  getBotPlayer,
  getHumanPlayer,
  type AvatarId,
  type GameState,
  type Player,
} from "../game";
import { t, type MessageKey } from "../i18n";
import { artImg, avatarArtUrl, hudIconUrl, stampArtUrl, type HudIconId } from "./art";
import { jobShort } from "./copy";
import { el } from "./dom";
import { formatNumber, formatZl, interpolate, meterPercent } from "./format";

type MeterField = "money" | "happiness" | "education" | "career";

const meterFields: readonly { field: MeterField; key: MessageKey; icon: HudIconId; money: boolean }[] = [
  { field: "money", key: "statMoney", icon: "stat-money", money: true },
  { field: "happiness", key: "statHappiness", icon: "stat-happiness", money: false },
  { field: "education", key: "statEducation", icon: "stat-education", money: false },
  { field: "career", key: "statCareer", icon: "stat-career", money: false },
];

const SEGMENTS = 10;

export type TopBar = {
  root: HTMLElement;
  sync(state: GameState, shownTime: number, actorName: string): void;
};

function buildFace(className: string): HTMLElement {
  const face = el("div", className);
  face.setAttribute("aria-hidden", "true");
  return face;
}

function syncFace(node: HTMLElement, id: AvatarId): void {
  if (node.dataset.avatar === id) {
    return;
  }
  node.dataset.avatar = id;
  node.style.setProperty("--avatar", avatarColor(id));
  node.replaceChildren(artImg(avatarArtUrl(id), ""));
}

export function buildTopBar(): TopBar {
  const root = el("header", "top");

  const brand = el("div", "brand");
  brand.append(artImg(stampArtUrl(), "brand-stamp"));
  const name = el("h1", "brand-name");
  name.textContent = t("gameName");
  const kicker = el("span", "brand-kicker");
  kicker.textContent = t("appTitle");
  name.append(kicker);
  brand.append(name);

  const weekBlock = el("div", "week-block");
  const week = el("p", "week");
  const tickets = el("div", "tickets");
  tickets.setAttribute("role", "meter");
  tickets.setAttribute("aria-label", t("timeLabel"));
  tickets.setAttribute("aria-valuemin", "0");
  const icon = artImg(hudIconUrl("time"), "tickets-icon pix");
  tickets.append(icon);
  const ticks: HTMLElement[] = [];
  weekBlock.append(week, tickets);

  const wallet = el("div", "wallet");
  const money = el("p", "money");
  const faces = el("div", "faces");
  const human = buildFace("face");
  const bot = buildFace("face face-bot");
  faces.append(human, bot);
  wallet.append(money, faces);

  root.append(brand, weekBlock, wallet);

  let lastMoney: number | null = null;

  return {
    root,
    sync(state, shownTime, actorName) {
      const player = getHumanPlayer(state);
      const rival = getBotPlayer(state);
      if (player === undefined) {
        return;
      }
      week.replaceChildren();
      const weekText = document.createTextNode(`${t("weekLabel")} ${state.week} `);
      const turn = el("span", "week-turn");
      turn.textContent = actorName;
      week.append(weekText, turn);

      if (ticks.length !== state.timeMax) {
        for (const tick of ticks) {
          tick.remove();
        }
        ticks.length = 0;
        for (let index = 0; index < state.timeMax; index += 1) {
          const tick = el("span", "tick");
          tick.setAttribute("aria-hidden", "true");
          tickets.append(tick);
          ticks.push(tick);
        }
      }
      ticks.forEach((tick, index) => {
        tick.classList.toggle("tick-used", index >= shownTime);
      });
      tickets.setAttribute("aria-valuenow", String(shownTime));
      tickets.setAttribute("aria-valuemax", String(state.timeMax));

      money.textContent = formatZl(player.stats.money);
      if (lastMoney !== null && lastMoney !== player.stats.money) {
        money.classList.add("money-flash");
        window.setTimeout(() => money.classList.remove("money-flash"), 500);
      }
      lastMoney = player.stats.money;

      syncFace(human, player.avatarId);
      if (rival === undefined) {
        bot.hidden = true;
      } else {
        bot.hidden = false;
        syncFace(bot, rival.avatarId);
      }
    },
  };
}

export type StatsPanel = {
  root: HTMLElement;
  sync(state: GameState, player: Player): void;
};

export function buildStats(): StatsPanel {
  const root = el("ul", "stats");
  const rows = new Map<MeterField, { item: HTMLElement; value: HTMLElement; goal: HTMLElement; segs: HTMLElement[]; bar: HTMLElement }>();

  for (const meter of meterFields) {
    const item = el("li", "stat");
    item.append(artImg(hudIconUrl(meter.icon), "stat-icon pix"));
    const label = el("span", "stat-label");
    label.textContent = t(meter.key);
    const value = el("span", "stat-value");
    const goal = el("span", "stat-goal");
    const bar = el("div", "segs");
    bar.setAttribute("role", "meter");
    bar.setAttribute("aria-label", t(meter.key));
    const segs: HTMLElement[] = [];
    for (let index = 0; index < SEGMENTS; index += 1) {
      const seg = el("span", "seg");
      bar.append(seg);
      segs.push(seg);
    }
    item.append(label, value, bar);
    root.append(item);
    rows.set(meter.field, { item, value, goal, segs, bar });
  }

  return {
    root,
    sync(state, player) {
      for (const meter of meterFields) {
        const row = rows.get(meter.field);
        if (row === undefined) {
          continue;
        }
        const current = player.stats[meter.field];
        const target = state.goals[meter.field];
        row.value.textContent = meter.money ? formatZl(current) : String(current);
        row.goal.textContent = ` / ${meter.money ? formatNumber(target) : String(target)}`;
        row.value.append(row.goal);
        const filled = Math.round((meterPercent(current, target) / 100) * SEGMENTS);
        row.segs.forEach((seg, index) => seg.classList.toggle("seg-on", index < filled));
        row.item.classList.toggle("stat-done", current >= target);
        row.bar.setAttribute("aria-valuemin", "0");
        row.bar.setAttribute("aria-valuemax", String(target));
        row.bar.setAttribute("aria-valuenow", String(current));
      }
    },
  };
}

export type NeedsRow = {
  root: HTMLElement;
  sync(player: Player): void;
};

function buildNeed(icon: HudIconId, label: MessageKey): { node: HTMLElement; value: HTMLElement } {
  const node = el("span", "need");
  node.append(artImg(hudIconUrl(icon), "pix"));
  const caption = el("span");
  caption.textContent = t(label);
  const value = el("span", "need-value");
  node.append(caption, value);
  return { node, value };
}

export function buildNeeds(): NeedsRow {
  const root = el("div", "needs");
  const food = buildNeed("need-food", "needFood");
  const clothes = buildNeed("need-clothes", "needClothes");
  const job = buildNeed("need-job", "needJob");
  const deposit = buildNeed("stat-money", "depositLabel");
  deposit.node.classList.add("need-deposit");
  deposit.node.hidden = true;
  root.append(food.node, clothes.node, job.node, deposit.node);

  function syncWeeks(need: { node: HTMLElement; value: HTMLElement }, weeks: number): void {
    const low = weeks <= 0;
    need.value.textContent = low ? t("needLow") : interpolate("needWeeks", { n: weeks });
    need.node.classList.toggle("need-low", low);
  }

  return {
    root,
    sync(player) {
      syncWeeks(food, player.needs.foodWeeks);
      syncWeeks(clothes, player.needs.clothesWeeks);
      job.value.textContent = jobShort(player.job);
      job.node.classList.toggle("need-low", player.job === null);
      if (player.deposit === null) {
        deposit.node.hidden = true;
      } else {
        deposit.node.hidden = false;
        deposit.value.textContent = interpolate("depositWeeks", { n: player.deposit.weeksLeft });
      }
    },
  };
}
