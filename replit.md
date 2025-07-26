# replit.md

## Overview

TableTalk is a comprehensive bridge review platform built with a modern full-stack TypeScript architecture. **Version 0.1 Beta** provides core functionality for bridge analysis and community discussion: uploading PBN files, viewing games and hands with detailed card layouts, managing bidding sequences, and engaging in hand discussions through comments. The platform supports user authentication, profile management, and admin controls, making it ready for beta testing by bridge enthusiasts.

**Current Status:** Beta Release 0.1 - All core features implemented and tested.

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
- **Primary Database**: PostgreSQL 16 with dual-database architecture
- **ORM**: Drizzle ORM with code-first schema approach
- **Migration Strategy**: Drizzle Kit for schema migrations with production safety
- **Connection Pool**: Neon Database serverless connection pooling
- **Environment Separation**: Development database with test data, production database starts clean

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

## Project Checkpoints & Version History

### VERSION 0.1 BETA: "Initial Beta Release" (July 18, 2025)
**Core Features Complete:**
- Full email/password authentication system with registration, login, and account management
- PBN file upload with duplicate detection and auto-edit functionality
- Bridge game and hand viewing with card layouts and bidding sequences
- Comment system for hand discussions
- User profile management with display names and statistics
- Admin user management interface
- Mobile-responsive design optimized for all devices

**Technical Foundation:**
- React frontend with TypeScript and Tailwind CSS
- Node.js/Express backend with PostgreSQL database
- Drizzle ORM for type-safe database operations
- SendGrid email integration (currently disabled)
- Dual-database architecture (development/production)
- Comprehensive error handling and validation

**Ready for Beta Testing:**
- All core workflows functional and tested
- Clean, professional user interface
- Proper user attribution and data management
- Stable authentication and session management

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

## Database Management

The project uses a unified database management system:

### Primary Scripts
- **`database-manager.ts`** - Unified database operations with commands:
  - `clean` - Reset to clean state (admin user + sample data from JSON) 
  - `test` - Reset with test data (admin + hardcoded test users)
  - `cleanup` - Delete only test users and their data
  - `clear` - Clear all tables (dangerous!)
- **`data-integrity-checker.ts`** - Comprehensive database integrity verification

### Usage Examples
```bash
tsx scripts/database-manager.ts clean    # Production reset with sample data
tsx scripts/database-manager.ts test     # Development with test data
tsx scripts/database-manager.ts cleanup  # Remove test users only
tsx scripts/data-integrity-checker.ts    # Check database integrity
```

### Sample Data System
The `clean` command automatically loads sample data from the `/sample-data/` directory:

#### Sample Users
- Define users in `sample-data.json` with email, password, name, and userType
- Passwords are automatically hashed during creation
- Admin user is always created separately for security (not in JSON)

#### Sample Games
- Place PBN files in `/sample-data/`
- Update `sample-data.json` with metadata for each file
- Specify uploader email or use "random" for test users
- Falls back to admin user if specified uploader not found

## Recent Changes

