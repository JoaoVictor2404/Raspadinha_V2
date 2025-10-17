import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";

const app = express();

/* ===================== Básico ===================== */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS apenas em desenvolvimento (para o Vite)
if (app.get("env") === "development") {
  app.use(
    cors({
      origin: ["http://localhost:5173"],
      credentials: true,
    })
  );
}

/* ===================== Session (MySQL) ===================== */
const MySQLStore = MySQLStoreFactory(session);

const dbUrlStr = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;

if (!dbUrlStr) {
  throw new Error(
    "DATABASE_URL must be set (ex: mysql://user:pass@host:port/db)"
  );
}
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const dbUrl = new URL(dbUrlStr);

const store = new MySQLStore({
  host: dbUrl.hostname,
  port: Number(dbUrl.port || 3306),
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace(/^\//, ""),
  createDatabaseTable: true,
  schema: {
    tableName: "sessions",
    columnNames: {
      session_id: "session_id",
      expires: "expires",
      data: "data",
    },
  },
});

app.set("trust proxy", 1);
app.use(
  session({
    name: "sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      secure: app.get("env") === "production",
      httpOnly: true,
      sameSite: app.get("env") === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    },
  })
);

/* ===================== Healthcheck (Railway etc.) ===================== */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

/* ===================== Logger compacto para /api ===================== */
/**
 * - Mede duração.
 * - Captura resposta JSON (se usada) e trunca para manter logs curtos/baratos.
 * - Só loga caminhos que começam com /api.
 */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown | undefined;

  // patch suave do res.json para capturar payload
  const originalResJson = res.json.bind(res);
  (res as Response).json = function (body: any, ...args: any[]) {
    capturedJsonResponse = body;
    return originalResJson(body, ...args);
  };

  res.on("finish", () => {
    if (!path.startsWith("/api")) return;
    const duration = Date.now() - start;

    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    if (capturedJsonResponse !== undefined) {
      try {
        const snippet = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${snippet}`;
      } catch {
        // ignora se não serializável
      }
    }

    // trunca para ~80 chars
    if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";

    log(logLine);
  });

  next();
});

/* ===================== Bootstrap ===================== */
(async () => {
  const server = await registerRoutes(app);

  // Error handler no final do pipeline
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status || err?.statusCode || 500;
    const message = err?.message || "Internal Server Error";
    try {
      // evita headers already sent
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    } finally {
      // logar o erro para o provedor (Railway, etc.)
      console.error(err);
    }
  });

  // Dev usa Vite; Prod serve build estático
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ÚNICA porta liberada no ambiente: PORT (fallback 5000)
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
