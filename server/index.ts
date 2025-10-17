import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// opcional: CORS apenas no dev (para o Vite)
import cors from "cors";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (app.get("env") === "development") {
  app.use(
    cors({
      origin: ["http://localhost:5173"],
      credentials: true
    })
  );
}

// ---- Session (MySQL) ----
const MySQLStore = MySQLStoreFactory(session);

const dbUrlStr = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;

if (!dbUrlStr) throw new Error("DATABASE_URL must be set (mysql://user:pass@host:port/db)");
if (!sessionSecret) throw new Error("SESSION_SECRET must be set");

const dbUrl = new URL(dbUrlStr);

const store = new MySQLStore({
  host: dbUrl.hostname,
  port: Number(dbUrl.port || 3306),
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace(/^\//, ""),
  // cria a tabela "sessions" automaticamente (colunas: session_id, expires, data)
  createDatabaseTable: true,
  schema: {
    tableName: "sessions",
    columnNames: {
      session_id: "session_id",
      expires: "expires",
      data: "data"
    }
  }
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
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 dias
    }
  })
);

// ---- Rota de healthcheck (útil para Railway)
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ---- Logger compacto para /api
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    if (!path.startsWith("/api")) return;
    const duration = Date.now() - start;
    // Não serializa o body para manter os logs curtos e baratos
    log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // deixe o log do erro aparecer nos logs do provedor
    console.error(err);
  });

  // Dev usa Vite; prod serve build estático
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
