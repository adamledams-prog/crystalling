import { runBootSync } from "./boot-sync.js";
import { initAppUpdateUi } from "./app-update.js";
import { isMegaAnimPlaying, playMegaCharReveal } from "./features/lorus/mega-anim.js";
import { getSavedPseudo, setSavedPseudo } from "./features/profile/profile-store.js";
import { initProfileUi, updateHubProfileDisplay } from "./features/profile/profile.js";
import { initHubCurrency } from "./features/hub/currency.js";
import { initHubKeys } from "./features/hub/shop-keys.js";
import { initShopUi, refreshShopUi } from "./features/hub/shop.js";
import {
  disableCreatorMode,
  enableCreatorMode,
  initCreatorCodeUi,
  initCreatorModeFromStorage,
  isCreatorMode,
} from "./features/hub/creator-mode.js";
import { isLorusUnlocked } from "./features/hub/unlocks.js";
import { playStarterRevealIfNeeded } from "./features/hub/starter-reveal.js";
import { closeProfilePanel, refreshProfileUnlocks } from "./features/profile/profile.js";

const STORAGE_TUTO_STEP = "guerre_tuto_step";
const STORAGE_INSTALLED = "guerre_installed";

let deferredPrompt = null;

const btnInstall = document.getElementById("btn-install");
const installHint = document.getElementById("install-hint");
const installBlock = document.getElementById("install-block");
const robotMessage = document.getElementById("robot-message");
const tutoPseudoForm = document.getElementById("tuto-pseudo");
const pseudoInput = document.getElementById("pseudo-input");
const screenOnboarding = document.getElementById("screen-onboarding");
const screenHome = document.getElementById("screen-home");
const screenShop = document.getElementById("screen-shop");
const lorusPanel = document.getElementById("lorus-panel");
const lorusGrid = document.getElementById("lorus-grid");
const lorusEmpty = document.getElementById("lorus-empty");

const MSG = {
  default: "Salut ! Installe l'application pour jouer à <strong>Guerre</strong>.",
  canInstall: "Tu peux installer l'app maintenant — clique sur le bouton juste en dessous !",
  refused: "Pas de souci. Tu pourras installer plus tard avec le bouton ou le menu du navigateur.",
  ios: "Sur iPhone ou iPad : dans Safari, touche <strong>Partager</strong> puis « Sur l'écran d'accueil ».",
  noHttps:
    "Pour installer, ouvre le site en HTTPS (par ex. une fois qu'il est en ligne sur GitHub).",
  noSw: "Utilise Chrome ou Edge pour pouvoir installer l'application.",
  hintMenu: "Menu du navigateur → Installer Guerre.",
  tutoWelcome: "Parfait, tu es sur l'application ! On commence le tutoriel.",
  tutoPseudo:
    "Parfait, écris ton <strong>pseudo</strong> — c'est comme ça que les autres te verront.",
  tutoPseudoOk: (name) =>
    `Nickel, <strong>${escapeHtml(name)}</strong> ! Bienvenue dans l'arène. Tourne en paysage et appuie sur <strong>Jouer</strong> quand tu veux.`,
  tutoWelcomeBack: (name) =>
    `Re-bienvenue <strong>${escapeHtml(name)}</strong> !`,
};

const TUTO_STEP_PSEUDO_DONE = 1;
const APP_WATCH_MS = 10_000;

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.navigator.standalone === true
  );
}

