export function formatSuitSymbol(symbol: string): string {
  switch (symbol.toLowerCase()) {
    case 's':
    case '♠':
      return '♠';
    case 'h':
    case '♥':
      return '♥';
    case 'd':
    case '♦':
      return '♦';
    case 'c':
    case '♣':
      return '♣';
    default:
      return symbol;
  }
}

export function calculateBiddingAccuracy(userBidding: string[], actualBidding: string[]): number {
  if (userBidding.length === 0 || actualBidding.length === 0) {
    return 0;
  }

  const maxLength = Math.max(userBidding.length, actualBidding.length);
  let matches = 0;

  for (let i = 0; i < maxLength; i++) {
    const userBid = userBidding[i] || "Pass";
    const actualBid = actualBidding[i] || "Pass";
    
    if (userBid === actualBid) {
      matches++;
    }
  }

  return Math.round((matches / maxLength) * 100);
}

export function parseBridgeHand(handString: string): {
  spades: string[];
  hearts: string[];
  diamonds: string[];
  clubs: string[];
} {
  const suits = handString.split(' ');
  const result = {
    spades: [] as string[],
    hearts: [] as string[],
    diamonds: [] as string[],
    clubs: [] as string[],
  };

  suits.forEach(suit => {
    if (!suit) return;
    
    const symbol = suit[0];
    const cards = suit.slice(1).split('');
    
    switch (symbol) {
      case '♠':
        result.spades = cards;
        break;
      case '♥':
        result.hearts = cards;
        break;
      case '♦':
        result.diamonds = cards;
        break;
      case '♣':
        result.clubs = cards;
        break;
    }
  });

  return result;
}

export function formatVulnerability(vulnerability: string): string {
  switch (vulnerability) {
    case 'NS':
      return 'N-S Vulnerable';
    case 'EW':
      return 'E-W Vulnerable';
    case 'Both':
      return 'Game All';
    case 'None':
      return 'Love All';
    default:
      return vulnerability;
  }
}

export function getDealerName(dealer: string): string {
  switch (dealer.toUpperCase()) {
    case 'N':
      return 'North';
    case 'E':
      return 'East';
    case 'S':
      return 'South';
    case 'W':
      return 'West';
    default:
      return dealer;
  }
}

export function formatCards(cardString: string): string {
  if (!cardString) return '';
  return cardString.replace(/10/g, 'T');
}
