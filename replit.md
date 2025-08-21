# Overview

Pharma Express CI is a comprehensive pharmacy delivery platform for the Côte d'Ivoire market. It enables users to upload prescription images, select pharmacies, place orders, and track real-time medication deliveries. Built as a Progressive Web App (PWA), it offers offline capabilities and a mobile-first user experience with French language support.

# User Preferences

Preferred communication style: Simple, everyday language.
Deployment: Ready for both Replit and Render platforms with optimized production configurations.
Deployment targets: Replit Deployments and Render
Repository: https://github.com/GIZETZ/Pharma-Express-CI.git

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **Routing**: Wouter
- **UI Components**: Radix UI primitives with shadcn/ui
- **Styling**: Tailwind CSS with custom pharma-specific colors
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **PWA Features**: Service worker for offline caching, push notifications, and app installation

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints
- **File Handling**: Multer for prescription image uploads
- **Middleware**: Request logging, JSON parsing, CORS handling

## Data Storage Solutions
- **Database**: Firebase Firestore (primary) with PostgreSQL fallback
- **Schema Management**: TypeScript schemas with Zod validation
- **Storage Interface**: Unified IStorage interface for multiple backends
- **Offline Storage**: IndexedDB for client-side caching
- **File Storage**: In-memory for development, extensible for cloud

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store
- **User Context**: Shared user state across client and server
- **Security**: Environment-based database credentials and secure session configuration

## Key Design Patterns
- **Shared Schema**: Common TypeScript types between client and server
- **Progressive Enhancement**: Core functionality works offline with enhanced online features
- **Mobile-First**: Responsive design optimized for mobile devices
- **Internationalization Ready**: French language support
- **Real-time Updates**: Query invalidation and optimistic updates

## Performance Optimizations
- **Code Splitting**: Vite-based bundling
- **Image Optimization**: Client-side image compression
- **Caching Strategy**: Multi-level caching with IndexedDB and service worker
- **Lazy Loading**: Component-based code splitting

## Deployment Configuration
- **Multi-Platform**: Configured for Replit Deployments and Render
- **Environment Management**: Secure environment variable handling
- **Health Monitoring**: `/api/health` endpoint
- **Security**: Production-ready session management and HTTPS
- **Container Support**: Optimized Dockerfile with multi-stage builds

# External Dependencies

- **Database Hosting**: Neon PostgreSQL serverless database
- **Geolocation**: Browser Geolocation API
- **Camera Access**: MediaDevices API
- **Push Notifications**: Web Push API
- **Maps Integration**: Ready for Google Maps or similar service
- **Image Processing**: Browser-based canvas manipulation
- **Development Tools**: Replit-specific plugins

## Recent Changes and Improvements

### GPS Tracking and Communication System (August 19, 2025)
- ✅ **Enhanced Delivery Tracking System**
  - Fixed Leaflet map initialization issues with proper error handling and DOM ready checks
  - Enhanced delivery tracking simulation to work with all order statuses (preparing, ready_for_delivery, in_transit, in_delivery)
  - Added real-time delivery person position simulation with route calculation using OSRM API
  - Implemented functional call and SMS buttons with proper phone number handling (`tel:` and `sms:` URL schemes)
  - Added comprehensive debug mode (development only) for GPS tracking troubleshooting
  - Enhanced visual feedback with delivery person status indicators and route information
  - Improved map markers with custom icons for user, delivery person, and pharmacy locations
  - Added real-time route calculation with distance and ETA updates every 3 seconds
  - Resolved map rendering errors by adding timeout delay for DOM ready state

### Order Status Flow Optimization (August 18, 2025)
- ✅ **Fixed Rejected Delivery Assignment Flow**
  - Corrected critical issue where rejected or expired delivery assignments returned to "En préparation" status
  - Modified PostgresStorage methods to use 'ready_for_delivery' instead of 'preparing' for rejected orders
  - Prevents pharmacists from repeating the entire preparation process
  - Orders now stay at "Prête pour la livraison" status and can be immediately reassigned
  - Significantly improved workflow efficiency and reduced pharmacist workload

### Comprehensive Driver Identification System (August 19, 2025)
- ✅ **Complete Driver Profile Management**
  - Expanded database schema with delivery_profiles and delivery_vehicles tables
  - Driver profile photos prominently displayed to patients for easy identification
  - Vehicle license plates shown in large, highly visible text (CI-2578-AB format)
  - Complete vehicle information including type, brand, model, and color
  - Functional call and SMS buttons for direct driver communication
  - API endpoints for retrieving comprehensive driver information
  - Test data: Jean-Claude Koffi with red Yamaha DT 125 motorcycle

### Automatic Database Backup & Recovery System (August 19, 2025)
- ✅ **Zero-Loss Data Protection**
  - Automatic database integrity verification on every server startup
  - Intelligent detection of empty or corrupted databases
  - Complete data restoration including users, pharmacies, driver profiles, and test orders
  - Pre-configured test accounts for immediate functionality (password: 123456)
  - Full driver profiles with photos, vehicle details, and license plates
  - Seamless recovery without manual intervention required
  - Comprehensive documentation in DATABASE_BACKUP_GUIDE.md

### Replit Environment Migration (August 20, 2025)
- ✅ **Successful Migration from Replit Agent to Replit Environment**
  - Fixed missing tsx dependency causing build failures
  - Resolved database schema issues with missing delivery_profiles and delivery_vehicles tables
  - Pushed database migrations successfully using drizzle-kit
  - Enhanced pharmacy profile edit functionality with robust error handling
  - Added comprehensive error boundaries and safety checks for production stability
  - Fixed button click issues that caused blank pages in production environments
  - Improved data validation and fallback mechanisms for better user experience
  - Application now runs cleanly on Replit with full functionality restored