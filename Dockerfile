# Base image
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json ./
RUN npm install

# Build client
FROM deps AS client-builder
COPY client ./client
WORKDIR /app/client
RUN npm install
RUN npm run build

# Setup server
FROM deps AS server-setup
COPY server ./server
WORKDIR /app/server
RUN npm install

# Final stage
FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=client-builder /app/client/build ./client/build
COPY --from=server-setup /app/server ./server
COPY package.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the app
CMD ["npm", "start"]