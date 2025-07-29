import { db } from "../server/db";
import { 
  users, games, hands, comments, userBidding, partnershipBidding, 
  partners, gameParticipants, gamePlayers, sessions, clubs,
  gameAccess, userFavoriteClubs
} from "../shared/schema";
import { hashPassword } from "../server/auth";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { parsePBN } from "../server/services/pbn-parser";
import * as fs from "fs";
import * as path from "path";

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
  await db.delete(gameAccess);
  await db.delete(games);
  await db.delete(partners);
  await db.delete(userFavoriteClubs);
  await db.delete(clubs);
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

  // Delete games uploaded by test users (includes both regular and live games in unified system)
  for (const gameId of testGameIds) {
    await db.delete(games).where(eq(games.id, gameId));
    deletedGames++;
  }

  // Delete game access records for test games
  if (testGameIds.length > 0) {
    for (const gameId of testGameIds) {
      await db.delete(gameAccess).where(eq(gameAccess.gameId, gameId));
    }
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

async function loadSampleData(): Promise<void> {
  const sampleDir = path.join(process.cwd(), 'sample-data');
  const metadataFile = path.join(sampleDir, 'sample-data.json');
  
  // Check if directory and metadata file exist
  if (!fs.existsSync(sampleDir) || !fs.existsSync(metadataFile)) {
    console.log("ℹ️  No sample data directory found, skipping sample data");
    return;
  }
  
  console.log("📂 Loading sample data...");
  
  try {
    // Read metadata
    const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
    
    // Load users first
    const sampleUsers = metadata.users || [];
    if (sampleUsers.length > 0) {
      console.log("👥 Creating sample users...");
      let usersCreated = 0;
      
      for (const userData of sampleUsers) {
        try {
          const hashedPassword = await hashPassword(userData.password);
          await db.insert(users).values({
            id: uuidv4(),
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            displayName: userData.displayName,
            password: hashedPassword,
            authType: "local",
            userType: userData.userType || "player",
            emailVerified: true,
            isActive: true,
            featureFlags: userData.featureFlags || {}
          });
          const flags = userData.featureFlags ? Object.entries(userData.featureFlags).filter(([_, v]) => v).map(([k]) => k).join(', ') : 'none';
          console.log(`✅ Created user: ${userData.email} (${userData.userType}) - flags: ${flags}`);
          usersCreated++;
        } catch (error) {
          console.log(`⚠️  Failed to create user ${userData.email}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      if (usersCreated > 0) {
        console.log(`✅ Successfully created ${usersCreated} sample users`);
      }
    }
    
    // Load games
    const sampleGames = metadata.games || [];
    let gamesLoaded = 0;
    
    for (const sampleGame of sampleGames) {
      const pbnPath = path.join(sampleDir, sampleGame.file);
      
      if (!fs.existsSync(pbnPath)) {
        console.log(`⚠️  PBN file not found: ${sampleGame.file}`);
        continue;
      }
      
      // Get uploader
      let uploader;
      if (sampleGame.uploadedBy === 'random') {
        // Get random test user
        const testUsers = await db.select().from(users).where(eq(users.userType, 'test'));
        if (testUsers.length > 0) {
          uploader = testUsers[Math.floor(Math.random() * testUsers.length)];
        } else {
          // Fallback to admin if no test users
          [uploader] = await db.select().from(users).where(eq(users.email, 'admin@tabletalk.cards'));
        }
      } else {
        // Try to find specified user
        [uploader] = await db.select().from(users).where(eq(users.email, sampleGame.uploadedBy));
        
        if (!uploader) {
          console.log(`⚠️  User ${sampleGame.uploadedBy} not found, using admin`);
          [uploader] = await db.select().from(users).where(eq(users.email, 'admin@tabletalk.cards'));
        }
      }
      
      if (!uploader) {
        console.log(`⚠️  Could not find uploader for ${sampleGame.file}, skipping`);
        continue;
      }
      
      // Read and parse PBN
      const pbnContent = fs.readFileSync(pbnPath, 'utf-8');
      const parsedPBN = parsePBN(pbnContent);
      
      if (!parsedPBN.hands || parsedPBN.hands.length === 0) {
        console.log(`⚠️  No hands found in ${sampleGame.file}, skipping`);
        continue;
      }
      
      // Create game
      const [game] = await db.insert(games).values({
        title: sampleGame.title || parsedPBN.title || sampleGame.file,
        tournament: parsedPBN.tournament,
        round: parsedPBN.round,
        pbnEvent: parsedPBN.event,
        pbnSite: parsedPBN.site,
        pbnDate: parsedPBN.date,
        date: sampleGame.date || null,
        location: sampleGame.location || null,
        event: parsedPBN.event,
        filename: sampleGame.file,
        uploadedBy: uploader.id,
        pbnContent: pbnContent,
      }).returning();
      
      // Create hands
      for (const handData of parsedPBN.hands) {
        await db.insert(hands).values({
          gameId: game.id,
          ...handData
        });
      }
      
      console.log(`✅ Loaded ${sampleGame.file} (${parsedPBN.hands.length} hands) - uploaded by ${uploader.displayName || uploader.email}`);
      gamesLoaded++;
    }
    
    if (gamesLoaded > 0) {
      console.log(`✅ Successfully loaded ${gamesLoaded} sample games`);
    } else {
      console.log("ℹ️  No sample games were loaded");
    }
    
  } catch (error) {
    console.error("❌ Error loading sample data:", error);
  }
}

export async function resetToCleanState(): Promise<void> {
  console.log("🔄 Resetting database to clean state...");
  
  await clearAllTables();
  await createAdminUser();
  
  // Load sample data (users and games) if available
  await loadSampleData();
  
  console.log("✅ Database reset completed");
  console.log("🎉 Clean database ready for use!");
}

export async function resetWithTestData(): Promise<void> {
  console.log("🔄 Resetting database with test data...");
  
  await clearAllTables();
  await createAdminUser();
  
  // Load sample data (same as clean command)
  await loadSampleData();
  
  console.log("✅ Database reset with test data completed!");
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
        console.log("  clean   - Reset to clean state (admin user + sample data)");
        console.log("  test    - Same as clean (loads admin + sample data)");
        console.log("  cleanup - Delete only test users and their data");
        console.log("  clear   - Clear all tables (dangerous!)");
        console.log("");
        console.log("Examples:");
        console.log("  tsx scripts/database-manager.ts clean");
        console.log("  tsx scripts/database-manager.ts test");
        console.log("  tsx scripts/database-manager.ts cleanup");
        console.log("");
        console.log("Note: Both 'clean' and 'test' commands load sample users");
        console.log("      and games from sample-data/ directory if present");
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