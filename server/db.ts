import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Clean the DATABASE_URL if it has the psql command prefix
let cleanDatabaseUrl = process.env.DATABASE_URL;
if (cleanDatabaseUrl.startsWith("psql '") && cleanDatabaseUrl.endsWith("'")) {
  // Extract URL from "psql 'postgresql://...'"
  cleanDatabaseUrl = cleanDatabaseUrl.slice(6, -1); // Remove "psql '" and trailing "'"
}

export const pool = new Pool({ connectionString: cleanDatabaseUrl });
export const db = drizzle({ client: pool, schema });
