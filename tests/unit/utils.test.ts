import { describe, it, expect } from 'vitest'

// Example utility functions to test (these would be in your actual utils)
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const calculateHighCardPoints = (hand: string[]): number => {
  const points = { A: 4, K: 3, Q: 2, J: 1 }
  return hand.reduce((total, card) => {
    const rank = card.slice(1) // Remove suit, get rank
    return total + (points[rank as keyof typeof points] || 0)
  }, 0)
}

describe('Utility Functions', () => {
  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true)
    })

    it('should return false for invalid email addresses', () => {
      expect(validateEmail('invalid.email')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
    })
  })

  describe('calculateHighCardPoints', () => {
    it('should calculate points correctly for a bridge hand', () => {
      const hand = ['SA', 'HK', 'DQ', 'CJ', 'S2'] // A=4, K=3, Q=2, J=1 = 10 points
      expect(calculateHighCardPoints(hand)).toBe(10)
    })

    it('should return 0 for a hand with no high cards', () => {
      const hand = ['S2', 'S3', 'H4', 'D5', 'C6']
      expect(calculateHighCardPoints(hand)).toBe(0)
    })

    it('should handle empty hand', () => {
      expect(calculateHighCardPoints([])).toBe(0)
    })
  })
})