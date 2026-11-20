import {
  addFriendByCode,
  formatFriendCode,
  getFriendCode,
  getFriends,
  removeFriend,
} from "./friends-store.js";

let addOpen = false;

function showToast(message, { error = false } = {}) {
  const toast = document.getElementById("friends-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.remove("hidden", "friends-toast--error");
  if (error) toast.classList.add("friends-toast--error");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.hidden = true;
    toast.classList.add("hidden");
  }, 2800);
}

function setAddHint(text) {
  const hint = document.getElementById("friends-add-hint");
  if (!hint) return;
  if (text) {
    hint.textContent = text;
    hint.hidden = false;
    hint.classList.remove("hidden");
  } else {
    hint.hidden = true;
    hint.classList.add("hidden");
    hint.textContent = "";
  }
}

function openAddFriendPanel() {
  const panel = document.getElementById("friends-add-panel");
  const input = document.getElementById("friends-add-input");
  if (!panel) return;
  addOpen = true;
  panel.classList.remove("hidden");
  panel.hidden = false;
  setAddHint("");
  if (input) {
    input.value = "";
    input.focus();
  }
}

function closeAddFriendPanel() {
  const panel = document.getElementById("friends-add-panel");
  if (!panel) return;
  addOpen = false;
  panel.classList.add("hidden");
  panel.hidden = true;
  setAddHint("");
}

export function refreshProfileFriendCode() {
  const el = document.getElementById("profile-friend-code");
  if (el) el.textContent = formatFriendCode(getFriendCode());
}

export function renderFriendsList() {
  const list = document.getElementById("friends-list");
  const empty = document.getElementById("friends-empty");
  if (!list) return;

  const friends = getFriends();
  list.replaceChildren();

  if (empty) {
    const showEmpty = friends.length === 0;
    empty.hidden = !showEmpty;
    empty.classList.toggle("hidden", !showEmpty);
  }

  for (const friend of friends) {
    const li = document.createElement("li");
    li.className = "friends-item";

    const main = document.createElement("div");
    main.className = "friends-item-main";

    const avatar = document.createElement("span");
    avatar.className = "friends-item-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = friend.code.slice(-2);

    const meta = document.createElement("div");
    meta.className = "friends-item-meta";

    const title = document.createElement("p");
    title.className = "friends-item-name";
    title.textContent = "Ami";

    const code = document.createElement("p");
    code.className = "friends-item-code";
    code.textContent = `Code ${friend.code}`;

    meta.append(title, code);
    main.append(avatar, meta);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "friends-item-remove";
    removeBtn.setAttribute("aria-label", `Retirer l’ami ${friend.code}`);
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      removeFriend(friend.code);
      renderFriendsList();
      showToast("Ami retiré de la liste.");
    });

    li.append(main, removeBtn);
    list.append(li);
  }
}

export function initFriendsUi() {
  getFriendCode();
  refreshProfileFriendCode();

  document.getElementById("friends-add-btn")?.addEventListener("click", openAddFriendPanel);
  document.getElementById("friends-add-close")?.addEventListener("click", closeAddFriendPanel);
  document.getElementById("friends-add-backdrop")?.addEventListener("click", closeAddFriendPanel);

  document.getElementById("friends-add-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("friends-add-input");
    const result = addFriendByCode(input?.value);
    if (!result.ok) {
      setAddHint(result.error);
      return;
    }
    closeAddFriendPanel();
    renderFriendsList();
    showToast("Ami ajouté !");
  });

  const input = document.getElementById("friends-add-input");
  input?.addEventListener("input", () => {
    setAddHint("");
    if (!input) return;
    input.value = input.value.replace(/\D/g, "").slice(0, 4);
  });

  document.getElementById("profile-copy-friend-code")?.addEventListener("click", async () => {
    const code = formatFriendCode(getFriendCode());
    try {
      await navigator.clipboard.writeText(code);
      showProfileCopyToast();
    } catch {
      showProfileCopyToast("Sélectionne le code pour le copier.");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !addOpen) return;
    closeAddFriendPanel();
  });
}

function showProfileCopyToast(message = "Code copié.") {
  const toast = document.getElementById("profile-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.remove("hidden");
  clearTimeout(showProfileCopyToast._t);
  showProfileCopyToast._t = setTimeout(() => {
    toast.hidden = true;
    toast.classList.add("hidden");
  }, 2200);
}

export function onFriendsScreenOpen() {
  getFriendCode();
  renderFriendsList();
}