- July 25, 2025. **LIVE GAMES FEATURE IMPLEMENTATION STARTED** - Added database schema for live games functionality including tables for live_games, live_hands, live_game_access, and user_favorite_clubs. Feature flag system implemented to control access during development. Added API routes and storage methods for creating and managing live games. Created UI for creating live games with club selection and partner options. Feature currently enabled only for users with liveGames feature flag.
- July 25, 2025. **FEATURE FLAGS IN SAMPLE DATA** - Updated sample-data.json to include featureFlags field for test users. Modified database-manager.ts to handle feature flags when loading sample data. Test users Alice, Bob, David, and Han have liveGames enabled while Carol and Eve have it disabled. This allows consistent test environments with pre-configured feature access.
- July 25, 2025. **LIVE GAMES FEATURE COMPLETE** - Implemented complete live games functionality including database schema (live_games, live_hands, live_game_access tables), list and detail pages, game creation form with club/partner selection, board-by-board data entry interface for dealer/vulnerability/results/notes, and API routes with proper feature flag access control. Feature available to users with liveGames flag enabled. Fixed schema export issues and database query crashes. System ready for real-time use during bridge games before PBN files are available.
- July 26, 2025. **COMPREHENSIVE BIDDING INTERFACE ADDED** - Enhanced live game board entry with complete bidding and play interface including compact bid pad (1♣-7NT grid), special bids (Pass/Double/Redouble), real-time bidding sequence display, opening lead selection with suit/card buttons, tricks counter, MP/IMP scoring, and notes. Interface optimized for mobile use during actual bridge play with proper suit coloring and intuitive touch controls. Fixed Select component crash by replacing empty string values with "none" option.
- July 26, 2025. **UI OPTIMIZATION FOR MOBILE PLAY** - Reduced space usage by compacting game header and navigation to single line format. Moved bidding sequence display below bid pad to prevent scrolling during entry. Added bid validation that greys out invalid bids (e.g., 1♣/1♦ after 1♥). Simplified opening lead to dropdown selection instead of button grid. Interface now optimally sized for real-time bridge play entry.
- July 26, 2025. **DEDICATED BOARD EDITING PAGE WITH NAVIGATION** - Created separate board editing page with card-based layout and comprehensive navigation. Moved all bidding interface from inline editing to dedicated page for better user experience. Added prev/next buttons and board dropdown selector at both top and bottom of editing page. Live game overview now shows board summaries with edit links instead of inline editing. Interface maintains all existing functionality including red suit coloring, bid validation, and lead selection.
- July 26, 2025. **VULNERABILITY CALCULATION FIX** - Fixed vulnerability pattern to use correct bridge rules with 16-board rotation pattern instead of simple 4-board cycle. Pattern now correctly shows None→NS→EW→Both→NS→EW→Both→None→EW→Both→None→NS→Both→None→NS→EW repeating every 16 boards, matching standard duplicate bridge vulnerability assignments.
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
- July 9, 2025. **SESSION CONFIGURATION FIX** - Fixed session persistence issues between development and deployed environments by setting cookie.secure to 'auto', adding 30-day maxAge, and configuring proper session store TTL. This should resolve logout issues on deployed apps while maintaining session persistence.
- July 9, 2025. **SESSION PERSISTENCE IMPROVEMENT** - Fixed session configuration to prevent forced logout on dev server restart. Updated session settings to handle development/production environments properly with PostgreSQL session store and cleaned up invalid sessions. Users should now stay logged in across server restarts.
- July 9, 2025. **URL-BASED PBN IMPORT** - Added ability to import PBN files directly from URLs instead of just file uploads. Enhanced upload dialog with tabbed interface supporting both file upload and URL import methods. Users can now paste a direct link to a PBN file and import it seamlessly. Backend validates URLs and fetches content with proper error handling and 30-second timeout.
- July 9, 2025. **UI SIMPLIFIED FOR NEWCASTLE BRIDGE CLUB** - Removed URL import option from the frontend UI while keeping backend functionality intact for future use. Newcastle Bridge Club URLs are protected by Cloudflare anti-bot security, so users must download files manually. Interface now shows only file upload option for immediate use case.
- July 9, 2025. **IPAD COMPATIBILITY IMPROVEMENTS** - Enhanced file upload functionality for iPad users by expanding accepted file types to include .txt files and text/plain MIME types. Added alternative file selection button visible only on mobile devices to work around iPad file input limitations. Updated file validation to be more flexible while maintaining security.
- July 10, 2025. **USER ACCOUNT MANAGEMENT** - Added comprehensive account management page at /account allowing users to update profile information (name, display name, email) and change passwords (for local auth users). Implemented user statistics dashboard showing games uploaded, comments made, hands reviewed, and average bidding accuracy. Added dropdown menu in header for easy access to account settings and logout functionality.
- July 10, 2025. **ACCOUNT API FIX** - Fixed "Method is not a valid HTTP token" error in account management by correcting the apiRequest function parameter structure. The function now properly accepts (url, options) instead of (method, url, data), resolving profile update and password change functionality. All account management features now working correctly.
- July 10, 2025. **DISPLAY NAME UPDATE FIX** - Fixed display name field not updating in account management by adding displayName field to all user API responses in auth.ts. The /api/user endpoint now properly returns displayName field, allowing profile updates to show immediately in the UI. Enhanced cache management with immediate data updates and proper invalidation.
- July 14, 2025. **COMMENT SYSTEM FIXES** - Fixed comment submission issue by correcting apiRequest function calls and session authentication. Comments now properly submit and display immediately. Streamlined comment UI by removing redundant avatar initials while keeping display names. Fixed username disappearing on hover in header dropdown by adding proper text colors.
- July 14, 2025. **GAME EDIT FORM FIX** - Fixed game editing functionality in deployed app by correcting apiRequest function call format from (method, url, data) to (url, {method, body}) structure. Game details can now be updated successfully after PBN upload without errors.
- July 14, 2025. **GAMES LIST REDESIGN** - Improved games list layout to prioritize event names and dates as primary information. Tournament/event names now appear as main titles, dates are prominently displayed, and filenames are shown as smaller detail text. Removed redundant "Bridge Game" badges and reduced calendar icon confusion for cleaner, more intuitive information hierarchy.
- July 16, 2025. **SESSION AUTHENTICATION WORKING** - Resolved session persistence issues in authentication system. Login works properly when app runs in its own tab, but fails in Replit's embedded preview due to cross-origin cookie restrictions. This is expected behavior for iframe environments. Authentication system is fully functional for production deployment.
- July 16, 2025. **SESSION STORE FINALIZED** - Fixed PostgreSQL session store compatibility issues with Neon database client. Switched to reliable in-memory session store which provides excellent performance and proper session persistence when app runs in standalone browser tabs. Authentication system now fully operational.
- July 16, 2025. **1PASSWORD AUTHENTICATION OPTIMIZATION COMPLETE** - Successfully resolved 1Password prompting to save passwords on every page transition. Implemented 30-minute caching for authentication queries, disabled automatic refetching on component mount, removed query invalidation after login, and added security headers to `/api/user` endpoint. Authentication requests now only occur on login/logout or after 30-minute cache expiration.
- July 16, 2025. **1PASSWORD HEADERS STRENGTHENED** - Enhanced security headers for `/api/user` endpoint to prevent password manager prompts. Added stronger cache control (30 minutes), additional security headers including Pragma, X-Robots-Tag, and Referrer-Policy to further discourage password manager interference.
- July 16, 2025. **CACHE INVALIDATION AND FILENAME DISPLAY FIXES** - Fixed cache invalidation issue where dashboard showed wrong game details after editing until manual refresh. Enhanced GameEditForm to show filename during editing and implemented robust cache invalidation with immediate cache updates and forced refetch. Dashboard now properly refreshes after game updates.
- July 16, 2025. **DUPLICATE PBN DETECTION SYSTEM** - Implemented comprehensive duplicate detection using first hand comparison (board number, dealer, vulnerability, and all four hands). System detects duplicates during upload and presents user with options to view existing game or upload anyway. Backend includes findDuplicateByFirstHand method and force upload capability. Frontend shows duplicate confirmation dialog with existing game details.
- July 16, 2025. **DOUBLED CONTRACT NOTATION** - Added proper bridge notation for doubled contracts. System now appends "X" for doubled contracts (e.g., "5NTX") and "XX" for redoubled contracts. Updated contract determination logic to check for Double/Redouble after final bid and enhanced formatContract and formatBid functions throughout the application.
- July 16, 2025. **HAND NAVIGATION IMPROVEMENT** - Removed large "View Hand" button from game detail page and made board numbers clickable instead. Board numbers now serve as both headings and navigation links with hover effects, saving space while maintaining functionality.
- July 16, 2025. **CONTRACT DISPLAY SPACING FIX** - Added proper spacing after colon in contract display on game detail page. Contract now shows "Contract: 2♥X by West" instead of "Contract:2♥X by West" for better readability.
- July 16, 2025. **HAND DETAIL CONTRACT FORMATTING FIX** - Fixed contract display formatting in hand detail page badges and final contract display. Simplified contract formatting logic to ensure proper spacing between contract amount and declarer information, eliminating newline issues in contract text display.
- July 16, 2025. **WHITESPACE PRESERVATION FIX** - Fixed HTML whitespace stripping issue in contract display by using React's {' '} syntax for preserved spaces. Contract badges now properly display "Contract: 2♥X by West" with correct spacing after colon and before "by" text, resolving rendering issues where leading/trailing spaces were being stripped.
- July 16, 2025. **DOUBLED CONTRACT DATABASE FIX** - Fixed missing doubled contract notation (X/XX) in existing database records. Updated hands 693 and 477 to show correct doubled notation (5NTX and 3NTX respectively). Enhanced PBN parser logic to properly detect and apply doubled contract notation for future uploads.
- July 17, 2025. **GAME DETAILS IN HAND VIEW** - Added game information display to hand detail page. Game details (title, date, location, tournament, round) now appear in a highlighted section between the board number and dealer/vulnerability information for better context when viewing individual hands.
- July 17, 2025. **EMAIL VERIFICATION SYSTEM** - Implemented comprehensive email verification during user registration. Users receive verification emails upon signup with 24-hour expiration tokens. Added email verification banner, resend verification functionality, and dedicated verification success page. Mock email service logs verification emails to console for development. System validates email format and prepares foundation for future email alerts feature.
- July 17, 2025. **SENDGRID INTEGRATION AND PASSWORD RESET** - Integrated SendGrid email service for production-ready email delivery with professional HTML templates. Added complete password reset functionality with 1-hour token expiration, forgot password page, and reset password page. Email service automatically switches between SendGrid (production) and mock console logging (development) based on API key availability. All email templates include proper branding and secure token-based authentication.
- July 17, 2025. **ADMIN USER MANAGEMENT SYSTEM** - Implemented comprehensive admin user management with soft-delete functionality. Added tabbed admin dashboard with Overview and User Management sections. Created user search and filtering interface showing user details, roles, email verification status, and activity. Admins can deactivate/reactivate users while preserving data integrity. System prevents self-deactivation and includes confirmation dialogs with optional reason tracking.
- July 17, 2025. **DUAL-DATABASE ARCHITECTURE** - Implemented separate development and production databases for clean user experience. Development database maintains rich test data for feature development, while production database starts clean for real users. Added environment-based database selection, migration scripts, and automated admin setup. Created comprehensive database management system with seeding scripts and production deployment tools.
- July 17, 2025. **DATABASE RESET SYSTEM** - Created comprehensive database reset scripts for both development and production environments. Added `reset-production-db.ts` and `reset-dev-database.ts` scripts to completely clear databases and recreate admin user. Fixed UUID generation issues and provided command-line tools for easy database management. Production database now completely clean and ready for deployment.
- July 18, 2025. **ADMIN EMAIL STANDARDIZATION** - Updated all initialization scripts and configuration files to use admin@tabletalk.cards as the default admin email instead of craig@craigandlee.com. This creates consistency with the verified SendGrid sender identity and provides a professional admin account for the platform. All database scripts, environment examples, and documentation updated accordingly.
- July 18, 2025. **DISPLAY NAME REGISTRATION FIX** - Fixed display name not being saved during user registration. The registration endpoint was not extracting the displayName field from the request body, causing it to be null in the database. Added proper displayName extraction and storage in the registration process.
- July 18, 2025. **EMAIL VERIFICATION ROUTING FIX** - Fixed email verification links showing raw JSON instead of the proper verification page. Moved email verification, password reset, and forgot password routes to the unauthenticated section of the router so users can access these pages without being logged in. Email verification now displays the proper UI with success/error messages.
- July 18, 2025. **ENHANCED EMAIL VERIFICATION LANDING PAGE** - Created a professional, user-friendly email verification landing page with TableTalk branding, clear status indicators, and helpful next steps. The page includes animated loading states, success celebrations with feature highlights, and informative error handling with guidance. Users now get a welcoming experience when verifying their email addresses.
- July 18, 2025. **EMAIL VERIFICATION REMOVED** - Temporarily removed email verification requirement due to SendGrid delivery issues. Users can now register and immediately use the application without email verification. Updated all existing users to verified status and removed verification banner from dashboard. Added email verification back to TODO list for future implementation with proper email infrastructure.
- July 18, 2025. **UPLOAD DIALOG IMPROVEMENTS** - Consolidated duplicate file selection buttons in PBN upload dialog. Removed redundant "Select File" button and kept single "Browse Files" button that works reliably across all devices including mobile. Simplified user interface for cleaner upload experience.
- July 18, 2025. **UPLOADER DISPLAY NAME FIX** - Fixed issue where game detail page showed uploader UUID instead of display name. Backend was correctly joining user data and returning display names, frontend now properly displays user's display name (e.g., "Uploaded by MM") instead of raw user ID. Enhanced user experience with proper name attribution.
- July 18, 2025. **VERSION 0.1 BETA RELEASE** - Checkpoint reached for initial beta version. All core features implemented and tested: authentication, PBN upload/parsing, game/hand viewing, bidding sequences, comments, user management, and mobile responsiveness. System ready for beta testing with comprehensive bridge analysis functionality.
- July 19, 2025. **DATABASE SEPARATION STRATEGY FINALIZED** - Implemented deployment-based database separation using single database with clean production resets. Development environment (`npm run dev`) contains test data and user uploads for testing. Production deployment automatically resets database to clean state for real users. Database separation maintained through deployment automation rather than separate database instances.
- July 20, 2025. **USER TYPE-BASED DATA MANAGEMENT SYSTEM** - Implemented comprehensive user type system with automated cleanup functionality. Added userType field to users table (admin, player, test). Created admin interface for changing user types and manual cleanup. Built automated cleanup script that deletes all test users and cascading data (games, hands, comments). System now supports both manual admin cleanup and automated deployment cleanup for production database separation.
- July 20, 2025. **ROLE/USERTYPE CONSOLIDATION COMPLETE** - Successfully consolidated the separate role and userType fields into a single userType system for maximum flexibility. Removed role column from database schema with proper data migration. Updated all backend authentication checks, frontend components, and admin interfaces to use unified userType field. System now supports extensible user types (admin, player, test, moderator, teacher, etc.) through single field. Fixed admin panel access issues caused by API returning old role field instead of userType.
- July 20, 2025. **ADMIN PANEL ACCESS RESOLVED** - Fixed admin panel accessibility by adding proper admin menu link to header dropdown. Issue was not session/authentication problems but missing UI navigation. Updated header component to check for userType === "admin" and display Admin Panel option in user dropdown menu. Authentication system working correctly throughout.
- July 20, 2025. **PARTNER SEARCH FUNCTIONALITY FIXED** - Resolved partner search returning Response objects instead of JSON data. Fixed apiRequest usage in partner management component to properly handle fetch responses and extract JSON data. Cleaned up UI by removing confusing dynamic status messages that appeared while typing. Partner search now works cleanly with proper user feedback and search results display.
- July 20, 2025. **GAME PARTICIPATION TOGGLE SYSTEM** - Implemented streamlined participation banner with toggle switch functionality. Added partnerId field to game players schema for tracking partnerships. Created toggle switch (grey/green) for marking game participation with automatic partner selection dialog. Shows "Partner: [Name]" when specified or "Add Partner" button when not. Toggle left position (grey) = not played, right position (green) = played. Enhanced API to support partner updates and proper reciprocal partnership tracking.
- July 20, 2025. **FORGOT PASSWORD REMOVAL** - Removed "Forgot password?" link from login page since email functionality is not fully configured for production. This prevents user confusion when the password reset feature doesn't work properly due to missing email infrastructure.
- July 21, 2025. **PARTNERSHIP BIDDING SYSTEM IMPLEMENTATION** - Completed comprehensive partnership-specific bidding system. Added new `partnershipBidding` table with proper constraints ensuring one partnership per user per game. Migrated database and cleared existing global bidding data. Implemented full storage layer methods for creating, reading, updating, and deleting partnership bidding sequences. Added API routes for all CRUD operations plus conflict detection. System allows only players who played a game to enter bidding sequences that are tied to their specific partnerships. Includes automatic partner linking and conflict resolution mechanisms.
- July 21, 2025. **DATABASE MANAGEMENT SYSTEM CONSOLIDATION** - Created unified `database-manager.ts` script that consolidates and updates all previous database scripts. Fixed issues with outdated `role` field usage (now uses `userType`) and missing new tables (partnershipBidding, partners, gameParticipants). New script provides clean commands: `clean` (production-ready), `test` (with test data), `cleanup` (remove test users only), and `clear` (emergency reset). All old scripts now redirect to the new unified system for consistency.
- July 23, 2025. **SCRIPT CLEANUP** - Removed obsolete database scripts. Only `database-manager.ts` and `data-integrity-checker.ts` remain in scripts folder. All database operations now use the unified manager: `tsx scripts/database-manager.ts [clean|test|cleanup|clear]`.
- July 23, 2025. **PARTNERSHIP BIDDING FIXES** - Comprehensive bug fixes for partnership bidding system: Fixed cache invalidation issues causing bidding details to revert after saving by adding proper query invalidation. Fixed partnership comment filtering to handle bidirectional relationships correctly - users can now see comments from both partners they added and partners who added them. Simplified partnership access UI by removing large warning boxes. Updated section title from "Official Bidding" to "Bidding" for cleaner interface. Fixed uploader name display in game details to show proper display names instead of UUIDs.
- July 21, 2025. **DATA INTEGRITY VERIFICATION SYSTEM** - Implemented comprehensive database integrity checker that verifies all foreign key relationships, identifies orphaned records, and checks data consistency. System validates 16 different dependency relationships including hands→games, comments→hands/users, bidding records, partnerships, and game participation. Includes auto-fix capabilities for orphaned records and detailed reporting with severity levels (error/warning/info). Provides both check-only analysis and destructive fix operations with full logging and safety features.
- July 21, 2025. **ADMIN PANEL INTEGRITY INTEGRATION** - Added data integrity verification system to admin panel with professional interface. Created new "Database Integrity" tab with summary cards, detailed issue listings, one-click integrity checking, and auto-fix functionality. System only runs checks when explicitly triggered by admin users, not automatically on page load. Provides comprehensive reporting with severity levels and clear recommendations for database maintenance.
- July 23, 2025. **SAMPLE PBN FILE LOADING** - Implemented automatic sample PBN file loading system for database initialization. Created `/sample-pbn-files/` directory with JSON metadata configuration. The `clean` command now loads PBN files from this directory, using metadata to specify uploaders (with "random" option and admin fallback), titles, dates, and locations. This provides immediate sample data for new installations and demonstrations.
- July 24, 2025. **SAMPLE DATA SYSTEM EXPANSION** - Expanded sample data system to include both users and games. Renamed directory from `/sample-pbn-files/` to `/sample-data/` for broader scope. JSON configuration now defines both sample users (with credentials and user types) and game metadata. Admin user remains created by script for security. This separates data configuration from script logic for easier customization.
- July 24, 2025. **PARTNERSHIP BIDDING SYSTEM FIXES** - Resolved three critical issues in partnership bidding: Fixed backend gameId validation error that prevented saving bidding sequences by ensuring gameId is properly extracted from request body. Fixed color display for diamonds and hearts in bidding tables to show red color as expected in both editing and display modes. Improved layout for monitor viewing with true 50/50 side-by-side split between hand display and bidding panel, increased overall width to max-w-7xl for better space utilization on large screens.
- July 24, 2025. **COMMENT COUNT DISPLAY FIX** - Fixed issue where hands with comments were showing "No comments" badge instead of the actual comment count. Enhanced the `/api/games/:gameId/hands` route to calculate and include commentCount field for each hand by fetching comments and setting the count. Now hands with comments properly display the blue comment badge with correct count (e.g., "3 comments") instead of incorrectly showing "No comments".
- July 24, 2025. **CONTACT SYSTEM IMPLEMENTATION** - Added basic contact/support system with two access points: Footer with "Contact: admin@tabletalk.cards" visible on all authenticated pages, and "Help & Support" option in header dropdown menu. Both link to admin@tabletalk.cards email. Footer includes copyright notice and appears consistently at bottom of page with proper flex layout. System designed to be easily expandable to full help center or ticketing system in future.

