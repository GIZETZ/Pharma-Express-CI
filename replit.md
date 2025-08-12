# Overview

Pharma Express CI is a comprehensive pharmacy delivery platform designed for the Côte d'Ivoire market. The application enables users to upload prescription images, select pharmacies, place orders, and track real-time delivery of medications to their homes. Built as a Progressive Web App (PWA), it provides offline capabilities and mobile-first user experience with French language support.

# User Preferences

Preferred communication style: Simple, everyday language.
Deployment: Ready for both Replit and Render platforms with optimized production configurations.
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
- **Database**: Firebase Firestore (primary) with PostgreSQL fallback support
- **Schema Management**: TypeScript schemas with Zod validation for both Firebase and PostgreSQL
- **Storage Interface**: Unified IStorage interface supporting multiple backends
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

## Deployment Configuration

### Production Ready Features
- **Multi-Platform**: Configured for both Replit Deployments and Render
- **Environment Management**: Secure environment variable handling with `.env.example`
- **Health Monitoring**: `/api/health` endpoint for service monitoring
- **Security**: Production-ready session management and HTTPS configuration
- **Container Support**: Optimized Dockerfile with multi-stage builds
- **Auto-scaling**: Render configuration supports automatic scaling

### Deployment Files Created
- `render.yaml` - Render service configuration
- `Dockerfile` - Container deployment setup
- `build.sh` - Production build script
- `start.sh` - Production startup script
- `README_DEPLOYMENT.md` - Quick deployment guide
- `DEPLOYMENT.md` - Comprehensive deployment documentation

### Recent Changes (January 2025)
- ✅ Migration from Replit Agent to standard Replit environment completed (January 12, 2025)
- ✅ **SECURITY ENHANCEMENT**: Patient-controlled delivery confirmation system (January 12, 2025)
  - Removed delivery person's ability to mark orders as delivered
  - Only patients can now confirm delivery completion via new API endpoint
  - Added `/api/orders/:orderId/confirm-delivery` endpoint with ownership validation
- ✅ **PRIVACY PROTECTION**: Medical confidentiality for delivery personnel (January 12, 2025)  
  - Medication names are now hidden from delivery persons
  - Delivery dashboard shows only order count and total amount
  - Protects patient medical privacy during delivery process
- ✅ Enhanced delivery workflow security with role-based restrictions
- ✅ Updated delivery tracking page with patient confirmation interface
- ✅ Fixed delivery order display issue in livreur dashboard (January 12, 2025)
- ✅ Corrected getDeliveryOrders filter to include 'delivered' status orders
- ✅ Fixed assignDeliveryPerson to maintain proper status flow
- ✅ Added test delivery orders for dashboard testing
- ✅ Improved data enrichment for delivery orders with pharmacy and patient info
- ✅ Critical API parameter bug fixed in order validation system
- ✅ Pharmacy profile edit button issue resolved (DOM manipulation error)
- ✅ Event handlers improved with race condition prevention 
- ✅ Production deployment configurations added for Render
- ✅ Environment variable management implemented
- ✅ Database URL configuration externalized and secured
- ✅ Production host binding configured (0.0.0.0 for containers)
- ✅ Security enhancements for production deployment
- ✅ Database credentials secured via environment variables (no hardcoded URLs)
- ✅ Replit Secrets integration for sensitive data protection
- ✅ User's Neon PostgreSQL database integrated with secure secret management
- ✅ Firebase integration completed (January 10, 2025)
- ✅ Migration from PostgreSQL/Neon to Firebase Firestore
- ✅ Firebase Authentication and Firestore database operational
- ✅ Dual storage system (Firebase/Memory) with automatic selection
- ✅ Real pharmacy account creation system implemented
- ✅ Pharmacy profile management page with full configuration options
- ✅ New pharmacy account: Pharmacie Centrale Plus (+225 05 44 33 22 / pharma2024)