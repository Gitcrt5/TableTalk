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

// Bridge clubs/locations table
export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  state: varchar("state"),
  country: varchar("country"), 
  website: varchar("website"),
  email: varchar("email"),
  // Club status for admin management
  isActive: boolean("is_active").default(true), // false = inactive (hidden from lists)
  // Metadata
  createdBy: varchar("created_by").notNull(), // User who added this club
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table for authentication
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
  // Feature flags for gradual rollout
  featureFlags: jsonb("feature_flags").default({}),
  // Profile completion tracking for multi-step registration
  profileCompletionStep: integer("profile_completion_step").default(0), // 0-4, tracks registration progress
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User favorite clubs (max 5)
export const userFavoriteClubs = pgTable("user_favorite_clubs", {
  userId: varchar("user_id").notNull(),
  clubId: integer("club_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Unified games table supporting both regular PBN games and live games
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // User-entered title
  tournament: text("tournament"),
  round: text("round"),
  date: text("date"), // User-entered date (for both regular and live games)
  location: text("location"), // User-entered location
  clubId: integer("club_id"), // Reference to clubs table
  event: text("event"), // Type of event (e.g., "Club Championship", "Pairs Game")
  
  // Game type and status
  gameType: varchar("game_type").notNull().default("regular"), // "regular" or "live"
  status: varchar("status").default("completed"), // "active", "completed" (active only for live games)
  
  // Creator and partnership information
  uploadedBy: text("uploaded_by").notNull(), // Game creator/uploader
  partnerId: varchar("partner_id"), // Partner for live games
  visibility: varchar("visibility").default("public"), // public, private
  
  // PBN-related fields (for both regular uploads and live game attachments)
  pbnEvent: text("pbn_event"), // Event from PBN file
  pbnSite: text("pbn_site"), // Site from PBN file  
  pbnDate: text("pbn_date"), // Date from PBN file
  filename: text("filename"), // Original PBN filename
  pbnContent: text("pbn_content"), // PBN file content (required for regular, optional for live)
  pbnUploadedAt: timestamp("pbn_uploaded_at"), // When PBN was attached
  
  // Timestamps
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Unified hands table supporting both regular PBN hands and live game hands
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
  
  // Live game specific fields (optional for regular games)
  biddingSequence: jsonb("bidding_sequence").$type<string[]>(), // Live bidding entry
  openingLead: varchar("opening_lead"), // e.g., "SK"
  tricksTaken: integer("tricks_taken"),
  scoreMp: varchar("score_mp"), // Matchpoint score
  scoreImp: varchar("score_imp"), // IMP score
  notes: text("notes"),
  
  // Result information
  result: text("result"), // Made, Down 1, etc.
  
  // Timestamps
  lastModified: timestamp("last_modified").defaultNow(),
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

// Game access control (for private games)
export const gameAccess = pgTable("game_access", {
  gameId: integer("game_id").notNull(),
  userId: varchar("user_id").notNull(),
  accessType: varchar("access_type").default("view"), // view, edit
  grantedAt: timestamp("granted_at").defaultNow(),
});

// Insert schemas for unified system
export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  uploadedAt: true,
  createdAt: true,
  updatedAt: true,
  pbnUploadedAt: true,
});

export const insertGamePlayerSchema = createInsertSchema(gamePlayers).omit({
  id: true,
  addedAt: true,
});

export const insertHandSchema = createInsertSchema(hands).omit({
  id: true,
  lastModified: true,
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

export const insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameAccessSchema = createInsertSchema(gameAccess).omit({
  grantedAt: true,
});

export const insertUserFavoriteClubSchema = createInsertSchema(userFavoriteClubs).omit({
  createdAt: true,
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
});

export const insertGameParticipantSchema = createInsertSchema(gameParticipants).omit({
  id: true,
  createdAt: true,
});

// Types for unified system
export type Game = typeof games.$inferSelect & {
  uploaderName?: string;
  players?: User[];
  // Computed fields for game list display
  isActive?: boolean;
  hasPbn?: boolean;
  commentCount?: number;
  hasBidding?: boolean;
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
export type Club = typeof clubs.$inferSelect;
export type GameAccess = typeof gameAccess.$inferSelect;
export type UserFavoriteClub = typeof userFavoriteClubs.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type GameParticipant = typeof gameParticipants.$inferSelect;

// Insert types
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertGamePlayer = z.infer<typeof insertGamePlayerSchema>;
export type InsertHand = z.infer<typeof insertHandSchema>;
export type InsertUserBidding = z.infer<typeof insertUserBiddingSchema>;
export type InsertPartnershipBidding = z.infer<typeof insertPartnershipBiddingSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type InsertGameAccess = z.infer<typeof insertGameAccessSchema>;
export type InsertUserFavoriteClub = z.infer<typeof insertUserFavoriteClubSchema>;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type InsertGameParticipant = z.infer<typeof insertGameParticipantSchema>;

// User types for authentication
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect & {
  featureFlags?: {
    liveGames?: boolean;
    [key: string]: any;
  };
};