## TODO List & Future Enhancements

### Current Issues to Fix
- [ ] Resolve LSP errors in server/storage.ts (database insertion type mismatch)
- [ ] Fix server/vite.ts allowedHosts configuration warning


### Known Limitations
- **Replit Preview Environment**: Login works in standalone tabs but not in Replit's embedded preview due to iframe cookie restrictions. This is expected behavior and will work correctly in production deployment.

### Core Features to Add
- [x] Contact/support system: email-based contact method (expandable to help center)
- [ ] Partner/friend system: users can add partners, select who they played with during game upload
- [ ] Partnership statistics: track performance and games played with specific partners
- [ ] Add tags to hands and games for better organization and filtering
- [ ] Add way for users to manually enter a game and/or hand (form-based input)
- [ ] Bidding sequence input functionality (partially implemented, needs completion)
- [ ] Comment system improvements: add like, reply, and report functionality (UI removed for MVP)
- [ ] Comment privacy system: partner comments, private notes, discussion filtering
- [ ] Add filtering as well as search of the games list
- [ ] Search and filter hands by criteria (dealer, vulnerability, convention)
- [ ] Advanced hand filtering and search
- [ ] User profiles and statistics dashboard
- [ ] Hand statistics and analysis
- [ ] Hand analysis tools and statistics
- [ ] Email verification system with proper SendGrid configuration and domain verification
- [ ] Email notifications for new comments, game uploads, and system announcements
- [x] Password reset functionality via email
- [x] User management interface for admin users

