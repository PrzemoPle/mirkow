import {
  avatarColor,
  avatarIds,
  avatarName,
  DEFAULT_GOALS,
  type AvatarId,
  type Stats,
} from "../game";
import { t, type MessageKey } from "../i18n";
import { artImg, avatarArtUrl, panoramaUrl, stampArtUrl } from "./art";
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

type PresetId = "short" | "normal" | "long";

const presets: readonly { id: PresetId; name: MessageKey; hint: MessageKey; goals: Stats }[] = [
  {
    id: "short",
    name: "presetShort",
    hint: "presetShortHint",
    goals: { money: 3000, happiness: 50, education: 40, career: 30 },
  },
  {
    id: "normal",
    name: "presetNormal",
    hint: "presetNormalHint",
    goals: { ...DEFAULT_GOALS },
  },
  {
    id: "long",
    name: "presetLong",
    hint: "presetLongHint",
    goals: { money: 9000, happiness: 95, education: 85, career: 80 },
  },
];

const goalSliders: readonly { field: keyof Stats; key: MessageKey; min: number; max: number; step: number; money: boolean }[] = [
  { field: "money", key: "statMoney", min: 2000, max: 15000, step: 500, money: true },
  { field: "happiness", key: "statHappiness", min: 20, max: 100, step: 5, money: false },
  { field: "education", key: "statEducation", min: 20, max: 100, step: 5, money: false },
  { field: "career", key: "statCareer", min: 20, max: 100, step: 5, money: false },
];

function displayGoal(value: number, money: boolean): string {
  return money ? formatZl(value) : String(value);
}

function goalsLine(goals: Stats): string {
  return `${formatZl(goals.money)} · ${goals.happiness} · ${goals.education} · ${goals.career}`;
}

