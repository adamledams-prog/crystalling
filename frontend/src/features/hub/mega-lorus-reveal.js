import { LorusSparkBurst, lorusReducedMotion } from "./lorus-neon-sparks.js";

const DROP_MS = 1050;
const HOLD_MS = 850;
const ZOOM_MS = 720;
const SANEX_FINALE_MS = 1920;
const SANEX_LAND_MS = 560;
const OUTRO_MS = 320;

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
    navigator.vibrate?.([12, 40, 18, 60, 24, 80, 30]);
  } catch {
    /* ignore */
  }
}

function ensureRoot() {
  if (rootEl) return rootEl;

  rootEl = document.createElement("div");
  rootEl.id = "mega-lorus-reveal";
  rootEl.className = "mega-lorus-reveal";
  rootEl.hidden = true;
  rootEl.setAttribute("role", "dialog");
  rootEl.setAttribute("aria-modal", "true");
  rootEl.setAttribute("aria-label", "Megalorus débloqué");

  const aurora = document.createElement("div");
  aurora.className = "mega-lorus-reveal__aurora";
  aurora.setAttribute("aria-hidden", "true");

  const vortex = document.createElement("div");
  vortex.className = "mega-lorus-reveal__vortex";
  vortex.setAttribute("aria-hidden", "true");

  const canvas = document.createElement("canvas");
  canvas.className = "mega-lorus-reveal__canvas";
  canvas.setAttribute("aria-hidden", "true");

  const rings = document.createElement("div");
  rings.className = "mega-lorus-reveal__rings";
  rings.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 4; i++) {
    const ring = document.createElement("span");
    ring.className = "mega-lorus-reveal__ring";
    ring.style.setProperty("--mega-ring-i", String(i));
    rings.append(ring);
  }

  const flash = document.createElement("div");
  flash.className = "mega-lorus-reveal__flash";
  flash.setAttribute("aria-hidden", "true");

  const core = document.createElement("div");
  core.className = "mega-lorus-reveal__core";

  const dropWrap = document.createElement("div");
  dropWrap.className = "mega-lorus-reveal__drop-wrap";

  const ghostA = document.createElement("img");
  ghostA.className = "mega-lorus-reveal__ghost mega-lorus-reveal__ghost--a";
  ghostA.alt = "";
  ghostA.draggable = false;

  const ghostB = document.createElement("img");
  ghostB.className = "mega-lorus-reveal__ghost mega-lorus-reveal__ghost--b";
  ghostB.alt = "";
  ghostB.draggable = false;

  const hero = document.createElement("img");
  hero.className = "mega-lorus-reveal__hero";
  hero.alt = "";
  hero.width = 300;
  hero.height = 300;
  hero.draggable = false;

  dropWrap.append(ghostA, ghostB, hero);

  const badge = document.createElement("p");
  badge.className = "mega-lorus-reveal__badge";
  badge.textContent = "MEGALORUS";

  const name = document.createElement("p");
  name.className = "mega-lorus-reveal__name";

  const classe = document.createElement("p");
  classe.className = "mega-lorus-reveal__classe";

  core.append(dropWrap, badge, name, classe);
  rootEl.append(aurora, vortex, canvas, rings, flash, core);
  document.body.append(rootEl);

  sparks = new LorusSparkBurst(canvas);

  rootEl._hero = hero;
  rootEl._ghostA = ghostA;
  rootEl._ghostB = ghostB;
  rootEl._name = name;
  rootEl._classe = classe;
  rootEl._flash = flash;
  rootEl._dropWrap = dropWrap;

  return rootEl;
}

function resetState(root) {
  root.classList.remove(
    "mega-lorus-reveal--on",
    "mega-lorus-reveal--drop",
    "mega-lorus-reveal--merge",
    "mega-lorus-reveal--badge",
    "mega-lorus-reveal--hold",
    "mega-lorus-reveal--zoom",
    "mega-lorus-reveal--sanex",
    "mega-lorus-reveal--sanex-finale",
    "mega-lorus-reveal--out"
  );
  root._flash?.classList.remove("mega-lorus-reveal__flash--hit");
  root._hero?.classList.remove(
    "mega-lorus-reveal__hero--sanex-finale",
    "sanex-finale-motion"
  );
}

