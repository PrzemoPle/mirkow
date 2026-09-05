import {
  avatarColor,
  avatarIds,
  avatarName,
  DEFAULT_GOALS,
  type AvatarId,
  type Stats,
} from "../game";
import { t } from "../i18n";
import { artImg, avatarArtUrl, stampArtUrl } from "./art";
import { el } from "./dom";
import { formatZl, interpolate } from "./format";

export type SetupChoice = {
  name: string;
  avatarId: AvatarId;
  goals: Stats;
};

export type SetupNotice = "corrupt" | "unavailable" | null;

export type SavedMatch = {
  week: number;
  name: string;
};

export type SetupHandlers = {
  onStart: (choice: SetupChoice) => void;
  onContinue?: () => void;
  saved?: SavedMatch | null;
  notice?: SetupNotice;
};

const goalSliders = [
  {
    field: "money" as const,
    key: "statMoney" as const,
    min: 2000,
    max: 15000,
    step: 500,
    money: true,
  },
  {
    field: "happiness" as const,
    key: "statHappiness" as const,
    min: 20,
    max: 100,
    step: 5,
    money: false,
  },
  {
    field: "education" as const,
    key: "statEducation" as const,
    min: 20,
    max: 100,
    step: 5,
    money: false,
  },
  {
    field: "career" as const,
    key: "statCareer" as const,
    min: 20,
    max: 100,
    step: 5,
    money: false,
  },
];

function displayGoal(value: number, money: boolean): string {
  return money ? formatZl(value) : String(value);
}

export function buildSetup(handlers: SetupHandlers): HTMLElement {
  let avatarId: AvatarId = "ola";
  let nameTouched = false;
  const goals: Stats = { ...DEFAULT_GOALS };
  const saved = handlers.saved ?? null;

  const root = el("div", "setup");
  const titleRow = el("div", "title-row");
  const title = el("h1", "title");
  title.textContent = t("appTitle");
  const city = el("span", "title-city");
  city.textContent = t("cityName");
  const titleCopy = el("div", "title-copy");
  titleCopy.append(title, city);
  titleRow.append(artImg(stampArtUrl(), "city-stamp"), titleCopy);
  const lead = el("p", "setup-lead");
  lead.textContent = t("setupLead");
  const vs = el("p", "setup-vs");
  vs.textContent = t("setupVs");
  root.append(titleRow, lead, vs);

  if (handlers.notice === "corrupt") {
    const notice = el("p", "setup-notice");
    notice.setAttribute("role", "status");
    notice.textContent = t("saveCorrupt");
    root.append(notice);
  } else if (handlers.notice === "unavailable") {
    const notice = el("p", "setup-notice");
    notice.setAttribute("role", "status");
    notice.textContent = t("saveUnavailable");
    root.append(notice);
  }

  if (saved !== null && handlers.onContinue !== undefined) {
    const card = el("div", "setup-save");
    const who = el("p", "setup-save-who");
    who.textContent = interpolate("setupSavedAs", { name: saved.name });
    const cont = el("button", "btn-end btn-end-urgent");
    cont.type = "button";
    cont.textContent = interpolate("setupContinue", { n: saved.week });
    cont.addEventListener("click", () => {
      handlers.onContinue?.();
    });
    card.append(who, cont);
    root.append(card);
  }

  const goalsTitle = el("h2", "setup-heading");
  goalsTitle.textContent = t("setupGoals");
  const goalList = el("div", "setup-goals");

  for (const slider of goalSliders) {
    const row = el("label", "setup-goal");
    const caption = el("span", "setup-goal-label");
    caption.textContent = t(slider.key);
    const value = el("span", "setup-goal-value");
    value.textContent = displayGoal(goals[slider.field], slider.money);
    const input = el("input");
    input.type = "range";
    input.min = String(slider.min);
    input.max = String(slider.max);
    input.step = String(slider.step);
    input.value = String(goals[slider.field]);
    input.setAttribute("aria-label", t(slider.key));
    input.addEventListener("input", () => {
      const next = Number(input.value);
      goals[slider.field] = next;
      value.textContent = displayGoal(next, slider.money);
    });
    row.append(caption, value, input);
    goalList.append(row);
  }

  const avatarTitle = el("h2", "setup-heading");
  avatarTitle.textContent = t("setupAvatar");
  const look = el("p", "setup-look");
  look.textContent = t("setupLook");
  const tokens = el("div", "setup-avatars");
  tokens.setAttribute("role", "group");
  tokens.setAttribute("aria-label", t("setupAvatar"));

  const nameLabel = el("label", "setup-name");
  const nameCaption = el("span", "setup-name-label");
  nameCaption.textContent = t("setupName");
  const nameInput = el("input");
  nameInput.type = "text";
  nameInput.maxLength = 16;
  nameInput.value = avatarName(avatarId);
  nameInput.setAttribute("aria-label", t("setupName"));
  nameInput.addEventListener("input", () => {
    nameTouched = true;
  });
  nameLabel.append(nameCaption, nameInput);

  const buttons = new Map<AvatarId, HTMLButtonElement>();

  function syncTokens(): void {
    for (const id of avatarIds) {
      const button = buttons.get(id);
      if (button === undefined) {
        continue;
      }
      const selected = id === avatarId;
      button.classList.toggle("avatar-btn-on", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    }
    if (!nameTouched) {
      nameInput.value = avatarName(avatarId);
    }
  }

  for (const id of avatarIds) {
    const button = el("button", "avatar-btn");
    button.type = "button";
    button.style.setProperty("--avatar", avatarColor(id));
    button.setAttribute("aria-label", avatarName(id));
    button.classList.add(`portrait-${id}`);
    const token = el("span", "avatar-token");
    token.append(artImg(avatarArtUrl(id), "avatar-bitmap"));
    const caption = el("span", "avatar-name");
    caption.textContent = avatarName(id);
    button.append(token, caption);
    button.addEventListener("click", () => {
      avatarId = id;
      syncTokens();
    });
    buttons.set(id, button);
    tokens.append(button);
  }

  const start = el("button", saved !== null ? "btn-end" : "btn-end btn-start");
  start.type = "button";
  start.textContent = saved !== null ? t("setupStartNew") : t("setupStart");
  start.addEventListener("click", () => {
    const trimmed = nameInput.value.trim();
    handlers.onStart({
      avatarId,
      name: trimmed === "" ? avatarName(avatarId) : trimmed,
      goals: { ...goals },
    });
  });

  const install = el("p", "setup-install");
  install.textContent = t("installHint");

  root.append(
    goalsTitle,
    goalList,
    avatarTitle,
    look,
    tokens,
    nameLabel,
    start,
    install,
  );
  syncTokens();
  return root;
}
