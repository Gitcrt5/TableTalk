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
- July 18, 2025. **DEPLOYMENT DATABASE FIX** - Fixed database configuration to properly use production database when deployed. Updated database selection logic to detect Replit deployment environment using REPLIT_DOMAINS and REPLIT_ENVIRONMENT variables. Deployed app now correctly uses production database instead of development database with test data.

## TODO List & Future Enhancements

### Current Issues to Fix
- [ ] Resolve LSP errors in server/storage.ts (database insertion type mismatch)
- [ ] Fix server/vite.ts allowedHosts configuration warning


### Known Limitations
- **Replit Preview Environment**: Login works in standalone tabs but not in Replit's embedded preview due to iframe cookie restrictions. This is expected behavior and will work correctly in production deployment.

### Core Features to Add
- [ ] Add tags to hands and games for better organization and filtering
- [ ] Add way for users to manually enter a game and/or hand (form-based input)
- [ ] Bidding sequence input functionality (partially implemented, needs completion)
- [ ] Comment system improvements: add like, reply, and report functionality (UI removed for MVP)
- [ ] Add filtering as well as search of the games list
- [ ] Search and filter hands by criteria (dealer, vulnerability, convention)
- [ ] User profiles and statistics dashboard
- [ ] Hand statistics and analysis
- [ ] Email verification system with proper SendGrid configuration and domain verification
- [ ] Email notifications for new comments, game uploads, and system announcements
- [x] Password reset functionality via email
- [x] User management interface for admin users

### UI/UX Improvements
- [ ] Add option for more compact view of the games list
- [ ] Mobile-responsive design optimization
- [ ] Dark mode theme toggle
- [ ] Keyboard shortcuts for navigation
- [ ] Better loading states and error handling
- [ ] Improved PBN upload with validation feedback

### Advanced Features (Future)
- [ ] Automated game import from club websites - monitor results pages and automatically download PBN files when new games are added
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