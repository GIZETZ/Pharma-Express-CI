import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use environment variable for database URL
const databaseUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_xbkj5ZsNWfI4@ep-floral-mouse-a2pjisa8-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
