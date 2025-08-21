# Dockerfile simplifié pour Render
FROM node:20-slim

WORKDIR /app

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm install --production=false

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Exposer le port
EXPOSE 10000

ENV NODE_ENV=production
ENV PORT=10000

# Démarrer l'application
CMD ["npm", "run", "start"]