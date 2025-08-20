import {
  users,
  games,
  boards,
  comments,
  partnerships,
  events,
  type User,
  type Game,
  type Board,
  type Comment,
  type Partnership,
  type Event,
  type InsertUser,
  type InsertGame,
  type InsertBoard,
  type InsertComment,
  type InsertPartnership,
  type InsertEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

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

  // Comments
  getCommentsByBoard(boardId: string): Promise<Comment[]>;
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
  searchEvents(query: string, clubName?: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event>;
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
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
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

  // Comments
  async getCommentsByBoard(boardId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.boardId, boardId))
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
}

export const storage = new DatabaseStorage();
