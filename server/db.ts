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
  // Use development database when explicitly in development mode
  // APP_ENV=development is set in .env for development, not present in deployment
  const isExplicitDevelopment = process.env.APP_ENV === 'development';
  
  if (isExplicitDevelopment && process.env.DEV_DATABASE_URL) {
    console.log("Using development database");
    return process.env.DEV_DATABASE_URL;
  }
  
  // Use production database for all deployments or when no dev database available
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