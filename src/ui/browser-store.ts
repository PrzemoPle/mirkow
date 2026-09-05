import type { SaveStore } from "../game/save";

export function browserStore(): SaveStore | null {
  try {
    const storage = window.localStorage;
    const probe = "__mirkow_probe";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}
