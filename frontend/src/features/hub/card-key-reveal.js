import { CardSparkField, cardReducedMotion } from "./card-neon-sparks.js";

const GROW_MS = 2000;
const HOLD_MS = 620;
const FLY_MS = 860;
const OUTRO_MS = 400;

let playing = false;
let rootEl = null;
/** @type {CardSparkField | null} */
let sparks = null;

function reducedMotion() {
  return cardReducedMotion();
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureRoot() {
  if (rootEl) return rootEl;

  rootEl = document.createElement("div");
  rootEl.id = "card-key-reveal";
  rootEl.className = "card-key-reveal";
  rootEl.hidden = true;
  rootEl.setAttribute("role", "dialog");
  rootEl.setAttribute("aria-modal", "true");
  rootEl.setAttribute("aria-label", "Nouvelle carte de combat");

  const vignette = document.createElement("div");
  vignette.className = "card-key-reveal__vignette";
  vignette.setAttribute("aria-hidden", "true");

  const backdrop = document.createElement("div");
  backdrop.className = "card-key-reveal__backdrop";

  const rays = document.createElement("div");
  rays.className = "card-key-reveal__rays";

  const raysRev = document.createElement("div");
  raysRev.className = "card-key-reveal__rays card-key-reveal__rays--rev";

  const lasers = document.createElement("div");
  lasers.className = "card-key-reveal__lasers";
  for (let i = 0; i < 12; i++) {
    const beam = document.createElement("span");
    beam.className = "card-key-reveal__laser";
    beam.style.setProperty("--card-laser-i", String(i));
    lasers.append(beam);
  }

  const canvas = document.createElement("canvas");
  canvas.className = "card-key-reveal__canvas";

  const scan = document.createElement("div");
  scan.className = "card-key-reveal__scan";

  const flash = document.createElement("div");
  flash.className = "card-key-reveal__flash";

  const burst = document.createElement("div");
  burst.className = "card-key-reveal__burst";

  const shock = document.createElement("div");
  shock.className = "card-key-reveal__shockwave";

  const streaks = document.createElement("div");
  streaks.className = "card-key-reveal__streaks";
  for (let i = 0; i < 8; i++) {
    const s = document.createElement("span");
    s.className = "card-key-reveal__streak";
    s.style.setProperty("--streak-i", String(i));
    streaks.append(s);
  }

  const stars = document.createElement("div");
  stars.className = "card-key-reveal__stars";
  stars.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 12; i++) {
    const star = document.createElement("span");
    star.className = "card-key-reveal__star";
    star.style.setProperty("--star-i", String(i));
    star.style.setProperty("--star-angle", `${(360 / 12) * i + 15}deg`);
    star.style.setProperty("--star-dist", `${60 + (i % 3) * 20}px`);
    stars.append(star);
  }

  const core = document.createElement("div");
  core.className = "card-key-reveal__core";

  const frameWrap = document.createElement("div");
  frameWrap.className = "card-key-reveal__frame-wrap";

  for (let i = 0; i < 3; i++) {
    const ring = document.createElement("span");
    ring.className = "card-key-reveal__ring";
    ring.style.setProperty("--card-ring-i", String(i));
    frameWrap.append(ring);
  }

  const frame = document.createElement("div");
  frame.className = "card-key-reveal__frame";

  const shine = document.createElement("span");
  shine.className = "card-key-reveal__shine";

  const ghost = document.createElement("div");
  ghost.className = "card-key-reveal__ghost";
  ghost.setAttribute("aria-hidden", "true");

  const img = document.createElement("img");
  img.className = "card-key-reveal__img";
  img.alt = "";
  img.draggable = false;

  const badge = document.createElement("p");
  badge.className = "card-key-reveal__badge";
  badge.textContent = "CARTE DÉBLOQUÉE";

  const title = document.createElement("p");
  title.className = "card-key-reveal__title";

  const sub = document.createElement("p");
  sub.className = "card-key-reveal__sub";

  frame.append(ghost, img, shine);
  frameWrap.append(frame);
  core.append(frameWrap, badge, title, sub);
  rootEl.append(vignette, backdrop, rays, raysRev, lasers, burst, shock, stars, streaks, canvas, scan, flash, core);
  document.body.append(rootEl);

  sparks = new CardSparkField(canvas);

  rootEl._img = img;
  rootEl._ghost = ghost;
  rootEl._title = title;
  rootEl._sub = sub;
  rootEl._frame = frame;
  rootEl._flash = flash;
  rootEl._frameWrap = frameWrap;

  return rootEl;
}

