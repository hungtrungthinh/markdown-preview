# Multi-stage build for Rust backend and Next.js frontend

# Stage 1: Build Rust backend
FROM rust:1.75-slim as backend-builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

# Stage 2: Build Next.js frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend ./
RUN npm run build

# Stage 3: Production image
FROM debian:bookworm-slim

# Install necessary packages
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -r -s /bin/false app

# Set working directory
WORKDIR /app

# Copy backend binary
COPY --from=backend-builder /app/target/release/markdown-preview-backend /app/backend

# Copy frontend build
COPY --from=frontend-builder /app/.next /app/frontend/.next
COPY --from=frontend-builder /app/public /app/frontend/public
COPY --from=frontend-builder /app/package*.json /app/frontend/
COPY --from=frontend-builder /app/node_modules /app/frontend/node_modules

# Copy startup script
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Change ownership
RUN chown -R app:app /app

# Switch to app user
USER app

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the application
ENTRYPOINT ["/app/docker-entrypoint.sh"] 