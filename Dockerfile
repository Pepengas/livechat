# Base image
FROM node:18-alpine AS base
ENV NODE_OPTIONS="--max-old-space-size=512"
WORKDIR /app

# Install root dependencies
FROM base AS deps
COPY package.json ./
COPY package-lock.json* ./
RUN npm install --no-audit --no-fund --prefer-offline

# Build client
FROM base AS client-builder
WORKDIR /app
COPY client ./client
WORKDIR /app/client
RUN npm install --no-audit --no-fund --prefer-offline
# Disable ESLint during production build to prevent warnings from failing CI
RUN CI=false DISABLE_ESLINT_PLUGIN=true npm run build

# Setup server
FROM base AS server-setup
WORKDIR /app
COPY server ./server
WORKDIR /app/server
RUN npm install --no-audit --no-fund --prefer-offline

# Final stage
FROM base AS runner
COPY package.json ./
COPY --from=client-builder /app/client/build ./client/build
COPY --from=server-setup /app/server ./server
WORKDIR /app/server
RUN npm install --production --no-audit --no-fund --prefer-offline

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the app
CMD ["node", "server.js"]