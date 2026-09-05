import { advanceRng } from "./rng";
import type { EconomyPhase, Loan, Player } from "./types";

export const BANK_TIME = 1;
/** Kredyt: limit jako wielokrotność płacy za zmianę, oprocentowanie za 4 tygodnie, rata co 4 tygodnie. */
export const LOAN_WAGE_MULTIPLE = 6;
export const LOAN_MIN = 500;
export const LOAN_STEP = 500;
export const LOAN_INTEREST = 0.04;
export const LOAN_INSTALLMENT_SHARE = 0.25;
export const LOAN_MISSED_LIMIT = 2;
/** Komornik: zabiera przedmiot, a gdy nic nie ma, część gotówki. */
export const BAILIFF_CASH_SHARE = 0.2;
/** Akcje MZT: kurs startowy i dryf zależny od koniunktury. */
export const STOCK_START_PRICE = 50;
export const STOCK_LOT = 10;
export const STOCK_HISTORY = 12;
export const STOCK_MIN_PRICE = 5;
/** Kieszonkowiec: procent gotówki i sufit. */
export const PICKPOCKET_SHARE = 0.1;
export const PICKPOCKET_MAX = 300;
export const ACCOUNT_STEP = 100;

export function loanLimit(shiftWage: number): number {
  return Math.max(LOAN_MIN, Math.floor((shiftWage * LOAN_WAGE_MULTIPLE) / LOAN_STEP) * LOAN_STEP);
}

/** Rata: ćwierć kapitału plus odsetki, zaokrąglona do 10 zł. */
export function loanInstallment(loan: Loan): number {
  const raw = loan.principal * LOAN_INSTALLMENT_SHARE + loan.principal * LOAN_INTEREST;
  return Math.min(loan.principal + Math.round(loan.principal * LOAN_INTEREST), Math.round(raw / 10) * 10);
}

export function stockDrift(phase: EconomyPhase): { min: number; max: number } {
  switch (phase) {
    case "boom":
      return { min: 0.05, max: 0.15 };
    case "recession":
      return { min: -0.15, max: -0.05 };
    case "normal":
      return { min: -0.08, max: 0.08 };
  }
}

export function rollStockPrice(price: number, phase: EconomyPhase, seed: number): { price: number; seed: number } {
  const roll = advanceRng(seed);
  const drift = stockDrift(phase);
  const change = drift.min + roll.value * (drift.max - drift.min);
  const next = Math.max(STOCK_MIN_PRICE, Math.round(price * (1 + change)));
  return { price: next, seed: roll.seed };
}

/** Majątek do progu „pieniądze”: gotówka, konto, lokata i akcje po kursie, minus kredyt. */
export function wealth(player: Player, stockPrice: number): number {
  return (
    player.stats.money +
    player.account +
    (player.deposit?.amount ?? 0) +
    player.shares * stockPrice -
    (player.loan?.principal ?? 0)
  );
}
