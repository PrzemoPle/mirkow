import type { LocationId } from "./catalog";
import type { CompanyId, DiplomaId, JobId } from "./types";

export const WORK_TIME = 3;
export const RELIABILITY_PER_SHIFT = 4;
export const RELIABILITY_DECAY = 3;
export const FIRE_MARGIN = 10;
export const RAISE_TENURE_BONUS = 8;
export const RAISE_RELIABILITY_MARGIN = 10;
export const RAISE_PERCENT = 0.1;
export const RAISE_MAX = 2;
export const APPLY_TIME = 2;
export const RAISE_TIME = 1;
export const HIRE_HAPPINESS = 3;
export const LOKAL_BUYIN = 1800;
export const LOKAL_OPEN_TIME = 2;


export const companyIds = ["kebab", "shop", "bank", "pup", "depot"] as const satisfies readonly CompanyId[];

export type CompanyDef = {
  id: CompanyId;
  locationId: LocationId;
};

export const COMPANY_DEFS: Record<CompanyId, CompanyDef> = {
  kebab: { id: "kebab", locationId: "kebab" },
  shop: { id: "shop", locationId: "shop" },
  bank: { id: "bank", locationId: "bank" },
  pup: { id: "pup", locationId: "pup" },
  depot: { id: "depot", locationId: "zajezdnia" },
};

export type JobDef = {
  id: JobId;
  company: CompanyId;
  wage: number;
  prestige: number;
  requiredExperience: number;
  requiredReliability: number;
  requiredDiplomas: readonly DiplomaId[];
  requiresSuit: boolean;
  /** Stanowisko nie do wzięcia w PUP (własny lokal otwiera się w Nocnej Bule). */
  hiddenInPup: boolean;
};

const base = {
  requiredExperience: 0,
  requiredReliability: 0,
  requiredDiplomas: [] as readonly DiplomaId[],
  requiresSuit: false,
  hiddenInPup: false,
};

export const JOB_DEFS: Record<JobId, JobDef> = {
  kebabPomoc: { ...base, id: "kebabPomoc", company: "kebab", wage: 220, prestige: 5 },
  kebabKasjer: { ...base, id: "kebabKasjer", company: "kebab", wage: 280, prestige: 12, requiredExperience: 4, requiredReliability: 20 },
  kebabKierownik: { ...base, id: "kebabKierownik", company: "kebab", wage: 420, prestige: 30, requiredExperience: 12, requiredReliability: 40, requiredDiplomas: ["kurs"] },
  kebabLokal: { ...base, id: "kebabLokal", company: "kebab", wage: 620, prestige: 70, requiredExperience: 16, requiredReliability: 40, requiredDiplomas: ["kurs"], hiddenInPup: true },
  shopPolki: { ...base, id: "shopPolki", company: "shop", wage: 240, prestige: 8, requiredReliability: 10 },
  shopKasjer: { ...base, id: "shopKasjer", company: "shop", wage: 300, prestige: 15, requiredExperience: 6, requiredReliability: 25 },
  shopKierownik: { ...base, id: "shopKierownik", company: "shop", wage: 480, prestige: 40, requiredExperience: 16, requiredReliability: 50, requiredDiplomas: ["zarzadzanie"], requiresSuit: true },
  bankKasjer: { ...base, id: "bankKasjer", company: "bank", wage: 380, prestige: 25, requiredExperience: 8, requiredReliability: 40, requiredDiplomas: ["matura"], requiresSuit: true },
  bankDoradca: { ...base, id: "bankDoradca", company: "bank", wage: 560, prestige: 50, requiredExperience: 20, requiredReliability: 55, requiredDiplomas: ["ekonomia"], requiresSuit: true },
  bankDyrektor: { ...base, id: "bankDyrektor", company: "bank", wage: 800, prestige: 80, requiredExperience: 36, requiredReliability: 70, requiredDiplomas: ["ekonomia", "magister"], requiresSuit: true },
  pupReferent: { ...base, id: "pupReferent", company: "pup", wage: 340, prestige: 20, requiredExperience: 4, requiredReliability: 35, requiredDiplomas: ["matura"], requiresSuit: true },
  pupNaczelnik: { ...base, id: "pupNaczelnik", company: "pup", wage: 620, prestige: 60, requiredExperience: 24, requiredReliability: 60, requiredDiplomas: ["administracja"], requiresSuit: true },
  depotMonter: { ...base, id: "depotMonter", company: "depot", wage: 320, prestige: 15, requiredExperience: 2, requiredReliability: 20 },
  depotBrygadzista: { ...base, id: "depotBrygadzista", company: "depot", wage: 500, prestige: 45, requiredExperience: 14, requiredReliability: 45, requiredDiplomas: ["kurs"] },
  depotInzynier: { ...base, id: "depotInzynier", company: "depot", wage: 700, prestige: 65, requiredExperience: 20, requiredReliability: 55, requiredDiplomas: ["inzynieria"] },
  depotDyrektor: { ...base, id: "depotDyrektor", company: "depot", wage: 950, prestige: 100, requiredExperience: 40, requiredReliability: 75, requiredDiplomas: ["inzynieria", "magister"], requiresSuit: true },
};

export const jobIds = Object.keys(JOB_DEFS) as readonly JobId[];

export function getJobDef(id: JobId): JobDef {
  const def = JOB_DEFS[id];
  if (def === undefined) {
    throw new Error(`Missing job ${id}`);
  }
  return def;
}

export function isJobId(value: string): value is JobId {
  return Object.hasOwn(JOB_DEFS, value);
}

export function jobLocation(id: JobId): LocationId {
  return COMPANY_DEFS[getJobDef(id).company].locationId;
}

/** Stanowiska w kolejności prestiżu, pogrupowane firmami, do listy w PUP. */
export function jobsByCompany(): ReadonlyMap<CompanyId, readonly JobDef[]> {
  const map = new Map<CompanyId, JobDef[]>();
  for (const company of companyIds) {
    map.set(company, []);
  }
  for (const id of jobIds) {
    const def = getJobDef(id);
    if (def.hiddenInPup) {
      continue;
    }
    map.get(def.company)?.push(def);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.prestige - b.prestige);
  }
  return map;
}
