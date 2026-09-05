import type { DiplomaId, Player } from "./types";

export const CLASS_TIME = 3;
export const MAGISTER_CLASS_TIME = 4;
export const EXAM_TIME = 2;
export const EXAM_FEE = 80;
/** Szansa bazowa i premia za każde zajęcia z ostatnich czterech tygodni. */
export const EXAM_BASE_CHANCE = 0.4;
export const EXAM_RECENT_BONUS = 0.1;
export const EXAM_RECENT_WEEKS = 4;
export const EXAM_FAIL_HAPPINESS = 3;
export const FIRST_DIPLOMA_HAPPINESS = 5;
export const DIPLOMA_HAPPINESS = 2;

export const diplomaIds = [
  "kurs",
  "matura",
  "zarzadzanie",
  "ekonomia",
  "administracja",
  "inzynieria",
  "magister",
] as const satisfies readonly DiplomaId[];

export type DiplomaDef = {
  id: DiplomaId;
  /** Warunek: jeden z wymienionych dyplomów (pusta lista = brak). */
  prerequisiteAny: readonly DiplomaId[];
  classes: number;
  classCost: number;
  classTime: number;
  points: number;
};

export const LICENCJATY: readonly DiplomaId[] = ["zarzadzanie", "ekonomia", "administracja", "inzynieria"];

export const DIPLOMA_DEFS: Record<DiplomaId, DiplomaDef> = {
  kurs: { id: "kurs", prerequisiteAny: [], classes: 4, classCost: 120, classTime: CLASS_TIME, points: 10 },
  matura: { id: "matura", prerequisiteAny: [], classes: 6, classCost: 100, classTime: CLASS_TIME, points: 15 },
  zarzadzanie: { id: "zarzadzanie", prerequisiteAny: ["matura"], classes: 8, classCost: 250, classTime: CLASS_TIME, points: 20 },
  ekonomia: { id: "ekonomia", prerequisiteAny: ["matura"], classes: 8, classCost: 250, classTime: CLASS_TIME, points: 20 },
  administracja: { id: "administracja", prerequisiteAny: ["matura"], classes: 8, classCost: 250, classTime: CLASS_TIME, points: 20 },
  inzynieria: { id: "inzynieria", prerequisiteAny: ["matura"], classes: 10, classCost: 300, classTime: CLASS_TIME, points: 25 },
  magister: { id: "magister", prerequisiteAny: LICENCJATY, classes: 10, classCost: 400, classTime: MAGISTER_CLASS_TIME, points: 30 },
};

export function getDiplomaDef(id: DiplomaId): DiplomaDef {
  const def = DIPLOMA_DEFS[id];
  if (def === undefined) {
    throw new Error(`Missing diploma ${id}`);
  }
  return def;
}

export function isDiplomaId(value: string): value is DiplomaId {
  return Object.hasOwn(DIPLOMA_DEFS, value);
}

export function hasDiploma(player: Player, id: DiplomaId): boolean {
  return player.diplomas.includes(id);
}

export function prerequisiteMet(player: Player, id: DiplomaId): boolean {
  const def = getDiplomaDef(id);
  return def.prerequisiteAny.length === 0 || def.prerequisiteAny.some((need) => hasDiploma(player, need));
}

export function classesDone(player: Player, id: DiplomaId): number {
  return player.studies[id]?.classes ?? 0;
}

/** Zajęcia z ostatnich czterech tygodni: to one dają szansę na egzaminie. */
export function recentClasses(player: Player, id: DiplomaId, week: number): number {
  const log = player.studies[id]?.log ?? [];
  return log.filter((attended) => week - attended < EXAM_RECENT_WEEKS).length;
}

export function examChance(player: Player, id: DiplomaId, week: number): number {
  return Math.min(1, EXAM_BASE_CHANCE + EXAM_RECENT_BONUS * recentClasses(player, id, week));
}

export function educationPoints(diplomas: readonly DiplomaId[]): number {
  return diplomas.reduce((sum, id) => sum + getDiplomaDef(id).points, 0);
}
