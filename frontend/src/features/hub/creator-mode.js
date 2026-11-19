import { updateHubCurrencyDisplay } from "./currency.js";

export const STORAGE_CREATOR = "guerre_creator_mode";
const CREATOR_CODE = "5555";

export function isCreatorMode() {
  return localStorage.getItem(STORAGE_CREATOR) === "1";
}

export function enableCreatorMode() {
  localStorage.setItem(STORAGE_CREATOR, "1");
  document.body.classList.add("mode-creator");
  updateCreatorBadge(true);
  syncCreatorNavUi();
  updateHubCurrencyDisplay();
}

export function disableCreatorMode() {
  localStorage.removeItem(STORAGE_CREATOR);
  document.body.classList.remove("mode-creator");
  updateCreatorBadge(false);
  syncCreatorNavUi();
  updateHubCurrencyDisplay();
}

/** Futur système de déblocage : tout est accessible en mode créateur. */
export function hasFullUnlock() {
  return isCreatorMode();
}

/** Déblocage fin : utiliser unlocks.js (Lorus, cartes). */
export function isUnlocked(_itemId) {
  return hasFullUnlock();
}

function updateCreatorBadge(show) {
  const badge = document.getElementById("hub-creator-badge");
  if (!badge) return;
  badge.classList.toggle("hidden", !show);
  badge.hidden = !show;
}

export function syncCreatorNavUi() {
  const on = isCreatorMode();
  document.querySelectorAll("[data-open-code]").forEach((btn) => {
    btn.hidden = on;
    btn.classList.toggle("hidden", on);
  });
  const exitBtn = document.getElementById("btn-creator-exit");
  if (exitBtn) {
    exitBtn.hidden = !on;
    exitBtn.classList.toggle("hidden", !on);
  }
}

export function initCreatorModeFromStorage() {
  if (!isCreatorMode()) {
    syncCreatorNavUi();
    return;
  }
  document.body.classList.add("mode-creator");
  updateCreatorBadge(true);
  syncCreatorNavUi();
}

export function initCreatorCodeUi({ onEnter, onExit } = {}) {
  const panel = document.getElementById("code-panel");
  const backdrop = document.getElementById("code-backdrop");
  const input = document.getElementById("code-input");
  const hint = document.getElementById("code-hint");
  const form = document.getElementById("code-form");

  const closePanel = () => {
    panel?.classList.add("hidden");
    if (panel) panel.hidden = true;
    if (hint) {
      hint.textContent = "";
      hint.classList.add("hidden");
    }
    if (input) input.value = "";
  };

  const openPanel = () => {
    if (isCreatorMode()) return;
    panel?.classList.remove("hidden");
    if (panel) panel.hidden = false;
    setTimeout(() => input?.focus(), 80);
  };

  document.querySelectorAll("[data-open-code]").forEach((btn) => {
    btn.addEventListener("click", openPanel);
  });

  document.getElementById("code-close")?.addEventListener("click", closePanel);
  backdrop?.addEventListener("click", closePanel);

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = input?.value.trim() ?? "";
    if (raw === CREATOR_CODE) {
      closePanel();
      onEnter?.();
      return;
    }
    if (hint) {
      hint.textContent = "Code incorrect.";
      hint.classList.remove("hidden");
    }
    input?.focus();
    input?.select();
  });

  document.getElementById("btn-creator-exit")?.addEventListener("click", () => {
    onExit?.();
  });
}