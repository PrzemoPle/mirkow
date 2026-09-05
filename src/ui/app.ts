import {
  clearSave,
  createSetup,
  dispatch,
  getActivePlayer,
  getBotPlayer,
  getHumanPlayer,
  isHumanTurn,
  loadSave,
  playBotWithTrace,
  resolveAction,
  writeSave,
  type ActionId,
  type BotStep,
  type EngineError,
  type DiplomaId,
  type GameAction,
  type GameState,
  type HomeId,
  type ItemId,
  type JobId,
  type LocationId,
  type NoticeId,
  type WeekEffect,
} from "../game";
import { getJobDef } from "../game";
import { t } from "../i18n";
import { eventArtUrl } from "./art";
import { buildBoard, locationName } from "./board";
import { browserStore } from "./browser-store";
import type { SaveStore } from "../game/save";
import { actedMessage, actionLabel, companyName, diplomaName, effectLine, eventMessage, homeName, itemName, jobName, noticeTitle, placeDescription, rivalCard, weekendArt, weekGoal } from "./copy";
import { sellPrice } from "../game";
import { el } from "./dom";
import { errorMessage } from "./errors";
import { interpolate } from "./format";
import { buildGoalLine, buildNeeds, buildRivalRow, buildStats, buildTopBar } from "./hud";
import { buildJournal } from "./journal";
import { setFastForward, wait } from "./motion";
import { showEventCard, showHowToCard, showNoticeCard, showRivalCard, showVictory } from "./overlays";
import { buildPanel } from "./panel";
import { buildSetup, type SetupHandlers } from "./setup";
import { buildWorkCard } from "./work";
import { sfx, unlockAudio } from "./audio";

const BOT_ACT_MS = 520;
const BOT_END_MS = 300;
/** Przez tyle tygodni plansza podświetla kafelek z celu tygodnia. */
const HINT_WEEKS = 3;
const HOWTO_KEY = "mirkow.howto.v1";
const MOBILE_QUERY = "(max-width: 1023px)";

type Shell = {
  root: HTMLElement;
  top: ReturnType<typeof buildTopBar>;
  board: ReturnType<typeof buildBoard>;
  stats: ReturnType<typeof buildStats>;
  needs: ReturnType<typeof buildNeeds>;
  goal: ReturnType<typeof buildGoalLine>;
  rival: ReturnType<typeof buildRivalRow>;
  work: ReturnType<typeof buildWorkCard>;
  panel: ReturnType<typeof buildPanel>;
  journal: ReturnType<typeof buildJournal>;
  status: HTMLElement;
  skip: HTMLButtonElement;
  newGame: HTMLButtonElement;
};

function humanEffects(effects: readonly WeekEffect[]): string[] {
  return effects.filter((effect) => effect.kind !== "event").map(effectLine);
}

function weekendFoot(effects: readonly WeekEffect[]): { text: string; art: ReturnType<typeof weekendArt> } | undefined {
  const weekend = effects.find((effect) => effect.kind === "weekend");
  return weekend === undefined || weekend.kind !== "weekend" ? undefined : { text: effectLine(weekend), art: weekendArt(weekend.id) };
}

