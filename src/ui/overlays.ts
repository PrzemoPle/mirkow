import { avatarColor, type AvatarId, type EventId, type GameState, type NoticeId, type Player } from "../game";
import { t } from "../i18n";
import { artImg, avatarArtUrl, eventArtUrl, noticeArtUrl, stampWinUrl } from "./art";
import { eventEffect, eventTitle, noticeEffect, noticeTitle } from "./copy";
import { el } from "./dom";
import { formatZl, interpolate } from "./format";
import { wait } from "./motion";

const EVENT_AUTO_CLOSE_MS = 3200;

function mountOverlay(content: HTMLElement, label: string): HTMLElement {
  const overlay = el("div", "overlay");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", label);
  overlay.append(content);
  document.body.append(overlay);
  return overlay;
}

type CardInput = {
  art: string;
  who: string;
  title: string;
  effect: string;
};

/** Pokazuje kartę eventu w pełnym kadrze i czeka na zamknięcie (klik albo czas). */
export function showEventCard(id: EventId, who: "you" | "bot"): Promise<void> {
  return showCard({
    art: eventArtUrl(id),
    who: who === "you" ? t("eventYours") : t("eventBots"),
    title: eventTitle(id),
    effect: eventEffect(id),
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
    band.append(whoLine, title, effect, close);
    card.append(band);

    const overlay = mountOverlay(card, input.title);
    let done = false;
    const finish = (): void => {
      if (done) {
        return;
      }
      done = true;
      overlay.remove();
      document.removeEventListener("keydown", onKey);
      resolve();
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape" || event.key === "Enter") {
        finish();
      }
    };
    document.addEventListener("keydown", onKey);
    overlay.addEventListener("click", finish);
    close.focus();
    void wait(EVENT_AUTO_CLOSE_MS).then(finish);
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
  face.append(artImg(avatarArtUrl(winner.avatarId), ""));
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
  again.addEventListener("click", () => {
    overlay.remove();
    input.onNewGame();
  });
  again.focus();
}