function isDevAppBypass() {
  const params = new URLSearchParams(location.search);
  if (params.get("app") !== "1") return false;
  const host = location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

/** Vrai uniquement si l’app est ouverte depuis l’icône (PWA), pas l’onglet navigateur. */
function isOnGuerreApp() {
  return isStandaloneDisplay() || isDevAppBypass();
}

function isInstallRemembered() {
  return localStorage.getItem(STORAGE_INSTALLED) === "1";
}

function rememberInstalled() {
  localStorage.setItem(STORAGE_INSTALLED, "1");
}

/** Tutoriel / menu : PWA installée ou mode créateur (code 5555). */
function isTutoUnlocked() {
  return isOnGuerreApp() || isCreatorMode();
}

function enterCreatorLobby() {
  enableCreatorMode();
  if (!getSavedPseudo()) {
    setSavedPseudo("Créateur");
    localStorage.setItem(STORAGE_TUTO_STEP, String(TUTO_STEP_PSEUDO_DONE));
  } else if (Number(localStorage.getItem(STORAGE_TUTO_STEP) || "0") < TUTO_STEP_PSEUDO_DONE) {
    localStorage.setItem(STORAGE_TUTO_STEP, String(TUTO_STEP_PSEUDO_DONE));
  }
  updateHubProfileDisplay();
  refreshProfileUnlocks();
  renderLorusGrid();
  showHomeScreen();
}

function exitCreatorLobby() {
  disableCreatorMode();
  refreshProfileUnlocks();
  renderLorusGrid();
  refreshInstallUI();
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function say(html) {
  robotMessage.innerHTML = html;
}

function showInstallButton(show) {
  btnInstall.classList.toggle("hidden", !show);
  btnInstall.disabled = !show;
}

function setHint(text) {
  if (text) {
    installHint.textContent = text;
    installHint.classList.remove("hidden");
  } else {
    installHint.classList.add("hidden");
  }
}

function getTutoStep() {
  return Number(localStorage.getItem(STORAGE_TUTO_STEP) || "0");
}

function isTutoComplete() {
  return Boolean(getSavedPseudo()) && getTutoStep() >= TUTO_STEP_PSEUDO_DONE;
}

function showScreen(which) {
  const onboarding = which === "onboarding";
  const home = which === "home";
  const shop = which === "shop";

  document.body.classList.toggle("mode-onboarding", onboarding);
  document.body.classList.toggle("mode-home", home);
  document.body.classList.toggle("mode-shop", shop);

  screenOnboarding.classList.toggle("hidden", !onboarding);
  screenOnboarding.hidden = !onboarding;
  screenHome.classList.toggle("hidden", !home);
  screenHome.hidden = !home;
  screenShop?.classList.toggle("hidden", !shop);
  if (screenShop) screenShop.hidden = !shop;
}

function showShopScreen() {
  const lorusPanel = document.getElementById("lorus-panel");
  if (lorusPanel && !lorusPanel.hidden) {
    lorusPanel.classList.add("hidden");
    lorusPanel.hidden = true;
  }
  closeProfilePanel();
  showScreen("shop");
  tryLockLandscape();
  refreshShopUi();
}

function showHomeFromShop() {
  showScreen("home");
  tryLockLandscape();
}

function updateHomeProfile() {
  updateHubProfileDisplay();
}

async function showHomeScreen() {
  updateHomeProfile();
  showScreen("home");
  tryLockLandscape();
  await playStarterRevealIfNeeded();
}

function showOnboardingScreen() {
  showScreen("onboarding");
}

async function tryLockLandscape() {
  if (!screenOrientation?.lock) return;
  try {
    await screen.orientation.lock("landscape");
  } catch {
    /* navigateurs / iOS souvent bloquent avant geste utilisateur */
  }
}

const STORAGE_LORUS = "guerre_lorus_chars";
const PERSOS_CATALOG = "./images/persos/persos.json";

let catalogPersos = [];
let lorusClasseFilter = "all";

function getExtraLorusCharacters() {
  try {
    const raw = localStorage.getItem(STORAGE_LORUS);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function mergeLorusCharacters() {
  const byKey = new Map();
  for (const ch of catalogPersos) {
    const key = ch.id || ch.src;
    byKey.set(key, ch);
  }
  for (const ch of getExtraLorusCharacters()) {
    const key = ch.id || ch.src;
    byKey.set(key, ch);
  }
  return [...byKey.values()];
}

async function loadPersosCatalog() {
  try {
    const res = await fetch(PERSOS_CATALOG, { cache: "no-cache" });
    if (!res.ok) return;
    const data = await res.json();
    catalogPersos = Array.isArray(data) ? data : [];
  } catch {
    catalogPersos = [];
  }
}

function matchesLorusFilter(ch) {
  if (lorusClasseFilter === "all") return true;
  return ch.classe === lorusClasseFilter;
}

function setLorusClasseFilter(next) {
  lorusClasseFilter = next;
  document.querySelectorAll("[data-lorus-filter]").forEach((btn) => {
    const active = btn.dataset.lorusFilter === next;
    btn.classList.toggle("lorus-filter--active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
  renderLorusGrid();
}

function renderLorusGrid() {
  const chars = mergeLorusCharacters().filter(matchesLorusFilter);
  lorusGrid.querySelectorAll(".lorus-card").forEach((el) => el.remove());

  if (chars.length === 0) {
    lorusEmpty.classList.remove("hidden");
    lorusEmpty.textContent =
      lorusClasseFilter === "all"
        ? "Aucun perso pour l’instant — ajoute-les ici bientôt."
        : "Aucun personnage dans cette classe pour l’instant.";
    return;
  }

  lorusEmpty.classList.add("hidden");

  for (const ch of chars) {
    const lorusId = ch.id || ch.src;
    const catalogIndex = catalogPersos.findIndex((p) => (p.id || p.src) === lorusId);
    const unlocked = isLorusUnlocked(lorusId, catalogIndex);

    const li = document.createElement("li");
    li.className = "lorus-card";
    if (!unlocked) li.classList.add("lorus-card--locked");
    li.tabIndex = unlocked ? 0 : -1;
    li.setAttribute("role", "button");
    const name = ch.name || "Personnage";
    li.setAttribute(
      "aria-label",
      unlocked ? `Voir ${name}` : `${name} — verrouillé`
    );
    if (!unlocked) li.setAttribute("aria-disabled", "true");

    const thumbSrc = ch.pixelSrc || ch.src;
    const img = document.createElement("img");
    img.src = thumbSrc;
    img.alt = "";
    img.width = 96;
    img.height = 96;
    img.draggable = false;
    if (ch.pixelSrc) img.classList.add("lorus-card-img--pixel");

    const label = document.createElement("span");
    label.className = "lorus-card-name";
    label.textContent = unlocked ? name : "???";

    if (ch.classe) li.dataset.classe = ch.classe;

    if (!unlocked) {
      const lock = document.createElement("span");
      lock.className = "lorus-card-lock";
      lock.setAttribute("aria-hidden", "true");
      lock.textContent = "🔒";
      li.append(img, lock, label);
    } else {
      const runReveal = () => {
        if (isMegaAnimPlaying()) return;
        const hubFelt = document.querySelector(".hub-felt");
        if (!hubFelt) return;

        playMegaCharReveal({
          id: ch.id,
          classe: ch.classe,
          name: ch.name,
          hubFelt,
          onCloseLorus: closeLorusPanel,
          fullSrc: ch.src,
        });
      };

      li.addEventListener("click", runReveal);
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          runReveal();
        }
      });

      li.append(img, label);
    }

    lorusGrid.append(li);
  }
}

async function openLorusPanel() {
  await loadPersosCatalog();
  renderLorusGrid();
  lorusPanel.classList.remove("hidden");
  lorusPanel.hidden = false;
  document.getElementById("lorus-close")?.focus();
}

function closeLorusPanel() {
  lorusPanel.classList.add("hidden");
  lorusPanel.hidden = true;
  document.getElementById("btn-lorus")?.focus();
}

function showPseudoForm(show) {
  tutoPseudoForm.classList.toggle("hidden", !show);
  if (show) {
    const saved = getSavedPseudo();
    if (saved) pseudoInput.value = saved;
    setTimeout(() => pseudoInput.focus(), 100);
  }
}

function startTuto({ justInstalled = false } = {}) {
  installBlock.classList.add("hidden");
  setHint(null);
  showInstallButton(false);

  const pseudo = getSavedPseudo();
  const step = Number(localStorage.getItem(STORAGE_TUTO_STEP) || "0");

  if (pseudo && step >= TUTO_STEP_PSEUDO_DONE) {
    showHomeScreen();
    return;
  }

  if (pseudo && step === 0) {
    say(MSG.tutoPseudo);
    showPseudoForm(true);
    return;
  }

  if (justInstalled || step === 0) {
    if (isStandaloneDisplay() && !justInstalled) {
      say(`${MSG.tutoWelcome}<br><br>${MSG.tutoPseudo}`);
    } else {
      say(MSG.tutoPseudo);
    }
    showPseudoForm(true);
  }
}

function showInstallRequiredUI() {
  showOnboardingScreen();
  installBlock.classList.remove("hidden");
  showPseudoForm(false);

  if (deferredPrompt) {
    say(MSG.canInstall);
    showInstallButton(true);
    setHint(null);
    return true;
  }

  say(MSG.default);
  showInstallButton(false);

  if (isIos()) {
    say(MSG.ios);
    setHint(null);
    return;
  }

  const isSecure =
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  if (!isSecure) {
    say(MSG.noHttps);
    setHint(null);
    return;
  }

  if (!("serviceWorker" in navigator)) {
    say(MSG.noSw);
    setHint(null);
    return;
  }

  setHint(MSG.hintMenu);
  return true;
}

function refreshInstallUI(opts) {
  if (!isTutoUnlocked()) {
    if (!lorusPanel.hidden) closeLorusPanel();
    showInstallRequiredUI();
    return;
  }

  if (isTutoComplete()) {
    showHomeScreen();
    return;
  }

  showOnboardingScreen();
  startTuto(opts);
}

function enforceAppPresence() {
  refreshInstallUI();
}

tutoPseudoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = pseudoInput.value.trim();
  if (raw.length < 2) {
    say(`${MSG.tutoPseudo}<br><br><em>Il faut au moins 2 lettres.</em>`);
    pseudoInput.focus();
    return;
  }
  if (raw.length > 20) {
    say(`${MSG.tutoPseudo}<br><br><em>20 caractères maximum.</em>`);
    return;
  }

  setSavedPseudo(raw);
  localStorage.setItem(STORAGE_TUTO_STEP, String(TUTO_STEP_PSEUDO_DONE));
  showPseudoForm(false);
  say(MSG.tutoPseudoOk(raw));
  setTimeout(() => showHomeScreen(), 1400);
});

document.getElementById("btn-jouer")?.addEventListener("click", () => {
  tryLockLandscape();
});

document.getElementById("btn-lorus")?.addEventListener("click", () => {
  openLorusPanel();
});

document.getElementById("lorus-close")?.addEventListener("click", () => {
  closeLorusPanel();
});

document.getElementById("lorus-backdrop")?.addEventListener("click", () => {
  closeLorusPanel();
});

document.querySelectorAll("[data-lorus-filter]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.lorusFilter;
    if (next) setLorusClasseFilter(next);
  });
});

