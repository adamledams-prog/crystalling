import {
  NAME_COLORS,
  getSavedPseudo,
  setSavedPseudo,
  getNameColorId,
  setNameColorId,
  getNameColorCss,
  getEquippedCardId,
  setEquippedCardId,
  pseudoInitial,
} from "./profile-store.js";
import {
  firstUnlockedBattleCardId,
  isBattleCardUnlocked,
} from "../hub/unlocks.js";

const CARDS_URL = "./images/profile/battle-cards.json";
const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };

let battleCards = [];
let draftColorId = getNameColorId();
let draftCardId = getEquippedCardId();
let cardSortMode = "equipped-first";
let profileView = "identity";
let panelOpen = false;
let openSnapshot = null;

const els = {
  panel: null,
  backdrop: null,
  preview: null,
  nameInput: null,
  nameCount: null,
  nameHint: null,
  colors: null,
  colorActive: null,
  cardsGrid: null,
  toast: null,
  saveBtn: null,
  hubMini: null,
};

const THEME_GLYPH = {
  "cubes-violet": "◆",
  "donuts-bleu": "◎",
  "diamant-rose": "♦",
  "toxique-vert": "☠",
  "crane-brique": "💀",
  "masque-rose": "◉",
  "fiole-vert": "⚗",
  "arene-or": "★",
};

function getCardById(id) {
  return battleCards.find((c) => c.id === id) ?? battleCards[0] ?? null;
}

function catalogIndexForCard(cardId) {
  return battleCards.findIndex((c) => c.id === cardId);
}

function isCardUnlocked(cardOrId) {
  const id = typeof cardOrId === "string" ? cardOrId : cardOrId?.id;
  const idx = catalogIndexForCard(id);
  return isBattleCardUnlocked(id, idx);
}

function clampEquippedCardId(id = getEquippedCardId()) {
  const fallback = firstUnlockedBattleCardId(battleCards);
  if (!battleCards.length || !fallback) return id;

  let next = id;
  if (!isCardUnlocked(id)) {
    next = fallback;
    setEquippedCardId(next);
  }
  if (panelOpen && !isCardUnlocked(draftCardId)) draftCardId = next;
  else if (!panelOpen) draftCardId = getEquippedCardId();
  return next;
}

export function refreshProfileUnlocks() {
  clampEquippedCardId();
  if (panelOpen) {
    draftCardId = clampEquippedCardId(draftCardId);
    renderCardsGrid();
    renderPreview();
  }
  applyHubProfileStyles();
}

function getDraftName() {
  return els.nameInput?.value.trim() || getSavedPseudo() || "Joueur";
}

function sortedCards() {
  const list = [...battleCards];
  if (cardSortMode === "rarity") {
    list.sort(
      (a, b) =>
        (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9) || a.title.localeCompare(b.title)
    );
    return list;
  }
  return list.sort((a, b) => {
    if (a.id === draftCardId) return -1;
    if (b.id === draftCardId) return 1;
    return (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9);
  });
}

function fillCardArt(art, card, { mini = false } = {}) {
  art.replaceChildren();
  if (card.image) {
    art.classList.add("battle-card__art--photo");
    art.removeAttribute("data-theme");
    const img = document.createElement("img");
    img.className = "battle-card__img";
    img.src = card.image;
    img.alt = "";
    img.decoding = "async";
    img.draggable = false;
    art.append(img);
    return;
  }
  art.classList.remove("battle-card__art--photo");
  art.dataset.theme = card.theme;
  if (!mini) {
    const glyph = document.createElement("span");
    glyph.className = "battle-card__glyph";
    glyph.textContent = THEME_GLYPH[card.theme] || "★";
    glyph.setAttribute("aria-hidden", "true");
    art.append(glyph);
  }
}

