import { isCreatorMode } from "./creator-mode.js";

export const LORUS_RARITY = {
  EPIC: "epic",
  PLATINE: "platinelorus",
  MEGA: "megalorus",
};

export const LORUS_RARITY_FR = {
  epic: "Épique",
  platinelorus: "Platine Lorus",
  megalorus: "Megalorus",
};

const PANEL_THEME_CLASS = {
  epic: "lorus-panel--epic",
  platinelorus: "lorus-panel--platinelorus",
  megalorus: "lorus-panel--megalorus",
};

export function getLorusRarity(perso) {
  const r = perso?.rarity;
  if (r === LORUS_RARITY.PLATINE || r === LORUS_RARITY.MEGA) return r;
  return LORUS_RARITY.EPIC;
}

/** Achat direct 1 000 pièces (rotation magasin — Épique). */
export function canAppearInShopRotation(perso) {
  return getLorusRarity(perso) === LORUS_RARITY.EPIC;
}

/** Sélection avec une clé Lorus (Épique uniquement). */
export function canUnlockWithLorusKey(perso) {
  return getLorusRarity(perso) === LORUS_RARITY.EPIC;
}

/** Liste du sélecteur clé Lorus — en mode créateur, tous les persos verrouillés. */
export function canPickWithLorusKey(perso) {
  if (isCreatorMode()) return true;
  return canUnlockWithLorusKey(perso);
}

export function clearLorusPanelTheme(panel, sheet) {
  if (panel) {
    panel.classList.remove(
      PANEL_THEME_CLASS.epic,
      PANEL_THEME_CLASS.platinelorus,
      PANEL_THEME_CLASS.megalorus
    );
  }
  sheet?.classList.remove("lorus-sheet--epic", "lorus-sheet--platinelorus", "lorus-sheet--megalorus");
}

export function applyLorusPanelTheme(panel, sheet, rarity) {
  clearLorusPanelTheme(panel, sheet);
  const key = getLorusRarity({ rarity });
  if (panel && PANEL_THEME_CLASS[key]) panel.classList.add(PANEL_THEME_CLASS[key]);
  if (sheet) sheet.classList.add(`lorus-sheet--${key}`);
}

export function lorusRarityLabel(perso) {
  return LORUS_RARITY_FR[getLorusRarity(perso)] ?? "";
}