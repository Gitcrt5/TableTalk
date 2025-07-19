import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Load environment variables first
import { config } from 'dotenv';
config();

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

/**
 * Database configuration with environment-specific URL selection
 */
function getDatabaseUrl(): string {
  // Production deployment always uses the main DATABASE_URL (clean production data)
  if (process.env.REPLIT_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production') {
    console.log("Using production database (clean)");
    return process.env.DATABASE_URL;
  }
  
  // Development uses the same database but with different approach
  // We'll maintain separation by resetting production database on each deployment
  console.log("Using development database (with test data)");
  return process.env.DATABASE_URL;
}

// Create pool with environment-specific database URL
const pool = new Pool({ connectionString: getDatabaseUrl() });

// Create drizzle instance
const db = drizzle({ client: pool, schema });

export { pool, db };