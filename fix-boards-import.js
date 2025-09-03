import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Better CSV parser for complex data
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] === ',')) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      i++;
      continue;
    } else {
      current += char;
    }
    i++;
  }
  
  result.push(current);
  return result;
};

const parseCSV = (content) => {
  const lines = content.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      // Handle null/empty values
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
      // Handle numeric values (but not IDs)
      else if (value && !isNaN(value) && !isNaN(parseFloat(value)) && header !== 'id' && !header.includes('_id')) {
        value = parseFloat(value);
      }
      
      row[header] = value;
    });
    data.push(row);
  }
  
  return data;
};

const importBoards = async () => {
  console.log('Fixing board data import...');
  
  try {
    // Clear existing board data if any
    await supabase.from('boards').delete().neq('id', '');
    
    // Import boards with better parsing
    const boardsCSV = fs.readFileSync('/tmp/boards.csv', 'utf8');
    const boards = parseCSV(boardsCSV);
    
    console.log(`Found ${boards.length} boards to import`);
    
    for (const board of boards) {
      const boardData = {
        id: board.id,
        game_id: board.game_id,
        board_number: parseInt(board.board_number),
        event_deal_id: board.event_deal_id || null,
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
        result: board.result ? parseInt(board.result) : null,
        tricks_taken: board.tricks_taken ? parseInt(board.tricks_taken) : null,
        lead_card: board.lead_card,
        notes: board.notes,
        analysis_notes: board.analysis_notes,
        score: board.score ? parseInt(board.score) : null,
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

    // Verify the import
    const { data: boardCount } = await supabase
      .from('boards')
      .select('id', { count: 'exact' });
    
    console.log(`Boards imported: ${boardCount?.length || 0}`);

  } catch (error) {
    console.error('Board import failed:', error);
    process.exit(1);
  }
};

importBoards().then(() => {
  console.log('Board import completed');
  process.exit(0);
}).catch(err => {
  console.error('Board import failed:', err);
  process.exit(1);
});