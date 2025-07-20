import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, games, hands, comments } from "../shared/schema.js";
import { eq, inArray } from "drizzle-orm";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Use the DATABASE_URL directly
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

/**
 * Delete all test users and their associated data
 * This includes: games they uploaded, hands from those games, and comments they made
 */
export async function deleteTestUsersAndData(): Promise<{
  deletedUsers: number;
  deletedGames: number;
  deletedHands: number;
  deletedComments: number;
}> {
  console.log("🧹 Starting test data cleanup...");

  // Get all test users
  const testUsers = await db.select({ id: users.id }).from(users).where(eq(users.userType, 'test'));
  const testUserIds = testUsers.map(u => u.id);
  
  if (testUserIds.length === 0) {
    console.log("ℹ️  No test users found to delete");
    return { deletedUsers: 0, deletedGames: 0, deletedHands: 0, deletedComments: 0 };
  }

  console.log(`🔍 Found ${testUserIds.length} test users to delete`);

  // Get games uploaded by test users
  const testGames = await db.select({ id: games.id }).from(games).where(
    inArray(games.uploadedBy, testUserIds)
  );
  const testGameIds = testGames.map(g => g.id);

  let deletedComments = 0;
  let deletedHands = 0;
  let deletedGames = 0;

  // Delete comments by test users (on any games)
  if (testUserIds.length > 0) {
    const commentsResult = await db.delete(comments).where(
      inArray(comments.userId, testUserIds)
    );
    deletedComments += commentsResult.rowCount || 0;
  }

  // Delete comments on games uploaded by test users (by any users)
  if (testGameIds.length > 0) {
    // Get hands from test games first
    const testHands = await db.select({ id: hands.id }).from(hands).where(
      inArray(hands.gameId, testGameIds)
    );
    const testHandIds = testHands.map(h => h.id);
    
    if (testHandIds.length > 0) {
      const gameCommentsResult = await db.delete(comments).where(
        inArray(comments.handId, testHandIds)
      );
      deletedComments += gameCommentsResult.rowCount || 0;
    }
  }

  // Delete hands from games uploaded by test users
  if (testGameIds.length > 0) {
    const handsResult = await db.delete(hands).where(
      inArray(hands.gameId, testGameIds)
    );
    deletedHands = handsResult.rowCount || 0;
  }

  // Delete games uploaded by test users
  if (testGameIds.length > 0) {
    const gamesResult = await db.delete(games).where(
      inArray(games.id, testGameIds)
    );
    deletedGames = gamesResult.rowCount || 0;
  }

  // Delete test users
  const usersResult = await db.delete(users).where(eq(users.userType, 'test'));
  const deletedUsers = usersResult.rowCount || 0;

  console.log("✅ Test data cleanup completed:");
  console.log(`   - ${deletedUsers} test users deleted`);
  console.log(`   - ${deletedGames} games deleted`);
  console.log(`   - ${deletedHands} hands deleted`);
  console.log(`   - ${deletedComments} comments deleted`);

  return { deletedUsers, deletedGames, deletedHands, deletedComments };
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await deleteTestUsersAndData();
    console.log("🎉 Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}