import { avatarColor, type AvatarId, type EventId, type GameState, type NoticeId, type Player } from "../game";
import { t } from "../i18n";
import { artImg, eventArtUrl, instructionArtUrl, noticeArtUrl, rivalMoodUrl, stampArtUrl, stampWinUrl, weekendArtUrl, type RivalMood, type WeekendArtId } from "./art";
import { eventEffect, eventTitle, noticeEffect, noticeTitle } from "./copy";
import { el } from "./dom";
import { formatZl, interpolate } from "./format";
import { prefersReducedMotion, wait } from "./motion";
import { sfx } from "./audio";

const EVENT_AUTO_CLOSE_MS = 5200;
const RIVAL_AUTO_CLOSE_MS = 2600;

type Overlay = {
  node: HTMLElement;
  /** Zdejmuje overlay, odblokowuje tło i oddaje focus tam, skąd przyszedł. */
  close(): void;
};

/**
 * Modal z prawdziwą pułapką focusu: reszta strony dostaje `inert`, więc Tab, klik
 * i czytnik ekranu nie sięgają pod przyciemnienie. Escape zamyka; Enter działa
 * natywnie na przycisku, który ma focus.
 */
function mountOverlay(content: HTMLElement, label: string, onEscape?: () => void): Overlay {
  const overlay = el("div", "overlay");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", label);
  overlay.append(content);
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const blocked = [...document.body.children].filter((child): child is HTMLElement => child instanceof HTMLElement && !child.inert);
  for (const child of blocked) {
    child.inert = true;
  }
  document.body.append(overlay);
  const focusables = (): HTMLElement[] =>
    [...overlay.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter(
      (node) => !node.hasAttribute("disabled"),
    );
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && onEscape !== undefined) {
      event.preventDefault();
      onEscape();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }
    // Zawijanie Tab w oknie: przy jednym przycisku przeglądarka wypuściłaby focus na body.
    const items = focusables();
    const first = items[0];
    const last = items[items.length - 1];
    if (first === undefined || last === undefined) {
      event.preventDefault();
      return;
    }
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !overlay.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !overlay.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };
  document.addEventListener("keydown", onKey);
  let closed = false;
  return {
    node: overlay,
    close() {
      if (closed) {
        return;
      }
      closed = true;
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      for (const child of blocked) {
        child.inert = false;
      }
      if (previous !== null && previous.isConnected) {
        previous.focus({ preventScroll: true });
      }
    },
  };
}

type CardInput = {
  art: string;
  who: string;
  title: string;
  effect: string;
  /** Linijka weekendu pod efektem eventu, z winietą. */
  foot?: { text: string; art: WeekendArtId };
};

/** Pokazuje kartę eventu w pełnym kadrze i czeka na zamknięcie (klik albo czas). */
export function showEventCard(id: EventId, who: "you" | "bot", foot?: { text: string; art: WeekendArtId }): Promise<void> {
  return showCard({
    art: eventArtUrl(id),
    who: who === "you" ? t("eventYours") : t("eventBots"),
    title: eventTitle(id),
    effect: eventEffect(id),
    ...(foot !== undefined ? { foot } : {}),
  });
}

/** Karta zdarzenia z pracy: zwolnienie, redukcja, podwyżka, awans. */
export function showNoticeCard(id: NoticeId, who: "you" | "bot"): Promise<void> {
  return showCard({
    art: noticeArtUrl(id),
    who: who === "you" ? t("eventYours") : t("eventBots"),
    title: noticeTitle(id),
    effect: noticeEffect(id),
  });
}

function showCard(input: CardInput): Promise<void> {
  return new Promise((resolve) => {
    const card = el("div", "card");
    card.append(artImg(input.art, "card-art", "card"));
    const band = el("div", "card-band");
    const whoLine = el("span", "card-who");
    whoLine.textContent = input.who;
    const title = el("h2", "card-title");
    title.textContent = input.title;
    const effect = el("p", "card-effect");
    effect.textContent = input.effect;
    const close = el("button", "btn card-close");
    close.type = "button";
    close.textContent = t("eventClose");
    band.append(whoLine, title, effect);
    if (input.foot !== undefined) {
      const foot = el("div", "card-foot");
      foot.append(artImg(weekendArtUrl(input.foot.art), "card-foot-art"));
      const copy = el("p", "card-foot-copy");
      const label = el("span", "card-foot-label");
      label.textContent = t("weekendLabel");
      copy.append(label, document.createTextNode(` ${input.foot.text}`));
      foot.append(copy);
      band.append(foot);
    }
    band.append(close);
    card.append(band);

    let done = false;
    const finish = (): void => {
      if (done) {
        return;
      }
      done = true;
      overlay.close();
      resolve();
    };
    const overlay = mountOverlay(card, input.title, finish);
    sfx("card");
    overlay.node.addEventListener("click", finish);
    close.focus();
    if (!prefersReducedMotion()) {
      // Timer zamyka kartę sam, ale wskazanie myszą albo focus w karcie go zatrzymują (gra jest turowa, nic nie goni).
      let armed = true;
      const disarm = (): void => {
        armed = false;
      };
      card.addEventListener("pointerenter", disarm);
      card.addEventListener("focusin", disarm);
      void wait(EVENT_AUTO_CLOSE_MS).then(() => {
        if (armed) {
          finish();
        }
      });
    }
  });
}

