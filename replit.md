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
The application uses four main entities:
- **Games**: Store uploaded PBN files with metadata (title, tournament, uploader)
- **Hands**: Individual bridge hands extracted from games (board number, cards, bidding)
- **UserBidding**: User practice attempts with accuracy scoring
- **Comments**: Community discussions on specific hands with user levels and likes

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

## Recent Changes

- June 25, 2025. Initial setup with full-featured bridge platform
- June 25, 2025. Simplified to MVP focusing on core features: games list, hands view, bidding input, and comments
- June 25, 2025. Enhanced UI with better hand display, improved search, and visual polish for better user experience
- June 25, 2025. Added PostgreSQL database integration with proper schema and migrations
- June 25, 2025. Fixed PBN parser validation to ensure actualBidding field is properly initialized for all hands
- June 25, 2025. Fixed hand display navigation and layout issues, made hand display more compact and consistent across screen sizes

## TODO List & Future Enhancements

### Current Issues to Fix
- [ ] Resolve LSP errors in server/storage.ts (database insertion type mismatch)
- [ ] Fix server/vite.ts allowedHosts configuration warning

### Core Features to Add
- [ ] Add tags to hands and games for better organization and filtering
- [ ] Add users with varying levels of ability (Admin, Teacher, Player, Kibbitzer)
- [ ] Bidding sequence input functionality (partially implemented, needs completion)
- [ ] Comment system improvements (likes, replies, user levels)
- [ ] Search and filter hands by criteria (dealer, vulnerability, convention)
- [ ] User authentication and profiles
- [ ] Hand statistics and analysis

### UI/UX Improvements
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