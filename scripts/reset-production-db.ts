import { db } from "../server/db";
import { users, games, hands, comments, userBidding } from "../shared/schema";
import { hashPassword } from "../server/auth";
import { v4 as uuidv4 } from "uuid";

async function resetProductionDatabase() {
  console.log("🔄 Resetting production database...");
  
  try {
    // Delete all data in correct order (respecting foreign key constraints)
    console.log("🗑️  Deleting all existing data...");
    await db.delete(comments);
    await db.delete(userBidding);
    await db.delete(hands);
    await db.delete(games);
    await db.delete(users);
    
    console.log("✅ All data cleared successfully");
    
    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || "craig@craigandlee.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "TabletalkAdmin2025!";
    
    console.log("👤 Creating admin user...");
    const hashedPassword = await hashPassword(adminPassword);
    
    await db.insert(users).values({
      id: uuidv4(),
      email: adminEmail,
      firstName: "Craig",
      lastName: "RT",
      displayName: "CRT",
      password: hashedPassword,
      authType: "local",
      role: "admin",
      emailVerified: true,
      isActive: true
    });
    
    console.log("✅ Production database reset completed");
    console.log("🔑 Admin credentials:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log("🎉 Clean production database ready for deployment!");
    
  } catch (error) {
    console.error("❌ Failed to reset production database:", error);
    process.exit(1);
  }
}

resetProductionDatabase().then(() => process.exit(0));