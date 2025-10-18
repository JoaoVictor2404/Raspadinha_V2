// server/vite.ts
import type { Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer, createLogger } from "vite";
import type { Server } from "http";
import { nanoid } from "nanoid";

/* ================= util ================= */
const viteLogger = createLogger();

export function log(msg: string, source = "express") {
  const time = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  console.log(`${time} [${source}] ${msg}`);
}

function cwd() {
  // Em ESM, process.cwd() é suficiente; mantemos helper caso precise de __dirname
  return process.cwd();
}

function resolveFirstExisting(paths: string[]) {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Tenta resolver o caminho do index.html durante o DEV.
 * Prioriza ./index.html na raiz; fallback para ./client/index.html.
 */
function resolveDevIndexHtml(): string {
  const root = cwd();
  const candidates = [
    path.resolve(root, "index.html"),
    path.resolve(root, "client", "index.html"),
    path.resolve(root, "frontend", "index.html"),
  ];
  const found = resolveFirstExisting(candidates);
  if (!found) {
    throw new Error(
      `index.html não encontrado. Tente criar um em ${candidates
        .map((c) => path.relative(root, c))
        .join(" ou ")}`
    );
  }
  return found;
}

/* ================= DEV: Vite middleware ================= */
/**
 * Injeta o Vite como middleware em desenvolvimento.
 * - NÃO importa vite.config.* (evita bundlar config no server)
 * - Usa configFile apontando para o arquivo da raiz do projeto
 * - Suporta HMR acoplado ao servidor HTTP de fora (quando passado)
 */
export async function setupVite(app: Express, server?: Server) {
  if (process.env.NODE_ENV !== "development") {
    log("setupVite ignorado (NODE_ENV !== development)");
    return;
  }

  const configFile = path.resolve(cwd(), "vite.config.mts");

  const vite = await createViteServer({
    configFile,
    server: {
      middlewareMode: true,
      hmr: server ? { server } : true,
      allowedHosts: true as const,
    },
    appType: "custom",
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // Falha explícita em dev para não mascarar erros de Vite
        process.exitCode = 1;
      },
    },
  });

  app.use(vite.middlewares);

  // Handler para sempre entregar index.html processado pelo Vite (transformIndexHtml)
  // Isso garante HMR, injeção e cache-busting simples via nanoid.
  const devIndexHtmlPath = resolveDevIndexHtml();
  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      let template = await fs.promises.readFile(devIndexHtmlPath, "utf-8");

      // Cache-busting leve do entry padrão caso use /src/main.(t|j)sx
      template = template.replace(
        /src="\/src\/main\.(t|j)sx"/,
        (m) => `${m}?v=${nanoid()}"`
      );

      const transformed = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(transformed);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  log("Vite middleware habilitado em desenvolvimento.");
}

/* ================= PROD: arquivos estáticos ================= */
/**
 * Serve o build gerado pelo Vite.
 * Espera encontrar os arquivos em ./dist/public (padrão compatível com seu build).
 */
export async function serveStatic(app: Express) {
  const publicDir = path.resolve(cwd(), "dist", "public");

  if (!fs.existsSync(publicDir)) {
    log(
      `WARN: pasta ${publicDir} não encontrada. Você rodou "vite build"?`,
      "express"
    );
    return;
  }

  // Import dinâmico para evitar bundlar 'express' e também evitar require() em ESM
  const express = (await import("express")).default as unknown as typeof import("express").default;

  app.use(express.static(publicDir));

  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  log(`Servindo estáticos de ${publicDir}`);
}
