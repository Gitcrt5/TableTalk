import { eq, desc, and, or, like, inArray, isNull, asc, sql } from "drizzle-orm";
import { games, hands, userBidding, comments, users, clubs, partners, gamePlayers, partnershipBidding, gameParticipants, gameAccess, userFavoriteClubs, type Game, type Hand, type UserBidding, type Comment, type User, type Club, type Partner, type GamePlayer, type PartnershipBidding, type GameParticipant, type GameAccess, type UserFavoriteClub, type InsertGame, type InsertHand, type InsertUserBidding, type InsertComment, type InsertClub, type InsertGamePlayer, type InsertPartnershipBidding, type InsertGameParticipant, type InsertPartner, type InsertGameAccess, type InsertUserFavoriteClub, type UpsertUser } from "@shared/schema";
import { db } from "./db";

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

  // User Bidding (practice)
  createUserBidding(bidding: InsertUserBidding): Promise<UserBidding>;
  getUserBidding(handId: number, userId: string): Promise<UserBidding | undefined>;
  getUserBiddingStats(userId: string): Promise<any>;

  // Partnership Bidding (official)
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

  // User management
  getUserStats(userId: string): Promise<any>;
  searchUsers(query: string): Promise<User[]>;
  getUserPartners(userId: string): Promise<User[]>;
  addPartner(userId: string, partnerId: string): Promise<void>;
  removePartner(userId: string, partnerId: string): Promise<void>;
  deactivateUser(userId: string, reason?: string): Promise<boolean>;
  reactivateUser(userId: string): Promise<boolean>;
  getAdminStats(): Promise<any>;

  // Game participation
  createGameParticipant(participant: InsertGameParticipant): Promise<GameParticipant>;
  getGameParticipants(gameId: number): Promise<GameParticipant[]>;
  getUserGameParticipation(userId: string, gameId: number): Promise<GameParticipant | undefined>;
  getPartnerCommentsForHand(handId: number, userId: string, partnerId: string): Promise<Comment[]>;

  // Partners
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
  addFavoriteClub(userId: string, clubId: number): Promise<void>;
  removeFavoriteClub(userId: string, clubId: number): Promise<void>;
  getUserFavoriteClubs(userId: string): Promise<Club[]>;
  getUserHomeClub(userId: string): Promise<Club | null>;
  setUserHomeClub(userId: string, clubId: number | null): Promise<void>;
  searchActiveClubs(query: string): Promise<Club[]>;

  // Live game access
  grantGameAccess(gameId: number, userId: string, accessType: string): Promise<void>;
  checkGameAccess(gameId: number, userId: string): Promise<boolean>;
  attachPbnToRegularGame(gameId: number, pbnContent: string, filename: string): Promise<any>;
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
        emailVerified: user.emailVerified,
        featureFlags: user.featureFlags,
      }
    }).returning();
    return result[0] as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0] as User | undefined;
  }

  async updateUserType(id: string, userType: string): Promise<boolean> {
    const result = await this.db.update(users).set({ userType }).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async getAllUsers(): Promise<User[]> {
    const result = await this.db.select().from(users);
    return result as User[];
  }

  async getAllHands(): Promise<Hand[]> {
    const result = await this.db.select().from(hands);
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
    const result = await this.db.update(games).set(updates).where(eq(games.id, id)).returning();
    return result[0] as Game | undefined;
  }

  async getAllGames(): Promise<Game[]> {
    const result = await this.db
      .select({
        games: games,
        club: clubs,
      })
      .from(games)
      .leftJoin(clubs, eq(games.clubId, clubs.id))
      .orderBy(desc(games.uploadedAt));

    return result.map(row => ({
      ...row.games,
      clubName: row.club?.name,
      clubLocation: row.club?.location,
      displayLocation: row.club?.name || row.games.location,
    })) as Game[];
  }

  async searchGames(query: string): Promise<Game[]> {
    const result = await this.db.select().from(games)
      .where(or(
        like(games.title, `%${query}%`),
        like(games.location, `%${query}%`),
        like(games.tournament, `%${query}%`)
      ));
    return result as Game[];
  }

  async findDuplicateByFirstHand(firstHand: any): Promise<Game | undefined> {
    // Implementation for finding duplicates by first hand
    return undefined;
  }

  async addGamePlayer(gamePlayer: InsertGamePlayer): Promise<GamePlayer> {
    const result = await this.db.insert(gamePlayers).values(gamePlayer).returning();
    return result[0] as GamePlayer;
  }

  async getGamePlayers(gameId: number): Promise<User[]> {
    const result = await this.db.select({
      id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        profileImageUrl: users.profileImageUrl,
        password: users.password,
        authType: users.authType,
        userType: users.userType,
        emailVerified: users.emailVerified,
        featureFlags: users.featureFlags,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        isActive: users.isActive,
        partnerId: gamePlayers.partnerId,
      })
      .from(gamePlayers)
      .innerJoin(users, eq(gamePlayers.userId, users.id))
      .where(eq(gamePlayers.gameId, gameId));
    return result as User[];
  }

  async removeGamePlayer(gameId: number, userId: string): Promise<void> {
    await this.db.delete(gamePlayers).where(and(
      eq(gamePlayers.gameId, gameId),
      eq(gamePlayers.userId, userId)
    ));
  }

  async getUserGames(userId: string): Promise<Game[]> {
    const result = await this.db.select({
        id: games.id,
        title: games.title,
        date: games.date,
        location: games.location,
        tournament: games.tournament,
        round: games.round,
        uploadedBy: games.uploadedBy,
        pbnContent: games.pbnContent,
        filename: games.filename,
        gameType: games.gameType,
        createdAt: games.createdAt,
        updatedAt: games.updatedAt,
      })
      .from(gamePlayers)
      .innerJoin(games, eq(gamePlayers.gameId, games.id))
      .where(eq(gamePlayers.userId, userId));
    return result as Game[];
  }

  async getCurrentUserGameData(gameId: number, userId: string): Promise<{
    isPlaying: boolean;
    partner?: User;
  }> {
    // Check if user is marked as playing this game
    const gamePlayer = await this.db.select()
      .from(gamePlayers)
      .where(and(
        eq(gamePlayers.gameId, gameId),
        eq(gamePlayers.userId, userId)
      ))
      .limit(1);

    if (gamePlayer.length === 0) {
      return { isPlaying: false };
    }

    const player = gamePlayer[0];

    // If they have a partner, fetch partner details
    if (player.partnerId) {
      const partner = await this.getUser(player.partnerId);
      return {
        isPlaying: true,
        partner: partner
      };
    }

    return { isPlaying: true };
  }

  async createHand(hand: InsertHand): Promise<Hand> {
    const result = await this.db.insert(hands).values(hand).returning();
    return result[0] as Hand;
  }

  async getHand(id: number): Promise<Hand | undefined> {
    const result = await this.db.select().from(hands).where(eq(hands.id, id)).limit(1);
    return result[0] as Hand | undefined;
  }

  async updateHand(id: number, updates: Partial<Hand>): Promise<Hand | undefined> {
    const result = await this.db.update(hands).set(updates).where(eq(hands.id, id)).returning();
    return result[0] as Hand | undefined;
  }

  async getHandsByGame(gameId: number): Promise<Hand[]> {
    const result = await this.db.select().from(hands).where(eq(hands.gameId, gameId));
    return result as Hand[];
  }

  async createUserBidding(bidding: InsertUserBidding): Promise<UserBidding> {
    const result = await this.db.insert(userBidding).values(bidding).returning();
    return result[0] as UserBidding;
  }

  async getUserBidding(handId: number, userId: string): Promise<UserBidding | undefined> {
    const result = await this.db.select().from(userBidding)
      .where(eq(userBidding.handId, handId))
      .where(eq(userBidding.userId, userId))
      .limit(1);
    return result[0] as UserBidding | undefined;
  }

  async getUserBiddingStats(userId: string): Promise<any> {
    return {};
  }

  async createPartnershipBidding(bidding: InsertPartnershipBidding): Promise<PartnershipBidding> {
    const result = await this.db.insert(partnershipBidding).values(bidding).returning();
    return result[0] as PartnershipBidding;
  }

  async getPartnershipBidding(handId: number, userId: string, partnerId?: string): Promise<PartnershipBidding | undefined> {
    // First try to find bidding entered by the current user
    let result = await this.db.select().from(partnershipBidding)
      .where(and(
        eq(partnershipBidding.handId, handId),
        eq(partnershipBidding.userId, userId)
      ))
      .limit(1);

    if (result.length > 0) {
      return result[0] as PartnershipBidding;
    }

    // If no bidding found by current user, look for bidding where current user is the partner
    result = await this.db.select().from(partnershipBidding)
      .where(and(
        eq(partnershipBidding.handId, handId),
        eq(partnershipBidding.partnerId, userId)
      ))
      .limit(1);

    return result[0] as PartnershipBidding | undefined;
  }

  async getAllPartnershipBiddingForHand(handId: number): Promise<PartnershipBidding[]> {
    const result = await this.db.select().from(partnershipBidding)
      .where(eq(partnershipBidding.handId, handId));
    return result as PartnershipBidding[];
  }

  async updatePartnershipBidding(id: number, biddingSequence: string[]): Promise<PartnershipBidding | undefined> {
    const result = await this.db.update(partnershipBidding)
      .set({ biddingSequence })
      .where(eq(partnershipBidding.id, id))
      .returning();
    return result[0] as PartnershipBidding | undefined;
  }

  async deletePartnershipBidding(handId: number, userId: string): Promise<void> {
    await this.db.delete(partnershipBidding)
      .where(eq(partnershipBidding.handId, handId))
      .where(eq(partnershipBidding.userId, userId));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await this.db.insert(comments).values(comment).returning();
    return result[0] as Comment;
  }

  async getCommentsByHand(handId: number): Promise<Comment[]> {
    const result = await this.db.select().from(comments)
      .where(eq(comments.handId, handId));
    return result as Comment[];
  }

  async likeComment(commentId: number): Promise<void> {
    // Increment likes count
    const comment = await this.db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
    if (comment[0]) {
      await this.db.update(comments)
        .set({ likes: (comment[0].likes || 0) + 1 })
        .where(eq(comments.id, commentId));
    }
  }

  async getUserCommentCount(userId: string): Promise<number> {
    const result = await this.db.select().from(comments)
      .where(eq(comments.userId, userId));
    return result.length;
  }

  async getUserStats(userId: string): Promise<any> {
    return {};
  }

  async searchUsers(query: string): Promise<User[]> {
    const result = await this.db.select().from(users)
      .where(or(
        like(users.firstName, `%${query}%`),
        like(users.lastName, `%${query}%`),
        like(users.displayName, `%${query}%`),
        like(users.email, `%${query}%`)
      ));
    return result as User[];
  }



  async deactivateUser(userId: string, reason?: string): Promise<boolean> {
    const result = await this.db.update(users)
      .set({ isActive: false })
      .where(eq(users.id, userId));
    return result.rowCount > 0;
  }

  async reactivateUser(userId: string): Promise<boolean> {
    const result = await this.db.update(users)
      .set({ isActive: true })
      .where(eq(users.id, userId));
    return result.rowCount > 0;
  }

  async getAdminStats(): Promise<any> {
    return {};
  }

  // Partner management

  async getUserPartners(userId: string): Promise<User[]> {
    const result = await this.db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      profileImageUrl: users.profileImageUrl,
      password: users.password,
      authType: users.authType,
      userType: users.userType,
      emailVerified: users.emailVerified,
      featureFlags: users.featureFlags,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      isActive: users.isActive,
    })
    .from(partners)
    .innerJoin(users, eq(partners.partnerId, users.id))
    .where(eq(partners.userId, userId));
    return result as User[];
  }

  async addPartner(userId: string, partnerId: string): Promise<void> {
    // Add bidirectional partnership
    await this.db.insert(partners).values({ userId, partnerId });
    await this.db.insert(partners).values({ userId: partnerId, partnerId: userId });
  }

  async removePartner(userId: string, partnerId: string): Promise<void> {
    // Remove bidirectional partnership
    await this.db.delete(partners)
      .where(or(
        and(eq(partners.userId, userId), eq(partners.partnerId, partnerId)),
        and(eq(partners.userId, partnerId), eq(partners.partnerId, userId))
      ));
  }

  async createGameParticipant(participant: InsertGameParticipant): Promise<GameParticipant> {
    const result = await this.db.insert(gameParticipants).values(participant).returning();
    return result[0] as GameParticipant;
  }

  async getGameParticipants(gameId: number): Promise<GameParticipant[]> {
    const result = await this.db.select().from(gameParticipants)
      .where(eq(gameParticipants.gameId, gameId));
    return result as GameParticipant[];
  }

  async getUserGameParticipation(userId: string, gameId: number): Promise<GameParticipant | undefined> {
    const result = await this.db.select().from(gameParticipants)
      .where(eq(gameParticipants.userId, userId))
      .where(eq(gameParticipants.gameId, gameId))
      .limit(1);
    return result[0] as GameParticipant | undefined;
  }

  async getPartnerCommentsForHand(handId: number, userId: string, partnerId: string): Promise<Comment[]> {
    return [];
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const result = await this.db.insert(partners).values(partner).returning();
    return result[0] as Partner;
  }

  // Club management methods - FULLY IMPLEMENTED
  async createClub(club: InsertClub): Promise<Club> {
    const result = await this.db.insert(clubs).values(club).returning();
    return result[0] as Club;
  }

  async getClub(id: number): Promise<Club | undefined> {
    const result = await this.db.select().from(clubs).where(eq(clubs.id, id)).limit(1);
    return result[0] as Club | undefined;
  }

  async updateClub(id: number, updates: Partial<Club>): Promise<Club | undefined> {
    const result = await this.db.update(clubs).set({ ...updates, updatedAt: new Date() }).where(eq(clubs.id, id)).returning();
    return result[0] as Club | undefined;
  }

  async getAllClubs(): Promise<Club[]> {
    const result = await this.db.select().from(clubs).orderBy(clubs.name);
    return result as Club[];
  }

  async getActiveClubs(): Promise<Club[]> {
    const result = await this.db.select().from(clubs).where(eq(clubs.isActive, true)).orderBy(clubs.name);
    return result as Club[];
  }

  async searchClubs(query: string): Promise<Club[]> {
    const result = await this.db.select().from(clubs)
      .where(or(
        like(clubs.name, `%${query}%`),
        like(clubs.location, `%${query}%`),
        like(clubs.state, `%${query}%`),
        like(clubs.country, `%${query}%`)
      ))
      .orderBy(clubs.name);
    return result as Club[];
  }

  async deleteClub(id: number): Promise<boolean> {
    const result = await this.db.delete(clubs).where(eq(clubs.id, id));
    return result.rowCount > 0;
  }

  async deactivateClub(id: number): Promise<boolean> {
    const result = await this.db.update(clubs).set({ isActive: false, updatedAt: new Date() }).where(eq(clubs.id, id));
    return result.rowCount > 0;
  }

  // User favorite clubs (max 5)
  async getUserFavoriteClubs(userId: string): Promise<Club[]> {
    const favoriteClubIds = await db
      .select({ clubId: userFavoriteClubs.clubId })
      .from(userFavoriteClubs)
      .where(eq(userFavoriteClubs.userId, userId));

    if (favoriteClubIds.length === 0) {
      return [];
    }

    const clubIds = favoriteClubIds.map(fc => fc.clubId);
    return await db
      .select()
      .from(clubs)
      .where(inArray(clubs.id, clubIds))
      .orderBy(clubs.name);
  }

  async addFavoriteClub(userId: string, clubId: number): Promise<void> {
    // Check if user already has 5 favorite clubs
    const currentFavorites = await db
      .select({ count: sql<number>`count(*)` })
      .from(userFavoriteClubs)
      .where(eq(userFavoriteClubs.userId, userId));

    if (currentFavorites[0]?.count >= 5) {
      throw new Error("Maximum of 5 favorite clubs allowed");
    }

    // Check if club exists and is active
    const club = await db
      .select()
      .from(clubs)
      .where(and(eq(clubs.id, clubId), eq(clubs.isActive, true)))
      .limit(1);

    if (club.length === 0) {
      throw new Error("Club not found or inactive");
    }

    // Add to favorites (ignore if already exists)
    await db
      .insert(userFavoriteClubs)
      .values({ userId, clubId })
      .onConflictDoNothing();
  }

  async removeFavoriteClub(userId: string, clubId: number): Promise<void> {
    await db
      .delete(userFavoriteClubs)
      .where(and(
        eq(userFavoriteClubs.userId, userId),
        eq(userFavoriteClubs.clubId, clubId)
      ));
  }

  async getUserHomeClub(userId: string): Promise<Club | null> {
    const user = await this.getUser(userId);
    if (!user?.homeClubId) {
      return null;
    }

    const homeClub = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, user.homeClubId))
      .limit(1);

    return homeClub[0] || null;
  }

  async setUserHomeClub(userId: string, clubId: number | null): Promise<void> {
    if (clubId !== null) {
      // Verify club exists and is active
      const club = await db
        .select()
        .from(clubs)
        .where(and(eq(clubs.id, clubId), eq(clubs.isActive, true)))
        .limit(1);

      if (club.length === 0) {
        throw new Error("Club not found or inactive");
      }
    }

    await db
      .update(users)
      .set({ homeClubId: clubId })
      .where(eq(users.id, userId));
  }

  async searchActiveClubs(query: string): Promise<Club[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(clubs)
      .where(and(
        eq(clubs.isActive, true),
        or(
          sql`lower(${clubs.name}) like ${searchTerm}`,
          sql`lower(${clubs.location}) like ${searchTerm}`,
          sql`lower(${clubs.state}) like ${searchTerm}`,
          sql`lower(${clubs.country}) like ${searchTerm}`
        )
      ))
      .orderBy(clubs.name)
      .limit(20);
  }

  async grantGameAccess(gameId: number, userId: string, accessType: string): Promise<void> {}

  async checkGameAccess(gameId: number, userId: string): Promise<boolean> {
    return false;
  }

  async attachPbnToRegularGame(gameId: number, pbnContent: string, filename: string): Promise<any> {
    return {};
  }
}

// Use database storage for production
export const storage: IStorage = new DatabaseStorage(db);