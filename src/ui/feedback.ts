import { el } from "./dom";
import { prefersReducedMotion } from "./motion";

const RISE_MS = 900;

/**
 * Wypuszcza przyrost nad element, który się zmienił („+15”, „-250 zł”).
 * Dzięki temu skutek kliknięcia widać w miejscu, na które gracz patrzy.
 */
export function floatChange(anchor: HTMLElement, text: string, tone: "up" | "down"): void {
  if (prefersReducedMotion()) {
    return;
  }
  const box = anchor.getBoundingClientRect();
  if (box.width === 0) {
    return;
  }
  const node = el("span", tone === "up" ? "float-change float-up" : "float-change float-down");
  node.textContent = text;
  node.setAttribute("aria-hidden", "true");
  node.style.left = `${Math.round(box.left + box.width / 2)}px`;
  node.style.top = `${Math.round(box.top)}px`;
  document.body.append(node);
  window.setTimeout(() => node.remove(), RISE_MS);
}
