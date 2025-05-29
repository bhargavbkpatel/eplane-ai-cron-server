FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy schema and source files
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

# Copy package files and install only production deps
COPY package*.json ./
RUN npm ci --omit=dev
    
# Copy prisma schema and run prisma generate
COPY prisma ./prisma
RUN npx prisma generate

# Copy built app
COPY --from=build /app/build ./build

# Set environment
ENV NODE_ENV=production

EXPOSE 3000

# Start server
CMD ["node", "build/index.js"]