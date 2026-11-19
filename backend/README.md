# Backend Guerre

Réservé aux futures fonctionnalités en ligne (API REST + WebSocket).

Pour l’instant le jeu fonctionne entièrement dans le **frontend** (PWA).

Quand tu brancheras l’API :

1. Implémenter les routes dans `src/server.js` (ou `src/routes/`).
2. Exposer `VITE_API_URL` côté frontend pour les `fetch`.
3. Auth / CORS selon l’hébergement (Cursor Origin, VPS, etc.).