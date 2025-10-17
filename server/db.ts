import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL must be set (mysql://...)");

export const pool = await mysql.createPool({
  uri: url,
  connectionLimit: 10
});

export const db = drizzle(pool);
