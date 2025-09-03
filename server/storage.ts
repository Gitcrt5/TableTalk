import {
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
import { supabase } from "./supabase";

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
  getFeatureFlag(name: string): Promise<FeatureFlag | undefined>;
  isFeatureEnabled(name: string, userId?: string): Promise<boolean>;

  // Admin functions
  getAllUsers(): Promise<User[]>;
  getUsersCount(): Promise<number>;
  getDistinctClubNames(): Promise<string[]>;
  deactivateUser(id: string): Promise<User>;
  activateUser(id: string): Promise<User>;
}

export class SupabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUserFromDb(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUserFromDb(data);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*, user_types(*)')
      .eq('firebase_uid', firebaseUid)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUserFromDb(data);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userData = this.mapUserToDb(insertUser);
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapUserFromDb(data);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const updateData = this.mapUserToDb(updates);
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapUserFromDb(data);
  }

  // Clubs
  async getClub(id: string): Promise<Club | undefined> {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapClubFromDb(data);
  }

  async getClubs(limit = 20): Promise<Club[]> {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .limit(limit);
    
    if (error) throw error;
    return data.map(this.mapClubFromDb);
  }

  async searchClubs(query: string): Promise<Club[]> {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`)
      .order('name');
    
    if (error) throw error;
    return data.map(this.mapClubFromDb);
  }

  async createClub(insertClub: InsertClub): Promise<Club> {
    const clubData = this.mapClubToDb(insertClub);
    const { data, error } = await supabase
      .from('clubs')
      .insert(clubData)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapClubFromDb(data);
  }

  async updateClub(id: string, updates: Partial<Club>): Promise<Club> {
    const updateData = this.mapClubToDb(updates);
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('clubs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapClubFromDb(data);
  }

  // Favourite Clubs
  async getFavouriteClubsByUser(userId: string): Promise<Club[]> {
    const { data, error } = await supabase
      .from('favourite_clubs')
      .select('clubs(*)')
      .eq('user_id', userId)
      .order('clubs(name)');
    
    if (error) throw error;
    return data.map(item => this.mapClubFromDb(item.clubs));
  }

  async addFavouriteClub(userId: string, clubId: string): Promise<FavouriteClub> {
    const { data, error } = await supabase
      .from('favourite_clubs')
      .insert({
        user_id: userId,
        club_id: clubId
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapFavouriteClubFromDb(data);
  }

  async removeFavouriteClub(userId: string, clubId: string): Promise<void> {
    const { error } = await supabase
      .from('favourite_clubs')
      .delete()
      .eq('user_id', userId)
      .eq('club_id', clubId);
    
    if (error) throw error;
  }

  // Games
  async getGame(id: string): Promise<Game | undefined> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapGameFromDb(data);
  }

  async getGamesByUser(userId: string): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .or(`creator_id.eq.${userId},partner_id.eq.${userId}`)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data.map(this.mapGameFromDb);
  }

  async getPublicGames(limit = 20): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('visibility', 'public')
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data.map(this.mapGameFromDb);
  }

  async searchGames(query: string, userId?: string): Promise<Game[]> {
    let queryBuilder = supabase
      .from('games')
      .select('*');
    
    if (userId) {
      queryBuilder = queryBuilder
        .or(`creator_id.eq.${userId},partner_id.eq.${userId}`)
        .ilike('name', `%${query}%`);
    } else {
      queryBuilder = queryBuilder
        .eq('visibility', 'public')
        .ilike('name', `%${query}%`);
    }
    
    const { data, error } = await queryBuilder
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data.map(this.mapGameFromDb);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const gameData = this.mapGameToDb(insertGame);
    const { data, error } = await supabase
      .from('games')
      .insert(gameData)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapGameFromDb(data);
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game> {
    const updateData = this.mapGameToDb(updates);
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapGameFromDb(data);
  }

  // Boards
  async getBoard(id: string): Promise<Board | undefined> {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapBoardFromDb(data);
  }

  async getBoardsByGame(gameId: string): Promise<Board[]> {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('game_id', gameId)
      .order('board_number');
    
    if (error) throw error;
    return data.map(this.mapBoardFromDb);
  }

  async createBoard(insertBoard: InsertBoard): Promise<Board> {
    const boardData = this.mapBoardToDb(insertBoard);
    const { data, error } = await supabase
      .from('boards')
      .insert(boardData)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapBoardFromDb(data);
  }

  async updateBoard(id: string, updates: Partial<Board>): Promise<Board> {
    const updateData = this.mapBoardToDb(updates);
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('boards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapBoardFromDb(data);
  }

  // Event Deals
  async getEventDeal(id: string): Promise<EventDeal | undefined> {
    const { data, error } = await supabase
      .from('event_deals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapEventDealFromDb(data);
  }

  async getEventDealsByEvent(eventId: string): Promise<EventDeal[]> {
    const { data, error } = await supabase
      .from('event_deals')
      .select('*')
      .eq('event_id', eventId)
      .order('board_number');
    
    if (error) throw error;
    return data.map(this.mapEventDealFromDb);
  }

  async createEventDeal(insertEventDeal: InsertEventDeal): Promise<EventDeal> {
    const eventDealData = this.mapEventDealToDb(insertEventDeal);
    const { data, error } = await supabase
      .from('event_deals')
      .insert(eventDealData)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapEventDealFromDb(data);
  }

  async updateEventDeal(id: string, updates: Partial<EventDeal>): Promise<EventDeal> {
    const updateData = this.mapEventDealToDb(updates);
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('event_deals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapEventDealFromDb(data);
  }

  // Game Participants
  async getGameParticipants(gameId: string): Promise<GameParticipant[]> {
    const { data, error } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at');
    
    if (error) throw error;
    return data.map(this.mapGameParticipantFromDb);
  }

  async createGameParticipant(insertParticipant: InsertGameParticipant): Promise<GameParticipant> {
    const participantData = this.mapGameParticipantToDb(insertParticipant);
    const { data, error } = await supabase
      .from('game_participants')
      .insert(participantData)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapGameParticipantFromDb(data);
  }

  async updateGameParticipant(id: string, updates: Partial<GameParticipant>): Promise<GameParticipant> {
    const updateData = this.mapGameParticipantToDb(updates);
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('game_participants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapGameParticipantFromDb(data);
  }

  // Comments
  async getCommentsByBoard(boardId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at');
    
    if (error) throw error;
    return data.map(this.mapCommentFromDb);
  }

  async getCommentsByEventDeal(eventDealId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('event_deal_id', eventDealId)
      .order('created_at');
    
    if (error) throw error;
    return data.map(this.mapCommentFromDb);
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const commentData = this.mapCommentToDb(insertComment);
    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapCommentFromDb(data);
  }

  async updateComment(id: string, updates: Partial<Comment>): Promise<Comment> {
    const updateData = this.mapCommentToDb(updates);
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('comments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapCommentFromDb(data);
  }

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Partnerships
  async getPartnershipsByUser(userId: string): Promise<Partnership[]> {
    const { data, error } = await supabase
      .from('partnerships')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(this.mapPartnershipFromDb);
  }

  async createPartnership(insertPartnership: InsertPartnership): Promise<Partnership> {
    const partnershipData = this.mapPartnershipToDb(insertPartnership);
    const { data, error } = await supabase
      .from('partnerships')
      .insert(partnershipData)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapPartnershipFromDb(data);
  }

  async updatePartnership(id: string, updates: Partial<Partnership>): Promise<Partnership> {
    const updateData = this.mapPartnershipToDb(updates);
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('partnerships')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapPartnershipFromDb(data);
  }

  // Events
  async getEvent(id: string): Promise<Event | undefined> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapEventFromDb(data);
  }

  async getEvents(limit = 20): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data.map(this.mapEventFromDb);
  }

  async getEventsByClub(clubId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', clubId)
      .order('event_date', { ascending: false });
    
    if (error) throw error;
    return data.map(this.mapEventFromDb);
  }

  async searchEvents(query: string, clubName?: string): Promise<Event[]> {
    let queryBuilder = supabase
      .from('events')
      .select('*');
    
    if (clubName) {
      queryBuilder = queryBuilder
        .ilike('name', `%${query}%`)
        .ilike('club_name', `%${clubName}%`);
    } else {
      queryBuilder = queryBuilder
        .ilike('name', `%${query}%`);
    }
    
    const { data, error } = await queryBuilder
      .order('event_date', { ascending: false });
    
    if (error) throw error;
    return data.map(this.mapEventFromDb);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const eventData = this.mapEventToDb(insertEvent);
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapEventFromDb(data);
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const updateData = this.mapEventToDb(updates);
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapEventFromDb(data);
  }

  // Event Results & Standings
  async getEventResults(eventId: string): Promise<EventResult[]> {
    const { data, error } = await supabase
      .from('event_results')
      .select('*')
      .eq('event_id', eventId)
      .order('rank');
    
    if (error) throw error;
    return data.map(this.mapEventResultFromDb);
  }

  async createEventResult(insertResult: InsertEventResult): Promise<EventResult> {
    const resultData = this.mapEventResultToDb(insertResult);
    const { data, error } = await supabase
      .from('event_results')
      .insert(resultData)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapEventResultFromDb(data);
  }

  async getEventStandings(eventId: string): Promise<EventStanding[]> {
    const { data, error } = await supabase
      .from('event_standings')
      .select('*')
      .eq('event_id', eventId)
      .order('rank');
    
    if (error) throw error;
    return data.map(this.mapEventStandingFromDb);
  }

  async updateEventStandings(eventId: string, standings: InsertEventStanding[]): Promise<EventStanding[]> {
    // Delete existing standings for this event
    await supabase
      .from('event_standings')
      .delete()
      .eq('event_id', eventId);
    
    // Insert new standings
    const standingsData = standings.map(this.mapEventStandingToDb);
    const { data, error } = await supabase
      .from('event_standings')
      .insert(standingsData)
      .select();
    
    if (error) throw error;
    return data.map(this.mapEventStandingFromDb);
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreference[]> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data.map(this.mapUserPreferenceFromDb);
  }

  async getUserPreference(userId: string, key: string): Promise<UserPreference | undefined> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('key', key)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUserPreferenceFromDb(data);
  }

  async setUserPreference(userId: string, key: string, value: any): Promise<UserPreference> {
    const preferenceData = {
      user_id: userId,
      key,
      value,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(preferenceData, { onConflict: 'user_id,key' })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapUserPreferenceFromDb(data);
  }

  // Feature Flags
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data.map(this.mapFeatureFlagFromDb);
  }

  async getFeatureFlag(name: string): Promise<FeatureFlag | undefined> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error || !data) return undefined;
    return this.mapFeatureFlagFromDb(data);
  }

  async isFeatureEnabled(name: string, userId?: string): Promise<boolean> {
    const flag = await this.getFeatureFlag(name);
    if (!flag) return false;
    
    if (!flag.isEnabled) return false;
    
    // Simple rollout percentage logic
    if (flag.rolloutPercentage === 100) return true;
    if (flag.rolloutPercentage === 0) return false;
    
    // Use userId for consistent rollout if provided
    if (userId) {
      const hash = userId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return Math.abs(hash) % 100 < flag.rolloutPercentage;
    }
    
    return Math.random() * 100 < flag.rolloutPercentage;
  }

  // Admin functions
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(this.mapUserFromDb);
  }

  async getUsersCount(): Promise<number> {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  }

  async getDistinctClubNames(): Promise<string[]> {
    const { data, error } = await supabase
      .from('clubs')
      .select('name')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data.map(club => club.name);
  }

  async deactivateUser(id: string): Promise<User> {
    return this.updateUser(id, { isActive: false });
  }

  async activateUser(id: string): Promise<User> {
    return this.updateUser(id, { isActive: true });
  }

  // Helper methods to map between camelCase and snake_case
  private mapUserFromDb(data: any): User {
    return {
      id: data.id,
      email: data.email,
      firebaseUid: data.firebase_uid,
      firstName: data.first_name,
      lastName: data.last_name,
      displayName: data.display_name,
      homeClubId: data.home_club_id,
      userTypeId: data.user_type_id,
      isActive: data.is_active,
      lastLogin: data.last_login,
      preferences: data.preferences,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapUserToDb(data: Partial<User | InsertUser>): any {
    const result: any = {};
    if (data.email !== undefined) result.email = data.email;
    if (data.firebaseUid !== undefined) result.firebase_uid = data.firebaseUid;
    if (data.firstName !== undefined) result.first_name = data.firstName;
    if (data.lastName !== undefined) result.last_name = data.lastName;
    if (data.displayName !== undefined) result.display_name = data.displayName;
    if (data.homeClubId !== undefined) result.home_club_id = data.homeClubId;
    if (data.userTypeId !== undefined) result.user_type_id = data.userTypeId;
    if (data.isActive !== undefined) result.is_active = data.isActive;
    if (data.lastLogin !== undefined) result.last_login = data.lastLogin;
    if (data.preferences !== undefined) result.preferences = data.preferences;
    return result;
  }

  private mapClubFromDb(data: any): Club {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      country: data.country,
      state: data.state,
      city: data.city,
      website: data.website,
      email: data.email,
      phone: data.phone,
      address: data.address,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapClubToDb(data: Partial<Club | InsertClub>): any {
    const result: any = {};
    if (data.name !== undefined) result.name = data.name;
    if (data.description !== undefined) result.description = data.description;
    if (data.country !== undefined) result.country = data.country;
    if (data.state !== undefined) result.state = data.state;
    if (data.city !== undefined) result.city = data.city;
    if (data.website !== undefined) result.website = data.website;
    if (data.email !== undefined) result.email = data.email;
    if (data.phone !== undefined) result.phone = data.phone;
    if (data.address !== undefined) result.address = data.address;
    if (data.isActive !== undefined) result.is_active = data.isActive;
    return result;
  }

  private mapGameFromDb(data: any): Game {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      creatorId: data.creator_id,
      partnerId: data.partner_id,
      ownerId: data.owner_id,
      visibility: data.visibility,
      eventId: data.event_id,
      gameDate: data.game_date,
      clubName: data.club_name,
      pbnData: data.pbn_data,
      totalBoards: data.total_boards,
      type: data.type,
      isPublished: data.is_published,
      publishedAt: data.published_at,
      sessionNotes: data.session_notes,
      completedBoards: data.completed_boards,
      pairNumbers: data.pair_numbers,
      sessionMetadata: data.session_metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapGameToDb(data: Partial<Game | InsertGame>): any {
    const result: any = {};
    if (data.name !== undefined) result.name = data.name;
    if (data.description !== undefined) result.description = data.description;
    if (data.creatorId !== undefined) result.creator_id = data.creatorId;
    if (data.partnerId !== undefined) result.partner_id = data.partnerId;
    if (data.ownerId !== undefined) result.owner_id = data.ownerId;
    if (data.visibility !== undefined) result.visibility = data.visibility;
    if (data.eventId !== undefined) result.event_id = data.eventId;
    if (data.gameDate !== undefined) result.game_date = data.gameDate;
    if (data.clubName !== undefined) result.club_name = data.clubName;
    if (data.pbnData !== undefined) result.pbn_data = data.pbnData;
    if (data.totalBoards !== undefined) result.total_boards = data.totalBoards;
    if (data.type !== undefined) result.type = data.type;
    if (data.isPublished !== undefined) result.is_published = data.isPublished;
    if (data.publishedAt !== undefined) result.published_at = data.publishedAt;
    if (data.sessionNotes !== undefined) result.session_notes = data.sessionNotes;
    if (data.completedBoards !== undefined) result.completed_boards = data.completedBoards;
    if (data.pairNumbers !== undefined) result.pair_numbers = data.pairNumbers;
    if (data.sessionMetadata !== undefined) result.session_metadata = data.sessionMetadata;
    return result;
  }

  private mapBoardFromDb(data: any): Board {
    return {
      id: data.id,
      gameId: data.game_id,
      boardNumber: data.board_number,
      eventDealId: data.event_deal_id,
      dealer: data.dealer,
      vulnerability: data.vulnerability,
      hands: data.hands,
      northHand: data.north_hand,
      eastHand: data.east_hand,
      southHand: data.south_hand,
      westHand: data.west_hand,
      optimumInfo: data.optimum_info,
      biddingSequence: data.bidding_sequence,
      bidding: data.bidding,
      contract: data.contract,
      declarer: data.declarer,
      result: data.result,
      tricksTaken: data.tricks_taken,
      leadCard: data.lead_card,
      notes: data.notes,
      analysisNotes: data.analysis_notes,
      score: data.score,
      boardMetadata: data.board_metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapBoardToDb(data: Partial<Board | InsertBoard>): any {
    const result: any = {};
    if (data.gameId !== undefined) result.game_id = data.gameId;
    if (data.boardNumber !== undefined) result.board_number = data.boardNumber;
    if (data.eventDealId !== undefined) result.event_deal_id = data.eventDealId;
    if (data.dealer !== undefined) result.dealer = data.dealer;
    if (data.vulnerability !== undefined) result.vulnerability = data.vulnerability;
    if (data.hands !== undefined) result.hands = data.hands;
    if (data.northHand !== undefined) result.north_hand = data.northHand;
    if (data.eastHand !== undefined) result.east_hand = data.eastHand;
    if (data.southHand !== undefined) result.south_hand = data.southHand;
    if (data.westHand !== undefined) result.west_hand = data.westHand;
    if (data.optimumInfo !== undefined) result.optimum_info = data.optimumInfo;
    if (data.biddingSequence !== undefined) result.bidding_sequence = data.biddingSequence;
    if (data.bidding !== undefined) result.bidding = data.bidding;
    if (data.contract !== undefined) result.contract = data.contract;
    if (data.declarer !== undefined) result.declarer = data.declarer;
    if (data.result !== undefined) result.result = data.result;
    if (data.tricksTaken !== undefined) result.tricks_taken = data.tricksTaken;
    if (data.leadCard !== undefined) result.lead_card = data.leadCard;
    if (data.notes !== undefined) result.notes = data.notes;
    if (data.analysisNotes !== undefined) result.analysis_notes = data.analysisNotes;
    if (data.score !== undefined) result.score = data.score;
    if (data.boardMetadata !== undefined) result.board_metadata = data.boardMetadata;
    return result;
  }

  // Add remaining mapping methods for other entities
  private mapEventFromDb(data: any): Event {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      eventDate: data.event_date,
      startTime: data.start_time,
      endTime: data.end_time,
      clubId: data.club_id,
      clubName: data.club_name,
      organizerId: data.organizer_id,
      status: data.status,
      kind: data.kind,
      registrationType: data.registration_type,
      maxParticipants: data.max_participants,
      entryFee: data.entry_fee,
      currency: data.currency,
      location: data.location,
      address: data.address,
      website: data.website,
      contactEmail: data.contact_email,
      contactPhone: data.contact_phone,
      specialInstructions: data.special_instructions,
      isPublished: data.is_published,
      publishedAt: data.published_at,
      registrationDeadline: data.registration_deadline,
      cancellationDeadline: data.cancellation_deadline,
      refundPolicy: data.refund_policy,
      totalBoards: data.total_boards,
      scoringMethod: data.scoring_method,
      movementType: data.movement_type,
      sessionMetadata: data.session_metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapEventToDb(data: Partial<Event | InsertEvent>): any {
    const result: any = {};
    if (data.name !== undefined) result.name = data.name;
    if (data.description !== undefined) result.description = data.description;
    if (data.eventDate !== undefined) result.event_date = data.eventDate;
    if (data.startTime !== undefined) result.start_time = data.startTime;
    if (data.endTime !== undefined) result.end_time = data.endTime;
    if (data.clubId !== undefined) result.club_id = data.clubId;
    if (data.clubName !== undefined) result.club_name = data.clubName;
    if (data.organizerId !== undefined) result.organizer_id = data.organizerId;
    if (data.status !== undefined) result.status = data.status;
    if (data.kind !== undefined) result.kind = data.kind;
    if (data.registrationType !== undefined) result.registration_type = data.registrationType;
    if (data.maxParticipants !== undefined) result.max_participants = data.maxParticipants;
    if (data.entryFee !== undefined) result.entry_fee = data.entryFee;
    if (data.currency !== undefined) result.currency = data.currency;
    if (data.location !== undefined) result.location = data.location;
    if (data.address !== undefined) result.address = data.address;
    if (data.website !== undefined) result.website = data.website;
    if (data.contactEmail !== undefined) result.contact_email = data.contactEmail;
    if (data.contactPhone !== undefined) result.contact_phone = data.contactPhone;
    if (data.specialInstructions !== undefined) result.special_instructions = data.specialInstructions;
    if (data.isPublished !== undefined) result.is_published = data.isPublished;
    if (data.publishedAt !== undefined) result.published_at = data.publishedAt;
    if (data.registrationDeadline !== undefined) result.registration_deadline = data.registrationDeadline;
    if (data.cancellationDeadline !== undefined) result.cancellation_deadline = data.cancellationDeadline;
    if (data.refundPolicy !== undefined) result.refund_policy = data.refundPolicy;
    if (data.totalBoards !== undefined) result.total_boards = data.totalBoards;
    if (data.scoringMethod !== undefined) result.scoring_method = data.scoringMethod;
    if (data.movementType !== undefined) result.movement_type = data.movementType;
    if (data.sessionMetadata !== undefined) result.session_metadata = data.sessionMetadata;
    return result;
  }

  private mapEventDealFromDb(data: any): EventDeal {
    return {
      id: data.id,
      eventId: data.event_id,
      boardNumber: data.board_number,
      dealer: data.dealer,
      vulnerability: data.vulnerability,
      northHand: data.north_hand,
      eastHand: data.east_hand,
      southHand: data.south_hand,
      westHand: data.west_hand,
      optimumInfo: data.optimum_info,
      analysisNotes: data.analysis_notes,
      difficultyRating: data.difficulty_rating,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapEventDealToDb(data: Partial<EventDeal | InsertEventDeal>): any {
    const result: any = {};
    if (data.eventId !== undefined) result.event_id = data.eventId;
    if (data.boardNumber !== undefined) result.board_number = data.boardNumber;
    if (data.dealer !== undefined) result.dealer = data.dealer;
    if (data.vulnerability !== undefined) result.vulnerability = data.vulnerability;
    if (data.northHand !== undefined) result.north_hand = data.northHand;
    if (data.eastHand !== undefined) result.east_hand = data.eastHand;
    if (data.southHand !== undefined) result.south_hand = data.southHand;
    if (data.westHand !== undefined) result.west_hand = data.westHand;
    if (data.optimumInfo !== undefined) result.optimum_info = data.optimumInfo;
    if (data.analysisNotes !== undefined) result.analysis_notes = data.analysisNotes;
    if (data.difficultyRating !== undefined) result.difficulty_rating = data.difficultyRating;
    return result;
  }

  private mapGameParticipantFromDb(data: any): GameParticipant {
    return {
      id: data.id,
      gameId: data.game_id,
      userId: data.user_id,
      role: data.role,
      pairNumber: data.pair_number,
      seatPreference: data.seat_preference,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapGameParticipantToDb(data: Partial<GameParticipant | InsertGameParticipant>): any {
    const result: any = {};
    if (data.gameId !== undefined) result.game_id = data.gameId;
    if (data.userId !== undefined) result.user_id = data.userId;
    if (data.role !== undefined) result.role = data.role;
    if (data.pairNumber !== undefined) result.pair_number = data.pairNumber;
    if (data.seatPreference !== undefined) result.seat_preference = data.seatPreference;
    if (data.notes !== undefined) result.notes = data.notes;
    return result;
  }

  private mapCommentFromDb(data: any): Comment {
    return {
      id: data.id,
      userId: data.user_id,
      boardId: data.board_id,
      eventDealId: data.event_deal_id,
      parentId: data.parent_id,
      content: data.content,
      type: data.type,
      isDeleted: data.is_deleted,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapCommentToDb(data: Partial<Comment | InsertComment>): any {
    const result: any = {};
    if (data.userId !== undefined) result.user_id = data.userId;
    if (data.boardId !== undefined) result.board_id = data.boardId;
    if (data.eventDealId !== undefined) result.event_deal_id = data.eventDealId;
    if (data.parentId !== undefined) result.parent_id = data.parentId;
    if (data.content !== undefined) result.content = data.content;
    if (data.type !== undefined) result.type = data.type;
    if (data.isDeleted !== undefined) result.is_deleted = data.isDeleted;
    return result;
  }

  private mapPartnershipFromDb(data: any): Partnership {
    return {
      id: data.id,
      player1Id: data.player1_id,
      player2Id: data.player2_id,
      partnershipName: data.partnership_name,
      status: data.status,
      startDate: data.start_date,
      endDate: data.end_date,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapPartnershipToDb(data: Partial<Partnership | InsertPartnership>): any {
    const result: any = {};
    if (data.player1Id !== undefined) result.player1_id = data.player1Id;
    if (data.player2Id !== undefined) result.player2_id = data.player2Id;
    if (data.partnershipName !== undefined) result.partnership_name = data.partnershipName;
    if (data.status !== undefined) result.status = data.status;
    if (data.startDate !== undefined) result.start_date = data.startDate;
    if (data.endDate !== undefined) result.end_date = data.endDate;
    if (data.notes !== undefined) result.notes = data.notes;
    return result;
  }

  private mapFavouriteClubFromDb(data: any): FavouriteClub {
    return {
      userId: data.user_id,
      clubId: data.club_id,
      createdAt: data.created_at,
    };
  }

  private mapEventResultFromDb(data: any): EventResult {
    return {
      id: data.id,
      eventId: data.event_id,
      userId: data.user_id,
      pairNumber: data.pair_number,
      side: data.side,
      totalScore: data.total_score,
      percentage: data.percentage,
      rank: data.rank,
      boardsPlayed: data.boards_played,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapEventResultToDb(data: Partial<EventResult | InsertEventResult>): any {
    const result: any = {};
    if (data.eventId !== undefined) result.event_id = data.eventId;
    if (data.userId !== undefined) result.user_id = data.userId;
    if (data.pairNumber !== undefined) result.pair_number = data.pairNumber;
    if (data.side !== undefined) result.side = data.side;
    if (data.totalScore !== undefined) result.total_score = data.totalScore;
    if (data.percentage !== undefined) result.percentage = data.percentage;
    if (data.rank !== undefined) result.rank = data.rank;
    if (data.boardsPlayed !== undefined) result.boards_played = data.boardsPlayed;
    return result;
  }

  private mapEventStandingFromDb(data: any): EventStanding {
    return {
      id: data.id,
      eventId: data.event_id,
      pairNumber: data.pair_number,
      player1Id: data.player1_id,
      player2Id: data.player2_id,
      totalScore: data.total_score,
      percentage: data.percentage,
      rank: data.rank,
      boardsPlayed: data.boards_played,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapEventStandingToDb(data: Partial<EventStanding | InsertEventStanding>): any {
    const result: any = {};
    if (data.eventId !== undefined) result.event_id = data.eventId;
    if (data.pairNumber !== undefined) result.pair_number = data.pairNumber;
    if (data.player1Id !== undefined) result.player1_id = data.player1Id;
    if (data.player2Id !== undefined) result.player2_id = data.player2Id;
    if (data.totalScore !== undefined) result.total_score = data.totalScore;
    if (data.percentage !== undefined) result.percentage = data.percentage;
    if (data.rank !== undefined) result.rank = data.rank;
    if (data.boardsPlayed !== undefined) result.boards_played = data.boardsPlayed;
    return result;
  }

  private mapUserPreferenceFromDb(data: any): UserPreference {
    return {
      id: data.id,
      userId: data.user_id,
      key: data.key,
      value: data.value,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapFeatureFlagFromDb(data: any): FeatureFlag {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      isEnabled: data.is_enabled,
      conditions: data.conditions,
      rolloutPercentage: data.rollout_percentage,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Export storage instance
export const storage: IStorage = new SupabaseStorage();