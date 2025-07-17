import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

/**
 * Database configuration with environment-specific URL selection
 */
function getDatabaseUrl(): string {
  // Use development database URL if available and in development
  if (process.env.NODE_ENV === 'development' && process.env.DEV_DATABASE_URL) {
    console.log("Using development database");
    return process.env.DEV_DATABASE_URL;
  }
  
  // Use production database URL
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }
  
  console.log("Using production database");
  return process.env.DATABASE_URL;
}

// Create pool with environment-specific database URL
const pool = new Pool({ connectionString: getDatabaseUrl() });

// Create drizzle instance
const db = drizzle({ client: pool, schema });

export { pool, db };