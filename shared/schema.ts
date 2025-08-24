import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  partnerId: varchar("partner_id").references(() => users.id),
  visibility: text("visibility").notNull().default("public"), // public, private, club
  eventId: varchar("event_id").references(() => events.id),
  pbnData: jsonb("pbn_data"), // Parsed PBN file data
  totalBoards: integer("total_boards").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const boards = pgTable("boards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").references(() => games.id).notNull(),
  boardNumber: integer("board_number").notNull(),
  dealer: text("dealer").notNull(), // N, E, S, W
  vulnerability: text("vulnerability").notNull(), // None, NS, EW, Both
  hands: jsonb("hands").notNull(), // { N: { S: "AKQ", H: "432", D: "765", C: "898" }, ... }
  biddingSequence: jsonb("bidding_sequence"), // Array of bids
  contract: text("contract"), // e.g., "4H"
  declarer: text("declarer"), // N, E, S, W
  result: integer("result"), // Tricks taken
  leadCard: text("lead_card"), // e.g., "SQ"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").references(() => boards.id).notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const partnerships = pgTable("partnerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  player1Id: varchar("player1_id").references(() => users.id).notNull(),
  player2Id: varchar("player2_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("active"), // active, inactive, pending
  gamesCount: integer("games_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  clubName: text("club_name").notNull(),
  eventDate: timestamp("event_date").notNull(),
  totalBoards: integer("total_boards").notNull(),
  eventType: text("event_type").notNull(), // tournament, casual, practice
  status: text("status").notNull().default("upcoming"), // upcoming, active, completed
  pbnFileUrl: text("pbn_file_url"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdGames: many(games, { relationName: "createdGames" }),
  partnerGames: many(games, { relationName: "partnerGames" }),
  comments: many(comments),
  partnerships1: many(partnerships, { relationName: "player1Partnerships" }),
  partnerships2: many(partnerships, { relationName: "player2Partnerships" }),
  createdEvents: many(events),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  creator: one(users, {
    fields: [games.creatorId],
    references: [users.id],
    relationName: "createdGames",
  }),
  partner: one(users, {
    fields: [games.partnerId],
    references: [users.id],
    relationName: "partnerGames",
  }),
  event: one(events, {
    fields: [games.eventId],
    references: [events.id],
  }),
  boards: many(boards),
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
  game: one(games, {
    fields: [boards.gameId],
    references: [games.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  board: one(boards, {
    fields: [comments.boardId],
    references: [boards.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const partnershipsRelations = relations(partnerships, ({ one }) => ({
  player1: one(users, {
    fields: [partnerships.player1Id],
    references: [users.id],
    relationName: "player1Partnerships",
  }),
  player2: one(users, {
    fields: [partnerships.player2Id],
    references: [users.id],
    relationName: "player2Partnerships",
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  games: many(games),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBoardSchema = createInsertSchema(boards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnershipSchema = createInsertSchema(partnerships).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Board = typeof boards.$inferSelect;
export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Partnership = typeof partnerships.$inferSelect;
export type InsertPartnership = z.infer<typeof insertPartnershipSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Bridge-specific types
export type Suit = "S" | "H" | "D" | "C";
export type Direction = "N" | "E" | "S" | "W";
export type Vulnerability = "None" | "NS" | "EW" | "Both";

export interface BridgeHand {
  S: string;
  H: string;
  D: string;
  C: string;
}

export interface BridgeHands {
  N: BridgeHand;
  E: BridgeHand;
  S: BridgeHand;
  W: BridgeHand;
}

export interface Bid {
  level?: number;
  suit?: Suit | "NT";
  call: "BID" | "PASS" | "DOUBLE" | "REDOUBLE";
  player: Direction;
}
