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

/** Karta pracy w HUD: stanowisko, płaca, solidność z minimum, staż. */
export function buildWorkCard(): WorkCard {
  const root = el("section", "work");
  root.setAttribute("aria-label", t("workLabel"));

  const head = el("div", "work-head");
  const icon = artImg(workIconUrl("kebab"), "work-icon pix", "icon");
  const title = el("div", "work-title");
  const jobLine = el("span", "work-job");
  const companyLine = el("span", "work-company");
  title.append(jobLine, companyLine);
  const wage = el("span", "work-wage");
  head.append(icon, title, wage);

  const meters = el("div", "work-meters");
  const reliabilityRow = el("div", "work-meter");
  const reliabilityLabel = el("span", "work-meter-label");
  reliabilityLabel.append(artImg(hudIconUrl("reliability"), "pix", "icon"));
  const reliabilityCaption = el("span");
  reliabilityCaption.textContent = t("reliabilityLabel");
  reliabilityLabel.append(reliabilityCaption);
  const reliabilityValue = el("span", "work-meter-value");
  const bar = el("div", "rel-bar");
  const fill = el("span", "rel-fill");
  const marker = el("span", "rel-min");
  bar.append(fill, marker);
  reliabilityRow.append(reliabilityLabel, reliabilityValue, bar);

  const experienceRow = el("div", "work-meter work-meter-inline");
  const experienceLabel = el("span", "work-meter-label");
  experienceLabel.append(artImg(hudIconUrl("experience"), "pix", "icon"));
  const experienceCaption = el("span");
  experienceCaption.textContent = t("experienceLabel");
  experienceLabel.append(experienceCaption);
  const experienceValue = el("span", "work-meter-value");
  experienceRow.append(experienceLabel, experienceValue);

  meters.append(reliabilityRow, experienceRow);

  const foot = el("p", "work-foot");
  const warning = el("p", "work-warning");
  warning.hidden = true;
  warning.textContent = t("reliabilityWarning");

  root.append(head, meters, foot, warning);

  return {
    root,
    sync(state, player) {
      const job = player.job;
      if (job === null) {
        root.classList.add("work-none");
        jobLine.textContent = t("jobNoneShort");
        companyLine.textContent = t("workNone");
        wage.textContent = "";
        icon.src = hudIconUrl("need-job");
        reliabilityValue.textContent = String(player.reliability);
        fill.style.width = `${player.reliability}%`;
        marker.hidden = true;
        experienceValue.textContent = interpolate("experienceShifts", { n: player.experience });
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
      reliabilityValue.textContent = `${player.reliability} · ${interpolate("reliabilityMin", { n: min })}`;
      fill.style.width = `${player.reliability}%`;
      marker.hidden = false;
      marker.style.left = `${min}%`;
      const danger = player.reliability < min;
      const critical = player.reliability - RELIABILITY_DECAY < min - FIRE_MARGIN;
      root.classList.toggle("work-danger", danger);
      warning.hidden = !critical;
      experienceValue.textContent = interpolate("experienceShifts", { n: player.experience });
      foot.textContent = `${interpolate("workPrestige", { n: def.prestige })} · ${interpolate("tenureLabel", { n: job.weeks })} · ${interpolate("raisesLabel", { n: job.raises, max: RAISE_MAX })}`;
    },
  };
}
