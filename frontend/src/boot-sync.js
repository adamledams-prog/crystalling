import { registerAndCheckSw, syncVersionOnBoot } from "./app-update.js";

const BOOT_MS = 2000;

const els = {
  screen: null,
  pct: null,
  bar: null,
};

function initSyncUi() {
  els.screen = document.getElementById("sync-screen");
  els.pct = document.getElementById("sync-pct");
  els.bar = document.getElementById("sync-bar-fill");
}

function setSyncProgress(pct) {
  const value = Math.min(100, Math.max(0, Math.round(pct)));
  if (els.pct) els.pct.textContent = `${value}%`;
  if (els.bar) els.bar.style.width = `${value}%`;
  if (els.screen) els.screen.setAttribute("aria-valuenow", String(value));
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function warmCaches() {
  const urls = ["./images/persos/persos.json", "./src/main.js"];
  await Promise.allSettled(
    urls.map((u) => fetch(`${u}?t=${Date.now()}`, { cache: "no-store" }))
  );
}

async function runBootTasks() {
  await registerAndCheckSw();
  const reloaded = await syncVersionOnBoot();
  if (reloaded) return true;
  await warmCaches();
  return false;
}

export async function runBootSync() {
  initSyncUi();
  document.body.classList.add("boot-loading");

  const t0 = performance.now();
  let rafId = 0;

  const tick = () => {
    const elapsed = performance.now() - t0;
    const pct = Math.min(99, (elapsed / BOOT_MS) * 99);
    setSyncProgress(pct);
    if (elapsed < BOOT_MS) rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  const [reloaded] = await Promise.all([runBootTasks(), wait(BOOT_MS)]);

  cancelAnimationFrame(rafId);

  if (reloaded) return;

  setSyncProgress(100);
  await wait(80);

  document.body.classList.remove("boot-loading");
  els.screen?.classList.add("sync-screen--done");
  await wait(180);
  els.screen?.remove();
}