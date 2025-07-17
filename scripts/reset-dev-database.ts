import { db } from "../server/db";
import { users, games, hands, comments, userBidding } from "../shared/schema";
import { hashPassword } from "../server/auth";
import { v4 as uuidv4 } from "uuid";

async function resetDevDatabase() {
  console.log("🔄 Resetting development database...");
  
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
    const adminEmail = "craig@craigandlee.com";
    const adminPassword = "TabletalkAdmin2025!";
    
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
    
    console.log("✅ Development database reset completed");
    console.log("🔑 Admin credentials:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    
    // Option to seed with test data
    console.log("\n💡 To add test data, run:");
    console.log("   NODE_ENV=development tsx scripts/seed-dev-data.ts");
    
  } catch (error) {
    console.error("❌ Failed to reset development database:", error);
    process.exit(1);
  }
}

resetDevDatabase().then(() => process.exit(0));