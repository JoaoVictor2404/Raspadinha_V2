import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import type { Express } from "express";
import { pool } from "./db.js";

const MySQLStore = MySQLStoreFactory(session);

export function mountSession(app: Express) {
  const store = new MySQLStore({}, pool as any);
  app.set("trust proxy", 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET as string,
      resave: false,
      saveUninitialized: false,
      store,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7
      }
    })
  );
}
