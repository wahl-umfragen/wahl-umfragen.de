import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL must be set (see .env.example)");
}

export const pool = new Pool({ connectionString: url });
export const db = drizzle(pool, { schema });
export type Db = typeof db;
