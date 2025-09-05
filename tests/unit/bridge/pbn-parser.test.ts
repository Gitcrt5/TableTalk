import { describe, it, expect } from 'vitest'
import { samplePBNData } from '../../fixtures/test-data'

// Mock PBN Parser functions (these would be from your actual pbnParser.ts)
const parsePBN = (pbnData: string) => {
  const lines = pbnData.trim().split('\n')
  const result: Record<string, any> = {}
  
  lines.forEach(line => {
    const match = line.match(/\[([^"]+)\s+"([^"]+)"\]/)
    if (match) {
      result[match[1]] = match[2]
    }
  })
  
  return result
}

const validateDeal = (deal: string): boolean => {
  // Simple validation: should have 4 hands separated by spaces
  const hands = deal.split(' ')
  if (hands.length !== 4) return false
  
  // Each hand should have 4 suits separated by dots
  return hands.every(hand => {
    const suits = hand.split('.')
    return suits.length === 4
  })
}

const parseHand = (handString: string) => {
  const suits = handString.split('.')
  return {
    spades: suits[0] || '',
    hearts: suits[1] || '',
    diamonds: suits[2] || '', 
    clubs: suits[3] || ''
  }
}

describe('PBN Parser', () => {
  describe('parsePBN', () => {
    it('should parse basic PBN data correctly', () => {
      const parsed = parsePBN(samplePBNData)
      
      expect(parsed.Event).toBe('Weekly Club Game')
      expect(parsed.Board).toBe('1')
      expect(parsed.Dealer).toBe('N')
      expect(parsed.Vulnerable).toBe('None')
      expect(parsed.Contract).toBe('3NT')
      expect(parsed.Result).toBe('9')
    })

    it('should handle empty PBN data', () => {
      const parsed = parsePBN('')
      expect(Object.keys(parsed)).toHaveLength(0)
    })

    it('should ignore malformed lines', () => {
      const malformedPBN = `
        [Event "Test Event"]
        Invalid line without brackets
        [Board "1"]
      `
      const parsed = parsePBN(malformedPBN)
      
      expect(parsed.Event).toBe('Test Event')
      expect(parsed.Board).toBe('1')
      expect(parsed.Invalid).toBeUndefined()
    })
  })

  describe('validateDeal', () => {
    it('should validate correct deal format', () => {
      const validDeal = 'AKQ.234.AKQ.2345 .AKQJ.234.AKQJ98 2345.567.567.67 J98765.8.J98.T'
      expect(validateDeal(validDeal)).toBe(true)
    })

    it('should reject deals with wrong number of hands', () => {
      const invalidDeal = 'AKQ.234.AKQ.2345 .AKQJ.234.AKQJ98 2345.567.567.67' // Only 3 hands
      expect(validateDeal(invalidDeal)).toBe(false)
    })

    it('should reject hands with wrong number of suits', () => {
      const invalidDeal = 'AKQ.234.AKQ .AKQJ.234.AKQJ98 2345.567.567.67 J98765.8.J98.T' // First hand missing clubs
      expect(validateDeal(invalidDeal)).toBe(false)
    })
  })

  describe('parseHand', () => {
    it('should parse hand string into suits', () => {
      const handString = 'AKQ.234.567.89T'
      const hand = parseHand(handString)
      
      expect(hand.spades).toBe('AKQ')
      expect(hand.hearts).toBe('234')
      expect(hand.diamonds).toBe('567')
      expect(hand.clubs).toBe('89T')
    })

    it('should handle void suits', () => {
      const handString = 'AKQJT987..5432.'
      const hand = parseHand(handString)
      
      expect(hand.spades).toBe('AKQJT987')
      expect(hand.hearts).toBe('')
      expect(hand.diamonds).toBe('5432')
      expect(hand.clubs).toBe('')
    })

    it('should handle partial hand data', () => {
      const handString = 'AKQ.234'
      const hand = parseHand(handString)
      
      expect(hand.spades).toBe('AKQ')
      expect(hand.hearts).toBe('234')
      expect(hand.diamonds).toBe('')
      expect(hand.clubs).toBe('')
    })
  })
})