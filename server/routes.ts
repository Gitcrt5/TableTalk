import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { parsePBN } from "./services/pbn-parser";
import { insertGameSchema, insertHandSchema, insertUserBiddingSchema, insertCommentSchema } from "@shared/schema";
import { setupAuth as setupReplitAuth, isAuthenticated as isReplitAuthenticated } from "./replitAuth";
import { setupLocalAuth } from "./auth";

// Load environment variables early
import { config } from 'dotenv';
config();

// Always use local auth - only use Replit auth if explicitly enabled
const USE_REPLIT_AUTH = process.env.USE_REPLIT_AUTH === "true";

// Helper function to get user ID from request based on auth method
function getUserId(req: any): string {
  return USE_REPLIT_AUTH ? req.user.claims.sub : req.user.id;
}

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication based on environment
  if (USE_REPLIT_AUTH) {
    console.log("Using Replit OAuth authentication");
    await setupReplitAuth(app);
  } else {
    console.log("Using local email/password authentication");
    setupLocalAuth(app);
  }

  // Create unified authentication middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth routes - different endpoints based on auth type
  if (USE_REPLIT_AUTH) {
    app.get('/api/auth/user', isReplitAuthenticated, async (req: any, res) => {
      try {
        const userId = getUserId(req);
        const user = await storage.getUser(userId);
        res.json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    });
  } else {
    // Local auth already provides /api/user endpoint in setupLocalAuth
  }

  // Games routes
  app.get("/api/games", async (req, res) => {
    try {
      const { search } = req.query;
      let games;
      
      if (search && typeof search === 'string') {
        games = await storage.searchGames(search);
      } else {
        games = await storage.getAllGames();
      }
      
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const game = await storage.getGame(id);
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ error: "Failed to fetch game" });
    }
  });

  app.put("/api/games/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      
      // Get the existing game to check ownership
      const existingGame = await storage.getGame(id);
      if (!existingGame) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      // Only allow the uploader to edit the game
      if (existingGame.uploadedBy !== userId) {
        return res.status(403).json({ error: "Only the uploader can edit this game" });
      }
      
      // Validate the update data
      const updateData = {
        title: req.body.title,
        date: req.body.date,
        location: req.body.location,
        event: req.body.event,
        tournament: req.body.tournament,
        round: req.body.round,
      };
      
      // Remove undefined values
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );
      
      const updatedGame = await storage.updateGame(id, filteredUpdateData);
      
      if (!updatedGame) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      res.json(updatedGame);
    } catch (error) {
      console.error("Error updating game:", error);
      res.status(500).json({ error: "Failed to update game" });
    }
  });

  app.post("/api/games/upload", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PBN file provided" });
      }

      const pbnContent = req.file.buffer.toString('utf-8');
      const userId = getUserId(req);
      
      // Parse PBN file
      const parsedPBN = parsePBN(pbnContent);
      
      if (parsedPBN.hands.length === 0) {
        return res.status(400).json({ error: "No valid hands found in PBN file" });
      }

      // Create game
      const gameData = insertGameSchema.parse({
        title: parsedPBN.title || req.file.originalname,
        tournament: parsedPBN.tournament,
        round: parsedPBN.round,
        uploadedBy: userId,
        pbnContent,
      });

      const game = await storage.createGame(gameData);

      // Create hands
      const hands = [];
      for (const parsedHand of parsedPBN.hands) {
        const handData = insertHandSchema.parse({
          gameId: game.id,
          ...parsedHand,
        });
        
        const hand = await storage.createHand(handData);
        hands.push(hand);
      }

      res.json({ game, hands });
    } catch (error) {
      console.error("Error uploading PBN:", error);
      res.status(500).json({ error: "Failed to upload PBN file" });
    }
  });

  app.post("/api/games/import-url", isAuthenticated, async (req: any, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Validate URL
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      // Only allow HTTP/HTTPS URLs
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: "Only HTTP and HTTPS URLs are allowed" });
      }

      const userId = getUserId(req);
      
      // Fetch PBN content from URL
      let pbnContent;
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'TableTalk Bridge App',
            'Accept': 'text/plain,*/*',
          },
          // Set timeout to prevent hanging
          signal: AbortSignal.timeout(30000), // 30 seconds
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        pbnContent = await response.text();
      } catch (error) {
        console.error("Error fetching PBN from URL:", error);
        return res.status(400).json({ 
          error: `Failed to fetch PBN file from URL: ${error.message}` 
        });
      }

      // Parse PBN content
      const parsedPBN = parsePBN(pbnContent);
      
      if (parsedPBN.hands.length === 0) {
        return res.status(400).json({ error: "No valid hands found in PBN file" });
      }

      // Extract filename from URL for title
      const urlPath = parsedUrl.pathname;
      const filename = urlPath.split('/').pop() || 'Imported Game';
      const titleFromUrl = filename.replace(/\.pbn$/i, '');

      // Create game
      const gameData = insertGameSchema.parse({
        title: parsedPBN.title || titleFromUrl,
        tournament: parsedPBN.tournament,
        round: parsedPBN.round,
        uploadedBy: userId,
        pbnContent,
      });

      const game = await storage.createGame(gameData);

      // Create hands
      const hands = [];
      for (const parsedHand of parsedPBN.hands) {
        const handData = insertHandSchema.parse({
          gameId: game.id,
          ...parsedHand,
        });
        
        const hand = await storage.createHand(handData);
        hands.push(hand);
      }

      res.json({ game, hands });
    } catch (error) {
      console.error("Error importing PBN from URL:", error);
      res.status(500).json({ error: "Failed to import PBN file from URL" });
    }
  });

  // Hands routes
  app.get("/api/hands/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const hand = await storage.getHand(id);
      
      if (!hand) {
        return res.status(404).json({ error: "Hand not found" });
      }
      
      res.json(hand);
    } catch (error) {
      console.error("Error fetching hand:", error);
      res.status(500).json({ error: "Failed to fetch hand" });
    }
  });

  app.get("/api/games/:gameId/hands", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const hands = await storage.getHandsByGame(gameId);
      res.json(hands);
    } catch (error) {
      console.error("Error fetching hands:", error);
      res.status(500).json({ error: "Failed to fetch hands" });
    }
  });

  app.get("/api/hands", async (req, res) => {
    try {
      const { vulnerability, dealer, convention } = req.query;
      const filters = {
        vulnerability: vulnerability as string,
        dealer: dealer as string,
        convention: convention as string,
      };
      
      const hands = await storage.getHandsWithFilters(filters);
      res.json(hands);
    } catch (error) {
      console.error("Error fetching hands:", error);
      res.status(500).json({ error: "Failed to fetch hands" });
    }
  });

  // Update hand bidding (admin/original functionality)
  app.put("/api/hands/:id/bidding", isAuthenticated, async (req: any, res) => {
    try {
      const handId = parseInt(req.params.id);
      const { bidding, finalContract, declarer, result } = req.body;
      
      // Get the current hand
      const hand = await storage.getHand(handId);
      if (!hand) {
        return res.status(404).json({ error: "Hand not found" });
      }
      
      // Update the hand's actual bidding
      const updates = {
        actualBidding: bidding,
        finalContract: finalContract || null,
        declarer: declarer || null,
        result: result || null,
      };
      
      const updatedHand = await storage.updateHand(handId, updates);
      if (!updatedHand) {
        return res.status(404).json({ error: "Hand not found" });
      }
      
      res.json(updatedHand);
    } catch (error) {
      console.error("Error updating hand bidding:", error);
      res.status(500).json({ error: "Failed to update bidding" });
    }
  });

  // User bidding routes (for practice)
  app.post("/api/hands/:handId/bidding", isAuthenticated, async (req: any, res) => {
    try {
      const handId = parseInt(req.params.handId);
      const userId = getUserId(req);
      
      const biddingData = insertUserBiddingSchema.parse({
        handId,
        userId,
        bidding: req.body.bidding,
        accuracy: req.body.accuracy,
      });

      const bidding = await storage.createUserBidding(biddingData);
      res.json(bidding);
    } catch (error) {
      console.error("Error saving user bidding:", error);
      res.status(500).json({ error: "Failed to save bidding" });
    }
  });

  app.get("/api/hands/:handId/bidding", isAuthenticated, async (req: any, res) => {
    try {
      const handId = parseInt(req.params.handId);
      const userId = getUserId(req);
      
      const bidding = await storage.getUserBidding(handId, userId);
      res.json(bidding || null);
    } catch (error) {
      console.error("Error fetching user bidding:", error);
      res.status(500).json({ error: "Failed to fetch bidding" });
    }
  });

  // Comments routes
  app.get("/api/hands/:handId/comments", async (req, res) => {
    try {
      const handId = parseInt(req.params.handId);
      const comments = await storage.getCommentsByHand(handId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/hands/:handId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const handId = parseInt(req.params.handId);
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      const commentData = insertCommentSchema.parse({
        handId,
        userId,
        userName: user?.displayName || user?.firstName || 'Anonymous',
        userLevel: req.body.userLevel || 'Player',
        content: req.body.content,
      });

      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.post("/api/comments/:commentId/like", async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      await storage.likeComment(commentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error liking comment:", error);
      res.status(500).json({ error: "Failed to like comment" });
    }
  });

  // Statistics routes
  app.get("/api/users/:userId/stats", async (req, res) => {
    try {
      const userId = req.params.userId;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
