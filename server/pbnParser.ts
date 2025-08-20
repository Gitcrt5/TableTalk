import { type BridgeHands, type Direction, type Vulnerability } from "@shared/schema";

interface ParsedBoard {
  boardNumber: number;
  dealer: Direction;
  vulnerability: Vulnerability;
  hands: BridgeHands;
}

export function parsePBNFile(pbnContent: string): ParsedBoard[] {
  const boards: ParsedBoard[] = [];
  const lines = pbnContent.split('\n').map(line => line.trim()).filter(line => line);
  
  let currentBoard: Partial<ParsedBoard> = {};
  
  for (const line of lines) {
    if (line.startsWith('[Board ')) {
      // Save previous board if complete
      if (currentBoard.boardNumber && currentBoard.dealer && currentBoard.vulnerability && currentBoard.hands) {
        boards.push(currentBoard as ParsedBoard);
      }
      
      // Start new board
      const boardMatch = line.match(/\[Board "(\d+)"\]/);
      if (boardMatch) {
        currentBoard = {
          boardNumber: parseInt(boardMatch[1]),
        };
      }
    } else if (line.startsWith('[Dealer ')) {
      const dealerMatch = line.match(/\[Dealer "([NESW])"\]/);
      if (dealerMatch) {
        currentBoard.dealer = dealerMatch[1] as Direction;
      }
    } else if (line.startsWith('[Vulnerable ')) {
      const vulnMatch = line.match(/\[Vulnerable "([^"]+)"\]/);
      if (vulnMatch) {
        const vuln = vulnMatch[1];
        if (vuln === "None") {
          currentBoard.vulnerability = "None";
        } else if (vuln === "NS") {
          currentBoard.vulnerability = "NS";
        } else if (vuln === "EW") {
          currentBoard.vulnerability = "EW";
        } else if (vuln === "All") {
          currentBoard.vulnerability = "Both";
        }
      }
    } else if (line.startsWith('[Deal ')) {
      const dealMatch = line.match(/\[Deal "([NESW]):([^"]+)"\]/);
      if (dealMatch) {
        const firstHand = dealMatch[1] as Direction;
        const dealString = dealMatch[2];
        currentBoard.hands = parseDealString(dealString, firstHand);
      }
    }
  }
  
  // Add the last board if complete
  if (currentBoard.boardNumber && currentBoard.dealer && currentBoard.vulnerability && currentBoard.hands) {
    boards.push(currentBoard as ParsedBoard);
  }
  
  return boards;
}

function parseDealString(dealString: string, firstHand: Direction): BridgeHands {
  const hands = dealString.split(' ');
  const directions: Direction[] = ['N', 'E', 'S', 'W'];
  const startIndex = directions.indexOf(firstHand);
  
  const result: BridgeHands = {
    N: { S: '', H: '', D: '', C: '' },
    E: { S: '', H: '', D: '', C: '' },
    S: { S: '', H: '', D: '', C: '' },
    W: { S: '', H: '', D: '', C: '' },
  };
  
  for (let i = 0; i < 4; i++) {
    const direction = directions[(startIndex + i) % 4];
    const handString = hands[i];
    
    if (handString) {
      const suits = handString.split('.');
      if (suits.length === 4) {
        result[direction] = {
          S: suits[0] || '',
          H: suits[1] || '',
          D: suits[2] || '',
          C: suits[3] || '',
        };
      }
    }
  }
  
  return result;
}
