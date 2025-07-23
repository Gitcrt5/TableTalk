import { db } from "../server/db";
import { 
  users, games, hands, comments, userBidding, partnershipBidding, 
  partners, gameParticipants, gamePlayers, sessions 
} from "../shared/schema";
import { hashPassword } from "../server/auth";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

/**
 * Comprehensive database management utility
 * Combines and updates all previous database scripts
 */

export async function clearAllTables() {
  console.log("🗑️  Clearing all tables...");
  
  // Delete in correct order to respect foreign key constraints
  await db.delete(comments);
  await db.delete(partnershipBidding);
  await db.delete(userBidding);
  await db.delete(hands);
  await db.delete(gamePlayers);
  await db.delete(gameParticipants);
  await db.delete(games);
  await db.delete(partners);
  await db.delete(sessions);
  await db.delete(users);
  
  console.log("✅ All tables cleared");
}

export async function createAdminUser(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@tabletalk.cards";
  const adminPassword = process.env.ADMIN_PASSWORD || "TabletalkAdmin2025!";
  
  console.log("👤 Creating admin user...");
  const hashedPassword = await hashPassword(adminPassword);
  
  await db.insert(users).values({
    id: uuidv4(),
    email: adminEmail,
    firstName: "TableTalk",
    lastName: "Admin",
    displayName: "Admin",
    password: hashedPassword,
    authType: "local",
    userType: "admin", // Updated to use userType instead of role
    emailVerified: true,
    isActive: true
  });
  
  console.log("✅ Admin user created");
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
}

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
  const testGames = await db.select({ id: games.id, uploadedBy: games.uploadedBy }).from(games);
  const testGameIds = testGames.filter(g => testUserIds.includes(g.uploadedBy)).map(g => g.id);

  let deletedComments = 0;
  let deletedHands = 0;
  let deletedGames = 0;

  // Delete in proper order
  if (testGameIds.length > 0) {
    // Get hands from test games
    const testHands = await db.select({ id: hands.id, gameId: hands.gameId }).from(hands);
    const testHandIds = testHands.filter(h => testGameIds.includes(h.gameId)).map(h => h.id);
    
    if (testHandIds.length > 0) {
      // Delete comments on these hands
      const commentsToDelete = await db.select({ id: comments.id, handId: comments.handId }).from(comments);
      const commentsOnTestHands = commentsToDelete.filter(c => testHandIds.includes(c.handId));
      
      for (const comment of commentsOnTestHands) {
        await db.delete(comments).where(eq(comments.id, comment.id));
        deletedComments++;
      }
      
      // Delete partnership bidding on these hands
      const partnershipBiddingToDelete = await db.select({ id: partnershipBidding.id, handId: partnershipBidding.handId }).from(partnershipBidding);
      const biddingOnTestHands = partnershipBiddingToDelete.filter(b => testHandIds.includes(b.handId));
      
      for (const bidding of biddingOnTestHands) {
        await db.delete(partnershipBidding).where(eq(partnershipBidding.id, bidding.id));
      }
      
      // Delete user bidding on these hands
      const userBiddingToDelete = await db.select({ id: userBidding.id, handId: userBidding.handId }).from(userBidding);
      const userBiddingOnTestHands = userBiddingToDelete.filter(b => testHandIds.includes(b.handId));
      
      for (const bidding of userBiddingOnTestHands) {
        await db.delete(userBidding).where(eq(userBidding.id, bidding.id));
      }
    }
    
    // Delete hands
    for (const handId of testHandIds) {
      await db.delete(hands).where(eq(hands.id, handId));
      deletedHands++;
    }
    
    // Delete game participants
    const gameParticipantsToDelete = await db.select({ id: gameParticipants.id, gameId: gameParticipants.gameId }).from(gameParticipants);
    const participantsOnTestGames = gameParticipantsToDelete.filter(p => testGameIds.includes(p.gameId));
    
    for (const participant of participantsOnTestGames) {
      await db.delete(gameParticipants).where(eq(gameParticipants.id, participant.id));
    }
    
    // Delete game players
    const gamePlayersToDelete = await db.select({ id: gamePlayers.id, gameId: gamePlayers.gameId }).from(gamePlayers);
    const playersOnTestGames = gamePlayersToDelete.filter(p => testGameIds.includes(p.gameId));
    
    for (const player of playersOnTestGames) {
      await db.delete(gamePlayers).where(eq(gamePlayers.id, player.id));
    }
  }

  // Delete games uploaded by test users
  for (const gameId of testGameIds) {
    await db.delete(games).where(eq(games.id, gameId));
    deletedGames++;
  }
  
  // Delete partner relationships involving test users
  const partnersToDelete = await db.select({ id: partners.id, userId: partners.userId, partnerId: partners.partnerId }).from(partners);
  const testPartners = partnersToDelete.filter(p => 
    testUserIds.includes(p.userId) || testUserIds.includes(p.partnerId)
  );
  
  for (const partner of testPartners) {
    await db.delete(partners).where(eq(partners.id, partner.id));
  }

  // Delete comments by test users on any hands
  const allComments = await db.select({ id: comments.id, userId: comments.userId }).from(comments);
  const testUserComments = allComments.filter(c => testUserIds.includes(c.userId));
  
  for (const comment of testUserComments) {
    await db.delete(comments).where(eq(comments.id, comment.id));
    deletedComments++;
  }

  // Delete test users
  for (const userId of testUserIds) {
    await db.delete(users).where(eq(users.id, userId));
  }
  const deletedUsers = testUserIds.length;

  console.log("✅ Test data cleanup completed:");
  console.log(`   - ${deletedUsers} test users deleted`);
  console.log(`   - ${deletedGames} games deleted`);
  console.log(`   - ${deletedHands} hands deleted`);
  console.log(`   - ${deletedComments} comments deleted`);

  return { deletedUsers, deletedGames, deletedHands, deletedComments };
}

