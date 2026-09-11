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

export type SetupNotice = "corrupt" | "unavailable" | "outdated" | null;

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
  return interpolate("presetGoals", { money: formatZl(goals.money), happiness: goals.happiness, education: goals.education, career: goals.career });
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
  const titleBlock = el("div", "setup-title-block");
  const title = el("h1", "setup-title");
  title.textContent = t("gameName");
  const kicker = el("p", "setup-kicker");
  kicker.textContent = t("appTitle");
  titleBlock.append(title, kicker);
  headCopy.append(titleBlock);
  const rule = el("p", "setup-rule");
  rule.textContent = t("setupRule");
  headCopy.append(rule);
  head.append(headCopy);
  root.append(head);

  if (handlers.notice !== null && handlers.notice !== undefined) {
    const notice = el("p", "setup-notice");
    notice.setAttribute("role", "status");
    const key = handlers.notice === "corrupt" ? "saveCorrupt" : handlers.notice === "outdated" ? "saveOutdated" : "saveUnavailable";
    notice.textContent = t(key);
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

  /* Legitymacja mieszkańca: jeden dokument zamiast formularza z sekcjami. */
  const card = el("div", "id-card");

  const idHead = el("div", "id-head");
  const idTitle = el("span", "id-title");
  idTitle.textContent = t("setupCardTitle");
  const idIssuer = el("span", "id-issuer");
  idIssuer.textContent = t("setupCardIssued");
  idHead.append(idTitle, idIssuer);
  idHead.append(artImg(stampArtUrl(), "id-seal"));

  const idBody = el("div", "id-body");

  /* Zdjęcie w ramce i pasek zdjęć do wyboru */
  const photoBox = el("div", "id-photo");
  const photo = el("div", "id-photo-frame");
  const photoImg = artImg(avatarArtUrl("ola"), "");
  photo.append(photoImg);
  const photoLabel = el("span", "id-photo-label");
  photoLabel.textContent = t("setupPhoto");
  photoBox.append(photo, photoLabel);

  const strip = el("div", "id-strip");
  strip.setAttribute("role", "group");
  strip.setAttribute("aria-label", t("setupAvatar"));
  const portraitButtons = new Map<AvatarId, HTMLButtonElement>();

  const nameInput = el("input");

  function syncPortraits(): void {
    for (const [id, button] of portraitButtons) {
      const on = id === avatarId;
      button.classList.toggle("id-thumb-on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    }
    photoImg.src = avatarArtUrl(avatarId);
    photo.style.setProperty("--avatar", avatarColor(avatarId));
    if (!nameTouched) {
      nameInput.value = avatarName(avatarId);
    }
  }

  for (const id of avatarIds) {
    const button = el("button", "id-thumb");
    button.type = "button";
    button.setAttribute("aria-label", avatarName(id));
    button.title = avatarName(id);
    button.append(artImg(avatarArtUrl(id), ""));
    button.addEventListener("click", () => {
      avatarId = id;
      syncPortraits();
    });
    portraitButtons.set(id, button);
    strip.append(button);
  }
  photoBox.append(strip);

  /* Rubryki wypełniane ręcznie */
  const fields = el("div", "id-fields");

  const nameField = el("label", "id-field");
  const nameCaption = el("span", "id-caption");
  nameCaption.textContent = t("setupName");
  nameInput.type = "text";
  nameInput.className = "id-write";
  nameInput.maxLength = 16;
  nameInput.autocomplete = "off";
  nameInput.spellcheck = false;
  nameInput.addEventListener("input", () => {
    nameTouched = true;
  });
  nameField.append(nameCaption, nameInput);

  const goalField = el("div", "id-field");
  const goalCaption = el("span", "id-caption");
  goalCaption.textContent = t("setupGoals");
  const presetList = el("div", "id-stamps");
  presetList.setAttribute("role", "group");
  presetList.setAttribute("aria-label", t("setupGoals"));
  const presetButtons = new Map<PresetId, HTMLButtonElement>();
  const sliderValues = new Map<keyof Stats, { input: HTMLInputElement; value: HTMLElement; money: boolean }>();
  const goalSummary = el("p", "id-goal-line");

  function syncPresets(): void {
    for (const [id, button] of presetButtons) {
      const on = id === preset;
      button.classList.toggle("id-stamp-on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    }
    for (const [field, slider] of sliderValues) {
      slider.input.value = String(goals[field]);
      slider.value.textContent = displayGoal(goals[field], slider.money);
    }
    const chosen = presets.find((entry) => entry.id === preset);
    goalSummary.textContent = chosen === undefined ? goalsLine(goals) : `${t(chosen.hint)} · ${goalsLine(goals)}`;
  }

  for (const entry of presets) {
    const button = el("button", "id-stamp");
    button.type = "button";
    button.textContent = t(entry.name);
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
  goalField.append(goalCaption, presetList, goalSummary, custom);

  fields.append(nameField, goalField);
  idBody.append(photoBox, fields);

  /* Podbicie dokumentu zamiast przycisku „wyślij formularz” */
  const idFoot = el("div", "id-foot");
  const start = el("button", "id-go");
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
  const notes = el("p", "id-notes");
  notes.textContent = `${t("setupVs")} ${t("setupLook")}`;
  idFoot.append(start, notes);

  card.append(idHead, idBody, idFoot);

  root.append(card);

  const foot = el("footer", "setup-foot");
  const install = el("p", "setup-install");
  install.textContent = t("installHint");
  const credits = el("p", "setup-credits");
  credits.textContent = t("setupCredits");
  const version = el("p", "setup-version");
  version.textContent = interpolate("setupVersion", { v: __APP_VERSION__ });
  foot.append(install, credits, version);
  root.append(foot);
  syncPresets();
  syncPortraits();
  return root;
}
