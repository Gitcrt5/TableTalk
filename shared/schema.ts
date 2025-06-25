import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  tournament: text("tournament"),
  round: text("round"),
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  pbnContent: text("pbn_content").notNull(),
});

export const hands = pgTable("hands", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  boardNumber: integer("board_number").notNull(),
  dealer: text("dealer").notNull(), // N, E, S, W
  vulnerability: text("vulnerability").notNull(), // None, NS, EW, Both
  northHand: text("north_hand").notNull(),
  southHand: text("south_hand").notNull(),
  eastHand: text("east_hand").notNull(),
  westHand: text("west_hand").notNull(),
  actualBidding: jsonb("actual_bidding").$type<string[]>().notNull(),
  finalContract: text("final_contract"),
  declarer: text("declarer"), // N, E, S, W
  result: text("result"), // Made, Down 1, etc.
});

export const userBidding = pgTable("user_bidding", {
  id: serial("id").primaryKey(),
  handId: integer("hand_id").notNull(),
  userId: text("user_id").notNull(),
  bidding: jsonb("bidding").$type<string[]>().notNull(),
  accuracy: integer("accuracy"), // percentage match with actual
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  handId: integer("hand_id").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  userLevel: text("user_level").notNull().default("Beginner"), // Beginner, Intermediate, Advanced, Expert
  content: text("content").notNull(),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  uploadedAt: true,
});

export const insertHandSchema = createInsertSchema(hands).omit({
  id: true,
}).extend({
  actualBidding: z.array(z.string()).default([]),
});

export const insertUserBiddingSchema = createInsertSchema(userBidding).omit({
  id: true,
  completedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  likes: true,
  createdAt: true,
});

// Types
export type Game = typeof games.$inferSelect;
export type Hand = typeof hands.$inferSelect;
export type UserBidding = typeof userBidding.$inferSelect;
export type Comment = typeof comments.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertHand = z.infer<typeof insertHandSchema>;
export type InsertUserBidding = z.infer<typeof insertUserBiddingSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
