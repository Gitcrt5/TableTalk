import {
  users,
  games,
  boards,
  comments,
  partnerships,
  events,
  userTypes,
  clubs,
  favouriteClubs,
  eventDeals,
  gameParticipants,
  eventResults,
  eventStandings,
  userPreferences,
  featureFlags,
  type User,
  type Game,
  type Board,
  type Comment,
  type Partnership,
  type Event,
  type Club,
  type FavouriteClub,
  type EventDeal,
  type GameParticipant,
  type EventResult,
  type EventStanding,
  type UserPreference,
  type FeatureFlag,
  type InsertUser,
  type InsertGame,
  type InsertBoard,
  type InsertComment,
  type InsertPartnership,
  type InsertEvent,
  type InsertClub,
  type InsertFavouriteClub,
  type InsertEventDeal,
  type InsertGameParticipant,
  type InsertEventResult,
  type InsertEventStanding,
  type InsertUserPreference,
  type InsertFeatureFlag,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count, isNotNull, ne } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Clubs
  getClub(id: string): Promise<Club | undefined>;
  getClubs(limit?: number): Promise<Club[]>;
  searchClubs(query: string): Promise<Club[]>;
  createClub(club: InsertClub): Promise<Club>;
  updateClub(id: string, updates: Partial<Club>): Promise<Club>;
  
  // Favourite Clubs
  getFavouriteClubsByUser(userId: string): Promise<Club[]>;
  addFavouriteClub(userId: string, clubId: string): Promise<FavouriteClub>;
  removeFavouriteClub(userId: string, clubId: string): Promise<void>;

  // Games
  getGame(id: string): Promise<Game | undefined>;
  getGamesByUser(userId: string): Promise<Game[]>;
  getPublicGames(limit?: number): Promise<Game[]>;
  searchGames(query: string, userId?: string): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game>;

  // Boards
  getBoard(id: string): Promise<Board | undefined>;
  getBoardsByGame(gameId: string): Promise<Board[]>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: string, updates: Partial<Board>): Promise<Board>;

  // Event Deals
  getEventDeal(id: string): Promise<EventDeal | undefined>;
  getEventDealsByEvent(eventId: string): Promise<EventDeal[]>;
  createEventDeal(eventDeal: InsertEventDeal): Promise<EventDeal>;
  updateEventDeal(id: string, updates: Partial<EventDeal>): Promise<EventDeal>;

  // Game Participants
  getGameParticipants(gameId: string): Promise<GameParticipant[]>;
  createGameParticipant(participant: InsertGameParticipant): Promise<GameParticipant>;
  updateGameParticipant(id: string, updates: Partial<GameParticipant>): Promise<GameParticipant>;

  // Comments
  getCommentsByBoard(boardId: string): Promise<Comment[]>;
  getCommentsByEventDeal(eventDealId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, updates: Partial<Comment>): Promise<Comment>;
  deleteComment(id: string): Promise<void>;

  // Partnerships
  getPartnershipsByUser(userId: string): Promise<Partnership[]>;
  createPartnership(partnership: InsertPartnership): Promise<Partnership>;
  updatePartnership(id: string, updates: Partial<Partnership>): Promise<Partnership>;

  // Events
  getEvent(id: string): Promise<Event | undefined>;
  getEvents(limit?: number): Promise<Event[]>;
  getEventsByClub(clubId: string): Promise<Event[]>;
  searchEvents(query: string, clubName?: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event>;

  // Event Results & Standings
  getEventResults(eventId: string): Promise<EventResult[]>;
  createEventResult(result: InsertEventResult): Promise<EventResult>;
  getEventStandings(eventId: string): Promise<EventStanding[]>;
  updateEventStandings(eventId: string, standings: InsertEventStanding[]): Promise<EventStanding[]>;

  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreference[]>;
  getUserPreference(userId: string, key: string): Promise<UserPreference | undefined>;
  setUserPreference(userId: string, key: string, value: any): Promise<UserPreference>;

  // Feature Flags
  getFeatureFlags(): Promise<FeatureFlag[]>;
  getFeatureFlag(flagName: string): Promise<FeatureFlag | undefined>;
  isFeatureEnabled(flagName: string, userId?: string): Promise<boolean>;

  // Admin
  getAllUsers(search?: string, userTypeFilter?: string, limit?: number): Promise<User[]>;
  getUsersCount(): Promise<number>;
  getDistinctClubNames(): Promise<string[]>;
  deactivateUser(id: string): Promise<User>;
  activateUser(id: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .leftJoin(userTypes, eq(users.userTypeId, userTypes.id))
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);

    if (result.length === 0) {
      return undefined;
    }

    const [row] = result;
    return {
      ...row.users,
      userType: row.user_types
    } as any;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Clubs
  async getClub(id: string): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club || undefined;
  }

  async getClubs(limit = 20): Promise<Club[]> {
    return await db
      .select()
      .from(clubs)
      .where(eq(clubs.isActive, true))
      .orderBy(clubs.name)
      .limit(limit);
  }

  async searchClubs(query: string): Promise<Club[]> {
    return await db
      .select()
      .from(clubs)
      .where(
        and(
          eq(clubs.isActive, true),
          or(
            ilike(clubs.name, `%${query}%`),
            ilike(clubs.city, `%${query}%`),
            ilike(clubs.state, `%${query}%`)
          )
        )
      )
      .orderBy(clubs.name);
  }

  async createClub(insertClub: InsertClub): Promise<Club> {
    const [club] = await db.insert(clubs).values(insertClub).returning();
    return club;
  }

  async updateClub(id: string, updates: Partial<Club>): Promise<Club> {
    const [club] = await db
      .update(clubs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clubs.id, id))
      .returning();
    return club;
  }

  // Favourite Clubs
  async getFavouriteClubsByUser(userId: string): Promise<Club[]> {
    const results = await db
      .select({ club: clubs })
      .from(favouriteClubs)
      .innerJoin(clubs, eq(favouriteClubs.clubId, clubs.id))
      .where(eq(favouriteClubs.userId, userId))
      .orderBy(clubs.name);
    
    return results.map(r => r.club);
  }

  async addFavouriteClub(userId: string, clubId: string): Promise<FavouriteClub> {
    const [favouriteClub] = await db
      .insert(favouriteClubs)
      .values({ userId, clubId })
      .returning();
    return favouriteClub;
  }

  async removeFavouriteClub(userId: string, clubId: string): Promise<void> {
    await db
      .delete(favouriteClubs)
      .where(
        and(
          eq(favouriteClubs.userId, userId),
          eq(favouriteClubs.clubId, clubId)
        )
      );
  }

  // Games
  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async getGamesByUser(userId: string): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(or(eq(games.creatorId, userId), eq(games.partnerId, userId)))
      .orderBy(desc(games.updatedAt));
  }

  async getPublicGames(limit = 20): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(eq(games.visibility, "public"))
      .orderBy(desc(games.updatedAt))
      .limit(limit);
  }

  async searchGames(query: string, userId?: string): Promise<Game[]> {
    if (userId) {
      return await db
        .select()
        .from(games)
        .where(
          and(
            or(eq(games.creatorId, userId), eq(games.partnerId, userId)),
            ilike(games.name, `%${query}%`)
          )
        )
        .orderBy(desc(games.updatedAt));
    } else {
      return await db
        .select()
        .from(games)
        .where(
          and(
            eq(games.visibility, "public"),
            ilike(games.name, `%${query}%`)
          )
        )
        .orderBy(desc(games.updatedAt));
    }
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(insertGame).returning();
    return game;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game> {
    const [game] = await db
      .update(games)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(games.id, id))
      .returning();
    return game;
  }

  // Boards
  async getBoard(id: string): Promise<Board | undefined> {
    const [board] = await db.select().from(boards).where(eq(boards.id, id));
    return board || undefined;
  }

  async getBoardsByGame(gameId: string): Promise<Board[]> {
    return await db
      .select()
      .from(boards)
      .where(eq(boards.gameId, gameId))
      .orderBy(boards.boardNumber);
  }

  async createBoard(insertBoard: InsertBoard): Promise<Board> {
    const [board] = await db.insert(boards).values(insertBoard).returning();
    return board;
  }

  async updateBoard(id: string, updates: Partial<Board>): Promise<Board> {
    const [board] = await db
      .update(boards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(boards.id, id))
      .returning();
    return board;
  }

  // Event Deals
  async getEventDeal(id: string): Promise<EventDeal | undefined> {
    const [eventDeal] = await db.select().from(eventDeals).where(eq(eventDeals.id, id));
    return eventDeal || undefined;
  }

  async getEventDealsByEvent(eventId: string): Promise<EventDeal[]> {
    return await db
      .select()
      .from(eventDeals)
      .where(eq(eventDeals.eventId, eventId))
      .orderBy(eventDeals.boardNumber);
  }

  async createEventDeal(insertEventDeal: InsertEventDeal): Promise<EventDeal> {
    const [eventDeal] = await db.insert(eventDeals).values(insertEventDeal).returning();
    return eventDeal;
  }

  async updateEventDeal(id: string, updates: Partial<EventDeal>): Promise<EventDeal> {
    const [eventDeal] = await db
      .update(eventDeals)
      .set(updates)
      .where(eq(eventDeals.id, id))
      .returning();
    return eventDeal;
  }

  // Game Participants
  async getGameParticipants(gameId: string): Promise<GameParticipant[]> {
    return await db
      .select()
      .from(gameParticipants)
      .where(eq(gameParticipants.gameId, gameId))
      .orderBy(gameParticipants.createdAt);
  }

  async createGameParticipant(insertParticipant: InsertGameParticipant): Promise<GameParticipant> {
    const [participant] = await db.insert(gameParticipants).values(insertParticipant).returning();
    return participant;
  }

  async updateGameParticipant(id: string, updates: Partial<GameParticipant>): Promise<GameParticipant> {
    const [participant] = await db
      .update(gameParticipants)
      .set(updates)
      .where(eq(gameParticipants.id, id))
      .returning();
    return participant;
  }

  // Comments
  async getCommentsByBoard(boardId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.boardId, boardId))
      .orderBy(comments.createdAt);
  }

  async getCommentsByEventDeal(eventDealId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.eventDealId, eventDealId))
      .orderBy(comments.createdAt);
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async updateComment(id: string, updates: Partial<Comment>): Promise<Comment> {
    const [comment] = await db
      .update(comments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return comment;
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Partnerships
  async getPartnershipsByUser(userId: string): Promise<Partnership[]> {
    return await db
      .select()
      .from(partnerships)
      .where(
        and(
          or(eq(partnerships.player1Id, userId), eq(partnerships.player2Id, userId)),
          eq(partnerships.status, "active")
        )
      )
      .orderBy(desc(partnerships.createdAt));
  }

  async createPartnership(insertPartnership: InsertPartnership): Promise<Partnership> {
    const [partnership] = await db.insert(partnerships).values(insertPartnership).returning();
    return partnership;
  }

  async updatePartnership(id: string, updates: Partial<Partnership>): Promise<Partnership> {
    const [partnership] = await db
      .update(partnerships)
      .set(updates)
      .where(eq(partnerships.id, id))
      .returning();
    return partnership;
  }

  // Events
  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEvents(limit = 20): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .orderBy(desc(events.eventDate))
      .limit(limit);
  }

  async searchEvents(query: string, clubName?: string): Promise<Event[]> {
    if (clubName) {
      return await db
        .select()
        .from(events)
        .where(
          and(
            ilike(events.name, `%${query}%`),
            ilike(events.clubName, `%${clubName}%`)
          )
        )
        .orderBy(desc(events.eventDate));
    } else {
      return await db
        .select()
        .from(events)
        .where(ilike(events.name, `%${query}%`))
        .orderBy(desc(events.eventDate));
    }
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async getEventsByClub(clubId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.clubId, clubId))
      .orderBy(desc(events.eventDate));
  }

  // Event Results & Standings
  async getEventResults(eventId: string): Promise<EventResult[]> {
    return await db
      .select()
      .from(eventResults)
      .where(eq(eventResults.eventId, eventId))
      .orderBy(eventResults.boardNumber);
  }

  async createEventResult(insertResult: InsertEventResult): Promise<EventResult> {
    const [result] = await db.insert(eventResults).values(insertResult).returning();
    return result;
  }

  async getEventStandings(eventId: string): Promise<EventStanding[]> {
    return await db
      .select()
      .from(eventStandings)
      .where(eq(eventStandings.eventId, eventId))
      .orderBy(eventStandings.position);
  }

  async updateEventStandings(eventId: string, standings: InsertEventStanding[]): Promise<EventStanding[]> {
    // Delete existing standings for this event
    await db.delete(eventStandings).where(eq(eventStandings.eventId, eventId));
    
    // Insert new standings
    if (standings.length > 0) {
      return await db.insert(eventStandings).values(standings).returning();
    }
    return [];
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreference[]> {
    return await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .orderBy(userPreferences.preferenceKey);
  }

  async getUserPreference(userId: string, key: string): Promise<UserPreference | undefined> {
    const [preference] = await db
      .select()
      .from(userPreferences)
      .where(
        and(
          eq(userPreferences.userId, userId),
          eq(userPreferences.preferenceKey, key)
        )
      );
    return preference || undefined;
  }

  async setUserPreference(userId: string, key: string, value: any): Promise<UserPreference> {
    // Try to update existing preference first
    const [existing] = await db
      .update(userPreferences)
      .set({
        preferenceValue: value,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userPreferences.userId, userId),
          eq(userPreferences.preferenceKey, key)
        )
      )
      .returning();

    if (existing) {
      return existing;
    }

    // If no existing preference, create new one
    const [preference] = await db
      .insert(userPreferences)
      .values({
        userId,
        preferenceKey: key,
        preferenceValue: value
      })
      .returning();
    return preference;
  }

  // Feature Flags
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    return await db
      .select()
      .from(featureFlags)
      .orderBy(featureFlags.flagName);
  }

  async getFeatureFlag(flagName: string): Promise<FeatureFlag | undefined> {
    const [flag] = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.flagName, flagName));
    return flag || undefined;
  }

  async isFeatureEnabled(flagName: string, userId?: string): Promise<boolean> {
    const flag = await this.getFeatureFlag(flagName);
    if (!flag || !flag.isEnabled) {
      return false;
    }

    // If no user targeting, it's enabled for everyone
    if (!flag.targetUsers?.length && !flag.targetUserTypes?.length) {
      return true;
    }

    // Check user-specific targeting
    if (userId && flag.targetUsers?.includes(userId)) {
      return true;
    }

    // For user type targeting, would need to check user's type
    // This could be enhanced to check user types if needed
    return false;
  }

  // Admin methods
  async getAllUsers(search?: string, userTypeFilter?: string, limit = 50): Promise<User[]> {
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.displayName, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )
      );
    }
    
    if (userTypeFilter) {
      conditions.push(eq(users.userTypeId, userTypeFilter));
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(users)
        .where(and(...conditions))
        .orderBy(desc(users.createdAt))
        .limit(limit);
    } else {
      return await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit);
    }
  }

  async getUsersCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return result.count;
  }

  async getDistinctClubNames(): Promise<string[]> {
    const results = await db
      .selectDistinct({ clubName: events.clubName })
      .from(events)
      .where(and(isNotNull(events.clubName), ne(events.clubName, '')))
      .orderBy(events.clubName);
    
    return results.map(r => r.clubName).filter((name): name is string => name !== null);
  }

  async deactivateUser(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async activateUser(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
