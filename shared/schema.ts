import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, primaryKey, date, decimal, char, pgEnum, unique, check } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum definitions from PRD
export const gameTypeEnum = pgEnum("game_type", ["USER", "CLUB"]);
export const visibilityTypeEnum = pgEnum("visibility_type", ["private", "link", "public"]);
export const eventStatusEnum = pgEnum("event_status", ["draft", "published", "closed", "archived"]);
export const eventKindEnum = pgEnum("event_kind", ["club_session", "practice_set", "casual_play", "tournament", "teaching"]);
export const registrationTypeEnum = pgEnum("registration_type", ["formal_pairs", "open_registration", "invite_only"]);
export const pairSideTypeEnum = pgEnum("pair_side_type", ["NS", "EW", "Unknown"]);
export const gameRoleEnum = pgEnum("game_role", ["owner", "player", "teacher", "viewer"]);
export const seatTypeEnum = pgEnum("seat_type", ["N", "E", "S", "W"]);
export const commentTypeEnum = pgEnum("comment_type", ["analysis", "question", "teaching", "general"]);

// User types reference table as specified in PRD
export const userTypes = pgTable("user_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Club management table from PRD
export const clubs = pgTable("clubs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  country: text("country").notNull(),
  state: text("state").notNull(),
  city: text("city"),
  website: text("website"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Club membership and favorites from PRD
export const favouriteClubs = pgTable("favourite_clubs", {
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  clubId: varchar("club_id").references(() => clubs.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.clubId] }),
}));

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  homeClubId: varchar("home_club_id").references(() => clubs.id),
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
  ownerId: varchar("owner_id").references(() => users.id), // PRD field for game ownership
  visibility: visibilityTypeEnum("visibility").default("private"),
  eventId: varchar("event_id").references(() => events.id),
  gameDate: timestamp("game_date").notNull(),
  clubName: text("club_name"),
  pbnData: jsonb("pbn_data"), // Parsed PBN file data
  totalBoards: integer("total_boards").notNull().default(0),
  
  // PRD fields
  type: gameTypeEnum("type").default("USER"),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  sessionNotes: text("session_notes"),
  completedBoards: integer("completed_boards").default(0),
  pairNumbers: text("pair_numbers").array(),
  sessionMetadata: jsonb("session_metadata"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Enhanced boards supporting both shared event data and standalone storage
export const boards = pgTable("boards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").references(() => games.id).notNull(),
  boardNumber: integer("board_number").notNull(),
  
  // Link to shared event deal data
  eventDealId: varchar("event_deal_id").references(() => eventDeals.id),
  
  // Standalone deal data (when not linked to event) - keep existing structure
  dealer: text("dealer"), // N, E, S, W - now nullable for event-linked boards
  vulnerability: text("vulnerability"), // None, NS, EW, Both - now nullable for event-linked boards
  hands: jsonb("hands"), // { N: { S: "AKQ", H: "432", D: "765", C: "898" }, ... } - keep for backward compatibility
  
  // Individual hand columns for event compatibility
  northHand: text("north_hand"),
  eastHand: text("east_hand"),
  southHand: text("south_hand"),
  westHand: text("west_hand"),
  optimumInfo: jsonb("optimum_info"),
  
  // User-entered data (always game-specific)
  biddingSequence: jsonb("bidding_sequence"), // Array of bids - keep existing name
  bidding: jsonb("bidding"), // Alternative bidding format
  contract: text("contract"), // e.g., "4H"
  declarer: text("declarer"), // N, E, S, W
  result: integer("result"), // Tricks taken
  tricksTaken: integer("tricks_taken"), // PRD field name
  leadCard: text("lead_card"), // e.g., "SQ"
  notes: text("notes"),
  
  // Performance and analysis from PRD
  score: integer("score"),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  matchpoints: decimal("matchpoints", { precision: 8, scale: 2 }),
  
  // User analysis and annotations from PRD
  biddingNotes: text("bidding_notes"),
  playNotes: text("play_notes"),
  learningPoints: text("learning_points"),
  
  // Board metadata from PRD
  isAnalyzed: boolean("is_analyzed").default(false),
  analysisQuality: integer("analysis_quality"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  boardNumberCheck: check("board_number_check", sql`${table.boardNumber} >= 1`),
  analysisQualityCheck: check("analysis_quality_check", sql`${table.analysisQuality} BETWEEN 1 AND 5`),
}));

