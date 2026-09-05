import {
  getJobDef,
  jobBlock,
  jobsByCompany,
  raiseBlock,
  shiftWage,
  wageMultiplier,
  type GameState,
  type JobDef,
  type JobId,
  type Player,
} from "../game";
import { t } from "../i18n";
import { applyIconUrl, artImg, raiseIconUrl, workIconUrl } from "./art";
import { blockReason, companyName, jobName, jobRequirements } from "./copy";
import { el } from "./dom";
import { formatZl, interpolate } from "./format";

export type JobsBoardHandlers = {
  onApply(job: JobId): void;
  onRaise(): void;
};

export type JobsBoard = {
  root: HTMLElement;
  sync(state: GameState, player: Player, humanTurn: boolean): void;
};

function wageNow(state: GameState, def: JobDef): number {
  return Math.round((def.wage * wageMultiplier(state.economy.phase)) / 10) * 10;
}

function buildJobRow(state: GameState, def: JobDef, reason: string | null, mine: boolean, enabled: boolean): HTMLButtonElement {
  const row = el("button", mine ? "act job-row job-mine" : "act job-row");
  row.type = "button";
  row.dataset.job = def.id;
  row.disabled = !enabled;

  row.append(artImg(applyIconUrl(), "act-icon pix", "icon"));
  const name = el("span", "act-name");
  name.textContent = jobName(def.id);
  if (mine) {
    const tag = el("span", "plaque plaque-accent job-tag");
    tag.textContent = t("jobYours");
    name.append(" ", tag);
  }
  const meta = el("span", "act-meta");
  if (reason !== null && !mine) {
    const why = el("span", "act-reason");
    why.textContent = reason;
    meta.append(why);
  } else {
    for (const chip of jobRequirements(def)) {
      const node = el("span");
      node.textContent = chip;
      meta.append(node);
    }
  }
  const cost = el("span", "act-cost");
  const money = el("span", "act-money act-money-plus");
  money.textContent = `+${formatZl(wageNow(state, def))}`;
  const prestige = el("span", "ticket");
  prestige.textContent = interpolate("workPrestige", { n: def.prestige });
  cost.append(money, prestige);
  row.append(name, meta, cost);
  return row;
}

/** Tablica ofert w PUP: wszystkie stanowiska z powodem blokady plus podwyżka. */
export function buildJobsBoard(handlers: JobsBoardHandlers): JobsBoard {
  const root = el("div", "jobs");
  const title = el("p", "acts-title");
  title.textContent = t("jobsTitle");
  const hint = el("p", "jobs-hint");
  hint.textContent = t("jobsHint");
  const raise = el("button", "act");
  raise.type = "button";
  raise.append(artImg(raiseIconUrl(), "act-icon pix", "icon"));
  const raiseName = el("span", "act-name");
  raiseName.textContent = t("actRaise");
  const raiseMeta = el("span", "act-meta");
  const raiseCost = el("span", "act-cost");
  const raiseTime = el("span", "ticket");
  raiseTime.textContent = interpolate("timeCost", { n: 1 });
  raiseCost.append(raiseTime);
  raise.append(raiseName, raiseMeta, raiseCost);
  raise.addEventListener("click", () => handlers.onRaise());

  const list = el("div", "jobs-list");
  list.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const button = target.closest("[data-job]");
    if (!(button instanceof HTMLButtonElement) || button.disabled) {
      return;
    }
    const job = button.dataset.job;
    if (job !== undefined) {
      handlers.onApply(job as JobId);
    }
  });

  root.append(title, hint, raise, list);

  return {
    root,
    sync(state, player, humanTurn) {
      raise.hidden = player.job === null;
      if (player.job !== null) {
        const block = humanTurn ? raiseBlock(state) : null;
        raise.disabled = !humanTurn || block !== null;
        raiseMeta.replaceChildren();
        const line = el("span", block === null ? "" : "act-reason");
        line.textContent = block === null
          ? `+10%: ${formatZl(Math.round((shiftWage(state, player) * 1.1) / 10) * 10)}`
          : blockReason(block);
        raiseMeta.append(line);
      }

      list.replaceChildren();
      for (const [company, defs] of jobsByCompany()) {
        const group = el("div", "jobs-group");
        const head = el("div", "jobs-company");
        head.append(artImg(workIconUrl(company), "pix", "icon"));
        const name = el("span");
        name.textContent = companyName(company);
        head.append(name);
        if (state.economy.hiringFrozen === company) {
          const frozen = el("span", "plaque jobs-frozen");
          frozen.textContent = t("blockHiringFrozen");
          head.append(frozen);
        }
        group.append(head);
        for (const def of defs) {
          const mine = player.job?.id === def.id;
          const block = humanTurn && !mine ? jobBlock(state, def.id) : null;
          const reason = block === null ? null : blockReason(block);
          group.append(buildJobRow(state, def, reason, mine, humanTurn && block === null && !mine));
        }
        list.append(group);
      }
      const current = player.job === null ? null : getJobDef(player.job.id);
      root.classList.toggle("jobs-employed", current !== null);
    },
  };
}