export function buildSetup(handlers: SetupHandlers): HTMLElement {
  let avatarId: AvatarId = "ola";
  let nameTouched = false;
  let goals: Stats = { ...DEFAULT_GOALS };
  let preset: PresetId | null = "normal";
  const saved = handlers.saved ?? null;

  const root = el("div", "setup");

  const head = el("header", "setup-head");
  head.style.setProperty("--panorama", `url("${panoramaUrl()}")`);
  const headCopy = el("div", "setup-head-copy");
  headCopy.append(artImg(stampArtUrl(), "setup-stamp"));
  const title = el("h1", "setup-title");
  title.textContent = t("gameName");
  const kicker = el("span", "setup-kicker");
  kicker.textContent = t("appTitle");
  title.append(kicker);
  headCopy.append(title);
  const rule = el("p", "setup-rule");
  rule.textContent = t("setupRule");
  headCopy.append(rule);
  head.append(headCopy);
  root.append(head);

  if (handlers.notice === "corrupt" || handlers.notice === "unavailable") {
    const notice = el("p", "setup-notice");
    notice.setAttribute("role", "status");
    notice.textContent = handlers.notice === "corrupt" ? t("saveCorrupt") : t("saveUnavailable");
    root.append(notice);
  }

  if (saved !== null && handlers.onContinue !== undefined) {
    const resume = el("div", "resume");
    const who = el("p");
    who.textContent = interpolate("setupSavedAs", { name: saved.name });
    const cont = el("button", "btn btn-primary");
    cont.type = "button";
    cont.textContent = interpolate("setupContinue", { n: saved.week });
    cont.addEventListener("click", () => handlers.onContinue?.());
    resume.append(who, cont);
    root.append(resume);
  }

  const body = el("div", "setup-body");

  /* Długość partii */
  const presetSection = el("section", "setup-section setup-presets");
  const presetLabel = el("h2", "setup-label");
  presetLabel.textContent = t("setupGoals");
  const presetList = el("div", "presets");
  presetList.setAttribute("role", "group");
  presetList.setAttribute("aria-label", t("setupGoals"));
  const presetButtons = new Map<PresetId, HTMLButtonElement>();
  const sliderValues = new Map<keyof Stats, { input: HTMLInputElement; value: HTMLElement; money: boolean }>();

  function syncPresets(): void {
    for (const [id, button] of presetButtons) {
      const on = id === preset;
      button.classList.toggle("preset-on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    }
    for (const [field, slider] of sliderValues) {
      slider.input.value = String(goals[field]);
      slider.value.textContent = displayGoal(goals[field], slider.money);
    }
  }

  for (const entry of presets) {
    const button = el("button", "preset");
    button.type = "button";
    const name = el("span", "preset-name");
    name.textContent = t(entry.name);
    const hint = el("span", "preset-hint");
    hint.textContent = t(entry.hint);
    const line = el("span", "preset-goals");
    line.textContent = goalsLine(entry.goals);
    button.append(name, hint, line);
    button.addEventListener("click", () => {
      preset = entry.id;
      goals = { ...entry.goals };
      syncPresets();
    });
    presetButtons.set(entry.id, button);
    presetList.append(button);
  }

  const custom = el("details", "custom");
  const summary = el("summary");
  summary.textContent = t("presetCustom");
  const goalList = el("div", "goals");
  for (const slider of goalSliders) {
    const row = el("label", "goal");
    const caption = el("span");
    caption.textContent = t(slider.key);
    const value = el("span", "goal-value");
    const input = el("input");
    input.type = "range";
    input.min = String(slider.min);
    input.max = String(slider.max);
    input.step = String(slider.step);
    input.setAttribute("aria-label", t(slider.key));
    input.addEventListener("input", () => {
      goals = { ...goals, [slider.field]: Number(input.value) };
      preset = null;
      syncPresets();
    });
    row.append(caption, value, input);
    goalList.append(row);
    sliderValues.set(slider.field, { input, value, money: slider.money });
  }
  custom.append(summary, goalList);
  presetSection.append(presetLabel, presetList, custom);

  /* Żeton */
  const portraitSection = el("section", "setup-section setup-portraits");
  const portraitLabel = el("h2", "setup-label");
  portraitLabel.textContent = t("setupAvatar");
  const look = el("p", "setup-hint");
  look.textContent = t("setupLook");
  const portraits = el("div", "portraits");
  portraits.setAttribute("role", "group");
  portraits.setAttribute("aria-label", t("setupAvatar"));
  const portraitButtons = new Map<AvatarId, HTMLButtonElement>();

  const nameInput = el("input");

  function syncPortraits(): void {
    for (const [id, button] of portraitButtons) {
      const on = id === avatarId;
      button.classList.toggle("portrait-on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (!nameTouched) {
      nameInput.value = avatarName(avatarId);
    }
  }

  for (const id of avatarIds) {
    const button = el("button", "portrait");
    button.type = "button";
    button.style.setProperty("--avatar", avatarColor(id));
    button.setAttribute("aria-label", avatarName(id));
    button.append(artImg(avatarArtUrl(id), ""));
    const caption = el("span", "plaque portrait-name");
    caption.textContent = avatarName(id);
    button.append(caption);
    button.addEventListener("click", () => {
      avatarId = id;
      syncPortraits();
    });
    portraitButtons.set(id, button);
    portraits.append(button);
  }
  portraitSection.append(portraitLabel, look, portraits);

  /* Imię */
  const nameSection = el("section", "setup-section setup-name");
  const nameLabel = el("label", "name-field");
  const nameCaption = el("span", "setup-label");
  nameCaption.textContent = t("setupName");
  nameInput.type = "text";
  nameInput.maxLength = 16;
  nameInput.autocomplete = "off";
  nameInput.addEventListener("input", () => {
    nameTouched = true;
  });
  nameLabel.append(nameCaption, nameInput);
  nameSection.append(nameLabel);

  /* Start */
  const cta = el("section", "setup-cta");
  const start = el("button", "btn btn-primary");
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
  const vs = el("p", "setup-hint");
  vs.textContent = t("setupVs");
  const install = el("p", "setup-hint");
  install.textContent = t("installHint");
  cta.append(start, vs, install);

  body.append(presetSection, portraitSection, nameSection, cta);
  root.append(body);
  syncPresets();
  syncPortraits();
  return root;
}
