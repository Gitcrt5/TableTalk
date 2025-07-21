# Database Management System

## Overview

The TableTalk database management system has been consolidated into a single, comprehensive script that handles all database operations safely and efficiently.

## New Unified Script: `database-manager.ts`

### Commands Available

```bash
# Reset to clean production state (admin user only)
tsx scripts/database-manager.ts clean

# Reset with test data (admin + test users for development)
tsx scripts/database-manager.ts test

# Remove only test users and their data (keeps real users)
tsx scripts/database-manager.ts cleanup

# Clear all tables (emergency use only)
tsx scripts/database-manager.ts clear
```

### What's Fixed

1. **Updated Schema Support**: Now handles all new tables including:
   - `partnershipBidding` - Partnership-specific bidding sequences
   - `partners` - User partnership relationships
   - `gameParticipants` - Game participation tracking
   - `gamePlayers` - Game player management

2. **Field Corrections**: Fixed outdated field references:
   - `role` → `userType` (consolidated user type system)
   - Proper foreign key handling for all relationships

3. **Proper Deletion Order**: Respects all foreign key constraints:
   - Comments → Partnership Bidding → User Bidding → Hands → Games → Participants → Players → Partners → Users

## Usage Examples

### Development Workflow
```bash
# Start with test data for development
tsx scripts/database-manager.ts test

# Remove test data when ready for real users
tsx scripts/database-manager.ts cleanup
```

### Production Deployment
```bash
# Reset to clean state for production
tsx scripts/database-manager.ts clean
```

### Emergency Recovery
```bash
# Complete reset if database is corrupted
tsx scripts/database-manager.ts clear
tsx scripts/database-manager.ts clean
```

## Admin Credentials

**Default Admin Account:**
- Email: `admin@tabletalk.cards`
- Password: `admin123`

*Can be overridden with environment variables:*
- `ADMIN_EMAIL` - Custom admin email
- `ADMIN_PASSWORD` - Custom admin password

## Test Users (Created with `test` command)

- **Alice Johnson**: `alice@test.com` / `test123`
- **Bob Smith**: `bob@test.com` / `test123`

Both test users have `userType: "test"` for easy identification and cleanup.

## Deprecated Scripts

The following scripts now redirect to the new system:
- `reset-dev-database.ts` → `database-manager.ts test`
- `reset-production-db.ts` → `database-manager.ts clean`
- `cleanup-test-data.ts` → `database-manager.ts cleanup`

## Safety Features

1. **Proper Foreign Key Handling**: All deletions respect database relationships
2. **Transaction Safety**: Operations are performed in correct order
3. **User Type Filtering**: Test data cleanup only affects `userType: "test"` users
4. **Confirmation Messages**: Clear feedback on what was deleted/created
5. **Error Handling**: Comprehensive error reporting with rollback

## Environment Integration

The script automatically:
- Detects database environment (development/production)
- Uses appropriate connection strings
- Respects environment variables for admin credentials
- Provides appropriate default passwords for each environment

This unified system ensures database operations are consistent, safe, and maintainable across all environments.