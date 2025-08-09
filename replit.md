# Overview

Pharma Express CI is a comprehensive pharmacy delivery platform designed for the Côte d'Ivoire market. The application enables users to upload prescription images, select pharmacies, place orders, and track real-time delivery of medications to their homes. Built as a Progressive Web App (PWA), it provides offline capabilities and mobile-first user experience with French language support.

# User Preferences

Preferred communication style: Simple, everyday language.
Deployment targets: Replit Deployments and Render
Repository: https://github.com/GIZETZ/Pharma-Express-CI.git

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom pharma-specific color variables
- **State Management**: TanStack Query for server state management
- **Forms**: React Hook Form with Zod validation
- **PWA Features**: Service worker for offline caching, push notifications, and app installation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints with standardized error handling
- **File Handling**: Multer for prescription image uploads with size and type validation
- **Middleware**: Request logging, JSON parsing, and CORS handling

## Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with schema-first approach
- **Offline Storage**: IndexedDB for client-side caching of pharmacies, orders, and user data
- **File Storage**: In-memory storage for development, extensible for cloud storage

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store
- **User Context**: Shared user state across client and server
- **Security**: Environment-based database credentials and secure session configuration

## External Dependencies
- **Database Hosting**: Neon PostgreSQL serverless database
- **Geolocation**: Browser Geolocation API for pharmacy proximity search
- **Camera Access**: MediaDevices API for prescription photo capture
- **Push Notifications**: Web Push API for order status updates
- **Maps Integration**: Ready for Google Maps or similar service integration
- **Image Processing**: Browser-based canvas manipulation for prescription image optimization
- **Development Tools**: Replit-specific plugins for runtime error handling and cartographer integration

## Key Design Patterns
- **Shared Schema**: Common TypeScript types between client and server using Drizzle schemas
- **Progressive Enhancement**: Core functionality works offline with enhanced features online
- **Mobile-First**: Responsive design optimized for mobile devices with touch-friendly interfaces
- **Internationalization Ready**: French language support with extensible language selection system
- **Real-time Updates**: Query invalidation and optimistic updates for seamless user experience

## Performance Optimizations
- **Code Splitting**: Vite-based bundling with automatic chunk splitting
- **Image Optimization**: Client-side image compression before upload
- **Caching Strategy**: Multi-level caching with IndexedDB and service worker
- **Lazy Loading**: Component-based code splitting for faster initial load times
- **Bundle Analysis**: Production build optimization with tree shaking and minification