import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Helper function to parse CSV
const parseCSV = (content) => {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index];
      // Handle null values
      if (value === '' || value === 'NULL') {
        value = null;
      }
      // Handle JSON values
      else if (value && (value.startsWith('{') || value.startsWith('['))) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if JSON parse fails
        }
      }
      // Handle boolean values
      else if (value === 't') {
        value = true;
      } else if (value === 'f') {
        value = false;
      }
      // Handle numeric values
      else if (value && !isNaN(value) && !isNaN(parseFloat(value))) {
        value = parseFloat(value);
      }
      
      row[header] = value;
    });
    data.push(row);
  }
  
  return data;
};

const importData = async () => {
  console.log('Starting data import...');
  
  try {
    // First, create a default user type
    console.log('Creating default user type...');
    const { data: userTypeData, error: userTypeError } = await supabase
      .from('user_types')
      .insert({
        id: 'e1905bd5-e584-427a-8b47-26bb55b58461',
        code: 'player',
        label: 'Player',
        description: 'Regular bridge player'
      })
      .select();
    
    if (userTypeError && !userTypeError.message.includes('duplicate key')) {
      console.error('Error creating user type:', userTypeError);
    } else {
      console.log('User type created successfully');
    }

    // Import users
    console.log('Importing users...');
    const usersCSV = fs.readFileSync('/tmp/users.csv', 'utf8');
    const users = parseCSV(usersCSV);
    
    for (const user of users) {
      const userData = {
        id: user.id,
        email: user.email,
        firebase_uid: user.firebase_uid,
        display_name: user.display_name,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type_id: user.user_type_id,
        is_active: user.is_active,
        last_login: user.last_login,
        preferences: user.preferences || {},
        created_at: user.created_at,
        updated_at: user.updated_at,
        home_club_id: user.home_club_id
      };
      
      const { error } = await supabase
        .from('users')
        .insert(userData);
      
      if (error) {
        console.error('Error importing user:', user.email, error.message);
      } else {
        console.log('Imported user:', user.email);
      }
    }

    // Import games
    console.log('Importing games...');
    const gamesCSV = fs.readFileSync('/tmp/games.csv', 'utf8');
    const games = parseCSV(gamesCSV);
    
    for (const game of games) {
      const gameData = {
        id: game.id,
        name: game.name,
        description: game.description,
        creator_id: game.creator_id,
        partner_id: game.partner_id,
        owner_id: game.owner_id,
        visibility: game.visibility,
        event_id: game.event_id,
        game_date: game.game_date,
        club_name: game.club_name,
        pbn_data: game.pbn_data,
        total_boards: game.total_boards,
        type: game.type,
        is_published: game.is_published,
        published_at: game.published_at,
        session_notes: game.session_notes,
        completed_boards: game.completed_boards,
        pair_numbers: game.pair_numbers,
        session_metadata: game.session_metadata,
        created_at: game.created_at,
        updated_at: game.updated_at
      };
      
      const { error } = await supabase
        .from('games')
        .insert(gameData);
      
      if (error) {
        console.error('Error importing game:', game.name, error.message);
      } else {
        console.log('Imported game:', game.name);
      }
    }

    // Import boards
    console.log('Importing boards...');
    const boardsCSV = fs.readFileSync('/tmp/boards.csv', 'utf8');
    const boards = parseCSV(boardsCSV);
    
    for (const board of boards) {
      const boardData = {
        id: board.id,
        game_id: board.game_id,
        board_number: board.board_number,
        event_deal_id: board.event_deal_id,
        dealer: board.dealer,
        vulnerability: board.vulnerability,
        hands: board.hands,
        north_hand: board.north_hand,
        east_hand: board.east_hand,
        south_hand: board.south_hand,
        west_hand: board.west_hand,
        optimum_info: board.optimum_info,
        bidding_sequence: board.bidding_sequence,
        bidding: board.bidding,
        contract: board.contract,
        declarer: board.declarer,
        result: board.result,
        tricks_taken: board.tricks_taken,
        lead_card: board.lead_card,
        notes: board.notes,
        analysis_notes: board.analysis_notes,
        score: board.score,
        board_metadata: board.board_metadata,
        created_at: board.created_at,
        updated_at: board.updated_at
      };
      
      const { error } = await supabase
        .from('boards')
        .insert(boardData);
      
      if (error) {
        console.error('Error importing board:', board.board_number, error.message);
      } else {
        console.log('Imported board:', board.board_number);
      }
    }

    console.log('Data import completed successfully!');
    
    // Verify the import
    const { data: userCount } = await supabase
      .from('users')
      .select('id', { count: 'exact' });
    
    const { data: gameCount } = await supabase
      .from('games')
      .select('id', { count: 'exact' });
    
    const { data: boardCount } = await supabase
      .from('boards')
      .select('id', { count: 'exact' });
    
    console.log(`Import verification:
    - Users: ${userCount?.length || 0}
    - Games: ${gameCount?.length || 0}  
    - Boards: ${boardCount?.length || 0}`);

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
};

importData().then(() => {
  console.log('Import process completed');
  process.exit(0);
}).catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});