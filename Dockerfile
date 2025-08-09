# Multi-stage build pour optimiser la taille de l'image
FROM node:18-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY drizzle.config.ts ./

# Stage pour les dépendances
FROM base AS deps
RUN npm ci --only=production && npm ci --only=development

# Stage pour le build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build de l'application
RUN npm run build

# Stage final de production
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-client ./dist-client
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 10000

ENV PORT=10000

CMD ["npm", "run", "start"]