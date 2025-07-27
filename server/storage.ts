import { games, hands, userBidding, comments, users, clubs, partners, gamePlayers, partnershipBidding, gameParticipants, liveGames, liveHands, liveGameAccess, userFavoriteClubs, type Game, type Hand, type UserBidding, type Comment, type User, type Club, type Partner, type GamePlayer, type PartnershipBidding, type GameParticipant, type LiveGame, type LiveHand, type InsertGame, type InsertHand, type InsertUserBidding, type InsertComment, type InsertClub, type InsertGamePlayer, type InsertPartnershipBidding, type InsertGameParticipant, type InsertPartner, type InsertLiveGame, type InsertLiveHand, type UpsertUser } from "@shared/schema";

export interface IStorage {
  // Users (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserType(id: string, userType: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getAllHands(): Promise<Hand[]>;

  // Games
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined>;
  getAllGames(): Promise<Game[]>;
  searchGames(query: string): Promise<Game[]>;
  findDuplicateByFirstHand(firstHand: {
    boardNumber: number;
    dealer: string;
    vulnerability: string;
    northHand: string;
    southHand: string;
    eastHand: string;
    westHand: string;
  }): Promise<Game | undefined>;

  // Game Players
  addGamePlayer(gamePlayer: InsertGamePlayer): Promise<GamePlayer>;
  getGamePlayers(gameId: number): Promise<User[]>;
  removeGamePlayer(gameId: number, userId: string): Promise<void>;
  getUserGames(userId: string): Promise<Game[]>;
  getCurrentUserGameData(gameId: number, userId: string): Promise<{
    isPlaying: boolean;
    partner?: User;
  }>;

  // Hands
  createHand(hand: InsertHand): Promise<Hand>;
  getHand(id: number): Promise<Hand | undefined>;
  updateHand(id: number, updates: Partial<Hand>): Promise<Hand | undefined>;
  getHandsByGame(gameId: number): Promise<Hand[]>;
  getHandsWithFilters(filters: {
    vulnerability?: string;
    dealer?: string;
    convention?: string;
  }): Promise<Hand[]>;

  // User Bidding
  createUserBidding(bidding: InsertUserBidding): Promise<UserBidding>;
  getUserBidding(handId: number, userId: string): Promise<UserBidding | undefined>;
  getUserBiddingStats(userId: string): Promise<{
    totalHands: number;
    averageAccuracy: number;
  }>;

  // Partnership Bidding
  createPartnershipBidding(bidding: InsertPartnershipBidding): Promise<PartnershipBidding>;
  getPartnershipBidding(handId: number, userId: string, partnerId?: string): Promise<PartnershipBidding | undefined>;
  getAllPartnershipBiddingForHand(handId: number): Promise<PartnershipBidding[]>;
  updatePartnershipBidding(id: number, biddingSequence: string[]): Promise<PartnershipBidding | undefined>;
  deletePartnershipBidding(handId: number, userId: string): Promise<void>;
  checkPartnershipBiddingConflicts(gameId: number, userId: string, partnerId: string): Promise<{
    hasConflicts: boolean;
    conflictingHands: number[];
  }>;

  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByHand(handId: number): Promise<Comment[]>;
  likeComment(commentId: number): Promise<void>;
  getUserCommentCount(userId: string): Promise<number>;

  // Statistics
  getUserStats(userId: string): Promise<{
    gamesUploaded: number;
    handsReviewed: number;
    averageBiddingAccuracy: number;
    commentsMade: number;
  }>;
  
  // Partner management
  searchUsers(query: string): Promise<User[]>;
  getUserPartners(userId: string): Promise<User[]>;
  addPartner(userId: string, partnerId: string): Promise<void>;
  removePartner(userId: string, partnerId: string): Promise<void>;
  
  // Admin operations
  deactivateUser(userId: string, reason?: string): Promise<boolean>;
  reactivateUser(userId: string): Promise<boolean>;
  updateUserType(id: string, userType: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getAdminStats(): Promise<{
    totalUsers: number;
    totalGames: number;
    totalHands: number;
    totalComments: number;
    newUsersThisWeek: number;
    newGamesThisWeek: number;
  }>;

  // Partners (legacy compatibility interface)
  getUserPartners(userId: string): Promise<User[]>;
  removePartner(userId: string, partnerId: string): Promise<void>;
  searchUsers(query: string, excludeUserId?: string): Promise<User[]>;

  // Game Participants (unified interface for database methods)
  createGameParticipant(participant: InsertGameParticipant): Promise<GameParticipant>;
  getGameParticipants(gameId: number): Promise<GameParticipant[]>;
  getUserGameParticipation(userId: string, gameId: number): Promise<GameParticipant | undefined>;
  getPartnerCommentsForHand(handId: number, userId: string, partnerId: string): Promise<Comment[]>;
  createPartner(partner: InsertPartner): Promise<Partner>;

  // Clubs
  createClub(club: InsertClub): Promise<Club>;
  getClub(id: number): Promise<Club | undefined>;
  updateClub(id: number, updates: Partial<Club>): Promise<Club | undefined>;
  getAllClubs(): Promise<Club[]>;
  getVerifiedClubs(): Promise<Club[]>;
  searchClubs(query: string): Promise<Club[]>;
  verifyClub(id: number, adminUserId: string): Promise<boolean>;
  deleteClub(id: number): Promise<boolean>;
  setUserHomeClub(userId: string, clubId: number | null): Promise<boolean>;
  
  // Live Games (only for users with feature flag)
  createLiveGame(game: InsertLiveGame): Promise<LiveGame>;
  getLiveGame(id: number): Promise<LiveGame | undefined>;
  updateLiveGame(id: number, updates: Partial<LiveGame>): Promise<LiveGame | undefined>;
  getUserLiveGames(userId: string): Promise<LiveGame[]>;
  
  // Live Hands
  createOrUpdateLiveHand(hand: InsertLiveHand): Promise<LiveHand>;
  getLiveHandsByGame(liveGameId: number): Promise<LiveHand[]>;
  getLiveHand(liveGameId: number, boardNumber: number): Promise<LiveHand | undefined>;
  
  // Live Game Access
  grantLiveGameAccess(liveGameId: number, userId: string, accessType: string): Promise<void>;
  checkLiveGameAccess(liveGameId: number, userId: string): Promise<boolean>;
  
  // User Favorite Clubs
  addFavoriteClub(userId: string, clubId: number): Promise<void>;
  removeFavoriteClub(userId: string, clubId: number): Promise<void>;
  getUserFavoriteClubs(userId: string): Promise<Club[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private games: Map<number, Game>;
  private hands: Map<number, Hand>;
  private userBidding: Map<string, UserBidding>; // key: handId-userId
  private comments: Map<number, Comment>;
  private partners: Map<string, string[]>; // userId -> list of partner IDs
  private partnershipBidding: Map<string, PartnershipBidding>; // key: handId-userId-partnerId
  private currentGameId: number;
  private currentHandId: number;
  private currentUserBiddingId: number;
  private currentCommentId: number;
  private currentPartnershipBiddingId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.hands = new Map();
    this.userBidding = new Map();
    this.comments = new Map();
    this.partners = new Map();
    this.partnershipBidding = new Map();
    this.currentGameId = 1;
    this.currentHandId = 1;
    this.currentUserBiddingId = 1;
    this.currentCommentId = 1;
    this.currentPartnershipBiddingId = 1;

    // Add sample data
    this.initializeSampleData();
  }

  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id!,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      displayName: userData.displayName || null,
      profileImageUrl: userData.profileImageUrl || null,
      password: userData.password || null,
      authType: userData.authType || "local",
      userType: userData.userType || "player",
      homeClubId: userData.homeClubId || null,
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
      emailVerified: userData.emailVerified || false,
      emailVerificationToken: userData.emailVerificationToken || null,
      emailVerificationExpires: userData.emailVerificationExpires || null,
      passwordResetToken: userData.passwordResetToken || null,
      passwordResetExpires: userData.passwordResetExpires || null,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      deactivatedAt: userData.deactivatedAt || null,
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...existingUser,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserType(id: string, userType: string): Promise<boolean> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return false;
    }
    
