# TableTalk Bridge Analysis Platform

## Overview

TableTalk is a comprehensive web platform for bridge players to create, analyze, and discuss bridge games. The platform supports both formal duplicate tournaments and casual bridge club sessions, offering tools for game management, board analysis, bidding practice, and community discussion. Built as a full-stack React application with Express backend, it emphasizes collaborative learning and educational analysis over competitive play.

## AI Agent Operating Instructions

### 1) Source of truth

- Always align code and migrations to the PRD file ""20250819 PRD 1.0_1755672507929.md"". If a proposed change conflicts with the PRD, prefer the PRD and open a TODO instead.

### 2) Architecture guardrails

- Keep the current stack: React TS + Vite + Tailwind + shadcn/ui, React Query, Wouter, React Hook Form + Zod, Express TS API, Supabase Postgres, Firebase Auth. Do not replace core libraries without an explicit design note.
- Use modular Express routes with centralized error handling and Firebase Admin token verification for protected endpoints.

### 3) MVP scope, what is allowed now

Implement or modify only these MVP capabilities:
- Firebase auth and user profiles
- Standalone game creation
- PBN upload and parsing into boards
- Board view with bidding entry and validation, results, partner comments
- Responsive mobile UI
Anything outside this list requires a feature flag or a TODO, not code, for now.

### 4) Data model invariants, never break

These constraints must remain true in migrations, queries, and UI logic:
- Event, Event Deals, Boards relationship: event deals are canonical, boards may reference an event deal or embed full hands for standalone games.
- Board uniqueness: board_number is unique per game.
- Participants: exactly one owner per game, a user appears at most once per game, identification via user_id or name or invite email is required.
- Soft deletion: use is_deleted flags or soft deletes where specified, do not hard delete user content by default.
- Privacy default for MVP: games private by default, no external visibility unless explicitly changed in later phases.

### 5) API surface to respect

- Follow the REST patterns defined in the PRD for users, games, boards, and PBN upload. Do not introduce breaking path changes. If adding fields, prefer backward-compatible extensions to request and response bodies.

### 6) Validation and error handling

- Validate all external inputs with Zod on both client and server boundaries. No silent failures, return structured errors the UI can display.

### 7) Performance and UX expectations

- Mobile-first, predictable controls, especially for the bidding pad and board entry screens.
- Use React Query for caching and background refetch, avoid N+1 fetch patterns and unbounded rerenders.

### 8) Security

- All protected endpoints must verify Firebase tokens server-side with Firebase Admin SDK, no client-only trust.

### 9) Change policy for schema or endpoints

Before editing schema or endpoints, the Agent must:
1. Point to the relevant PRD section that requires the change, and
2. Confirm the change does not violate the invariants in section 4 above.

### 10) Pre-commit checklist

- [ ] Change is within MVP scope in section 3
- [ ] No violation of data invariants in section 4
- [ ] API remains backward compatible with PRD contracts
- [ ] Inputs validated with Zod and errors user-friendly
- [ ] Mobile UX tested for bidding and board entry flows

### 11) Writing code

- CRITICAL: NEVER USE --no-verify WHEN COMMITTING CODE
- We prefer simple, clean, maintainable solutions over clever or complex ones, even if the latter are more concise or performant. Readability and maintainability are primary concerns.
- Make the smallest reasonable changes to get to the desired outcome. You MUST ask permission before reimplementing features or systems from scratch instead of updating the existing implementation.
- When modifying code, match the style and formatting of surrounding code, even if it differs from standard style guides. Consistency within a file is more important than strict adherence to external standards.
- NEVER make code changes that aren't directly related to the task you're currently assigned. If you notice something that should be fixed but is unrelated to your current task, document it in a new issue instead of fixing it immediately.
- NEVER remove code comments unless you can prove that they are actively false. Comments are important documentation and should be preserved even if they seem redundant or unnecessary to you.
- All code files should start with a brief 2 line comment explaining what the file does. Each line of the comment should start with the string "ABOUTME: " to make it easy to grep for.
- When writing comments, avoid referring to temporal context about refactors or recent changes. Comments should be evergreen and describe the code as it is, not how it evolved or was recently changed.
- NEVER implement a mock mode for testing or for any purpose. We always use real data and real APIs, never mock implementations.
- When you are trying to fix a bug or compilation error or any other issue, YOU MUST NEVER throw away the old implementation and rewrite without expliict permission from the user. If you are going to do this, YOU MUST STOP and get explicit permission from the user.
- NEVER name things as 'improved' or 'new' or 'enhanced', etc. Code naming should be evergreen. What is new someday will be "old" someday.

