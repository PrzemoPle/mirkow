import { prefersReducedMotion } from "./motion";

const DURATION_MS = 420;
const running = new WeakMap<HTMLElement, number>();

/**
 * Przewija liczbę do nowej wartości zamiast podmieniać ją w miejscu.
 * Gracz widzi, że jego kliknięcie coś zmieniło, bez czytania paska statusu.
 */
export function countTo(node: HTMLElement, from: number, to: number, format: (value: number) => string): void {
  const previous = running.get(node);
  if (previous !== undefined) {
    window.cancelAnimationFrame(previous);
    running.delete(node);
  }
  if (from === to || prefersReducedMotion()) {
    node.textContent = format(to);
    return;
  }
  const started = performance.now();
  const step = (now: number): void => {
    const progress = Math.min(1, (now - started) / DURATION_MS);
    const eased = 1 - (1 - progress) ** 3;
    node.textContent = format(Math.round(from + (to - from) * eased));
    if (progress < 1) {
      running.set(node, window.requestAnimationFrame(step));
      return;
    }
    running.delete(node);
  };
  running.set(node, window.requestAnimationFrame(step));
}