// Enhanced multi-level comment system
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Comments target either specific boards or event deals
  boardId: varchar("board_id").references(() => boards.id, { onDelete: "cascade" }),
  eventDealId: varchar("event_deal_id").references(() => eventDeals.id, { onDelete: "cascade" }),
  
  // Keep backward compatibility
  authorId: varchar("author_id").references(() => users.id).notNull(), // backward compatibility
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // PRD field name
  
  content: text("content").notNull(), // backward compatibility
  body: text("body"), // PRD field name
  
  // Comment classification and behavior
  commentType: commentTypeEnum("comment_type").default("analysis"),
  visibility: visibilityTypeEnum("visibility").default("public"),
  isPrivate: boolean("is_private").notNull().default(false), // backward compatibility
  
  // Thread support for discussions
  parentCommentId: varchar("parent_comment_id"),
  threadDepth: integer("thread_depth").default(0),
  
  // Moderation and quality
  isFlagged: boolean("is_flagged").notNull().default(false),
  flaggedReason: text("flagged_reason"),
  flagCount: integer("flag_count").default(0),
  isDeleted: boolean("is_deleted").notNull().default(false),
  
  // Learning and teaching support
  isEducational: boolean("is_educational").default(false),
  teachingLevel: text("teaching_level"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  threadDepthCheck: check("thread_depth_check", sql`${table.threadDepth} >= 0`),
  reasonableThreadDepth: check("reasonable_thread_depth", sql`${table.threadDepth} <= 10`),
  teachingLevelCheck: check("teaching_level_check", sql`${table.teachingLevel} IN ('beginner', 'intermediate', 'advanced')`),
}));

// Partnership address book for quick partner selection
export const partnerships = pgTable("partnerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Keep backward compatibility
  player1Id: varchar("player1_id").references(() => users.id).notNull(),
  player2Id: varchar("player2_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("active"), // active, inactive, pending
  gamesCount: integer("games_count").notNull().default(0),
  
  // PRD fields
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  partnerUserId: varchar("partner_user_id").references(() => users.id, { onDelete: "cascade" }),
  partnershipName: text("partnership_name"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  noSelfPartnership: check("no_self_partnership", sql`${table.userId} != ${table.partnerUserId}`),
}));

// Enhanced events with flexible registration and post-game support
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").references(() => clubs.id),
  name: text("name").notNull(),
  description: text("description"),
  date: date("date"),
  kind: eventKindEnum("kind").notNull().default("club_session"),
  boardCount: integer("board_count"),
  pbnRaw: text("pbn_raw"),
  visibility: visibilityTypeEnum("visibility").notNull().default("public"),
  status: eventStatusEnum("status").notNull().default("draft"),
  
  // Flexible registration and participation
  registrationType: registrationTypeEnum("registration_type").notNull().default("open_registration"),
  movementType: text("movement_type"),
  sessionType: text("session_type"),
  entryDeadline: timestamp("entry_deadline"),
  maxPairs: integer("max_pairs"),
  
  // Event behavior and features
  enableComparativeScoring: boolean("enable_comparative_scoring").default(true),
  allowAnonymousGames: boolean("allow_anonymous_games").default(true),
  enableEventDiscussions: boolean("enable_event_discussions").default(true),
  autoPublishResults: boolean("auto_publish_results").default(false),
  
  // Post-game creation support
  createdAfterGame: boolean("created_after_game").default(false),
  gameCompletionDate: date("game_completion_date"),
  
  // Backward compatibility fields
  clubName: text("club_name"), // Keep for backward compatibility
  eventDate: timestamp("event_date"), // Keep for backward compatibility
  totalBoards: integer("total_boards"), // Keep for backward compatibility
  eventType: text("event_type"), // Keep for backward compatibility
  pbnFileUrl: text("pbn_file_url"), // Keep for backward compatibility
  createdBy: varchar("created_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  boardCountCheck: check("board_count_check", sql`${table.boardCount} >= 1`),
}));

// Canonical deal data shared across all event games
export const eventDeals = pgTable("event_deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  boardNumber: integer("board_number").notNull(),
  dealer: char("dealer", { length: 1 }),
  vulnerability: text("vulnerability"),
  northHand: text("north_hand").notNull(),
  eastHand: text("east_hand").notNull(),
  southHand: text("south_hand").notNull(),
  westHand: text("west_hand").notNull(),
  
  // Optimal play analysis from PBN
  optimumInfo: jsonb("optimum_info"),
  parContract: text("par_contract"),
  parScore: integer("par_score"),
  
  // Computed analysis (cached for performance)
  handAnalysis: jsonb("hand_analysis"),
  
  // Deal quality and educational value
  dealNotes: text("deal_notes"),
  educationalTags: text("educational_tags").array(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  boardNumberCheck: check("board_number_check", sql`${table.boardNumber} >= 1`),
  dealerCheck: check("dealer_check", sql`${table.dealer} IN ('N','E','S','W')`),
  uniqueEventBoard: unique().on(table.eventId, table.boardNumber),
}));

