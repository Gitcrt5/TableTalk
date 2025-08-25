import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { verifyFirebaseToken } from "./firebase";
import { parsePBNFile } from "./pbnParser";
import { z } from "zod";
import {
  insertGameSchema,
  insertBoardSchema,
  insertCommentSchema,
  insertPartnershipSchema,
  insertEventSchema,
  type BridgeHands,
} from "@shared/schema";

// Middleware to verify Firebase auth
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decodedToken = await verifyFirebaseToken(token);
    
    if (!decodedToken.uid) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    if (!decodedToken.email) {
      return res.status(401).json({ error: "Email required for authentication" });
    }

    // Get or create user in our database
    let user = await storage.getUserByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      try {
        user = await storage.createUser({
          email: decodedToken.email,
          displayName: decodedToken.name || decodedToken.email,
          firebaseUid: decodedToken.uid,
        });
      } catch (createError) {
        console.error("Failed to create user:", createError);
        return res.status(500).json({ error: "Failed to create user account" });
      }
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error("Authentication error:", error);
    
    // Return appropriate error message based on error type
    if (error?.message?.includes("expired")) {
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    } else if (error?.message?.includes("revoked")) {
      return res.status(401).json({ error: "Session invalid. Please sign in again." });
    } else if (error?.message?.includes("Invalid token")) {
      return res.status(401).json({ error: "Invalid authentication. Please sign in again." });
    } else {
      return res.status(401).json({ error: "Authentication failed. Please try again." });
    }
  }
};