function buildBattleCardArticle(card, { name, colorCss, equipped, compact, mini }) {
  const article = document.createElement("article");
  article.className = "battle-card";
  if (compact) article.classList.add("battle-card--compact");
  if (mini) article.classList.add("battle-card--mini");
  if (equipped && compact && !card.image) article.classList.add("battle-card--equipped-flag");
  if (card.rarity) {
    article.dataset.rarity = card.rarity;
    article.style.setProperty("--rarity-accent", card.accent || colorCss);
  }

  const crest = document.createElement("div");
  crest.className = "battle-card__crest";
  const showCrest = !mini && !card.image;
  if (showCrest) {
    crest.innerHTML = `<span class="battle-card__crest-wing" aria-hidden="true"></span><span class="battle-card__crest-pin">${card.pin || "★"}</span><span class="battle-card__crest-wing battle-card__crest-wing--r" aria-hidden="true"></span>`;
  }

  const art = document.createElement("div");
  art.className = "battle-card__art";
  fillCardArt(art, card, { mini });

  const bar = document.createElement("div");
  bar.className = "battle-card__bar";

  const meta = document.createElement("div");
  meta.className = "battle-card__meta";

  const nameEl = document.createElement("p");
  nameEl.className = "battle-card__name";
  nameEl.textContent = mini ? pseudoInitial(name) : name || "Joueur";
  nameEl.style.color = colorCss;
  if (!mini) nameEl.style.setProperty("--name-glow", colorCss);

  const titleEl = document.createElement("p");
  titleEl.className = "battle-card__title";
  titleEl.textContent =
    mini || compact ? card.title : card.subtitle ? `${card.title} — ${card.subtitle}` : card.title;
  titleEl.style.color = card.accent || colorCss;

  meta.append(nameEl, titleEl);

  const badge = document.createElement("span");
  badge.className = "battle-card__badge";
  badge.textContent = pseudoInitial(name);
  badge.style.setProperty("--badge-accent", card.accent || colorCss);

  if (mini) {
    article.append(art, bar);
    bar.append(meta);
  } else {
    bar.append(meta, badge);
    if (showCrest) article.append(crest);
    article.append(art, bar);
  }

  return article;
}

function buildBattleCardEl(card, { name, colorCss, equipped, compact }) {
  const unlocked = isCardUnlocked(card);
  const li = document.createElement("li");
  li.className = "battle-card-picker";
  if (equipped) li.classList.add("battle-card-picker--equipped");
  if (!unlocked) li.classList.add("battle-card-picker--locked");
  li.dataset.cardId = card.id;
  li.setAttribute("role", "button");
  li.tabIndex = unlocked ? 0 : -1;
  li.setAttribute("aria-pressed", equipped ? "true" : "false");
  li.setAttribute(
    "aria-label",
    unlocked
      ? `${equipped ? "Équipée — " : ""}Carte ${card.title}`
      : `${card.title} — verrouillée`
  );
  if (!unlocked) li.setAttribute("aria-disabled", "true");

  const article = buildBattleCardArticle(card, { name, colorCss, equipped, compact, mini: false });
  li.append(article);
  if (!unlocked) {
    const lock = document.createElement("span");
    lock.className = "battle-card-lock";
    lock.setAttribute("aria-hidden", "true");
    lock.textContent = "🔒";
    li.append(lock);
  }
  return li;
}

function renderHubMiniCard() {
  if (!els.hubMini) return;
  const cardId = panelOpen ? draftCardId : getEquippedCardId();
  const card = getCardById(cardId);
  if (!card) {
    els.hubMini.replaceChildren();
    return;
  }
  els.hubMini.replaceChildren();
  const square = document.createElement("div");
  square.className = "hub-card-square";
  if (card.rarity) square.dataset.rarity = card.rarity;
  const art = document.createElement("div");
  art.className = "hub-card-square__art battle-card__art";
  fillCardArt(art, card, { mini: true });
  square.append(art);
  els.hubMini.append(square);
}

function renderPreview() {
  const name = getDraftName();
  const colorCss = getNameColorCss(draftColorId);
  const card = getCardById(draftCardId);
  if (!card || !els.preview) return;

  els.preview.replaceChildren();
  const article = buildBattleCardArticle(card, {
    name,
    colorCss,
    equipped: true,
    compact: false,
    mini: false,
  });
  article.classList.add("battle-card--preview", "battle-card--shine");
  els.preview.append(article);

  if (panelOpen) syncDraftToHub();
  updateDirtyState();
}

function updateColorActiveLabel() {
  const label = NAME_COLORS.find((c) => c.id === draftColorId)?.label ?? "";
  if (els.colorActive) els.colorActive.textContent = label;
}

function renderColorSwatches() {
  if (!els.colors) return;
  if (!els.colors.dataset.bound) {
    els.colors.dataset.bound = "1";
    els.colors.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-color-id]");
      if (!btn) return;
      draftColorId = btn.dataset.colorId;
      renderColorSwatches();
      renderPreview();
      renderCardsGrid();
    });
  }

  els.colors.replaceChildren();
  for (const c of NAME_COLORS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "profile-color-swatch";
    btn.dataset.colorId = c.id;
    btn.title = c.label;
    btn.setAttribute("aria-label", `Couleur ${c.label}`);
    btn.setAttribute("aria-pressed", c.id === draftColorId ? "true" : "false");
    btn.style.setProperty("--swatch", c.css);
    if (c.id === draftColorId) btn.classList.add("profile-color-swatch--active");
    els.colors.append(btn);
  }
  updateColorActiveLabel();
}

