import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

const here = __dirname;
const candidates = [here, path.join(here, "client")];
const root = candidates.find((p) => fs.existsSync(path.join(p, "index.html"))) ?? here;

export default defineConfig({
  root,
  plugins: [react()],
  build: {
    outDir: path.resolve(here, "dist", "public"),
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:3000" }
  },
  resolve: {
    alias: { "@": path.resolve(root, "src") }
  }
});
