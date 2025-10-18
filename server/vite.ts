// server/vite.ts
import type { Express } from "express";
import path from "node:path";
import fs from "node:fs";

export function log(msg: string) {
  console.log(`[express] ${msg}`);
}

// Dev only: injeta Vite via middleware, lendo o arquivo de config pelo caminho.
// NÃO importe ../vite.config nem vite.config.mts aqui.
export async function setupVite(app: Express, _server: any) {
  if (process.env.NODE_ENV !== "development") return;

  const { createServer } = await import("vite");

  const vite = await createServer({
    // deixa o Vite ler o arquivo no root em runtime
    configFile: path.resolve(process.cwd(), "vite.config.mts"),
    server: { middlewareMode: true },
    appType: "custom",
  });

  app.use(vite.middlewares);
}

// Prod: serve o build do Vite (SPA)
export function serveStatic(app: Express) {
  const publicDir = path.resolve(process.cwd(), "dist/public");

  if (!fs.existsSync(publicDir)) {
    log(`WARN: pasta ${publicDir} não encontrada. Você rodou "vite build"?`);
    return;
  }

  // import lazy para evitar duplicar express no bundle
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const express = require("express") as typeof import("express");

  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}