function renderCardsGrid({ scrollEquipped = false } = {}) {
  if (!els.cardsGrid) return;

  if (!els.cardsGrid.dataset.bound) {
    els.cardsGrid.dataset.bound = "1";
    els.cardsGrid.addEventListener("click", (e) => {
      const item = e.target.closest(".battle-card-picker");
      if (!item) return;
      pickCard(item.dataset.cardId, item);
    });
    els.cardsGrid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const item = e.target.closest(".battle-card-picker");
      if (!item) return;
      e.preventDefault();
      pickCard(item.dataset.cardId, item);
    });
  }

  els.cardsGrid.replaceChildren();

  const name = getDraftName();
  const colorCss = getNameColorCss(draftColorId);

  for (const card of sortedCards()) {
    const equipped = card.id === draftCardId;
    const item = buildBattleCardEl(card, { name, colorCss, equipped, compact: true });
  if (equipped) item.dataset.equipped = "1";
    els.cardsGrid.append(item);
  }

  if (scrollEquipped) {
    const equippedEl = els.cardsGrid.querySelector('[data-equipped="1"]');
    equippedEl?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }

  updateDirtyState();
}

function pickCard(cardId, item) {
  if (!isCardUnlocked(cardId)) return;
  const prev = draftCardId;
  draftCardId = cardId;
  if (prev !== cardId) {
    const art = item?.querySelector(".battle-card");
    art?.classList.add("battle-card--pop");
    setTimeout(() => art?.classList.remove("battle-card--pop"), 380);
  }
  if (cardSortMode === "equipped-first") renderCardsGrid();
  else {
    els.cardsGrid.querySelectorAll(".battle-card-picker").forEach((el) => {
      const on = el.dataset.cardId === draftCardId;
      el.classList.toggle("battle-card-picker--equipped", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
      el.querySelector(".battle-card")?.classList.toggle("battle-card--equipped-flag", on);
    });
  }
  renderPreview();
}

function updateNameMeta() {
  const len = els.nameInput?.value.length ?? 0;
  if (els.nameCount) els.nameCount.textContent = `${len}/20`;

  const raw = els.nameInput?.value.trim() ?? "";
  if (!els.nameHint) return;
  if (raw.length === 0) {
    els.nameHint.classList.add("hidden");
    els.nameInput?.classList.remove("profile-name-input--invalid");
    updateDirtyState();
    return;
  }
  if (raw.length < 2) {
    els.nameHint.textContent = "Au moins 2 caractères.";
    els.nameHint.classList.remove("hidden");
    els.nameInput?.classList.add("profile-name-input--invalid");
    updateDirtyState();
    return;
  }
  els.nameHint.classList.add("hidden");
  els.nameInput?.classList.remove("profile-name-input--invalid");
  updateDirtyState();
}

function getDraftState() {
  return {
    name: els.nameInput?.value.trim() ?? "",
    colorId: draftColorId,
    cardId: draftCardId,
  };
}

function isDirty() {
  if (!openSnapshot) return false;
  const d = getDraftState();
  return (
    d.name !== openSnapshot.name ||
    d.colorId !== openSnapshot.colorId ||
    d.cardId !== openSnapshot.cardId
  );
}

function updateDirtyState() {
  const dirty = isDirty();
  els.saveBtn?.classList.toggle("profile-save--dirty", dirty);
  els.saveBtn?.setAttribute("aria-description", dirty ? "Modifications non enregistrées" : "");
}

function takeSnapshot() {
  openSnapshot = {
    name: getSavedPseudo() || "",
    colorId: getNameColorId(),
    cardId: getEquippedCardId(),
  };
}

function revertDraft() {
  if (!openSnapshot) return;
  draftColorId = openSnapshot.colorId;
  draftCardId = openSnapshot.cardId;
  if (els.nameInput) els.nameInput.value = openSnapshot.name;
  renderColorSwatches();
  renderCardsGrid();
  renderPreview();
  updateNameMeta();
  syncDraftToHub();
  showSaveToast("Modifications annulées.");
}

function randomizeDraft() {
  if (!battleCards.length || !NAME_COLORS.length) return;
  draftColorId = NAME_COLORS[Math.floor(Math.random() * NAME_COLORS.length)].id;
  const unlocked = battleCards.filter((c) => isCardUnlocked(c));
  const pool = unlocked.length ? unlocked : battleCards.slice(0, 2);
  draftCardId = pool[Math.floor(Math.random() * pool.length)].id;
  renderColorSwatches();
  renderCardsGrid();
  renderPreview();
  els.preview?.classList.add("profile-preview-root--shuffle");
  setTimeout(() => els.preview?.classList.remove("profile-preview-root--shuffle"), 420);
}

function syncDraftToHub() {
  const hubName = document.getElementById("hub-name");
  const hubAvatar = document.getElementById("hub-avatar");
  const hubProfile = document.getElementById("hub-profile");
  const hubCardTitle = document.getElementById("hub-card-title");
  const hubProfileCard = document.getElementById("hub-profile-card");
  const name = getDraftName();
  const colorCss = getNameColorCss(draftColorId);
  const card = getCardById(draftCardId);

  if (hubName) {
    hubName.textContent = name;
    hubName.style.color = colorCss;
  }
  if (hubAvatar) hubAvatar.textContent = pseudoInitial(name);

  if (card && hubProfile) {
    hubProfile.dataset.cardTheme = card.theme;
    hubProfile.dataset.rarity = card.rarity || "";
    hubProfile.style.setProperty("--profile-accent", card.accent || colorCss);
    hubProfile.setAttribute("aria-label", `Profil de ${name}, carte ${card.title}`);
    hubProfileCard?.setAttribute("data-theme", card.theme);
    if (hubCardTitle) hubCardTitle.textContent = card.title;
  }
  renderHubMiniCard();
}

export function applyHubProfileStyles() {
  clampEquippedCardId();
  if (panelOpen) {
    syncDraftToHub();
    return;
  }

  const hubName = document.getElementById("hub-name");
  const hubAvatar = document.getElementById("hub-avatar");
  const hubProfile = document.getElementById("hub-profile");
  const hubCardTitle = document.getElementById("hub-card-title");
  const hubProfileCard = document.getElementById("hub-profile-card");
  const name = getSavedPseudo() || "Joueur";
  const colorCss = getNameColorCss();
  const card = getCardById(getEquippedCardId());

  if (hubName) {
    hubName.textContent = name;
    hubName.style.color = colorCss;
  }
  if (hubAvatar) hubAvatar.textContent = pseudoInitial(name);

  if (hubProfile && card) {
    hubProfile.dataset.cardTheme = card.theme;
    hubProfile.dataset.rarity = card.rarity || "";
    hubProfile.style.setProperty("--profile-accent", card.accent || colorCss);
    hubProfile.setAttribute("aria-label", `Profil de ${name}, carte ${card.title}`);
    hubProfileCard?.setAttribute("data-theme", card.theme);
    if (hubCardTitle) hubCardTitle.textContent = card.title;
  } else if (hubCardTitle) {
    hubCardTitle.textContent = "Carte de combat";
    hubProfile?.setAttribute("aria-label", "Profil");
  }
  renderHubMiniCard();
}

export function updateHubProfileDisplay() {
  applyHubProfileStyles();
}

async function loadBattleCards() {
  try {
    const res = await fetch(`${CARDS_URL}?t=${Date.now()}`, { cache: "no-cache" });
    if (!res.ok) return;
    const data = await res.json();
    battleCards = Array.isArray(data) ? data : [];
  } catch {
    battleCards = [];
  }
  if (!battleCards.some((c) => c.id === draftCardId)) {
    draftCardId = battleCards[0]?.id ?? draftCardId;
  }
  clampEquippedCardId();
}

function showSaveToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  els.toast.classList.add("profile-toast--show");
  clearTimeout(showSaveToast._t);
  showSaveToast._t = setTimeout(() => {
    els.toast?.classList.remove("profile-toast--show");
    els.toast?.classList.add("hidden");
  }, 1600);
}

