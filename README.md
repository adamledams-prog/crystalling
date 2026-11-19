# Guerre

Jeu de cartes PWA (paysage) — hub, Lorus, personnages attaquant / défenseur.

## Structure

```
carte/
├── frontend/          # Interface (Vite + PWA)
├── backend/           # API (prévu — stub)
├── tools/             # Scripts Python (assets persos)
└── docs/              # Architecture
```

## Démarrage

```bash
npm install
npm run dev          # http://localhost:5173
```

Build production :

```bash
npm run build        # sortie dans dist/
npm run preview
```

## Outils persos

```bash
python tools/prepare_perso.py <image.png> <slug>
python tools/pixelate_persos.py
```

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).