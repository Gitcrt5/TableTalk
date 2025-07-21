import { db } from "../server/db";
import { 
  users, games, hands, comments, userBidding, partnershipBidding, 
  partners, gameParticipants, gamePlayers, clubs
} from "../shared/schema";
import { eq, inArray, and, sql, isNull, isNotNull } from "drizzle-orm";

interface IntegrityReport {
  timestamp: string;
  summary: {
    totalIssues: number;
    orphanedRecords: number;
    invalidReferences: number;
    dataInconsistencies: number;
  };
  issues: IntegrityIssue[];
  recommendations: string[];
}

interface IntegrityIssue {
  severity: 'error' | 'warning' | 'info';
  table: string;
  type: 'orphaned' | 'invalid_reference' | 'data_inconsistency' | 'missing_data';
  description: string;
  recordId: number | string;
  details?: any;
  fixAction?: string;
}

/**
 * Comprehensive database integrity checker
 * Identifies orphaned records, invalid foreign keys, and data inconsistencies
 */
export class DataIntegrityChecker {
  private issues: IntegrityIssue[] = [];
  
  async runFullCheck(): Promise<IntegrityReport> {
    console.log("🔍 Starting comprehensive data integrity check...");
    this.issues = [];
    
    // Check foreign key constraints
    await this.checkOrphanedHands();
    await this.checkOrphanedComments();
    await this.checkOrphanedUserBidding();
    await this.checkOrphanedPartnershipBidding();
    await this.checkOrphanedGamePlayers();
    await this.checkOrphanedGameParticipants();
    await this.checkOrphanedPartners();
    await this.checkInvalidGameUploaders();
    await this.checkInvalidClubReferences();
    
    // Check data consistency
    await this.checkInactiveUserData();
    await this.checkPartnershipConsistency();
    await this.checkBiddingDataConsistency();
    await this.checkGameParticipationConsistency();
    
    // Check data completeness
    await this.checkMissingGameDetails();
    await this.checkHandCompleteness();
    
    const report = this.generateReport();
    console.log("✅ Data integrity check completed");
    return report;
  }
  
  // Foreign Key Constraint Checks
  
  async checkOrphanedHands(): Promise<void> {
    const orphanedHands = await db
      .select({ id: hands.id, gameId: hands.gameId })
      .from(hands)
      .leftJoin(games, eq(hands.gameId, games.id))
      .where(isNull(games.id));
    
    for (const hand of orphanedHands) {
      this.addIssue({
        severity: 'error',
        table: 'hands',
        type: 'orphaned',
        description: `Hand ${hand.id} references non-existent game ${hand.gameId}`,
        recordId: hand.id,
        fixAction: 'DELETE FROM hands WHERE id = ?'
      });
    }
  }
  
  async checkOrphanedComments(): Promise<void> {
    // Check comments with invalid hand references
    const orphanedCommentsByHand = await db
      .select({ id: comments.id, handId: comments.handId })
      .from(comments)
      .leftJoin(hands, eq(comments.handId, hands.id))
      .where(isNull(hands.id));
    
    for (const comment of orphanedCommentsByHand) {
      this.addIssue({
        severity: 'error',
        table: 'comments',
        type: 'orphaned',
        description: `Comment ${comment.id} references non-existent hand ${comment.handId}`,
        recordId: comment.id,
        fixAction: 'DELETE FROM comments WHERE id = ?'
      });
    }
    
    // Check comments with invalid user references
    const orphanedCommentsByUser = await db
      .select({ id: comments.id, userId: comments.userId })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(isNull(users.id));
    
    for (const comment of orphanedCommentsByUser) {
      this.addIssue({
        severity: 'error',
        table: 'comments',
        type: 'orphaned',
        description: `Comment ${comment.id} references non-existent user ${comment.userId}`,
        recordId: comment.id,
        fixAction: 'DELETE FROM comments WHERE id = ?'
      });
    }
  }
  
