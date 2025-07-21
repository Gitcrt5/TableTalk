# Data Integrity Verification System

## Overview

The TableTalk data integrity verification system provides comprehensive checks to ensure database consistency, identify orphaned records, and maintain data quality across all tables.

## Database Dependencies Verified

### Foreign Key Relationships
1. **hands.gameId** → **games.id**
   - Hands must belong to existing games
   - Orphaned hands are flagged for deletion

2. **comments.handId** → **hands.id**
   - Comments must reference existing hands
   - Comments with invalid hand references are flagged

3. **comments.userId** → **users.id**
   - Comments must be authored by existing users
   - Comments from deleted users are flagged

4. **userBidding.handId** → **hands.id**
   - User bidding practice must reference existing hands
   - Orphaned bidding records are flagged

5. **userBidding.userId** → **users.id**
   - Bidding records must belong to existing users
   - Records from deleted users are flagged

6. **partnershipBidding.gameId** → **games.id**
   - Partnership bidding must reference existing games
   - Invalid game references are flagged

7. **partnershipBidding.handId** → **hands.id**
   - Partnership bidding must reference existing hands
   - Invalid hand references are flagged

8. **partnershipBidding.userId** → **users.id**
   - Partnership bidding must be created by existing users
   - Records from deleted users are flagged

9. **partnershipBidding.partnerId** → **users.id**
   - Partner references must point to existing users
   - Invalid partner references are set to NULL

10. **gamePlayers.gameId** → **games.id**
    - Game players must reference existing games
    - Orphaned player records are flagged

11. **gamePlayers.userId** → **users.id**
    - Game players must be existing users
    - Records from deleted users are flagged

12. **gameParticipants.gameId** → **games.id**
    - Game participation must reference existing games
    - Orphaned participation records are flagged

13. **gameParticipants.userId** → **users.id**
    - Participants must be existing users
    - Records from deleted users are flagged

14. **partners.userId** & **partners.partnerId** → **users.id**
    - Both sides of partnership must reference existing users
    - Orphaned partnership records are flagged

15. **games.uploadedBy** → **users.id**
    - Games must be uploaded by existing users
    - Games from deleted users are flagged for deletion

16. **games.clubId** → **clubs.id**
    - Club references must point to existing clubs
    - Invalid club references are set to NULL

## Data Consistency Checks

### 1. Inactive User Data
- **Check**: Data associated with inactive users (`isActive = false`)
- **Action**: Flag games, comments, and relationships from inactive users
- **Severity**: Warning (may be intentional)

### 2. Partnership Bidirectionality
- **Check**: Partnership relationships should be mutual
- **Action**: Flag one-way partnerships
- **Fix**: Create reciprocal relationship or remove orphaned partnership

### 3. Bidding Data Format
- **Check**: Bidding sequences must be valid JSON arrays
- **Action**: Flag corrupted or invalid bidding data
- **Fix**: Repair format or delete corrupted records

### 4. Game Participation Duplicates
- **Check**: Users should not have duplicate participation entries for same game
- **Action**: Flag duplicate participation records
- **Fix**: Remove duplicate entries

## Data Completeness Checks

### 1. Essential Game Information
- **Check**: Games should have title and date
- **Severity**: Info (impacts user experience)
- **Action**: Prompt for missing information

### 2. Hand Contract Information
- **Check**: Hands should have final contract and declarer
- **Severity**: Info (impacts analysis features)
- **Action**: Parse additional PBN data or allow manual entry

## Usage

### Run Integrity Check
```bash
tsx scripts/data-integrity-checker.ts check
```

### Auto-Fix Orphaned Records
```bash
tsx scripts/data-integrity-checker.ts fix
```

## Issue Severity Levels

### Error (Critical)
- **Orphaned records** - Data referencing non-existent records
- **Corrupted data** - Invalid JSON or malformed data structures
- **Action Required**: Immediate cleanup to prevent application errors

### Warning (Important)
- **Data inconsistencies** - One-way relationships, inactive user data
- **Invalid references** - Nullable foreign keys pointing to deleted records
- **Action Suggested**: Review and resolve for optimal functionality

### Info (Enhancement)
- **Missing optional data** - Incomplete but non-critical information
- **Data quality** - Opportunities to improve user experience
- **Action Optional**: Enhance data collection processes

## Auto-Fix Capabilities

The system can automatically fix:
- Orphaned hands without games
- Comments without valid hands or users
- Bidding records without valid hands or users
- Partnership bidding with invalid references
- Game players with invalid references
- Partner relationships with invalid users
- Games without valid uploaders

## Safety Features

1. **Read-Only Analysis**: Check mode only reads data, never modifies
2. **Explicit Fix Mode**: Destructive operations require explicit `fix` command
3. **Detailed Logging**: All fixes are logged with record IDs
4. **Cascade Awareness**: Understands foreign key relationships
5. **Transaction Safety**: Each fix is atomic

## Integration with Database Management

Works seamlessly with the database management system:
- Run integrity checks before cleanup operations
- Verify database health after migrations
- Monitor data quality in production environments
- Identify issues before they impact users

## Example Report Output

```
📊 INTEGRITY REPORT
====================
Total Issues: 0
Orphaned Records: 0
Invalid References: 0
Data Inconsistencies: 0

💡 RECOMMENDATIONS
==================
✅ Database integrity is excellent - no issues found
```

This comprehensive verification system ensures the TableTalk database maintains high data quality and consistency across all operations.