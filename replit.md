# replit.md

## Overview

TableTalk is a simplified bridge review platform built with a modern full-stack TypeScript architecture. The MVP focuses on core functionality: uploading PBN files, viewing games and hands, and adding comments. Users can upload bridge games, browse available games, view individual hands with card layouts, add missing bidding sequences, and comment on hands for discussion.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js 20+ with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with conventional HTTP methods
- **Authentication**: Flexible system supporting both Replit OAuth and email/password authentication
- **File Upload**: Multer for handling PBN file uploads
- **Session Management**: Express sessions with PostgreSQL store
- **Error Handling**: Centralized error handling middleware

### Data Storage
- **Primary Database**: PostgreSQL 16
- **ORM**: Drizzle ORM with code-first schema approach
- **Migration Strategy**: Drizzle Kit for schema migrations
- **Connection Pool**: Neon Database serverless connection pooling

## Key Components

### Database Schema
The application uses six main entities:
- **Users**: Authentication data from Replit (ID, email, name, profile image)
- **Sessions**: Express session storage for authentication state
- **Games**: Store uploaded PBN files with metadata (title, tournament, uploader)
- **Hands**: Individual bridge hands extracted from games (board number, cards, bidding)
- **UserBidding**: User practice attempts with accuracy scoring (linked to user ID)
- **Comments**: Community discussions on specific hands with user levels and likes (linked to user ID)

### Frontend Components
- **Pages**: Dashboard (games list), Game Detail (hands list), Hand Detail (individual hand view), Not Found
- **Layout**: Simple header with just the TableTalk logo/name
- **Bridge-Specific**: Hand display showing all four positions, bidding table for display, bidding input for missing auctions
- **Upload**: PBN file upload with drag-and-drop integration
- **Comments**: Simple comment system for hand discussions

### Backend Services
- **PBN Parser**: Extracts game and hand data from uploaded bridge notation files
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development
- **Route Handlers**: RESTful endpoints for games, hands, bidding, and comments

## Data Flow

1. **File Upload**: Users upload PBN files through a simple upload interface
2. **Parsing**: Backend parses PBN content and extracts individual hands
3. **Storage**: Games and hands are stored with in-memory storage for MVP
4. **Browse**: Users can view a list of all uploaded games
5. **Hands**: Clicking a game shows all hands within that game
6. **Hand Detail**: Individual hands show card layout, bidding (if available), and comments
7. **Add Content**: Users can add missing bidding sequences and comments to hands

## External Dependencies

### Production Dependencies
- **UI Library**: Radix UI components for accessible interface elements
- **Database**: Neon Database for serverless PostgreSQL hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS for utility-first styling approach
- **State Management**: TanStack Query for server state caching and synchronization

### Development Dependencies
- **Build Tools**: Vite for fast development and optimized production builds
- **Type Checking**: TypeScript compiler for static type analysis
- **Development Server**: TSX for TypeScript execution in development
- **Asset Processing**: ESBuild for server-side bundle optimization

## Authentication Configuration

TableTalk supports two authentication methods for maximum hosting flexibility:

### Replit OAuth (Default)
- **When**: Automatically used when `REPLIT_DOMAINS` environment variable is present
- **Benefits**: Zero-configuration authentication when hosting on Replit
- **User Experience**: Single-click login using existing Replit account

### Email/Password Authentication
- **When**: Used when hosting outside Replit or when `USE_REPLIT_AUTH=false`
- **Benefits**: Portable to any hosting platform, full user control
- **User Experience**: Traditional registration/login forms with email validation

### Switching Authentication Methods
- **On Replit**: Authentication is automatic (uses OAuth)
- **Other hosts**: Set `USE_REPLIT_AUTH=false` to use email/password
- **Database**: Same user schema supports both methods seamlessly

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 and PostgreSQL 16 modules
- **Hot Reload**: Vite development server with HMR enabled
- **Database**: Local PostgreSQL instance for development testing
- **Port Configuration**: Development server on port 5000 with external port 80

### Production Build
- **Frontend Build**: Vite builds React application to static assets
- **Backend Build**: ESBuild bundles TypeScript server code
- **Database Migration**: Drizzle Kit applies schema changes before deployment
- **Asset Serving**: Express serves static files in production mode

### Deployment Configuration
- **Target**: Replit autoscale deployment
- **Build Command**: `npm run build` (builds both frontend and backend)
- **Start Command**: `npm run start` (runs production server)
- **Environment Variables**: DATABASE_URL required for PostgreSQL connection

## Changelog

## Project Checkpoints

### CHECKPOINT 1: "Email/Password Authentication Complete" (July 8, 2025)
- Complete local authentication system implemented
- PBN upload and game management working
- Auto-edit functionality after upload
- All core features operational

