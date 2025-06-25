import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { parsePBN } from "./services/pbn-parser";
import { insertGameSchema, insertHandSchema, insertUserBiddingSchema, insertCommentSchema } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.post("/api/games/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PBN file provided" });
      }

      const pbnContent = req.file.buffer.toString('utf-8');
      const userId = req.body.userId || 'anonymous';
      
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

  // User bidding routes
  app.post("/api/hands/:handId/bidding", async (req, res) => {
    try {
      const handId = parseInt(req.params.handId);
      const userId = req.body.userId || 'anonymous';
      
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

  app.get("/api/hands/:handId/bidding/:userId", async (req, res) => {
    try {
      const handId = parseInt(req.params.handId);
      const userId = req.params.userId;
      
      const bidding = await storage.getUserBidding(handId, userId);
      res.json(bidding);
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

  app.post("/api/hands/:handId/comments", async (req, res) => {
    try {
      const handId = parseInt(req.params.handId);
      
      const commentData = insertCommentSchema.parse({
        handId,
        userId: req.body.userId || 'anonymous',
        userName: req.body.userName || 'Anonymous',
        userLevel: req.body.userLevel || 'Beginner',
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
