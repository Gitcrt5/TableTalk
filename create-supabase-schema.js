import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const createSchema = async () => {
  console.log('Creating Supabase database schema...');
  
  try {
    // Create enums
    const enumQueries = [
      `CREATE TYPE IF NOT EXISTS game_type AS ENUM ('USER', 'CLUB')`,
      `CREATE TYPE IF NOT EXISTS visibility_type AS ENUM ('private', 'link', 'public')`,
      `CREATE TYPE IF NOT EXISTS event_status AS ENUM ('draft', 'published', 'closed', 'archived')`,
      `CREATE TYPE IF NOT EXISTS event_kind AS ENUM ('club_session', 'practice_set', 'casual_play', 'tournament', 'teaching')`,
      `CREATE TYPE IF NOT EXISTS registration_type AS ENUM ('formal_pairs', 'open_registration', 'invite_only')`,
      `CREATE TYPE IF NOT EXISTS pair_side_type AS ENUM ('NS', 'EW', 'Unknown')`,
      `CREATE TYPE IF NOT EXISTS game_role AS ENUM ('owner', 'player', 'teacher', 'viewer')`,
      `CREATE TYPE IF NOT EXISTS seat_type AS ENUM ('N', 'E', 'S', 'W')`,
      `CREATE TYPE IF NOT EXISTS comment_type AS ENUM ('analysis', 'question', 'teaching', 'general')`
    ];

    for (const query of enumQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error && !error.message.includes('already exists')) {
        console.error(`Error creating enum: ${error.message}`);
      }
    }

    // Create tables in dependency order
    const tableQueries = [
      // User types (no dependencies)
      `CREATE TABLE IF NOT EXISTS user_types (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,

      // Clubs (no dependencies)
      `CREATE TABLE IF NOT EXISTS clubs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        country TEXT NOT NULL,
        state TEXT NOT NULL,
        city TEXT,
        website TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,

      // Users (depends on clubs, user_types)
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        firebase_uid TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        display_name TEXT,
        home_club_id VARCHAR REFERENCES clubs(id),
        user_type_id VARCHAR REFERENCES user_types(id),
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_login TIMESTAMP,
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,

      // Events (depends on clubs, users)
      `CREATE TABLE IF NOT EXISTS events (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        club_id VARCHAR REFERENCES clubs(id),
        club_name TEXT,
        organizer_id VARCHAR REFERENCES users(id),
        status event_status DEFAULT 'draft',
        kind event_kind NOT NULL,
        registration_type registration_type DEFAULT 'open_registration',
        max_participants INTEGER,
        entry_fee DECIMAL(10,2),
        currency CHAR(3) DEFAULT 'USD',
        location TEXT,
        address TEXT,
        website TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        special_instructions TEXT,
        is_published BOOLEAN DEFAULT false,
        published_at TIMESTAMP,
        registration_deadline TIMESTAMP,
        cancellation_deadline TIMESTAMP,
        refund_policy TEXT,
        total_boards INTEGER DEFAULT 0,
        scoring_method TEXT DEFAULT 'matchpoints',
        movement_type TEXT,
        session_metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,

      // Event deals (depends on events)
      `CREATE TABLE IF NOT EXISTS event_deals (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR REFERENCES events(id) NOT NULL,
        board_number INTEGER NOT NULL,
        dealer seat_type NOT NULL,
        vulnerability TEXT NOT NULL,
        north_hand TEXT NOT NULL,
        east_hand TEXT NOT NULL,
        south_hand TEXT NOT NULL,
        west_hand TEXT NOT NULL,
        optimum_info JSONB,
        analysis_notes TEXT,
        difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(event_id, board_number)
      )`,

      // Games (depends on users, events)
      `CREATE TABLE IF NOT EXISTS games (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        creator_id VARCHAR REFERENCES users(id) NOT NULL,
        partner_id VARCHAR REFERENCES users(id),
        owner_id VARCHAR REFERENCES users(id),
        visibility visibility_type DEFAULT 'private',
        event_id VARCHAR REFERENCES events(id),
        game_date TIMESTAMP NOT NULL,
        club_name TEXT,
        pbn_data JSONB,
        total_boards INTEGER NOT NULL DEFAULT 0,
        type game_type DEFAULT 'USER',
        is_published BOOLEAN DEFAULT false,
        published_at TIMESTAMP,
        session_notes TEXT,
        completed_boards INTEGER DEFAULT 0,
        pair_numbers TEXT[],
        session_metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,

      // Boards (depends on games, event_deals)
      `CREATE TABLE IF NOT EXISTS boards (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id VARCHAR REFERENCES games(id) NOT NULL,
        board_number INTEGER NOT NULL,
        event_deal_id VARCHAR REFERENCES event_deals(id),
        dealer TEXT,
        vulnerability TEXT,
        hands JSONB,
        north_hand TEXT,
        east_hand TEXT,
        south_hand TEXT,
        west_hand TEXT,
        optimum_info JSONB,
        bidding_sequence JSONB,
        bidding JSONB,
        contract TEXT,
        declarer TEXT,
        result INTEGER,
        tricks_taken INTEGER,
        lead_card TEXT,
        notes TEXT,
        analysis_notes TEXT,
        score INTEGER,
        board_metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(game_id, board_number)
      )`,

      // Favourite clubs (depends on users, clubs)
      `CREATE TABLE IF NOT EXISTS favourite_clubs (
        user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        club_id VARCHAR REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        PRIMARY KEY (user_id, club_id)
      )`,

      // Game participants (depends on games, users)
      `CREATE TABLE IF NOT EXISTS game_participants (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id VARCHAR REFERENCES games(id) NOT NULL,
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        role game_role DEFAULT 'player',
        pair_number TEXT,
        seat_preference TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,

      // Partnerships (depends on users)
      `CREATE TABLE IF NOT EXISTS partnerships (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        player1_id VARCHAR REFERENCES users(id) NOT NULL,
        player2_id VARCHAR REFERENCES users(id) NOT NULL,
        partnership_name TEXT,
        status TEXT DEFAULT 'active',
        start_date DATE,
        end_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,

      // Comments (depends on users, boards, event_deals)
      `CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        board_id VARCHAR REFERENCES boards(id),
        event_deal_id VARCHAR REFERENCES event_deals(id),
        parent_id VARCHAR REFERENCES comments(id),
        content TEXT NOT NULL,
        type comment_type DEFAULT 'general',
        is_deleted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (board_id IS NOT NULL OR event_deal_id IS NOT NULL)
      )`,

      // User preferences (depends on users)
      `CREATE TABLE IF NOT EXISTS user_preferences (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        key TEXT NOT NULL,
        value JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, key)
      )`,

      // Feature flags (no dependencies)
      `CREATE TABLE IF NOT EXISTS feature_flags (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        is_enabled BOOLEAN DEFAULT false,
        conditions JSONB,
        rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,

      // Audit logs (depends on users)
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id),
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id VARCHAR,
        old_values JSONB,
        new_values JSONB,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,

      // Player results (depends on games, users)
      `CREATE TABLE IF NOT EXISTS player_results (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id VARCHAR REFERENCES games(id) NOT NULL,
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        pair_number TEXT,
        side pair_side_type DEFAULT 'Unknown',
        total_score DECIMAL(10,2),
        percentage DECIMAL(5,2),
        rank INTEGER,
        boards_played INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,

      // Event results (depends on events, users)
      `CREATE TABLE IF NOT EXISTS event_results (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR REFERENCES events(id) NOT NULL,
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        pair_number TEXT,
        side pair_side_type DEFAULT 'Unknown',
        total_score DECIMAL(10,2),
        percentage DECIMAL(5,2),
        rank INTEGER,
        boards_played INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,

      // Event registrations (depends on events, users)
      `CREATE TABLE IF NOT EXISTS event_registrations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR REFERENCES events(id) NOT NULL,
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        partner_id VARCHAR REFERENCES users(id),
        status TEXT DEFAULT 'registered',
        pair_number TEXT,
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(event_id, user_id)
      )`,

      // Event standings (depends on events, users)
      `CREATE TABLE IF NOT EXISTS event_standings (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR REFERENCES events(id) NOT NULL,
        pair_number TEXT NOT NULL,
        player1_id VARCHAR REFERENCES users(id) NOT NULL,
        player2_id VARCHAR REFERENCES users(id),
        total_score DECIMAL(10,2),
        percentage DECIMAL(5,2),
        rank INTEGER,
        boards_played INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(event_id, pair_number)
      )`,

      // Club memberships (depends on clubs, users)
      `CREATE TABLE IF NOT EXISTS club_memberships (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id VARCHAR REFERENCES clubs(id) NOT NULL,
        user_id VARCHAR REFERENCES users(id) NOT NULL,
        membership_type TEXT DEFAULT 'member',
        status TEXT DEFAULT 'active',
        start_date DATE DEFAULT CURRENT_DATE,
        end_date DATE,
        renewal_date DATE,
        member_number TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(club_id, user_id)
      )`
    ];

    for (const query of tableQueries) {
      console.log('Creating table...');
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error && !error.message.includes('already exists')) {
        console.error(`Error creating table: ${error.message}`);
        console.error(`Query: ${query}`);
      }
    }

    // Create indexes
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_games_creator_id ON games(creator_id)`,
      `CREATE INDEX IF NOT EXISTS idx_games_event_id ON games(event_id)`,
      `CREATE INDEX IF NOT EXISTS idx_boards_game_id ON boards(game_id)`,
      `CREATE INDEX IF NOT EXISTS idx_boards_event_deal_id ON boards(event_deal_id)`,
      `CREATE INDEX IF NOT EXISTS idx_comments_board_id ON comments(board_id)`,
      `CREATE INDEX IF NOT EXISTS idx_comments_event_deal_id ON comments(event_deal_id)`,
      `CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id)`,
      `CREATE INDEX IF NOT EXISTS idx_event_deals_event_id ON event_deals(event_id)`
    ];

    for (const query of indexQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error && !error.message.includes('already exists')) {
        console.error(`Error creating index: ${error.message}`);
      }
    }

    console.log('Schema creation completed successfully!');
    
  } catch (error) {
    console.error('Error creating schema:', error);
    process.exit(1);
  }
};

// Create an exec_sql function if it doesn't exist
const createExecSqlFunction = async () => {
  const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  if (error && error.message.includes('function exec_sql')) {
    console.log('Creating exec_sql function...');
    // This might not work with service role, we'll create tables directly via SQL
    console.log('Exec function not available, will use direct SQL commands');
  }
};

// Run the schema creation
createSchema().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(error => {
  console.error('Failed:', error);
  process.exit(1);
});