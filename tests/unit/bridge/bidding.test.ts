import { describe, it, expect } from 'vitest'

// Mock bridge bidding validation functions
type BidLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7
type BidSuit = 'C' | 'D' | 'H' | 'S' | 'NT'
type SpecialBid = 'Pass' | 'Double' | 'Redouble'
type Bid = `${BidLevel}${BidSuit}` | SpecialBid

const isValidBid = (bid: Bid, previousBids: Bid[]): boolean => {
  if (['Pass', 'Double', 'Redouble'].includes(bid)) {
    return true // Simplified validation for special bids
  }
  
  if (previousBids.length === 0) {
    return true // First bid is always valid
  }
  
  const lastContractBid = previousBids
    .slice()
    .reverse()
    .find(b => !['Pass', 'Double', 'Redouble'].includes(b)) as `${BidLevel}${BidSuit}` | undefined
    
  if (!lastContractBid) {
    return true // No previous contract bids
  }
  
  // Extract level and suit from bids
  const currentLevel = parseInt(bid[0])
  const currentSuit = bid.slice(1)
  const lastLevel = parseInt(lastContractBid[0])
  const lastSuit = lastContractBid.slice(1)
  
  // Suit hierarchy: C < D < H < S < NT
  const suitOrder = { 'C': 1, 'D': 2, 'H': 3, 'S': 4, 'NT': 5 }
  
  if (currentLevel > lastLevel) {
    return true
  }
  
  if (currentLevel === lastLevel) {
    return suitOrder[currentSuit as keyof typeof suitOrder] > suitOrder[lastSuit as keyof typeof suitOrder]
  }
  
  return false
}

const calculateBiddingValue = (bid: `${BidLevel}${BidSuit}`): number => {
  const level = parseInt(bid[0])
  const suit = bid.slice(1)
  const suitOrder = { 'C': 1, 'D': 2, 'H': 3, 'S': 4, 'NT': 5 }
  
  return level * 5 + suitOrder[suit as keyof typeof suitOrder]
}

describe('Bridge Bidding Validation', () => {
  describe('isValidBid', () => {
    it('should allow first bid to be anything', () => {
      expect(isValidBid('1C', [])).toBe(true)
      expect(isValidBid('7NT', [])).toBe(true)
      expect(isValidBid('Pass', [])).toBe(true)
    })

    it('should enforce level hierarchy', () => {
      const previousBids: Bid[] = ['1C']
      
      expect(isValidBid('2C', previousBids)).toBe(true)
      expect(isValidBid('1D', previousBids)).toBe(true) // Same level, higher suit
      expect(isValidBid('1C', previousBids)).toBe(false) // Same bid
      expect(isValidBid('1NT', previousBids)).toBe(true) // Same level, highest suit
    })

    it('should enforce suit hierarchy within same level', () => {
      const previousBids: Bid[] = ['1H']
      
      expect(isValidBid('1S', previousBids)).toBe(true) // Higher suit
      expect(isValidBid('1NT', previousBids)).toBe(true) // Highest suit
      expect(isValidBid('1D', previousBids)).toBe(false) // Lower suit
      expect(isValidBid('1C', previousBids)).toBe(false) // Lower suit
    })

    it('should handle multiple previous bids correctly', () => {
      const previousBids: Bid[] = ['1C', 'Pass', '1H', 'Pass']
      
      expect(isValidBid('1S', previousBids)).toBe(true) // Higher than last contract (1H)
      expect(isValidBid('2C', previousBids)).toBe(true) // Higher level
      expect(isValidBid('1D', previousBids)).toBe(false) // Lower than 1H
    })

    it('should always allow special bids', () => {
      const previousBids: Bid[] = ['1C', '1H', '2S']
      
      expect(isValidBid('Pass', previousBids)).toBe(true)
      expect(isValidBid('Double', previousBids)).toBe(true)
      expect(isValidBid('Redouble', previousBids)).toBe(true)
    })
  })

  describe('calculateBiddingValue', () => {
    it('should calculate bid values correctly', () => {
      expect(calculateBiddingValue('1C')).toBe(6) // 1*5 + 1
      expect(calculateBiddingValue('1NT')).toBe(10) // 1*5 + 5
      expect(calculateBiddingValue('2C')).toBe(11) // 2*5 + 1
      expect(calculateBiddingValue('7NT')).toBe(40) // 7*5 + 5
    })

    it('should maintain correct ordering', () => {
      expect(calculateBiddingValue('1C')).toBeLessThan(calculateBiddingValue('1D'))
      expect(calculateBiddingValue('1H')).toBeLessThan(calculateBiddingValue('1S'))
      expect(calculateBiddingValue('1S')).toBeLessThan(calculateBiddingValue('1NT'))
      expect(calculateBiddingValue('1NT')).toBeLessThan(calculateBiddingValue('2C'))
    })
  })

  describe('Bidding Sequences', () => {
    it('should validate complete bidding sequences', () => {
      const sequence: Bid[] = ['1C', 'Pass', '1H', 'Pass', '1NT', 'Pass', 'Pass', 'Pass']
      
      for (let i = 1; i < sequence.length; i++) {
        const previousBids = sequence.slice(0, i)
        const currentBid = sequence[i]
        expect(isValidBid(currentBid, previousBids)).toBe(true)
      }
    })

    it('should reject invalid sequences', () => {
      const previousBids: Bid[] = ['1C', 'Pass', '1H']
      expect(isValidBid('1D', previousBids)).toBe(false) // Going backwards
      expect(isValidBid('1C', previousBids)).toBe(false) // Same as first bid
    })
  })
})