function saveProfile({ closeAfter = false } = {}) {
  const raw = els.nameInput?.value.trim() ?? "";
  if (raw.length >= 2 && raw.length <= 20) {
    setSavedPseudo(raw);
  } else if (els.nameInput) {
    els.nameInput.value = getSavedPseudo() || "";
    updateNameMeta();
    if (!closeAfter) {
      showSaveToast("Pseudo inchangé (2–20 caractères).");
      return false;
    }
  }
  setNameColorId(draftColorId);
  if (!isCardUnlocked(draftCardId)) draftCardId = clampEquippedCardId();
  setEquippedCardId(draftCardId);
  takeSnapshot();
  applyHubProfileStyles();
  updateDirtyState();
  if (closeAfter) {
    closeProfilePanel();
  } else {
    showSaveToast("Profil enregistré !");
  }
  return true;
}

function switchProfileView(view) {
  profileView = view === "cards" ? "cards" : "identity";
  const identity = document.getElementById("profile-view-identity");
  const cards = document.getElementById("profile-view-cards");
  const subtitle = document.getElementById("profile-subtitle");
  const isCards = profileView === "cards";

  document.querySelectorAll("[data-profile-view]").forEach((tab) => {
    const active = tab.dataset.profileView === profileView;
    tab.classList.toggle("profile-tab--active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });

  identity?.classList.toggle("hidden", isCards);
  cards?.classList.toggle("hidden", !isCards);
  if (identity) identity.hidden = isCards;
  if (cards) cards.hidden = !isCards;

  if (subtitle) {
    subtitle.textContent = isCards ? "Choisis ta carte de combat" : "Pseudo et couleur";
  }

  if (isCards) renderCardsGrid({ scrollEquipped: true });
}

function closeOtherPanels() {
  const lorus = document.getElementById("lorus-panel");
  if (lorus && !lorus.hidden) {
    lorus.classList.add("hidden");
    lorus.hidden = true;
  }
}

export async function openProfilePanel() {
  if (!battleCards.length) await loadBattleCards();
  closeOtherPanels();

  draftColorId = getNameColorId();
  draftCardId = getEquippedCardId();
  const saved = getSavedPseudo();
  if (els.nameInput) els.nameInput.value = saved || "";
  takeSnapshot();

  panelOpen = true;
  switchProfileView("identity");
  renderColorSwatches();
  renderCardsGrid({ scrollEquipped: true });
  renderPreview();
  updateNameMeta();

  els.panel?.classList.remove("hidden");
  els.panel.hidden = false;
  requestAnimationFrame(() => els.panel?.classList.add("profile-panel--open"));
  els.nameInput?.focus();
}

export function closeProfilePanel() {
  panelOpen = false;
  els.panel?.classList.remove("profile-panel--open");
  els.panel?.classList.add("hidden");
  els.panel.hidden = true;
  applyHubProfileStyles();
  document.getElementById("hub-profile")?.focus();
}

export function initProfileUi() {
  els.panel = document.getElementById("profile-panel");
  els.backdrop = document.getElementById("profile-backdrop");
  els.preview = document.getElementById("profile-preview-root");
  els.nameInput = document.getElementById("profile-name-input");
  els.nameCount = document.getElementById("profile-name-count");
  els.nameHint = document.getElementById("profile-name-hint");
  els.colors = document.getElementById("profile-colors");
  els.colorActive = document.getElementById("profile-color-active");
  els.cardsGrid = document.getElementById("profile-cards-grid");
  els.toast = document.getElementById("profile-toast");
  els.saveBtn = document.getElementById("profile-save");
  els.hubMini = document.getElementById("hub-mini-card");

  document.getElementById("hub-profile")?.addEventListener("click", () => {
    openProfilePanel();
  });

  document.getElementById("profile-close")?.addEventListener("click", () => {
    if (isDirty()) saveProfile({ closeAfter: true });
    else closeProfilePanel();
  });

  els.backdrop?.addEventListener("click", () => {
    if (isDirty()) saveProfile({ closeAfter: true });
    else closeProfilePanel();
  });

  document.getElementById("profile-save")?.addEventListener("click", () => {
    saveProfile({ closeAfter: true });
  });

  document.getElementById("profile-random")?.addEventListener("click", randomizeDraft);
  document.getElementById("profile-revert")?.addEventListener("click", revertDraft);
  document.getElementById("profile-open-cards")?.addEventListener("click", () => {
    switchProfileView("cards");
    document.getElementById("profile-tab-cards")?.focus();
  });

  document.querySelectorAll("[data-profile-view]").forEach((tab) => {
    tab.addEventListener("click", () => {
      switchProfileView(tab.dataset.profileView || "identity");
    });
  });

  document.querySelectorAll("[data-card-sort]").forEach((btn) => {
    btn.addEventListener("click", () => {
      cardSortMode = btn.dataset.cardSort || "equipped-first";
      document.querySelectorAll("[data-card-sort]").forEach((b) => {
        b.classList.toggle("profile-card-filter--active", b === btn);
      });
      renderCardsGrid({ scrollEquipped: true });
    });
  });

  els.nameInput?.addEventListener("input", () => {
    updateNameMeta();
    renderPreview();
    renderCardsGrid();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !panelOpen) return;
    if (isDirty()) saveProfile({ closeAfter: true });
    else closeProfilePanel();
  });

  loadBattleCards().then(() => {
    applyHubProfileStyles();
  });
}