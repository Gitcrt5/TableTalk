#!/usr/bin/env tsx
import { db } from "../server/db";
import { users } from "../shared/schema";
import { hashPassword } from "../server/auth";
import { eq } from "drizzle-orm";

/**
 * Setup production database with admin user
 * This script creates the admin user in production
 */
async function setupProductionDb() {
  console.log("🔧 Setting up production database...");
  
  // Get admin credentials from environment
  const adminEmail = process.env.ADMIN_EMAIL || "admin@tabletalk.cards";
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    console.error("❌ ADMIN_PASSWORD environment variable is required");
    console.error("   Set ADMIN_PASSWORD in your production environment");
    process.exit(1);
  }

  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    
    if (existingAdmin.length > 0) {
      console.log("👤 Admin user already exists:", adminEmail);
      console.log("   Updating admin role and password...");
      
      // Update existing user to admin with new password
      await db.update(users)
        .set({
          role: "admin",
          password: await hashPassword(adminPassword),
          emailVerified: true,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.email, adminEmail));
        
      console.log("✅ Admin user updated successfully");
    } else {
      console.log("👤 Creating admin user:", adminEmail);
      
      // Create new admin user
      await db.insert(users).values({
        id: `admin-${Date.now()}`,
        email: adminEmail,
        firstName: "TableTalk",
        lastName: "Admin",
        displayName: "Admin",
        password: await hashPassword(adminPassword),
        role: "admin",
        authType: "local",
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log("✅ Admin user created successfully");
    }
    
    console.log("🎯 Production database setup completed");
    console.log("🔑 Admin credentials:");
    console.log(`   Email: ${adminEmail}`);
    console.log("   Password: [Set via ADMIN_PASSWORD environment variable]");
    
  } catch (error) {
    console.error("❌ Setup failed:", error);
    console.error("🔧 Troubleshooting:");
    console.error("   1. Check DATABASE_URL is set correctly");
    console.error("   2. Ensure database is accessible");
    console.error("   3. Verify ADMIN_PASSWORD is set");
    console.error("   4. Check database permissions");
    process.exit(1);
  }
}

// Run the setup
setupProductionDb().then(() => {
  console.log("🎉 Production database setup completed!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Production setup failed:", error);
  process.exit(1);
});