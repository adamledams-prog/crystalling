import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(rootDir, "frontend"),
  publicDir: resolve(rootDir, "frontend/public"),
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    host: true,
  },
  preview: {
    port: 4173,
    open: true,
  },
  build: {
    outDir: resolve(rootDir, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(rootDir, "frontend/index.html"),
    },
  },
});