### CHECKPOINT 2: "UI Polish Complete" (July 8, 2025) 
- Clean, consolidated header with tagline
- Streamlined comment interface without redundant buttons
- Removed non-functional result displays
- Improved vulnerability labeling
- Professional, focused user interface

## Recent Changes

- June 25, 2025. Initial setup with full-featured bridge platform
- June 25, 2025. Simplified to MVP focusing on core features: games list, hands view, bidding input, and comments
- June 25, 2025. Enhanced UI with better hand display, improved search, and visual polish for better user experience
- June 25, 2025. Added PostgreSQL database integration with proper schema and migrations
- June 25, 2025. Fixed PBN parser validation to ensure actualBidding field is properly initialized for all hands
- June 25, 2025. Fixed hand display navigation and layout issues, made hand display more compact and consistent across screen sizes
- June 27, 2025. Integrated TableTalk logo into header and favicon
- June 27, 2025. Updated card display to show tens as "T" instead of "10" for cleaner single-character formatting
- June 27, 2025. Implemented Replit authentication system with user login/logout, landing page for unauthenticated users, and proper session management
- June 28, 2025. Fixed critical comment system bug where 74 empty entries were displaying instead of 3 real comments due to corrupted TanStack Query cache - implemented direct API fetching to bypass cache corruption
- June 28, 2025. Enhanced bidding interface with 6-row layout organized by suit, removed redundant labels, added proper suit colors (black clubs/spades, red hearts, orange diamonds, blue NT), and implemented bid validation to prevent invalid sequences
- June 29, 2025. Added flexible authentication system supporting both Replit OAuth and traditional email/password authentication for hosting portability - automatically detects environment and uses appropriate method
- June 29, 2025. Fixed mobile responsiveness issues on iPhone with responsive hand display layout and compact bidding interface optimized for small screens
- June 29, 2025. Added display name feature to user registration and comments system - users can set a display name (max 20 characters) that appears in comments instead of full names
- June 29, 2025. Updated welcome page to remove unimplemented practice bidding section and replaced with "Analyze Games" feature that reflects current functionality
- June 29, 2025. Enhanced bidding interface color coding by making Double and Redouble options red across all bidding components (hand detail, bidding practice, and bidding table)
- June 29, 2025. Implemented proper bridge bidding rules for Double and Redouble: can only double opponent's bids (not partner's or when no bid exists), and can only redouble opponent's double
- June 29, 2025. Fixed cache invalidation issue where bidding updates weren't reflected in game hands list when navigating back from hand detail
- June 29, 2025. Removed unimplemented like, reply, and report buttons from comments section to clean up UI for MVP - added TODO for future implementation
- July 3, 2025. Reduced whitespace around all elements for more compact layout and removed redundant "auction" subheading in bidding section
- July 3, 2025. Implemented responsive side-by-side layout: bidding section appears to the right of hand display on large screens (PC/tablet) and below on narrow screens (mobile)
- July 4, 2025. Fixed critical bid display bug where "Double" was incorrectly converted to "(Diamond symbol)ouble" - updated both bidding table and hand detail formatBid functions to preserve Double/Redouble as text while properly converting suit bids
- July 4, 2025. Added game editing functionality allowing users to update game details (date, location, event, tournament, round) after PBN upload - includes database schema updates, API routes, and edit form component with ownership validation
- July 4, 2025. Simplified game editing to focus on essential fields (title, location, date), improved location display width for better readability, and added automatic redirect to game page after PBN upload for immediate editing
- July 4, 2025. Reset database to clean state with sample users (Alice Johnson, Bob Smith, Carol Wilson, David Brown) - all games, hands, and comments cleared for fresh start
- July 4, 2025. **CHECKPOINT: Auto-Edit After Upload Complete** - Fixed critical user ID mismatch in upload process and timing issues in auto-edit workflow. Upload now properly associates games with authenticated user and edit form opens automatically after upload with proper URL parameter handling and cleanup timing.
- July 8, 2025. **AUTHENTICATION SYSTEM SWITCH** - Changed from Replit OAuth to email/password authentication system. Set USE_REPLIT_AUTH=false and VITE_USE_REPLIT_AUTH=false environment variables. Frontend now shows login/register forms instead of Replit OAuth landing page. All existing functionality preserved with local user account management.
- July 8, 2025. **DATABASE RESET** - Completely cleared all data from database (users, games, hands, comments, sessions) for fresh start with new authentication system.
- July 8, 2025. **LOGIN PAGE REDESIGN** - Changed authentication page from split-screen to single column layout with description at top and login/register forms below. Increased logo size and reduced whitespace for cleaner appearance.
- July 8, 2025. **EMAIL FIELD FIX** - Resolved email input field issue where typing wasn't working. Replaced complex FormField components with direct React Hook Form registration for better compatibility.
- July 8, 2025. **USER ID AUTHENTICATION FIX** - Fixed PBN upload and all API routes that were failing due to user ID mismatch between Replit OAuth (`req.user.claims.sub`) and local authentication (`req.user.id`). Added getUserId() helper function to handle both authentication methods.
- July 8, 2025. **PBN UPLOAD WORKING** - Successfully tested complete workflow: user registration → login → PBN file upload → game creation → auto-edit functionality. All authentication and upload features now working correctly with local email/password system.
- July 8, 2025. **HEADER CONSOLIDATION** - Added tagline to main header and removed redundant "TableTalk" header from dashboard for cleaner UI. Tagline now appears in top header across all pages.
- July 8, 2025. **COMMENT UI CLEANUP** - Removed confusing "Add Comment" button from comments section. Users can now directly click in the text area to add comments, creating a more intuitive interface.
- July 8, 2025. **RESULT SECTION REMOVAL** - Removed redundant result display from hand listings in game detail page since there's no current capacity to enter results, creating cleaner and more focused interface.
- July 8, 2025. **VULNERABILITY LABEL** - Added "Vul: " label to vulnerability display in hand listings for better clarity and consistency with bridge terminology.
- July 8, 2025. **CHECKPOINT: UI Polish Complete** - Completed comprehensive UI cleanup including header consolidation, comment interface streamlining, result section removal, and vulnerability labeling. All authentication and core features working properly with clean, focused interface design.
- July 9, 2025. **DEPLOYMENT FIXES** - Fixed deployment issues: added logo to landing page, corrected authentication redirect from `/api/login` to `/auth`, and ensured local auth is used by default. Requires re-deployment to take effect.
- July 9, 2025. **AUTHENTICATION HARDCODED** - Hardcoded app to always use local email/password authentication regardless of environment variables. Reduced excessive whitespace above logo on landing page. App will now show login/register forms instead of Replit auth.
- July 9, 2025. **MOBILE HEADER OPTIMIZATION** - Hidden tagline text on mobile screens to prevent wrapping and reduce space usage on narrow screens like iPhone.
- July 9, 2025. **HAND POINTS CALCULATION** - Added high card point calculation (A=4, K=3, Q=2, J=1) displayed in top right corner of each hand box. Points are calculated and shown for all four positions (North, South, East, West) on both desktop and mobile layouts.
- July 9, 2025. **POINTS DISPLAY ALIGNMENT** - Improved points display to align vertically with position badges (North, South, East, West) and added "pts" text suffix for clarity (e.g., "12 pts").
- July 9, 2025. **SESSION PERSISTENCE FIX** - Fixed session timeout issues by removing session expiration (maxAge) and implementing PostgreSQL session store for persistence across server restarts. Users will now remain logged in until they explicitly log out or close their browser.
- July 9, 2025. **CONTRACT COLOR CODING** - Added red color coding for hearts and diamonds contracts throughout the application. Contract numbers and suit symbols display in red for hearts/diamonds while position text (e.g., "by East") remains black. Applied to game detail page, hand detail page, and bidding table components.

