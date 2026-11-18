const TUTO_LINES = [
  {
    message:
      "Salut ! Moi c'est ton robot guide. On va apprendre **Guerre**, le classique duel de cartes — et tu verras tout de suite si tu peux installer le jeu sur ton appareil.",
    step: -1,
  },
  {
    message:
      "L'objectif est simple : récupérer **toutes** les cartes. Tu joues contre l'autre joueur (ou l'ordinateur plus tard). Pas de stratégie compliquée — juste la chance et les batailles !",
    step: 0,
  },
  {
    message:
      "Au début, le paquet est coupé en deux. Tu ne regardes pas tes cartes : tu retournes toujours celle du **dessus** quand c'est ton tour.",
    step: 1,
  },
  {
    message:
      "As bat Roi, Roi bat Dame… Dans notre version on suit l'ordre classique. La plus haute carte **gagne** le pli et rammasse les deux cartes sous son paquet.",
    step: 2,
  },
  {
    message:
      "Même valeur ? C'est la **bataille** ! Chacun pose une carte face cachée, puis une face visible. Le gagnant prend toutes les cartes en jeu. Parfois ça enchaîne !",
    step: 3,
  },
  {
    message:
      "Quand tu n'as plus de cartes, tu perds. Quand l'autre n'en a plus, tu gagnes. Installe **Guerre** pour retrouver ce tuto et le duel même sans connexion.",
    step: 4,
  },
];

let tutoIndex = 0;
let deferredPrompt = null;

const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const btnInstall = document.getElementById("btn-install");
const installHint = document.getElementById("install-hint");
const robotMessage = document.getElementById("robot-message");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const stepsList = document.getElementById("steps");

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.navigator.standalone === true
  );
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function formatRobotText(text) {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function highlightStep(index) {
  const items = stepsList.querySelectorAll("li");
  items.forEach((li, i) => {
    li.classList.toggle("active-step", i === index);
  });
}

function showTutoSlide(index) {
  tutoIndex = index;
  const slide = TUTO_LINES[index];
  robotMessage.innerHTML = formatRobotText(slide.message);
  if (slide.step >= 0) highlightStep(slide.step);
  else stepsList.querySelectorAll("li").forEach((li) => li.classList.remove("active-step"));

  btnPrev.disabled = index === 0;
  btnNext.textContent = index === TUTO_LINES.length - 1 ? "Recommencer" : "Suite du tuto";
}

function setInstallState({ kind, title, hint, showButton }) {
  statusDot.classList.remove("ok", "warn");
  statusDot.classList.add(kind === "ok" ? "ok" : kind === "warn" ? "warn" : "");

  statusText.textContent = title;

  if (showButton && deferredPrompt) {
    btnInstall.classList.remove("hidden");
    btnInstall.disabled = false;
  } else {
    btnInstall.classList.add("hidden");
  }

  if (hint) {
    installHint.textContent = hint;
    installHint.classList.remove("hidden");
  } else {
    installHint.classList.add("hidden");
  }
}

async function refreshInstallUI() {
  if (isStandalone()) {
    setInstallState({
      kind: "ok",
      title: "Guerre est déjà installé — tu peux jouer depuis ton écran d'accueil.",
      hint: null,
      showButton: false,
    });
    return;
  }

  if (deferredPrompt) {
    setInstallState({
      kind: "ok",
      title: "Bonne nouvelle : tu peux installer Guerre sur cet appareil.",
      hint: "Appuie sur le bouton doré pour ajouter l'application.",
      showButton: true,
    });
    return;
  }

  if (isIos()) {
    setInstallState({
      kind: "warn",
      title: "Sur iPhone/iPad, l'installation passe par Safari.",
      hint: "Ouvre ce site dans Safari, puis Partager → « Sur l'écran d'accueil ».",
      showButton: false,
    });
    return;
  }

  const isSecure =
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  if (!isSecure) {
    setInstallState({
      kind: "warn",
      title: "Pour proposer l'installation, ouvre Guerre en HTTPS ou en local.",
      hint: "Une fois en ligne (GitHub Pages ou autre), le bouton Install apparaîtra ici.",
      showButton: false,
    });
    return;
  }

  if (!("serviceWorker" in navigator)) {
    setInstallState({
      kind: "warn",
      title: "Ce navigateur ne gère pas l'installation d'applications web.",
      hint: "Essaie Chrome, Edge ou un navigateur récent sur mobile.",
      showButton: false,
    });
    return;
  }

  setInstallState({
    kind: "warn",
    title: "Installation pas encore disponible ici (visite une 2ᵉ fois ou utilise le menu du navigateur).",
    hint: "Chrome/Edge : menu ⋮ → « Installer Guerre » ou « Ajouter à l'écran d'accueil ».",
    showButton: false,
  });
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  refreshInstallUI();
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  refreshInstallUI();
  robotMessage.innerHTML =
    "Installé ! <strong>Guerre</strong> est sur ton écran d'accueil. À bientôt pour le duel.";
});

btnInstall.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  if (outcome === "accepted") {
    refreshInstallUI();
  } else {
    await refreshInstallUI();
  }
});

btnPrev.addEventListener("click", () => {
  if (tutoIndex > 0) showTutoSlide(tutoIndex - 1);
});

btnNext.addEventListener("click", () => {
  if (tutoIndex < TUTO_LINES.length - 1) {
    showTutoSlide(tutoIndex + 1);
  } else {
    showTutoSlide(0);
  }
});

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  } catch (err) {
    console.warn("Service worker:", err);
  }
}

registerServiceWorker();
showTutoSlide(0);

window.addEventListener("load", () => {
  setTimeout(refreshInstallUI, 400);
});