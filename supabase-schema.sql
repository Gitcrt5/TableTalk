-- Supabase Database Schema for TableTalk Bridge Platform
-- This script creates the complete database schema in Supabase

-- Create custom enum types
CREATE TYPE game_type AS ENUM ('USER', 'CLUB');
CREATE TYPE visibility_type AS ENUM ('private', 'link', 'public');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'closed', 'archived');
CREATE TYPE event_kind AS ENUM ('club_session', 'practice_set', 'casual_play', 'tournament', 'teaching');
CREATE TYPE registration_type AS ENUM ('formal_pairs', 'open_registration', 'invite_only');
CREATE TYPE pair_side_type AS ENUM ('NS', 'EW', 'Unknown');
CREATE TYPE game_role AS ENUM ('owner', 'player', 'teacher', 'viewer');
CREATE TYPE seat_type AS ENUM ('N', 'E', 'S', 'W');
CREATE TYPE comment_type AS ENUM ('analysis', 'question', 'teaching', 'general');

-- User types reference table
CREATE TABLE user_types (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Club management table
CREATE TABLE clubs (
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
);

-- Users table
CREATE TABLE users (
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
);

-- Events table (needs to come before games due to FK)
CREATE TABLE events (
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
);

-- Event deals table
CREATE TABLE event_deals (
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
);

-- Games table
CREATE TABLE games (
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
);

-- Boards table
CREATE TABLE boards (
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
);

-- Club membership and favorites
CREATE TABLE favourite_clubs (
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  club_id VARCHAR REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, club_id)
);

-- Game participants
CREATE TABLE game_participants (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id VARCHAR REFERENCES games(id) NOT NULL,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  role game_role DEFAULT 'player',
  pair_number TEXT,
  seat_preference TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Partnerships
CREATE TABLE partnerships (
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
);

-- Comments
CREATE TABLE comments (
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
);

-- User preferences
CREATE TABLE user_preferences (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, key)
);

-- Feature flags
CREATE TABLE feature_flags (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  conditions JSONB,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Audit logs
CREATE TABLE audit_logs (
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
);

-- Player results
CREATE TABLE player_results (
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
);

-- Event results
CREATE TABLE event_results (
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
);

-- Event registrations
CREATE TABLE event_registrations (
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
);

-- Event standings
CREATE TABLE event_standings (
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
);

-- Club memberships
CREATE TABLE club_memberships (
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
);

-- Create indexes for performance
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_games_creator_id ON games(creator_id);
CREATE INDEX idx_games_event_id ON games(event_id);
CREATE INDEX idx_boards_game_id ON boards(game_id);
CREATE INDEX idx_boards_event_deal_id ON boards(event_deal_id);
CREATE INDEX idx_comments_board_id ON comments(board_id);
CREATE INDEX idx_comments_event_deal_id ON comments(event_deal_id);
CREATE INDEX idx_events_club_id ON events(club_id);
CREATE INDEX idx_event_deals_event_id ON event_deals(event_id);

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Service role can access all data for backend operations)
CREATE POLICY "Service role can access all user data" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all games" ON games
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all boards" ON boards
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all comments" ON comments
  FOR ALL USING (auth.role() = 'service_role');