import {
  avatarColor,
  getBotPlayer,
  getHumanPlayer,
  type AvatarId,
  type GameState,
  type Player,
} from "../game";
import { t, type MessageKey } from "../i18n";
import { artImg, avatarArtUrl, diplomaArtUrl, hudIconUrl, stampArtUrl, type HudIconId } from "./art";
import { diplomaName, weekGoal } from "./copy";
import { el } from "./dom";
import { economyLabel } from "./copy";
import { wealth } from "../game";
import { formatNumber, formatZl, interpolate, meterPercent } from "./format";
import { getAudioPrefs, onAudioPrefs, setAudioPrefs, sfx, TRACK_IDS, type AudioPrefs, type TrackId } from "./audio";

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

  const economy = el("span", "plaque economy");
  economy.hidden = true;
  weekBlock.append(economy);

  const wallet = el("div", "wallet");
  const moneyBlock = el("div", "money-block");
  const money = el("p", "money");
  const accountLine = el("span", "money-extra");
  accountLine.hidden = true;
  moneyBlock.append(money, accountLine);
  const faces = el("div", "faces");
  const human = buildFace("face");
  const bot = buildFace("face face-bot");
  faces.append(human, bot);
  wallet.append(moneyBlock, faces);

  root.append(brand, weekBlock, buildAudioToggles(), wallet);

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

      const phase = state.economy.phase;
      economy.hidden = phase === "normal";
      economy.textContent = economyLabel(phase);
      economy.classList.toggle("economy-boom", phase === "boom");
      economy.classList.toggle("economy-recession", phase === "recession");

      money.textContent = formatZl(player.stats.money);
      const extra = player.account + (player.deposit?.amount ?? 0) + player.shares * state.stockPrice - (player.loan?.principal ?? 0);
      accountLine.hidden = extra === 0;
      accountLine.textContent = `${t("wealthLabel")} ${formatZl(wealth(player, state.stockPrice))}`;
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
        const shown = meter.money ? wealth(player, state.stockPrice) : current;
        row.value.textContent = meter.money ? formatZl(shown) : String(shown);
        row.goal.textContent = ` / ${meter.money ? formatNumber(target) : String(target)}`;
        row.value.append(row.goal);
        const filled = Math.round((meterPercent(shown, target) / 100) * SEGMENTS);
        row.segs.forEach((seg, index) => seg.classList.toggle("seg-on", index < filled));
        row.item.classList.toggle("stat-done", shown >= target);
        row.bar.setAttribute("aria-valuemin", "0");
        row.bar.setAttribute("aria-valuemax", String(target));
        row.bar.setAttribute("aria-valuenow", String(shown));
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
  const suit = buildNeed("need-clothes", "needSuit");
  suit.node.classList.add("need-suit");
  const deposit = buildNeed("stat-money", "depositLabel");
  deposit.node.classList.add("need-deposit");
  deposit.node.hidden = true;
  const diplomas = el("span", "need need-diplomas");
  diplomas.hidden = true;
  root.append(food.node, clothes.node, suit.node, deposit.node, diplomas);

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
      suit.value.textContent = player.needs.suitWeeks > 0 ? interpolate("needWeeks", { n: player.needs.suitWeeks }) : t("needLow");
      suit.node.classList.toggle("need-low", player.needs.suitWeeks <= 0);
      suit.node.classList.toggle("need-muted", player.needs.suitWeeks <= 0 && player.job === null);
      diplomas.hidden = player.diplomas.length === 0;
      if (diplomas.dataset.list !== player.diplomas.join(",")) {
        diplomas.dataset.list = player.diplomas.join(",");
        diplomas.replaceChildren();
        for (const id of player.diplomas) {
          const icon = artImg(diplomaArtUrl(id), "pix", "diploma");
          icon.title = diplomaName(id);
          diplomas.append(icon);
        }
      }
      if (player.deposit === null) {
        deposit.node.hidden = true;
      } else {
        deposit.node.hidden = false;
        deposit.value.textContent = interpolate("depositWeeks", { n: player.deposit.weeksLeft });
      }
    },
  };
}

export type GoalLine = {
  root: HTMLElement;
  sync(state: GameState, player: Player): void;
};

