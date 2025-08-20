# TableTalk Bridge Analysis Platform

## Overview

TableTalk is a comprehensive web platform for bridge players to create, analyze, and discuss bridge games. The platform supports both formal duplicate tournaments and casual bridge club sessions, offering tools for game management, board analysis, bidding practice, and community discussion. Built as a full-stack React application with Express backend, it emphasizes collaborative learning and educational analysis over competitive play.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Firebase Authentication**: User authentication and authorization using Firebase Admin SDK
- **PBN File Parser**: Custom parser for Portable Bridge Notation files to import bridge deals
- **Modular Route Structure**: Organized API endpoints with centralized error handling

### Database Design
- **PostgreSQL with Neon**: Cloud-hosted PostgreSQL database
- **Drizzle Schema**: Type-safe schema definitions with relations
- **Core Entities**: Users, Games, Boards, Events, Comments, Partnerships
- **Shared Event Model**: Events contain canonical deal data referenced by multiple games
- **Flexible Participation**: Support for both formal tournaments and casual sessions

### Authentication & Authorization
- **Firebase Auth Integration**: Google OAuth and other providers
- **JWT Token Validation**: Server-side token verification with Firebase Admin SDK
- **User Management**: Automatic user creation and profile management
- **Protected Routes**: Middleware-based authentication for API endpoints

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
- **Neon Database**: PostgreSQL hosting with connection pooling
- **Firebase**: Authentication services and user management
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

### File Handling
- **Google Cloud Storage**: File upload and storage capabilities
- **Uppy**: File upload UI components with progress tracking
- **WebSocket Support**: Real-time features via ws library

### Bridge-Specific Features
- **PBN Parser**: Custom implementation for bridge deal file format
- **Bridge Notation**: Support for standard bridge terminology and symbols
- **Hand Analysis**: Tools for calculating high card points and deal evaluation