import { locationPreview, type LocationId, type LocationToken } from "../game/catalog";
import {
  actionsAt,
  avatarColor,
  costToLocation,
  createSetup,
  dispatch,
  getActivePlayer,
  getBotPlayer,
  getHumanPlayer,
  isActionId,
  isHumanTurn,
  loadSave,
  playBotUntilIdle,
  resolveAction,
  writeSave,
  clearSave,
  type ActionId,
  type AvatarId,
  type EngineError,
  type GameState,
} from "../game";
import { t, type MessageKey } from "../i18n";
import { palette } from "../theme/palette";
import {
  artImg,
  avatarArtUrl,
  boardMatUrl,
  eventArtUrl,
  hudIconUrl,
  paintBitmap,
  parkArtUrl,
  pawnArtUrl,
  stampArtUrl,
  tileArtUrl,
  type HudIconId,
} from "./art";
import { drawRoads, PAWN_SIZE, pawnTransform } from "./board-geometry";
import { browserStore } from "./browser-store";
import { actionCaption, actedMessage, eventMessage, jobLabel, weekStatus } from "./copy";
import { el, svgEl } from "./dom";
import { errorMessage } from "./errors";
import {
  formatRatio,
  formatZl,
  interpolate,
  meterPercent,
  needTone,
} from "./format";
import { buildSetup, type SetupHandlers } from "./setup";

const lightTextOnTile: ReadonlySet<LocationToken> = new Set([
  "bank",
  "campus",
  "gym",
  "cafe",
  "home",
  "kebab",
]);

const meterFields = [
  {
    key: "statMoney" as const,
    field: "money" as const,
    money: true,
    icon: "stat-money" as const,
  },
  {
    key: "statHappiness" as const,
    field: "happiness" as const,
    money: false,
    icon: "stat-happiness" as const,
  },
  {
    key: "statEducation" as const,
    field: "education" as const,
    money: false,
    icon: "stat-education" as const,
  },
  {
    key: "statCareer" as const,
    field: "career" as const,
    money: false,
    icon: "stat-career" as const,
  },
];

type MeterField = (typeof meterFields)[number]["field"];

type Shell = {
  root: HTMLElement;
  week: HTMLElement;
  money: HTMLElement;
  pips: HTMLElement;
  humanFace: HTMLElement;
  botFace: HTMLElement;
  board: HTMLElement;
  roads: SVGSVGElement;
  pawn: HTMLElement;
  pawnBot: HTMLElement;
  tiles: Map<LocationId, HTMLButtonElement>;
  fills: Map<MeterField, HTMLElement>;
  values: Map<MeterField, HTMLElement>;
  meters: Map<MeterField, HTMLElement>;
  food: HTMLElement;
  clothes: HTMLElement;
  job: HTMLElement;
  actions: HTMLElement;
  event: HTMLElement;
  eventArt: HTMLImageElement;
  eventCopy: HTMLElement;
  status: HTMLElement;
  endWeek: HTMLButtonElement;
  newGame: HTMLButtonElement;
};

const cssOwnedTokens = new Set<keyof typeof palette>(["paper", "ink"]);

function applyPalette(root: HTMLElement): void {
  const entries = Object.entries(palette) as [keyof typeof palette, string][];
  for (const [token, value] of entries) {
    if (cssOwnedTokens.has(token)) {
      continue;
    }
    root.style.setProperty(`--${token}`, value);
  }
}

function renderTimePips(state: GameState, mount: HTMLElement): void {
  mount.replaceChildren();
  mount.setAttribute("aria-valuenow", String(state.timeLeft));
  mount.setAttribute("aria-valuemax", String(state.timeMax));

  for (let index = 0; index < state.timeMax; index += 1) {
    const pip = el("span", index < state.timeLeft ? "pip pip-full" : "pip");
    pip.setAttribute("aria-hidden", "true");
    mount.append(pip);
  }
}

function buildPawn(className: string): HTMLElement {
  const pawn = el("span", className);
  pawn.setAttribute("aria-hidden", "true");
  pawn.style.width = `${PAWN_SIZE}px`;
  pawn.style.height = `${PAWN_SIZE}px`;
  return pawn;
}

