// server/vite.ts
import type { Express } from "express";
import path from "node:path";
import fs from "node:fs";

export function log(msg: string) {
  console.log(`[express] ${msg}`);
}

export async function setupVite(app: Express) {
  if (process.env.NODE_ENV !== "development") return;
  const { createServer } = await import("vite");
  const vite = await createServer({
    configFile: path.resolve(process.cwd(), "vite.config.mts"),
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
}

export async function serveStatic(app: Express) {
  const publicDir = path.resolve(process.cwd(), "dist/public");
  if (!fs.existsSync(publicDir)) {
    log(`WARN: pasta ${publicDir} não encontrada. Você rodou "vite build"?`);
    return;
  }

  // ✅ Import ESM dinâmico (sem require)
  const expressMod = await import("express");
  const express = expressMod.default as typeof import("express");

  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}
