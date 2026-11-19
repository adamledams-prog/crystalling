const VERSION_URL = "./version.json";
const VERSION_KEY = "guerre_app_version";
const RELOAD_FLAG = "guerre_sync_reloaded";
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

async function fetchAppVersion() {
  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function registerAndUpdateSw() {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    await reg.update();
    await navigator.serviceWorker.ready;

    if (reg.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
      await wait(120);
    }

    return reg;
  } catch (err) {
    console.warn("Service worker:", err);
    return null;
  }
}

async function syncVersion() {
  const remote = await fetchAppVersion();
  if (!remote?.id) return false;

  const local = localStorage.getItem(VERSION_KEY);
  const needsReload = local && local !== remote.id && !sessionStorage.getItem(RELOAD_FLAG);

  localStorage.setItem(VERSION_KEY, remote.id);

  if (needsReload) {
    sessionStorage.setItem(RELOAD_FLAG, "1");
    location.reload();
    return true;
  }

  sessionStorage.removeItem(RELOAD_FLAG);
  return false;
}

async function warmCaches() {
  const urls = ["./images/persos/persos.json", "./src/main.js"];
  await Promise.allSettled(
    urls.map((u) => fetch(`${u}?t=${Date.now()}`, { cache: "no-store" }))
  );
}

async function runBootTasks() {
  await registerAndUpdateSw();
  const reloaded = await syncVersion();
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