function buildBoard(tiles: Map<LocationId, HTMLButtonElement>): {
  board: HTMLElement;
  roads: SVGSVGElement;
  pawn: HTMLElement;
  pawnBot: HTMLElement;
} {
  const board = el("section", "board");
  board.setAttribute("aria-label", t("cityName"));
  board.style.setProperty("--board-mat", `url("${boardMatUrl()}")`);

  const roads = svgEl("svg");
  roads.setAttribute("class", "board-roads");
  roads.setAttribute("aria-hidden", "true");
  board.append(roads);

  for (const location of locationPreview) {
    const tile = el("button", "tile");
    tile.type = "button";
    tile.style.gridColumn = String(location.col);
    tile.style.gridRow = String(location.row);
    tile.style.setProperty("--tile", `var(--${location.token})`);
    if (lightTextOnTile.has(location.token)) {
      tile.classList.add("tile-on-dark");
    }

    const art = el("span", "tile-art");
    art.append(artImg(tileArtUrl(location.id), "tile-bitmap"));
    const name = el("span", "tile-name");
    name.textContent = t(location.nameKey);
    const cost = el("span", "tile-cost");
    tile.append(art, name, cost);
    tiles.set(location.id, tile);
    board.append(tile);
  }

  const park = el("div", "tile tile-park");
  park.style.gridColumn = "2";
  park.style.gridRow = "2";
  const parkArt = el("span", "tile-art");
  parkArt.append(artImg(parkArtUrl(), "tile-bitmap"));
  const parkName = el("span", "tile-name");
  parkName.textContent = t("squarePark");
  park.append(parkArt, parkName);
  board.append(park);

  const pawn = buildPawn("pawn pawn-human");
  const pawnBot = buildPawn("pawn pawn-bot");
  board.append(pawn, pawnBot);

  return { board, roads, pawn, pawnBot };
}

function buildStats(
  fills: Map<MeterField, HTMLElement>,
  values: Map<MeterField, HTMLElement>,
  meters: Map<MeterField, HTMLElement>,
): HTMLElement {
  const list = el("ul", "stats");

  for (const meter of meterFields) {
    const item = el("li", "stat");
    const label = el("span", "stat-label");
    label.append(artImg(hudIconUrl(meter.icon), "hud-icon"));
    const caption = el("span");
    caption.textContent = t(meter.key);
    label.append(caption);
    const value = el("span", "stat-value");
    const bar = el("div", "bar");
    bar.setAttribute("role", "meter");
    bar.setAttribute("aria-label", t(meter.key));
    const fill = el("span", "bar-fill");
    bar.append(fill);
    item.append(label, value, bar);
    list.append(item);
    fills.set(meter.field, fill);
    values.set(meter.field, value);
    meters.set(meter.field, bar);
  }

  return list;
}

