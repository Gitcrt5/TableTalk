# Supabase Migration Plan: Database Layer Migration while Keeping Firebase Auth

## Project Overview

**Goal**: Migrate the database layer from Neon PostgreSQL + Drizzle ORM to Supabase Postgres while keeping Firebase Authentication intact.

**Key Requirements**:
- Use `@supabase/supabase-js` on server only
- Keep Firebase Auth on client and server
- No direct database drivers or ORMs (remove Drizzle)
- Frontend must never access Supabase directly
- All Supabase usage in backend only
- Migrate existing data from current database

---

## Current Architecture Analysis

### Current Database Setup
- **Database**: Neon PostgreSQL with connection via `DATABASE_URL`
- **ORM**: Drizzle ORM (`drizzle-orm/neon-serverless`)
- **Schema**: Comprehensive schema in `shared/schema.ts` with 19 tables
- **Migration Tool**: Drizzle Kit
- **Storage Layer**: Clean abstraction via `IStorage` interface in `server/storage.ts`

### Current Authentication Setup
- **Client**: Firebase Auth via `client/src/lib/firebase.ts` and `client/src/lib/auth.tsx`
- **Server**: Firebase Admin SDK via `server/firebase.ts`
- **Middleware**: `requireAuth` middleware in `server/routes.ts`
- **Status**: ✅ Working correctly, will be preserved

### Dependencies Analysis

#### Dependencies to Remove:
```json
{
  "@neondatabase/serverless": "^0.10.4",
  "drizzle-orm": "^0.39.1",
  "drizzle-zod": "^0.7.0",
  "drizzle-kit": "^0.30.4",
  "connect-pg-simple": "^10.0.0"
}
```

#### Dependencies to Add:
```json
{
  "@supabase/supabase-js": "^2.39.0"
}
```

#### Dependencies to Keep:
- All Firebase dependencies (client and admin)
- All frontend dependencies
- All other backend dependencies

---

## Files Requiring Changes

### Critical Files (Must Modify):

1. **`server/db.ts`** - Replace Neon + Drizzle with Supabase client
2. **`server/storage.ts`** - Replace all Drizzle queries with Supabase queries
3. **`shared/schema.ts`** - Convert to Supabase schema or TypeScript types
4. **`package.json`** - Update dependencies

### Files to Remove:
1. **`drizzle.config.ts`** - No longer needed
2. **`migrations/`** directory - Drizzle migrations not applicable

### Files to Keep Unchanged:
1. **`server/firebase.ts`** - Firebase Admin SDK (✅ working)
2. **`client/src/lib/firebase.ts`** - Firebase client config (✅ working)
3. **`client/src/lib/auth.tsx`** - Auth provider (✅ working)
4. **`server/routes.ts`** - API routes (minor updates only)
5. **All client components and pages** - No changes needed

---

## Environment Variables Plan

### Current Environment Variables:
```bash
# Database
DATABASE_URL=postgresql://...

# Firebase (Keep these)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

### New Environment Variables Needed:
```bash
# Supabase (Add these)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Firebase (Keep all existing ones)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

### Variables to Remove:
```bash
DATABASE_URL=postgresql://...  # No longer needed
```

---

## Database Schema Analysis

### Current Schema Overview
The current schema in `shared/schema.ts` includes:

#### Core Tables:
1. **users** - User profiles linked to Firebase UID
2. **user_types** - User type reference data
3. **clubs** - Bridge club information
4. **favourite_clubs** - User-club relationships
5. **games** - Bridge game sessions
6. **boards** - Individual board data within games
7. **events** - Bridge events and tournaments
8. **event_deals** - Deal data for events
9. **game_participants** - Player participation in games
10. **partnerships** - Player partnerships
11. **comments** - Board/deal analysis comments

#### Supporting Tables:
12. **user_preferences** - User settings
13. **feature_flags** - Application feature toggles
14. **audit_logs** - System audit trail
15. **player_results** - Game performance data
16. **event_results** - Event scoring data
17. **event_registrations** - Event participation
18. **event_standings** - Tournament standings
19. **club_memberships** - Club membership data

#### Enums:
- game_type, visibility_type, event_status, event_kind
- registration_type, pair_side_type, game_role, seat_type, comment_type

### Schema Migration Strategy
Convert Drizzle schema definitions to Supabase SQL schema while preserving:
- All table structures and relationships
- Foreign key constraints
- Enum types
- Default values and constraints
- UUID generation functions

---

## Data Migration Plan

### Phase 1: Export Current Data
```sql
-- Export all table data from current Neon database
-- Script to be created for data extraction
COPY (SELECT * FROM users) TO '/tmp/users.csv' WITH CSV HEADER;
COPY (SELECT * FROM clubs) TO '/tmp/clubs.csv' WITH CSV HEADER;
-- ... continue for all tables
```

