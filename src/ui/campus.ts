import {
  classesDone,
  diplomaIds,
  enrollBlock,
  examChance,
  getDiplomaDef,
  hasDiploma,
  jobIds,
  getJobDef,
  recentClasses,
  type DiplomaId,
  type GameState,
  type Player,
} from "../game";
import { t } from "../i18n";
import { artImg, diplomaArtUrl } from "./art";
import { blockReason, diplomaName, jobName } from "./copy";
import { el } from "./dom";
import { buildBoardHeading } from "./heading";
import { interpolate } from "./format";

export type CampusHandlers = {
  onEnroll(diploma: DiplomaId): void;
};

export type CampusBoard = {
  root: HTMLElement;
  sync(state: GameState, player: Player, humanTurn: boolean): void;
};

function unlocks(diploma: DiplomaId): string {
  const names = jobIds
    .map((id) => getJobDef(id))
    .filter((def) => def.requiredDiplomas.includes(diploma))
    .map((def) => jobName(def.id));
  return names.length === 0 ? "" : interpolate("campusUnlocks", { jobs: names.join(", ") });
}

/** Indeks w WSMiK: siedem dyplomów z postępem, szansą zdania i tym, co otwierają. */
export function buildCampusBoard(handlers: CampusHandlers): CampusBoard {
  const root = el("div", "jobs campus");
  const head = buildBoardHeading("campusTitle", "campusHint");
  const list = el("div", "index-page");
  list.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const button = target.closest("[data-diploma]");
    if (!(button instanceof HTMLButtonElement) || button.disabled) {
      return;
    }
    const diploma = button.dataset.diploma;
    if (diploma !== undefined) {
      handlers.onEnroll(diploma as DiplomaId);
    }
  });
  root.append(head, list);

  return {
    root,
    sync(state, player, humanTurn) {
      list.replaceChildren();
      for (const id of diplomaIds) {
        const def = getDiplomaDef(id);
        const done = hasDiploma(player, id);
        const studying = player.studying === id;
        const have = classesDone(player, id);
        const block = humanTurn && !done && !studying ? enrollBlock(state, id) : null;

        // Wpis w indeksie: kierunek po lewej, pieczątka po prawej, kropki między nimi.
        const entry = el("button", "entry-line");
        entry.type = "button";
        entry.dataset.diploma = id;
        entry.disabled = !humanTurn || done || studying || block !== null;
        entry.classList.toggle("entry-done", done);
        entry.classList.toggle("entry-open", studying);

        entry.append(artImg(diplomaArtUrl(id), "entry-seal", "diploma"));

        const name = el("span", "entry-name");
        name.textContent = diplomaName(id);
        entry.append(name);

        const note = el("span", "entry-note");
        if (block !== null) {
          note.classList.add("entry-locked");
          note.textContent = blockReason(block);
        } else if (done) {
          note.textContent = interpolate("campusPoints", { n: def.points });
        } else if (studying) {
          note.textContent = `${interpolate("campusChance", { n: Math.round(examChance(player, id, state.week) * 100) })} · ${interpolate("campusRecent", { n: recentClasses(player, id, state.week) })}`;
        } else {
          const opens = unlocks(id);
          note.textContent = [interpolate("campusClassCost", { money: def.classCost, time: def.classTime }), opens].filter((part) => part !== "").join(" · ");
        }
        entry.append(note);

        const stamp = el("span", "entry-stamp");
        if (done) {
          stamp.classList.add("entry-stamp-done");
          stamp.textContent = t("campusDone");
        } else if (studying) {
          stamp.classList.add("entry-stamp-open");
          stamp.textContent = interpolate("campusProgress", { have, needed: def.classes });
        } else {
          stamp.classList.add("entry-stamp-empty");
          stamp.textContent = t("actEnroll");
        }
        entry.append(stamp);

        list.append(entry);
      }
    },
  };
}
