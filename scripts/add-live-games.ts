import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function addLiveGamesFeature() {
  console.log("🎮 Adding Live Games Feature...");

  try {
    // 1. Add feature flags column to users table
    console.log("1. Adding feature_flags column to users table...");
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}'::jsonb;
    `;

    // 2. Create clubs table (already exists in schema)
    console.log("2. Checking clubs table...");
    const clubsExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'clubs'
      );
    `;
    
    if (!clubsExist[0].exists) {
      console.log("   Creating clubs table...");
      await sql`
        CREATE TABLE clubs (
          id SERIAL PRIMARY KEY,
          name VARCHAR NOT NULL,
          location TEXT,
          address TEXT,
          website VARCHAR,
          phone VARCHAR,
          email VARCHAR,
          is_verified BOOLEAN DEFAULT FALSE,
          verified_by VARCHAR,
          verified_at TIMESTAMP,
          managed_by VARCHAR,
          created_by VARCHAR NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `;
    } else {
      console.log("   Clubs table already exists.");
    }

    // 3. Create live_games table
    console.log("3. Creating live_games table...");
    await sql`
      CREATE TABLE IF NOT EXISTS live_games (
        id SERIAL PRIMARY KEY,
        title VARCHAR NOT NULL,
        club_id INTEGER REFERENCES clubs(id),
        game_date TIMESTAMP NOT NULL,
        created_by VARCHAR NOT NULL,
        partner_id VARCHAR,
        status VARCHAR DEFAULT 'in_progress',
        linked_game_id INTEGER,
        visibility VARCHAR DEFAULT 'private',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // 4. Create live_hands table
    console.log("4. Creating live_hands table...");
    await sql`
      CREATE TABLE IF NOT EXISTS live_hands (
        id SERIAL PRIMARY KEY,
        live_game_id INTEGER NOT NULL REFERENCES live_games(id) ON DELETE CASCADE,
        board_number INTEGER NOT NULL,
        bidding_sequence JSONB,
        opening_lead VARCHAR,
        tricks_taken INTEGER,
        score_mp VARCHAR,
        score_imp VARCHAR,
        notes TEXT,
        last_modified TIMESTAMP DEFAULT NOW(),
        UNIQUE(live_game_id, board_number)
      );
    `;

    // 5. Create live_game_access table
    console.log("5. Creating live_game_access table...");
    await sql`
      CREATE TABLE IF NOT EXISTS live_game_access (
        live_game_id INTEGER NOT NULL REFERENCES live_games(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL,
        access_type VARCHAR DEFAULT 'view',
        granted_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (live_game_id, user_id)
      );
    `;

    // 6. Create user_favorite_clubs table
    console.log("6. Creating user_favorite_clubs table...");
    await sql`
      CREATE TABLE IF NOT EXISTS user_favorite_clubs (
        user_id VARCHAR NOT NULL,
        club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, club_id)
      );
    `;

    // 7. Add indexes for performance
    console.log("7. Adding indexes...");
    await sql`CREATE INDEX IF NOT EXISTS idx_live_games_created_by ON live_games(created_by)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_live_games_status ON live_games(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_live_hands_game_board ON live_hands(live_game_id, board_number)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clubs_name ON clubs(name)`;

    // 8. Enable feature for current user (you'll need to update the email)
    const userEmail = process.argv[2];
    if (userEmail) {
      console.log(`8. Enabling live games feature for ${userEmail}...`);
      await sql`
        UPDATE users 
        SET feature_flags = jsonb_set(
          COALESCE(feature_flags, '{}'::jsonb), 
          '{liveGames}', 
          'true'
        )
        WHERE email = ${userEmail};
      `;
      console.log(`✅ Feature enabled for ${userEmail}`);
    } else {
      console.log("8. No email provided. To enable for a user, run: tsx scripts/add-live-games.ts your@email.com");
    }

    console.log("\n✅ Live Games feature added successfully!");
    console.log("\nNext steps:");
    console.log("1. Run 'npm run db:push' to apply schema changes");
    console.log("2. Enable for a user: tsx scripts/add-live-games.ts user@email.com");
    console.log("3. Import club data when ready");

  } catch (error) {
    console.error("❌ Error adding live games feature:", error);
    process.exit(1);
  }
}

// Run the migration
addLiveGamesFeature();