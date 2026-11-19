export const STORAGE_PSEUDO = "guerre_pseudo";
export const STORAGE_NAME_COLOR = "guerre_name_color";
export const STORAGE_BATTLE_CARD = "guerre_battle_card";

export const NAME_COLORS = [
  { id: "gold", label: "Or", css: "#e8c547" },
  { id: "cream", label: "Crème", css: "#f4f0e6" },
  { id: "cyan", label: "Cyan", css: "#5ce1e6" },
  { id: "pink", label: "Rose", css: "#ff6eb4" },
  { id: "lime", label: "Vert", css: "#9dff6a" },
  { id: "red", label: "Rouge", css: "#ff4d4d" },
  { id: "violet", label: "Violet", css: "#b57edc" },
  { id: "orange", label: "Orange", css: "#ff9f43" },
  { id: "white", label: "Blanc", css: "#ffffff" },
  { id: "blue", label: "Bleu", css: "#4da3ff" },
];

const DEFAULT_COLOR_ID = "gold";
const DEFAULT_CARD_ID = "cubes-violet";

export function getSavedPseudo() {
  const p = localStorage.getItem(STORAGE_PSEUDO);
  return p && p.trim() ? p.trim() : null;
}

export function setSavedPseudo(name) {
  localStorage.setItem(STORAGE_PSEUDO, name);
}

export function getNameColorId() {
  const id = localStorage.getItem(STORAGE_NAME_COLOR);
  return NAME_COLORS.some((c) => c.id === id) ? id : DEFAULT_COLOR_ID;
}

export function setNameColorId(id) {
  if (!NAME_COLORS.some((c) => c.id === id)) return;
  localStorage.setItem(STORAGE_NAME_COLOR, id);
}

export function getNameColorCss(id = getNameColorId()) {
  return NAME_COLORS.find((c) => c.id === id)?.css ?? NAME_COLORS[0].css;
}

export function getEquippedCardId() {
  const id = localStorage.getItem(STORAGE_BATTLE_CARD);
  return id || DEFAULT_CARD_ID;
}

export function setEquippedCardId(id) {
  localStorage.setItem(STORAGE_BATTLE_CARD, id);
}

export function pseudoInitial(name) {
  const ch = [...(name || "?")][0];
  return ch ? ch.toUpperCase() : "?";
}