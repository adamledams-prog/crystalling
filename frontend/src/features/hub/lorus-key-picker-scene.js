import { LorusSparkBurst, lorusReducedMotion } from "./lorus-neon-sparks.js";

/** @type {{ sparks: LorusSparkBurst | null, host: HTMLElement | null }} */
const state = { sparks: null, host: null };

function buildNeonSceneRoot() {
  const root = document.createElement("div");
  root.className = "lorus-key-reveal lorus-key-picker__scene lorus-key-reveal--on";
  root.setAttribute("aria-hidden", "true");

  const vignette = document.createElement("div");
  vignette.className = "lorus-key-reveal__vignette";

  const bg = document.createElement("div");
  bg.className = "lorus-key-reveal__bg";

  const rays = document.createElement("div");
  rays.className = "lorus-key-reveal__rays";

  const rays2 = document.createElement("div");
  rays2.className = "lorus-key-reveal__rays lorus-key-reveal__rays--rev";

  const lasers = document.createElement("div");
  lasers.className = "lorus-key-reveal__lasers";
  for (let i = 0; i < 18; i++) {
    const beam = document.createElement("span");
    beam.className = "lorus-key-reveal__laser";
    beam.style.setProperty("--lorus-laser-i", String(i));
    lasers.append(beam);
  }

  const canvas = document.createElement("canvas");
  canvas.className = "lorus-key-reveal__canvas";

  const flash = document.createElement("div");
  flash.className = "lorus-key-reveal__flash";

  const scan = document.createElement("div");
  scan.className = "lorus-key-reveal__scan";

  root.append(vignette, bg, rays, rays2, lasers, canvas, flash, scan);
  return { root, canvas, flash };
}

function ensureScene(host) {
  let scene = host.querySelector(".lorus-key-picker__scene");
  if (scene) return scene;

  const { root, canvas } = buildNeonSceneRoot();
  host.prepend(root);
  state.sparks = new LorusSparkBurst(canvas);
  state.host = host;
  return root;
}

export function openLorusKeyPickerScene() {
  const host = document.getElementById("shop-picker-lorus-scene-host");
  if (!host) return;

  const scene = ensureScene(host);
  document.body.classList.add("lorus-key-picker-open");

  requestAnimationFrame(() => {
    scene.classList.add("lorus-key-reveal--on", "lorus-key-picker__scene--live");
    const flash = scene.querySelector(".lorus-key-reveal__flash");
    flash?.classList.remove("lorus-key-reveal__flash--prime");
    if (!lorusReducedMotion()) {
      flash?.classList.add("lorus-key-reveal__flash--prime");
      window.setTimeout(() => flash?.classList.remove("lorus-key-reveal__flash--prime"), 420);
    }
    state.sparks?.startAmbient();
  });

  const onResize = () => state.sparks?.resize();
  host._pickerResize = onResize;
  window.addEventListener("resize", onResize);
}

export function closeLorusKeyPickerScene() {
  const host = document.getElementById("shop-picker-lorus-scene-host");
  if (host?._pickerResize) {
    window.removeEventListener("resize", host._pickerResize);
    host._pickerResize = null;
  }
  state.sparks?.stop();
  document.body.classList.remove("lorus-key-picker-open");
  host?.querySelector(".lorus-key-picker__scene")?.classList.remove("lorus-key-picker__scene--live");
}