// Flexible participation model supporting various roles and identification
export const gameParticipants = pgTable("game_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  displayName: text("display_name"),
  role: gameRoleEnum("role").notNull().default("player"),
  seat: seatTypeEnum("seat"),
  pairSide: pairSideTypeEnum("pair_side").default("Unknown"),
  inviteEmail: text("invite_email"),
  isEditor: boolean("is_editor").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  participantIdentity: check("participant_identity", sql`
    ${table.userId} IS NOT NULL OR ${table.displayName} IS NOT NULL OR ${table.inviteEmail} IS NOT NULL
  `),
}));

// Comparative analysis and result tracking
export const eventResults = pgTable("event_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  boardNumber: integer("board_number").notNull(),
  
  // Flexible participant identification
  pairNumber: integer("pair_number"),
  gameId: varchar("game_id").references(() => games.id),
  sessionIdentifier: text("session_identifier"),
  direction: char("direction", { length: 2 }),
  
  // Result data
  contract: text("contract"),
  declarer: char("declarer", { length: 1 }),
  leadCard: text("lead_card"),
  tricksTaken: integer("tricks_taken"),
  score: integer("score"),
  
  // Metadata and privacy
  submittedBy: varchar("submitted_by").references(() => users.id),
  isAnonymous: boolean("is_anonymous").default(false),
  resultConfidence: integer("result_confidence"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  resultConfidenceCheck: check("result_confidence_check", sql`${table.resultConfidence} BETWEEN 1 AND 5`),
  resultIdentification: check("result_identification", sql`
    ${table.pairNumber} IS NOT NULL OR ${table.gameId} IS NOT NULL OR ${table.sessionIdentifier} IS NOT NULL
  `),
}));

