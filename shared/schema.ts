import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User types reference table as specified in PRD
export const userTypes = pgTable("user_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  userTypeId: varchar("user_type_id").references(() => userTypes.id),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  preferences: jsonb("preferences").default(sql`'{}'`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: varchar("resource_id"),
  details: jsonb("details").default(sql`'{}'`),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  isEnabled: boolean("is_enabled").notNull().default(false),
  targetUserTypes: jsonb("target_user_types").default(sql`'[]'`), // Array of user type IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const userTypesRelations = relations(userTypes, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  userType: one(userTypes, {
    fields: [users.userTypeId],
    references: [userTypes.id],
  }),
  createdGames: many(games, { relationName: "createdGames" }),
  partnerGames: many(games, { relationName: "partnerGames" }),
  comments: many(comments),
  partnerships1: many(partnerships, { relationName: "player1Partnerships" }),
  partnerships2: many(partnerships, { relationName: "player2Partnerships" }),
  createdEvents: many(events),
  auditLogs: many(auditLogs),
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

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const featureFlagsRelations = relations(featureFlags, ({ many }) => ({
  // Feature flags don't have direct relations to other tables
  // but could be extended in the future
}));

// Insert schemas
export const insertUserTypeSchema = createInsertSchema(userTypes).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({
  id: true,
  createdAt: true,
});

// Types
export type UserType = typeof userTypes.$inferSelect;
export type InsertUserType = z.infer<typeof insertUserTypeSchema>;
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
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;

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