document.getElementById("btn-amis")?.addEventListener("click", () => {
  /* amis : à venir */
});

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  refreshInstallUI();
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  rememberInstalled();
  refreshInstallUI({ justInstalled: true });
});

btnInstall.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  if (outcome === "dismissed") say(MSG.refused);
  refreshInstallUI();
});

async function syncInstalledState() {
  if (isInstallRemembered() || isOnGuerreApp()) return;
  if (!("getInstalledRelatedApps" in navigator)) return;
  try {
    const related = await navigator.getInstalledRelatedApps();
    if (related.length > 0) {
      rememberInstalled();
    }
  } catch {
    /* ignore */
  }
}

function watchStandaloneMode() {
  const mq = window.matchMedia("(display-mode: standalone)");
  const onChange = () => {
    if (mq.matches) refreshInstallUI();
  };
  if (mq.addEventListener) mq.addEventListener("change", onChange);
  else mq.addListener(onChange);
}

watchStandaloneMode();

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") enforceAppPresence();
});

window.addEventListener("load", async () => {
  await runBootSync();
  await loadPersosCatalog();
  await syncInstalledState();
  initCreatorModeFromStorage();
  if (isCreatorMode()) enterCreatorLobby();
  refreshInstallUI();
  initAppUpdateUi();
  initProfileUi();
  initHubCurrency();
  initHubKeys();
  initShopUi({
    openShop: showShopScreen,
    closeShop: showHomeFromShop,
    onLorusRefresh: () => renderLorusGrid(),
    onProfileUnlockRefresh: () => refreshProfileUnlocks(),
  });
  initCreatorCodeUi({
    onEnter: enterCreatorLobby,
    onExit: exitCreatorLobby,
  });
  setInterval(enforceAppPresence, APP_WATCH_MS);
});