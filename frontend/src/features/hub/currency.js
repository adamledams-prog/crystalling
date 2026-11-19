export const STORAGE_CURRENCY = "guerre_currency";
const STORAGE_CREATOR = "guerre_creator_mode";
const CREATOR_COINS = Number.MAX_SAFE_INTEGER;

function creatorCoinsActive() {
  return localStorage.getItem(STORAGE_CREATOR) === "1";
}

export function getCurrency() {
  if (creatorCoinsActive()) return CREATOR_COINS;
  const raw = localStorage.getItem(STORAGE_CURRENCY);
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export function formatCurrencyDisplay() {
  return creatorCoinsActive() ? "∞" : String(getCurrency());
}

export function setCurrency(amount) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  localStorage.setItem(STORAGE_CURRENCY, String(n));
  updateHubCurrencyDisplay();
  return n;
}

export function addCurrency(delta) {
  return setCurrency(getCurrency() + delta);
}

/** Retire des pièces si le solde suffit ; renvoie false sinon. */
export function trySpendCurrency(amount) {
  if (creatorCoinsActive()) return true;
  const cost = Math.max(0, Math.floor(Number(amount) || 0));
  if (cost === 0) return true;
  const balance = getCurrency();
  if (balance < cost) return false;
  setCurrency(balance - cost);
  return true;
}

export function updateHubCurrencyDisplay() {
  const text = formatCurrencyDisplay();
  const el = document.getElementById("hub-currency-amount");
  if (el) el.textContent = text;
  const shopWallet = document.getElementById("shop-wallet-amount");
  if (shopWallet) shopWallet.textContent = text;
}

export function initHubCurrency() {
  if (!localStorage.getItem(STORAGE_CURRENCY)) {
    localStorage.setItem(STORAGE_CURRENCY, "0");
  }
  updateHubCurrencyDisplay();
}