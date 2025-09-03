import { z } from "zod";

// TypeScript interface definitions for Supabase tables

export interface User {
  id: string;
  email: string;
  firebaseUid: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  homeClubId?: string;
  userTypeId?: string;
  isActive: boolean;
  lastLogin?: string;
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UserType {
  id: string;
  code: string;
  label: string;
  description?: string;
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  country: string;
  state: string;
  city?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Game {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  partnerId?: string;
  ownerId?: string;
  visibility: 'private' | 'link' | 'public';
  eventId?: string;
  gameDate: string;
  clubName?: string;
  pbnData?: Record<string, any>;
  totalBoards: number;
  type: 'USER' | 'CLUB';
  isPublished: boolean;
  publishedAt?: string;
  sessionNotes?: string;
  completedBoards: number;
  pairNumbers?: string[];
  sessionMetadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  gameId: string;
  boardNumber: number;
  eventDealId?: string;
  dealer?: string;
  vulnerability?: string;
  hands?: Record<string, any>;
  northHand?: string;
  eastHand?: string;
  southHand?: string;
  westHand?: string;
  optimumInfo?: Record<string, any>;
  biddingSequence?: Record<string, any>;
  bidding?: Record<string, any>;
  contract?: string;
  declarer?: string;
  result?: number;
  tricksTaken?: number;
  leadCard?: string;
  notes?: string;
  analysisNotes?: string;
  score?: number;
  boardMetadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  clubId?: string;
  clubName?: string;
  organizerId?: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  kind: 'club_session' | 'practice_set' | 'casual_play' | 'tournament' | 'teaching';
  registrationType: 'formal_pairs' | 'open_registration' | 'invite_only';
  maxParticipants?: number;
  entryFee?: number;
  currency: string;
  location?: string;
  address?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  specialInstructions?: string;
  isPublished: boolean;
  publishedAt?: string;
  registrationDeadline?: string;
  cancellationDeadline?: string;
  refundPolicy?: string;
  totalBoards: number;
  scoringMethod: string;
  movementType?: string;
  sessionMetadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface EventDeal {
  id: string;
  eventId: string;
  boardNumber: number;
  dealer: 'N' | 'E' | 'S' | 'W';
  vulnerability: string;
  northHand: string;
  eastHand: string;
  southHand: string;
  westHand: string;
  optimumInfo?: Record<string, any>;
  analysisNotes?: string;
  difficultyRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameParticipant {
  id: string;
  gameId: string;
  userId: string;
  role: 'owner' | 'player' | 'teacher' | 'viewer';
  pairNumber?: string;
  seatPreference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Partnership {
  id: string;
  player1Id: string;
  player2Id: string;
  partnershipName?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  boardId?: string;
  eventDealId?: string;
  parentId?: string;
  content: string;
  type: 'analysis' | 'question' | 'teaching' | 'general';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FavouriteClub {
  userId: string;
  clubId: string;
  createdAt: string;
}

export interface UserPreference {
  id: string;
  userId: string;
  key: string;
  value: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  conditions?: Record<string, any>;
  rolloutPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface PlayerResult {
  id: string;
  gameId: string;
  userId: string;
  pairNumber?: string;
  side: 'NS' | 'EW' | 'Unknown';
  totalScore?: number;
  percentage?: number;
  rank?: number;
  boardsPlayed: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventResult {
  id: string;
  eventId: string;
  userId: string;
  pairNumber?: string;
  side: 'NS' | 'EW' | 'Unknown';
  totalScore?: number;
  percentage?: number;
  rank?: number;
  boardsPlayed: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  partnerId?: string;
  status: string;
  pairNumber?: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventStanding {
  id: string;
  eventId: string;
  pairNumber: string;
  player1Id: string;
  player2Id?: string;
  totalScore?: number;
  percentage?: number;
  rank?: number;
  boardsPlayed: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClubMembership {
  id: string;
  clubId: string;
  userId: string;
  membershipType: string;
  status: string;
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  memberNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Zod validation schemas for inserts
export const insertUserSchema = z.object({
  email: z.string().email(),
  firebaseUid: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  homeClubId: z.string().uuid().optional(),
  userTypeId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  lastLogin: z.string().optional(),
  preferences: z.record(z.any()).default({}),
});

export const insertUserTypeSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
});

export const insertClubSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  country: z.string().min(1),
  state: z.string().min(1),
  city: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const insertGameSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  creatorId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  visibility: z.enum(['private', 'link', 'public']).default('private'),
  eventId: z.string().uuid().optional(),
  gameDate: z.string(),
  clubName: z.string().optional(),
  pbnData: z.record(z.any()).optional(),
  totalBoards: z.number().default(0),
  type: z.enum(['USER', 'CLUB']).default('USER'),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().optional(),
  sessionNotes: z.string().optional(),
  completedBoards: z.number().default(0),
  pairNumbers: z.array(z.string()).optional(),
  sessionMetadata: z.record(z.any()).optional(),
});

export const insertBoardSchema = z.object({
  gameId: z.string().uuid(),
  boardNumber: z.number(),
  eventDealId: z.string().uuid().optional(),
  dealer: z.string().optional(),
  vulnerability: z.string().optional(),
  hands: z.record(z.any()).optional(),
  northHand: z.string().optional(),
  eastHand: z.string().optional(),
  southHand: z.string().optional(),
  westHand: z.string().optional(),
  optimumInfo: z.record(z.any()).optional(),
  biddingSequence: z.record(z.any()).optional(),
  bidding: z.record(z.any()).optional(),
  contract: z.string().optional(),
  declarer: z.string().optional(),
  result: z.number().optional(),
  tricksTaken: z.number().optional(),
  leadCard: z.string().optional(),
  notes: z.string().optional(),
  analysisNotes: z.string().optional(),
  score: z.number().optional(),
  boardMetadata: z.record(z.any()).optional(),
});

export const insertEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  eventDate: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  clubId: z.string().uuid().optional(),
  clubName: z.string().optional(),
  organizerId: z.string().uuid().optional(),
  status: z.enum(['draft', 'published', 'closed', 'archived']).default('draft'),
  kind: z.enum(['club_session', 'practice_set', 'casual_play', 'tournament', 'teaching']),
  registrationType: z.enum(['formal_pairs', 'open_registration', 'invite_only']).default('open_registration'),
  maxParticipants: z.number().optional(),
  entryFee: z.number().optional(),
  currency: z.string().default('USD'),
  location: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  specialInstructions: z.string().optional(),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().optional(),
  registrationDeadline: z.string().optional(),
  cancellationDeadline: z.string().optional(),
  refundPolicy: z.string().optional(),
  totalBoards: z.number().default(0),
  scoringMethod: z.string().default('matchpoints'),
  movementType: z.string().optional(),
  sessionMetadata: z.record(z.any()).optional(),
});

export const insertEventDealSchema = z.object({
  eventId: z.string().uuid(),
  boardNumber: z.number(),
  dealer: z.enum(['N', 'E', 'S', 'W']),
  vulnerability: z.string(),
  northHand: z.string(),
  eastHand: z.string(),
  southHand: z.string(),
  westHand: z.string(),
  optimumInfo: z.record(z.any()).optional(),
  analysisNotes: z.string().optional(),
  difficultyRating: z.number().min(1).max(5).optional(),
});

export const insertGameParticipantSchema = z.object({
  gameId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['owner', 'player', 'teacher', 'viewer']).default('player'),
  pairNumber: z.string().optional(),
  seatPreference: z.string().optional(),
  notes: z.string().optional(),
});

export const insertPartnershipSchema = z.object({
  player1Id: z.string().uuid(),
  player2Id: z.string().uuid(),
  partnershipName: z.string().optional(),
  status: z.string().default('active'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export const insertCommentSchema = z.object({
  userId: z.string().uuid(),
  boardId: z.string().uuid().optional(),
  eventDealId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  content: z.string().min(1),
  type: z.enum(['analysis', 'question', 'teaching', 'general']).default('general'),
  isDeleted: z.boolean().default(false),
});

export const insertFavouriteClubSchema = z.object({
  userId: z.string().uuid(),
  clubId: z.string().uuid(),
});

export const insertUserPreferenceSchema = z.object({
  userId: z.string().uuid(),
  key: z.string().min(1),
  value: z.record(z.any()),
});

export const insertFeatureFlagSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isEnabled: z.boolean().default(false),
  conditions: z.record(z.any()).optional(),
  rolloutPercentage: z.number().min(0).max(100).default(0),
});

export const insertAuditLogSchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.string().min(1),
  resourceType: z.string().min(1),
  resourceId: z.string().optional(),
  oldValues: z.record(z.any()).optional(),
  newValues: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export const insertPlayerResultSchema = z.object({
  gameId: z.string().uuid(),
  userId: z.string().uuid(),
  pairNumber: z.string().optional(),
  side: z.enum(['NS', 'EW', 'Unknown']).default('Unknown'),
  totalScore: z.number().optional(),
  percentage: z.number().optional(),
  rank: z.number().optional(),
  boardsPlayed: z.number().default(0),
});

export const insertEventResultSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  pairNumber: z.string().optional(),
  side: z.enum(['NS', 'EW', 'Unknown']).default('Unknown'),
  totalScore: z.number().optional(),
  percentage: z.number().optional(),
  rank: z.number().optional(),
  boardsPlayed: z.number().default(0),
});

export const insertEventRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  status: z.string().default('registered'),
  pairNumber: z.string().optional(),
  specialRequests: z.string().optional(),
});

export const insertEventStandingSchema = z.object({
  eventId: z.string().uuid(),
  pairNumber: z.string(),
  player1Id: z.string().uuid(),
  player2Id: z.string().uuid().optional(),
  totalScore: z.number().optional(),
  percentage: z.number().optional(),
  rank: z.number().optional(),
  boardsPlayed: z.number().default(0),
});

export const insertClubMembershipSchema = z.object({
  clubId: z.string().uuid(),
  userId: z.string().uuid(),
  membershipType: z.string().default('member'),
  status: z.string().default('active'),
  startDate: z.string(),
  endDate: z.string().optional(),
  renewalDate: z.string().optional(),
  memberNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Type definitions for inserts
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserType = z.infer<typeof insertUserTypeSchema>;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertEventDeal = z.infer<typeof insertEventDealSchema>;
export type InsertGameParticipant = z.infer<typeof insertGameParticipantSchema>;
export type InsertPartnership = z.infer<typeof insertPartnershipSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertFavouriteClub = z.infer<typeof insertFavouriteClubSchema>;
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertPlayerResult = z.infer<typeof insertPlayerResultSchema>;
export type InsertEventResult = z.infer<typeof insertEventResultSchema>;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type InsertEventStanding = z.infer<typeof insertEventStandingSchema>;
export type InsertClubMembership = z.infer<typeof insertClubMembershipSchema>;

// Bridge-specific types for PBN parsing and game data
export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type Seat = 'N' | 'E' | 'S' | 'W';

export interface Hand {
  S: string; // Spades
  H: string; // Hearts  
  D: string; // Diamonds
  C: string; // Clubs
}

export interface Deal {
  N: Hand;
  E: Hand;
  S: Hand;
  W: Hand;
}

export interface Bid {
  level?: number;
  suit?: 'C' | 'D' | 'H' | 'S' | 'NT';
  call?: 'Pass' | 'X' | 'XX';
  player: Seat;
}

export interface PBNGame {
  event?: string;
  site?: string;
  date?: string;
  board?: number;
  west?: string;
  north?: string;
  east?: string;
  south?: string;
  dealer?: Seat;
  vulnerable?: string;
  deal?: string;
  scoring?: string;
  declarer?: Seat;
  contract?: string;
  result?: string;
}

export interface GameAnalysis {
  totalHCP: number;
  distributionPoints: number;
  makeable: Record<string, number>;
  par: string;
  recommendations: string[];
}