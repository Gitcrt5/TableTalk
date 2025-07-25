import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const PRODUCTION_DATABASE_URL = process.env.DATABASE_URL;

if (!PRODUCTION_DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables");
  process.exit(1);
}

async function updateLiveHandsSchema() {
  const sql = neon(PRODUCTION_DATABASE_URL);

  try {
    console.log("🔄 Updating live_hands table schema...");

    // Add missing columns for bridge hand data
    console.log("1. Adding dealer column...");
    await sql`
      ALTER TABLE live_hands 
      ADD COLUMN IF NOT EXISTS dealer VARCHAR(10);
    `;

    console.log("2. Adding vulnerability column...");
    await sql`
      ALTER TABLE live_hands 
      ADD COLUMN IF NOT EXISTS vulnerability VARCHAR(20);
    `;

    console.log("3. Adding hand columns...");
    await sql`
      ALTER TABLE live_hands 
      ADD COLUMN IF NOT EXISTS north_hand VARCHAR(50),
      ADD COLUMN IF NOT EXISTS south_hand VARCHAR(50),
      ADD COLUMN IF NOT EXISTS east_hand VARCHAR(50),
      ADD COLUMN IF NOT EXISTS west_hand VARCHAR(50);
    `;

    console.log("✅ Live hands table schema updated successfully!");
    
  } catch (error) {
    console.error("❌ Error updating schema:", error);
    process.exit(1);
  }
}

// Run the update
updateLiveHandsSchema();