type VictoryInput = {
  state: GameState;
  winner: Player;
  human: Player;
  onNewGame: () => void;
};

function statRow(label: string, value: string, goal: string): HTMLElement {
  const row = el("li", "victory-stat");
  const name = el("span");
  name.textContent = label;
  const num = el("b");
  num.textContent = value;
  const target = el("small");
  target.textContent = ` ${interpolate("victoryGoal", { n: goal })}`;
  num.append(target);
  row.append(name, num);
  return row;
}

export function showVictory(input: VictoryInput): void {
  const { state, winner, human } = input;
  const won = winner.id === human.id;
  const panel = el("div", "victory");

  const face = el("div", "victory-face");
  face.style.setProperty("--avatar", avatarColor(winner.avatarId as AvatarId));
  face.append(artImg(rivalMoodUrl(winner.avatarId as AvatarId, won ? "neutral" : "happy"), ""));
  const stamp = el("span", won ? "victory-stamp" : "victory-stamp victory-stamp-lose");
  stamp.textContent = won ? t("victoryWin") : t("victoryLose");
  if (won) {
    face.append(artImg(stampWinUrl(), "victory-laurel"));
  }
  face.append(stamp);

  const copy = el("div", "victory-copy");
  const title = el("h2", "victory-title");
  title.textContent = interpolate("victoryNamed", { name: winner.name });
  const weeks = el("p", "victory-weeks");
  weeks.textContent = interpolate("victoryWeeks", { n: state.week });
  const stats = el("ul", "victory-stats");
  stats.append(
    statRow(t("statMoney"), formatZl(winner.stats.money), formatZl(state.goals.money)),
    statRow(t("statHappiness"), String(winner.stats.happiness), String(state.goals.happiness)),
    statRow(t("statEducation"), String(winner.stats.education), String(state.goals.education)),
    statRow(t("statCareer"), String(winner.stats.career), String(state.goals.career)),
  );
  const again = el("button", "btn btn-primary");
  again.type = "button";
  again.textContent = t("newGame");
  copy.append(title, weeks, stats, again);
  panel.append(face, copy);

  const overlay = mountOverlay(panel, title.textContent);
  sfx(won ? "victory" : "defeat");
  again.addEventListener("click", () => {
    overlay.close();
    input.onNewGame();
  });
  again.focus();
}

/** Jednorazowa karta zasad na start partii. Zamyka ją tylko przycisk. */
export function showHowToCard(): Promise<void> {
  return new Promise((resolve) => {
    const panel = el("div", "howto");
    panel.append(artImg(instructionArtUrl(), "howto-art"));
    const head = el("div", "howto-head");
    head.append(artImg(stampArtUrl(), "howto-stamp"));
    const title = el("h2", "howto-title");
    title.textContent = t("howtoTitle");
    head.append(title);
    const list = el("ol", "howto-list");
    for (const key of ["howtoTime", "howtoJob", "howtoNeeds", "howtoWin"] as const) {
      const item = el("li");
      item.textContent = t(key);
      list.append(item);
    }
    const go = el("button", "btn btn-primary");
    go.type = "button";
    go.textContent = t("howtoGo");
    panel.append(head, list, go);
    let done = false;
    const finish = (): void => {
      if (done) {
        return;
      }
      done = true;
      overlay.close();
      resolve();
    };
    const overlay = mountOverlay(panel, t("howtoTitle"), finish);
    go.addEventListener("click", finish);
    go.focus();
  });
}

/** Krótka karta Kowalskiego z miną: awans, zwolnienie, oblany egzamin. Zamyka się sama. */
export function showRivalCard(rival: Player, mood: RivalMood, text: string): Promise<void> {
  return new Promise((resolve) => {
    const card = el("div", "rival-card");
    const face = el("div", "rival-card-face");
    face.style.setProperty("--avatar", avatarColor(rival.avatarId as AvatarId));
    face.append(artImg(rivalMoodUrl(rival.avatarId as AvatarId, mood), ""));
    const copy = el("div", "rival-card-copy");
    const who = el("span", "card-who");
    who.textContent = t("eventBots");
    const line = el("p", "rival-card-text");
    line.textContent = text;
    copy.append(who, line);
    card.append(face, copy);
    let done = false;
    const finish = (): void => {
      if (done) {
        return;
      }
      done = true;
      overlay.close();
      resolve();
    };
    const overlay = mountOverlay(card, text, finish);
    overlay.node.classList.add("overlay-light");
    sfx("ui");
    overlay.node.addEventListener("click", finish);
    void wait(RIVAL_AUTO_CLOSE_MS).then(finish);
  });
}
