# StyleSheet - Excel-like Spreadsheet Builder

## Overview

StyleSheet is a web-based spreadsheet application that provides Excel-like functionality with advanced customization capabilities. The application features a compact header with essential controls (selection, merge, and font tools), a central spreadsheet grid, and a right sidebar with advanced features (colors, formulas, bulk operations). This layout allows users to efficiently create, customize, and manipulate spreadsheet data with quick access to frequently-used controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server for fast HMR and optimized production builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and data fetching

**UI Component System**
- **Shadcn UI** (New York style) as the foundational component library built on Radix UI primitives
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Class Variance Authority (CVA)** for component variant management
- Custom design system following Material Design principles with Google Sheets/Notion visual patterns

**State Management Pattern**
- Local component state using React hooks (useState, useRef, useEffect)
- Lifted state pattern for shared data between SpreadsheetGrid and ControlPanel
- No global state management library; relies on prop drilling and composition

**Key Frontend Features**
1. **Compact Header**: Two-row header with frequently-used controls
   - Row 1: App branding, spreadsheet name input, download, and theme toggle
   - Row 2: Select All, Retain Selection, Merge/Unmerge buttons, and Font controls (size, weight)
2. **Spreadsheet Grid**: Interactive cell grid with selection, editing, and drag functionality
3. **Control Sidebar**: Right panel with advanced features
   - Undo/Redo operations
   - Color picker for cell customization
   - Formula system with built-in and custom formulas
   - Input/Output selection tools
   - Bulk value operations
4. **Cell Customization**: Color, font size, font weight controls
5. **Formula System**: Built-in formulas (SUM, AVERAGE, COUNT, MIN, MAX, MULTIPLY) with custom formula support
6. **Bulk Operations**: Text area-based bulk value input with configurable separators
7. **Input/Output Selection**: Temporary and permanent cell selection mechanisms
8. **Resizable Grid**: Column and row resizing capabilities
9. **Cell Merging**: Merge cells with rowspan/colspan support, preserving original cell data for unmerge operations
10. **Enhanced Paste**: Copy/paste from Excel and Google Sheets with full formatting retention
    - Preserves merged cells (rowspan/colspan)
    - Maintains row heights and column widths
    - HTML parsing with proper colspan alignment
    - Bounds checking for merged cells to prevent overflow
    - Full undo/redo support for structural changes
11. **Theme Support**: Light/dark mode toggle with localStorage persistence
12. **Performance Optimizations**: React.memo with custom comparator for efficient rendering of 5,200 cells

### Backend Architecture

**Server Framework**
- **Express.js** as the HTTP server framework
- **TypeScript** for type-safe server-side code
- Middleware-based request/response pipeline with custom logging

**Development Setup**
- Vite middleware integration for HMR in development
- Separate build process: Vite for client, esbuild for server
- Environment-aware configuration (NODE_ENV)

**Storage Layer**
- **In-memory storage** (MemStorage class) as the default implementation
- Abstract IStorage interface for future database integration
- Prepared for database migration with Drizzle ORM configuration

**API Structure**
- RESTful API pattern with `/api` prefix
- Centralized error handling middleware
- JSON request/response format

### Data Storage Solutions

**Current Implementation**
- In-memory Map-based storage for user data
- No persistence; data resets on server restart
- Suitable for development and prototyping

**Prepared Database Schema**
- **Drizzle ORM** configured with PostgreSQL dialect
- **Neon Database** serverless PostgreSQL (@neondatabase/serverless)
- Schema defined in `shared/schema.ts` with users table
- Migration setup ready in `drizzle.config.ts`

**Data Models**
- User model with id, username, password fields
- Zod schema validation for type-safe data insertion
- Shared types between client and server via `@shared` path alias

### Design System

**Typography**
- Primary: Inter (UI elements, buttons, labels)
- Monospace: JetBrains Mono (cell addresses, formulas)
- Font hierarchy: 11px-16px range with weight variations

**Color System**
- HSL-based color tokens for theme flexibility
- Separate light/dark mode palettes
- CSS custom properties for dynamic theming
- Professional blue primary, purple accent colors

**Spacing & Layout**
- Tailwind spacing units (2, 4, 8, 12, 16)
- Consistent padding and margin patterns
- Micro-spacing for cell interiors

**Component Patterns**
- Elevation system using rgba overlays (--elevate-1, --elevate-2)
- Border intensity calculations for button states
- Hover and active state elevations

## External Dependencies

### UI & Styling
- **Radix UI** (@radix-ui/*): Comprehensive set of unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with PostCSS
- **Lucide React**: Icon library
- **Class Variance Authority**: Type-safe component variants
- **Embla Carousel**: Carousel/slider functionality

### Forms & Validation
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Validation resolvers
- **Zod**: Schema validation with Drizzle integration (drizzle-zod)

### Data & State
- **TanStack Query**: Server state and data fetching
- **Drizzle ORM**: Type-safe SQL ORM with PostgreSQL support
- **Neon Database**: Serverless PostgreSQL database

### Development Tools
- **Vite Plugins**: 
  - @replit/vite-plugin-runtime-error-modal
  - @replit/vite-plugin-cartographer (dev only)
  - @replit/vite-plugin-dev-banner (dev only)
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for server code

### Date & Utilities
- **date-fns**: Date manipulation library
- **cmdk**: Command menu interface
- **nanoid**: Unique ID generation

### Server
- **Express**: Web application framework
- **connect-pg-simple**: PostgreSQL session store (prepared for sessions)
- **Drizzle Kit**: Database migration tool

### Fonts (External CDN)
- Google Fonts: Inter, JetBrains Mono (loaded via link tags in HTML)