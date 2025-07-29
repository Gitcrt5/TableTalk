import { eq } from "drizzle-orm";
import { games, hands, userBidding, comments, users, clubs, partners, gamePlayers, partnershipBidding, gameParticipants, gameAccess, userFavoriteClubs, type Game, type Hand, type UserBidding, type Comment, type User, type Club, type Partner, type GamePlayer, type PartnershipBidding, type GameParticipant, type GameAccess, type UserFavoriteClub, type InsertGame, type InsertHand, type InsertUserBidding, type InsertComment, type InsertClub, type InsertGamePlayer, type InsertPartnershipBidding, type InsertGameParticipant, type InsertPartner, type InsertGameAccess, type InsertUserFavoriteClub, type UpsertUser } from "@shared/schema";

export interface IStorage {
  // Users (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserType(id: string, userType: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getAllHands(): Promise<Hand[]>;

  // Games (unified for both regular and live games)
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

  // Hands (unified for both regular PBN and live hands)
  createHand(hand: InsertHand): Promise<Hand>;
  getHand(id: number): Promise<Hand | undefined>;
  updateHand(id: number, updates: Partial<Hand>): Promise<Hand | undefined>;
  getHandsByGame(gameId: number): Promise<Hand[]>;

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
  getAdminStats(): Promise<{
    totalUsers: number;
    totalGames: number;
    totalHands: number;
    totalComments: number;
    newUsersThisWeek: number;
    newGamesThisWeek: number;
  }>;

  // Game Participants
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
  getActiveClubs(): Promise<Club[]>;
  searchClubs(query: string): Promise<Club[]>;
  deleteClub(id: number): Promise<boolean>;
  deactivateClub(id: number): Promise<boolean>;
  
  // User Favorite Clubs
  addFavoriteClub(userId: string, clubId: number): Promise<void>;
  removeFavoriteClub(userId: string, clubId: number): Promise<void>;
  getUserFavoriteClubs(userId: string): Promise<Club[]>;

  // Game Access (for private games)
  grantGameAccess(gameId: number, userId: string, accessType: string): Promise<void>;
  checkGameAccess(gameId: number, userId: string): Promise<boolean>;

  // Unified game operations
  attachPbnToRegularGame(gameId: number, pbnContent: string, filename: string): Promise<{
    success: boolean;
    handsCreated: number;
  }>;
}

