import { STARTER_CARD_COUNT, STARTER_LORUS_COUNT } from "./unlocks.js";

const PERSOS_URL = "./images/persos/persos.json";
const CARDS_URL = "./images/profile/battle-cards.json";
export const STORAGE_STARTER_REVEAL = "guerre_starter_reveal_done";

const TIMING = {
  intro: 420,
  item: 580,
  tagDelay: 380,
  section: 700,
  flash: 140,
  outro: 380,
};

let playing = false;

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function loadStarterData() {
  const [persosRes, cardsRes] = await Promise.all([
    fetch(PERSOS_URL, { cache: "no-cache" }),
    fetch(`${CARDS_URL}?t=${Date.now()}`, { cache: "no-cache" }),
  ]);
  const persos = persosRes.ok ? await persosRes.json() : [];
  const cards = cardsRes.ok ? await cardsRes.json() : [];
  return {
    lorus: (Array.isArray(persos) ? persos : []).slice(0, STARTER_LORUS_COUNT),
    cards: (Array.isArray(cards) ? cards : []).slice(0, STARTER_CARD_COUNT),
  };
}

function wait(ms) {
  const t = reducedMotion() ? Math.min(ms, 80) : ms;
  return new Promise((r) => setTimeout(r, t));
}

function pulseUnlock() {
  try {
    navigator.vibrate?.(12);
  } catch {
    /* ignore */
  }
}

function buildLorusItem(ch) {
  const el = document.createElement("div");
  el.className = "starter-reveal__item starter-reveal__lorus-item";

  const burst = document.createElement("span");
  burst.className = "starter-reveal__burst";
  burst.setAttribute("aria-hidden", "true");

  const ring = document.createElement("span");
  ring.className = "starter-reveal__ring";
  ring.setAttribute("aria-hidden", "true");

  const portrait = document.createElement("div");
  portrait.className = "starter-reveal__portrait";

  const img = document.createElement("img");
  img.src = ch.pixelSrc || ch.src;
  img.alt = "";
  img.width = 96;
  img.height = 96;
  img.draggable = false;
  if (ch.pixelSrc) img.classList.add("starter-reveal__img--pixel");
  portrait.append(img);

  if (ch.classe) {
    const classe = document.createElement("span");
    classe.className = "starter-reveal__classe";
    classe.textContent = ch.classe === "defenseur" ? "Défenseur" : "Attaquant";
    portrait.append(classe);
  }

  const tag = document.createElement("span");
  tag.className = "starter-reveal__tag";
  tag.textContent = "Débloqué !";

  const name = document.createElement("span");
  name.className = "starter-reveal__name";
  name.textContent = ch.name || "Lorus";

  el.append(burst, ring, portrait, tag, name);
  return el;
}

function buildCardItem(card) {
  const el = document.createElement("div");
  el.className = "starter-reveal__item starter-reveal__card-item";
  if (card.rarity) el.dataset.rarity = card.rarity;

  const burst = document.createElement("span");
  burst.className = "starter-reveal__burst";
  burst.setAttribute("aria-hidden", "true");

  const ring = document.createElement("span");
  ring.className = "starter-reveal__ring";
  ring.setAttribute("aria-hidden", "true");

  const frame = document.createElement("div");
  frame.className = "starter-reveal__card-frame";
  const shine = document.createElement("span");
  shine.className = "starter-reveal__card-shine";
  shine.setAttribute("aria-hidden", "true");
  const img = document.createElement("img");
  img.className = "starter-reveal__card-img";
  img.src = card.image || "";
  img.alt = "";
  img.draggable = false;
  frame.append(shine, img);

  const tag = document.createElement("span");
  tag.className = "starter-reveal__tag";
  tag.textContent = "Débloqué !";

  const name = document.createElement("span");
  name.className = "starter-reveal__name";
  name.textContent = card.title || "Carte";

  el.append(burst, ring, frame, tag, name);
  return el;
}

async function flashUnlock(root) {
  const flash = root.querySelector(".starter-reveal__flash");
  if (!flash) return;
  flash.classList.add("starter-reveal__flash--on");
  await wait(TIMING.flash);
  flash.classList.remove("starter-reveal__flash--on");
}

async function revealOne(root, item) {
  await flashUnlock(root);
  item.classList.add("starter-reveal__item--in");
  pulseUnlock();
  await wait(TIMING.tagDelay);
  item.classList.add("starter-reveal__item--tag");
  await wait(TIMING.item - TIMING.tagDelay);
}

async function runRevealSequence(root, { lorus, cards }) {
  const title = root.querySelector(".starter-reveal__title");
  const lead = root.querySelector(".starter-reveal__lead");
  const lorusBlock = root.querySelector(".starter-reveal__block--lorus");
  const cardsBlock = root.querySelector(".starter-reveal__block--cards");
  const goBtn = root.querySelector(".starter-reveal__go");

  title?.classList.add("starter-reveal__title--in");
  await wait(TIMING.intro * 0.55);
  lead?.classList.add("starter-reveal__lead--in");
  await wait(TIMING.intro * 0.45);

  lorusBlock?.classList.add("starter-reveal__block--visible");
  const lorusItems = [...lorusBlock?.querySelectorAll(".starter-reveal__item") ?? []];
  for (const item of lorusItems) {
    await revealOne(root, item);
  }

  await wait(TIMING.section);
  root.querySelector(".starter-reveal__divider")?.classList.add("starter-reveal__divider--on");
  cardsBlock?.classList.add("starter-reveal__block--visible");
  const cardItems = [...cardsBlock?.querySelectorAll(".starter-reveal__item") ?? []];
  for (const item of cardItems) {
    await revealOne(root, item);
  }

  root.classList.add("starter-reveal--ready");
  if (goBtn) {
    goBtn.disabled = false;
    goBtn.focus();
  }
}