### Phase 2: Create Supabase Schema
```sql
-- Create all enums
CREATE TYPE game_type AS ENUM ('USER', 'CLUB');
CREATE TYPE visibility_type AS ENUM ('private', 'link', 'public');
-- ... continue for all enums

-- Create all tables with proper constraints
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  firebase_uid TEXT NOT NULL UNIQUE,
  user_type_id UUID REFERENCES user_types(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
-- ... continue for all tables
```

### Phase 3: Import Data to Supabase
```sql
-- Import data preserving relationships
\COPY users FROM '/tmp/users.csv' WITH CSV HEADER;
\COPY clubs FROM '/tmp/clubs.csv' WITH CSV HEADER;
-- ... continue for all tables
```

### Phase 4: Verify Data Integrity
- Check row counts match
- Verify foreign key relationships
- Test sample queries
- Validate enum values

---

## Implementation Plan

### Phase 1: Preparation (30 minutes)
1. **Backup Current Database**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Create Supabase Project**
   - Set up new Supabase project
   - Configure authentication settings
   - Note down project URL and service role key

3. **Install Dependencies**
   ```bash
   npm uninstall @neondatabase/serverless drizzle-orm drizzle-zod drizzle-kit connect-pg-simple
   npm install @supabase/supabase-js
   ```

### Phase 2: Database Schema Setup (45 minutes)
1. **Create Supabase Schema**
   - Convert `shared/schema.ts` to Supabase SQL
   - Create all tables, enums, and constraints
   - Set up RLS policies (Row Level Security)

2. **Export Current Data**
   - Create data export script
   - Export all table data to CSV/JSON
   - Verify export completeness

3. **Import Data to Supabase**
   - Import data maintaining referential integrity
   - Verify data integrity and counts

### Phase 3: Backend Migration (60 minutes)
1. **Create Supabase Client** (`server/supabase.ts`)
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   
   const supabaseUrl = process.env.SUPABASE_URL!;
   const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
   
   export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
     auth: {
       autoRefreshToken: false,
       persistSession: false
     }
   });
   ```

2. **Replace Storage Implementation**
   - Update `server/storage.ts` to use Supabase queries
   - Replace all Drizzle operations with Supabase operations
   - Maintain exact same interface (`IStorage`)

3. **Update Database Connection**
   - Replace `server/db.ts` with Supabase client
   - Remove Drizzle initialization

### Phase 4: Schema Type Definitions (30 minutes)
1. **Update `shared/schema.ts`**
   - Remove Drizzle table definitions
   - Add TypeScript type definitions
   - Keep Zod schemas for validation

2. **Generate Types from Supabase**
   ```bash
   npx supabase gen types typescript --project-id="your-project-id" > shared/supabase-types.ts
   ```

### Phase 5: File Storage Migration (Optional - 30 minutes)
1. **Update File Upload Component**
   - Modify `client/src/components/ui/file-upload.tsx`
   - Add backend API route for file uploads via Supabase Storage

2. **Create File Storage API**
   - Add routes for file upload/download
   - Use Supabase Storage admin client
   - Proxy all file operations through backend

### Phase 6: Testing and Validation (45 minutes)
1. **Test All API Endpoints**
   - Verify CRUD operations work
   - Test authentication flow
   - Validate data integrity

2. **Frontend Testing**
   - Test all pages and components
   - Verify data loading
   - Test user interactions

3. **Performance Testing**
   - Compare query performance
   - Check connection pooling
   - Monitor response times

---

## Detailed Code Changes

### 1. New Supabase Client (`server/supabase.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL must be set');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY must be set');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

### 2. Updated Storage Interface Implementation
```typescript
// server/storage.ts - Example user methods
export class SupabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_types (*)
      `)
      .eq('firebase_uid', firebaseUid)
      .single();
    
    if (error || !data) return undefined;
    return data;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(insertUser)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // ... continue for all other methods
}
```

### 3. Updated Schema Types (`shared/schema.ts`)
```typescript
// Remove all Drizzle imports and table definitions
// Keep only TypeScript types and Zod schemas

