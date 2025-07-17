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
import { db } from "./db";
import { users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { emailService, generateEmailToken, isValidEmail } from "./email-service";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Bootstrap admin user based on environment variables or make first user admin
export async function bootstrapAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "craig@craigandlee.com";
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // Check if admin user already exists
  const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  
  if (existingAdmin.length > 0) {
    // If admin exists but doesn't have admin role, update it
    if (existingAdmin[0].role !== "admin") {
      await db.update(users).set({ role: "admin" }).where(eq(users.email, adminEmail));
      console.log(`Updated ${adminEmail} to admin role`);
    }
    return;
  }
  
  // If admin email is set but no password, don't auto-create
  if (!adminPassword) {
    console.log(`Admin email ${adminEmail} set but no ADMIN_PASSWORD provided. Admin will be created when user registers.`);
    return;
  }
  
  // Create admin user
  const hashedPassword = await hashPassword(adminPassword);
  const adminUser = {
    id: uuidv4(),
    email: adminEmail,
    firstName: "Craig",
    lastName: "Admin",
    displayName: "Craig",
    password: hashedPassword,
    authType: "local" as const,
    role: "admin" as const,
  };
  
  await db.insert(users).values(adminUser);
  console.log(`Created admin user: ${adminEmail}`);
}

// Check if user should be made admin (first user or specific email)
export async function checkForAutoAdmin(email: string) {
  const adminEmail = process.env.ADMIN_EMAIL || "craig@craigandlee.com";
  
  // Make specific email admin
  if (email === adminEmail) {
    return "admin";
  }
  
  // Check if this is the first user (fallback)
  const userCount = await db.select().from(users).limit(2);
  if (userCount.length === 0) {
    return "admin";
  }
  
  return "player";
}

export function setupLocalAuth(app: Express) {
  // Use in-memory session store for reliability
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

      // Validate email format
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Generate email verification token
      const verificationToken = generateEmailToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create new user with local auth
      const hashedPassword = await hashPassword(password);
      const userRole = await checkForAutoAdmin(email);
      const newUser = await storage.upsertUser({
        id: uuidv4(),
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        authType: "local",
        profileImageUrl: null,
        role: userRole,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      });

      // Send verification email
      try {
        await emailService.sendVerificationEmail(
          email, 
          verificationToken, 
          firstName || undefined
        );
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue with registration even if email fails
      }

      // Log the user in (they can use the app but will see verification prompt)
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
            role: newUser.role,
            emailVerified: newUser.emailVerified,
            message: "Account created successfully. Please check your email to verify your account.",
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
            role: user.role,
            emailVerified: user.emailVerified,
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
    
    // Add strong cache headers to prevent 1Password from treating this as a login form
    res.set('Cache-Control', 'private, max-age=1800, must-revalidate'); // Cache for 30 minutes
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('Pragma', 'no-cache');
    res.set('X-Robots-Tag', 'noindex, nofollow');
    res.set('Referrer-Policy', 'same-origin');
    
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      authType: user.authType,
      role: user.role,
      emailVerified: user.emailVerified,
    });
  });

  // Email verification routes
  app.get("/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      // Find user by verification token
      const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token as string));
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Check if token is expired
      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        return res.status(400).json({ message: "Verification token has expired" });
      }

      // Update user as verified
      await db.update(users)
        .set({ 
          emailVerified: true, 
          emailVerificationToken: null, 
          emailVerificationExpires: null 
        })
        .where(eq(users.id, user.id));

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(user.email!, user.firstName || undefined);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }

      res.json({ message: "Email verified successfully!" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/resend-verification", async (req, res) => {
    try {
      console.log("Resend verification request - isAuthenticated:", req.isAuthenticated());
      console.log("Resend verification request - user:", req.user ? "present" : "not present");
      
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = req.user;
      console.log("User email verified status:", user.emailVerified);
      
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification token
      const verificationToken = generateEmailToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new token
      await db.update(users)
        .set({ 
          emailVerificationToken: verificationToken, 
          emailVerificationExpires: verificationExpires 
        })
        .where(eq(users.id, user.id));

      // Send verification email
      try {
        await emailService.sendVerificationEmail(
          user.email!, 
          verificationToken, 
          user.firstName || undefined
        );
        console.log("Verification email sent successfully to:", user.email);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      res.json({ message: "Verification email sent successfully" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Password reset routes
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Validate email format
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If that email exists, we've sent a password reset link." });
      }

      // Only allow password reset for local auth users
      if (user.authType !== "local") {
        return res.status(400).json({ message: "Password reset is only available for local accounts" });
      }

      // Generate password reset token
      const resetToken = generateEmailToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update user with reset token
      await db.update(users)
        .set({ 
          passwordResetToken: resetToken, 
          passwordResetExpires: resetExpires 
        })
        .where(eq(users.id, user.id));

      // Send password reset email
      try {
        await emailService.sendPasswordResetEmail(
          user.email!, 
          resetToken, 
          user.firstName || undefined
        );
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
        return res.status(500).json({ message: "Failed to send password reset email" });
      }

      res.json({ message: "If that email exists, we've sent a password reset link." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Find user by reset token
      const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password and clear reset token
      await db.update(users)
        .set({ 
          password: hashedPassword,
          passwordResetToken: null, 
          passwordResetExpires: null 
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}