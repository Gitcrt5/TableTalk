#!/usr/bin/env tsx
import { db } from "../server/db";
import { users, games, hands, comments, userBidding } from "../shared/schema";
import { hashPassword } from "../server/auth";
import { eq } from "drizzle-orm";

/**
 * Seed development database with test data
 * This script is only for development environments
 */
async function seedDevData() {
  console.log("🌱 Seeding development database...");
  
  // Only run in development
  if (process.env.NODE_ENV === 'production') {
    console.log("❌ Cannot seed data in production environment");
    process.exit(1);
  }

  try {
    // Create test users
    const testUsers = [
      {
        id: "alice-test-user",
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Johnson",
        displayName: "Alice_J",
        password: await hashPassword("password123"),
        role: "player",
        authType: "local",
        emailVerified: true,
        isActive: true,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
      {
        id: "bob-test-user",
        email: "bob@example.com",
        firstName: "Bob",
        lastName: "Smith",
        displayName: "Bobby_S",
        password: await hashPassword("password123"),
        role: "player",
        authType: "local",
        emailVerified: true,
        isActive: true,
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-20"),
      },
      {
        id: "carol-test-user",
        email: "carol@example.com",
        firstName: "Carol",
        lastName: "Wilson",
        displayName: "Carol_W",
        password: await hashPassword("password123"),
        role: "teacher",
        authType: "local",
        emailVerified: true,
        isActive: true,
        createdAt: new Date("2024-01-25"),
        updatedAt: new Date("2024-01-25"),
      },
      {
        id: "david-test-user",
        email: "david@example.com",
        firstName: "David",
        lastName: "Brown",
        displayName: "Dave_B",
        password: await hashPassword("password123"),
        role: "player",
        authType: "local",
        emailVerified: true,
        isActive: true,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
      },
    ];

    // Insert test users
    for (const user of testUsers) {
      await db.insert(users).values(user).onConflictDoUpdate({
        target: users.id,
        set: user,
      });
    }

    // Create sample games
    const sampleGames = [
      {
        id: 1,
        title: "Saturday Morning Pairs",
        tournament: "Club Championship",
        round: "Round 1",
        date: "2024-02-15",
        location: "Bridge Club",
        event: "Pairs Tournament",
        filename: "saturday_pairs.pbn",
        uploadedBy: "alice-test-user",
        uploadedAt: new Date("2024-02-15"),
        pbnContent: "[Event \"Saturday Morning Pairs\"]\\n[Date \"2024.02.15\"]\\n[Board \"1\"]\\n[Deal \"N:A.K.Q.J.2.3.4.5.6.7.8.9.T\"]",
      },
      {
        id: 2,
        title: "Wednesday Evening Duplicate",
        tournament: "Weekly Duplicate",
        round: "Round 2",
        date: "2024-02-20",
        location: "Community Center",
        event: "Duplicate Bridge",
        filename: "wednesday_duplicate.pbn",
        uploadedBy: "bob-test-user",
        uploadedAt: new Date("2024-02-20"),
        pbnContent: "[Event \"Wednesday Evening Duplicate\"]\\n[Date \"2024.02.20\"]\\n[Board \"1\"]\\n[Deal \"N:A.K.Q.J.2.3.4.5.6.7.8.9.T\"]",
      },
    ];

    // Insert sample games
    for (const game of sampleGames) {
      await db.insert(games).values(game).onConflictDoUpdate({
        target: games.id,
        set: game,
      });
    }

    // Create sample hands
    const sampleHands = [
      {
        id: 1,
        gameId: 1,
        boardNumber: 1,
        dealer: "North",
        vulnerability: "None",
        northHand: "AK432.QJ5.87.KQ6",
        southHand: "QJ87.A1094.QJ2.A3",
        eastHand: "T95.K876.A965.J7",
        westHand: "6.32.KT43.T98542",
        actualBidding: ["1S", "Pass", "2H", "Pass", "2S", "Pass", "4S", "Pass", "Pass", "Pass"],
        finalContract: "4S",
        declarer: "North",
        result: "Made",
      },
      {
        id: 2,
        gameId: 1,
        boardNumber: 2,
        dealer: "East",
        vulnerability: "N-S",
        northHand: "J8765.AQ4.K3.A92",
        southHand: "AKQ2.J52.AQ4.KJ3",
        eastHand: "T43.K9876.J987.Q",
        westHand: "9.T3.T652.T87654",
        actualBidding: ["Pass", "Pass", "1NT", "Pass", "3NT", "Pass", "Pass", "Pass"],
        finalContract: "3NT",
        declarer: "South",
        result: "Made+1",
      },
    ];

    // Insert sample hands
    for (const hand of sampleHands) {
      await db.insert(hands).values(hand).onConflictDoUpdate({
        target: hands.id,
        set: hand,
      });
    }

    // Create sample comments
    const sampleComments = [
      {
        id: 1,
        handId: 1,
        userId: "carol-test-user",
        userName: "Carol_W",
        userLevel: "Teacher",
        content: "Great bidding sequence! The 2H response showing support was key to reaching the game contract.",
        likes: 2,
        createdAt: new Date("2024-02-16"),
      },
      {
        id: 2,
        handId: 1,
        userId: "david-test-user",
        userName: "Dave_B",
        userLevel: "Player",
        content: "I would have bid 3S directly instead of 2S. What do you think?",
        likes: 1,
        createdAt: new Date("2024-02-17"),
      },
      {
        id: 3,
        handId: 2,
        userId: "alice-test-user",
        userName: "Alice_J",
        userLevel: "Player",
        content: "Nice 3NT bid! The 15-17 HCP range with balanced distribution made this an easy choice.",
        likes: 3,
        createdAt: new Date("2024-02-21"),
      },
    ];

    // Insert sample comments
    for (const comment of sampleComments) {
      await db.insert(comments).values(comment).onConflictDoUpdate({
        target: comments.id,
        set: comment,
      });
    }

    console.log("✅ Development database seeded successfully!");
    console.log("📊 Created:");
    console.log("   - 4 test users");
    console.log("   - 2 sample games");
    console.log("   - 2 sample hands");
    console.log("   - 3 sample comments");
    console.log("");
    console.log("🔑 Test user credentials:");
    console.log("   - alice@example.com / password123");
    console.log("   - bob@example.com / password123");
    console.log("   - carol@example.com / password123");
    console.log("   - david@example.com / password123");

  } catch (error) {
    console.error("❌ Error seeding development database:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedDevData().then(() => {
  console.log("🎉 Seeding completed!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Seeding failed:", error);
  process.exit(1);
});