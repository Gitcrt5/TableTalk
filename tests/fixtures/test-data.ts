import type { User, Game, Board } from '../../shared/schema'

// Test user data
export const mockUsers: Partial<User>[] = [
  {
    id: 'user-1',
    email: 'john@example.com',
    displayName: 'John Doe',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user-2',
    email: 'jane@example.com',
    displayName: 'Jane Smith',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user-3',
    email: 'bob@example.com',
    displayName: 'Bob Johnson',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

// Test game data
export const mockGames: Partial<Game>[] = [
  {
    id: 'game-1',
    name: 'Weekly Club Game',
    description: 'Our regular Thursday night game',
    creatorId: 'user-1',
    visibility: 'public',
    gameDate: '2024-01-01',
    totalBoards: 24,
    type: 'CLUB',
    isPublished: true,
    completedBoards: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'game-2',
    name: 'Tournament Practice',
    description: 'Practice for upcoming regional tournament',
    creatorId: 'user-2',
    visibility: 'private',
    gameDate: '2024-01-02',
    totalBoards: 16,
    type: 'USER',
    isPublished: false,
    completedBoards: 0,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
]

// Test board data
export const mockBoards: Partial<Board>[] = [
  {
    id: 'board-1',
    gameId: 'game-1',
    boardNumber: 1,
    dealer: 'North',
    vulnerability: 'None',
    northHand: 'SA.SK.SQ.H2.H3.H4.DA.DK.C2.C3.C4.C5.C6',
    southHand: 'S2.S3.S4.HA.HK.HQ.D2.D3.D4.CA.CK.CQ.CJ',
    eastHand: 'S5.S6.S7.H5.H6.H7.D5.D6.D7.C7.C8.C9.C10',
    westHand: 'S8.S9.S10.SJ.H8.H9.H10.HJ.D8.D9.D10.DJ.DQ',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

// Bridge test data
export const validBridgeHand = ['SA', 'SK', 'SQ', 'SJ', 'S10', 'HA', 'HK', 'HQ', 'DA', 'DK', 'DQ', 'CA', 'CK']
export const invalidBridgeHand = ['SA', 'SA', 'SK'] // duplicate card
export const shortBridgeHand = ['SA', 'SK', 'SQ'] // too few cards

// Sample PBN data
export const samplePBNData = `
[Event "Weekly Club Game"]
[Site "Bridge Club"]
[Date "2024.01.01"]
[Board "1"]
[West "West Player"]
[North "North Player"]
[East "East Player"]
[South "South Player"]
[Dealer "N"]
[Vulnerable "None"]
[Deal "N:AKQ.234.AKQ.2345 .AKQJ.234.AKQJ98 2345.567.567.67 J98765.8.J98.T"]
[Scoring "MP"]
[Declarer "N"]
[Contract "3NT"]
[Result "9"]
`

// API response mocks
export const mockApiResponses = {
  users: {
    me: mockUsers[0],
    list: mockUsers
  },
  games: {
    list: mockGames,
    detail: mockGames[0]
  },
  boards: {
    list: mockBoards,
    detail: mockBoards[0]
  }
}

// Test helpers
export const createMockUser = (overrides: Partial<User> = {}): Partial<User> => ({
  ...mockUsers[0],
  ...overrides
})

export const createMockGame = (overrides: Partial<Game> = {}): Partial<Game> => ({
  ...mockGames[0],
  ...overrides
})

export const createMockBoard = (overrides: Partial<Board> = {}): Partial<Board> => ({
  ...mockBoards[0],
  ...overrides
})