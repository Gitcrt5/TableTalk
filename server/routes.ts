import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { parsePBN } from "./services/pbn-parser";
import { insertGameSchema, insertHandSchema, insertUserBiddingSchema, insertCommentSchema, insertPartnershipBiddingSchema, insertGamePlayerSchema, insertPartnerSchema, insertGameParticipantSchema, User } from "@shared/schema";
import { setupAuth as setupReplitAuth, isAuthenticated as isReplitAuthenticated } from "./replitAuth";
import { setupLocalAuth, bootstrapAdmin } from "./auth";

// Load environment variables early
import { config } from 'dotenv';
config();

// Always use local auth - only use Replit auth if explicitly enabled
const USE_REPLIT_AUTH = process.env.USE_REPLIT_AUTH === "true";

// Helper function to get user ID from request based on auth method
function getUserId(req: any): string {
  return USE_REPLIT_AUTH ? req.user.claims.sub : req.user.id;
}

// Password hashing utilities (same as auth.ts)
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Calculate contract from bidding sequence
function calculateContractFromBidding(bidding: string[]): {
  finalContract?: string;
  declarer?: string;
} {
  const positions = ["West", "North", "East", "South"];
  
  // Find the last non-pass bid
  let lastBidIndex = -1;
  let lastBid = "";
  
  for (let i = bidding.length - 1; i >= 0; i--) {
    if (bidding[i] !== "Pass" && bidding[i] !== "Double" && bidding[i] !== "Redouble") {
      lastBidIndex = i;
      lastBid = bidding[i];
      break;
    }
  }
  
  if (lastBidIndex === -1) {
    // All passes, no contract
    return {};
  }
  
  // Check if the last bid was doubled or redoubled
  let isDoubled = false;
  let isRedoubled = false;
  
  for (let i = lastBidIndex + 1; i < bidding.length; i++) {
    if (bidding[i] === "Double") {
      isDoubled = true;
      isRedoubled = false;
    } else if (bidding[i] === "Redouble") {
      isRedoubled = true;
    }
  }
  
  // Build final contract string
  let finalContract = lastBid;
  if (isRedoubled) {
    finalContract += "XX";
  } else if (isDoubled) {
    finalContract += "X";
  }
  
  // Determine declarer
  const declarer = positions[lastBidIndex % 4];
  
  return {
    finalContract,
    declarer,
  };
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

  // Bootstrap admin user after authentication setup
  try {
    await bootstrapAdmin();
  } catch (error) {
    console.error("Error bootstrapping admin user:", error);
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

      // Check for duplicate using first hand data (unless forced)
      const isForced = req.body.force === 'true';
      if (!isForced) {
        const firstHand = parsedPBN.hands[0];
        const duplicateGame = await storage.findDuplicateByFirstHand({
          boardNumber: firstHand.boardNumber,
          dealer: firstHand.dealer,
          vulnerability: firstHand.vulnerability,
          northHand: firstHand.northHand,
          southHand: firstHand.southHand,
          eastHand: firstHand.eastHand,
          westHand: firstHand.westHand,
        });

        if (duplicateGame) {
          return res.status(409).json({ 
            error: "Duplicate game detected",
            duplicateGame,
            message: "This game appears to already exist in the system. The first hand matches an existing game."
          });
        }
      }

      // Create game
      const gameData = insertGameSchema.parse({
        title: parsedPBN.title || req.file.originalname,
        tournament: parsedPBN.tournament,
        round: parsedPBN.round,
        pbnEvent: parsedPBN.event,
        pbnSite: parsedPBN.site,
        pbnDate: parsedPBN.date,
        filename: req.file.originalname,
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

      // Add game players if specified
      const partners = req.body.partners ? JSON.parse(req.body.partners) : [];
      if (partners && partners.length > 0) {
        for (const partnerId of partners) {
          try {
            await storage.addGamePlayer({
              gameId: game.id,
              userId: partnerId,
              addedBy: userId,
            });
          } catch (error) {
            console.error(`Error adding partner ${partnerId} to game:`, error);
            // Continue with other partners
          }
        }
      }

      res.json({ game, hands });
    } catch (error) {
      console.error("Error uploading PBN:", error);
      res.status(500).json({ error: "Failed to upload PBN file" });
    }
  });

  // Game players routes
  app.get("/api/games/:gameId/players", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const players = await storage.getGamePlayers(gameId);
      res.json(players);
    } catch (error) {
      console.error("Error fetching game players:", error);
      res.status(500).json({ error: "Failed to fetch game players" });
    }
  });

  app.post("/api/games/:gameId/players", isAuthenticated, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const userId = getUserId(req);
      const { partnerId } = req.body;

      // Remove existing entry first (in case updating partner)
      await storage.removeGamePlayer(gameId, userId);

      // Add the current user to the game with partner info
      await storage.addGamePlayer({
        gameId,
        userId,
        partnerId: partnerId || null,
        addedBy: userId,
      });

      // If a partner was selected, add them too (but as a separate entry)
      if (partnerId) {
        // Remove existing partner entry first
        await storage.removeGamePlayer(gameId, partnerId);
        await storage.addGamePlayer({
          gameId,
          userId: partnerId,
          partnerId: userId, // Reciprocal partnership
          addedBy: userId,
        });
      }

      res.json({ message: "Participation marked successfully" });
    } catch (error) {
      console.error("Error adding game participation:", error);
      res.status(500).json({ error: "Failed to mark participation" });
    }
  });

  app.delete("/api/games/:gameId/players/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const userIdToRemove = req.params.userId;
      const currentUserId = getUserId(req);

      // Only allow users to remove themselves (or admins could remove anyone)
      if (userIdToRemove !== currentUserId) {
        return res.status(403).json({ error: "You can only remove your own participation" });
      }

      await storage.removeGamePlayer(gameId, userIdToRemove);
      res.json({ message: "Participation removed successfully" });
    } catch (error) {
      console.error("Error removing game participation:", error);
      res.status(500).json({ error: "Failed to remove participation" });
    }
  });

  app.get("/api/games/:gameId/my-participation", isAuthenticated, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const userId = getUserId(req);
      const participation = await storage.getCurrentUserGameData(gameId, userId);
      res.json(participation);
    } catch (error) {
      console.error("Error fetching user participation:", error);
      res.status(500).json({ error: "Failed to fetch participation data" });
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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/plain, application/octet-stream, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          // Set timeout to prevent hanging
          signal: AbortSignal.timeout(30000), // 30 seconds
        });

        if (!response.ok) {
          // Provide more specific error messages for common HTTP status codes
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          if (response.status === 403) {
            errorMessage = 'Access forbidden - the website may be blocking automated requests or require authentication';
          } else if (response.status === 404) {
            errorMessage = 'File not found - please check the URL is correct';
          } else if (response.status === 401) {
            errorMessage = 'Authentication required - this URL requires login credentials';
          } else if (response.status === 429) {
            errorMessage = 'Too many requests - please try again later';
          }
          
          throw new Error(errorMessage);
        }

        pbnContent = await response.text();
        
        // Check if response contains anti-bot protection (Cloudflare, etc.)
        if (pbnContent.includes('Just a moment...') || 
            pbnContent.includes('Please wait while we check your browser') ||
            pbnContent.includes('DDoS protection') ||
            pbnContent.includes('challenge-platform') ||
            pbnContent.includes('cf-browser-verification')) {
          throw new Error('Website is protected by anti-bot security. Please download the file manually and use the file upload option instead.');
        }
        
      } catch (error) {
        console.error("Error fetching PBN from URL:", error);
        return res.status(400).json({ 
          error: `Failed to fetch PBN file from URL: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      }

      // Basic validation - check if it contains PBN-like content
      if (!pbnContent.includes('[') || !pbnContent.includes('Deal')) {
        return res.status(400).json({ 
          error: 'File does not appear to be a valid PBN file. Make sure the URL points directly to a .pbn file.' 
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
  app.get("/api/hands/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const hand = await storage.getHand(id);
      
      if (!hand) {
        return res.status(404).json({ error: "Hand not found" });
      }
      
      // Check if user played this game
      let enhancedHand = { ...hand };
      
      if (req.user) {
        const userId = getUserId(req);
        const gameData = await storage.getCurrentUserGameData(hand.gameId, userId);
        
        if (gameData.isPlaying) {
          // Get partnership bidding for this user
          const partnershipBid = await storage.getPartnershipBidding(
            hand.id, 
            userId, 
            gameData.partner?.id
          );
          
          if (partnershipBid && partnershipBid.biddingSequence.length > 0) {
            // Calculate contract from bidding sequence
            const contract = calculateContractFromBidding(partnershipBid.biddingSequence);
            enhancedHand = {
              ...enhancedHand,
              finalContract: contract.finalContract,
              declarer: contract.declarer,
            };
          }
        }
      }
      
      res.json(enhancedHand);
    } catch (error) {
      console.error("Error fetching hand:", error);
      res.status(500).json({ error: "Failed to fetch hand" });
    }
  });

  app.get("/api/games/:gameId/hands", async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const hands = await storage.getHandsByGame(gameId);
      
      // Check if user played this game
      let userIsPlaying = false;
      let userPartner: User | undefined;
      
      if (req.user) {
        const userId = getUserId(req);
        const gameData = await storage.getCurrentUserGameData(gameId, userId);
        userIsPlaying = gameData.isPlaying;
        userPartner = gameData.partner;
      }
      
      // Enhance hands with partnership-specific contract info
      const enhancedHands = await Promise.all(
        hands.map(async (hand) => {
          if (userIsPlaying && req.user) {
            // Get partnership bidding for this user
            const userId = getUserId(req);
            const partnershipBid = await storage.getPartnershipBidding(
              hand.id, 
              userId, 
              userPartner?.id
            );
            
            if (partnershipBid && partnershipBid.biddingSequence.length > 0) {
              // Calculate contract from bidding sequence
              const contract = calculateContractFromBidding(partnershipBid.biddingSequence);
              return {
                ...hand,
                finalContract: contract.finalContract,
                declarer: contract.declarer,
              };
            }
          }
          
          return hand;
        })
      );
      
      res.json(enhancedHands);
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

  // Update hand result (admin functionality - removed bidding as it's now partnership-specific)
  app.put("/api/hands/:id/result", isAuthenticated, async (req: any, res) => {
    try {
      const handId = parseInt(req.params.id);
      const { result } = req.body;
      
      // Get the current hand
      const hand = await storage.getHand(handId);
      if (!hand) {
        return res.status(404).json({ error: "Hand not found" });
      }
      
      // Update only the result
      const updates = {
        result: result || null,
      };
      
      const updatedHand = await storage.updateHand(handId, updates);
      if (!updatedHand) {
        return res.status(404).json({ error: "Hand not found" });
      }
      
      res.json(updatedHand);
    } catch (error) {
      console.error("Error updating hand result:", error);
      res.status(500).json({ error: "Failed to update result" });
    }
  });

  // Partnership Bidding Routes
  app.post("/api/hands/:id/partnership-bidding", isAuthenticated, async (req: any, res) => {
    try {
      const handId = parseInt(req.params.id);
      const userId = getUserId(req);
      const { partnerId, biddingSequence } = req.body;

      const biddingData = insertPartnershipBiddingSchema.parse({
        handId,
        userId,
        partnerId,
        biddingSequence,
      });

      const bidding = await storage.createPartnershipBidding(biddingData);
      res.json(bidding);
    } catch (error) {
      console.error("Error creating partnership bidding:", error);
      res.status(500).json({ error: "Failed to create partnership bidding" });
    }
  });

  app.get("/api/hands/:id/partnership-bidding", isAuthenticated, async (req: any, res) => {
    try {
      const handId = parseInt(req.params.id);
      const userId = getUserId(req);
      const { partnerId } = req.query;

      const bidding = await storage.getPartnershipBidding(handId, userId, partnerId as string);
      res.json(bidding || null);
    } catch (error) {
      console.error("Error fetching partnership bidding:", error);
      res.status(500).json({ error: "Failed to fetch partnership bidding" });
    }
  });

  app.get("/api/hands/:id/all-partnership-bidding", async (req, res) => {
    try {
      const handId = parseInt(req.params.id);
      const allBidding = await storage.getAllPartnershipBiddingForHand(handId);
      res.json(allBidding);
    } catch (error) {
      console.error("Error fetching all partnership bidding:", error);
      res.status(500).json({ error: "Failed to fetch partnership bidding" });
    }
  });

  app.put("/api/partnership-bidding/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { biddingSequence } = req.body;

      const updated = await storage.updatePartnershipBidding(id, biddingSequence);
      if (!updated) {
        return res.status(404).json({ error: "Partnership bidding not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating partnership bidding:", error);
      res.status(500).json({ error: "Failed to update partnership bidding" });
    }
  });

  app.delete("/api/hands/:id/partnership-bidding", isAuthenticated, async (req: any, res) => {
    try {
      const handId = parseInt(req.params.id);
      const userId = getUserId(req);

      await storage.deletePartnershipBidding(handId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting partnership bidding:", error);
      res.status(500).json({ error: "Failed to delete partnership bidding" });
    }
  });

  app.get("/api/games/:gameId/partnership-conflicts", isAuthenticated, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const userId = getUserId(req);
      const { partnerId } = req.query;

      if (!partnerId) {
        return res.status(400).json({ error: "Partner ID is required" });
      }

      const conflicts = await storage.checkPartnershipBiddingConflicts(gameId, userId, partnerId as string);
      res.json(conflicts);
    } catch (error) {
      console.error("Error checking partnership conflicts:", error);
      res.status(500).json({ error: "Failed to check partnership conflicts" });
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

  // Game players routes
  app.get("/api/games/:gameId/players", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const players = await storage.getGamePlayers(gameId);
      res.json(players);
    } catch (error) {
      console.error("Error fetching game players:", error);
      res.status(500).json({ error: "Failed to fetch game players" });
    }
  });

  app.post("/api/games/:gameId/players", isAuthenticated, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const userId = getUserId(req);
      const { partnerId } = req.body;
      
      await storage.addGamePlayer({
        gameId,
        userId: partnerId,
        addedBy: userId,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding game player:", error);
      res.status(500).json({ error: "Failed to add game player" });
    }
  });

  app.delete("/api/games/:gameId/players/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const userIdToRemove = req.params.userId;
      
      await storage.removeGamePlayer(gameId, userIdToRemove);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing game player:", error);
      res.status(500).json({ error: "Failed to remove game player" });
    }
  });

  // Game data endpoint for partnership bidding
  app.get("/api/games/:gameId/game-data", isAuthenticated, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const userId = req.query.userId || getUserId(req);
      
      const gameData = await storage.getCurrentUserGameData(gameId, userId);
      res.json(gameData);
    } catch (error) {
      console.error("Error fetching game data:", error);
      res.status(500).json({ error: "Failed to fetch game data" });
    }
  });

  // Comments routes
  app.get("/api/hands/:handId/comments", async (req, res) => {
    try {
      const handId = parseInt(req.params.handId);
      const partnershipOnly = req.query.partnershipOnly === 'true';
      const userId = req.query.userId as string;
      
      let comments = await storage.getCommentsByHand(handId);
      
      // Filter for partnership comments if requested
      if (partnershipOnly && userId) {
        // Get user's partners
        const partners = await storage.getUserPartners(userId);
        const partnerIds = partners.map(p => p.id);
        partnerIds.push(userId); // Include user's own comments
        
        comments = comments.filter(comment => partnerIds.includes(comment.userId));
      }
      
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.userType !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Get basic system statistics
      const allUsers = await storage.getAllUsers();
      const allGames = await storage.getAllGames();
      const allHands = await storage.getAllHands();

      const stats = {
        totalUsers: allUsers.length,
        totalGames: allGames.length,
        totalHands: allHands.length,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.userType !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:id/deactivate", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.userType !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const userId = req.params.id;
      const { reason } = req.body;
      
      // Prevent admin from deactivating themselves
      if (userId === getUserId(req)) {
        return res.status(400).json({ error: "Cannot deactivate your own account" });
      }

      const success = await storage.deactivateUser(userId, reason);
      if (success) {
        res.json({ message: "User deactivated successfully" });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ error: "Failed to deactivate user" });
    }
  });

  app.post("/api/admin/users/:id/reactivate", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.userType !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const userId = req.params.id;
      
      const success = await storage.reactivateUser(userId);
      if (success) {
        res.json({ message: "User reactivated successfully" });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error reactivating user:", error);
      res.status(500).json({ error: "Failed to reactivate user" });
    }
  });

  // Update user type endpoint
  app.post("/api/admin/users/:id/user-type", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.userType !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const userId = req.params.id;
      const { userType } = req.body;
      
      // Validate user type
      const validUserTypes = ['admin', 'player', 'test'];
      if (!validUserTypes.includes(userType)) {
        return res.status(400).json({ error: "Invalid user type" });
      }

      const success = await storage.updateUserType(userId, userType);
      if (success) {
        res.json({ message: "User type updated successfully" });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user type:", error);
      res.status(500).json({ error: "Failed to update user type" });
    }
  });

  // Clean test data endpoint
  app.post("/api/admin/cleanup-test-data", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.userType !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Import and run cleanup function from database-manager
      const { deleteTestUsersAndData } = await import("../scripts/database-manager.js");
      const results = await deleteTestUsersAndData();
      
      res.json({
        message: "Test data cleanup completed successfully",
        results
      });
    } catch (error) {
      console.error("Error cleaning test data:", error);
      res.status(500).json({ error: "Failed to clean test data" });
    }
  });

  // Data integrity check endpoint
  app.get("/api/admin/integrity-check", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.userType !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { DataIntegrityChecker } = await import("../scripts/data-integrity-checker.js");
      const checker = new DataIntegrityChecker();
      const report = await checker.runFullCheck();
      
      res.json(report);
    } catch (error) {
      console.error("Error running integrity check:", error);
      res.status(500).json({ error: "Failed to run integrity check" });
    }
  });

  // Auto-fix integrity issues endpoint
  app.post("/api/admin/integrity-fix", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.userType !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { DataIntegrityChecker } = await import("../scripts/data-integrity-checker.js");
      const checker = new DataIntegrityChecker();
      
      // First run check to identify issues
      await checker.runFullCheck();
      
      // Then auto-fix orphaned records
      const fixedCount = await checker.autoFixOrphanedRecords();
      
      // Run check again to get updated report
      const finalReport = await checker.runFullCheck();
      
      res.json({
        message: `Auto-fix completed. Fixed ${fixedCount} issues.`,
        fixedCount,
        finalReport
      });
    } catch (error) {
      console.error("Error running integrity fix:", error);
      res.status(500).json({ error: "Failed to run integrity fix" });
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

  // User account management routes
  app.get("/api/user/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Partner management routes
  app.get("/api/user/partners", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const partners = await storage.getUserPartners(userId);
      res.json(partners);
    } catch (error) {
      console.error('Error getting user partners:', error);
      res.status(500).json({ error: 'Failed to get partners' });
    }
  });

  app.post("/api/user/partners", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { partnerId } = req.body;
      
      if (!partnerId) {
        return res.status(400).json({ error: 'Partner ID is required' });
      }
      
      if (userId === partnerId) {
        return res.status(400).json({ error: 'Cannot add yourself as partner' });
      }
      
      await storage.addPartner(userId, partnerId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error adding partner:', error);
      res.status(500).json({ error: 'Failed to add partner' });
    }
  });

  app.delete("/api/user/partners/:partnerId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { partnerId } = req.params;
      
      await storage.removePartner(userId, partnerId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing partner:', error);
      res.status(500).json({ error: 'Failed to remove partner' });
    }
  });

  // User search route
  app.get("/api/users/search", isAuthenticated, async (req: any, res) => {
    try {
      const { query } = req.query;
      const userId = getUserId(req);
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const users = await storage.searchUsers(query);
      // Filter out the current user from the results
      const filteredUsers = users.filter(user => user.id !== userId);
      res.json(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  });

  app.patch("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { firstName, lastName, displayName, email } = req.body;
      
      // Basic validation
      if (!firstName || !lastName || !displayName || !email) {
        return res.status(400).json({ error: "All fields are required" });
      }
      
      if (displayName.length > 20) {
        return res.status(400).json({ error: "Display name must be less than 20 characters" });
      }
      
      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "Email is already in use" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        displayName,
        email,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.patch("/api/user/password", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { currentPassword, newPassword } = req.body;
      
      // Only allow password changes for local auth users
      const user = await storage.getUser(userId);
      if (!user || user.authType !== "local") {
        return res.status(400).json({ error: "Password changes are only allowed for local accounts" });
      }
      
      // Verify current password
      if (!user.password) {
        return res.status(400).json({ error: "No password set for this account" });
      }
      const isValidPassword = await comparePasswords(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      const updatedUser = await storage.updateUser(userId, {
        password: hashedPassword,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // Partner routes
  app.get("/api/users/search", isAuthenticated, async (req: any, res) => {
    try {
      const { query } = req.query;
      const currentUserId = getUserId(req);
      
      if (!query) {
        return res.status(400).json({ error: "Search query required" });
      }
      
      const users = await storage.searchUsers(query as string);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  app.get("/api/user/partners", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const partners = await storage.getUserPartners(userId);
      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.post("/api/user/partners", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { partnerId } = req.body;
      
      if (!partnerId) {
        return res.status(400).json({ error: "Partner ID required" });
      }
      
      await storage.addPartner(userId, partnerId);
      const partner = { userId, partnerId };
      
      res.json(partner);
    } catch (error) {
      console.error("Error adding partner:", error);
      res.status(500).json({ error: "Failed to add partner" });
    }
  });

  app.delete("/api/user/partners/:partnerId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { partnerId } = req.params;
      
      await storage.removePartner(userId, partnerId);
      res.json({ message: "Partner removed successfully" });
    } catch (error) {
      console.error("Error removing partner:", error);
      res.status(500).json({ error: "Failed to remove partner" });
    }
  });

  // Game participation routes
  app.post("/api/games/:gameId/participation", isAuthenticated, async (req: any, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const userId = getUserId(req);
      const { partnerId, position } = req.body;
      
      await storage.addGamePlayer({
        gameId,
        userId,
        addedBy: userId,
      });
      const participant = { gameId, userId, partnerId: partnerId || null, position: position || null };
      
      res.json(participant);
    } catch (error) {
      console.error("Error adding game participation:", error);
      res.status(500).json({ error: "Failed to add game participation" });
    }
  });

  app.get("/api/games/:gameId/participation", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const participants = await storage.getGamePlayers(gameId);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching game participants:", error);
      res.status(500).json({ error: "Failed to fetch game participants" });
    }
  });

  // Partner comments for hand
  app.get("/api/hands/:handId/partner-comments", isAuthenticated, async (req: any, res) => {
    try {
      const handId = parseInt(req.params.handId);
      const userId = getUserId(req);
      const { partnerId } = req.query;
      
      if (!partnerId) {
        return res.status(400).json({ error: "Partner ID required" });
      }
      
      const comments = await storage.getCommentsByHand(handId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching partner comments:", error);
      res.status(500).json({ error: "Failed to fetch partner comments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
