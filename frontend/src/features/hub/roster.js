/** Plateau : colonnes attaquant (6) / défenseur (3). */

const HUB_SLOT_COUNTS = { attaquant: 6, defenseur: 3 };

const hubRoster = {
  attaquant: Array(HUB_SLOT_COUNTS.attaquant).fill(null),
  defenseur: Array(HUB_SLOT_COUNTS.defenseur).fill(null),
};

function hubSlotCount(col) {
  return HUB_SLOT_COUNTS[col] ?? 3;
}

function hubColumnForClasse(classe) {
  return classe === "defenseur" ? "defenseur" : "attaquant";
}

function removeHubCharacterFromRoster(id) {
  if (!id) return;
  for (const col of ["attaquant", "defenseur"]) {
    const n = hubSlotCount(col);
    for (let i = 0; i < n; i++) {
      if (hubRoster[col][i]?.id === id) hubRoster[col][i] = null;
    }
  }
}

function nextHubSlotIndex(col) {
  const n = hubSlotCount(col);
  const empty = hubRoster[col].findIndex((slot) => !slot);
  return empty >= 0 ? empty : n - 1;
}

function renderHubSlot(col, index) {
  const el = document.querySelector(`.hub-slot[data-col="${col}"][data-slot="${index}"]`);
  if (!el) return;
  const entry = hubRoster[col][index];
  el.classList.toggle("hub-slot--filled", Boolean(entry));
  el.replaceChildren();
  if (!entry) return;

  const img = document.createElement("img");
  img.className = "hub-slot-char";
  img.src = entry.src;
  img.alt = entry.name || "";
  img.width = 120;
  img.height = 120;
  img.draggable = false;

  const label = document.createElement("span");
  label.className = "hub-slot-name";
  label.textContent = entry.name || "";

  el.append(img, label);
}

function renderHubRoster() {
  for (const col of ["attaquant", "defenseur"]) {
    for (let i = 0; i < hubSlotCount(col); i++) renderHubSlot(col, i);
  }
  const title = document.getElementById("hub-title");
  const hasAny =
    hubRoster.attaquant.some(Boolean) || hubRoster.defenseur.some(Boolean);
  title?.classList.toggle("hub-title--behind", hasAny);
}

export function clearHubCharacter() {
  hubRoster.attaquant.fill(null);
  hubRoster.defenseur.fill(null);
  renderHubRoster();
}

export function placeHubCharacter({ id, classe, src, name }) {
  if (!src) return;
  const col = hubColumnForClasse(classe);
  removeHubCharacterFromRoster(id);
  const slot = nextHubSlotIndex(col);
  hubRoster[col][slot] = { id: id || src, src, name: name || "" };
  renderHubRoster();
}