import { LorusSparkBurst, lorusReducedMotion } from "./lorus-neon-sparks.js";

const RISE_MS = 980;
const BADGE_MS = 520;
const HOLD_MS = 620;
const OUTRO_MS = 340;

let playing = false;
let rootEl = null;
/** @type {LorusSparkBurst | null} */
let sparks = null;

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pulseHaptics() {
  if (lorusReducedMotion()) return;
  try {
    navigator.vibrate?.([10, 30, 14, 45, 18]);
  } catch {
    /* ignore */
  }
}

function ensureRoot() {
  if (rootEl) return rootEl;

  rootEl = document.createElement("div");
  rootEl.id = "platine-lorus-reveal";
  rootEl.className = "platine-lorus-reveal";
  rootEl.hidden = true;
  rootEl.setAttribute("role", "dialog");
  rootEl.setAttribute("aria-modal", "true");
  rootEl.setAttribute("aria-label", "Platine Lorus débloqué");

  const shimmer = document.createElement("div");
  shimmer.className = "platine-lorus-reveal__shimmer";
  shimmer.setAttribute("aria-hidden", "true");

  const canvas = document.createElement("canvas");
  canvas.className = "platine-lorus-reveal__canvas";
  canvas.setAttribute("aria-hidden", "true");

  const stars = document.createElement("div");
  stars.className = "platine-lorus-reveal__stars";
  stars.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 6; i++) {
    const ring = document.createElement("span");
    ring.className = "platine-lorus-reveal__star-ring";
    ring.style.setProperty("--platine-ring-i", String(i));
    stars.append(ring);
  }

  const flash = document.createElement("div");
  flash.className = "platine-lorus-reveal__flash";
  flash.setAttribute("aria-hidden", "true");

  const core = document.createElement("div");
  core.className = "platine-lorus-reveal__core";

  const heroWrap = document.createElement("div");
  heroWrap.className = "platine-lorus-reveal__hero-wrap";

  const hero = document.createElement("img");
  hero.className = "platine-lorus-reveal__hero";
  hero.alt = "";
  hero.width = 280;
  hero.height = 280;
  hero.draggable = false;

  heroWrap.append(hero);

  const badge = document.createElement("p");
  badge.className = "platine-lorus-reveal__badge";
  badge.textContent = "PLATINE LORUS";

  const name = document.createElement("p");
  name.className = "platine-lorus-reveal__name";

  const classe = document.createElement("p");
  classe.className = "platine-lorus-reveal__classe";

  core.append(heroWrap, badge, name, classe);
  rootEl.append(shimmer, canvas, stars, flash, core);
  document.body.append(rootEl);

  sparks = new LorusSparkBurst(canvas);

  rootEl._hero = hero;
  rootEl._name = name;
  rootEl._classe = classe;
  rootEl._flash = flash;

  return rootEl;
}

function resetState(root) {
  root.classList.remove(
    "platine-lorus-reveal--on",
    "platine-lorus-reveal--rise",
    "platine-lorus-reveal--badge",
    "platine-lorus-reveal--out"
  );
  root._flash?.classList.remove("platine-lorus-reveal__flash--hit");
}

function teardown(root) {
  if (!root) return;
  sparks?.stop();
  resetState(root);
  root.hidden = true;
  document.body.classList.remove("platine-lorus-reveal-open");
  playing = false;
}

export function isPlatineLorusRevealPlaying() {
  return playing;
}

/** Révélation Platine Lorus (route étoiles, Herminy…) — argent/étoiles, pas le néon Épique. */
export async function playPlatineLorusReveal({ name: charName, src, pixelSrc, classe: charClasse }) {
  if (playing) return;
  playing = true;

  const root = ensureRoot();
  const rm = lorusReducedMotion();

  try {
    resetState(root);

    const imgSrc = src || pixelSrc;
    root._hero.src = imgSrc || "";
    root._hero.classList.toggle(
      "platine-lorus-reveal__hero--pixel",
      Boolean(pixelSrc && imgSrc === pixelSrc)
    );

    root._name.textContent = charName || "Lorus";
    root._classe.textContent =
      charClasse === "defenseur" ? "Défenseur" : charClasse === "attaquant" ? "Attaquant" : "";

    root.hidden = false;
    document.body.classList.add("platine-lorus-reveal-open");

    sparks?.resize();
    sparks?.start();
    pulseHaptics();

    requestAnimationFrame(() => root.classList.add("platine-lorus-reveal--on"));

    await wait(rm ? 160 : 360);
    root.classList.add("platine-lorus-reveal--rise");
    sparks?.burst(rm ? 36 : 72);
    pulseHaptics();

    await wait(rm ? 280 : RISE_MS);
    root.classList.add("platine-lorus-reveal--badge");
    root._flash?.classList.add("platine-lorus-reveal__flash--hit");
    sparks?.burstAgain(rm ? 32 : 64);

    await wait(rm ? 220 : BADGE_MS + HOLD_MS);

    root.classList.add("platine-lorus-reveal--out");
    root.classList.remove(
      "platine-lorus-reveal--on",
      "platine-lorus-reveal--rise",
      "platine-lorus-reveal--badge"
    );
    sparks?.stop();
    await wait(rm ? 120 : OUTRO_MS);
  } finally {
    teardown(root);
  }
}