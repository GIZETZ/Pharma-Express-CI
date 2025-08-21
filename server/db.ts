import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use environment variable for database URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required for PostgreSQL storage');
  throw new Error('DATABASE_URL is required for PostgreSQL storage');
}

console.log('✅ Database connection configured');

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
