import { games, hands, userBidding, comments, users, type Game, type Hand, type UserBidding, type Comment, type User, type InsertGame, type InsertHand, type InsertUserBidding, type InsertComment, type UpsertUser } from "@shared/schema";

export interface IStorage {
  // Users (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private games: Map<number, Game>;
  private hands: Map<number, Hand>;
  private userBidding: Map<string, UserBidding>; // key: handId-userId
  private comments: Map<number, Comment>;
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
    const game: Game = {
      ...insertGame,
      id,
      uploadedAt: new Date(),
      tournament: insertGame.tournament || null,
      round: insertGame.round || null,
      date: insertGame.date || null,
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
}

import { db } from "./db";
import { eq, desc, like, and, sql } from "drizzle-orm";

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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
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
        uploaderName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
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
        uploaderName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
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
    return await db.select().from(games)
      .where(like(games.title, `%${query}%`))
      .orderBy(desc(games.uploadedAt));
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
    return await db.select().from(hands)
      .where(eq(hands.gameId, gameId))
      .orderBy(hands.boardNumber);
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
}

export const storage = new DatabaseStorage();