// Middleware to require admin access - enforces admin role authorization
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decodedToken = await verifyFirebaseToken(token);
    
    if (!decodedToken.uid || !decodedToken.email) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    // Get user from database
    let user = await storage.getUserByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      user = await storage.createUser({
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email,
        firebaseUid: decodedToken.uid,
      });
    }

    req.user = user;
    
    // Enforce admin role requirement
    if (!req.user.userType || req.user.userType.code !== 'admin') {
      return res.status(403).json({ error: "Admin access required. You do not have sufficient permissions to access this resource." });
    }
    
    next();
  } catch (error: any) {
    console.error("Admin authentication error:", error);
    
    // Provide specific error messages for different failure scenarios
    if (error?.message?.includes("expired")) {
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    } else if (error?.message?.includes("revoked")) {
      return res.status(401).json({ error: "Session invalid. Please sign in again." });
    } else if (error?.message?.includes("Invalid token")) {
      return res.status(401).json({ error: "Invalid authentication. Please sign in again." });
    } else {
      return res.status(401).json({ error: "Authentication failed. Please try again." });
    }
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    res.json(req.user);
  });

  // Games routes
  app.get("/api/games", requireAuth, async (req: any, res) => {
    try {
      const games = await storage.getGamesByUser(req.user.id);
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  app.get("/api/games/public", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const games = await storage.getPublicGames(limit);
      res.json(games);
    } catch (error) {
      console.error("Error fetching public games:", error);
      res.status(500).json({ error: "Failed to fetch public games" });
    }
  });

  app.get("/api/games/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query required" });
      }

      const games = await storage.searchGames(query);
      res.json(games);
    } catch (error) {
      console.error("Error searching games:", error);
      res.status(500).json({ error: "Failed to search games" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGame(req.params.id);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ error: "Failed to fetch game" });
    }
  });

  app.post("/api/games", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertGameSchema.parse({
        ...req.body,
        creatorId: req.user.id,
      });

      const game = await storage.createGame(validatedData);

      // If PBN data is provided, parse and create boards
      if (req.body.pbnContent) {
        try {
          const boards = parsePBNFile(req.body.pbnContent);
          for (const boardData of boards) {
            await storage.createBoard({
              gameId: game.id,
              boardNumber: boardData.boardNumber,
              dealer: boardData.dealer,
              vulnerability: boardData.vulnerability,
              hands: boardData.hands,
            });
          }

          // Update game with total boards count
          await storage.updateGame(game.id, {
            totalBoards: boards.length,
          });
        } catch (pbnError) {
          console.error("PBN parsing error:", pbnError);
          // Continue with game creation even if PBN parsing fails
        }
      }

      res.json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid game data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  // Boards routes
  app.get("/api/games/:gameId/boards", async (req, res) => {
    try {
      const boards = await storage.getBoardsByGame(req.params.gameId);
      res.json(boards);
    } catch (error) {
      console.error("Error fetching boards:", error);
      res.status(500).json({ error: "Failed to fetch boards" });
    }
  });

  app.get("/api/boards/:id", async (req, res) => {
    try {
      const board = await storage.getBoard(req.params.id);
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }
      res.json(board);
    } catch (error) {
      console.error("Error fetching board:", error);
      res.status(500).json({ error: "Failed to fetch board" });
    }
  });

  app.put("/api/boards/:id", requireAuth, async (req: any, res) => {
    try {
      const board = await storage.getBoard(req.params.id);
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }

      const updatedBoard = await storage.updateBoard(req.params.id, req.body);
      res.json(updatedBoard);
    } catch (error) {
      console.error("Error updating board:", error);
      res.status(500).json({ error: "Failed to update board" });
    }
  });

  // Comments routes
  app.get("/api/boards/:boardId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByBoard(req.params.boardId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/boards/:boardId/comments", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        boardId: req.params.boardId,
        authorId: req.user.id,
      });

      const comment = await storage.createComment(validatedData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid comment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Partnerships routes
  app.get("/api/partnerships", requireAuth, async (req: any, res) => {
    try {
      const partnerships = await storage.getPartnershipsByUser(req.user.id);
      res.json(partnerships);
    } catch (error) {
      console.error("Error fetching partnerships:", error);
      res.status(500).json({ error: "Failed to fetch partnerships" });
    }
  });

  app.post("/api/partnerships", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertPartnershipSchema.parse({
        ...req.body,
        player1Id: req.user.id,
      });

      const partnership = await storage.createPartnership(validatedData);
      res.json(partnership);
    } catch (error) {
      console.error("Error creating partnership:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid partnership data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create partnership" });
    }
  });

  // Events routes
  app.get("/api/events", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const events = await storage.getEvents(limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const clubName = req.query.club as string;
      
      if (!query) {
        return res.status(400).json({ error: "Search query required" });
      }

      const events = await storage.searchEvents(query, clubName);
      res.json(events);
    } catch (error) {
      console.error("Error searching events:", error);
      res.status(500).json({ error: "Failed to search events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertEventSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });

      const event = await storage.createEvent(validatedData);
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid event data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req: any, res) => {
    try {
      const search = req.query.search as string;
      const userTypeFilter = req.query.userType as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const users = await storage.getAllUsers(search, userTypeFilter, limit);
      const totalCount = await storage.getUsersCount();
      
      res.json({ users, totalCount });
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:userId", requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      const user = await storage.updateUser(userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/admin/users/:userId/deactivate", requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.deactivateUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ error: "Failed to deactivate user" });
    }
  });

  app.post("/api/admin/users/:userId/activate", requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.activateUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error activating user:", error);
      res.status(500).json({ error: "Failed to activate user" });
    }
  });

  app.get("/api/admin/clubs", requireAdmin, async (req: any, res) => {
    try {
      const clubNames = await storage.getDistinctClubNames();
      res.json({ clubs: clubNames });
    } catch (error) {
      console.error("Error fetching admin clubs:", error);
      res.status(500).json({ error: "Failed to fetch clubs" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req: any, res) => {
    try {
      const totalUsers = await storage.getUsersCount();
      const totalClubs = (await storage.getDistinctClubNames()).length;
      const totalEvents = (await storage.getEvents(1000)).length;
      
      res.json({
        totalUsers,
        totalClubs,
        totalEvents
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // PBN parsing endpoint
  app.post("/api/pbn/parse", requireAuth, async (req: any, res) => {
    try {
      const { pbnContent } = req.body;
      if (!pbnContent) {
        return res.status(400).json({ error: "PBN content required" });
      }

      const boards = parsePBNFile(pbnContent);
      res.json({ boards, count: boards.length });
    } catch (error) {
      console.error("Error parsing PBN:", error);
      res.status(400).json({ error: "Invalid PBN format" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
