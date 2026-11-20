export const STORAGE_CARD_KEYS = "guerre_shop_card_keys";
export const STORAGE_LORUS_KEYS = "guerre_shop_lorus_keys";

function readKeyCount(key) {
  const n = Number(localStorage.getItem(key) || "0");
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function writeKeyCount(key, value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  localStorage.setItem(key, String(n));
  updateHubKeysDisplay();
  return n;
}

export function getCardKeys() {
  return readKeyCount(STORAGE_CARD_KEYS);
}

export function getLorusKeys() {
  return readKeyCount(STORAGE_LORUS_KEYS);
}

export function addCardKeys(delta = 1) {
  return writeKeyCount(STORAGE_CARD_KEYS, getCardKeys() + delta);
}

export function addLorusKeys(delta = 1) {
  return writeKeyCount(STORAGE_LORUS_KEYS, getLorusKeys() + delta);
}

export function trySpendCardKey() {
  const n = getCardKeys();
  if (n < 1) return false;
  writeKeyCount(STORAGE_CARD_KEYS, n - 1);
  return true;
}

export function trySpendLorusKey() {
  const n = getLorusKeys();
  if (n < 1) return false;
  writeKeyCount(STORAGE_LORUS_KEYS, n - 1);
  return true;
}

export function updateHubKeysDisplay() {
  const cardEl = document.getElementById("hub-key-card-count");
  const lorusEl = document.getElementById("hub-key-lorus-count");
  const cardBtn = document.getElementById("hub-key-card");
  const lorusBtn = document.getElementById("hub-key-lorus");

  const cardKeys = getCardKeys();
  const lorusKeys = getLorusKeys();

  if (cardEl) cardEl.textContent = String(cardKeys);
  if (lorusEl) lorusEl.textContent = String(lorusKeys);

  cardBtn?.classList.toggle("hub-key--usable", cardKeys > 0);
  lorusBtn?.classList.toggle("hub-key--usable", lorusKeys > 0);

  cardBtn?.setAttribute("aria-disabled", cardKeys > 0 ? "false" : "true");
  lorusBtn?.setAttribute("aria-disabled", lorusKeys > 0 ? "false" : "true");
}

export function initHubKeys() {
  updateHubKeysDisplay();
}

export function resetShopKeys() {
  writeKeyCount(STORAGE_CARD_KEYS, 0);
  writeKeyCount(STORAGE_LORUS_KEYS, 0);
}