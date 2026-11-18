const STORAGE_PSEUDO = "guerre_pseudo";
const STORAGE_TUTO_STEP = "guerre_tuto_step";
const STORAGE_INSTALLED = "guerre_installed";

let deferredPrompt = null;

const btnInstall = document.getElementById("btn-install");
const installHint = document.getElementById("install-hint");
const installBlock = document.getElementById("install-block");
const robotMessage = document.getElementById("robot-message");
const tutoPseudoForm = document.getElementById("tuto-pseudo");
const pseudoInput = document.getElementById("pseudo-input");

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
    `Nickel, <strong>${escapeHtml(name)}</strong> ! La suite du tuto arrive très bientôt.`,
  tutoWelcomeBack: (name) =>
    `Re-bienvenue <strong>${escapeHtml(name)}</strong> ! On reprend le tutoriel bientôt.`,
};

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

function isInApp() {
  if (isStandaloneDisplay()) return true;
  const params = new URLSearchParams(location.search);
  return params.get("app") === "1";
}

function isInstallRemembered() {
  return localStorage.getItem(STORAGE_INSTALLED) === "1";
}

function rememberInstalled() {
  localStorage.setItem(STORAGE_INSTALLED, "1");
}

/** Tutoriel accessible : app lancée depuis l’icône ou installation tout juste faite. */
function isTutoUnlocked() {
  return isInApp() || isInstallRemembered();
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

function getSavedPseudo() {
  const p = localStorage.getItem(STORAGE_PSEUDO);
  return p && p.trim() ? p.trim() : null;
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

  if (pseudo && step > 0) {
    say(MSG.tutoWelcomeBack(pseudo));
    showPseudoForm(false);
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

function refreshInstallUI(opts) {
  if (isTutoUnlocked()) {
    startTuto(opts);
    return;
  }

  installBlock.classList.remove("hidden");
  showPseudoForm(false);

  if (deferredPrompt) {
    say(MSG.canInstall);
    showInstallButton(true);
    setHint(null);
    return;
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

  localStorage.setItem(STORAGE_PSEUDO, raw);
  localStorage.setItem(STORAGE_TUTO_STEP, "1");
  showPseudoForm(false);
  say(MSG.tutoPseudoOk(raw));
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

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  } catch (err) {
    console.warn("Service worker:", err);
  }
}

async function syncInstalledState() {
  if (isInstallRemembered() || isInApp()) return;
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

registerServiceWorker();
watchStandaloneMode();
window.addEventListener("load", async () => {
  await syncInstalledState();
  setTimeout(() => refreshInstallUI(), 400);
});