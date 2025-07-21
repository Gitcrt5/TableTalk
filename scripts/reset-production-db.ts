// DEPRECATED: Use scripts/database-manager.ts instead
// Run: tsx scripts/database-manager.ts clean

import { resetToCleanState } from "./database-manager";

console.log("⚠️  This script is deprecated. Use database-manager.ts instead:");
console.log("   tsx scripts/database-manager.ts clean");
console.log("");
console.log("🔄 Running migration to new script...");

resetToCleanState().then(() => {
  console.log("✅ Migration completed. Please use database-manager.ts in the future.");
  process.exit(0);
}).catch(error => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});