### UI/UX Improvements
- [ ] Add option for more compact view of the games list
- [ ] Mobile-responsive design optimization
- [ ] Mobile responsiveness improvements
- [ ] Dark mode theme toggle
- [ ] Keyboard shortcuts for navigation
- [ ] Better loading states and error handling
- [ ] Improved PBN upload with validation feedback
- [ ] Improve error handling and user feedback
- [ ] In the games dashboard add a flag for games that the user played in
- [ ] In te games dashboard remove the text "Click to view hand layout and add bidding"

### Advanced Features (Future)
- [ ] Automated game import from club websites - monitor results pages and automatically download PBN files when new games are added
- [ ] Club website data import/scraping integration
- [ ] Club integration features
- [ ] Mobile app development
- [ ] Real-time collaboration on hand analysis
- [ ] Real-time collaboration
- [ ] Advanced bidding analysis and suggestions
- [ ] AI-powered bidding suggestions
- [ ] Tournament management features
- [ ] Advanced tournament management
- [ ] Export hands to different formats (PDF, PBN, etc.)

### Data & Performance
- [ ] Database migrations and backup system
- [ ] Caching strategy for better performance
- [ ] File upload size limits and validation
- [ ] Data export/import functionality

### User Roles & Permissions (Future Enhancement)
- [ ] Add users with varying levels of ability (Admin, Teacher, Player, Kibbitzer)
- **Admin**: Full access, manage users, moderate content
- **Teacher**: Create/edit educational content, manage student groups
- **Player**: Standard access, upload games, comment on hands
- **Kibbitzer**: View-only access, can comment but not upload

## User Preferences

Preferred communication style: Simple, everyday language.
User prefers MVP approach: Start simple and add features incrementally rather than building complex systems upfront.
User wants to track ideas and future enhancements systematically.
IMPORTANT: Always verify implementation requests before making changes to code - user wants brainstorming discussions completed before implementation begins.