    const updatedUser: User = {
      ...existingUser,
      userType,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllHands(): Promise<Hand[]> {
    return Array.from(this.hands.values());
  }

  private async initializeSampleData() {
    // Create sample users
    await this.upsertUser({
      id: "admin",
      email: "admin@tabletalk.bridge",
      firstName: "Admin",
      lastName: "User",
      displayName: "Admin",
      authType: "local",
    });

    await this.upsertUser({
      id: "player1",
      email: "player1@tabletalk.bridge",
      firstName: "Bridge",
      lastName: "Expert",
      displayName: "BridgeExpert",
      authType: "local",
    });

    await this.upsertUser({
      id: "player2",
      email: "player2@tabletalk.bridge",
      firstName: "Card",
      lastName: "Shark",
      displayName: "CardShark",
      authType: "local",
    });

    // Create a sample game
    const sampleGame = await this.createGame({
      title: "World Championship 2023 - Round 3",
      tournament: "World Championship 2023",
      round: "Round 3",
      uploadedBy: "admin",
      pbnContent: "% Sample PBN Content",
    });

    // Create a sample hand
    const sampleHand = await this.createHand({
      gameId: sampleGame.id,
      boardNumber: 15,
      dealer: "S",
      vulnerability: "NS",
      northHand: "♠AKQ108 ♥J94 ♦K63 ♣75",
      southHand: "♠J5 ♥3 ♦A5 ♣KJ9632",
      eastHand: "♠643 ♥A752 ♦J10872 ♣Q4",
      westHand: "♠972 ♥KQ1086 ♦Q94 ♣A108",


      result: "Made",
    });

    // Add sample comments
    await this.createComment({
      handId: sampleHand.id,
      userId: "player1",
      userName: "BridgeExpert",
      userLevel: "Expert",
      content: "Great hand for discussing weak two-suits. South's 2♣ response was questionable - with only 6 HCP and club length, a simple pass might be better. The jump to 4♠ by North shows confidence in the spade fit.",
    });

    await this.createComment({
      handId: sampleHand.id,
      userId: "player2",
      userName: "CardShark",
      userLevel: "Advanced",
      content: "I disagree - South's 2♣ shows support and the club suit could be valuable for discards. The key question is whether North should have made a game try instead of jumping directly to 4♠.",
    });
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const uploadDate = new Date();
    const game: Game = {
      ...insertGame,
      id,
      uploadedAt: uploadDate,
      tournament: insertGame.tournament || null,
      round: insertGame.round || null,
      // Default date to upload date if not provided
      date: insertGame.date || uploadDate.toISOString().split('T')[0],
      location: insertGame.location || null,
      clubId: insertGame.clubId || null,
      event: insertGame.event || null,
    };
    this.games.set(id, game);
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const existingGame = this.games.get(id);
    if (!existingGame) return undefined;
    
    const updatedGame: Game = { ...existingGame, ...updates };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async getAllGames(): Promise<Game[]> {
    return Array.from(this.games.values()).sort((a, b) => 
      b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }

  async searchGames(query: string): Promise<Game[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.games.values()).filter(game =>
      game.title.toLowerCase().includes(lowercaseQuery) ||
      game.tournament?.toLowerCase().includes(lowercaseQuery) ||
      game.round?.toLowerCase().includes(lowercaseQuery)
    );
  }

  async findDuplicateByFirstHand(firstHand: {
    boardNumber: number;
    dealer: string;
    vulnerability: string;
    northHand: string;
    southHand: string;
    eastHand: string;
    westHand: string;
  }): Promise<Game | undefined> {
    // Find all hands with the same first hand characteristics
    for (const hand of Array.from(this.hands.values())) {
      if (hand.boardNumber === firstHand.boardNumber &&
          hand.dealer === firstHand.dealer &&
          hand.vulnerability === firstHand.vulnerability &&
          hand.northHand === firstHand.northHand &&
          hand.southHand === firstHand.southHand &&
          hand.eastHand === firstHand.eastHand &&
          hand.westHand === firstHand.westHand) {
        // Return the game associated with this hand
        return this.games.get(hand.gameId);
      }
    }
    return undefined;
  }

  async createHand(insertHand: InsertHand): Promise<Hand> {
    const id = this.currentHandId++;
    const hand: Hand = { 
      ...insertHand, 
      id,
      finalContract: insertHand.finalContract || null,
      declarer: insertHand.declarer || null,
      result: insertHand.result || null,
    };
    this.hands.set(id, hand);
    return hand;
  }

  async getHand(id: number): Promise<Hand | undefined> {
    return this.hands.get(id);
  }

  async updateHand(id: number, updates: Partial<Hand>): Promise<Hand | undefined> {
    const existingHand = this.hands.get(id);
    if (!existingHand) {
      return undefined;
    }
    
    const updatedHand = { ...existingHand, ...updates };
    this.hands.set(id, updatedHand);
    return updatedHand;
  }

  async getHandsByGame(gameId: number): Promise<Hand[]> {
    return Array.from(this.hands.values()).filter(hand => hand.gameId === gameId);
  }

  async getHandsWithFilters(filters: {
    vulnerability?: string;
    dealer?: string;
    convention?: string;
  }): Promise<Hand[]> {
    return Array.from(this.hands.values()).filter(hand => {
      if (filters.vulnerability && hand.vulnerability !== filters.vulnerability) {
        return false;
      }
      if (filters.dealer && hand.dealer !== filters.dealer) {
        return false;
      }
      return true;
    });
  }

  async createUserBidding(insertUserBidding: InsertUserBidding): Promise<UserBidding> {
    const id = this.currentUserBiddingId++;
    const bidding: UserBidding = {
      ...insertUserBidding,
      id,
      bidding: insertUserBidding.bidding as string[],
      completedAt: new Date(),
      accuracy: insertUserBidding.accuracy || null,
    };
    const key = `${insertUserBidding.handId}-${insertUserBidding.userId}`;
    this.userBidding.set(key, bidding);
    return bidding;
  }

  async getUserBidding(handId: number, userId: string): Promise<UserBidding | undefined> {
    const key = `${handId}-${userId}`;
    return this.userBidding.get(key);
  }

  async getUserBiddingStats(userId: string): Promise<{
    totalHands: number;
    averageAccuracy: number;
  }> {
    const userBiddings = Array.from(this.userBidding.values()).filter(b => b.userId === userId);
    const totalHands = userBiddings.length;
    const averageAccuracy = totalHands > 0 
      ? userBiddings.reduce((sum, b) => sum + (b.accuracy || 0), 0) / totalHands
      : 0;
    
    return { totalHands, averageAccuracy };
  }

  // Partnership Bidding methods
  async createPartnershipBidding(bidding: InsertPartnershipBidding): Promise<PartnershipBidding> {
    const id = this.currentPartnershipBiddingId++;
    const partnershipBidding: PartnershipBidding = {
      id,
      handId: bidding.handId,
      userId: bidding.userId,
      partnerId: bidding.partnerId,
      biddingSequence: bidding.biddingSequence,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const key = `${bidding.handId}-${bidding.userId}-${bidding.partnerId}`;
    this.partnershipBidding.set(key, partnershipBidding);
    return partnershipBidding;
  }

  async getPartnershipBidding(handId: number, userId: string, partnerId?: string): Promise<PartnershipBidding | undefined> {
    if (!partnerId) {
      // Find any partnership bidding for this user on this hand
      for (const [key, bidding] of this.partnershipBidding.entries()) {
        if (bidding.handId === handId && bidding.userId === userId) {
          return bidding;
        }
      }
      return undefined;
    }
    
    const key = `${handId}-${userId}-${partnerId}`;
    return this.partnershipBidding.get(key);
  }

  async getAllPartnershipBiddingForHand(handId: number): Promise<PartnershipBidding[]> {
    return Array.from(this.partnershipBidding.values()).filter(
      bidding => bidding.handId === handId
    );
  }

  async updatePartnershipBidding(id: number, biddingSequence: string[]): Promise<PartnershipBidding | undefined> {
    for (const [key, bidding] of this.partnershipBidding.entries()) {
      if (bidding.id === id) {
        const updated: PartnershipBidding = {
          ...bidding,
          biddingSequence,
          updatedAt: new Date(),
        };
        this.partnershipBidding.set(key, updated);
        return updated;
      }
    }
    return undefined;
  }

  async deletePartnershipBidding(handId: number, userId: string): Promise<void> {
    for (const [key, bidding] of this.partnershipBidding.entries()) {
      if (bidding.handId === handId && bidding.userId === userId) {
        this.partnershipBidding.delete(key);
        return;
      }
    }
  }

  async checkPartnershipBiddingConflicts(gameId: number, userId: string, partnerId: string): Promise<{
    hasConflicts: boolean;
    conflictingHands: number[];
  }> {
    const gameHands = Array.from(this.hands.values()).filter(hand => hand.gameId === gameId);
    const conflictingHands: number[] = [];
    
    for (const hand of gameHands) {
      const existingBidding = await this.getPartnershipBidding(hand.id, userId);
      if (existingBidding && existingBidding.partnerId !== partnerId) {
        conflictingHands.push(hand.id);
      }
    }
    
    return {
      hasConflicts: conflictingHands.length > 0,
      conflictingHands,
    };
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const comment: Comment = {
      ...insertComment,
      id,
      likes: 0,
      createdAt: new Date(),
      userLevel: insertComment.userLevel || "Beginner",
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getCommentsByHand(handId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.handId === handId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async likeComment(commentId: number): Promise<void> {
    const comment = this.comments.get(commentId);
    if (comment) {
      comment.likes++;
      this.comments.set(commentId, comment);
    }
  }

  async getUserCommentCount(userId: string): Promise<number> {
    return Array.from(this.comments.values()).filter(c => c.userId === userId).length;
  }

  async getUserStats(userId: string): Promise<{
    gamesUploaded: number;
    handsReviewed: number;
    averageBiddingAccuracy: number;
    commentsMade: number;
  }> {
    const gamesUploaded = Array.from(this.games.values()).filter(g => g.uploadedBy === userId).length;
    const handsReviewed = Array.from(this.userBidding.values()).filter(b => b.userId === userId).length;
    const biddingStats = await this.getUserBiddingStats(userId);
    const commentsMade = await this.getUserCommentCount(userId);

    return {
      gamesUploaded,
      handsReviewed,
      averageBiddingAccuracy: biddingStats.averageAccuracy,
      commentsMade,
    };
  }

  async searchUsers(query: string): Promise<User[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(user =>
      user.firstName?.toLowerCase().includes(lowercaseQuery) ||
      user.lastName?.toLowerCase().includes(lowercaseQuery) ||
      user.displayName?.toLowerCase().includes(lowercaseQuery) ||
      user.email?.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getUserPartners(userId: string): Promise<User[]> {
    const userPartners = this.partners.get(userId) || [];
    return userPartners.map(partnerId => this.users.get(partnerId)).filter(Boolean) as User[];
  }

  async addPartner(userId: string, partnerId: string): Promise<void> {
    const userPartners = this.partners.get(userId) || [];
    if (!userPartners.includes(partnerId)) {
      userPartners.push(partnerId);
      this.partners.set(userId, userPartners);
    }
  }

  async removePartner(userId: string, partnerId: string): Promise<void> {
    const userPartners = this.partners.get(userId) || [];
    const updatedPartners = userPartners.filter(id => id !== partnerId);
    this.partners.set(userId, updatedPartners);
  }

  async updateUserType(id: string, userType: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    user.userType = userType;
    this.users.set(id, user);
    return true;
  }

  // Game participation (placeholder implementations for in-memory storage)
  async createGameParticipant(participant: InsertGameParticipant): Promise<GameParticipant> {
    throw new Error("Game participation functionality requires database implementation");
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    throw new Error("Partner creation functionality requires database implementation");
  }

  async getGameParticipants(gameId: number): Promise<GameParticipant[]> {
    return [];
  }

  async getUserGameParticipation(userId: string, gameId: number): Promise<GameParticipant | undefined> {
    return undefined;
  }

  async getPartnerCommentsForHand(handId: number, userId: string, partnerId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => 
        comment.handId === handId && 
        (comment.userId === userId || comment.userId === partnerId)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Club management (placeholder implementations for in-memory storage)
  async createClub(club: InsertClub): Promise<Club> {
    throw new Error("Club functionality requires database implementation");
  }

  async getAllClubs(): Promise<Club[]> {
    return [];
  }

  async getVerifiedClubs(): Promise<Club[]> {
    return [];
  }

  async searchClubs(query: string): Promise<Club[]> {
    return [];
  }

  async getClub(id: number): Promise<Club | undefined> {
    return undefined;
  }

  async updateClub(id: number, updates: Partial<Club>): Promise<Club | undefined> {
    return undefined;
  }

  async verifyClub(id: number, adminUserId: string): Promise<boolean> {
    return false;
  }

  async deleteClub(id: number): Promise<boolean> {
    return false;
  }

  async setUserHomeClub(userId: string, clubId: number | null): Promise<boolean> {
    return false;
  }

  // Admin operations
  async deactivateUser(userId: string, reason?: string): Promise<boolean> {
    return false;
  }

  async reactivateUser(userId: string): Promise<boolean> {
    return false;
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalGames: number;
    totalHands: number;
    totalComments: number;
    newUsersThisWeek: number;
    newGamesThisWeek: number;
  }> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      totalUsers: this.users.size,
      totalGames: this.games.size,
      totalHands: this.hands.size,
      totalComments: this.comments.size,
      newUsersThisWeek: 0, // Would need created timestamps
      newGamesThisWeek: 0, // Would need created timestamps
    };
  }

  // Game Players (stub implementations for MemStorage)
  async addGamePlayer(gamePlayer: InsertGamePlayer): Promise<GamePlayer> {
    // For memory storage, just return a mock game player
    // In production, this would use DatabaseStorage which has proper implementation
    return {
      id: Date.now(),
      gameId: gamePlayer.gameId,
      userId: gamePlayer.userId,
      position: gamePlayer.position || null,
      addedBy: gamePlayer.addedBy,
      addedAt: new Date(),
    };
  }

  async getGamePlayers(gameId: number): Promise<User[]> {
    // For memory storage, return empty array
    // In production, this would use DatabaseStorage which has proper implementation
    return [];
  }

  async removeGamePlayer(gameId: number, userId: string): Promise<void> {
    // For memory storage, no-op
    // In production, this would use DatabaseStorage which has proper implementation
  }

  async getCurrentUserGameData(gameId: number, userId: string): Promise<{
    isPlaying: boolean;
    partner?: User;
  }> {
    // For memory storage, return not playing
    // In production, this would use DatabaseStorage which has proper implementation
    return { isPlaying: false };
  }

  async getUserGames(userId: string): Promise<Game[]> {
    // For memory storage, return games uploaded by user
    // In production, this would use DatabaseStorage which has proper implementation
    return Array.from(this.games.values()).filter(game => game.uploadedBy === userId);
  }

  // Live Games methods (placeholder implementations for in-memory storage)
  async createLiveGame(game: InsertLiveGame): Promise<LiveGame> {
    throw new Error("Live game functionality requires database implementation");
  }

  async getLiveGame(id: number): Promise<LiveGame | undefined> {
    return undefined;
  }

  async updateLiveGame(id: number, updates: Partial<LiveGame>): Promise<LiveGame | undefined> {
    return undefined;
  }

  async getUserLiveGames(userId: string): Promise<LiveGame[]> {
    return [];
  }

  async createOrUpdateLiveHand(hand: InsertLiveHand): Promise<LiveHand> {
    throw new Error("Live hand functionality requires database implementation");
  }

  async getLiveHandsByGame(liveGameId: number): Promise<LiveHand[]> {
    return [];
  }

  async getLiveHand(liveGameId: number, boardNumber: number): Promise<LiveHand | undefined> {
    return undefined;
  }

  async grantLiveGameAccess(liveGameId: number, userId: string, accessType: string): Promise<void> {
    // No-op for in-memory storage
  }

  async checkLiveGameAccess(liveGameId: number, userId: string): Promise<boolean> {
    return false;
  }

  async addFavoriteClub(userId: string, clubId: number): Promise<void> {
    // No-op for in-memory storage
  }

  async removeFavoriteClub(userId: string, clubId: number): Promise<void> {
    // No-op for in-memory storage
  }

  async getUserFavoriteClubs(userId: string): Promise<Club[]> {
    return [];
  }
}

import { db } from "./db";
import { eq, desc, like, and, sql, or } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserType(id: string, userType: string): Promise<boolean> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ 
          userType, 
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
      return !!updatedUser;
    } catch (error) {
      console.error("Error updating user type:", error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async searchUsers(query: string): Promise<User[]> {
    const lowercaseQuery = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(users)
      .where(
        sql`LOWER(${users.firstName}) LIKE ${lowercaseQuery} 
        OR LOWER(${users.lastName}) LIKE ${lowercaseQuery} 
        OR LOWER(${users.displayName}) LIKE ${lowercaseQuery} 
        OR LOWER(${users.email}) LIKE ${lowercaseQuery}`
      )
      .orderBy(users.firstName);
  }

  async getUserPartners(userId: string): Promise<User[]> {
    // Get partners where current user is the one who added the partnership
    const partnersAddedByUser = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        userType: users.userType,
        authType: users.authType,
        profileImageUrl: users.profileImageUrl,
        emailVerified: users.emailVerified,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        password: users.password,
        emailVerificationToken: users.emailVerificationToken,
        emailVerificationExpires: users.emailVerificationExpires,
        passwordResetToken: users.passwordResetToken,
        passwordResetExpires: users.passwordResetExpires,
        deactivatedAt: users.deactivatedAt,
        homeClubId: users.homeClubId,
      })
      .from(partners)
      .innerJoin(users, eq(partners.partnerId, users.id))
      .where(eq(partners.userId, userId));
    
    // Get partners where current user was added as someone else's partner
    const partnersWhoAddedUser = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        userType: users.userType,
        authType: users.authType,
        profileImageUrl: users.profileImageUrl,
        emailVerified: users.emailVerified,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        password: users.password,
        emailVerificationToken: users.emailVerificationToken,
        emailVerificationExpires: users.emailVerificationExpires,
        passwordResetToken: users.passwordResetToken,
        passwordResetExpires: users.passwordResetExpires,
        deactivatedAt: users.deactivatedAt,
        homeClubId: users.homeClubId,
      })
      .from(partners)
      .innerJoin(users, eq(partners.userId, users.id))
      .where(eq(partners.partnerId, userId));
    
    // Combine both sets and remove duplicates
    const allPartners = [...partnersAddedByUser, ...partnersWhoAddedUser];
    const uniquePartners = allPartners.filter((partner, index, self) => 
      index === self.findIndex(p => p.id === partner.id)
    );
    
    return uniquePartners;
  }

  async addPartner(userId: string, partnerId: string): Promise<void> {
    await db
      .insert(partners)
      .values({ userId, partnerId })
      .onConflictDoNothing();
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const [created] = await db
      .insert(partners)
      .values(partner)
      .returning();
    return created;
  }

  async removePartner(userId: string, partnerId: string): Promise<void> {
    await db
      .delete(partners)
      .where(
        and(
          eq(partners.userId, userId),
          eq(partners.partnerId, partnerId)
        )
      );
  }

  async getAllHands(): Promise<Hand[]> {
    return await db.select().from(hands).orderBy(hands.id);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    // Default date to upload date if not provided
    const gameData = {
      ...insertGame,
      date: insertGame.date || new Date().toISOString().split('T')[0],
      uploadedAt: new Date(),
    };
    
    const [game] = await db
      .insert(games)
      .values(gameData)
      .returning();
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db
      .select({
        id: games.id,
        title: games.title,
        tournament: games.tournament,
        round: games.round,
        date: games.date,
        location: games.location,
        clubId: games.clubId,
        event: games.event,
        pbnEvent: games.pbnEvent,
        pbnSite: games.pbnSite,
        pbnDate: games.pbnDate,
        filename: games.filename,
        uploadedBy: games.uploadedBy,
        uploadedAt: games.uploadedAt,
        pbnContent: games.pbnContent,
        uploaderName: sql<string>`COALESCE(${users.displayName}, ${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
      })
      .from(games)
      .leftJoin(users, eq(games.uploadedBy, users.id))
      .where(eq(games.id, id));

    return game;
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const [updatedGame] = await db
      .update(games)
      .set(updates)
      .where(eq(games.id, id))
      .returning();
    return updatedGame || undefined;
  }

  async getAllGames(): Promise<Game[]> {
    const gamesWithUsers = await db
      .select({
        id: games.id,
        title: games.title,
        tournament: games.tournament,
        round: games.round,
        date: games.date,
        location: games.location,
        clubId: games.clubId,
        event: games.event,
        pbnEvent: games.pbnEvent,
        pbnSite: games.pbnSite,
        pbnDate: games.pbnDate,
        filename: games.filename,
        uploadedBy: games.uploadedBy,
        uploadedAt: games.uploadedAt,
        pbnContent: games.pbnContent,
        uploaderName: sql<string>`COALESCE(${users.displayName}, ${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
      })
      .from(games)
      .leftJoin(users, eq(games.uploadedBy, users.id))
      .orderBy(desc(games.uploadedAt));

    return gamesWithUsers;
  }

  async searchGames(query: string): Promise<Game[]> {
    const gamesWithUsers = await db
      .select({
        id: games.id,
        title: games.title,
        tournament: games.tournament,
        round: games.round,
        date: games.date,
        location: games.location,
        event: games.event,
        pbnEvent: games.pbnEvent,
        pbnSite: games.pbnSite,
        pbnDate: games.pbnDate,
        filename: games.filename,
        uploadedBy: games.uploadedBy,
        uploadedAt: games.uploadedAt,
        pbnContent: games.pbnContent,
        uploaderName: sql<string>`COALESCE(${users.displayName}, ${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
      })
      .from(games)
      .leftJoin(users, eq(games.uploadedBy, users.id))
      .where(like(games.title, `%${query}%`))
      .orderBy(desc(games.uploadedAt));

    return gamesWithUsers.map(game => ({
      ...game,
      uploaderName: game.uploaderName || game.uploadedBy,
    }));
  }

  async findDuplicateByFirstHand(firstHand: {
    boardNumber: number;
    dealer: string;
    vulnerability: string;
    northHand: string;
    southHand: string;
    eastHand: string;
    westHand: string;
  }): Promise<Game | undefined> {
    // Find hands with matching first hand characteristics
    const [matchingHand] = await db
      .select({ gameId: hands.gameId })
      .from(hands)
      .where(
        and(
          eq(hands.boardNumber, firstHand.boardNumber),
          eq(hands.dealer, firstHand.dealer),
          eq(hands.vulnerability, firstHand.vulnerability),
          eq(hands.northHand, firstHand.northHand),
          eq(hands.southHand, firstHand.southHand),
          eq(hands.eastHand, firstHand.eastHand),
          eq(hands.westHand, firstHand.westHand)
        )
      )
      .limit(1);

    if (!matchingHand) return undefined;

    // Return the associated game
    return this.getGame(matchingHand.gameId);
  }

  // Game Players
  async addGamePlayer(gamePlayer: InsertGamePlayer): Promise<GamePlayer> {
    const [newGamePlayer] = await db
      .insert(gamePlayers)
      .values(gamePlayer)
      .onConflictDoNothing()
      .returning();
    return newGamePlayer;
  }

  async getCurrentUserGameData(gameId: number, userId: string): Promise<{
    isPlaying: boolean;
    partner?: User;
  }> {
    const [gamePlayer] = await db
      .select()
      .from(gamePlayers)
      .leftJoin(users, eq(gamePlayers.partnerId, users.id))
      .where(
        and(
          eq(gamePlayers.gameId, gameId),
          eq(gamePlayers.userId, userId)
        )
      )
      .limit(1);

    if (!gamePlayer) {
      return { isPlaying: false };
    }

    return {
      isPlaying: true,
      partner: gamePlayer.users || undefined,
    };
  }

  async getGamePlayers(gameId: number): Promise<User[]> {
    const playerRows = await db
      .select()
      .from(gamePlayers)
      .innerJoin(users, eq(gamePlayers.userId, users.id))
      .where(eq(gamePlayers.gameId, gameId));
    
    return playerRows.map(row => row.users);
  }

  async removeGamePlayer(gameId: number, userId: string): Promise<void> {
    await db
      .delete(gamePlayers)
      .where(
        and(
          eq(gamePlayers.gameId, gameId),
          eq(gamePlayers.userId, userId)
        )
      );
  }

  async getUserGames(userId: string): Promise<Game[]> {
    const gamesWithUsers = await db
      .select({
        id: games.id,
        title: games.title,
        tournament: games.tournament,
        round: games.round,
        date: games.date,
        location: games.location,
        event: games.event,
        pbnEvent: games.pbnEvent,
        pbnSite: games.pbnSite,
        pbnDate: games.pbnDate,
        filename: games.filename,
        uploadedBy: games.uploadedBy,
        uploadedAt: games.uploadedAt,
        pbnContent: games.pbnContent,
        uploaderName: sql<string>`COALESCE(${users.displayName}, ${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
      })
      .from(gamePlayers)
      .innerJoin(games, eq(gamePlayers.gameId, games.id))
      .leftJoin(users, eq(games.uploadedBy, users.id))
      .where(eq(gamePlayers.userId, userId))
      .orderBy(desc(games.uploadedAt));

    return gamesWithUsers.map(game => ({
      ...game,
      uploaderName: game.uploaderName || game.uploadedBy,
    }));
  }

  async createHand(insertHand: InsertHand): Promise<Hand> {
    const [hand] = await db
      .insert(hands)
      .values(insertHand)
      .returning();
    return hand;
  }



  async getHand(id: number): Promise<Hand | undefined> {
    const [hand] = await db.select().from(hands).where(eq(hands.id, id));
    if (!hand) return undefined;
    
    // Check if there's any partnership bidding for this hand
    const biddings = await db
      .select()
      .from(partnershipBidding)
      .where(eq(partnershipBidding.handId, id));
    
    return {
      ...hand,
      hasBidding: biddings.length > 0
    };
  }

  async updateHand(id: number, updates: Partial<Hand>): Promise<Hand | undefined> {
    const [updatedHand] = await db
      .update(hands)
      .set(updates)
      .where(eq(hands.id, id))
      .returning();
    return updatedHand;
  }

  async getHandsByGame(gameId: number): Promise<Hand[]> {
    const handsData = await db
      .select()
      .from(hands)
      .where(eq(hands.gameId, gameId))
      .orderBy(hands.boardNumber);
    
    // Calculate hasBidding for each hand
    const handsWithBidding = await Promise.all(
      handsData.map(async (hand) => {
        const biddings = await db
          .select()
          .from(partnershipBidding)
          .where(eq(partnershipBidding.handId, hand.id));
        
        return {
          ...hand,
          hasBidding: biddings.length > 0
        };
      })
    );
    
    return handsWithBidding;
  }

  async getHandsWithFilters(filters: {
    vulnerability?: string;
    dealer?: string;
    convention?: string;
  }): Promise<Hand[]> {
    const conditions = [];
    
    if (filters.vulnerability) {
      conditions.push(eq(hands.vulnerability, filters.vulnerability));
    }
    if (filters.dealer) {
      conditions.push(eq(hands.dealer, filters.dealer));
    }
    
    if (conditions.length === 0) {
      return await db.select().from(hands).orderBy(hands.boardNumber);
    }
    
    return await db.select().from(hands)
      .where(and(...conditions))
      .orderBy(hands.boardNumber);
  }

  async createUserBidding(insertUserBidding: InsertUserBidding): Promise<UserBidding> {
    const [bidding] = await db
      .insert(userBidding)
      .values(insertUserBidding)
      .returning();
    return bidding;
  }

  async getUserBidding(handId: number, userId: string): Promise<UserBidding | undefined> {
    const [bidding] = await db.select().from(userBidding)
      .where(and(eq(userBidding.handId, handId), eq(userBidding.userId, userId)));
    return bidding || undefined;
  }

  async getUserBiddingStats(userId: string): Promise<{
    totalHands: number;
    averageAccuracy: number;
  }> {
    const userBiddings = await db.select().from(userBidding)
      .where(eq(userBidding.userId, userId));
    
    const totalHands = userBiddings.length;
    const averageAccuracy = totalHands > 0 
      ? userBiddings.reduce((sum, b) => sum + (b.accuracy || 0), 0) / totalHands 
      : 0;
    
    return { totalHands, averageAccuracy };
  }

  // Partnership Bidding methods
  async createPartnershipBidding(bidding: InsertPartnershipBidding): Promise<PartnershipBidding> {
    const [created] = await db
      .insert(partnershipBidding)
      .values(bidding)
      .returning();
    return created;
  }

  async getPartnershipBidding(handId: number, userId: string, partnerId?: string): Promise<PartnershipBidding | undefined> {
    if (!partnerId) {
      // Find any partnership bidding for this user on this hand
      const [bidding] = await db
        .select()
        .from(partnershipBidding)
        .where(and(
          eq(partnershipBidding.handId, handId),
          eq(partnershipBidding.userId, userId)
        ));
      return bidding || undefined;
    }
    
    const [bidding] = await db
      .select()
      .from(partnershipBidding)
      .where(and(
        eq(partnershipBidding.handId, handId),
        eq(partnershipBidding.userId, userId),
        eq(partnershipBidding.partnerId, partnerId)
      ));
    return bidding || undefined;
  }

  async getAllPartnershipBiddingForHand(handId: number): Promise<PartnershipBidding[]> {
    return await db
      .select()
      .from(partnershipBidding)
      .where(eq(partnershipBidding.handId, handId));
  }

  async updatePartnershipBidding(id: number, biddingSequence: string[]): Promise<PartnershipBidding | undefined> {
    const [updated] = await db
      .update(partnershipBidding)
      .set({ 
        biddingSequence,
        updatedAt: new Date(),
      })
      .where(eq(partnershipBidding.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePartnershipBidding(handId: number, userId: string): Promise<void> {
    await db
      .delete(partnershipBidding)
      .where(and(
        eq(partnershipBidding.handId, handId),
        eq(partnershipBidding.userId, userId)
      ));
  }

  async checkPartnershipBiddingConflicts(gameId: number, userId: string, partnerId: string): Promise<{
    hasConflicts: boolean;
    conflictingHands: number[];
  }> {
    const gameHands = await db
      .select({ id: hands.id })
      .from(hands)
      .where(eq(hands.gameId, gameId));
    
    const conflictingHands: number[] = [];
    
    for (const hand of gameHands) {
      const existingBidding = await this.getPartnershipBidding(hand.id, userId);
      if (existingBidding && existingBidding.partnerId !== partnerId) {
        conflictingHands.push(hand.id);
      }
    }
    
    return {
      hasConflicts: conflictingHands.length > 0,
      conflictingHands,
    };
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async getCommentsByHand(handId: number): Promise<Comment[]> {
    return await db.select().from(comments)
      .where(eq(comments.handId, handId))
      .orderBy(desc(comments.createdAt));
  }

  async likeComment(commentId: number): Promise<void> {
    await db.update(comments)
      .set({ likes: sql`${comments.likes} + 1` })
      .where(eq(comments.id, commentId));
  }

  async getUserCommentCount(userId: string): Promise<number> {
    const userComments = await db.select().from(comments)
      .where(eq(comments.userId, userId));
    return userComments.length;
  }

  async getUserStats(userId: string): Promise<{
    gamesUploaded: number;
    handsReviewed: number;
    averageBiddingAccuracy: number;
    commentsMade: number;
  }> {
    const userGames = await db.select().from(games)
      .where(eq(games.uploadedBy, userId));
    
    const userBiddings = await db.select().from(userBidding)
      .where(eq(userBidding.userId, userId));
    
    const userComments = await db.select().from(comments)
      .where(eq(comments.userId, userId));
    
    const averageBiddingAccuracy = userBiddings.length > 0
      ? userBiddings.reduce((sum, b) => sum + (b.accuracy || 0), 0) / userBiddings.length
      : 0;
    
    return {
      gamesUploaded: userGames.length,
      handsReviewed: userBiddings.length,
      averageBiddingAccuracy,
      commentsMade: userComments.length,
    };
  }

  // Admin user management methods
  async deactivateUser(userId: string, reason?: string): Promise<boolean> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ 
          isActive: false, 
          deactivatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      return !!updatedUser;
    } catch (error) {
      console.error("Error deactivating user:", error);
      return false;
    }
  }

  async reactivateUser(userId: string): Promise<boolean> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ 
          isActive: true, 
          deactivatedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      return !!updatedUser;
    } catch (error) {
      console.error("Error reactivating user:", error);
      return false;
    }
  }

  // Game Players methods
  async addGamePlayer(gamePlayer: InsertGamePlayer): Promise<GamePlayer> {
    const [player] = await db.insert(gamePlayers).values(gamePlayer).returning();
    return player;
  }

  async getGamePlayers(gameId: number): Promise<User[]> {
    const players = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        userType: users.userType,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        deactivatedAt: users.deactivatedAt,
        emailVerified: users.emailVerified,
        emailVerificationToken: users.emailVerificationToken,
        passwordResetToken: users.passwordResetToken,
        passwordResetExpires: users.passwordResetExpires,
        homeClubId: users.homeClubId,
      })
      .from(gamePlayers)
      .innerJoin(users, eq(gamePlayers.userId, users.id))
      .where(eq(gamePlayers.gameId, gameId));
    
    return players;
  }

  async removeGamePlayer(gameId: number, userId: string): Promise<void> {
    await db
      .delete(gamePlayers)
      .where(and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.userId, userId)));
  }

  async getUserGames(userId: string): Promise<Game[]> {
    // Get games where user is either uploader or participant
    const uploadedGames = await db
      .select()
      .from(games)
      .where(eq(games.uploadedBy, userId));

    const participantGames = await db
      .select({
        id: games.id,
        title: games.title,
        tournament: games.tournament,
        round: games.round,
        pbnEvent: games.pbnEvent,
        pbnSite: games.pbnSite,
        pbnDate: games.pbnDate,
        date: games.date,
        location: games.location,
        event: games.event,
        filename: games.filename,
        uploadedBy: games.uploadedBy,
        pbnContent: games.pbnContent,
        uploadedAt: games.uploadedAt,
      })
      .from(games)
      .innerJoin(gamePlayers, eq(games.id, gamePlayers.gameId))
      .where(eq(gamePlayers.userId, userId));

    // Combine and deduplicate
    const allGames = [...uploadedGames, ...participantGames];
    const uniqueGames = allGames.filter((game, index, self) => 
      index === self.findIndex(g => g.id === game.id)
    );

    return uniqueGames;
  }

  // Live Games methods (only for users with feature flag)
  async createLiveGame(game: InsertLiveGame): Promise<LiveGame> {
    const [liveGame] = await db.insert(liveGames).values(game).returning();
    return liveGame;
  }

  async getLiveGame(id: number): Promise<LiveGame | undefined> {
    const [liveGame] = await db.select().from(liveGames).where(eq(liveGames.id, id));
    return liveGame;
  }

  async updateLiveGame(id: number, updates: Partial<LiveGame>): Promise<LiveGame | undefined> {
    const [liveGame] = await db.update(liveGames)
      .set(updates)
      .where(eq(liveGames.id, id))
      .returning();
    return liveGame;
  }

  async getUserLiveGames(userId: string): Promise<LiveGame[]> {
    // Get games created by user or where user has access - exclude completed games
    const createdGames = await db.select().from(liveGames)
      .where(and(
        eq(liveGames.createdBy, userId),
        ne(liveGames.status, 'completed')
      ));
    
    const accessibleGames = await db
      .select({
        id: liveGames.id,
        title: liveGames.title,
        clubId: liveGames.clubId,
        gameDate: liveGames.gameDate,
        createdBy: liveGames.createdBy,
        partnerId: liveGames.partnerId,
        status: liveGames.status,
        createdAt: liveGames.createdAt,
        updatedAt: liveGames.updatedAt,
      })
      .from(liveGames)
      .innerJoin(liveGameAccess, eq(liveGames.id, liveGameAccess.liveGameId))
      .where(and(
        eq(liveGameAccess.userId, userId),
        ne(liveGames.status, 'completed')
      ));
    
    // Combine and deduplicate
    const allGames = [...createdGames, ...accessibleGames];
    const uniqueGames = allGames.filter((game, index, self) => 
      index === self.findIndex(g => g.id === game.id)
    );
    
    return uniqueGames;
  }

  // Live Hands methods
  async createOrUpdateLiveHand(hand: InsertLiveHand): Promise<LiveHand> {
    // Check if hand already exists
    const existing = await db.select().from(liveHands)
      .where(
        and(
          eq(liveHands.liveGameId, hand.liveGameId),
          eq(liveHands.boardNumber, hand.boardNumber)
        )
      );
    
    if (existing.length > 0) {
      // Update existing hand
      const [updated] = await db.update(liveHands)
        .set(hand)
        .where(
          and(
            eq(liveHands.liveGameId, hand.liveGameId),
            eq(liveHands.boardNumber, hand.boardNumber)
          )
        )
        .returning();
      return updated;
    } else {
      // Create new hand
      const [created] = await db.insert(liveHands).values(hand).returning();
      return created;
    }
  }

  async getLiveHandsByGame(liveGameId: number): Promise<LiveHand[]> {
    return await db.select().from(liveHands)
      .where(eq(liveHands.liveGameId, liveGameId))
      .orderBy(liveHands.boardNumber);
  }

  async getLiveHand(liveGameId: number, boardNumber: number): Promise<LiveHand | undefined> {
    const [hand] = await db.select().from(liveHands)
      .where(
        and(
          eq(liveHands.liveGameId, liveGameId),
          eq(liveHands.boardNumber, boardNumber)
        )
      );
    return hand;
  }

  // Live Game Access methods
  async grantLiveGameAccess(liveGameId: number, userId: string, accessType: string): Promise<void> {
    await db.insert(liveGameAccess).values({
      liveGameId,
      userId,
      accessType,
    }).onConflictDoNothing();
  }

  async checkLiveGameAccess(liveGameId: number, userId: string): Promise<boolean> {
    const [access] = await db.select().from(liveGameAccess)
      .where(
        and(
          eq(liveGameAccess.liveGameId, liveGameId),
          eq(liveGameAccess.userId, userId)
        )
      );
    return !!access;
  }

  async getLiveGameHands(liveGameId: number): Promise<LiveHand[]> {
    return await db.select().from(liveHands)
      .where(eq(liveHands.liveGameId, liveGameId))
      .orderBy(liveHands.boardNumber);
  }

  // Convert completed live game to regular game
  async convertLiveGameToRegularGame(liveGameId: number): Promise<Game | undefined> {
    const liveGame = await this.getLiveGame(liveGameId);
    if (!liveGame || liveGame.status !== 'completed') {
      return undefined;
    }

    // Get club name for location
    const club = await this.getClub(liveGame.clubId);
    const location = club ? club.name : 'Unknown Club';

    // Create regular game entry
    const gameData = {
      title: liveGame.title,
      date: liveGame.gameDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      location: location,
      event: 'Live Game',
      uploadedBy: liveGame.createdBy,
      filename: `live-game-${liveGameId}.pbn`,
      pbnContent: await this.generatePbnFromLiveGame(liveGameId),
      clubId: liveGame.clubId,
      tournament: null,
      round: null,
      pbnEvent: null,
      pbnSite: null,
      pbnDate: null,
    };

    const [newGame] = await db.insert(games).values(gameData).returning();

    // Add creator as game participant
    await db.insert(gamePlayers).values({
      gameId: newGame.id,
      userId: liveGame.createdBy,
      partnerId: liveGame.partnerId,
      position: null,
      addedBy: liveGame.createdBy,
    });

    // Add partner as game participant if exists
    if (liveGame.partnerId) {
      await db.insert(gamePlayers).values({
        gameId: newGame.id,
        userId: liveGame.partnerId,
        partnerId: liveGame.createdBy,
        position: null,
        addedBy: liveGame.createdBy,
      });
    }

    // Convert live hands to regular hands with bidding sequences
    const liveHands = await this.getLiveGameHands(liveGameId);
    for (const liveHand of liveHands) {
      const [newHand] = await db.insert(hands).values({
        gameId: newGame.id,
        boardNumber: liveHand.boardNumber,
        dealer: liveHand.dealer || 'North',
        vulnerability: liveHand.vulnerability || 'None',
        northHand: liveHand.northHand || '',
        southHand: liveHand.southHand || '',
        eastHand: liveHand.eastHand || '',
        westHand: liveHand.westHand || '',
        actualBidding: liveHand.biddingSequence || [],
        result: null,
        finalContract: null,
        declarer: null,
      }).returning();

      // Transfer bidding sequences as partnership bidding if exists
      if (liveHand.biddingSequence && liveHand.biddingSequence.length > 0) {
        await db.insert(partnershipBidding).values({
          handId: newHand.id,
          gameId: newGame.id,
          userId: liveGame.createdBy,
          partnerId: liveGame.partnerId,
          biddingSequence: liveHand.biddingSequence,
        });
      }
    }

    // Link the live game to the regular game
    await this.updateLiveGame(liveGameId, { linkedGameId: newGame.id });

    return newGame;
  }

  // Generate PBN content from live game data
  private async generatePbnFromLiveGame(liveGameId: number): Promise<string> {
    const liveGame = await this.getLiveGame(liveGameId);
    const liveHands = await this.getLiveGameHands(liveGameId);
    
    if (!liveGame) return '';

    let pbnContent = `[Event "${liveGame.title}"]\n`;
    pbnContent += `[Date "${liveGame.gameDate.toISOString().split('T')[0]}"]\n`;
    pbnContent += `[Site "Live Game"]\n\n`;

    for (const hand of liveHands) {
      pbnContent += `[Board "${hand.boardNumber}"]\n`;
      pbnContent += `[Dealer "${hand.dealer || 'North'}"]\n`;
      pbnContent += `[Vulnerable "${hand.vulnerability || 'None'}"]\n`;
      
      if (hand.northHand) pbnContent += `[Deal "N:${hand.northHand}.${hand.southHand}.${hand.eastHand}.${hand.westHand}"]\n`;
      if (hand.biddingSequence && hand.biddingSequence.length > 0) {
        pbnContent += `[Auction "${hand.dealer || 'North'}"]\n`;
        pbnContent += hand.biddingSequence.join(' ') + '\n';
      }
      if (hand.notes) pbnContent += `[Note "${hand.notes}"]\n`;
      
      pbnContent += '\n';
    }

    return pbnContent;
  }

  // Clubs management methods
  async createClub(club: InsertClub): Promise<Club> {
    const [newClub] = await db.insert(clubs).values(club).returning();
    return newClub;
  }

  async getClub(id: number): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club;
  }

  async updateClub(id: number, updates: Partial<Club>): Promise<Club | undefined> {
    const [updated] = await db
      .update(clubs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clubs.id, id))
      .returning();
    return updated;
  }

  async getAllClubs(): Promise<Club[]> {
    return await db.select().from(clubs).orderBy(clubs.name);
  }

  async getVerifiedClubs(): Promise<Club[]> {
    return await db.select().from(clubs)
      .where(sql`${clubs.verifiedAt} IS NOT NULL`)
      .orderBy(clubs.name);
  }

  async searchClubs(query: string): Promise<Club[]> {
    const lowercaseQuery = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(clubs)
      .where(
        sql`LOWER(${clubs.name}) LIKE ${lowercaseQuery}`
      )
      .orderBy(clubs.name);
  }

  async verifyClub(id: number, adminUserId: string): Promise<boolean> {
    try {
      const [updated] = await db
        .update(clubs)
        .set({
          verifiedAt: new Date(),
          verifiedBy: adminUserId,
          updatedAt: new Date(),
        })
        .where(eq(clubs.id, id))
        .returning();
      return !!updated;
    } catch (error) {
      console.error("Error verifying club:", error);
      return false;
    }
  }

  async deleteClub(id: number): Promise<boolean> {
    try {
      await db.delete(clubs).where(eq(clubs.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting club:", error);
      return false;
    }
  }

  async setUserHomeClub(userId: string, clubId: number | null): Promise<boolean> {
    try {
      const [updated] = await db
        .update(users)
        .set({
          homeClubId: clubId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      return !!updated;
    } catch (error) {
      console.error("Error setting user home club:", error);
      return false;
    }
  }

  // User Favorite Clubs methods
  async addFavoriteClub(userId: string, clubId: number): Promise<void> {
    await db.insert(userFavoriteClubs).values({
      userId,
      clubId,
    }).onConflictDoNothing();
  }

  async removeFavoriteClub(userId: string, clubId: number): Promise<void> {
    await db.delete(userFavoriteClubs)
      .where(
        and(
          eq(userFavoriteClubs.userId, userId),
          eq(userFavoriteClubs.clubId, clubId)
        )
      );
  }

  async getUserFavoriteClubs(userId: string): Promise<Club[]> {
    return await db
      .select({
        id: clubs.id,
        name: clubs.name,
        location: clubs.location,
        address: clubs.address,
        website: clubs.website,
        phone: clubs.phone,
        email: clubs.email,
        isVerified: clubs.isVerified,
        verifiedBy: clubs.verifiedBy,
        verifiedAt: clubs.verifiedAt,
        managedBy: clubs.managedBy,
        createdBy: clubs.createdBy,
        createdAt: clubs.createdAt,
        updatedAt: clubs.updatedAt,
      })
      .from(clubs)
      .innerJoin(userFavoriteClubs, eq(clubs.id, userFavoriteClubs.clubId))
      .where(eq(userFavoriteClubs.userId, userId));
  }
}

export const storage = new DatabaseStorage();
