import { CardSparkField, cardReducedMotion } from "./card-neon-sparks.js";

/** @type {{ sparks: CardSparkField | null }} */
const state = { sparks: null };

const DEFAULT_ACCENT = "#b57edc";

function buildCardNeonSceneRoot() {
  const root = document.createElement("div");
  root.className = "card-key-reveal card-key-picker__scene card-key-reveal--on";
  root.style.setProperty("--card-accent", DEFAULT_ACCENT);
  root.setAttribute("aria-hidden", "true");

  const vignette = document.createElement("div");
  vignette.className = "card-key-reveal__vignette";

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

  const flash = document.createElement("div");
  flash.className = "card-key-reveal__flash";

  const scan = document.createElement("div");
  scan.className = "card-key-reveal__scan";

  root.append(vignette, backdrop, rays, raysRev, lasers, canvas, flash, scan);
  return { root, canvas };
}

function ensureScene(host) {
  let scene = host.querySelector(".card-key-picker__scene");
  if (scene) return scene;

  const { root, canvas } = buildCardNeonSceneRoot();
  host.prepend(root);
  state.sparks = new CardSparkField(canvas);
  return root;
}

export function openCardKeyPickerScene() {
  const host = document.getElementById("shop-picker-card-scene-host");
  if (!host) return;

  const scene = ensureScene(host);
  document.body.classList.add("card-key-picker-open");

  requestAnimationFrame(() => {
    scene.classList.add("card-key-reveal--on", "card-key-picker__scene--live");
    const flash = scene.querySelector(".card-key-reveal__flash");
    flash?.classList.remove("card-key-reveal__flash--prime");
    if (!cardReducedMotion()) {
      flash?.classList.add("card-key-reveal__flash--prime");
      window.setTimeout(() => flash?.classList.remove("card-key-reveal__flash--prime"), 380);
    }
    state.sparks?.startAmbient(DEFAULT_ACCENT);
  });

  const onResize = () => state.sparks?.resize();
  host._pickerResize = onResize;
  window.addEventListener("resize", onResize);
}

export function closeCardKeyPickerScene() {
  const host = document.getElementById("shop-picker-card-scene-host");
  if (host?._pickerResize) {
    window.removeEventListener("resize", host._pickerResize);
    host._pickerResize = null;
  }
  state.sparks?.stop();
  document.body.classList.remove("card-key-picker-open");
  host?.querySelector(".card-key-picker__scene")?.classList.remove("card-key-picker__scene--live");
}