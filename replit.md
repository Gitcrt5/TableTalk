# replit.md

## Overview

TableTalk is a bridge bidding practice and analysis application built with a modern full-stack TypeScript architecture. The application allows users to upload PBN (Portable Bridge Notation) files, practice bidding on real bridge hands, and engage with a community through comments and discussions. The system uses a React frontend with Express.js backend, PostgreSQL database with Drizzle ORM, and is designed for deployment on Replit.

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
- **Pages**: Dashboard, Browse Games, Game Detail, Practice, Not Found
- **Layout**: Header with navigation, Sidebar with filters and quick actions
- **Bridge-Specific**: Hand display, bidding table, bidding practice interface
- **Upload**: PBN file upload with drag-and-drop and progress tracking
- **Comments**: Threaded comment system with user interaction

### Backend Services
- **PBN Parser**: Extracts game and hand data from uploaded bridge notation files
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development
- **Route Handlers**: RESTful endpoints for games, hands, bidding, and comments

## Data Flow

1. **File Upload**: Users upload PBN files through the frontend interface
2. **Parsing**: Backend parses PBN content and extracts individual hands
3. **Storage**: Games and hands are stored in PostgreSQL with relationships
4. **Practice**: Users select hands for bidding practice with real-time feedback
5. **Community**: Users can comment on hands and view others' discussions
6. **Analytics**: System tracks bidding accuracy and provides progress statistics

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

Changelog:
- June 25, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.