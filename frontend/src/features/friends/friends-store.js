const STORAGE_FRIEND_CODE = "guerre_friend_code";
const STORAGE_FRIENDS = "guerre_friends";
const MAX_FRIENDS = 48;

function normalizeCode(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length !== 4) return null;
  return digits;
}

function randomCode() {
  return String(Math.floor(Math.random() * 10_000)).padStart(4, "0");
}

export function getFriendCode() {
  let code = localStorage.getItem(STORAGE_FRIEND_CODE);
  if (code && /^\d{4}$/.test(code)) return code;
  code = randomCode();
  localStorage.setItem(STORAGE_FRIEND_CODE, code);
  return code;
}

export function formatFriendCode(code) {
  const n = normalizeCode(code);
  return n ?? "0000";
}

function readFriends() {
  try {
    const raw = localStorage.getItem(STORAGE_FRIENDS);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return list.filter((f) => f && typeof f.code === "string" && /^\d{4}$/.test(f.code));
  } catch {
    return [];
  }
}

function saveFriends(list) {
  localStorage.setItem(STORAGE_FRIENDS, JSON.stringify(list));
}

export function getFriends() {
  return readFriends();
}

export function removeFriend(code) {
  const target = normalizeCode(code);
  if (!target) return false;
  const next = readFriends().filter((f) => f.code !== target);
  if (next.length === readFriends().length) return false;
  saveFriends(next);
  return true;
}

/**
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function addFriendByCode(rawCode) {
  const code = normalizeCode(rawCode);
  if (!code) {
    return { ok: false, error: "Entre un code à 4 chiffres." };
  }

  const own = getFriendCode();
  if (code === own) {
    return { ok: false, error: "C’est ton propre code." };
  }

  const friends = readFriends();
  if (friends.some((f) => f.code === code)) {
    return { ok: false, error: "Cet ami est déjà dans ta liste." };
  }
  if (friends.length >= MAX_FRIENDS) {
    return { ok: false, error: "Liste pleine — retire un ami avant d’en ajouter." };
  }

  friends.push({ code, addedAt: Date.now() });
  saveFriends(friends);
  return { ok: true };
}