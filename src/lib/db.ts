import { Pool } from "pg";
import { explicitSsl } from "./db-url.mjs";

// One pool per server instance. On Vercel, use Neon's *pooled* connection string
// (the host contains "-pooler") so many short-lived functions don't exhaust connections.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

export const db =
  globalForDb.pgPool ??
  new Pool({
    connectionString: explicitSsl(process.env.DATABASE_URL),
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgPool = db;