function buildShell(): Shell {
  const tiles = new Map<LocationId, HTMLButtonElement>();
  const fills = new Map<MeterField, HTMLElement>();
  const values = new Map<MeterField, HTMLElement>();
  const meters = new Map<MeterField, HTMLElement>();

  const week = el("p", "week");
  const money = el("p", "money");
  const pips = el("div", "pips");
  pips.setAttribute("role", "meter");
  pips.setAttribute("aria-label", t("timeLabel"));
  pips.setAttribute("aria-valuemin", "0");

  const timeCaption = el("span", "time-caption");
  timeCaption.append(artImg(hudIconUrl("time"), "hud-icon"));
  const timeLabel = el("span");
  timeLabel.textContent = t("timeLabel");
  timeCaption.append(timeLabel);
  const timeBlock = el("div", "time-block");
  timeBlock.append(timeCaption, pips);

  const header = el("header", "mast");
  header.append(week, money, timeBlock);

  const titleRow = el("div", "title-row");
  const stamp = artImg(stampArtUrl(), "city-stamp");
  const title = el("h1", "title");
  title.textContent = t("appTitle");
  const city = el("span", "title-city");
  city.textContent = t("cityName");
  const titleCopy = el("div", "title-copy");
  titleCopy.append(title, city);
  const humanFace = el("div", "face-chip");
  humanFace.setAttribute("aria-hidden", "true");
  const botFace = el("div", "face-chip face-chip-bot");
  botFace.setAttribute("aria-hidden", "true");
  const faces = el("div", "faces");
  faces.append(humanFace, botFace);
  titleRow.append(stamp, titleCopy, faces);

  const { board, roads, pawn, pawnBot } = buildBoard(tiles);
  const stats = buildStats(fills, values, meters);

  const food = buildNeed("need-food");
  const clothes = buildNeed("need-clothes");
  const job = buildNeed("need-job");
  const needs = el("div", "needs");
  needs.append(food, clothes, job);

  const actions = el("div", "actions");
  actions.setAttribute("role", "group");
  actions.setAttribute("aria-label", t("actionsLabel"));

  const eventBox = el("aside", "event");
  eventBox.hidden = true;
  const eventArt = el("img", "event-art");
  eventArt.alt = "";
  eventArt.hidden = true;
  eventArt.setAttribute("aria-hidden", "true");
  const eventCopy = el("p", "event-copy");
  eventBox.append(eventArt, eventCopy);

  const status = el("p", "status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const endWeek = el("button", "btn-end");
  endWeek.type = "button";
  endWeek.textContent = t("endWeek");

  const newGame = el("button", "btn-quiet");
  newGame.type = "button";
  newGame.textContent = t("newGame");

  const footer = el("footer", "colophon");
  footer.textContent = t("saveLocal");

  const tools = el("div", "play-tools");
  tools.append(footer, newGame);

  const root = el("div", "shell");
  root.append(
    header,
    titleRow,
    board,
    stats,
    needs,
    actions,
    eventBox,
    status,
    endWeek,
    tools,
  );

  return {
    root,
    week,
    money,
    pips,
    humanFace,
    botFace,
    board,
    roads,
    pawn,
    pawnBot,
    tiles,
    fills,
    values,
    meters,
    food,
    clothes,
    job,
    actions,
    event: eventBox,
    eventArt,
    eventCopy,
    status,
    endWeek,
    newGame,
  };
}

function playerIndex(state: GameState, player: { id: string }): number {
  const index = state.players.findIndex((entry) => entry.id === player.id);
  return index === -1 ? state.active : index;
}

function withPlayer(state: GameState, player: { id: string }): GameState {
  return { ...state, active: playerIndex(state, player) };
}

function syncActions(
  shell: Shell,
  state: GameState,
  humanTurn: boolean,
): void {
  const player = getHumanPlayer(state) ?? getActivePlayer(state);
  if (player === undefined) {
    return;
  }

  const ids = actionsAt(player.locationId, player);
  if (ids.length === 0) {
    const hint = el("p", "actions-empty");
    hint.textContent = t("actionEmpty");
    shell.actions.replaceChildren(hint);
    return;
  }

  const buttons = ids.map((id) => {
    const def = resolveAction(withPlayer(state, player), id);
    const button = el("button", "btn-act");
    button.type = "button";
    button.dataset.action = id;
    button.disabled = !humanTurn;
    button.textContent = actionCaption(def);
    return button;
  });
  shell.actions.replaceChildren(...buttons);
}

function buildNeed(icon: HudIconId): HTMLElement {
  const need = el("span", "need");
  need.append(artImg(hudIconUrl(icon), "hud-icon"));
  const copy = el("span", "need-copy");
  need.append(copy);
  return need;
}

function needCopy(node: HTMLElement): HTMLElement | null {
  const copy = node.querySelector(".need-copy");
  return copy instanceof HTMLElement ? copy : null;
}

function syncNeed(node: HTMLElement, labelKey: MessageKey, weeks: number): void {
  const tone = needTone(weeks);
  const copy = needCopy(node);
  if (copy !== null) {
    copy.textContent = `${t(labelKey)}: ${t(tone)}`;
  }
  node.classList.toggle("need-low", tone === "needLow");
}

function syncView(
  shell: Shell,
  state: GameState,
  message: string,
  humanTurn: boolean,
): void {
  const player = getHumanPlayer(state) ?? getActivePlayer(state);
  const actor = getActivePlayer(state);
  const bot = getBotPlayer(state);
  if (player === undefined || actor === undefined) {
    return;
  }

  const shownTime =
    humanTurn || state.phase !== "playing" ? state.timeLeft : player.nextTimeLeft;
  const pipState = { ...state, timeLeft: shownTime };
  shell.week.textContent = `${t("weekLabel")} ${state.week} · ${interpolate("turnOf", { name: actor.name })}`;
  shell.money.textContent = formatZl(player.stats.money);
  renderTimePips(pipState, shell.pips);
  shell.status.textContent = message;
  const eventText = eventMessage(player.lastEvent);
  shell.eventCopy.textContent = eventText;
  shell.event.hidden = eventText === "";
  const eventSrc = player.lastEvent === null ? null : eventArtUrl(player.lastEvent);
  if (eventSrc === null) {
    shell.eventArt.removeAttribute("src");
    shell.eventArt.hidden = true;
    shell.event.classList.remove("event-with-art");
  } else {
    shell.eventArt.src = eventSrc;
    shell.eventArt.hidden = false;
    shell.event.classList.add("event-with-art");
  }
  shell.endWeek.classList.toggle("btn-end-urgent", state.timeLeft === 0 && humanTurn);
  shell.endWeek.disabled = !humanTurn;
  shell.newGame.className = state.phase === "victory" ? "btn-end" : "btn-quiet";
  shell.root.classList.toggle("shell-locked", !humanTurn && state.phase === "playing");
  syncFace(shell.humanFace, player.avatarId, "human");
  if (bot === undefined) {
    shell.botFace.hidden = true;
  } else {
    shell.botFace.hidden = false;
    syncFace(shell.botFace, bot.avatarId, "bot");
  }

  for (const meter of meterFields) {
    const current = player.stats[meter.field];
    const goal = state.goals[meter.field];
    const fill = shell.fills.get(meter.field);
    const value = shell.values.get(meter.field);
    const bar = shell.meters.get(meter.field);
    if (fill === undefined || value === undefined || bar === undefined) {
      continue;
    }
    value.textContent = meter.money
      ? formatRatio(current, goal)
      : `${current} / ${goal}`;
    fill.style.width = `${meterPercent(current, goal)}%`;
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", String(goal));
    bar.setAttribute("aria-valuenow", String(current));
  }

  syncNeed(shell.food, "needFood", player.needs.foodWeeks);
  syncNeed(shell.clothes, "needClothes", player.needs.clothesWeeks);
  const jobCopy = needCopy(shell.job);
  if (jobCopy !== null) {
    jobCopy.textContent = jobLabel(player.job);
  }
  syncActions(shell, state, humanTurn);

  for (const [id, tile] of shell.tiles) {
    const cost = costToLocation(withPlayer(state, player), id);
    const costLabel = tile.querySelector(".tile-cost");
    const here = player.locationId === id;
    const botHere = bot?.locationId === id;
    tile.classList.toggle("tile-here", here);
    tile.classList.toggle("tile-bot", botHere === true && !here);
    if (here) {
      tile.setAttribute("aria-current", "location");
    } else {
      tile.removeAttribute("aria-current");
    }
    tile.disabled = !humanTurn;

    if (here) {
      tile.setAttribute("aria-label", `${t(locationPreviewName(id))}, ${t("youAreHere")}`);
      if (costLabel instanceof HTMLElement) {
        costLabel.textContent = t("youAreHere");
      }
      continue;
    }

    const placeName = t(locationPreviewName(id));
    if (cost === null) {
      if (costLabel instanceof HTMLElement) {
        costLabel.textContent = botHere === true ? t("botOnTile") : "";
      }
      tile.classList.remove("tile-blocked");
      tile.setAttribute("aria-label", placeName);
      continue;
    }

    const costText = interpolate("timeCost", { n: cost });
    if (costLabel instanceof HTMLElement) {
      costLabel.textContent =
        botHere === true ? `${costText} · ${t("botOnTile")}` : costText;
    }
    tile.classList.toggle("tile-blocked", cost > state.timeLeft);
    tile.setAttribute("aria-label", `${placeName}, ${costText}`);
  }
}

function locationPreviewName(id: LocationId): MessageKey {
  const location = locationPreview.find((entry) => entry.id === id);
  if (location === undefined) {
    throw new Error(`Missing location copy for ${id}`);
  }
  return location.nameKey;
}

function syncFace(node: HTMLElement, id: AvatarId, variant: "human" | "bot"): void {
  if (node.dataset.avatar === id) {
    return;
  }
  node.dataset.avatar = id;
  node.style.setProperty("--avatar", avatarColor(id));
  node.className =
    variant === "bot"
      ? `face-chip face-chip-bot portrait-${id}`
      : `face-chip portrait-${id}`;
  node.replaceChildren(artImg(avatarArtUrl(id), "avatar-bitmap"));
}

function placePawn(
  pawn: HTMLElement,
  tile: HTMLElement | undefined,
  board: HTMLElement,
  color: string,
  lane: number,
): void {
  pawn.style.color = color;
  if (tile === undefined) {
    pawn.hidden = true;
    return;
  }
  pawn.hidden = false;
  pawn.style.transform = pawnTransform(tile, board, lane);
}

function layoutBoard(shell: Shell, state: GameState): void {
  const human = getHumanPlayer(state) ?? getActivePlayer(state);
  const bot = getBotPlayer(state);
  if (human === undefined) {
    return;
  }
  drawRoads(shell.roads, shell.board, shell.tiles);
  paintBitmap(shell.pawn, pawnArtUrl(human.avatarId), "pawn-bitmap");
  if (bot !== undefined) {
    paintBitmap(shell.pawnBot, pawnArtUrl(bot.avatarId), "pawn-bitmap");
  }
  const humanTile = shell.tiles.get(human.locationId);
  const botTile = bot === undefined ? undefined : shell.tiles.get(bot.locationId);
  const shared = bot !== undefined && bot.locationId === human.locationId;
  placePawn(
    shell.pawn,
    humanTile,
    shell.board,
    avatarColor(human.avatarId),
    shared ? -1 : 0,
  );
  placePawn(
    shell.pawnBot,
    botTile,
    shell.board,
    bot === undefined ? palette.road : avatarColor(bot.avatarId),
    shared ? 1 : 0,
  );
}

export function renderApp(root: HTMLElement): void {
  applyPalette(document.documentElement);
  root.replaceChildren();

  const store = browserStore();
  let state = createSetup();
  let lastError: EngineError | null = null;
  let persistFailed = false;
  let botBusy = false;
  let shell: Shell | null = null;
  let observer: ResizeObserver | null = null;

  function persist(next: GameState): void {
    if (store === null) {
      return;
    }
    persistFailed = writeSave(store, next) === "failed";
  }

  function humanTurn(): boolean {
    return !botBusy && isHumanTurn(state);
  }

  function statusText(): string {
    if (state.phase === "victory") {
      const winner = getActivePlayer(state);
      return interpolate("victoryNamed", { name: winner?.name ?? "" });
    }
    if (lastError !== null) {
      return errorMessage(lastError);
    }
    if (persistFailed) {
      return t("saveFailed");
    }
    if (botBusy) {
      return t("botPlaying");
    }
    return t("appTagline");
  }

  function paint(message?: string): void {
    if (shell === null) {
      return;
    }
    syncView(shell, state, message ?? statusText(), humanTurn());
    layoutBoard(shell, state);
  }

  function commit(next: GameState, message?: string): void {
    state = next;
    persist(next);
    paint(message);
  }

  function applyMove(to: LocationId): void {
    if (!humanTurn() || shell === null) {
      return;
    }
    const cost = costToLocation(state, to);
    const result = dispatch(state, { type: "move", to });
    if (result.ok) {
      lastError = null;
      commit(
        result.state,
        interpolate("movedTo", {
          place: t(locationPreviewName(to)),
          cost: cost ?? 0,
        }),
      );
      return;
    }
    lastError = result.error;
    paint();
  }

  function applyAct(id: ActionId): void {
    if (!humanTurn()) {
      return;
    }
    const resolved = resolveAction(state, id);
    const result = dispatch(state, { type: "act", id });
    if (result.ok) {
      lastError = null;
      commit(result.state, actedMessage(id, resolved.wage));
      return;
    }
    lastError = result.error;
    paint();
  }

  function finishBotTurn(): void {
    const next = playBotUntilIdle(state);
    botBusy = false;
    lastError = null;
    if (next.phase === "victory") {
      commit(next);
      return;
    }
    commit(next, t("botPlayed"));
  }

  function applyEndWeek(): void {
    if (!humanTurn()) {
      return;
    }
    const result = dispatch(state, { type: "endWeek" });
    if (!result.ok) {
      lastError = result.error;
      paint();
      return;
    }
    lastError = null;
    if (result.state.phase === "victory") {
      commit(result.state);
      return;
    }
    if (isHumanTurn(result.state)) {
      commit(result.state, weekStatus(result.state));
      return;
    }
    botBusy = true;
    commit(result.state, t("botPlaying"));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        finishBotTurn();
      });
    });
  }

  function mountPlay(): void {
    observer?.disconnect();
    shell = buildShell();
    root.replaceChildren(shell.root);

    for (const [id, tile] of shell.tiles) {
      tile.addEventListener("click", () => {
        applyMove(id);
      });
    }

    shell.actions.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const button = target.closest("[data-action]");
      if (!(button instanceof HTMLButtonElement) || button.disabled) {
        return;
      }
      const actionId = button.dataset.action;
      if (actionId === undefined || !isActionId(actionId)) {
        return;
      }
      applyAct(actionId);
    });

    shell.endWeek.addEventListener("click", () => {
      applyEndWeek();
    });

    shell.newGame.addEventListener("click", () => {
      if (store !== null) {
        clearSave(store);
      }
      persistFailed = false;
      lastError = null;
      botBusy = false;
      state = createSetup();
      mountSetup();
    });

    observer = new ResizeObserver(() => {
      if (shell !== null) {
        layoutBoard(shell, state);
      }
    });
    observer.observe(shell.board);
    persist(state);
    paint();
    if (!isHumanTurn(state) && state.phase === "playing") {
      botBusy = true;
      paint(t("botPlaying"));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          finishBotTurn();
        });
      });
    }
  }

  function mountSetup(): void {
    observer?.disconnect();
    shell = null;
    lastError = null;
    botBusy = false;

    const loaded = store === null ? { status: "unavailable" as const } : loadSave(store);
    let setupNotice: "corrupt" | "unavailable" | null = null;
    if (store === null) {
      setupNotice = "unavailable";
    } else if (loaded.status === "corrupt") {
      clearSave(store);
      setupNotice = "corrupt";
    }

    const saved =
      loaded.status === "ok"
        ? {
            week: loaded.state.week,
            name: getHumanPlayer(loaded.state)?.name ?? loaded.state.players[0]?.name ?? "",
          }
        : null;

    const handlers: SetupHandlers = {
      saved,
      notice: setupNotice,
      onStart: (choice) => {
        const started = dispatch(createSetup(), {
          type: "start",
          name: choice.name,
          avatarId: choice.avatarId,
          goals: choice.goals,
        });
        if (!started.ok) {
          return;
        }
        state = started.state;
        lastError = null;
        mountPlay();
      },
    };
    if (loaded.status === "ok") {
      const resume = loaded.state;
      handlers.onContinue = () => {
        state = resume;
        lastError = null;
        mountPlay();
      };
    }
    const setup = buildSetup(handlers);
    root.replaceChildren(setup);
  }

  mountSetup();
}