function teardown(root) {
  if (!root) return;
  sparks?.stop();
  resetState(root);
  root.hidden = true;
  document.body.classList.remove("mega-lorus-reveal-open");
  playing = false;
}

export function isMegaLorusRevealPlaying() {
  return playing;
}

/**
 * Révélation d’achat Megalorus : fosse arc-en-ciel, chute depuis le haut,
 * fusion des spectres, anneaux puis zoom « impact » (pas de vol latéral comme la clé).
 */
export async function playMegaLorusReveal({ id, name: charName, src, pixelSrc, classe: charClasse }) {
  if (playing) return;
  playing = true;

  const root = ensureRoot();
  const rm = lorusReducedMotion();
  const isSanex = id === "sanex";

  try {
    resetState(root);

    if (isSanex) root.classList.add("mega-lorus-reveal--sanex");

    const imgSrc = src || pixelSrc;
    for (const el of [root._hero, root._ghostA, root._ghostB]) {
      el.src = imgSrc || "";
      el.classList.toggle("mega-lorus-reveal__hero--pixel", Boolean(pixelSrc && imgSrc === pixelSrc));
    }

    root._name.textContent = charName || "Lorus";
    root._classe.textContent =
      charClasse === "defenseur" ? "Défenseur" : charClasse === "attaquant" ? "Attaquant" : "";

    root.hidden = false;
    document.body.classList.add("mega-lorus-reveal-open");

    sparks?.resize();
    sparks?.start();
    pulseHaptics();

    requestAnimationFrame(() => root.classList.add("mega-lorus-reveal--on"));

    await wait(rm ? 180 : 420);
    root.classList.add("mega-lorus-reveal--drop");
    sparks?.burst(rm ? 32 : 88);
    pulseHaptics();

    await wait(rm ? 280 : DROP_MS);
    root.classList.add("mega-lorus-reveal--merge");
    sparks?.burstAgain(rm ? 40 : 96);
    pulseHaptics();

    await wait(rm ? 200 : 520);
    root.classList.add("mega-lorus-reveal--badge");

    await wait(rm ? 220 : HOLD_MS);
    root.classList.add("mega-lorus-reveal--hold");

    await wait(rm ? 160 : 380);
    root.classList.remove("mega-lorus-reveal--hold");

    if (isSanex) {
      root.classList.add("mega-lorus-reveal--sanex-finale");
      root._hero?.classList.add("mega-lorus-reveal__hero--sanex-finale", "sanex-finale-motion");
      sparks?.burst(rm ? 36 : 60);
      pulseHaptics();
      const landIn = rm ? 200 : SANEX_LAND_MS;
      const landTimer = setTimeout(() => {
        sparks?.burstAgain(rm ? 48 : 96);
        try {
          navigator.vibrate?.([8, 24, 12, 40]);
        } catch {
          /* ignore */
        }
      }, landIn);
      await wait(rm ? 520 : SANEX_FINALE_MS);
      clearTimeout(landTimer);
    } else {
      root.classList.add("mega-lorus-reveal--zoom");
      root._flash?.classList.add("mega-lorus-reveal__flash--hit");
      sparks?.burst(rm ? 56 : 120);
      pulseHaptics();
      await wait(rm ? 240 : ZOOM_MS);
    }

    root.classList.add("mega-lorus-reveal--out");
    root.classList.remove(
      "mega-lorus-reveal--on",
      "mega-lorus-reveal--drop",
      "mega-lorus-reveal--merge",
      "mega-lorus-reveal--badge",
      "mega-lorus-reveal--zoom",
      "mega-lorus-reveal--sanex-finale"
    );
    root._hero?.classList.remove("mega-lorus-reveal__hero--sanex-finale");
    sparks?.stop();
    await wait(rm ? 120 : OUTRO_MS);
  } finally {
    teardown(root);
  }
}