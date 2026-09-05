import { t } from "../i18n";
import { el } from "./dom";

export type JournalWho = "you" | "bot" | "city";

export type JournalEntry = {
  week: number;
  who: JournalWho;
  text: string;
  art?: string;
};

const JOURNAL_LIMIT = 40;

export type Journal = {
  root: HTMLElement;
  add(entry: JournalEntry): void;
  reset(): void;
};

function whoLabel(who: JournalWho): string {
  switch (who) {
    case "you":
      return t("journalYou");
    case "bot":
      return t("botOnTile");
    case "city":
      return t("journalCity");
  }
}

export function buildJournal(): Journal {
  const root = el("section", "journal");
  root.setAttribute("aria-label", t("journalTitle"));
  const title = el("h2", "journal-title");
  title.textContent = t("journalTitle");
  const list = el("ol", "journal-list");
  list.setAttribute("aria-live", "polite");
  const empty = el("li", "entry entry-empty");
  empty.textContent = t("journalEmpty");
  list.append(empty);
  root.append(title, list);

  let entries: JournalEntry[] = [];

  function render(): void {
    list.replaceChildren();
    if (entries.length === 0) {
      list.append(empty);
      return;
    }
    entries.forEach((entry, index) => {
      const item = el("li", index === 0 ? "entry entry-new" : "entry");
      const week = el("span", "entry-week");
      week.textContent = `${t("weekShort").replace("{n}", String(entry.week))}`;
      const who = el("span", entry.who === "bot" ? "plaque entry-who entry-who-bot" : "plaque entry-who");
      who.textContent = whoLabel(entry.who);
      const text = el("span", "entry-text");
      if (entry.art !== undefined) {
        const art = el("img", "entry-art");
        art.src = entry.art;
        art.alt = "";
        text.append(art);
      }
      const copy = el("span");
      copy.textContent = entry.text;
      text.append(copy);
      item.append(week, who, text);
      list.append(item);
    });
  }

  return {
    root,
    add(entry) {
      entries = [entry, ...entries].slice(0, JOURNAL_LIMIT);
      render();
    },
    reset() {
      entries = [];
      render();
    },
  };
}
