# Multi-stage build for Rust backend and Next.js frontend
FROM rust:1.75-alpine AS rust-builder

# Install build dependencies
RUN apk add --no-cache musl-dev

# Set working directory
WORKDIR /app

# Copy Rust files
COPY Cargo.toml Cargo.lock ./
COPY src ./src

# Build Rust backend
RUN cargo build --release

# Node.js stage for frontend
FROM node:18-alpine AS node-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd frontend && npm install

# Copy frontend source
COPY frontend ./frontend

# Build frontend
RUN cd frontend && npm run build

# Final stage
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy Rust binary
COPY --from=rust-builder /app/target/release/markdown-preview-backend ./backend

# Copy frontend build
COPY --from=node-builder /app/frontend/.next ./frontend/.next
COPY --from=node-builder /app/frontend/public ./frontend/public
COPY --from=node-builder /app/frontend/package.json ./frontend/
COPY --from=node-builder /app/frontend/next.config.js ./frontend/

# Install frontend runtime dependencies
COPY --from=node-builder /app/frontend/node_modules ./frontend/node_modules

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Expose ports
EXPOSE 3001 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start command (backend only for now)
CMD ["./backend"] 