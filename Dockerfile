# Dockerfile
# Use official Node 20 LTS image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Use a smaller Node image for production
FROM node:20-alpine AS runner
WORKDIR /app

# Copy only the necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

# Set environment variables (you can override in docker-compose)
ENV NODE_ENV=production
ENV DATABASE_URL="file:./prisma/store.db"

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]