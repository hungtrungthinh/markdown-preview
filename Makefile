.PHONY: help install dev build start clean test docker-build docker-run docker-dev

# Default target
help:
	@echo "Markdown Preview - Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  install    - Install all dependencies"
	@echo "  dev        - Start development servers (backend + frontend)"
	@echo "  dev-backend - Start only Rust backend"
	@echo "  dev-frontend - Start only Next.js frontend"
	@echo ""
	@echo "Build:"
	@echo "  build      - Build both backend and frontend"
	@echo "  build-backend - Build only Rust backend"
	@echo "  build-frontend - Build only Next.js frontend"
	@echo ""
	@echo "Production:"
	@echo "  start      - Start production servers"
	@echo "  start-backend - Start only backend in production"
	@echo "  start-frontend - Start only frontend in production"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run  - Run Docker container"
	@echo "  docker-dev  - Run development Docker container"
	@echo ""
	@echo "Utilities:"
	@echo "  clean      - Clean build artifacts"
	@echo "  test       - Run all tests"
	@echo "  test-backend - Run backend tests"
	@echo "  test-frontend - Run frontend tests"

# Install dependencies
install:
	@echo "Installing dependencies..."
	cd frontend && npm install
	@echo "Dependencies installed!"

# Development
dev:
	@echo "Starting development servers..."
	npm run dev

dev-backend:
	@echo "Starting Rust backend..."
	cargo run

dev-frontend:
	@echo "Starting Next.js frontend..."
	cd frontend && npm run dev

# Build
build:
	@echo "Building application..."
	cargo build --release
	cd frontend && npm run build
	@echo "Build complete!"

build-backend:
	@echo "Building Rust backend..."
	cargo build --release

build-frontend:
	@echo "Building Next.js frontend..."
	cd frontend && npm run build

# Production
start:
	@echo "Starting production servers..."
	npm run start

start-backend:
	@echo "Starting Rust backend in production..."
	cargo run --release

start-frontend:
	@echo "Starting Next.js frontend in production..."
	cd frontend && npm start

# Docker
docker-build:
	@echo "Building Docker image..."
	docker build -t markdown-preview .

docker-run:
	@echo "Running Docker container..."
	docker run -p 3000:3000 -p 3001:3001 markdown-preview

docker-dev:
	@echo "Running development Docker container..."
	docker-compose --profile dev up

# Utilities
clean:
	@echo "Cleaning build artifacts..."
	cargo clean
	cd frontend && rm -rf .next node_modules
	@echo "Clean complete!"

test:
	@echo "Running all tests..."
	cargo test
	cd frontend && npm test

test-backend:
	@echo "Running backend tests..."
	cargo test

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && npm test 