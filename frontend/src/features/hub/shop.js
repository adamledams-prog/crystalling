import { getCurrency, trySpendCurrency, updateHubCurrencyDisplay } from "./currency.js";
import {
  addCardKeys,
  addLorusKeys,
  getCardKeys,
  getLorusKeys,
  trySpendCardKey,
  trySpendLorusKey,
  updateHubKeysDisplay,
} from "./shop-keys.js";
import {
  isBattleCardUnlocked,
  isLorusUnlocked,
  unlockBattleCard,
  unlockLorus,
} from "./unlocks.js";

const PERSOS_URL = "./images/persos/persos.json";
const CARDS_URL = "./images/profile/battle-cards.json";
const ROTATION_MS = 10 * 60 * 1000;

const PRICES = {
  lorusDirect: 1000,
  cardKey: 10,
  lorusKey: 1100,
};

let catalogPersos = [];
let battleCards = [];
let shopTickTimer = null;
let onLorusUnlocked = () => {};
let onProfileRefresh = () => {};

function shopSlotIndex(now = Date.now()) {
  return Math.floor(now / ROTATION_MS);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function loadCatalogs() {
  const [persosRes, cardsRes] = await Promise.all([
    fetch(PERSOS_URL, { cache: "no-cache" }),
    fetch(CARDS_URL, { cache: "no-cache" }),
  ]);
  catalogPersos = persosRes.ok ? await persosRes.json() : [];
  battleCards = cardsRes.ok ? await cardsRes.json() : [];
  if (!Array.isArray(catalogPersos)) catalogPersos = [];
  if (!Array.isArray(battleCards)) battleCards = [];
}

function lockedPersoPool() {
  return catalogPersos
    .map((p, i) => ({ ...p, catalogIndex: i }))
    .filter((p) => {
      const id = p.id || p.src;
      return id && !isLorusUnlocked(id, p.catalogIndex);
    });
}

function pickRotatingLorus(slot) {
  const pool = lockedPersoPool();
  if (!pool.length) return [];

  const rand = mulberry32(slot * 0x9e3779b1 + 0x51ed);
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 2);
}