  async checkOrphanedUserBidding(): Promise<void> {
    // Check user bidding with invalid hand references
    const orphanedBiddingByHand = await db
      .select({ id: userBidding.id, handId: userBidding.handId })
      .from(userBidding)
      .leftJoin(hands, eq(userBidding.handId, hands.id))
      .where(isNull(hands.id));
    
    for (const bidding of orphanedBiddingByHand) {
      this.addIssue({
        severity: 'error',
        table: 'userBidding',
        type: 'orphaned',
        description: `User bidding ${bidding.id} references non-existent hand ${bidding.handId}`,
        recordId: bidding.id,
        fixAction: 'DELETE FROM user_bidding WHERE id = ?'
      });
    }
    
    // Check user bidding with invalid user references
    const orphanedBiddingByUser = await db
      .select({ id: userBidding.id, userId: userBidding.userId })
      .from(userBidding)
      .leftJoin(users, eq(userBidding.userId, users.id))
      .where(isNull(users.id));
    
    for (const bidding of orphanedBiddingByUser) {
      this.addIssue({
        severity: 'error',
        table: 'userBidding',
        type: 'orphaned',
        description: `User bidding ${bidding.id} references non-existent user ${bidding.userId}`,
        recordId: bidding.id,
        fixAction: 'DELETE FROM user_bidding WHERE id = ?'
      });
    }
  }
  
  async checkOrphanedPartnershipBidding(): Promise<void> {
    // Check partnership bidding with invalid game references
    const orphanedByGame = await db
      .select({ id: partnershipBidding.id, gameId: partnershipBidding.gameId })
      .from(partnershipBidding)
      .leftJoin(games, eq(partnershipBidding.gameId, games.id))
      .where(isNull(games.id));
    
    for (const bidding of orphanedByGame) {
      this.addIssue({
        severity: 'error',
        table: 'partnershipBidding',
        type: 'orphaned',
        description: `Partnership bidding ${bidding.id} references non-existent game ${bidding.gameId}`,
        recordId: bidding.id,
        fixAction: 'DELETE FROM partnership_bidding WHERE id = ?'
      });
    }
    
    // Check partnership bidding with invalid hand references
    const orphanedByHand = await db
      .select({ id: partnershipBidding.id, handId: partnershipBidding.handId })
      .from(partnershipBidding)
      .leftJoin(hands, eq(partnershipBidding.handId, hands.id))
      .where(isNull(hands.id));
    
    for (const bidding of orphanedByHand) {
      this.addIssue({
        severity: 'error',
        table: 'partnershipBidding',
        type: 'orphaned',
        description: `Partnership bidding ${bidding.id} references non-existent hand ${bidding.handId}`,
        recordId: bidding.id,
        fixAction: 'DELETE FROM partnership_bidding WHERE id = ?'
      });
    }
    
    // Check partnership bidding with invalid user references
    const orphanedByUser = await db
      .select({ id: partnershipBidding.id, userId: partnershipBidding.userId })
      .from(partnershipBidding)
      .leftJoin(users, eq(partnershipBidding.userId, users.id))
      .where(isNull(users.id));
    
    for (const bidding of orphanedByUser) {
      this.addIssue({
        severity: 'error',
        table: 'partnershipBidding',
        type: 'orphaned',
        description: `Partnership bidding ${bidding.id} references non-existent user ${bidding.userId}`,
        recordId: bidding.id,
        fixAction: 'DELETE FROM partnership_bidding WHERE id = ?'
      });
    }
    
    // Check partnership bidding with invalid partner references
    const orphanedByPartner = await db
      .select({ id: partnershipBidding.id, partnerId: partnershipBidding.partnerId })
      .from(partnershipBidding)
      .leftJoin(users, eq(partnershipBidding.partnerId, users.id))
      .where(and(isNotNull(partnershipBidding.partnerId), isNull(users.id)));
    
    for (const bidding of orphanedByPartner) {
      this.addIssue({
        severity: 'error',
        table: 'partnershipBidding',
        type: 'orphaned',
        description: `Partnership bidding ${bidding.id} references non-existent partner ${bidding.partnerId}`,
        recordId: bidding.id,
        fixAction: 'UPDATE partnership_bidding SET partner_id = NULL WHERE id = ?'
      });
    }
  }
  
  async checkOrphanedGamePlayers(): Promise<void> {
    // Check game players with invalid game references
    const orphanedByGame = await db
      .select({ id: gamePlayers.id, gameId: gamePlayers.gameId })
      .from(gamePlayers)
      .leftJoin(games, eq(gamePlayers.gameId, games.id))
      .where(isNull(games.id));
    
    for (const player of orphanedByGame) {
      this.addIssue({
        severity: 'error',
        table: 'gamePlayers',
        type: 'orphaned',
        description: `Game player ${player.id} references non-existent game ${player.gameId}`,
        recordId: player.id,
        fixAction: 'DELETE FROM game_players WHERE id = ?'
      });
    }
    
    // Check game players with invalid user references
    const orphanedByUser = await db
      .select({ id: gamePlayers.id, userId: gamePlayers.userId })
      .from(gamePlayers)
      .leftJoin(users, eq(gamePlayers.userId, users.id))
      .where(isNull(users.id));
    
    for (const player of orphanedByUser) {
      this.addIssue({
        severity: 'error',
        table: 'gamePlayers',
        type: 'orphaned',
        description: `Game player ${player.id} references non-existent user ${player.userId}`,
        recordId: player.id,
        fixAction: 'DELETE FROM game_players WHERE id = ?'
      });
    }
  }
  
