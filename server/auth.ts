import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

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

export function setupLocalAuth(app: Express) {
  // Use in-memory session store for development debugging
  const MemoryStore = session.MemoryStore;
  const sessionStore = new MemoryStore();

  // Handle session store errors
  sessionStore.on('error', (error) => {
    console.error('Session store error:', error);
  });

  // Configure session based on environment
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "fallback-secret-for-development",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    name: 'connect.sid',
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    },
  };

  // Don't trust proxy for development to avoid session issues
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email", // Use email instead of username
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || user.authType !== "local" || !user.password) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValidPassword = await comparePasswords(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid email or password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log("Deserializing user:", id);
      const user = await storage.getUser(id);
      console.log("Found user:", user ? user.id : "null");
      done(null, user || false);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(null, false);
    }
  });

  // Local authentication routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create new user with local auth
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.upsertUser({
        id: uuidv4(),
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        authType: "local",
        profileImageUrl: null,
      });

      // Log the user in
      req.login(newUser, (err) => {
        if (err) return next(err);
        
        // Ensure session is saved before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error during registration:", saveErr);
            return next(saveErr);
          }
          
          console.log("User registered and logged in successfully:", newUser.id);
          console.log("Session ID after registration:", req.sessionID);
          
          res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            displayName: newUser.displayName,
            authType: newUser.authType,
          });
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }

      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return next(err);
        }
        
        // Ensure session is saved before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return next(saveErr);
          }
          
          console.log("User logged in successfully:", user.id);
          console.log("Session ID after login:", req.sessionID);
          console.log("Session saved successfully");
          
          res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            authType: user.authType,
          });
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }
    
    const user = req.user;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      authType: user.authType,
    });
  });
}