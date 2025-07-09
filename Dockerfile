# Base image
FROM node:18-alpine AS base
WORKDIR /app

# Install root dependencies
FROM base AS deps
COPY package.json ./
COPY package-lock.json* ./
RUN npm ci

# Build client
FROM base AS client-builder
WORKDIR /app
COPY client ./client
WORKDIR /app/client
COPY client/package.json ./
COPY client/package-lock.json* ./
RUN npm ci
RUN npm run build

# Setup server
FROM base AS server-setup
WORKDIR /app
COPY server ./server
WORKDIR /app/server
COPY server/package.json ./
COPY server/package-lock.json* ./
RUN npm ci

# Final stage
FROM base AS runner
COPY package.json ./
COPY --from=client-builder /app/client/build ./client/build
COPY --from=server-setup /app/server ./server
WORKDIR /app/server
RUN npm ci --production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the app
CMD ["node", "server.js"]