  async checkOrphanedGameParticipants(): Promise<void> {
    // Similar checks for gameParticipants table
    const orphanedByGame = await db
      .select({ id: gameParticipants.id, gameId: gameParticipants.gameId })
      .from(gameParticipants)
      .leftJoin(games, eq(gameParticipants.gameId, games.id))
      .where(isNull(games.id));
    
    for (const participant of orphanedByGame) {
      this.addIssue({
        severity: 'error',
        table: 'gameParticipants',
        type: 'orphaned',
        description: `Game participant ${participant.id} references non-existent game ${participant.gameId}`,
        recordId: participant.id,
        fixAction: 'DELETE FROM game_participants WHERE id = ?'
      });
    }
  }
  
  async checkOrphanedPartners(): Promise<void> {
    // Check partners with invalid user references
    const orphanedByUser = await db
      .select({ id: partners.id, userId: partners.userId })
      .from(partners)
      .leftJoin(users, eq(partners.userId, users.id))
      .where(isNull(users.id));
    
    for (const partner of orphanedByUser) {
      this.addIssue({
        severity: 'error',
        table: 'partners',
        type: 'orphaned',
        description: `Partner relationship ${partner.id} references non-existent user ${partner.userId}`,
        recordId: partner.id,
        fixAction: 'DELETE FROM partners WHERE id = ?'
      });
    }
    
    // Check partners with invalid partner references
    const orphanedByPartner = await db
      .select({ id: partners.id, partnerId: partners.partnerId })
      .from(partners)
      .leftJoin(users, eq(partners.partnerId, users.id))
      .where(isNull(users.id));
    
    for (const partner of orphanedByPartner) {
      this.addIssue({
        severity: 'error',
        table: 'partners',
        type: 'orphaned',
        description: `Partner relationship ${partner.id} references non-existent partner ${partner.partnerId}`,
        recordId: partner.id,
        fixAction: 'DELETE FROM partners WHERE id = ?'
      });
    }
  }
  
  async checkInvalidGameUploaders(): Promise<void> {
    const gamesWithInvalidUploaders = await db
      .select({ id: games.id, uploadedBy: games.uploadedBy })
      .from(games)
      .leftJoin(users, eq(games.uploadedBy, users.id))
      .where(isNull(users.id));
    
    for (const game of gamesWithInvalidUploaders) {
      this.addIssue({
        severity: 'error',
        table: 'games',
        type: 'orphaned',
        description: `Game ${game.id} references non-existent uploader ${game.uploadedBy}`,
        recordId: game.id,
        fixAction: 'DELETE FROM games WHERE id = ? (will cascade delete hands and comments)'
      });
    }
  }
  
  async checkInvalidClubReferences(): Promise<void> {
    const gamesWithInvalidClubs = await db
      .select({ id: games.id, clubId: games.clubId })
      .from(games)
      .leftJoin(clubs, eq(games.clubId, clubs.id))
      .where(and(isNotNull(games.clubId), isNull(clubs.id)));
    
    for (const game of gamesWithInvalidClubs) {
      this.addIssue({
        severity: 'warning',
        table: 'games',
        type: 'invalid_reference',
        description: `Game ${game.id} references non-existent club ${game.clubId}`,
        recordId: game.id,
        fixAction: 'UPDATE games SET club_id = NULL WHERE id = ?'
      });
    }
  }
  
  // Data Consistency Checks
  
