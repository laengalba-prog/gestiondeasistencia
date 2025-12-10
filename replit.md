# La Engalba Class Management System

## Overview

La Engalba is a class management system for a ceramics studio that offers two types of classes: "torno" (pottery wheel) and "modelado" (modeling). The application enables students to view and book available classes while allowing administrators to manage class schedules, monitor enrollment, and track student bookings.

The system is built as a full-stack web application with a React-based frontend using shadcn/ui components and an Express backend with session-based authentication. The application features a dual-interface design - one for students to manage their class bookings and another for administrators to oversee the entire class schedule.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**UI Component Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The design system follows the "new-york" style variant with a custom color palette reflecting the La Engalba brand identity (purple #B5AAD2, orange #EE7D2D, green tones #376953 and #14A781).

**Routing**: Client-side routing implemented with Wouter, a lightweight routing library. The application has three main routes:
- `/` - Home/login page
- `/alumno` - Student dashboard (protected route)
- `/admin` - Admin dashboard (protected route, admin-only)

**State Management**: TanStack Query (React Query) for server state management with custom query client configuration. Authentication state is managed through a React Context provider (`AuthContext`) that wraps the entire application.

**Component Structure**:
- Presentational components (`AdminCalendar`) handle calendar display with day-view for student management
- Container components (`StudentDashboard`, `AdminDashboard`) manage business logic and data fetching
- Dialog components (`ChangePasswordDialog`) handle password changes for authenticated users
- Admin Dashboard includes:
  - **Calendar View**: Interactive month/year calendar with click-to-view students for each day
  - **Gestión de Estudiantes**: Click any date to see all students for that day organized by time slot and type (Torno/Modelado)
  - **Sincronización Supabase**: Manual sync button to reload student data from Supabase (handles email updates and new student registration)
  - **Días Festivos**: Mark dates when no classes are scheduled
  - **Distribución por Grupos**: Shows distribution of students across class groups (identified by day + time, e.g., "martes 17", "martes 19") with equity metrics
- Student Dashboard includes:
  - **Cambiar Contraseña**: Dialog to change account password securely (validates current password, confirms new password matches)
  - Weekly and monthly calendar views for booking classes
- Layout components (`Navigation`, `Footer`) provide consistent UI structure
- Form components (`LoginForm`) handle user authentication

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js.

**Authentication & Sessions**: Express-session with in-memory session storage (MemoryStore). Sessions persist for 30 days and store user identity (userId, userName, userEmail, userRole). Password hashing uses bcryptjs with 10 salt rounds.

**Middleware Layers**:
- `attachUser`: Populates request object with user data from session
- `requireAuth`: Ensures user is authenticated before accessing protected routes
- `requireAdmin`: Verifies user has admin role, reloading user data to prevent privilege escalation

**API Design**: RESTful API endpoints organized by resource:
- `/api/auth/*` - Authentication (login, register, logout, session check)
- `/api/classes/*` - Class management (CRUD operations)
- `/api/bookings/*` - Booking management (create, cancel, status updates)

**Data Storage**: In-memory storage implementation (`MemStorage` class) that maintains three separate data structures (users, classes, bookings) using JavaScript Maps. The storage layer implements an `IStorage` interface that defines contracts for all data operations, making it straightforward to swap in a database implementation later.

**Development vs Production**: Two separate entry points:
- `server/index-dev.ts`: Integrates Vite middleware for hot module replacement
- `server/index-prod.ts`: Serves pre-built static assets from dist folder

### Data Schema

**Database ORM**: Drizzle ORM configured for PostgreSQL with schema definitions in TypeScript.

**Core Tables**:
1. **users** - Stores user accounts with name, email, hashed password, and role (student/admin)
2. **classes** - Defines class sessions with type (torno/modelado), start time, capacity (7 for torno, 3 for modelado), and current enrollment count
3. **bookings** - Links users to classes with status tracking (active, cancelled, recovery) and timestamps

**Validation**: Zod schemas generated from Drizzle table definitions ensure type safety and runtime validation for all data mutations.

**Referential Integrity**: Foreign key constraints link bookings to both users and classes, maintaining data consistency.

### Design System

**Typography**: Montserrat font family with system fallbacks, using standardized text size classes (text-xs through text-3xl) for consistent hierarchy.

**Spacing System**: Tailwind spacing units (2, 4, 8, 12, 16, 20) create visual rhythm. Component padding defaults to p-4 or p-8, with section spacing using mb-8 or mb-12.

**Color Semantics**:
- Primary (green #14A781): Available/libre classes
- Secondary (orange #EE7D2D): Booked/ocupada classes  
- Chart-1 (dark green #376953): Recovery/recuperar classes
- Background (light purple #E0D0E7): Page background matching brand
- Muted (purple #B5AAD2): Navigation and UI chrome

**Interactive States**: Custom utility classes provide visual feedback:
- `hover-elevate`: Subtle shadow on hover
- `active-elevate-2`: Stronger shadow on click
- Shadow system uses rgba opacity levels for depth

## External Dependencies

### UI Component Libraries
- **@radix-ui/react-***: Headless UI primitives for accessible components (dialogs, dropdowns, tooltips, etc.)
- **shadcn/ui**: Pre-built component system combining Radix UI with Tailwind styling
- **lucide-react**: Icon library for consistent iconography
- **class-variance-authority**: Type-safe variant API for component styling
- **tailwindcss**: Utility-first CSS framework with custom configuration

### Data Fetching & State
- **@tanstack/react-query**: Server state management with caching and automatic refetching
- **wouter**: Lightweight client-side routing (~1.2KB)

### Forms & Validation
- **react-hook-form**: Performant form state management with minimal re-renders
- **@hookform/resolvers**: Integration layer for validation libraries
- **zod**: TypeScript-first schema validation
- **drizzle-zod**: Auto-generates Zod schemas from Drizzle ORM definitions

### Database & ORM
- **drizzle-orm**: TypeScript ORM for type-safe database queries
- **@neondatabase/serverless**: Serverless PostgreSQL driver optimized for edge environments
- **drizzle-kit**: CLI for database migrations and schema management

### Authentication
- **bcryptjs**: Password hashing and comparison (pure JavaScript implementation)
- **express-session**: Session middleware for Express
- **connect-pg-simple**: PostgreSQL session store (alternative to in-memory storage)
- **memorystore**: Memory-based session store with automatic cleanup

### Development Tools
- **vite**: Fast development server with hot module replacement
- **@vitejs/plugin-react**: Vite plugin for React with Fast Refresh
- **tsx**: TypeScript execution for Node.js development
- **esbuild**: Production bundler for server code
- **@replit/vite-plugin-***: Replit-specific development enhancements (error overlay, dev banner, cartographer)

### Date/Time Handling
- **date-fns**: Utility library for date manipulation and formatting (used for class scheduling)

### Utilities
- **clsx**: Conditional className utility
- **tailwind-merge**: Merge Tailwind classes without conflicts
- **nanoid**: Secure random ID generation