function isMobile(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function howToSeen(store: SaveStore | null): boolean {
  try {
    return store?.getItem(HOWTO_KEY) === "1";
  } catch {
    return false;
  }
}

function markHowToSeen(store: SaveStore | null): void {
  try {
    store?.setItem(HOWTO_KEY, "1");
  } catch {
    /* zapis nieobowiązkowy */
  }
}

export function renderApp(root: HTMLElement): void {
  root.replaceChildren();

  const store = browserStore();
  let state = createSetup();
  let lastError: EngineError | null = null;
  let persistFailed = false;
  let busy = false;
  let shell: Shell | null = null;
  let observer: ResizeObserver | null = null;

  function persist(next: GameState): void {
    if (store === null) {
      return;
    }
    persistFailed = writeSave(store, next) === "failed";
  }

  function humanTurn(): boolean {
    return !busy && isHumanTurn(state);
  }

  function statusText(): string {
    if (lastError !== null) {
      return errorMessage(lastError);
    }
    if (persistFailed) {
      return t("saveFailed");
    }
    if (busy) {
      return t("botPlaying");
    }
    return t("turnYours");
  }

  function paint(message?: string): void {
    if (shell === null) {
      return;
    }
    const player = getHumanPlayer(state) ?? getActivePlayer(state);
    const actor = getActivePlayer(state);
    if (player === undefined || actor === undefined) {
      return;
    }
    const turn = humanTurn();
    const shownTime = isHumanTurn(state) || state.phase !== "playing" ? state.timeLeft : player.nextTimeLeft;
    const actorLabel = actor.controller === "bot" ? t("botTurn") : t("turnYours");
    shell.top.sync(state, shownTime, actorLabel);
    shell.stats.sync(state, player);
    shell.needs.sync(player);
    shell.goal.sync({ ...state, timeLeft: shownTime }, player);
    shell.rival.sync(state);
    shell.work.sync(state, player);
    shell.panel.sync({ ...state, timeLeft: shownTime }, player, turn);
    shell.board.syncTiles({ ...state, timeLeft: shownTime }, player, turn);
    shell.board.place(state);
    const hint = state.week <= HINT_WEEKS && turn ? weekGoal({ ...state, timeLeft: shownTime }, player).location : null;
    shell.board.hint(hint === player.locationId ? null : hint);
    shell.status.textContent = message ?? statusText();
    shell.status.classList.toggle("status-error", lastError !== null && message === undefined);
    shell.root.classList.toggle("game-locked", !turn && state.phase === "playing");
  }

  function commit(next: GameState, message?: string): void {
    state = next;
    persist(next);
    paint(message);
  }

  function checkVictory(): boolean {
    if (state.phase !== "victory") {
      return false;
    }
    const winner = getActivePlayer(state);
    const human = getHumanPlayer(state);
    if (winner === undefined || human === undefined) {
      return false;
    }
    shell?.journal.add({ week: state.week, who: "city", text: interpolate("victoryNamed", { name: winner.name }) });
    showVictory({ state, winner, human, onNewGame: startOver });
    return true;
  }

  async function applyMove(to: LocationId): Promise<void> {
    if (!humanTurn() || shell === null) {
      return;
    }
    const player = getHumanPlayer(state);
    if (player === undefined) {
      return;
    }
    const result = dispatch(state, { type: "move", to });
    if (!result.ok) {
      lastError = result.error;
      sfx("error");
      paint();
      return;
    }
    lastError = null;
    busy = true;
    state = result.state;
    persist(state);
    shell.top.sync(state, state.timeLeft, t("turnYours"));
    shell.board.syncTiles(state, getHumanPlayer(state) ?? player, false);
    sfx("move");
    await shell.board.travel("human", state, player.locationId, to);
    busy = false;
    paint(`${t(locationName(to))}. ${placeDescription(to)}`);
    if (isMobile()) {
      shell.panel.setOpen(true);
    }
  }

  async function applyForJob(job: JobId): Promise<void> {
    if (!humanTurn() || shell === null) {
      return;
    }
    const result = dispatch(state, { type: "apply", job });
    if (!result.ok) {
      lastError = result.error;
      sfx("error");
      paint();
      return;
    }
    lastError = null;
    sfx("stamp");
    const def = getJobDef(job);
    const line = interpolate("actedApply", { job: jobName(job), company: companyName(def.company) });
    shell.journal.add({ week: state.week, who: "you", text: line });
    commit(result.state, line);
    await showHumanNotice();
    checkVictory();
  }

  function enrollIn(diploma: DiplomaId): void {
    if (!humanTurn() || shell === null) {
      return;
    }
    const result = dispatch(state, { type: "enroll", diploma });
    if (!result.ok) {
      lastError = result.error;
      sfx("error");
      paint();
      return;
    }
    lastError = null;
    sfx("stamp");
    commit(result.state, interpolate("actedEnroll", { diploma: diplomaName(diploma) }));
  }

  async function relocateTo(home: HomeId): Promise<void> {
    if (!humanTurn() || shell === null) {
      return;
    }
    const result = dispatch(state, { type: "relocate", home });
    if (!result.ok) {
      lastError = result.error;
      sfx("error");
      paint();
      return;
    }
    lastError = null;
    sfx("stamp");
    const line = interpolate("actedRelocate", { home: homeName(home) });
    shell.journal.add({ week: state.week, who: "you", text: line });
    commit(result.state, line);
    await showHumanNotice();
  }

  function tradeItem(action: { type: "buyItem"; item: ItemId; used: boolean } | { type: "sellItem"; item: ItemId } | { type: "repairItem"; item: ItemId }): void {
    if (!humanTurn() || shell === null) {
      return;
    }
    const result = dispatch(state, action);
    if (!result.ok) {
      lastError = result.error;
      sfx("error");
      paint();
      return;
    }
    lastError = null;
    sfx("coin");
    const name = itemName(action.item);
    const line =
      action.type === "buyItem"
        ? interpolate("actedBuyItem", { item: name })
        : action.type === "sellItem"
          ? interpolate("actedSellItem", { item: name, money: sellPrice(action.item) })
          : interpolate("actedRepairItem", { item: name });
    shell.journal.add({ week: state.week, who: "you", text: line });
    commit(result.state, line);
    checkVictory();
  }

  function bankAction(action: GameAction): void {
    if (!humanTurn() || shell === null) {
      return;
    }
    const result = dispatch(state, action);
    if (!result.ok) {
      lastError = result.error;
      sfx("error");
      paint();
      return;
    }
    lastError = null;
    sfx("coin");
    const after = getHumanPlayer(result.state);
    const line =
      action.type === "account"
        ? interpolate("actedAccount", { n: after?.account ?? 0 })
        : action.type === "loan"
          ? action.amount > 0
            ? interpolate("actedLoanTaken", { n: action.amount })
            : interpolate("actedLoanRepaid", { n: -action.amount })
          : action.type === "trade"
            ? interpolate("actedTrade", { n: action.shares, price: state.stockPrice })
            : "";
    commit(result.state, line);
    checkVictory();
  }

  async function askForRaise(): Promise<void> {
    if (!humanTurn() || shell === null) {
      return;
    }
    const result = dispatch(state, { type: "askRaise" });
    if (!result.ok) {
      lastError = result.error;
      sfx("error");
      paint();
      return;
    }
    lastError = null;
    sfx("stamp");
    shell.journal.add({ week: state.week, who: "you", text: t("actedRaise") });
    commit(result.state, t("actedRaise"));
    await showHumanNotice();
  }

  /** Karta z pracy dla człowieka (awans, podwyżka, zwolnienie), potem czyścimy znacznik. */
  async function showHumanNotice(): Promise<void> {
    const human = getHumanPlayer(state);
    const notice: NoticeId | null = human?.lastNotice ?? null;
    if (human === undefined || notice === null) {
      return;
    }
    busy = true;
    await showNoticeCard(notice, "you");
    busy = false;
    state = {
      ...state,
      players: state.players.map((entry) => (entry.id === human.id ? { ...entry, lastNotice: null } : entry)),
    };
    persist(state);
    paint();
  }

  function applyAct(id: ActionId): void {
    if (!humanTurn()) {
      return;
    }
    const resolved = resolveAction(state, id);
    const result = dispatch(state, { type: "act", id });
    if (!result.ok) {
      lastError = result.error;
      sfx("error");
      paint();
      return;
    }
    lastError = null;
    sfx(resolved.wage > 0 ? "coin" : "act");
    commit(result.state, actedMessage(id, resolved.wage));
    if (id === "takeExam") {
      void showHumanNotice().then(() => {
        checkVictory();
      });
      return;
    }
    checkVictory();
  }

  async function replayBot(steps: readonly BotStep[]): Promise<void> {
    if (shell === null) {
      return;
    }
    let shownNotice: NoticeId | null = null;
    /** Karta z miną Kowalskiego po każdym kroku, który zostawił nowe zdarzenie z pracy albo życia. */
    const maybeRivalCard = async (): Promise<void> => {
      const bot = getBotPlayer(state);
      const notice = bot?.lastNotice ?? null;
      if (bot === undefined || notice === null || notice === shownNotice || shell === null) {
        return;
      }
      shownNotice = notice;
      const card = rivalCard(notice);
      if (card === null) {
        return;
      }
      shell.journal.add({ week: state.week, who: "bot", text: card.text });
      paint(card.text);
      await showRivalCard(bot, card.mood, card.text);
    };
    for (const step of steps) {
      const before = getBotPlayer(state);
      if (step.action.type === "move" && before !== undefined) {
        const to = step.action.to as LocationId;
        shell.status.textContent = interpolate("botMoves", { place: t(locationName(to)) });
        await shell.board.travel("bot", step.state, before.locationId, to);
        state = step.state;
        paint(shell.status.textContent ?? undefined);
      } else if (step.action.type === "act") {
        const label = actionLabel(step.action.id);
        state = step.state;
        const line = interpolate("botActs", { label });
        paint(line);
        shell.journal.add({ week: state.week, who: "bot", text: label });
        await wait(BOT_ACT_MS);
      } else if (step.action.type === "apply") {
        state = step.state;
        const def = getJobDef(step.action.job);
        const line = interpolate("botApplies", { job: jobName(step.action.job), company: companyName(def.company) });
        paint(line);
        shell.journal.add({ week: state.week, who: "bot", text: line });
        await wait(BOT_ACT_MS);
      } else if (step.action.type === "enroll") {
        state = step.state;
        const line = interpolate("botEnrolls", { diploma: diplomaName(step.action.diploma) });
        paint(line);
        shell.journal.add({ week: state.week, who: "bot", text: line });
        await wait(BOT_ACT_MS);
      } else if (step.action.type === "relocate") {
        state = step.state;
        const line = interpolate("botRelocates", { home: homeName(step.action.home) });
        paint(line);
        shell.journal.add({ week: state.week, who: "bot", text: line });
        await wait(BOT_ACT_MS);
      } else if (step.action.type === "buyItem") {
        state = step.state;
        const line = interpolate("botBuys", { item: itemName(step.action.item) });
        paint(line);
        shell.journal.add({ week: state.week, who: "bot", text: line });
        await wait(BOT_ACT_MS);
      } else if (
        step.action.type === "sellItem" ||
        step.action.type === "repairItem" ||
        step.action.type === "account" ||
        step.action.type === "loan" ||
        step.action.type === "trade"
      ) {
        state = step.state;
        paint();
        await wait(BOT_ACT_MS);
      } else if (step.action.type === "askRaise") {
        state = step.state;
        paint(t("botRaise"));
        shell.journal.add({ week: state.week, who: "bot", text: t("botRaise") });
        await wait(BOT_ACT_MS);
      } else if (step.action.type === "endWeek") {
        const bot = getBotPlayer(step.state);
        state = step.state;
        if (bot?.lastNotice === "zwolnienie" || bot?.lastNotice === "redukcja") {
          shell.journal.add({ week: state.week, who: "bot", text: `${t("botFired")}: ${noticeTitle(bot.lastNotice)}` });
        }

        if (bot?.lastEvent !== null && bot?.lastEvent !== undefined) {
          shell.journal.add({
            week: state.week,
            who: "bot",
            text: eventMessage(bot.lastEvent),
            art: eventArtUrl(bot.lastEvent),
          });
        }
        for (const effect of state.lastWeekEffects) {
          if (effect.kind === "shopPrices") {
            shell.journal.add({ week: state.week, who: "city", text: effectLine(effect) });
          }
        }
        paint(t("botEnds"));
        await wait(BOT_END_MS);
      }
      await maybeRivalCard();
    }
  }

  async function runBotTurn(): Promise<void> {
    busy = true;
    paint(t("botPlaying"));
    if (shell !== null) {
      shell.skip.hidden = false;
    }
    const trace = playBotWithTrace(state);
    await replayBot(trace.steps);
    setFastForward(false);
    if (shell !== null) {
      shell.skip.hidden = true;
    }
    busy = false;
    lastError = null;
    commit(trace.state, t("botPlayed"));
    checkVictory();
  }

  async function applyEndWeek(): Promise<void> {
    if (!humanTurn() || shell === null) {
      return;
    }
    const result = dispatch(state, { type: "endWeek" });
    if (!result.ok) {
      lastError = result.error;
      sfx("error");
      paint();
      return;
    }
    lastError = null;
    sfx("endWeek");
    busy = true;
    state = result.state;
    persist(state);
    paint(t("weekEnded"));

    const human = getHumanPlayer(state);
    const week = state.week;
    for (const line of humanEffects(state.lastWeekEffects)) {
      shell.journal.add({ week, who: "you", text: line });
    }
    if (human?.lastEvent !== null && human?.lastEvent !== undefined) {
      shell.journal.add({
        week,
        who: "you",
        text: eventMessage(human.lastEvent),
        art: eventArtUrl(human.lastEvent),
      });
      await showEventCard(human.lastEvent, "you", weekendFoot(state.lastWeekEffects));
    }
    if (human?.lastNotice !== null && human?.lastNotice !== undefined) {
      await showNoticeCard(human.lastNotice, "you");
    }

    busy = false;
    shell.panel.setOpen(false);
    if (checkVictory()) {
      paint();
      return;
    }
    if (isHumanTurn(state)) {
      commit(state, t("turnYours"));
      return;
    }
    await runBotTurn();
  }

  function startOver(): void {
    if (store !== null) {
      clearSave(store);
    }
    persistFailed = false;
    lastError = null;
    busy = false;
    state = createSetup();
    mountSetup();
  }

  function buildShell(): Shell {
    const top = buildTopBar();
    const board = buildBoard();
    const stats = buildStats();
    const needs = buildNeeds();
    const goal = buildGoalLine();
    const rival = buildRivalRow();
    const work = buildWorkCard();
    const panel = buildPanel({
      onAct: applyAct,
      onApply: (job) => {
        void applyForJob(job);
      },
      onRaise: () => {
        void askForRaise();
      },
      onEnroll: enrollIn,
      onRelocate: (home) => {
        void relocateTo(home);
      },
      onBuy: (item, used) => tradeItem({ type: "buyItem", item, used }),
      onSell: (item) => tradeItem({ type: "sellItem", item }),
      onRepair: (item) => tradeItem({ type: "repairItem", item }),
      onBank: bankAction,
      onEndWeek: () => {
        void applyEndWeek();
      },
    });
    const journal = buildJournal();

    const status = el("p", "status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const skip = el("button", "btn-quiet skip");
    skip.type = "button";
    skip.textContent = t("botSkip");
    skip.hidden = true;
    skip.addEventListener("click", () => {
      setFastForward(true);
    });
    const statusRow = el("div", "status-row");
    statusRow.append(status, skip);
    const strip = el("div", "strip");
    strip.append(goal.root, statusRow);

    const newGame = el("button", "btn-quiet");
    newGame.type = "button";
    newGame.textContent = t("newGame");
    const tools = el("footer", "tools");
    const note = el("span");
    note.textContent = t("saveLocal");
    tools.append(note, newGame);

    const side = el("div", "side");
    const sideRow = el("div", "side-row");
    sideRow.append(work.root, needs.root);
    side.append(stats.root, rival.root, sideRow);

    const rootNode = el("div", "game");
    rootNode.append(top.root, strip, board.root, side, panel.root, journal.root, tools);
    return { root: rootNode, top, board, stats, needs, goal, rival, work, panel, journal, status, skip, newGame };
  }

  function mountPlay(fresh = false): void {
    observer?.disconnect();
    shell = buildShell();
    root.replaceChildren(shell.root);

    for (const [id, tile] of shell.board.tiles) {
      tile.addEventListener("click", () => {
        void applyMove(id);
      });
    }
    shell.newGame.addEventListener("click", startOver);
    shell.root.addEventListener("pointerdown", unlockAudio, { passive: true });

    observer = new ResizeObserver(() => {
      if (shell !== null) {
        shell.board.relayout();
        shell.board.place(state);
      }
    });
    observer.observe(shell.board.root);
    persist(state);
    shell.board.relayout();
    paint();
    if (checkVictory()) {
      return;
    }
    if (fresh && !howToSeen(store)) {
      busy = true;
      paint();
      void showHowToCard().then(() => {
        markHowToSeen(store);
        busy = false;
        paint();
      });
      return;
    }
    if (!isHumanTurn(state) && state.phase === "playing") {
      void runBotTurn();
      return;
    }
    // Wznowienie w trakcie tury: zaległa karta z pracy człowieka, potem gra.
    void showHumanNotice();
  }

  function mountSetup(): void {
    observer?.disconnect();
    shell = null;
    lastError = null;
    busy = false;

    const loaded = store === null ? { status: "unavailable" as const } : loadSave(store);
    let notice: "corrupt" | "unavailable" | "outdated" | null = null;
    if (store === null) {
      notice = "unavailable";
    } else if (loaded.status === "corrupt") {
      clearSave(store);
      notice = "corrupt";
    } else if (loaded.status === "outdated") {
      clearSave(store);
      notice = "outdated";
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
      notice,
      onStart: (choice) => {
        unlockAudio();
        const started = dispatch(createSetup(Date.now() % 100_000 || 1), {
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
        mountPlay(true);
      },
    };
    if (loaded.status === "ok") {
      const resume = loaded.state;
      handlers.onContinue = () => {
        unlockAudio();
        state = resume;
        lastError = null;
        mountPlay();
      };
    }
    root.replaceChildren(buildSetup(handlers));
  }

  mountSetup();
}
