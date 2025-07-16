export interface ParsedPBN {
  title?: string;
  tournament?: string;
  round?: string;
  event?: string;
  site?: string;
  date?: string;
  hands: ParsedHand[];
}

export interface ParsedHand {
  boardNumber: number;
  dealer: string;
  vulnerability: string;
  northHand: string;
  southHand: string;
  eastHand: string;
  westHand: string;
  actualBidding: string[];
  finalContract?: string;
  declarer?: string;
  result?: string;
}

export function parsePBN(pbnContent: string): ParsedPBN {
  const lines = pbnContent.split('\n').map(line => line.trim()).filter(line => line);
  
  let title = '';
  let tournament = '';
  let round = '';
  let event = '';
  let site = '';
  let date = '';
  const hands: ParsedHand[] = [];
  
  let currentHand: Partial<ParsedHand> = {};
  
  for (const line of lines) {
    if (line.startsWith('%')) {
      // Comment line, skip
      continue;
    }
    
    if (line.startsWith('[')) {
      // Tag line
      const match = line.match(/\[(\w+)\s+"([^"]+)"\]/);
      if (match) {
        const [, tag, value] = match;
        
        switch (tag) {
          case 'Event':
            event = value;
            tournament = value; // Keep for backward compatibility
            break;
          case 'Site':
            site = value;
            break;
          case 'Date':
            date = value;
            break;
          case 'Round':
            round = value;
            break;
          case 'Board':
            if (currentHand.boardNumber !== undefined) {
              // Save previous hand
              if (isValidHand(currentHand)) {
                hands.push(currentHand as ParsedHand);
              }
              currentHand = {};
            }
            currentHand.boardNumber = parseInt(value);
            break;
          case 'Dealer':
            currentHand.dealer = value;
            break;
          case 'Vulnerable':
            currentHand.vulnerability = normalizeVulnerability(value);
            break;
          case 'Deal':
            parseHands(value, currentHand);
            break;
          case 'Auction':
            currentHand.actualBidding = parseAuction(value);
            break;
          case 'Contract':
            currentHand.finalContract = value;
            break;
          case 'Declarer':
            currentHand.declarer = value;
            break;
          case 'Result':
            currentHand.result = value;
            break;
        }
      }
    }
  }
  
  // Don't forget the last hand
  if (isValidHand(currentHand)) {
    hands.push(currentHand as ParsedHand);
  }
  
  title = event + (round ? ` - ${round}` : '');
  
  return {
    title,
    tournament,
    round,
    event,
    site,
    date,
    hands,
  };
}

function parseHands(dealString: string, hand: Partial<ParsedHand>) {
  // Deal format: "N:KJ432.A98.T987.2 Q975.KJ5.A32.QJ4 AT86.Q632.65.T983 .T74.KQJ4.AK765"
  const parts = dealString.split(':');
  if (parts.length !== 2) return;
  
  const [dealer, hands] = parts;
  const handStrings = hands.split(' ');
  
  if (handStrings.length !== 4) return;
  
  // Initialize actualBidding if not already set
  if (!hand.actualBidding) {
    hand.actualBidding = [];
  }
  
  // Determine hand positions based on dealer
  const positions = getHandPositions(dealer);
  
  handStrings.forEach((handString, index) => {
    const position = positions[index];
    const formattedHand = formatHand(handString);
    
    switch (position) {
      case 'N':
        hand.northHand = formattedHand;
        break;
      case 'E':
        hand.eastHand = formattedHand;
        break;
      case 'S':
        hand.southHand = formattedHand;
        break;
      case 'W':
        hand.westHand = formattedHand;
        break;
    }
  });
}

function getHandPositions(dealer: string): string[] {
  const positions = ['N', 'E', 'S', 'W'];
  const dealerIndex = positions.indexOf(dealer);
  return positions.slice(dealerIndex).concat(positions.slice(0, dealerIndex));
}

function formatHand(handString: string): string {
  if (!handString || handString === '-') {
    return '-.-.-.';
  }
  
  // Convert PBN format "KJ432.A98.T987.2" to display format with suit dots
  const suits = handString.split('.');
  
  // Ensure we have exactly 4 suits, pad with empty if needed
  while (suits.length < 4) {
    suits.push('');
  }
  
  // Replace T with 10 and format each suit
  const formattedSuits = suits.slice(0, 4).map(suit => {
    if (!suit || suit === '-') return '';
    return suit.replace(/T/g, '10');
  });
  
  return formattedSuits.join('.');
}

function parseAuction(auctionString: string): string[] {
  // Simple auction parsing - in real implementation, this would be more sophisticated
  const bids = auctionString.split(/\s+/).filter(bid => bid && bid !== '-');
  return bids;
}

function normalizeVulnerability(vul: string): string {
  switch (vul.toLowerCase()) {
    case 'none':
    case 'love':
      return 'None';
    case 'ns':
    case 'n-s':
      return 'NS';
    case 'ew':
    case 'e-w':
      return 'EW';
    case 'all':
    case 'both':
      return 'Both';
    default:
      return 'None';
  }
}

function isValidHand(hand: Partial<ParsedHand>): hand is ParsedHand {
  // Ensure actualBidding is always initialized
  if (!hand.actualBidding) {
    hand.actualBidding = [];
  }
  
  return !!(
    hand.boardNumber &&
    hand.dealer &&
    hand.vulnerability &&
    hand.northHand &&
    hand.southHand &&
    hand.eastHand &&
    hand.westHand &&
    Array.isArray(hand.actualBidding)
  );
}