// Event standings and leaderboards
export const eventStandings = pgTable("event_standings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  pairNumber: integer("pair_number"),
  gameId: varchar("game_id").references(() => games.id),
  sessionIdentifier: text("session_identifier"),
  direction: char("direction", { length: 2 }),
  
  // Performance metrics
  totalMatchpoints: decimal("total_matchpoints", { precision: 8, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  position: integer("position"),
  boardsPlayed: integer("boards_played").default(0),
  gamesLinked: integer("games_linked").default(0),
  
  // Statistical analysis
  averageScore: decimal("average_score", { precision: 8, scale: 2 }),
  boardsAboveAverage: integer("boards_above_average").default(0),
  bestResultBoard: integer("best_result_board"),
  worstResultBoard: integer("worst_result_board"),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User preferences and settings
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  preferenceKey: text("preference_key").notNull(),
  preferenceValue: jsonb("preference_value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserPreference: unique().on(table.userId, table.preferenceKey),
}));

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: varchar("resource_id"),
  details: jsonb("details").default(sql`'{}'`),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Feature flags for controlled rollouts
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flagName: text("flag_name").unique().notNull(),
  name: text("name").unique(), // backward compatibility
  description: text("description"),
  isEnabled: boolean("is_enabled").default(false),
  targetUsers: varchar("target_users").array(),
  targetUserTypes: text("target_user_types").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const userTypesRelations = relations(userTypes, ({ many }) => ({
  users: many(users),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  events: many(events),
  users: many(users), // via homeClubId
  favouriteClubs: many(favouriteClubs),
}));

export const favouriteClubsRelations = relations(favouriteClubs, ({ one }) => ({
  user: one(users, {
    fields: [favouriteClubs.userId],
    references: [users.id],
  }),
  club: one(clubs, {
    fields: [favouriteClubs.clubId],
    references: [clubs.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  userType: one(userTypes, {
    fields: [users.userTypeId],
    references: [userTypes.id],
  }),
  homeClub: one(clubs, {
    fields: [users.homeClubId],
    references: [clubs.id],
  }),
  createdGames: many(games, { relationName: "createdGames" }),
  partnerGames: many(games, { relationName: "partnerGames" }),
  ownedGames: many(games, { relationName: "ownedGames" }),
  gameParticipants: many(gameParticipants),
  comments: many(comments),
  partnerships1: many(partnerships, { relationName: "player1Partnerships" }),
  partnerships2: many(partnerships, { relationName: "player2Partnerships" }),
  userPartnerships: many(partnerships, { relationName: "userPartnerships" }),
  partnerOf: many(partnerships, { relationName: "partnerPartnerships" }),
  createdEvents: many(events),
  favouriteClubs: many(favouriteClubs),
  userPreferences: many(userPreferences),
  auditLogs: many(auditLogs),
  eventResults: many(eventResults),
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
  owner: one(users, {
    fields: [games.ownerId],
    references: [users.id],
    relationName: "ownedGames",
  }),
  event: one(events, {
    fields: [games.eventId],
    references: [events.id],
  }),
  boards: many(boards),
  gameParticipants: many(gameParticipants),
  eventResults: many(eventResults),
  eventStandings: many(eventStandings),
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
  game: one(games, {
    fields: [boards.gameId],
    references: [games.id],
  }),
  eventDeal: one(eventDeals, {
    fields: [boards.eventDealId],
    references: [eventDeals.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  board: one(boards, {
    fields: [comments.boardId],
    references: [boards.id],
  }),
  eventDeal: one(eventDeals, {
    fields: [comments.eventDealId],
    references: [eventDeals.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parentComment: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
  }),
  replies: many(comments, { relationName: "commentReplies" }),
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
  user: one(users, {
    fields: [partnerships.userId],
    references: [users.id],
    relationName: "userPartnerships",
  }),
  partnerUser: one(users, {
    fields: [partnerships.partnerUserId],
    references: [users.id],
    relationName: "partnerPartnerships",
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  club: one(clubs, {
    fields: [events.clubId],
    references: [clubs.id],
  }),
  games: many(games),
  eventDeals: many(eventDeals),
  eventResults: many(eventResults),
  eventStandings: many(eventStandings),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const eventDealsRelations = relations(eventDeals, ({ one, many }) => ({
  event: one(events, {
    fields: [eventDeals.eventId],
    references: [events.id],
  }),
  boards: many(boards),
  comments: many(comments),
}));

export const gameParticipantsRelations = relations(gameParticipants, ({ one }) => ({
  game: one(games, {
    fields: [gameParticipants.gameId],
    references: [games.id],
  }),
  user: one(users, {
    fields: [gameParticipants.userId],
    references: [users.id],
  }),
}));

export const eventResultsRelations = relations(eventResults, ({ one }) => ({
  event: one(events, {
    fields: [eventResults.eventId],
    references: [events.id],
  }),
  game: one(games, {
    fields: [eventResults.gameId],
    references: [games.id],
  }),
  submitter: one(users, {
    fields: [eventResults.submittedBy],
    references: [users.id],
  }),
}));

export const eventStandingsRelations = relations(eventStandings, ({ one }) => ({
  event: one(events, {
    fields: [eventStandings.eventId],
    references: [events.id],
  }),
  game: one(games, {
    fields: [eventStandings.gameId],
    references: [games.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
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
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// New table insert schemas
export const insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFavouriteClubSchema = createInsertSchema(favouriteClubs).omit({
  createdAt: true,
});

export const insertEventDealSchema = createInsertSchema(eventDeals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameParticipantSchema = createInsertSchema(gameParticipants).omit({
  id: true,
  createdAt: true,
});

export const insertEventResultSchema = createInsertSchema(eventResults).omit({
  id: true,
  createdAt: true,
});

export const insertEventStandingSchema = createInsertSchema(eventStandings).omit({
  id: true,
  updatedAt: true,
});

export const insertUserPreferenceSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UserType = typeof userTypes.$inferSelect;
export type InsertUserType = z.infer<typeof insertUserTypeSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Club = typeof clubs.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type FavouriteClub = typeof favouriteClubs.$inferSelect;
export type InsertFavouriteClub = z.infer<typeof insertFavouriteClubSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Board = typeof boards.$inferSelect;
export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type EventDeal = typeof eventDeals.$inferSelect;
export type InsertEventDeal = z.infer<typeof insertEventDealSchema>;
export type GameParticipant = typeof gameParticipants.$inferSelect;
export type InsertGameParticipant = z.infer<typeof insertGameParticipantSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Partnership = typeof partnerships.$inferSelect;
export type InsertPartnership = z.infer<typeof insertPartnershipSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventResult = typeof eventResults.$inferSelect;
export type InsertEventResult = z.infer<typeof insertEventResultSchema>;
export type EventStanding = typeof eventStandings.$inferSelect;
export type InsertEventStanding = z.infer<typeof insertEventStandingSchema>;
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;
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