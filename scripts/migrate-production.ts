#!/usr/bin/env tsx
import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "../server/db";
import { readdir } from "fs/promises";
import { existsSync } from "fs";

/**
 * Production-safe database migration script
 * This script applies pending migrations to the production database
 */
async function migrateProduction() {
  console.log("🚀 Starting production database migration...");
  
  // Safety check - only run in production or staging
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
    console.log("⚠️  This script is intended for production/staging environments only");
    console.log("   Current NODE_ENV:", process.env.NODE_ENV);
    console.log("   Use 'npm run db:push' for development");
    process.exit(1);
  }

  try {
    // Check if migrations directory exists
    const migrationsDir = "./migrations";
    if (!existsSync(migrationsDir)) {
      console.log("📁 No migrations directory found. Creating initial migration...");
      console.log("   Run 'npm run db:generate' to create migration files");
      process.exit(1);
    }

    // List available migrations
    const migrationFiles = await readdir(migrationsDir);
    const sqlFiles = migrationFiles.filter(file => file.endsWith('.sql'));
    
    if (sqlFiles.length === 0) {
      console.log("📄 No migration files found");
      console.log("   Database schema is up to date");
      process.exit(0);
    }

    console.log(`📋 Found ${sqlFiles.length} migration file(s):`);
    sqlFiles.forEach(file => console.log(`   - ${file}`));

    // Apply migrations
    console.log("⏳ Applying migrations...");
    await migrate(db, { migrationsFolder: migrationsDir });
    
    console.log("✅ Database migration completed successfully!");
    console.log("🎯 Production database schema is now up to date");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.error("🔧 Troubleshooting:");
    console.error("   1. Check DATABASE_URL is set correctly");
    console.error("   2. Ensure database is accessible");
    console.error("   3. Verify migration files are valid");
    console.error("   4. Check database permissions");
    process.exit(1);
  }
}

// Run the migration
migrateProduction().then(() => {
  console.log("🎉 Migration process completed!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Migration process failed:", error);
  process.exit(1);
});