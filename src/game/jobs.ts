import type { JobId } from "./types";

export const WORK_KEBAB_TIME = 4;
export const WORK_KEBAB_WAGE = 280;
export const WORK_KEBAB_CAREER = 4;
export const KIEROWNIK_WAGE = 420;
export const KIEROWNIK_CAREER = 8;
export const KIEROWNIK_EDU = 18;
export const KIEROWNIK_WEEKS = 4;
export const KIEROWNIK_PROMOTE_TIME = 2;
export const KIEROWNIK_PROMOTE_CAREER = 6;
export const LOKAL_WAGE = 620;
export const LOKAL_CAREER = 12;
export const LOKAL_EDU = 36;
export const LOKAL_WEEKS = 4;
export const LOKAL_BUYIN = 1800;
export const LOKAL_OPEN_TIME = 2;
export const LOKAL_OPEN_CAREER = 10;

export const KEBAB_JOBS = [
  "kebabKasjer",
  "kebabKierownik",
  "kebabLokal",
] as const satisfies readonly JobId[];

export type JobDef = {
  id: JobId;
  wage: number;
  career: number;
  timeCost: number;
};

export const JOB_DEFS: Record<JobId, JobDef> = {
  kebabKasjer: {
    id: "kebabKasjer",
    wage: WORK_KEBAB_WAGE,
    career: WORK_KEBAB_CAREER,
    timeCost: WORK_KEBAB_TIME,
  },
  kebabKierownik: {
    id: "kebabKierownik",
    wage: KIEROWNIK_WAGE,
    career: KIEROWNIK_CAREER,
    timeCost: WORK_KEBAB_TIME,
  },
  kebabLokal: {
    id: "kebabLokal",
    wage: LOKAL_WAGE,
    career: LOKAL_CAREER,
    timeCost: WORK_KEBAB_TIME,
  },
};

export function getJobDef(id: JobId): JobDef {
  const def = JOB_DEFS[id];
  if (def === undefined) {
    throw new Error(`Missing job ${id}`);
  }
  return def;
}

export function isKebabJob(id: JobId): boolean {
  return KEBAB_JOBS.includes(id);
}