function resetRevealState(root) {
  root.classList.remove(
    "card-key-reveal--on",
    "card-key-reveal--out",
    "card-key-reveal--bim",
    "card-key-reveal--peak",
    "card-key-reveal--fly",
    "card-key-reveal--hold",
    "card-key-reveal--shock",
    "card-key-reveal--streaks"
  );
  root._flash?.classList.remove("card-key-reveal__flash--prime", "card-key-reveal__flash--hit");
  root._frameWrap?.classList.remove("card-key-reveal__frame-wrap--landed");
  const frame = root._frame;
  if (frame) {
    frame.style.animation = "none";
    void frame.offsetWidth;
    frame.style.animation = "";
  }
  for (const el of [root._title, root._sub, root.querySelector(".card-key-reveal__badge")]) {
    if (!el) continue;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  }
}

function teardownCardKeyReveal(root) {
  if (!root) return;
  sparks?.stop();
  resetRevealState(root);
  root.hidden = true;
  document.body.classList.remove("card-key-reveal-open");
  playing = false;
}

export function isCardKeyRevealPlaying() {
  return playing;
}

export async function playCardKeyReveal({
  title: cardTitle,
  subtitle,
  image,
  accent = "#b57edc",
  rarity,
}) {
  if (playing) return;
  playing = true;

  const root = ensureRoot();
  let bimTimer = 0;
  let peakTimer = 0;

  try {
    resetRevealState(root);

    const imgSrc = image || "";
    root._img.src = imgSrc;
    root._img.hidden = !imgSrc;
    if (imgSrc) {
      root._ghost.style.backgroundImage = `url("${imgSrc}")`;
    }
    root._title.textContent = cardTitle || "Carte";
    root._sub.textContent = subtitle || "";
    root._sub.hidden = !subtitle;
    root.style.setProperty("--card-accent", accent);
    root._frame.style.setProperty("--card-accent", accent);
    if (rarity) root._frame.dataset.rarity = rarity;
    else delete root._frame.dataset.rarity;

    root.hidden = false;
    document.body.classList.add("card-key-reveal-open");

    try {
      navigator.vibrate?.([8, 24, 14]);
    } catch {
      /* ignore */
    }

    sparks?.start(accent);

    requestAnimationFrame(() => {
      root.classList.add("card-key-reveal--on");
      root._flash?.classList.add("card-key-reveal__flash--prime");
    });

    bimTimer = setTimeout(() => {
      root.classList.add("card-key-reveal--bim", "card-key-reveal--peak", "card-key-reveal--shock");
      root._flash?.classList.remove("card-key-reveal__flash--prime");
      root._flash?.classList.add("card-key-reveal__flash--hit");
      root._frameWrap?.classList.add("card-key-reveal__frame-wrap--landed");
      sparks?.burstAgain(80);
      setTimeout(() => root.classList.remove("card-key-reveal--shock"), 680);
      try {
        navigator.vibrate?.([18, 40, 24]);
      } catch {
        /* ignore */
      }
    }, reducedMotion() ? 240 : 540);

    peakTimer = setTimeout(() => {
      root.classList.remove("card-key-reveal--peak");
    }, reducedMotion() ? 400 : 980);

    await wait(reducedMotion() ? 500 : GROW_MS);

    root.classList.add("card-key-reveal--hold");
    await wait(reducedMotion() ? 120 : HOLD_MS);

    root.classList.remove("card-key-reveal--hold", "card-key-reveal--peak");
    root._frameWrap?.classList.remove("card-key-reveal__frame-wrap--landed");

    root.classList.add("card-key-reveal--fly", "card-key-reveal--streaks");
    sparks?.burstTrailRight(46);
    await wait(reducedMotion() ? 160 : FLY_MS);

    root.classList.add("card-key-reveal--out");
    root.classList.remove(
      "card-key-reveal--on",
      "card-key-reveal--bim",
      "card-key-reveal--fly",
      "card-key-reveal--hold",
      "card-key-reveal--peak",
      "card-key-reveal--shock",
      "card-key-reveal--streaks"
    );
    root._frameWrap?.classList.remove("card-key-reveal__frame-wrap--landed");
    root._flash?.classList.remove("card-key-reveal__flash--prime", "card-key-reveal__flash--hit");
    sparks?.stop();
    await wait(reducedMotion() ? 120 : OUTRO_MS);
  } finally {
    clearTimeout(bimTimer);
    clearTimeout(peakTimer);
    teardownCardKeyReveal(root);
  }
}