export const VERSION_URL = "./version.json";
export const VERSION_KEY = "guerre_app_version";
const RELOAD_FLAG = "guerre_sync_reloaded";
const CHECK_INTERVAL_MS = 60_000;

export async function fetchAppVersion() {
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

export async function getSwRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return (await navigator.serviceWorker.getRegistration()) ?? null;
  } catch {
    return null;
  }
}

export async function registerAndCheckSw() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    await reg.update();
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn("Service worker:", err);
    return null;
  }
}

/** true si le JSON distant ne correspond pas à la version enregistrée en local */
export function isRemoteVersionNewer(remote) {
  if (!remote?.id) return false;
  const local = localStorage.getItem(VERSION_KEY);
  return Boolean(local && local !== remote.id);
}

export async function probeAppUpdate() {
  const reg = await getSwRegistration();
  if (reg) await reg.update();

  const remote = await fetchAppVersion();
  const versionNewer = isRemoteVersionNewer(remote);
  const waiting = Boolean(reg?.waiting);

  return {
    available: versionNewer || waiting,
    label: remote?.label || remote?.id || "",
    remoteId: remote?.id || null,
    waiting,
  };
}

export async function clearAppCaches() {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
}

export async function applyAppUpdate() {
  const reg = await getSwRegistration();
  const remote = await fetchAppVersion();

  if (reg?.waiting) {
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  if (remote?.id) {
    localStorage.setItem(VERSION_KEY, remote.id);
  }

  sessionStorage.removeItem(RELOAD_FLAG);

  await clearAppCaches();

  const reloaded = new Promise((resolve) => {
    if (!("serviceWorker" in navigator)) {
      resolve(false);
      return;
    }
    const onChange = () => {
      resolve(true);
      location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onChange, { once: true });
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      resolve(false);
    }, 1200);
  });

  const viaSw = await reloaded;
  if (!viaSw) location.reload();
}

/**
 * Au démarrage : enregistre la version et recharge une fois si le déploiement a changé.
 */
export async function syncVersionOnBoot() {
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

function setUpdateBannerVisible(show, label) {
  const banner = document.getElementById("update-banner");
  const text = document.getElementById("update-banner-text");
  if (!banner) return;

  if (show) {
    const detail = label ? ` (${label})` : "";
    if (text) text.textContent = `Nouvelle version disponible${detail} — récupère les derniers changements.`;
    banner.classList.remove("hidden");
    banner.hidden = false;
  } else {
    banner.classList.add("hidden");
    banner.hidden = true;
  }
}

async function runUpdateProbe() {
  const state = await probeAppUpdate();
  setUpdateBannerVisible(state.available, state.label);
  return state;
}

export function initAppUpdateUi() {
  const btnApply = document.getElementById("btn-apply-update");
  const btnCheck = document.getElementById("btn-check-update");

  btnApply?.addEventListener("click", async () => {
    btnApply.disabled = true;
    const prev = btnApply.textContent;
    btnApply.textContent = "Mise à jour…";
    try {
      await registerAndCheckSw();
      await applyAppUpdate();
    } finally {
      btnApply.disabled = false;
      btnApply.textContent = prev;
    }
  });

  btnCheck?.addEventListener("click", async () => {
    btnCheck.disabled = true;
    try {
      const state = await runUpdateProbe();
      if (state.available) {
        setUpdateBannerVisible(true, state.label);
      } else {
        setUpdateBannerVisible(false);
        btnCheck.setAttribute("title", "Tu es à jour");
        setTimeout(() => btnCheck.setAttribute("title", "Mettre à jour l'app"), 2000);
      }
    } finally {
      btnCheck.disabled = false;
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") runUpdateProbe();
  });

  runUpdateProbe();
  setInterval(runUpdateProbe, CHECK_INTERVAL_MS);
}