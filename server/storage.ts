import { games, hands, userBidding, comments, users, clubs, partners, gamePlayers, type Game, type Hand, type UserBidding, type Comment, type User, type Club, type Partner, type GamePlayer, type InsertGame, type InsertHand, type InsertUserBidding, type InsertComment, type InsertClub, type InsertGamePlayer, type UpsertUser } from "@shared/schema";

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

  // Partners
  createPartner(partner: InsertPartner): Promise<Partner>;
  getUserPartners(userId: string): Promise<User[]>;
  removePartner(userId: string, partnerId: string): Promise<boolean>;
  searchUsers(query: string, excludeUserId?: string): Promise<User[]>;

  // Game Participants
  createGameParticipant(participant: InsertGameParticipant): Promise<GameParticipant>;
  getGameParticipants(gameId: number): Promise<GameParticipant[]>;
  getUserGameParticipation(userId: string, gameId: number): Promise<GameParticipant | undefined>;
  getPartnerCommentsForHand(handId: number, userId: string, partnerId: string): Promise<Comment[]>;

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private games: Map<number, Game>;
  private hands: Map<number, Hand>;
  private userBidding: Map<string, UserBidding>; // key: handId-userId
  private comments: Map<number, Comment>;
  private partners: Map<string, string[]>; // userId -> list of partner IDs
  private currentGameId: number;
  private currentHandId: number;
  private currentUserBiddingId: number;
  private currentCommentId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.hands = new Map();
    this.userBidding = new Map();
    this.comments = new Map();
    this.partners = new Map();
    this.currentGameId = 1;
    this.currentHandId = 1;
    this.currentUserBiddingId = 1;
    this.currentCommentId = 1;

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
      authType: userData.authType || "replit",
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
      role: userData.role || "player",
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
      actualBidding: ["Pass", "1♠", "Pass", "2♣", "Pass", "2♠", "Pass", "3♣", "Pass", "4♠", "Pass", "Pass", "Pass"],
      finalContract: "4♠",
      declarer: "N",
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
      actualBidding: insertHand.actualBidding as string[],
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
    const partnerRows = await db
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
    
    return partnerRows;
  }

  async addPartner(userId: string, partnerId: string): Promise<void> {
    await db
      .insert(partners)
      .values({ userId, partnerId })
      .onConflictDoNothing();
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
    const [game] = await db
      .insert(games)
      .values(insertGame)
      .returning();
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [gameWithUser] = await db
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
      .where(eq(games.id, id));

    if (!gameWithUser) return undefined;

    return {
      ...gameWithUser,
      uploaderName: gameWithUser.uploaderName || gameWithUser.uploadedBy,
    };
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

    return gamesWithUsers.map(game => ({
      ...game,
      uploaderName: game.uploaderName || game.uploadedBy,
    }));
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
    return hand;
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
    const handsWithCommentCounts = await db
      .select({
        id: hands.id,
        gameId: hands.gameId,
        boardNumber: hands.boardNumber,
        dealer: hands.dealer,
        vulnerability: hands.vulnerability,
        northHand: hands.northHand,
        southHand: hands.southHand,
        eastHand: hands.eastHand,
        westHand: hands.westHand,
        actualBidding: hands.actualBidding,
        finalContract: hands.finalContract,
        declarer: hands.declarer,
        result: hands.result,
        commentCount: sql<number>`COALESCE(COUNT(${comments.id}), 0)`,
      })
      .from(hands)
      .leftJoin(comments, eq(hands.id, comments.handId))
      .where(eq(hands.gameId, gameId))
      .groupBy(hands.id)
      .orderBy(hands.boardNumber);

    return handsWithCommentCounts as (Hand & { commentCount: number })[];
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
        passwordResetTokenExpiry: users.passwordResetTokenExpiry,
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
        createdAt: games.createdAt,
        updatedAt: games.updatedAt,
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
}

export const storage = new DatabaseStorage();
