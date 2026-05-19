import { Pool } from "pg";

const globalForDb = globalThis as unknown as {
  authPool?: Pool;
};

export const authPool =
  globalForDb.authPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.authPool = authPool;
}