/** Jedno zdanie prowadzenia pod paskiem górnym. */
export function buildGoalLine(): GoalLine {
  const root = el("p", "week-goal");
  const label = el("span", "plaque plaque-accent week-goal-label");
  label.textContent = t("goalLabel");
  const text = el("span", "week-goal-text");
  root.append(label, text);
  return {
    root,
    sync(state, player) {
      text.textContent = weekGoal(state, player).text;
    },
  };
}

export type RivalRow = {
  root: HTMLElement;
  sync(state: GameState): void;
};

/** Wyniki Kowalskiego pod statami: ta sama czwórka, żeby było widać wyścig. */
export function buildRivalRow(): RivalRow {
  const root = el("div", "rival");
  const face = buildFace("face face-bot rival-face");
  const name = el("span", "rival-name");
  const values = el("span", "rival-values");
  root.append(face, name, values);
  return {
    root,
    sync(state) {
      const rival = getBotPlayer(state);
      if (rival === undefined) {
        root.hidden = true;
        return;
      }
      root.hidden = false;
      syncFace(face, rival.avatarId);
      name.textContent = rival.name;
      values.replaceChildren();
      for (const meter of meterFields) {
        const cell = el("span", "rival-cell");
        cell.append(artImg(hudIconUrl(meter.icon), "pix", "icon"));
        const value = el("span");
        const shown = meter.money ? wealth(rival, state.stockPrice) : rival.stats[meter.field];
        value.textContent = meter.money ? formatZl(shown) : String(shown);
        cell.append(value);
        cell.classList.toggle("rival-done", shown >= state.goals[meter.field]);
        values.append(cell);
      }
    },
  };
}

function trackName(id: TrackId): string {
  switch (id) {
    case "wieczor":
      return t("trackWieczor");
    case "poranek":
      return t("trackPoranek");
    case "noc":
      return t("trackNoc");
    default: {
      const exhaustive: never = id;
      return exhaustive;
    }
  }
}

/** Grupa „Dźwięk”: wybór utworu (albo cisza) i przełącznik efektów. Stan w localStorage. */
export function buildAudioToggles(): HTMLElement {
  const root = el("div", "audio");
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", t("audioGroup"));
  const caption = el("span", "audio-caption");
  caption.textContent = t("audioGroup");

  const musicLabel = el("label", "audio-field audio-music");
  const musicIcon = el("span", "audio-glyph audio-glyph-music");
  musicIcon.setAttribute("aria-hidden", "true");
  const select = el("select", "audio-select");
  select.setAttribute("aria-label", t("audioMusic"));
  const off = el("option");
  off.value = "off";
  off.textContent = t("audioMusicOff");
  select.append(off);
  for (const id of TRACK_IDS) {
    const option = el("option");
    option.value = id;
    option.textContent = trackName(id);
    select.append(option);
  }
  musicLabel.append(musicIcon, select);

  const sfxButton = el("button", "audio-field audio-sfx");
  sfxButton.type = "button";
  const sfxIcon = el("span", "audio-glyph audio-glyph-sfx");
  sfxIcon.setAttribute("aria-hidden", "true");
  const sfxText = el("span", "audio-text");
  sfxText.textContent = t("audioSfx");
  sfxButton.append(sfxIcon, sfxText);

  const sync = (prefs: AudioPrefs): void => {
    select.value = prefs.music ? prefs.track : "off";
    musicLabel.classList.toggle("audio-off", !prefs.music);
    sfxButton.setAttribute("aria-pressed", prefs.sfx ? "true" : "false");
    sfxButton.classList.toggle("audio-off", !prefs.sfx);
    sfxButton.title = `${t("audioSfx")}: ${prefs.sfx ? t("audioOn") : t("audioOff")}`;
  };
  sync(getAudioPrefs());
  onAudioPrefs(sync);

  select.addEventListener("change", () => {
    const prefs = getAudioPrefs();
    const value = select.value;
    const track = (TRACK_IDS as readonly string[]).includes(value) ? (value as TrackId) : prefs.track;
    setAudioPrefs({ ...prefs, music: value !== "off", track });
    sfx("ui");
  });
  sfxButton.addEventListener("click", () => {
    const prefs = getAudioPrefs();
    setAudioPrefs({ ...prefs, sfx: !prefs.sfx });
    sfx("ui");
  });

  root.append(caption, musicLabel, sfxButton);
  return root;
}
