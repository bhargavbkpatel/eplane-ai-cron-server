FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl

COPY package*.json ./

# Install all dependencies including devDependencies
RUN npm ci --include=dev

# Copy source files
COPY . .

# Build the code
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Install production dependencies
RUN npm ci --omit=dev

# Environment variables (set these in ECS task definition)
ENV NODE_ENV production
ENV PORT 3000

EXPOSE ${PORT}

CMD ["node", "build/index.js"]