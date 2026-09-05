import { t, type MessageKey } from "../i18n";

const zloty = new Intl.NumberFormat("pl-PL");

export function formatZl(value: number): string {
  return `${zloty.format(value)} zł`;
}

export function formatRatio(current: number, goal: number): string {
  return `${zloty.format(current)} / ${zloty.format(goal)}`;
}

export function meterPercent(current: number, goal: number): number {
  if (goal <= 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.max(0, Math.min(100, (current / goal) * 100));
}

export function interpolate(
  key: MessageKey,
  vars: Record<string, string | number>,
): string {
  return t(key).replace(/\{(\w+)\}/g, (_full, name: string) => {
    const value = vars[name];
    if (value === undefined) {
      return `{${name}}`;
    }
    return String(value);
  });
}

export function needTone(weeks: number): "needOk" | "needLow" {
  return weeks > 0 ? "needOk" : "needLow";
}
