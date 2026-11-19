import { addCurrency } from "./currency.js";
import { hasFullUnlock, isCreatorMode } from "./creator-mode.js";

const ROAD_URL = "./data/reward-road.json";
const STORAGE_TROPHIES = "guerre_trophies";
const STORAGE_CLAIMED = "guerre_rewards_claimed";

let roadData = { name: "Route royale", tiers: [] };

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

export function getTrophies() {
  const n = Number(localStorage.getItem(STORAGE_TROPHIES) || "0");
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export function setTrophies(value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  localStorage.setItem(STORAGE_TROPHIES, String(n));
  updateTrophyUi();
  return n;
}

export function addTrophies(delta) {
  return setTrophies(getTrophies() + delta);
}

function tierState(tier) {
  const trophies = getTrophies();
  const claimed = getClaimedSet().has(tier.id);
  const unlocked = hasFullUnlock() || trophies >= tier.trophies;
  if (claimed) return "claimed";
  if (unlocked) return "ready";
  return "locked";
}

function claimTier(tier) {
  if (tierState(tier) !== "ready") return false;
  const claimed = getClaimedSet();
  claimed.add(tier.id);
  saveClaimed(claimed);
  if (tier.type === "coins" && tier.amount) addCurrency(tier.amount);
  return true;
}

function iconForTier(tier) {
  if (tier.type === "coins") return "◎";
  if (tier.type === "chest") {
    if (tier.chest === "legend") return "★";
    if (tier.chest === "gold") return "♦";
    return "▣";
  }
  return "◆";
}

async function loadRoad() {
  if (roadData.tiers.length) return roadData;
  try {
    const res = await fetch(`${ROAD_URL}?t=${Date.now()}`, { cache: "no-cache" });
    if (!res.ok) return roadData;
    roadData = await res.json();
  } catch {
    /* garde le défaut vide */
  }
  return roadData;
}

function updateTrophyUi() {
  const el = document.getElementById("reward-trophies");
  if (el) el.textContent = String(getTrophies());
  const fill = document.getElementById("reward-progress-fill");
  const tiers = roadData.tiers;
  if (!fill || !tiers.length) return;
  const max = tiers[tiers.length - 1].trophies || 1;
  const pct = Math.min(100, (getTrophies() / max) * 100);
  fill.style.width = `${pct}%`;
}

export async function renderRewardRoad() {
  await loadRoad();
  updateTrophyUi();

  const track = document.getElementById("reward-track");
  const title = document.getElementById("reward-road-name");
  if (title && roadData.name) title.textContent = roadData.name;
  if (!track) return;

  track.replaceChildren();

  for (const tier of roadData.tiers) {
    const state = tierState(tier);
    const li = document.createElement("li");
    li.className = `reward-node reward-node--${state}`;
    li.dataset.tierId = tier.id;

    const trophy = document.createElement("span");
    trophy.className = "reward-node-trophies";
    trophy.textContent = String(tier.trophies);

    const bubble = document.createElement("button");
    bubble.type = "button";
    bubble.className = "reward-node-bubble";
    bubble.disabled = state !== "ready";
    bubble.setAttribute("aria-label", `Récompense ${tier.label}, ${tier.trophies} trophées`);
    bubble.innerHTML = `<span class="reward-node-icon" aria-hidden="true">${iconForTier(tier)}</span><span class="reward-node-label">${tier.label}</span>`;

    if (state === "ready") {
      bubble.addEventListener("click", () => {
        if (claimTier(tier)) renderRewardRoad();
      });
    }

    li.append(trophy, bubble);
    track.append(li);
  }

  const next = roadData.tiers.find((t) => tierState(t) === "locked");
  const hint = document.getElementById("reward-next-hint");
  if (hint) {
    hint.textContent = next
      ? `Prochain palier : ${next.trophies} trophées — ${next.label}`
      : "Toutes les récompenses de cette route sont réclamées.";
  }
}

export function syncRewardCreatorUi() {
  const btn = document.getElementById("reward-debug-trophies");
  if (!btn) return;
  const show = isCreatorMode();
  btn.hidden = !show;
  btn.classList.toggle("hidden", !show);
}

export function initRewardRoadUi() {
  document.getElementById("reward-debug-trophies")?.addEventListener("click", () => {
    if (!isCreatorMode()) return;
    addTrophies(10);
    renderRewardRoad();
  });

  if (!localStorage.getItem(STORAGE_TROPHIES)) {
    localStorage.setItem(STORAGE_TROPHIES, "0");
  }
}