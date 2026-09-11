import {
  FIRE_MARGIN,
  getJobDef,
  RAISE_MAX,
  RELIABILITY_DECAY,
  shiftWage,
  type GameState,
  type Player,
} from "../game";
import { t } from "../i18n";
import { artImg, hudIconUrl, workIconUrl } from "./art";
import { companyName, jobName } from "./copy";
import { el } from "./dom";
import { firstUpper, interpolate } from "./format";

export type WorkCard = {
  root: HTMLElement;
  sync(state: GameState, player: Player): void;
};

/**
 * Karta pracy: w spoczynku jedna linijka i pasek solidności, bo tyle wystarczy,
 * żeby wiedzieć, czy grozi zwolnienie. Liczby stażu i prestiżu po rozwinięciu.
 */
export function buildWorkCard(): WorkCard {
  const root = el("section", "work");
  root.setAttribute("aria-label", t("workLabel"));

  const details = el("details", "work-details");
  const summary = el("summary", "work-summary");
  const icon = artImg(workIconUrl("kebab"), "work-icon pix", "icon");
  const title = el("span", "work-title");
  const jobLine = el("span", "work-job");
  const companyLine = el("span", "work-company");
  title.append(jobLine, companyLine);
  const wage = el("span", "work-wage");

  const bar = el("div", "rel-bar");
  bar.setAttribute("role", "meter");
  bar.setAttribute("aria-label", t("reliabilityLabel"));
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", "100");
  const fill = el("span", "rel-fill");
  const marker = el("span", "rel-min");
  bar.append(fill, marker);
  summary.append(icon, title, wage, bar);

  const body = el("div", "work-body");
  const reliabilityLine = el("p", "work-line");
  const experienceLine = el("p", "work-line");
  const foot = el("p", "work-foot");
  body.append(reliabilityLine, experienceLine, foot);
  details.append(summary, body);

  const warning = el("p", "work-warning");
  warning.hidden = true;
  warning.textContent = t("reliabilityWarning");

  root.append(details, warning);

  return {
    root,
    sync(state, player) {
      const job = player.job;
      experienceLine.textContent = `${t("experienceLabel")}: ${interpolate("experienceShifts", { n: player.experience })}`;

      if (job === null) {
        root.classList.add("work-none");
        jobLine.textContent = t("jobNoneShort");
        companyLine.textContent = t("workNone");
        wage.textContent = "";
        icon.src = hudIconUrl("need-job");
        fill.style.width = `${player.reliability}%`;
        marker.hidden = true;
        bar.setAttribute("aria-valuenow", String(player.reliability));
        reliabilityLine.textContent = `${t("reliabilityLabel")}: ${player.reliability}`;
        foot.textContent = "";
        warning.hidden = true;
        return;
      }

      const def = getJobDef(job.id);
      root.classList.remove("work-none");
      jobLine.textContent = firstUpper(jobName(job.id));
      companyLine.textContent = companyName(def.company);
      wage.textContent = interpolate("workWage", { n: shiftWage(state, player) });
      const src = workIconUrl(def.company);
      if (!icon.src.endsWith(src.slice(1))) {
        icon.src = src;
      }
      const min = def.requiredReliability;
      fill.style.width = `${player.reliability}%`;
      marker.hidden = false;
      marker.style.left = `${min}%`;
      bar.setAttribute("aria-valuenow", String(player.reliability));
      reliabilityLine.textContent = `${t("reliabilityLabel")}: ${player.reliability} · ${interpolate("reliabilityMin", { n: min })}`;
      const danger = player.reliability < min;
      const critical = player.reliability - RELIABILITY_DECAY < min - FIRE_MARGIN;
      root.classList.toggle("work-danger", danger);
      warning.hidden = !critical;
      foot.textContent = `${interpolate("workPrestige", { n: def.prestige })} · ${interpolate("tenureLabel", { n: job.weeks })} · ${interpolate("raisesLabel", { n: job.raises, max: RAISE_MAX })}`;
    },
  };
}
