export function advanceRng(seed: number): { value: number; seed: number } {
  let t = (Math.trunc(seed) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const nextSeed = t >>> 0;
  const value = ((nextSeed ^ (nextSeed >>> 14)) >>> 0) / 4294967296;
  return { value, seed: nextSeed };
}
