import { hasFullUnlock } from "./creator-mode.js";
import { resetShopKeys } from "./shop-keys.js";

const STORAGE_STARTER_REVEAL = "guerre_starter_reveal_done";

export const STARTER_LORUS_COUNT = 3;
export const STARTER_CARD_COUNT = 2;

const STORAGE_EXTRA_LORUS = "guerre_unlocked_lorus";
const STORAGE_EXTRA_CARDS = "guerre_unlocked_cards";

function readIdList(key) {
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeIdList(key, ids) {
  localStorage.setItem(key, JSON.stringify([...new Set(ids)]));
}

export function getExtraUnlockedLorus() {
  return readIdList(STORAGE_EXTRA_LORUS);
}

export function getExtraUnlockedCards() {
  return readIdList(STORAGE_EXTRA_CARDS);
}

export function unlockLorus(id) {
  if (!id) return;
  const next = [...getExtraUnlockedLorus(), id];
  writeIdList(STORAGE_EXTRA_LORUS, next);
}

export function unlockBattleCard(id) {
  if (!id) return;
  const next = [...getExtraUnlockedCards(), id];
  writeIdList(STORAGE_EXTRA_CARDS, next);
}

/** Index dans persos.json ; -1 = perso hors catalogue (verrouillé sauf créateur / bonus). */
export function isLorusUnlocked(lorusId, catalogIndex) {
  if (hasFullUnlock()) return true;
  if (lorusId && getExtraUnlockedLorus().includes(lorusId)) return true;
  if (catalogIndex >= 0 && catalogIndex < STARTER_LORUS_COUNT) return true;
  return false;
}

export function isBattleCardUnlocked(cardId, catalogIndex) {
  if (hasFullUnlock()) return true;
  if (cardId && getExtraUnlockedCards().includes(cardId)) return true;
  if (catalogIndex >= 0 && catalogIndex < STARTER_CARD_COUNT) return true;
  return false;
}

/** 3 premiers Lorus + 2 cartes du catalogue ; clés à 0. Ne touche pas aux pièces. */
export function resetToStarterProgress() {
  localStorage.removeItem(STORAGE_EXTRA_LORUS);
  localStorage.removeItem(STORAGE_EXTRA_CARDS);
  localStorage.removeItem(STORAGE_STARTER_REVEAL);
  resetShopKeys();
}

export function firstUnlockedBattleCardId(cards) {
  if (!Array.isArray(cards) || !cards.length) return null;
  for (let i = 0; i < cards.length; i++) {
    if (isBattleCardUnlocked(cards[i].id, i)) return cards[i].id;
  }
  return cards[0]?.id ?? null;
}