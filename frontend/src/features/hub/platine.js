import { addCurrency, updateHubCurrencyDisplay } from "./currency.js";
import { isCreatorMode } from "./creator-mode.js";
import { unlockLorus } from "./unlocks.js";
import {
  isPlatineLorusRevealPlaying,
  playPlatineLorusReveal,
} from "./platine-lorus-reveal.js";

const PLATINE_URL = "./data/platine.json";
const PERSOS_CATALOG = "./images/persos/persos.json";
export const STORAGE_STAR_POINTS = "guerre_star_points";
const STORAGE_CLAIMED = "guerre_platine_claimed";

let platineData = { name: "Platine", tiers: [] };
let onLorusRefresh = () => {};

function getClaimedSet() {
  try {
    const raw = localStorage.getItem(STORAGE_CLAIMED);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveClaimed(set) {
  localStorage.setItem(STORAGE_CLAIMED, JSON.stringify([...set]));
}

export function getStarPoints() {
  const n = Number(localStorage.getItem(STORAGE_STAR_POINTS) || "0");
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export function setStarPoints(value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  localStorage.setItem(STORAGE_STAR_POINTS, String(n));
  updateStarUi();
  return n;
}

export function addStarPoints(delta) {
  return setStarPoints(getStarPoints() + delta);
}

function tierState(tier) {
  const stars = getStarPoints();
  const claimed = getClaimedSet().has(tier.id);
  if (claimed) return "claimed";
  if (stars >= tier.stars) return "ready";
  return "locked";
}

function iconForTier(tier) {
  if (tier.type === "coins") return "◎";
  if (tier.type === "lorus") return "⚔";
  return "★";
}

function claimTier(tier) {
  if (tierState(tier) !== "ready") return false;
  const claimed = getClaimedSet();
  claimed.add(tier.id);
  saveClaimed(claimed);

  if (tier.type === "coins" && tier.amount) {
    addCurrency(tier.amount);
  }
  if (tier.type === "lorus" && tier.lorusId) {
    unlockLorus(tier.lorusId);
    onLorusRefresh();
  }
  updateHubCurrencyDisplay();
  return true;
}

async function loadPersoById(id) {
  try {
    const res = await fetch(`${PERSOS_CATALOG}?t=${Date.now()}`, { cache: "no-cache" });
    if (!res.ok) return null;
    const list = await res.json();
    return Array.isArray(list) ? list.find((p) => p.id === id) ?? null : null;
  } catch {
    return null;
  }
}

async function loadPlatine() {
  if (platineData.tiers.length) return platineData;
  try {
    const res = await fetch(`${PLATINE_URL}?t=${Date.now()}`, { cache: "no-cache" });
    if (!res.ok) return platineData;
    platineData = await res.json();
  } catch {
    /* garde le défaut */
  }
  return platineData;
}

function updateStarUi() {
  const el = document.getElementById("platine-stars");
  if (el) el.textContent = String(getStarPoints());
  const fill = document.getElementById("platine-progress-fill");
  const tiers = platineData.tiers;
  if (!fill || !tiers.length) return;
  const max = tiers[tiers.length - 1].stars || 1;
  const pct = Math.min(100, (getStarPoints() / max) * 100);
  fill.style.width = `${pct}%`;
}

function showPlatineToast(message) {
  const toast = document.getElementById("platine-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.remove("hidden");
  clearTimeout(showPlatineToast._t);
  showPlatineToast._t = setTimeout(() => {
    toast.hidden = true;
    toast.classList.add("hidden");
  }, 2800);
}

export async function renderPlatine() {
  await loadPlatine();
  updateStarUi();

  const track = document.getElementById("platine-track");
  const title = document.getElementById("platine-road-name");
  if (title && platineData.name) title.textContent = platineData.name;
  if (!track) return;

  track.replaceChildren();

  for (const tier of platineData.tiers) {
    const state = tierState(tier);
    const li = document.createElement("li");
    li.className = `platine-node platine-node--${state}`;
    li.dataset.tierId = tier.id;

    const starBadge = document.createElement("span");
    starBadge.className = "platine-node-stars";
    starBadge.textContent = `${tier.stars} ★`;

    const bubble = document.createElement("button");
    bubble.type = "button";
    bubble.className = "platine-node-bubble";
    bubble.disabled = state !== "ready";
    bubble.setAttribute(
      "aria-label",
      `Récompense ${tier.label}, ${tier.stars} points étoile`
    );
    if (tier.thumb) {
      const portrait = document.createElement("img");
      portrait.className = "platine-node-portrait";
      portrait.src = tier.thumb;
      portrait.alt = "";
      portrait.draggable = false;
      const label = document.createElement("span");
      label.className = "platine-node-label";
      label.textContent = tier.label;
      bubble.append(portrait, label);
    } else {
      bubble.innerHTML = `<span class="platine-node-icon" aria-hidden="true">${iconForTier(tier)}</span><span class="platine-node-label">${tier.label}</span>`;
    }

    if (state === "ready") {
      bubble.addEventListener("click", async () => {
        if (tierState(tier) !== "ready" || isPlatineLorusRevealPlaying()) return;

        if (tier.type === "lorus" && tier.lorusId) {
          const ch = await loadPersoById(tier.lorusId);
          if (ch) {
            await playPlatineLorusReveal({
              name: ch.name,
              src: ch.src,
              pixelSrc: ch.pixelSrc,
              classe: ch.classe,
            });
          }
        }

        if (claimTier(tier)) {
          showPlatineToast(`Récompense obtenue : ${tier.label} !`);
          renderPlatine();
        }
      });
    }

    li.append(starBadge, bubble);
    track.append(li);
  }

  const next = platineData.tiers.find((t) => tierState(t) === "locked");
  const hint = document.getElementById("platine-next-hint");
  if (hint) {
    hint.textContent = next
      ? `Prochain palier : ${next.stars} ★ — ${next.label}`
      : "Toutes les récompenses Platine sont réclamées.";
  }
}

export function syncPlatineCreatorUi() {
  const btn = document.getElementById("platine-debug-stars");
  if (!btn) return;
  const show = isCreatorMode();
  btn.hidden = !show;
  btn.classList.toggle("hidden", !show);
}

export function initPlatineUi({ onLorusRefresh: onLorus } = {}) {
  onLorusRefresh = onLorus ?? (() => {});

  document.getElementById("platine-debug-stars")?.addEventListener("click", () => {
    if (!isCreatorMode()) return;
    addStarPoints(10);
    renderPlatine();
  });

  if (!localStorage.getItem(STORAGE_STAR_POINTS)) {
    localStorage.setItem(STORAGE_STAR_POINTS, "0");
  }
}