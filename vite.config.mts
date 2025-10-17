import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tentamos achar o index.html na raiz ou em client/
const candidates = [process.cwd(), join(process.cwd(), "client")];
const root = candidates.find((p) => existsSync(join(p, "index.html"))) ?? process.cwd();

// outDir sempre em <repo>/dist/public, independente do root
const outDir = resolve(process.cwd(), "dist", "public");

export default defineConfig({
  root,
  plugins: [react()],
  build: {
    outDir,
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:3000" },
  },
  resolve: {
    alias: { "@": resolve(root, "src") },
  },
});
