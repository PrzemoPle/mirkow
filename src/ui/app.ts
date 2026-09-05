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
  type GameState,
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
import { actedMessage, actionLabel, companyName, effectLine, eventMessage, jobName, noticeTitle } from "./copy";
import { el } from "./dom";
import { errorMessage } from "./errors";
import { interpolate } from "./format";
import { buildNeeds, buildStats, buildTopBar } from "./hud";
import { buildJournal } from "./journal";
import { setFastForward, wait } from "./motion";
import { showEventCard, showNoticeCard, showVictory } from "./overlays";
import { buildPanel } from "./panel";
import { buildSetup, type SetupHandlers } from "./setup";
import { buildWorkCard } from "./work";

const BOT_ACT_MS = 520;
const BOT_END_MS = 300;

type Shell = {
  root: HTMLElement;
  top: ReturnType<typeof buildTopBar>;
  board: ReturnType<typeof buildBoard>;
  stats: ReturnType<typeof buildStats>;
  needs: ReturnType<typeof buildNeeds>;
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
    shell.work.sync(state, player);
    shell.panel.sync({ ...state, timeLeft: shownTime }, player, turn);
    shell.board.syncTiles({ ...state, timeLeft: shownTime }, player, turn);
    shell.board.place(state);
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
      paint();
      return;
    }
    lastError = null;
    busy = true;
    state = result.state;
    persist(state);
    shell.top.sync(state, state.timeLeft, t("turnYours"));
    shell.board.syncTiles(state, getHumanPlayer(state) ?? player, false);
    await shell.board.travel("human", state, player.locationId, to);
    busy = false;
    paint(`${t(locationName(to))}.`);
  }

  async function applyForJob(job: JobId): Promise<void> {
    if (!humanTurn() || shell === null) {
      return;
    }
    const result = dispatch(state, { type: "apply", job });
    if (!result.ok) {
      lastError = result.error;
      paint();
      return;
    }
    lastError = null;
    const def = getJobDef(job);
    const line = interpolate("actedApply", { job: jobName(job), company: companyName(def.company) });
    shell.journal.add({ week: state.week, who: "you", text: line });
    commit(result.state, line);
    await showHumanNotice();
    checkVictory();
  }

  async function askForRaise(): Promise<void> {
    if (!humanTurn() || shell === null) {
      return;
    }
    const result = dispatch(state, { type: "askRaise" });
    if (!result.ok) {
      lastError = result.error;
      paint();
      return;
    }
    lastError = null;
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
      paint();
      return;
    }
    lastError = null;
    commit(result.state, actedMessage(id, resolved.wage));
    checkVictory();
  }

  async function replayBot(steps: readonly BotStep[]): Promise<void> {
    if (shell === null) {
      return;
    }
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
      paint();
      return;
    }
    lastError = null;
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
      await showEventCard(human.lastEvent, "you");
    }
    if (human?.lastNotice !== null && human?.lastNotice !== undefined) {
      await showNoticeCard(human.lastNotice, "you");
    }

    busy = false;
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
    const work = buildWorkCard();
    const panel = buildPanel({
      onAct: applyAct,
      onApply: (job) => {
        void applyForJob(job);
      },
      onRaise: () => {
        void askForRaise();
      },
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

    const newGame = el("button", "btn-quiet");
    newGame.type = "button";
    newGame.textContent = t("newGame");
    const tools = el("footer", "tools");
    const note = el("span");
    note.textContent = t("saveLocal");
    tools.append(note, newGame);

    const side = el("div", "side");
    side.append(stats.root, work.root, needs.root, statusRow);

    const rootNode = el("div", "game");
    rootNode.append(top.root, board.root, side, panel.root, journal.root, tools);
    return { root: rootNode, top, board, stats, needs, work, panel, journal, status, skip, newGame };
  }

  function mountPlay(): void {
    observer?.disconnect();
    shell = buildShell();
    root.replaceChildren(shell.root);

    for (const [id, tile] of shell.board.tiles) {
      tile.addEventListener("click", () => {
        void applyMove(id);
      });
    }
    shell.newGame.addEventListener("click", startOver);

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
    if (!isHumanTurn(state) && state.phase === "playing") {
      void runBotTurn();
    }
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
    root.replaceChildren(buildSetup(handlers));
  }

  mountSetup();
}
