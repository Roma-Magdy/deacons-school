import { Pool } from "pg";
import { explicitSsl } from "./db-url.mjs";

// One pool per server instance. On Vercel, use Neon's *pooled* connection string
// (the host contains "-pooler") so many short-lived functions don't exhaust connections.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

function createPool() {
  const pool = new Pool({
    connectionString: explicitSsl(process.env.DATABASE_URL),
    max: 5,
    // Without a timeout, a database that can't be reached makes every request hang forever instead of failing.
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  });
  // Neon drops idle connections. pg reports that as an "error" event, and an event nobody listens to crashes the whole
  // server process. The pool simply opens a fresh connection the next time one is needed.
  pool.on("error", (err) => console.error("Idle database connection dropped:", err.message));
  return pool;
}

export const db = globalForDb.pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") globalForDb.pgPool = db;
