export interface ParsedPBN {
  title?: string;
  tournament?: string;
  round?: string;
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
            tournament = value;
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
  
  title = tournament + (round ? ` - ${round}` : '');
  
  return {
    title,
    tournament,
    round,
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
  // Convert PBN format "KJ432.A98.T987.2" to display format "♠KJ432 ♥A98 ♦T987 ♣2"
  const suits = handString.split('.');
  const symbols = ['♠', '♥', '♦', '♣'];
  
  return suits.map((suit, index) => {
    if (!suit || suit === '-') return '';
    // Replace T with 10 for display
    const displaySuit = suit.replace(/T/g, '10');
    return `${symbols[index]}${displaySuit}`;
  }).filter(s => s).join(' ');
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
  return !!(
    hand.boardNumber &&
    hand.dealer &&
    hand.vulnerability &&
    hand.northHand &&
    hand.southHand &&
    hand.eastHand &&
    hand.westHand &&
    hand.actualBidding
  );
}
