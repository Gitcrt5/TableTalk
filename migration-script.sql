-- Migration script to transform existing data to new PRD schema
-- This script preserves existing data while transforming to the new structure

-- Step 1: Create user types and insert default data
INSERT INTO user_types (code, label, description) VALUES 
  ('player', 'Player', 'Standard bridge player'),
  ('teacher', 'Teacher', 'Bridge instructor with teaching tools'),
  ('admin', 'Administrator', 'Platform administrator'),
  ('moderator', 'Moderator', 'Community moderator'),
  ('test', 'Test User', 'Test account for development')
ON CONFLICT (code) DO NOTHING;

-- Step 2: Update users table to set user_type_id to player type for existing users
UPDATE users 
SET user_type_id = (SELECT user_type_id FROM user_types WHERE code = 'player')
WHERE user_type_id IS NULL;

-- Step 3: Migrate games table data to new structure
-- Create temporary mapping for game ownership through game_participants
INSERT INTO game_participants (game_id, user_id, role, is_editor)
SELECT 
  g.id as game_id,
  g.creator_id as user_id,
  'owner'::game_role as role,
  true as is_editor
FROM games_backup g
WHERE g.creator_id IS NOT NULL;

-- Add partner as participant if they exist
INSERT INTO game_participants (game_id, user_id, role, is_editor)
SELECT 
  g.id as game_id,
  g.partner_id as user_id,
  'player'::game_role as role,
  true as is_editor
FROM games_backup g
WHERE g.partner_id IS NOT NULL;

-- Step 4: Update games table with migrated data
UPDATE games SET
  owner_user_id = gb.creator_id,
  date = DATE(gb.game_date),
  board_count = gb.total_boards,
  pbn_raw = CASE WHEN gb.pbn_data IS NOT NULL THEN gb.pbn_data::text ELSE NULL END,
  type = 'USER'::game_type,
  visibility = CASE 
    WHEN gb.visibility = 'public' THEN 'public'::visibility_type
    WHEN gb.visibility = 'private' THEN 'private'::visibility_type
    ELSE 'public'::visibility_type
  END
FROM games_backup gb
WHERE games.game_id = gb.id;

-- Step 5: Migrate boards data - convert JSONB hands to individual columns
UPDATE boards SET
  dealer = bb.dealer,
  vulnerability = bb.vulnerability,
  north_hand = (bb.hands->>'N')::text,
  east_hand = (bb.hands->>'E')::text,
  south_hand = (bb.hands->>'S')::text,
  west_hand = (bb.hands->>'W')::text,
  bidding = bb.bidding_sequence,
  contract = bb.contract,
  declarer = bb.declarer,
  result = bb.result,
  lead_card = bb.lead_card,
  notes = bb.notes
FROM boards_backup bb
WHERE boards.board_id = bb.id;

-- Step 6: Migrate comments data to new structure
UPDATE comments SET
  user_id = cb.author_id,
  body = cb.content,
  visibility = CASE 
    WHEN cb.is_private = true THEN 'private'::visibility_type
    ELSE 'public'::visibility_type
  END,
  comment_type = 'analysis'::comment_type
FROM comments_backup cb
WHERE comments.comment_id = cb.id;

-- Step 7: Update partnerships to new structure
UPDATE partnerships SET
  user_id = pb.player1_id,
  partner_user_id = pb.player2_id,
  is_active = CASE 
    WHEN pb.status = 'active' THEN true
    ELSE false
  END
FROM partnerships_backup pb
WHERE partnerships.partnership_id = pb.id;

-- Step 8: Clean up temporary backup tables
DROP TABLE users_backup;
DROP TABLE games_backup;
DROP TABLE boards_backup;
DROP TABLE comments_backup;
DROP TABLE partnerships_backup;
DROP TABLE events_backup;