  async checkInactiveUserData(): Promise<void> {
    // Find data associated with inactive users
    const inactiveUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.isActive, false));
    
    if (inactiveUsers.length === 0) return;
    
    const inactiveUserIds = inactiveUsers.map(u => u.id);
    
    // Check for games uploaded by inactive users
    const gamesFromInactiveUsers = await db
      .select({ id: games.id, uploadedBy: games.uploadedBy })
      .from(games)
      .where(inArray(games.uploadedBy, inactiveUserIds));
    
    for (const game of gamesFromInactiveUsers) {
      this.addIssue({
        severity: 'warning',
        table: 'games',
        type: 'data_inconsistency',
        description: `Game ${game.id} uploaded by inactive user ${game.uploadedBy}`,
        recordId: game.id,
        details: { inactiveUploader: game.uploadedBy },
        fixAction: 'Consider reassigning ownership or archiving game'
      });
    }
  }
  
  async checkPartnershipConsistency(): Promise<void> {
    // Check for one-way partnerships
    const allPartnerships = await db.select().from(partners);
    
    for (const partnership of allPartnerships) {
      const reciprocal = allPartnerships.find(p => 
        p.userId === partnership.partnerId && p.partnerId === partnership.userId
      );
      
      if (!reciprocal) {
        this.addIssue({
          severity: 'warning',
          table: 'partners',
          type: 'data_inconsistency',
          description: `One-way partnership: ${partnership.userId} → ${partnership.partnerId}`,
          recordId: partnership.id,
          fixAction: 'Create reciprocal partnership or remove one-way relationship'
        });
      }
    }
  }
  
  async checkBiddingDataConsistency(): Promise<void> {
    // Check for invalid bidding sequences
    const allPartnershipBidding = await db.select().from(partnershipBidding);
    
    for (const bidding of allPartnershipBidding) {
      try {
        const sequence = bidding.biddingSequence as string[];
        if (!Array.isArray(sequence)) {
          this.addIssue({
            severity: 'error',
            table: 'partnershipBidding',
            type: 'data_inconsistency',
            description: `Invalid bidding sequence format in partnership bidding ${bidding.id}`,
            recordId: bidding.id,
            fixAction: 'Fix bidding sequence format or delete record'
          });
        }
      } catch (error) {
        this.addIssue({
          severity: 'error',
          table: 'partnershipBidding',
          type: 'data_inconsistency',
          description: `Corrupted bidding sequence in partnership bidding ${bidding.id}`,
          recordId: bidding.id,
          fixAction: 'Delete corrupted record'
        });
      }
    }
  }
  
  async checkGameParticipationConsistency(): Promise<void> {
    // Check for duplicate participation entries
    const participationCounts = await db
      .select({
        gameId: gameParticipants.gameId,
        userId: gameParticipants.userId,
        count: sql<number>`count(*)`
      })
      .from(gameParticipants)
      .groupBy(gameParticipants.gameId, gameParticipants.userId)
      .having(sql`count(*) > 1`);
    
    for (const duplicate of participationCounts) {
      this.addIssue({
        severity: 'warning',
        table: 'gameParticipants',
        type: 'data_inconsistency',
        description: `User ${duplicate.userId} has ${duplicate.count} participation entries for game ${duplicate.gameId}`,
        recordId: `${duplicate.gameId}-${duplicate.userId}`,
        fixAction: 'Remove duplicate participation entries'
      });
    }
  }
  
  // Data Completeness Checks
  
  async checkMissingGameDetails(): Promise<void> {
    const gamesWithMissingDetails = await db
      .select({ id: games.id, title: games.title, date: games.date })
      .from(games)
      .where(
        sql`title IS NULL OR title = '' OR date IS NULL OR date = ''`
      );
    
    for (const game of gamesWithMissingDetails) {
      this.addIssue({
        severity: 'info',
        table: 'games',
        type: 'missing_data',
        description: `Game ${game.id} missing essential details (title or date)`,
        recordId: game.id,
        fixAction: 'Prompt user to complete game information'
      });
    }
  }
  
  async checkHandCompleteness(): Promise<void> {
    const incompleteHands = await db
      .select({ id: hands.id, gameId: hands.gameId })
      .from(hands)
      .where(
        sql`final_contract IS NULL OR declarer IS NULL`
      );
    
    for (const hand of incompleteHands) {
      this.addIssue({
        severity: 'info',
        table: 'hands',
        type: 'missing_data',
        description: `Hand ${hand.id} missing contract or declarer information`,
        recordId: hand.id,
        fixAction: 'Parse additional data from PBN or allow manual entry'
      });
    }
  }
  
  // Utility Methods
  
  private addIssue(issue: IntegrityIssue): void {
    this.issues.push(issue);
  }
  
  private generateReport(): IntegrityReport {
    const summary = {
      totalIssues: this.issues.length,
      orphanedRecords: this.issues.filter(i => i.type === 'orphaned').length,
      invalidReferences: this.issues.filter(i => i.type === 'invalid_reference').length,
      dataInconsistencies: this.issues.filter(i => i.type === 'data_inconsistency').length
    };
    
    const recommendations = this.generateRecommendations();
    
    return {
      timestamp: new Date().toISOString(),
      summary,
      issues: this.issues,
      recommendations
    };
  }
  
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.issues.some(i => i.severity === 'error')) {
      recommendations.push("🚨 Critical errors found - immediate action required");
      recommendations.push("Run the auto-fix script to resolve orphaned records");
    }
    
    if (this.issues.some(i => i.type === 'orphaned')) {
      recommendations.push("🧹 Consider running database cleanup to remove orphaned records");
    }
    
    if (this.issues.some(i => i.type === 'data_inconsistency')) {
      recommendations.push("🔄 Review data consistency issues and implement proper constraints");
    }
    
    if (this.issues.some(i => i.type === 'missing_data')) {
      recommendations.push("📝 Improve data collection processes to ensure completeness");
    }
    
    if (this.issues.length === 0) {
      recommendations.push("✅ Database integrity is excellent - no issues found");
    }
    
    return recommendations;
  }
  
  // Auto-fix Methods
  
  async autoFixOrphanedRecords(): Promise<number> {
    console.log("🔧 Auto-fixing orphaned records...");
    let fixedCount = 0;
    
    const orphanedIssues = this.issues.filter(i => 
      i.type === 'orphaned' && i.severity === 'error'
    );
    
    for (const issue of orphanedIssues) {
      try {
        switch (issue.table) {
          case 'hands':
            await db.delete(hands).where(eq(hands.id, Number(issue.recordId)));
            break;
          case 'comments':
            await db.delete(comments).where(eq(comments.id, Number(issue.recordId)));
            break;
          case 'userBidding':
            await db.delete(userBidding).where(eq(userBidding.id, Number(issue.recordId)));
            break;
          case 'partnershipBidding':
            await db.delete(partnershipBidding).where(eq(partnershipBidding.id, Number(issue.recordId)));
            break;
          case 'gamePlayers':
            await db.delete(gamePlayers).where(eq(gamePlayers.id, Number(issue.recordId)));
            break;
          case 'gameParticipants':
            await db.delete(gameParticipants).where(eq(gameParticipants.id, Number(issue.recordId)));
            break;
          case 'partners':
            await db.delete(partners).where(eq(partners.id, Number(issue.recordId)));
            break;
          case 'games':
            await db.delete(games).where(eq(games.id, Number(issue.recordId)));
            break;
        }
        fixedCount++;
      } catch (error) {
        console.error(`Failed to fix ${issue.table} record ${issue.recordId}:`, error);
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} orphaned records`);
    return fixedCount;
  }
}

// Command line interface
async function main() {
  const command = process.argv[2];
  const checker = new DataIntegrityChecker();
  
  try {
    switch (command) {
      case "check":
        const report = await checker.runFullCheck();
        console.log("\n📊 INTEGRITY REPORT");
        console.log("====================");
        console.log(`Total Issues: ${report.summary.totalIssues}`);
        console.log(`Orphaned Records: ${report.summary.orphanedRecords}`);
        console.log(`Invalid References: ${report.summary.invalidReferences}`);
        console.log(`Data Inconsistencies: ${report.summary.dataInconsistencies}`);
        
        if (report.issues.length > 0) {
          console.log("\n🔍 DETAILED ISSUES");
          console.log("==================");
          for (const issue of report.issues) {
            console.log(`${issue.severity.toUpperCase()}: ${issue.description}`);
            if (issue.fixAction) {
              console.log(`  Fix: ${issue.fixAction}`);
            }
          }
        }
        
        console.log("\n💡 RECOMMENDATIONS");
        console.log("==================");
        for (const rec of report.recommendations) {
          console.log(rec);
        }
        break;
        
      case "fix":
        await checker.runFullCheck();
        const fixedCount = await checker.autoFixOrphanedRecords();
        console.log(`🎉 Auto-fix completed. Fixed ${fixedCount} issues.`);
        break;
        
      default:
        console.log("📖 Data Integrity Checker Usage:");
        console.log("");
        console.log("Commands:");
        console.log("  check - Run full integrity check and show report");
        console.log("  fix   - Auto-fix orphaned records (dangerous!)");
        console.log("");
        console.log("Examples:");
        console.log("  tsx scripts/data-integrity-checker.ts check");
        console.log("  tsx scripts/data-integrity-checker.ts fix");
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