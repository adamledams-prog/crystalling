# Architecture Guerre

## Vue d’ensemble

| Dossier | Rôle |
|---------|------|
| **frontend/** | PWA joueur : HTML, JS modules, CSS, assets publics, service worker |
| **backend/** | Futur serveur (parties en ligne, comptes, sync deck) — non branché au jeu pour l’instant |
| **tools/** | Pipeline hors navigateur (détourage, pixel art, vidéo) |
| **dist/** | Build Vite (généré) |

## Frontend (`frontend/`)

```
frontend/
├── index.html              # Shell unique
├── public/                 # Fichiers servis tels quels (/, /images/…)
│   ├── sw.js               # Service worker + cache
│   ├── version.json        # Version cache PWA
│   ├── manifest.json
│   ├── icons/
│   └── images/persos/      # Catalogue persos.json + PNG
└── src/
    ├── main.js             # Entrée Vite (CSS + app)
    ├── app.js              # Onboarding, hub, Lorus, install PWA
    ├── boot-sync.js        # Écran chargement 3s + MAJ SW
    ├── styles/main.css
    └── features/
        ├── hub/roster.js   # Colonnes plateau (6 att / 3 déf)
        └── lorus/mega-anim.js  # Révélation perso (cinématiques réservées)
```

**Flux actuel :** tout est client-side (`localStorage`). Le catalogue personnages est lu depuis `/images/persos/persos.json`.

## Backend (`backend/`) — à venir

Pistes prévues :

- `GET /api/persos` — catalogue synchronisé
- `POST /api/matchmaking` — file d’attente
- WebSocket — parties temps réel

Le stub `backend/src/server.js` ne sert que de point d’ancrage pour plus tard.

## Données personnages

1. Image source → `tools/prepare_perso.py` → `frontend/public/images/persos/{slug}.png`
2. Vignettes → `tools/pixelate_persos.py` → `{slug}-pixel.png`, `{slug}-sheet.png`
3. Entrée dans `persos.json` (`id`, `name`, `classe`, chemins `src` / `pixelSrc`)
4. Bump `version.json` + `sw.js` (`CACHE`) ensemble

## PWA

- Manifest + SW à la racine du site (fichiers dans `frontend/public/`)
- `boot-sync.js` impose un chargement minimal de **3 s** et met à jour le cache si la version change