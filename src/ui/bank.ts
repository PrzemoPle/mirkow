import {
  ACCOUNT_STEP,
  actionBlockFor,
  loanInstallment,
  loanLimit,
  LOAN_STEP,
  shiftWage,
  STOCK_LOT,
  wealth,
  type GameAction,
  type GameState,
  type Player,
} from "../game";
import { t } from "../i18n";
import { accountIconUrl, artImg, loanIconUrl, stocksIconUrl } from "./art";
import { blockReason } from "./copy";
import { el, svgEl } from "./dom";
import { formatZl, interpolate } from "./format";

export type BankHandlers = {
  onBank(action: GameAction): void;
};

export type BankBoard = {
  root: HTMLElement;
  sync(state: GameState, player: Player, humanTurn: boolean): void;
};

function button(label: string, action: GameAction, state: GameState, humanTurn: boolean, handlers: BankHandlers): HTMLButtonElement {
  const node = el("button", "btn bank-btn");
  node.type = "button";
  const block = humanTurn ? actionBlockFor(state, action) : null;
  node.disabled = !humanTurn || block !== null;
  node.textContent = label;
  if (block !== null) {
    node.title = blockReason(block);
  }
  node.addEventListener("click", () => handlers.onBank(action));
  return node;
}

function sparkline(history: readonly number[]): SVGSVGElement {
  const width = 160;
  const height = 40;
  const svg = svgEl("svg");
  svg.setAttribute("class", "spark");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("aria-hidden", "true");
  if (history.length < 2) {
    return svg;
  }
  const min = Math.min(...history);
  const max = Math.max(...history);
  const span = max - min || 1;
  const points = history.map((value, index) => {
    const x = (index / (history.length - 1)) * (width - 4) + 2;
    const y = height - 3 - ((value - min) / span) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = svgEl("polyline");
  line.setAttribute("points", points.join(" "));
  line.setAttribute("class", "spark-line");
  svg.append(line);
  const last = points[points.length - 1]?.split(",");
  if (last !== undefined) {
    const dot = svgEl("circle");
    dot.setAttribute("cx", last[0] ?? "0");
    dot.setAttribute("cy", last[1] ?? "0");
    dot.setAttribute("r", "2.5");
    dot.setAttribute("class", "spark-dot");
    svg.append(dot);
  }
  return svg;
}

function section(icon: string, title: string): { root: HTMLElement; body: HTMLElement } {
  const root = el("div", "bank-section");
  const head = el("div", "jobs-company");
  head.append(artImg(icon, "pix", "icon"));
  const name = el("span");
  name.textContent = title;
  head.append(name);
  const body = el("div", "bank-body");
  root.append(head, body);
  return { root, body };
}

/** Nasza Kasa: konto, kredyt i akcje MZT z wykresem. */
export function buildBankBoard(handlers: BankHandlers): BankBoard {
  const root = el("div", "jobs bank-board");
  const title = el("h3", "acts-title");
  title.textContent = t("bankTitle");
  const hint = el("p", "jobs-hint");
  hint.textContent = t("bankHint");
  const wealthLine = el("p", "bank-wealth");
  const account = section(accountIconUrl(), t("bankAccount"));
  const loan = section(loanIconUrl(), t("bankLoan"));
  const stocks = section(stocksIconUrl(), t("bankStocks"));
  root.append(title, hint, wealthLine, account.root, loan.root, stocks.root);

  return {
    root,
    sync(state, player, humanTurn) {
      wealthLine.textContent = `${interpolate("bankWealth", { n: wealth(player, state.stockPrice) })} · ${interpolate("bankCash", { n: player.stats.money })}`;

      account.body.replaceChildren();
      const balance = el("p", "bank-line");
      balance.textContent = interpolate("bankAccountBalance", { n: player.account });
      const accountRow = el("div", "bank-actions");
      for (const amount of [ACCOUNT_STEP, ACCOUNT_STEP * 5]) {
        accountRow.append(button(`${t("actDepositCash")} ${formatZl(amount)}`, { type: "account", amount }, state, humanTurn, handlers));
      }
      const all = Math.floor(player.stats.money / ACCOUNT_STEP) * ACCOUNT_STEP;
      if (all > ACCOUNT_STEP * 5) {
        accountRow.append(button(`${t("actDepositCash")} ${formatZl(all)}`, { type: "account", amount: all }, state, humanTurn, handlers));
      }
      for (const amount of [ACCOUNT_STEP, ACCOUNT_STEP * 5]) {
        accountRow.append(button(`${t("actWithdrawCash")} ${formatZl(amount)}`, { type: "account", amount: -amount }, state, humanTurn, handlers));
      }
      if (player.account > ACCOUNT_STEP * 5) {
        accountRow.append(button(`${t("actWithdrawCash")} ${formatZl(player.account)}`, { type: "account", amount: -player.account }, state, humanTurn, handlers));
      }
      account.body.append(balance, accountRow);

      loan.body.replaceChildren();
      const loanLine = el("p", "bank-line");
      const loanRow = el("div", "bank-actions");
      if (player.loan === null) {
        const limit = loanLimit(shiftWage(state, player));
        loanLine.textContent = `${t("bankLoanNone")} · ${interpolate("bankLoanLimit", { n: limit })}`;
        const amounts = [...new Set([LOAN_STEP, LOAN_STEP * 2, limit])].filter((amount) => amount <= limit).sort((a, b) => a - b);
        for (const amount of amounts) {
          loanRow.append(button(`${t("actTakeLoan")} ${formatZl(amount)}`, { type: "loan", amount }, state, humanTurn, handlers));
        }
      } else {
        const rate = loanInstallment(player.loan);
        loanLine.textContent = interpolate("bankLoanState", { n: player.loan.principal, rate });
        if (player.loan.missed > 0) {
          loanLine.textContent += ` · ${interpolate("bankLoanMissed", { n: player.loan.missed })}`;
          loanLine.classList.add("act-reason");
        }
        loanRow.append(button(`${t("actRepayLoan")} ${formatZl(LOAN_STEP)}`, { type: "loan", amount: -LOAN_STEP }, state, humanTurn, handlers));
        if (player.loan.principal > LOAN_STEP) {
          loanRow.append(button(`${t("actRepayLoan")} ${formatZl(player.loan.principal)}`, { type: "loan", amount: -player.loan.principal }, state, humanTurn, handlers));
        }
      }
      loan.body.append(loanLine, loanRow);

      stocks.body.replaceChildren();
      const stockLine = el("p", "bank-line");
      stockLine.textContent = `${interpolate("bankStockPrice", { n: state.stockPrice })} · ${interpolate("bankShares", { n: player.shares, value: player.shares * state.stockPrice })}`;
      const stockRow = el("div", "bank-actions");
      stockRow.append(button(`${t("actBuyShares")} (${formatZl(STOCK_LOT * state.stockPrice)})`, { type: "trade", shares: STOCK_LOT }, state, humanTurn, handlers));
      stockRow.append(button(t("actSellShares"), { type: "trade", shares: -STOCK_LOT }, state, humanTurn, handlers));
      if (player.shares > STOCK_LOT) {
        stockRow.append(button(t("actSellAllShares"), { type: "trade", shares: -player.shares }, state, humanTurn, handlers));
      }
      stocks.body.append(stockLine, sparkline(state.stockHistory), stockRow);
    },
  };
}
