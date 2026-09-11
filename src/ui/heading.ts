import { t, type MessageKey } from "../i18n";
import { el } from "./dom";

let counter = 0;

/**
 * Nagłówek listy z regułami schowanymi pod „i”. Reguły są dostępne dla kogoś,
 * kto ich szuka, i nie zajmują ekranu komuś, kto zna grę.
 */
export function buildBoardHeading(titleKey: MessageKey, hintKey: MessageKey): HTMLElement {
  counter += 1;
  const hintId = `hint-${counter}`;

  const root = el("div", "board-head");
  const row = el("div", "board-head-row");
  const title = el("h3", "acts-title");
  title.textContent = t(titleKey);

  const toggle = el("button", "hint-toggle");
  toggle.type = "button";
  toggle.textContent = "i";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", hintId);
  toggle.setAttribute("aria-label", t("hintLabel"));
  toggle.title = t("hintLabel");

  const hint = el("p", "jobs-hint");
  hint.id = hintId;
  hint.textContent = t(hintKey);
  hint.hidden = true;

  let open = false;
  toggle.addEventListener("click", () => {
    open = !open;
    hint.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.classList.toggle("hint-open", open);
  });

  row.append(title, toggle);
  root.append(row, hint);
  return root;
}
