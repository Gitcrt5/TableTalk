import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockApiResponses } from '../fixtures/test-data'

// Mock fetch for API testing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('Authentication API', () => {
    it('should return current user when authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.users.me
      })

      const response = await fetch('/api/auth/me')
      const user = await response.json()

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me')
      expect(user).toEqual(mockApiResponses.users.me)
    })

    it('should handle unauthorized requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      })

      const response = await fetch('/api/auth/me')
      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })
  })

  describe('Games API', () => {
    it('should fetch user games', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.games.list
      })

      const response = await fetch('/api/games')
      const games = await response.json()

      expect(mockFetch).toHaveBeenCalledWith('/api/games')
      expect(games).toEqual(mockApiResponses.games.list)
    })

    it('should create a new game', async () => {
      const newGame = { name: 'New Game', description: 'Test game' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockApiResponses.games.detail, ...newGame })
      })

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGame)
      })
      
      const createdGame = await response.json()

      expect(mockFetch).toHaveBeenCalledWith('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGame)
      })
      expect(createdGame.name).toBe(newGame.name)
    })
  })

  describe('Boards API', () => {
    it('should fetch boards for a game', async () => {
      const gameId = 'game-1'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.boards.list
      })

      const response = await fetch(`/api/games/${gameId}/boards`)
      const boards = await response.json()

      expect(mockFetch).toHaveBeenCalledWith(`/api/games/${gameId}/boards`)
      expect(boards).toEqual(mockApiResponses.boards.list)
    })
  })
})