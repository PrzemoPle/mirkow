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
import { artImg, raiseIconUrl } from "./art";
import { blockReason, companyName, jobName, jobRequirements } from "./copy";
import { el } from "./dom";
import { buildBoardHeading } from "./heading";
import { firstUpper, formatZl, interpolate } from "./format";

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

/**
 * Oferta jako kartka przypięta do tablicy, nie wiersz tabeli.
 * Papier, pinezka, płaca przybita pieczątką: to samo, co gracz widzi w PUP.
 */
/** Wielkość kartki bierze się z rangi posady: fucha to świstek, dyrektor to urzędowe ogłoszenie. */
function slipSize(prestige: number): "s" | "m" | "l" {
  if (prestige <= 10) {
    return "s";
  }
  return prestige > 40 ? "l" : "m";
}

/**
 * Oferta jako kartka przypięta do tablicy. Kartki mają różną wielkość i krzywo wiszą
 * w dwóch kolumnach, bo tablica ogłoszeń nie jest listą wierszy.
 */
function buildOfferSlip(state: GameState, def: JobDef, reason: string | null, mine: boolean, enabled: boolean, index: number): HTMLButtonElement {
  const size = slipSize(def.prestige);
  const slip = el("button", `offer offer-${size}${mine ? " offer-mine" : ""}`);
  slip.type = "button";
  slip.dataset.job = def.id;
  slip.disabled = !enabled;
  // Stały, nielosowy przechył i przesunięcie: kartki wiszą krzywo, ale zawsze tak samo.
  const tilt = [-1.7, 1.2, -0.6, 2.1, -1.1, 0.8][index % 6] ?? 0;
  slip.style.setProperty("--tilt", `${tilt}deg`);
  slip.style.setProperty("--shift", `${[0, 6, -4, 3, -7, 2][index % 6] ?? 0}px`);

  const pin = el("span", "offer-pin");
  pin.setAttribute("aria-hidden", "true");

  const title = el("span", "offer-title");
  title.textContent = firstUpper(jobName(def.id));
  const company = el("span", "offer-company");
  company.textContent = companyName(def.company);

  const wage = el("span", "offer-wage");
  wage.textContent = formatZl(wageNow(state, def));

  const terms = el("span", "offer-terms");
  if (reason !== null && !mine) {
    terms.classList.add("offer-blocked");
    terms.textContent = reason;
  } else {
    terms.textContent = [...jobRequirements(def), interpolate("workPrestige", { n: def.prestige })].join(" · ");
  }

  slip.append(pin, title, company, wage, terms);
  if (mine) {
    const mark = el("span", "offer-mark");
    mark.textContent = t("jobYours");
    slip.append(mark);
  }
  return slip;
}

/** Tablica ofert w PUP: wszystkie stanowiska z powodem blokady plus podwyżka. */
export function buildJobsBoard(handlers: JobsBoardHandlers): JobsBoard {
  const root = el("div", "jobs");
  const head = buildBoardHeading("jobsTitle", "jobsHint");
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

  const list = el("div", "cork");
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

  root.append(head, raise, list);

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
      let index = 0;
      for (const [, defs] of jobsByCompany()) {
        for (const def of defs) {
          const mine = player.job?.id === def.id;
          const block = humanTurn && !mine ? jobBlock(state, def.id) : null;
          const reason = block === null ? null : blockReason(block);
          list.append(buildOfferSlip(state, def, reason, mine, humanTurn && block === null && !mine, index));
          index += 1;
        }
      }
      const current = player.job === null ? null : getJobDef(player.job.id);
      root.classList.toggle("jobs-employed", current !== null);
    },
  };
}