export async function resetToCleanState(): Promise<void> {
  console.log("🔄 Resetting database to clean state...");
  
  await clearAllTables();
  await createAdminUser();
  
  console.log("✅ Database reset completed");
  console.log("🎉 Clean database ready for use!");
}

export async function resetWithTestData(): Promise<void> {
  console.log("🔄 Resetting database with test data...");
  
  await clearAllTables();
  await createAdminUser();
  
  // Create test users
  console.log("👥 Creating test users...");
  const testUsers = [
    {
      id: uuidv4(),
      email: "a@test.com",
      firstName: "Alice",
      lastName: "Player",
      displayName: "PlayerA",
      password: await hashPassword("test123"),
      authType: "local" as const,
      userType: "test" as const,
      emailVerified: true,
      isActive: true
    },
    {
      id: uuidv4(),
      email: "b@test.com",
      firstName: "Bob",
      lastName: "Grobble",
      displayName: "PlayerB",
      password: await hashPassword("test123"),
      authType: "local" as const,
      userType: "test" as const,
      emailVerified: true,
      isActive: true
    },
    {
      id: uuidv4(),
      email: "c@test.com",
      firstName: "Cindy",
      lastName: "Brady",
      displayName: "PlayerC",
      password: await hashPassword("test123"),
      authType: "local" as const,
      userType: "test" as const,
      emailVerified: true,
      isActive: true
    },
    {
      id: uuidv4(),
      email: "d@test.com",
      firstName: "Don",
      lastName: "Bradman",
      displayName: "PlayerD",
      password: await hashPassword("test123"),
      authType: "local" as const,
      userType: "test" as const,
      emailVerified: true,
      isActive: true
    },
{
      id: uuidv4(),
      email: "bob@test.com",
      firstName: "Boba",
      lastName: "Fett",
      displayName: "Bob",
      password: await hashPassword("test123"),
      authType: "local" as const,
      userType: "test" as const,
      emailVerified: true,
      isActive: true
    }
  ];
  
  for (const user of testUsers) {
    await db.insert(users).values(user);
  }
  
  console.log("✅ Test users created");
  
  // Create sample game with hands uploaded by first test user
  console.log("🎮 Creating sample game with hands...");
  
  const sampleGame = {
    title: "Friday Evening Duplicate",
    tournament: "Club Championship",
    round: "Round 1",
    date: "2025-01-17",
    location: "Bridge Club",
    event: "Club Game",
    pbnEvent: "Club Championship",
    pbnSite: "Local Bridge Club", 
    pbnDate: "2025.01.17",
    filename: "sample_game.pbn",
    uploadedBy: testUsers[0].id,
    uploadedAt: new Date("2025-01-17T19:30:00Z"),
    pbnContent: `[Event "Club Championship"]
[Site "Local Bridge Club"]
[Date "2025.01.17"]
[Board "1"]
[West "PlayerA"]
[North "PlayerB"] 
[East "PlayerC"]
[South "PlayerD"]
[Dealer "N"]
[Vulnerable "None"]
[Deal "N:AK32.QJ9.K87.A65 T987.A643.A92.K4 QJ65.K852.QT3.Q7 4.T7.J654.JT9832"]
[Scoring "MP"]
[Declarer "N"]
[Contract "3NT"]
[Result "9"]

[Board "2"]
[West "PlayerB"]
[North "PlayerC"]
[East "PlayerD"] 
[South "PlayerA"]
[Dealer "E"]
[Vulnerable "NS"]
[Deal "E:K987.A5.KJ83.A42 AQJ6.KQ94.A7.QT5 T542.J862.T652.K6 3.T73.Q94.J98763"]
[Scoring "MP"]
[Declarer "S"]
[Contract "4S"]
[Result "10"]

[Board "3"]
[West "PlayerC"]
[North "PlayerD"]
[East "PlayerA"]
[South "PlayerB"]
[Dealer "S"] 
[Vulnerable "EW"]
[Deal "S:AJ85.KQ7.A94.K83 K432.A954.KJ7.A4 QT76.J82.Q865.Q9 9.T63.T32.JT7652"]
[Scoring "MP"]
[Declarer "N"]
[Contract "3NT"]
[Result "9"]

[Board "4"]
[West "PlayerD"]
[North "PlayerA"]
[East "PlayerB"]
[South "PlayerC"]
[Dealer "W"]
[Vulnerable "All"]
[Deal "W:KQJ9.A83.K74.AQ2 A652.KJ95.A83.K4 T874.Q642.QJ9.T6 3.T7.T652.J98753"]
[Scoring "MP"]
[Declarer "W"]
[Contract "4S"]
[Result "10"]`
  };

  const [createdGame] = await db.insert(games).values(sampleGame).returning();
  
  // Create sample hands for the game
  const sampleHands = [
    {
      gameId: createdGame.id,
      boardNumber: 1,
      dealer: "N",
      vulnerability: "None",
      northHand: "AK32.QJ9.K87.A65",
      southHand: "4.T7.J654.JT9832", 
      eastHand: "QJ65.K852.QT3.Q7",
      westHand: "T987.A643.A92.K4",
      finalContract: "3NT",
      declarer: "N",
      result: "9"
    },
    {
      gameId: createdGame.id,
      boardNumber: 2,
      dealer: "E", 
      vulnerability: "NS",
      northHand: "AQJ6.KQ94.A7.QT5",
      southHand: "3.T73.Q94.J98763",
      eastHand: "K987.A5.KJ83.A42",
      westHand: "T542.J862.T652.K6",
      finalContract: "4S",
      declarer: "S", 
      result: "10"
    },
    {
      gameId: createdGame.id,
      boardNumber: 3,
      dealer: "S",
      vulnerability: "EW", 
      northHand: "K432.A954.KJ7.A4",
      southHand: "AJ85.KQ7.A94.K83",
      eastHand: "QT76.J82.Q865.Q9",
      westHand: "9.T63.T32.JT7652",
      finalContract: "3NT",
      declarer: "N",
      result: "9"
    },
    {
      gameId: createdGame.id,
      boardNumber: 4,
      dealer: "W",
      vulnerability: "All",
      northHand: "A652.KJ95.A83.K4", 
      southHand: "3.T7.T652.J98753",
      eastHand: "T874.Q642.QJ9.T6",
      westHand: "KQJ9.A83.K74.AQ2",
      finalContract: "4S",
      declarer: "W",
      result: "10"
    }
  ];
  
  for (const hand of sampleHands) {
    await db.insert(hands).values(hand);
  }
  
  console.log("✅ Sample game and hands created");
  console.log("🎉 Database reset with test data completed!");
}

// Command line interface
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case "clean":
        await resetToCleanState();
        break;
      case "test":
        await resetWithTestData();
        break;
      case "cleanup":
        await deleteTestUsersAndData();
        break;
      case "clear":
        await clearAllTables();
        break;
      default:
        console.log("📖 Database Manager Usage:");
        console.log("");
        console.log("Commands:");
        console.log("  clean   - Reset to clean state (admin user only)");
        console.log("  test    - Reset with test data (admin + test users)");
        console.log("  cleanup - Delete only test users and their data");
        console.log("  clear   - Clear all tables (dangerous!)");
        console.log("");
        console.log("Examples:");
        console.log("  tsx scripts/database-manager.ts clean");
        console.log("  tsx scripts/database-manager.ts test");
        console.log("  tsx scripts/database-manager.ts cleanup");
        break;
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(() => process.exit(0));
}