import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../server/auth";

async function updateAdminPassword() {
  const adminEmail = "craig@craigandlee.com";
  const newPassword = "TabletalkAdmin2025!";
  
  try {
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update admin user password
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, adminEmail));
      
    console.log("✅ Admin password updated successfully");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${newPassword}`);
    
  } catch (error) {
    console.error("❌ Failed to update admin password:", error);
  }
}

updateAdminPassword().then(() => process.exit(0));