export interface User {
  id: string;
  email: string;
  displayName: string;
  firebaseUid: string;
  userTypeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  country: string;
  state: string;
  city?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ... continue for all entities

// Keep Zod schemas for validation
import { z } from 'zod';

export const insertUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  firebaseUid: z.string().min(1),
  userTypeId: z.string().uuid().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
// ... continue for all insert schemas
```

---

## Row Level Security (RLS) Configuration

### User Data Security
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (firebase_uid = auth.uid());

-- Service role can access all data (for backend operations)
CREATE POLICY "Service role can access all user data" ON users
  FOR ALL USING (auth.role() = 'service_role');
```

### Game Data Security
```sql
-- Games can be read by participants or if public
CREATE POLICY "Games read policy" ON games
  FOR SELECT USING (
    visibility = 'public' OR 
    creator_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()) OR
    partner_id = (SELECT id FROM users WHERE firebase_uid = auth.uid())
  );
```

---

## File Storage Migration (If Needed)

### Backend File Upload Route
```typescript
// server/routes.ts - Add file upload route
app.post('/api/upload', requireAuth, async (req, res) => {
  try {
    // Handle file upload via Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(`${req.user.id}/${Date.now()}_${filename}`, fileBuffer, {
        contentType: file.mimetype
      });

    if (error) throw error;
    
    // Return file URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(data.path);
      
    res.json({ url: publicUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Risk Assessment

### Low Risk:
- Firebase authentication (unchanged)
- Frontend components (unchanged)
- API routes structure (minimal changes)

### Medium Risk:
- Data migration process
- Storage layer replacement
- Query performance differences

### High Risk:
- Data loss during migration
- Schema mapping errors
- Missing environment variables

### Mitigation Strategies:
1. **Complete database backup before migration**
2. **Test migration on copy of production data**
3. **Incremental deployment with rollback plan**
4. **Comprehensive testing of all CRUD operations**

---

## Testing Checklist

### Data Integrity:
- [ ] All tables migrated with correct row counts
- [ ] Foreign key relationships preserved
- [ ] Enum values correctly mapped
- [ ] UUID generation working

### Authentication:
- [ ] Firebase auth still working
- [ ] User creation/lookup via Firebase UID
- [ ] Protected routes functioning
- [ ] Token verification working

### CRUD Operations:
- [ ] User management (create, read, update)
- [ ] Game management (create, read, update)
- [ ] Club management (create, read, update)
- [ ] Comment system (create, read, update, delete)
- [ ] Partnerships (create, read, update)
- [ ] Events (create, read, update)

### Performance:
- [ ] Query response times acceptable
- [ ] Concurrent user handling
- [ ] Database connection pooling
- [ ] Error handling and recovery

---

## Rollback Plan

### If Migration Fails:
1. **Restore Database Connection**
   ```bash
   npm install @neondatabase/serverless drizzle-orm drizzle-zod drizzle-kit
   npm uninstall @supabase/supabase-js
   ```

2. **Restore Files**
   - Restore `server/db.ts` from backup
   - Restore `server/storage.ts` from backup
   - Restore `drizzle.config.ts` from backup
   - Restore `shared/schema.ts` from backup

3. **Restore Environment Variables**
   ```bash
   DATABASE_URL=postgresql://original-neon-url
   # Remove Supabase variables
   ```

4. **Test System**
   - Verify all functionality restored
   - Check data integrity
   - Test authentication flow

---

## Timeline Estimate

**Total Time: 4-5 hours**

1. **Preparation**: 30 minutes
2. **Schema Setup**: 45 minutes  
3. **Data Migration**: 60 minutes
4. **Backend Code Changes**: 60 minutes
5. **Type Definitions**: 30 minutes
6. **Testing & Validation**: 45 minutes
7. **File Storage (Optional)**: 30 minutes
8. **Documentation & Cleanup**: 15 minutes

---

## Post-Migration Validation

### Data Verification Queries:
```sql
-- Check user counts
SELECT COUNT(*) FROM users;

-- Verify relationships
SELECT COUNT(*) FROM games g 
JOIN users u ON g.creator_id = u.id;

-- Check enum values
SELECT DISTINCT game_type FROM games;
```

### Performance Benchmarks:
- Average query response time
- Authentication flow timing
- Page load performance
- Concurrent user capacity

---

## Environment Variables Summary

### Required New Secrets:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Keep Existing:
```bash
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

### Remove:
```bash
DATABASE_URL=postgresql://...
```

---

## Next Steps

1. **Review this plan** - Confirm approach and timeline
2. **Set up Supabase project** - Create project and obtain credentials
3. **Begin Phase 1** - Backup current database and install dependencies
4. **Execute migration phases** - Follow detailed implementation plan
5. **Test thoroughly** - Validate all functionality works correctly
6. **Deploy to production** - Update environment variables and deploy

---

## Questions for Clarification

1. **Data Migration Timing**: Should we migrate during off-peak hours?
2. **Supabase Project**: Do you want me to create the Supabase project or will you provide credentials?
3. **File Storage**: Are there any existing files that need to be migrated to Supabase Storage?
4. **RLS Policies**: Do you want to implement Row Level Security for data access control?
5. **Testing Environment**: Should we test on a staging environment first?

---

**Status**: Ready for implementation pending explicit confirmation to proceed with changes.