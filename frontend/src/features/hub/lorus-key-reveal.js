import { LorusSparkBurst, lorusReducedMotion } from "./lorus-neon-sparks.js";

const GROW_MS = 2100;
const HOLD_MS = 620;
const FLY_MS = 860;
const OUTRO_MS = 400;

let playing = false;
let rootEl = null;
/** @type {LorusSparkBurst | null} */
let sparks = null;

function reducedMotion() {
  return lorusReducedMotion();
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureRoot() {
  if (rootEl) return rootEl;

  rootEl = document.createElement("div");
  rootEl.id = "lorus-key-reveal";
  rootEl.className = "lorus-key-reveal";
  rootEl.hidden = true;
  rootEl.setAttribute("role", "dialog");
  rootEl.setAttribute("aria-modal", "true");
  rootEl.setAttribute("aria-label", "Nouveau Lorus débloqué");

  const vignette = document.createElement("div");
  vignette.className = "lorus-key-reveal__vignette";
  vignette.setAttribute("aria-hidden", "true");

  const bg = document.createElement("div");
  bg.className = "lorus-key-reveal__bg";
  bg.setAttribute("aria-hidden", "true");

  const rays = document.createElement("div");
  rays.className = "lorus-key-reveal__rays";
  rays.setAttribute("aria-hidden", "true");

  const rays2 = document.createElement("div");
  rays2.className = "lorus-key-reveal__rays lorus-key-reveal__rays--rev";
  rays2.setAttribute("aria-hidden", "true");

  const lasers = document.createElement("div");
  lasers.className = "lorus-key-reveal__lasers";
  lasers.setAttribute("aria-hidden", "true");
  const laserCount = 18;
  for (let i = 0; i < laserCount; i++) {
    const beam = document.createElement("span");
    beam.className = "lorus-key-reveal__laser";
    beam.style.setProperty("--lorus-laser-i", String(i));
    lasers.append(beam);
  }

  const canvas = document.createElement("canvas");
  canvas.className = "lorus-key-reveal__canvas";
  canvas.setAttribute("aria-hidden", "true");

  const flash = document.createElement("div");
  flash.className = "lorus-key-reveal__flash";
  flash.setAttribute("aria-hidden", "true");

  const shock = document.createElement("div");
  shock.className = "lorus-key-reveal__shockwave";
  shock.setAttribute("aria-hidden", "true");

  const streaks = document.createElement("div");
  streaks.className = "lorus-key-reveal__streaks";
  streaks.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 8; i++) {
    const s = document.createElement("span");
    s.className = "lorus-key-reveal__streak";
    s.style.setProperty("--streak-i", String(i));
    streaks.append(s);
  }

  const stars = document.createElement("div");
  stars.className = "lorus-key-reveal__stars";
  stars.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 12; i++) {
    const star = document.createElement("span");
    star.className = "lorus-key-reveal__star";
    star.style.setProperty("--star-i", String(i));
    star.style.setProperty("--star-angle", `${(360 / 12) * i}deg`);
    star.style.setProperty("--star-dist", `${68 + (i % 4) * 16}px`);
    stars.append(star);
  }

  const scan = document.createElement("div");
  scan.className = "lorus-key-reveal__scan";
  scan.setAttribute("aria-hidden", "true");

  const core = document.createElement("div");
  core.className = "lorus-key-reveal__core";

  const heroWrap = document.createElement("div");
  heroWrap.className = "lorus-key-reveal__hero-wrap";

  for (let i = 0; i < 3; i++) {
    const ring = document.createElement("span");
    ring.className = "lorus-key-reveal__ring";
    ring.style.setProperty("--lorus-ring-i", String(i));
    heroWrap.append(ring);
  }

  const chroma = document.createElement("div");
  chroma.className = "lorus-key-reveal__chroma";
  chroma.setAttribute("aria-hidden", "true");

  const shine = document.createElement("span");
  shine.className = "lorus-key-reveal__shine";
  shine.setAttribute("aria-hidden", "true");

  const img = document.createElement("img");
  img.className = "lorus-key-reveal__hero";
  img.alt = "";
  img.width = 280;
  img.height = 280;
  img.draggable = false;

  chroma.append(shine, img);
  heroWrap.append(chroma);

  const badge = document.createElement("p");
  badge.className = "lorus-key-reveal__badge";
  badge.textContent = "LORUS DÉBLOQUÉ";

  const name = document.createElement("p");
  name.className = "lorus-key-reveal__name";

  const classe = document.createElement("p");
  classe.className = "lorus-key-reveal__classe";

  core.append(heroWrap, badge, name, classe);
  rootEl.append(vignette, bg, rays, rays2, lasers, canvas, shock, stars, streaks, flash, scan, core);
  document.body.append(rootEl);

  sparks = new LorusSparkBurst(canvas);

  rootEl._img = img;
  rootEl._name = name;
  rootEl._classe = classe;
  rootEl._flash = flash;
  rootEl._heroWrap = heroWrap;
  rootEl._chroma = chroma;

  return rootEl;
}