// Implementation will be added later
export class MemStorage implements IStorage {
  // Placeholder implementation for interface compliance
  async getUser(id: string): Promise<User | undefined> { return undefined; }
  async getUserByEmail(email: string): Promise<User | undefined> { return undefined; }
  async upsertUser(user: UpsertUser): Promise<User> { throw new Error("Not implemented"); }
  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> { return undefined; }
  async updateUserType(id: string, userType: string): Promise<boolean> { return false; }
  async getAllUsers(): Promise<User[]> { return []; }
  async getAllHands(): Promise<Hand[]> { return []; }
  async createGame(game: InsertGame): Promise<Game> { throw new Error("Not implemented"); }
  async getGame(id: number): Promise<Game | undefined> { return undefined; }
  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> { return undefined; }
  async getAllGames(): Promise<Game[]> { return []; }
  async searchGames(query: string): Promise<Game[]> { return []; }
  async findDuplicateByFirstHand(firstHand: any): Promise<Game | undefined> { return undefined; }
  async addGamePlayer(gamePlayer: InsertGamePlayer): Promise<GamePlayer> { throw new Error("Not implemented"); }
  async getGamePlayers(gameId: number): Promise<User[]> { return []; }
  async removeGamePlayer(gameId: number, userId: string): Promise<void> {}
  async getUserGames(userId: string): Promise<Game[]> { return []; }
  async getCurrentUserGameData(gameId: number, userId: string): Promise<any> { return {}; }
  async createHand(hand: InsertHand): Promise<Hand> { throw new Error("Not implemented"); }
  async getHand(id: number): Promise<Hand | undefined> { return undefined; }
  async updateHand(id: number, updates: Partial<Hand>): Promise<Hand | undefined> { return undefined; }
  async getHandsByGame(gameId: number): Promise<Hand[]> { return []; }
  async createUserBidding(bidding: InsertUserBidding): Promise<UserBidding> { throw new Error("Not implemented"); }
  async getUserBidding(handId: number, userId: string): Promise<UserBidding | undefined> { return undefined; }
  async getUserBiddingStats(userId: string): Promise<any> { return {}; }
  async createPartnershipBidding(bidding: InsertPartnershipBidding): Promise<PartnershipBidding> { throw new Error("Not implemented"); }
  async getPartnershipBidding(handId: number, userId: string, partnerId?: string): Promise<PartnershipBidding | undefined> { return undefined; }
  async getAllPartnershipBiddingForHand(handId: number): Promise<PartnershipBidding[]> { return []; }
  async updatePartnershipBidding(id: number, biddingSequence: string[]): Promise<PartnershipBidding | undefined> { return undefined; }
  async deletePartnershipBidding(handId: number, userId: string): Promise<void> {}
  async createComment(comment: InsertComment): Promise<Comment> { throw new Error("Not implemented"); }
  async getCommentsByHand(handId: number): Promise<Comment[]> { return []; }
  async likeComment(commentId: number): Promise<void> {}
  async getUserCommentCount(userId: string): Promise<number> { return 0; }
  async getUserStats(userId: string): Promise<any> { return {}; }
  async searchUsers(query: string): Promise<User[]> { return []; }
  async getUserPartners(userId: string): Promise<User[]> { return []; }
  async addPartner(userId: string, partnerId: string): Promise<void> {}
  async removePartner(userId: string, partnerId: string): Promise<void> {}
  async deactivateUser(userId: string, reason?: string): Promise<boolean> { return false; }
  async reactivateUser(userId: string): Promise<boolean> { return false; }
  async getAdminStats(): Promise<any> { return {}; }
  async createGameParticipant(participant: InsertGameParticipant): Promise<GameParticipant> { throw new Error("Not implemented"); }
  async getGameParticipants(gameId: number): Promise<GameParticipant[]> { return []; }
  async getUserGameParticipation(userId: string, gameId: number): Promise<GameParticipant | undefined> { return undefined; }
  async getPartnerCommentsForHand(handId: number, userId: string, partnerId: string): Promise<Comment[]> { return []; }
  async createPartner(partner: InsertPartner): Promise<Partner> { throw new Error("Not implemented"); }
  async createClub(club: InsertClub): Promise<Club> { throw new Error("Not implemented"); }
  async getClub(id: number): Promise<Club | undefined> { return undefined; }
  async updateClub(id: number, updates: Partial<Club>): Promise<Club | undefined> { return undefined; }
  async getAllClubs(): Promise<Club[]> { return []; }
  async getActiveClubs(): Promise<Club[]> { return []; }
  async searchClubs(query: string): Promise<Club[]> { return []; }
  async deleteClub(id: number): Promise<boolean> { return false; }
  async deactivateClub(id: number): Promise<boolean> { return false; }
  async addFavoriteClub(userId: string, clubId: number): Promise<void> {}
  async removeFavoriteClub(userId: string, clubId: number): Promise<void> {}
  async getUserFavoriteClubs(userId: string): Promise<Club[]> { return []; }
  async grantGameAccess(gameId: number, userId: string, accessType: string): Promise<void> {}
  async checkGameAccess(gameId: number, userId: string): Promise<boolean> { return false; }
  async attachPbnToRegularGame(gameId: number, pbnContent: string, filename: string): Promise<any> { return {}; }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  constructor(private db: any) {}

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] as User | undefined;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).onConflictDoUpdate({
      target: users.id,
      set: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        profileImageUrl: user.profileImageUrl,
        password: user.password,
        authType: user.authType,
        userType: user.userType,
        homeClubId: user.homeClubId,
        emailVerified: user.emailVerified,
        featureFlags: user.featureFlags,
        profileCompletionStep: user.profileCompletionStep,
        updatedAt: new Date(),
      },
    }).returning();
    return result[0] as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return result[0] as User | undefined;
  }

  async updateUserType(id: string, userType: string): Promise<boolean> {
    const result = await this.db.update(users).set({ userType, updatedAt: new Date() }).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async getAllUsers(): Promise<User[]> {
    const result = await this.db.select().from(users).orderBy(users.createdAt);
    return result as User[];
  }

  async getAllHands(): Promise<Hand[]> {
    const result = await this.db.select().from(hands).orderBy(hands.gameId, hands.boardNumber);
    return result as Hand[];
  }

  async createGame(game: InsertGame): Promise<Game> {
    const result = await this.db.insert(games).values(game).returning();
    return result[0] as Game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const result = await this.db.select().from(games).where(eq(games.id, id)).limit(1);
    return result[0] as Game | undefined;
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const result = await this.db.update(games).set({ ...updates, updatedAt: new Date() }).where(eq(games.id, id)).returning();
    return result[0] as Game | undefined;
  }

  async getAllGames(): Promise<Game[]> {
    const result = await this.db.select().from(games).orderBy(games.createdAt);
    return result as Game[];
  }

  async searchGames(query: string): Promise<Game[]> {
    const result = await this.db.select().from(games)
      .where(or(
        like(games.title, `%${query}%`),
        like(games.filename, `%${query}%`),
        like(games.location, `%${query}%`),
        like(games.event, `%${query}%`)
      ))
      .orderBy(games.createdAt);
    return result as Game[];
  }
  async findDuplicateByFirstHand(firstHand: any): Promise<Game | undefined> { return undefined; }
  async addGamePlayer(gamePlayer: InsertGamePlayer): Promise<GamePlayer> { throw new Error("Not implemented"); }
  async getGamePlayers(gameId: number): Promise<User[]> { return []; }
  async removeGamePlayer(gameId: number, userId: string): Promise<void> {}
  async getUserGames(userId: string): Promise<Game[]> { return []; }
  async getCurrentUserGameData(gameId: number, userId: string): Promise<any> { return {}; }
  async createHand(hand: InsertHand): Promise<Hand> { throw new Error("Not implemented"); }
  async getHand(id: number): Promise<Hand | undefined> { return undefined; }
  async updateHand(id: number, updates: Partial<Hand>): Promise<Hand | undefined> { return undefined; }
  async getHandsByGame(gameId: number): Promise<Hand[]> { return []; }
  async createUserBidding(bidding: InsertUserBidding): Promise<UserBidding> { throw new Error("Not implemented"); }
  async getUserBidding(handId: number, userId: string): Promise<UserBidding | undefined> { return undefined; }
  async getUserBiddingStats(userId: string): Promise<any> { return {}; }
  async createPartnershipBidding(bidding: InsertPartnershipBidding): Promise<PartnershipBidding> { throw new Error("Not implemented"); }
  async getPartnershipBidding(handId: number, userId: string, partnerId?: string): Promise<PartnershipBidding | undefined> { return undefined; }
  async getAllPartnershipBiddingForHand(handId: number): Promise<PartnershipBidding[]> { return []; }
  async updatePartnershipBidding(id: number, biddingSequence: string[]): Promise<PartnershipBidding | undefined> { return undefined; }
  async deletePartnershipBidding(handId: number, userId: string): Promise<void> {}
  async createComment(comment: InsertComment): Promise<Comment> { throw new Error("Not implemented"); }
  async getCommentsByHand(handId: number): Promise<Comment[]> { return []; }
  async likeComment(commentId: number): Promise<void> {}
  async getUserCommentCount(userId: string): Promise<number> { return 0; }
  async getUserStats(userId: string): Promise<any> { return {}; }
  async searchUsers(query: string): Promise<User[]> { return []; }
  async getUserPartners(userId: string): Promise<User[]> { return []; }
  async addPartner(userId: string, partnerId: string): Promise<void> {}
  async removePartner(userId: string, partnerId: string): Promise<void> {}
  async deactivateUser(userId: string, reason?: string): Promise<boolean> { return false; }
  async reactivateUser(userId: string): Promise<boolean> { return false; }
  async getAdminStats(): Promise<any> { return {}; }
  async createGameParticipant(participant: InsertGameParticipant): Promise<GameParticipant> { throw new Error("Not implemented"); }
  async getGameParticipants(gameId: number): Promise<GameParticipant[]> { return []; }
  async getUserGameParticipation(userId: string, gameId: number): Promise<GameParticipant | undefined> { return undefined; }
  async getPartnerCommentsForHand(handId: number, userId: string, partnerId: string): Promise<Comment[]> { return []; }
  async createPartner(partner: InsertPartner): Promise<Partner> { throw new Error("Not implemented"); }
  async createClub(club: InsertClub): Promise<Club> { throw new Error("Not implemented"); }
  async getClub(id: number): Promise<Club | undefined> { return undefined; }
  async updateClub(id: number, updates: Partial<Club>): Promise<Club | undefined> { return undefined; }
  async getAllClubs(): Promise<Club[]> { return []; }
  async getActiveClubs(): Promise<Club[]> { return []; }
  async searchClubs(query: string): Promise<Club[]> { return []; }
  async deleteClub(id: number): Promise<boolean> { return false; }
  async deactivateClub(id: number): Promise<boolean> { return false; }
  async addFavoriteClub(userId: string, clubId: number): Promise<void> {}
  async removeFavoriteClub(userId: string, clubId: number): Promise<void> {}
  async getUserFavoriteClubs(userId: string): Promise<Club[]> { return []; }
  async grantGameAccess(gameId: number, userId: string, accessType: string): Promise<void> {}
  async checkGameAccess(gameId: number, userId: string): Promise<boolean> { return false; }
  async attachPbnToRegularGame(gameId: number, pbnContent: string, filename: string): Promise<any> { return {}; }
}

// Use database storage for production
import { db } from "./db";
import { games, hands, comments, users } from "@shared/schema";
import { eq, like, or } from "drizzle-orm";
export const storage: IStorage = new DatabaseStorage(db);