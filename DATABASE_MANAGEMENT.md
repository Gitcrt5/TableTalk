# Database Management Guide

## Overview

TableTalk uses a dual-database architecture to separate development and production environments:

- **Development Database**: Contains test data for local development and testing
- **Production Database**: Clean database for deployed application with real user data

## Database Architecture

### Environment-Based Database Selection

The application automatically selects the appropriate database based on:
- `NODE_ENV=development` → Uses `DEV_DATABASE_URL` (if set) or falls back to `DATABASE_URL`
- `NODE_ENV=production` → Uses `DATABASE_URL`

### Database URLs

```bash
# Production Database (clean for deployment)
DATABASE_URL=postgresql://...

# Development Database (with test data)
DEV_DATABASE_URL=postgresql://...
```

## Database Management Commands

### Development Environment

```bash
# Push schema changes to development database
npm run db:push

# Seed development database with test data
tsx scripts/seed-dev-data.ts

# Reset development database (push schema + seed data)
tsx scripts/reset-dev-database.ts
```

### Production Environment

```bash
# Setup production database with admin user
ADMIN_PASSWORD=your_password tsx scripts/setup-production-db.ts

# Generate migration files (run after schema changes)
npx drizzle-kit generate

# Apply migrations to production database
NODE_ENV=production tsx scripts/migrate-production.ts
```

## Schema Migration Workflow

### 1. Development Phase
1. Make changes to `shared/schema.ts`
2. Run `npm run db:push` to apply to development database
3. Test thoroughly with existing test data
4. Generate migration files: `npx drizzle-kit generate`

### 2. Production Deployment
1. Set `NODE_ENV=production`
2. Run migration script: `tsx scripts/migrate-production.ts`
3. The script will apply all pending migrations safely

## Test Data Management

### Development Test Data

The development database includes:
- **4 test users** with different roles (admin, teacher, player)
- **2 sample games** with realistic bridge data
- **2 sample hands** with bidding sequences and contracts
- **3 sample comments** demonstrating the discussion system

### Test User Credentials

```
alice@example.com / password123 (Player)
bob@example.com / password123 (Player)
carol@example.com / password123 (Teacher)
david@example.com / password123 (Player)
```

### Admin User

```
craig@craigandlee.com / [Set via ADMIN_PASSWORD]
```

## Production Database Setup

### Initial Setup

1. **Create Clean Database**: Production database starts completely empty
2. **Run Setup Script**: `tsx scripts/setup-production-db.ts`
3. **Verify Admin Access**: Login with admin credentials
4. **Test Basic Functionality**: Upload a test game, then delete it

### Environment Variables

```bash
# Required for production
ADMIN_EMAIL=craig@craigandlee.com
ADMIN_PASSWORD=your_secure_password
DATABASE_URL=postgresql://...
NODE_ENV=production
```

## Data Safety Features

### Soft Delete System
- Users are deactivated rather than deleted
- Preserves data integrity for comments and games
- Allows reactivation if needed

### Migration Safety
- All migrations are tested in development first
- Production migrations include rollback instructions
- Database backups recommended before major changes

## Troubleshooting

### Database Connection Issues

```bash
# Check database configuration
echo $DATABASE_URL
echo $DEV_DATABASE_URL
echo $NODE_ENV

# Test database connection
tsx -e "import { db } from './server/db'; console.log('Database connected successfully')"
```

### Schema Synchronization

```bash
# Check schema differences
npx drizzle-kit check

# Reset development database
npm run db:push
tsx scripts/seed-dev-data.ts
```

### Production Issues

```bash
# Check migration status
npx drizzle-kit status

# Manually run specific migration
npx drizzle-kit migrate --file=specific_migration.sql
```

## Best Practices

1. **Always Test First**: Test schema changes in development before production
2. **Backup Before Changes**: Backup production database before major updates
3. **Monitor Migrations**: Check migration logs for errors
4. **Keep Environments Separate**: Never mix development and production data
5. **Document Changes**: Update this guide when adding new database features

## File Structure

```
scripts/
├── seed-dev-data.ts          # Populates development database
├── setup-production-db.ts    # Initializes production database
└── migrate-production.ts     # Applies migrations safely

migrations/                   # Generated migration files
├── 0000_initial.sql
├── 0001_add_email_verification.sql
└── ...

shared/
└── schema.ts                # Database schema definition
```

This architecture ensures clean separation between development and production while maintaining data integrity and migration safety.