export function getShopOffers(now = Date.now()) {
  const slot = shopSlotIndex(now);
  const rotating = pickRotatingLorus(slot);
  const offers = [];

  for (const ch of rotating) {
    offers.push({
      kind: "lorus_direct",
      id: `lorus-${ch.id}-${slot}`,
      lorusId: ch.id,
      name: ch.name,
      classe: ch.classe,
      thumb: ch.pixelSrc || ch.src,
      price: PRICES.lorusDirect,
    });
  }

  offers.push({
    kind: "card_key",
    id: `card-key-${slot}`,
    name: "Clé carte de combat",
    desc: "Choisis une carte verrouillée à débloquer.",
    price: PRICES.cardKey,
    icon: "🃏",
  });

  offers.push({
    kind: "lorus_key",
    id: `lorus-key-${slot}`,
    name: "Clé Lorus",
    desc: "Choisis un personnage verrouillé à débloquer.",
    price: PRICES.lorusKey,
    icon: "🗝",
  });

  return { slot, offers, nextRefreshAt: (slot + 1) * ROTATION_MS };
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function setShopToast(message, { error = false } = {}) {
  const el = document.getElementById("shop-toast");
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("shop-toast--error", error);
  el.classList.remove("hidden");
  el.hidden = false;
  clearTimeout(setShopToast._t);
  setShopToast._t = setTimeout(() => {
    el.classList.add("hidden");
    el.hidden = true;
  }, 2600);
}

function renderShopOffers() {
  const grid = document.getElementById("shop-offers");
  if (!grid) return;

  const now = Date.now();
  const { offers, nextRefreshAt } = getShopOffers(now);
  const timerEl = document.getElementById("shop-rotation-timer");
  if (timerEl) timerEl.textContent = formatCountdown(nextRefreshAt - now);

  grid.replaceChildren();

  if (!offers.length) {
    const empty = document.createElement("p");
    empty.className = "shop-empty";
    empty.textContent = "Tous les Lorus sont déjà débloqués — reviens pour les clés !";
    grid.append(empty);
    return;
  }

  for (const offer of offers) {
    const card = document.createElement("article");
    card.className = "shop-offer";
    card.dataset.offerKind = offer.kind;

    const head = document.createElement("div");
    head.className = "shop-offer-head";

    if (offer.kind === "lorus_direct") {
      const img = document.createElement("img");
      img.className = "shop-offer-thumb";
      img.src = offer.thumb;
      img.alt = "";
      img.width = 72;
      img.height = 72;
      img.draggable = false;
      head.append(img);
    } else {
      const icon = document.createElement("span");
      icon.className = "shop-offer-icon";
      icon.textContent = offer.icon;
      icon.setAttribute("aria-hidden", "true");
      head.append(icon);
    }

    const meta = document.createElement("div");
    meta.className = "shop-offer-meta";
    const title = document.createElement("h3");
    title.className = "shop-offer-title";
    title.textContent = offer.name;
    meta.append(title);

    if (offer.classe) {
      const tag = document.createElement("p");
      tag.className = "shop-offer-tag";
      tag.textContent = offer.classe === "defenseur" ? "Défenseur" : "Attaquant";
      meta.append(tag);
    } else if (offer.desc) {
      const tag = document.createElement("p");
      tag.className = "shop-offer-tag";
      tag.textContent = offer.desc;
      meta.append(tag);
    }

    const foot = document.createElement("div");
    foot.className = "shop-offer-foot";

    const price = document.createElement("span");
    price.className = "shop-offer-price";
    price.innerHTML = `<span class="shop-offer-coin" aria-hidden="true"></span> ${offer.price}`;
    foot.append(price);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shop-buy-btn";
    const canAfford = getCurrency() >= offer.price;
    btn.textContent = canAfford ? "Acheter" : "Pas assez";
    btn.disabled = !canAfford;
    btn.addEventListener("click", () => purchaseOffer(offer));
    foot.append(btn);

    card.append(head, meta, foot);
    grid.append(card);
  }
}

function purchaseOffer(offer) {
  if (offer.kind === "lorus_direct") {
    const idx = catalogPersos.findIndex((p) => p.id === offer.lorusId);
    if (idx >= 0 && isLorusUnlocked(offer.lorusId, idx)) {
      setShopToast("Tu possèdes déjà ce personnage.", { error: true });
      renderShopOffers();
      return;
    }
  }

  if (!trySpendCurrency(offer.price)) {
    setShopToast("Pas assez de pièces.", { error: true });
    renderShopOffers();
    return;
  }

  if (offer.kind === "lorus_direct") {
    unlockLorus(offer.lorusId);
    onLorusUnlocked();
    setShopToast(`${offer.name} rejoint tes Lorus !`);
  } else if (offer.kind === "card_key") {
    addCardKeys(1);
    setShopToast("Clé carte ajoutée — choisis ta récompense !");
  } else if (offer.kind === "lorus_key") {
    addLorusKeys(1);
    setShopToast("Clé Lorus ajoutée — choisis ton personnage !");
  }

  updateHubCurrencyDisplay();
  updateHubKeysDisplay();
  renderShopOffers();
}

function openKeyPicker(kind) {
  const cardPanel = document.getElementById("shop-picker-card");
  const lorusPanel = document.getElementById("shop-picker-lorus");
  if (kind === "card") {
    if (getCardKeys() < 1) {
      setShopToast("Il te faut une clé carte.", { error: true });
      return;
    }
    renderCardPicker();
    cardPanel?.classList.remove("hidden");
    if (cardPanel) cardPanel.hidden = false;
  } else {
    if (getLorusKeys() < 1) {
      setShopToast("Il te faut une clé Lorus.", { error: true });
      return;
    }
    renderLorusPicker();
    lorusPanel?.classList.remove("hidden");
    if (lorusPanel) lorusPanel.hidden = false;
  }
}

function closeKeyPicker(kind) {
  const panel =
    kind === "card"
      ? document.getElementById("shop-picker-card")
      : document.getElementById("shop-picker-lorus");
  panel?.classList.add("hidden");
  if (panel) panel.hidden = true;
}

function renderCardPicker() {
  const grid = document.getElementById("shop-picker-card-grid");
  if (!grid) return;
  grid.replaceChildren();

  const locked = battleCards
    .map((c, i) => ({ ...c, catalogIndex: i }))
    .filter((c) => !isBattleCardUnlocked(c.id, c.catalogIndex));

  if (!locked.length) {
    const li = document.createElement("li");
    li.className = "shop-picker-empty";
    li.textContent = "Toutes les cartes sont déjà débloquées.";
    grid.append(li);
    return;
  }

  for (const card of locked) {
    const li = document.createElement("li");
    li.className = "shop-picker-item";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shop-picker-btn";

    if (card.image) {
      const img = document.createElement("img");
      img.src = card.image;
      img.alt = "";
      img.className = "shop-picker-img";
      btn.append(img);
    }

    const label = document.createElement("span");
    label.className = "shop-picker-label";
    label.textContent = card.title;
    btn.append(label);

    btn.addEventListener("click", () => {
      if (!trySpendCardKey()) {
        setShopToast("Plus de clé carte.", { error: true });
        closeKeyPicker("card");
        return;
      }
      unlockBattleCard(card.id);
      onProfileRefresh();
      updateHubKeysDisplay();
      setShopToast(`Carte « ${card.title} » débloquée !`);
      closeKeyPicker("card");
    });

    li.append(btn);
    grid.append(li);
  }
}

function renderLorusPicker() {
  const grid = document.getElementById("shop-picker-lorus-grid");
  if (!grid) return;
  grid.replaceChildren();

  const locked = catalogPersos
    .map((p, i) => ({ ...p, catalogIndex: i }))
    .filter((p) => {
      const id = p.id || p.src;
      return !isLorusUnlocked(id, p.catalogIndex);
    });

  if (!locked.length) {
    const li = document.createElement("li");
    li.className = "shop-picker-empty";
    li.textContent = "Tous les personnages sont déjà débloqués.";
    grid.append(li);
    return;
  }

  for (const ch of locked) {
    const li = document.createElement("li");
    li.className = "shop-picker-item";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shop-picker-btn";

    const img = document.createElement("img");
    img.src = ch.pixelSrc || ch.src;
    img.alt = "";
    img.className = "shop-picker-img shop-picker-img--lorus";
    btn.append(img);

    const label = document.createElement("span");
    label.className = "shop-picker-label";
    label.textContent = ch.name;
    btn.append(label);

    btn.addEventListener("click", () => {
      if (!trySpendLorusKey()) {
        setShopToast("Plus de clé Lorus.", { error: true });
        closeKeyPicker("lorus");
        return;
      }
      const id = ch.id || ch.src;
      unlockLorus(id);
      onLorusUnlocked();
      updateHubKeysDisplay();
      setShopToast(`${ch.name} rejoint tes Lorus !`);
      closeKeyPicker("lorus");
    });

    li.append(btn);
    grid.append(li);
  }
}

function startShopTicker() {
  stopShopTicker();
  shopTickTimer = setInterval(() => {
    const shopVisible = !document.getElementById("screen-shop")?.hidden;
    if (shopVisible) renderShopOffers();
    const cardOpen = !document.getElementById("shop-picker-card")?.hidden;
    const lorusOpen = !document.getElementById("shop-picker-lorus")?.hidden;
    if (cardOpen || lorusOpen) {
      /* garder les grilles à jour si déblocages ailleurs */
    }
  }, 1000);
}

function stopShopTicker() {
  if (shopTickTimer) clearInterval(shopTickTimer);
  shopTickTimer = null;
}

export function refreshShopUi() {
  updateHubCurrencyDisplay();
  renderShopOffers();
  updateHubKeysDisplay();
}

export function initShopUi({ openShop, closeShop, onLorusRefresh, onProfileUnlockRefresh }) {
  onLorusUnlocked = onLorusRefresh ?? (() => {});
  onProfileRefresh = onProfileUnlockRefresh ?? (() => {});

  document.getElementById("btn-magasin")?.addEventListener("click", async () => {
    await loadCatalogs();
    openShop?.();
    refreshShopUi();
  });

  document.getElementById("shop-back")?.addEventListener("click", () => {
    closeShop?.();
  });

  document.getElementById("hub-key-card")?.addEventListener("click", async () => {
    if (getCardKeys() < 1) return;
    await loadCatalogs();
    openKeyPicker("card");
  });

  document.getElementById("hub-key-lorus")?.addEventListener("click", async () => {
    if (getLorusKeys() < 1) return;
    await loadCatalogs();
    openKeyPicker("lorus");
  });

  document.getElementById("shop-picker-card-close")?.addEventListener("click", () => closeKeyPicker("card"));
  document.getElementById("shop-picker-card-backdrop")?.addEventListener("click", () => closeKeyPicker("card"));
  document.getElementById("shop-picker-lorus-close")?.addEventListener("click", () => closeKeyPicker("lorus"));
  document.getElementById("shop-picker-lorus-backdrop")?.addEventListener("click", () => closeKeyPicker("lorus"));

  loadCatalogs().then(() => updateHubKeysDisplay());
  startShopTicker();
}