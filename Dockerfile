# ---- Build Stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --include=dev

# Copy schema and source files
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine

WORKDIR /app

# Set environment
ARG BUILD_ENV=production
ENV NODE_ENV=$BUILD_ENV

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy compiled build output
COPY --from=build /app/build ./build

EXPOSE 3000
CMD ["node", "build/index.js"]