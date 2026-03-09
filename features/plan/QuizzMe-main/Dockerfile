FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
# Use npm ci for reliable builds
RUN npm ci
COPY . .
# Run build (server mode)
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install Python and dependencies for CosmicEngine
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install pyswisseph (required by CosmicEngine)
# using --break-system-packages because we are in a container/venv isolation isn't strictly needed for this single pkg
RUN pip3 install pyswisseph --break-system-packages

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create directory for Ephemeris files (to be mounted via volume)
RUN mkdir -p /app/ephe
ENV SE_EPHE_PATH=/app/ephe

EXPOSE 3000
CMD ["node", "server.js"]