## User Preferences

Preferred communication style: Simple, everyday language.

### Getting help

- ALWAYS ask for clarification rather than making assumptions.
- If you're having trouble with something, it's ok to stop and ask for help. Especially if it's something your human might be better at.

## Testing

- Tests MUST cover the functionality being implemented.
- NEVER ignore the output of the system or the tests - Logs and messages often contain CRITICAL information.
- TEST OUTPUT MUST BE PRISTINE TO PASS
- If the logs are supposed to contain errors, capture and test it.
- NO EXCEPTIONS POLICY: Under no circumstances should you mark any test type as "not applicable". Every project, regardless of size or complexity, MUST have unit tests, integration tests, AND end-to-end tests. If you believe a test type doesn't apply, you need the human to say exactly "I AUTHORIZE YOU TO SKIP WRITING TESTS THIS TIME"

### We practice TDD. That means:

- Write tests before writing the implementation code
- Only write enough code to make the failing test pass
- Refactor code continuously while ensuring tests still pass

#### TDD Implementation Process

- Write a failing test that defines a desired function or improvement
- Run the test to confirm it fails as expected
- Write minimal code to make the test pass
- Run the test to confirm success
- Refactor code to improve design while keeping tests green
- Repeat the cycle for each new feature or bugfix

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern component-based UI using functional components and hooks
- **Vite Build System**: Fast development and optimized production builds
- **Tailwind CSS + shadcn/ui**: Utility-first styling with professional component library
- **React Query (@tanstack/react-query)**: Server state management and caching
- **Wouter**: Lightweight client-side routing
- **React Hook Form + Zod**: Type-safe form validation and management

### Backend Architecture
- **Express.js with TypeScript**: RESTful API server with middleware-based request handling
- **Supabase Client**: Direct database operations using Supabase's JavaScript client
- **Firebase Authentication**: User authentication and authorization using Firebase Admin SDK
- **PBN File Parser**: Custom parser for Portable Bridge Notation files to import bridge deals
- **Modular Route Structure**: Organized API endpoints with centralized error handling
- 
### Database Design
- **PostgreSQL with Supabase**: Cloud-hosted PostgreSQL database with built-in authentication and real-time features
- **TypeScript Interfaces**: Type-safe schema definitions with Zod validation
- **Core Entities**: Users, Games, Boards, Events, Comments, Partnerships
- **Shared Event Model**: Events contain canonical deal data referenced by multiple games
- **Flexible Participation**: Support for both formal tournaments and casual sessions

### Authentication & Authorization
- **Firebase Auth Integration**: Google OAuth and other providers
- **Firebase Admin SDK**: Production-ready server-side token verification using service account
- **Secure Token Validation**: Real Firebase token verification with signature validation
- **User Management**: Automatic user creation and profile management with comprehensive error handling
- **Protected Routes**: Enhanced middleware-based authentication for API endpoints

### File Processing
- **PBN File Upload**: Support for bridge deal import via Portable Bridge Notation format
- **File Validation**: Type and size restrictions with drag-and-drop interface
- **Deal Parsing**: Conversion of PBN data into structured bridge hands and metadata

### State Management
- **React Query**: Server state caching and synchronization
- **Local Component State**: React hooks for UI state management
- **Context Providers**: Authentication and theme context across components

## External Dependencies

### Core Infrastructure
- **Supabase**: PostgreSQL hosting with authentication, real-time features, and connection pooling
- **Firebase**: Authentication services and user management
- **Google Cloud Storage**: File upload and storage capabilities
- **Vite**: Development server and build tooling
- **Replit**: Development environment with runtime error handling

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives via shadcn/ui
- **Lucide React**: Icon library for consistent UI elements
- **PostCSS**: CSS processing with Tailwind integration

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundling for production
- **Drizzle Kit**: Database migrations and schema management
- **Zod**: Runtime type validation for forms and API data

### File Processing
- **PBN File Upload**: Support for bridge deal import via Portable Bridge Notation format
- **File Validation**: Type and size restrictions with drag-and-drop interface
- **Deal Parsing**: Conversion of PBN data into structured bridge hands and metadata
- **Google Cloud Storage**: Secure file storage and retrieval
- **Uppy Integration**: Modern file upload UI with progress tracking

### Bridge-Specific Features
- **PBN Parser**: Custom implementation for bridge deal file format
- **Bridge Notation**: Support for standard bridge terminology and symbols
- **Hand Analysis**: Tools for calculating high card points and deal evaluation
