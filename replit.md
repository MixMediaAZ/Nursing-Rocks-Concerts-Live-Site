# Nursing Rocks! Concert Series Platform

## Overview

This is a full-stack web application for the Nursing Rocks! Concert Series, a music platform designed to celebrate nursing professionals across America. The platform features concert listings, nurse license verification, gallery management, and an e-commerce store. It's built with React on the frontend and Express.js on the backend, using PostgreSQL for data storage.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state, Zustand for client state
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Theme**: Vibrant color scheme with medical/nursing-inspired design tokens

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **File Storage**: Local file system with Multer for uploads
- **API Design**: RESTful API endpoints with validation using express-validator

### Build System
- **Build Tool**: Vite for frontend bundling
- **Development**: Hot module replacement with Vite dev server
- **Production**: ESBuild for backend bundling
- **TypeScript**: Full TypeScript support across frontend and backend

## Key Components

### Core Features
1. **Concert Management**: Event listings with artist information, venues, and ticket sales
2. **Nurse Verification**: License validation system for verified nurse benefits
3. **Gallery System**: Image and video management with admin controls
4. **E-commerce Store**: Product catalog with CustomCat API integration
5. **User Management**: Registration, authentication, and profile management
6. **Admin Panel**: Content management with real-time editing capabilities

### Database Schema
- **Events**: Concert information with artist relationships
- **Artists**: Performer details with social media links
- **Users**: Account management with role-based permissions
- **Nurse Licenses**: Verification data for healthcare professionals
- **Gallery**: Media assets with folder organization
- **Store Products**: E-commerce inventory with external API integration
- **Orders**: Transaction records and order management

### Authentication System
- JWT tokens for session management
- Role-based access control (admin, verified nurse, regular user)
- License verification workflow for nurse benefits
- Password hashing with bcrypt

### Media Management
- Local file upload system with Multer
- Image processing with Sharp
- Cloudinary integration for video content
- Gallery organization with folder structure
- Admin-controlled image replacement system

## Data Flow

1. **User Registration**: Users create accounts and optionally verify nursing licenses
2. **Content Management**: Admins manage events, artists, and gallery content
3. **Nurse Verification**: License validation through external APIs
4. **E-commerce**: Product sync with CustomCat API for merchandise
5. **Media Handling**: File uploads processed and stored locally or on Cloudinary

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL for production data storage
- **CDN**: Cloudinary for video content delivery
- **E-commerce**: CustomCat API for product fulfillment
- **Payments**: Stripe integration for transaction processing
- **Fonts**: Google Fonts (Montserrat, Open Sans, Poppins)

### Development Tools
- **Database Management**: Drizzle Kit for schema management
- **Type Safety**: Zod for runtime validation
- **Code Quality**: TypeScript strict mode enabled
- **Asset Processing**: Sharp for image optimization

## Deployment Strategy

### Production Setup
- **Frontend**: Static files served from `/dist/public`
- **Backend**: Express server running on Node.js
- **Database**: PostgreSQL connection via environment variables
- **Environment**: Configuration through environment variables
- **Build Process**: Vite for frontend, ESBuild for backend

### Development Environment
- **Hot Reload**: Vite dev server with HMR
- **Database**: Development database with seed data
- **File Watching**: tsx for TypeScript execution
- **API Testing**: Built-in development endpoints

### Configuration
- Database URL must be provided via `DATABASE_URL` environment variable
- Optional integrations controlled through environment variables
- Theme configuration via `theme.json` file
- TypeScript path mapping for clean imports

## Changelog

Changelog:
- July 08, 2025. Initial setup
- July 08, 2025. Enhanced mobile responsiveness across all pages: improved button sizing, text scaling, container padding, grid layouts, and table responsiveness for mobile devices

## User Preferences

Preferred communication style: Simple, everyday language.