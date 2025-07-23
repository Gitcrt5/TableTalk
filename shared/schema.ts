import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for authentication
// Supports both Replit OAuth and email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  displayName: varchar("display_name"),
  profileImageUrl: varchar("profile_image_url"),
  // For email/password auth (optional - only set for non-OAuth users)
  password: varchar("password"),
  // Auth type to distinguish between Replit OAuth and local auth
  authType: varchar("auth_type").notNull().default("replit"), // "replit" or "local"
  // User type for both permissions and data management
  userType: varchar("user_type").notNull().default("player"), // "admin", "player", "test", "moderator", "teacher"
  // Home club for default location
  homeClubId: integer("home_club_id"),
  // Email verification for future email alerts
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  // Password reset functionality
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  // User status for soft deletion
  isActive: boolean("is_active").default(true),
  deactivatedAt: timestamp("deactivated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bridge clubs/locations table
export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  location: text("location"), // City, state/province, country
  address: text("address"),
  website: varchar("website"),
  phone: varchar("phone"),
  email: varchar("email"),
  // Verification status
  isVerified: boolean("is_verified").default(false),
  verifiedBy: varchar("verified_by"), // Admin user ID who verified
  verifiedAt: timestamp("verified_at"),
  // Club management
  managedBy: varchar("managed_by"), // User ID of club manager/account
  // Metadata
  createdBy: varchar("created_by").notNull(), // User who added this club
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // User-entered title (user.title)
  tournament: text("tournament"),
  round: text("round"),
  date: text("date"), // User-entered date (user.date)
  location: text("location"), // User-entered location (user.location)
  clubId: integer("club_id"), // Reference to clubs table if location matches a club
  event: text("event"), // Type of event (e.g., "Club Championship", "Pairs Game")
  // PBN-extracted fields
  pbnEvent: text("pbn_event"), // Event from PBN file (pbn.event)
  pbnSite: text("pbn_site"), // Site from PBN file (pbn.site)  
  pbnDate: text("pbn_date"), // Date from PBN file (pbn.date)
  filename: text("filename"), // Original filename
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  pbnContent: text("pbn_content").notNull(),
});

// Game players table to track who played in each game
export const gamePlayers = pgTable("game_players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  userId: text("user_id").notNull(),
  partnerId: text("partner_id"), // Partner who played with this user
  position: text("position"), // "North", "South", "East", "West" or null if unknown
  addedBy: text("added_by").notNull(), // User who added this player (uploader)
  addedAt: timestamp("added_at").notNull().defaultNow(),
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
  // Removed actualBidding - now handled by partnershipBidding table
  // Removed finalContract and declarer - now calculated from partnershipBidding
  result: text("result"), // Made, Down 1, etc.
});

// Partnership-specific bidding table
export const partnershipBidding = pgTable("partnership_bidding", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  handId: integer("hand_id").notNull(),
  userId: text("user_id").notNull(), // Primary player in partnership
  partnerId: text("partner_id"), // Partner (nullable for solo bidding)
  biddingSequence: jsonb("bidding_sequence").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

export const insertGamePlayerSchema = createInsertSchema(gamePlayers).omit({
  id: true,
  addedAt: true,
});

export const insertHandSchema = createInsertSchema(hands).omit({
  id: true,
});

export const insertPartnershipBiddingSchema = createInsertSchema(partnershipBidding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  biddingSequence: z.array(z.string()).default([]),
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
export type Game = typeof games.$inferSelect & {
  uploaderName?: string;
  players?: User[];
};
export type GamePlayer = typeof gamePlayers.$inferSelect;
export type Hand = typeof hands.$inferSelect & {
  commentCount?: number;
  hasBidding?: boolean;
  // Partnership-specific contract fields (only populated for players who played the game)
  finalContract?: string;
  declarer?: string;
  partnershipBidding?: PartnershipBidding[];
};
export type UserBidding = typeof userBidding.$inferSelect;
export type PartnershipBidding = typeof partnershipBidding.$inferSelect;
export type Comment = typeof comments.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertGamePlayer = z.infer<typeof insertGamePlayerSchema>;
export type InsertHand = z.infer<typeof insertHandSchema>;
export type InsertUserBidding = z.infer<typeof insertUserBiddingSchema>;
export type InsertPartnershipBidding = z.infer<typeof insertPartnershipBiddingSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export const insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
});
export type InsertClub = z.infer<typeof insertClubSchema>;
export type Club = typeof clubs.$inferSelect;

// Partners table for user relationships
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(), // User who added the partner
  partnerId: varchar("partner_id").notNull(), // User being added as partner
  createdAt: timestamp("created_at").defaultNow(),
});

// Game participants table to track who played in each game
export const gameParticipants = pgTable("game_participants", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  userId: varchar("user_id").notNull(), // User who played
  partnerId: varchar("partner_id"), // Optional - their partner in this game
  position: varchar("position"), // Optional - North, South, East, West
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
});
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

export const insertGameParticipantSchema = createInsertSchema(gameParticipants).omit({
  id: true,
  createdAt: true,
});
export type InsertGameParticipant = z.infer<typeof insertGameParticipantSchema>;
export type GameParticipant = typeof gameParticipants.$inferSelect;

// User types for authentication
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