## TODO List & Future Enhancements

### Current Issues to Fix
- [ ] Resolve LSP errors in server/storage.ts (database insertion type mismatch)
- [ ] Fix server/vite.ts allowedHosts configuration warning

### Core Features to Add
- [ ] Add tags to hands and games for better organization and filtering
- [ ] Add users with varying levels of ability (Admin, Teacher, Player, Kibbitzer)
- [ ] Add way for users to manually enter a game and/or hand (form-based input)
- [ ] Bidding sequence input functionality (partially implemented, needs completion)
- [ ] Comment system improvements: add like, reply, and report functionality (UI removed for MVP)
- [ ] Add filtering as well as search of the games list
- [ ] Search and filter hands by criteria (dealer, vulnerability, convention)
- [ ] User profiles and statistics dashboard
- [ ] Hand statistics and analysis

### UI/UX Improvements
- [ ] Add option for more compact view of the games list
- [ ] Mobile-responsive design optimization
- [ ] Dark mode theme toggle
- [ ] Keyboard shortcuts for navigation
- [ ] Better loading states and error handling
- [ ] Improved PBN upload with validation feedback

### Advanced Features (Future)
- [ ] Club website data import/scraping integration
- [ ] Mobile app development
- [ ] Real-time collaboration on hand analysis
- [ ] Advanced bidding analysis and suggestions
- [ ] Tournament management features
- [ ] Export hands to different formats (PDF, PBN, etc.)

### Data & Performance
- [ ] Database migrations and backup system
- [ ] Caching strategy for better performance
- [ ] File upload size limits and validation
- [ ] Data export/import functionality

## User Preferences

Preferred communication style: Simple, everyday language.
User prefers MVP approach: Start simple and add features incrementally rather than building complex systems upfront.
User wants to track ideas and future enhancements systematically.