function pulseHaptics() {
  if (reducedMotion()) return;
  try {
    navigator.vibrate?.([6, 35, 12, 55, 20]);
  } catch {
    /* ignore */
  }
}

function resetRevealState(root) {
  root.classList.remove(
    "lorus-key-reveal--on",
    "lorus-key-reveal--out",
    "lorus-key-reveal--peak",
    "lorus-key-reveal--fly-right",
    "lorus-key-reveal--hold",
    "lorus-key-reveal--landed",
    "lorus-key-reveal--fly",
    "lorus-key-reveal--shock"
  );
  root._flash?.classList.remove("lorus-key-reveal__flash--prime", "lorus-key-reveal__flash--hit");
  root._heroWrap?.classList.remove("lorus-key-reveal__hero-wrap--landed");
  const hero = root._img;
  if (hero) {
    hero.style.animation = "none";
    void hero.offsetWidth;
    hero.style.animation = "";
  }
  for (const el of [root._name, root._classe, root.querySelector(".lorus-key-reveal__badge")]) {
    if (!el) continue;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  }
}

export function isLorusKeyRevealPlaying() {
  return playing;
}

function teardownLorusKeyReveal(root) {
  if (!root) return;
  sparks?.stop();
  resetRevealState(root);
  root.hidden = true;
  root.classList.remove("lorus-key-reveal--on");
  document.body.classList.remove("lorus-key-reveal-open");
  playing = false;
}

export async function playLorusKeyReveal({ name: charName, src, pixelSrc, classe: charClasse }) {
  if (playing) return;
  playing = true;

  const root = ensureRoot();
  let peakTimer = 0;
  let landTimer = 0;

  try {
    resetRevealState(root);

    const imgSrc = src || pixelSrc;
    root._img.src = imgSrc || "";
    root._img.classList.toggle("lorus-key-reveal__hero--pixel", Boolean(pixelSrc && imgSrc === pixelSrc));
    if (imgSrc) {
      root._chroma?.style.setProperty("--lorus-chroma-src", `url("${imgSrc}")`);
    }
    root._name.textContent = charName || "Lorus";
    root._classe.textContent =
      charClasse === "defenseur" ? "Défenseur" : charClasse === "attaquant" ? "Attaquant" : "";

    root.hidden = false;
    document.body.classList.add("lorus-key-reveal-open");

    pulseHaptics();
    sparks?.start();

    requestAnimationFrame(() => {
      root._flash?.classList.add("lorus-key-reveal__flash--prime");
      root.classList.add("lorus-key-reveal--on");
    });

    peakTimer = setTimeout(() => {
      root.classList.add("lorus-key-reveal--peak");
      root._flash?.classList.remove("lorus-key-reveal__flash--prime");
      root._flash?.classList.add("lorus-key-reveal__flash--hit");
    }, reducedMotion() ? 280 : 700);

    landTimer = setTimeout(() => {
      root.classList.add("lorus-key-reveal--landed");
      root.classList.add("lorus-key-reveal--shock");
      root._heroWrap?.classList.add("lorus-key-reveal__hero-wrap--landed");
      sparks?.burstAgain(72);
      pulseHaptics();
      setTimeout(() => root.classList.remove("lorus-key-reveal--shock"), 700);
    }, reducedMotion() ? 400 : 1580);

    const growHold = reducedMotion() ? Math.min(GROW_MS, 560) : GROW_MS;
    await wait(growHold);

    root.classList.add("lorus-key-reveal--hold");
    await wait(reducedMotion() ? 120 : HOLD_MS);
    root.classList.remove("lorus-key-reveal--hold");

    root.classList.add("lorus-key-reveal--fly-right", "lorus-key-reveal--fly");
    sparks?.burstTrailRight(48);
    const flyHold = reducedMotion() ? 220 : FLY_MS;
    await wait(flyHold);

    root.classList.add("lorus-key-reveal--out");
    root.classList.remove(
      "lorus-key-reveal--on",
      "lorus-key-reveal--peak",
      "lorus-key-reveal--fly-right",
      "lorus-key-reveal--landed",
      "lorus-key-reveal--hold",
      "lorus-key-reveal--shock",
      "lorus-key-reveal--fly"
    );
    root._flash?.classList.remove("lorus-key-reveal__flash--prime", "lorus-key-reveal__flash--hit");
    sparks?.stop();
    await wait(reducedMotion() ? 140 : OUTRO_MS);
  } finally {
    clearTimeout(peakTimer);
    clearTimeout(landTimer);
    teardownLorusKeyReveal(root);
  }
}