/**
 * Cinématique de départ : 3 Lorus + 2 cartes (une fois par profil).
 */
export async function playStarterRevealIfNeeded() {
  if (playing) return;
  if (localStorage.getItem(STORAGE_STARTER_REVEAL) === "1") return;

  playing = true;

  let root = document.getElementById("starter-reveal");
  if (!root) {
    root = document.createElement("div");
    root.id = "starter-reveal";
    root.className = "starter-reveal";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "starter-reveal-title");
    root.hidden = true;
    document.body.append(root);
  }

  const { lorus, cards } = await loadStarterData();
  if (!lorus.length && !cards.length) {
    localStorage.setItem(STORAGE_STARTER_REVEAL, "1");
    playing = false;
    return;
  }

  root.replaceChildren();

  const backdrop = document.createElement("div");
  backdrop.className = "starter-reveal__backdrop";

  const sunburst = document.createElement("div");
  sunburst.className = "starter-reveal__sunburst";
  sunburst.setAttribute("aria-hidden", "true");

  const sparkles = document.createElement("div");
  sparkles.className = "starter-reveal__sparkles";
  sparkles.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("span");
    s.style.setProperty("--i", String(i));
    s.style.left = `${4 + i * 6.5}%`;
    s.style.top = `${8 + (i % 5) * 16}%`;
    sparkles.append(s);
  }

  const sheet = document.createElement("div");
  sheet.className = "starter-reveal__sheet";

  const flash = document.createElement("div");
  flash.className = "starter-reveal__flash";
  flash.setAttribute("aria-hidden", "true");

  const crown = document.createElement("p");
  crown.className = "starter-reveal__kicker";
  crown.textContent = "Bienvenue dans l’arène";

  const title = document.createElement("h2");
  title.id = "starter-reveal-title";
  title.className = "starter-reveal__title";
  title.textContent = "Tes déblocages";

  const lead = document.createElement("p");
  lead.className = "starter-reveal__lead";
  lead.innerHTML = `<strong>${STARTER_LORUS_COUNT} Lorus</strong> et <strong>${STARTER_CARD_COUNT} cartes</strong> pour débuter ton aventure`;

  const lorusBlock = document.createElement("section");
  lorusBlock.className = "starter-reveal__block starter-reveal__block--lorus";
  lorusBlock.setAttribute("aria-label", "Lorus débloqués");
  const lorusLabel = document.createElement("h3");
  lorusLabel.className = "starter-reveal__block-title";
  lorusLabel.innerHTML = '<span class="starter-reveal__icon" aria-hidden="true">⚔</span> Lorus';
  const lorusRow = document.createElement("div");
  lorusRow.className = "starter-reveal__row starter-reveal__row--lorus";
  for (const ch of lorus) lorusRow.append(buildLorusItem(ch));
  lorusBlock.append(lorusLabel, lorusRow);

  const divider = document.createElement("div");
  divider.className = "starter-reveal__divider";
  divider.setAttribute("aria-hidden", "true");

  const cardsBlock = document.createElement("section");
  cardsBlock.className = "starter-reveal__block starter-reveal__block--cards";
  cardsBlock.setAttribute("aria-label", "Cartes débloquées");
  const cardsLabel = document.createElement("h3");
  cardsLabel.className = "starter-reveal__block-title";
  cardsLabel.innerHTML = '<span class="starter-reveal__icon" aria-hidden="true">◆</span> Cartes de combat';
  const cardsRow = document.createElement("div");
  cardsRow.className = "starter-reveal__row starter-reveal__row--cards";
  for (const card of cards) cardsRow.append(buildCardItem(card));
  cardsBlock.append(cardsLabel, cardsRow);

  const goBtn = document.createElement("button");
  goBtn.type = "button";
  goBtn.className = "starter-reveal__go";
  goBtn.textContent = "C’est parti !";
  goBtn.disabled = true;

  sheet.append(flash, crown, title, lead, lorusBlock, divider, cardsBlock, goBtn);
  root.append(backdrop, sunburst, sparkles, sheet);

  const finish = async () => {
    root.classList.add("starter-reveal--out");
    await wait(TIMING.outro);
    localStorage.setItem(STORAGE_STARTER_REVEAL, "1");
    root.classList.remove("starter-reveal--on", "starter-reveal--ready", "starter-reveal--out");
    root.hidden = true;
    document.body.classList.remove("starter-reveal-open");
    playing = false;
  };

  goBtn.addEventListener("click", () => finish(), { once: true });

  root.hidden = false;
  document.body.classList.add("starter-reveal-open");

  requestAnimationFrame(() => {
    root.classList.add("starter-reveal--on");
  });

  if (reducedMotion()) {
    root.querySelectorAll(".starter-reveal__item").forEach((item) => {
      item.classList.add("starter-reveal__item--in", "starter-reveal__item--tag");
    });
    lorusBlock.classList.add("starter-reveal__block--visible");
    root.querySelector(".starter-reveal__divider")?.classList.add("starter-reveal__divider--on");
    cardsBlock.classList.add("starter-reveal__block--visible");
    root.classList.add("starter-reveal--ready");
    title.classList.add("starter-reveal__title--in");
    lead.classList.add("starter-reveal__lead--in");
    goBtn.disabled = false;
    goBtn.focus();
    return;
  }

  await runRevealSequence(root, { lorus, cards });
}