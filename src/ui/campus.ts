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
  const title = el("p", "acts-title");
  title.textContent = t("campusTitle");
  const hint = el("p", "jobs-hint");
  hint.textContent = t("campusHint");
  const list = el("div", "jobs-list");
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
  root.append(title, hint, list);

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

        const row = el("button", "act job-row diploma-row");
        row.type = "button";
        row.dataset.diploma = id;
        row.disabled = !humanTurn || done || studying || block !== null;
        row.classList.toggle("job-mine", studying);
        row.classList.toggle("diploma-done", done);

        row.append(artImg(diplomaArtUrl(id), "act-icon pix", "diploma"));
        const name = el("span", "act-name");
        name.textContent = diplomaName(id);
        if (done || studying) {
          const tag = el("span", done ? "plaque job-tag" : "plaque plaque-accent job-tag");
          tag.textContent = done ? t("campusDone") : t("campusStudying");
          name.append(" ", tag);
        }

        const meta = el("span", "act-meta");
        if (block !== null) {
          const why = el("span", "act-reason");
          why.textContent = blockReason(block);
          meta.append(why);
        } else if (!done) {
          const progress = el("span");
          progress.textContent = interpolate("campusProgress", { have, needed: def.classes });
          meta.append(progress);
          if (studying) {
            const chance = el("span", "act-reason");
            chance.textContent = `${interpolate("campusChance", { n: Math.round(examChance(player, id, state.week) * 100) })} · ${interpolate("campusRecent", { n: recentClasses(player, id, state.week) })}`;
            meta.append(chance);
          }
          const cost = el("span");
          cost.textContent = interpolate("campusClassCost", { money: def.classCost, time: def.classTime });
          meta.append(cost);
        }
        const opens = unlocks(id);
        if (opens !== "") {
          const chip = el("span", "diploma-unlocks");
          chip.textContent = opens;
          meta.append(chip);
        }

        const cost = el("span", "act-cost");
        const points = el("span", "act-money act-money-plus");
        points.textContent = interpolate("campusPoints", { n: def.points });
        cost.append(points);
        if (!done && !studying && block === null) {
          const enroll = el("span", "ticket");
          enroll.textContent = t("actEnroll");
          cost.append(enroll);
        }
        row.append(name, meta, cost);
        list.append(row);
      }
    },
  };
}
