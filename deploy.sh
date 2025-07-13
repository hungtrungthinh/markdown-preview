#!/bin/bash

# Markdown Preview - Full Stack Deployment Script
# Compatible with Dokploy and other deployment platforms
# Deploys both Rust backend and Next.js frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Dokploy compatible
PROJECT_NAME="markdown-preview"
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-""}
DOCKER_IMAGE_TAG=${DOCKER_IMAGE_TAG:-"latest"}
NODE_ENV=${NODE_ENV:-"production"}
RUST_ENV=${RUST_ENV:-"production"}

# Dokploy specific variables
DOKPLOY_ENABLED=${DOKPLOY_ENABLED:-"false"}
DOKPLOY_APP_NAME=${DOKPLOY_APP_NAME:-"markdown-preview"}
DOKPLOY_DOMAIN=${DOKPLOY_DOMAIN:-""}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists cargo; then
        missing_deps+=("cargo")
    fi
    
    if ! command_exists node; then
        missing_deps+=("node")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    # Docker is optional for Dokploy
    if [ "$DOKPLOY_ENABLED" != "true" ]; then
        if ! command_exists docker; then
            missing_deps+=("docker")
        fi
        
        if ! command_exists docker-compose; then
            missing_deps+=("docker-compose")
        fi
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_status "Please install the missing dependencies and try again."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to build backend
build_backend() {
    print_status "Building Rust backend..."
    
    cd backend 2>/dev/null || cd .
    
    # Clean previous builds
    cargo clean
    
    # Build for release
    cargo build --release
    
    if [ $? -eq 0 ]; then
        print_success "Backend built successfully"
    else
        print_error "Backend build failed"
        exit 1
    fi
    
    cd ..
}

# Function to build frontend
build_frontend() {
    print_status "Building Next.js frontend..."
    
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Set environment for build
    export NODE_ENV=$NODE_ENV
    export NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-"http://localhost:${BACKEND_PORT}"}
    
    # Build for production
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Frontend built successfully"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    cd ..
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Backend tests
    print_status "Running backend tests..."
    cd backend 2>/dev/null || cd .
    cargo test
    cd ..
    
    # Frontend tests (if configured)
    if [ -f "frontend/package.json" ] && grep -q "\"test\":" frontend/package.json; then
        print_status "Running frontend tests..."
        cd frontend
        npm test --if-present
        cd ..
    fi
    
    print_success "All tests passed"
}

# Function to create Dokploy configuration
create_dokploy_config() {
    if [ "$DOKPLOY_ENABLED" = "true" ]; then
        print_status "Creating Dokploy configuration..."
        
        # Create dokploy.yaml
        cat > dokploy.yaml << EOF
app: ${DOKPLOY_APP_NAME}
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "${BACKEND_PORT}:${BACKEND_PORT}"
    environment:
      - RUST_LOG=info
      - RUST_ENV=${RUST_ENV}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${BACKEND_PORT}/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "${FRONTEND_PORT}:${FRONTEND_PORT}"
    environment:
      - NODE_ENV=${NODE_ENV}
      - NEXT_PUBLIC_API_URL=http://localhost:${BACKEND_PORT}
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${FRONTEND_PORT}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

domains:
  - ${DOKPLOY_DOMAIN:-"${DOKPLOY_APP_NAME}.dokploy.com"}

env:
  - NODE_ENV=${NODE_ENV}
  - RUST_ENV=${RUST_ENV}
  - BACKEND_PORT=${BACKEND_PORT}
  - FRONTEND_PORT=${FRONTEND_PORT}
EOF
        
        print_success "Dokploy configuration created"
    fi
}

# Function to build Docker images
build_docker_images() {
    print_status "Building Docker images..."
    
    # Build backend image
    docker build -t ${PROJECT_NAME}-backend:${DOCKER_IMAGE_TAG} -f Dockerfile .
    
    # Build frontend image
    docker build -t ${PROJECT_NAME}-frontend:${DOCKER_IMAGE_TAG} -f frontend/Dockerfile frontend/
    
    print_success "Docker images built successfully"
}

# Function to deploy with Docker Compose
deploy_docker_compose() {
    print_status "Deploying with Docker Compose..."
    
    # Stop existing containers
    docker-compose down
    
    # Build and start services
    docker-compose up --build -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Services deployed successfully"
        print_status "Backend: http://localhost:${BACKEND_PORT}"
        print_status "Frontend: http://localhost:${FRONTEND_PORT}"
    else
        print_error "Deployment failed"
        docker-compose logs
        exit 1
    fi
}

# Function to deploy to production
deploy_production() {
    print_status "Deploying to production..."
    
    # Check if environment file exists
    if [ ! -f ".env" ]; then
        print_warning "No .env file found. Creating from example..."
        cp env.example .env 2>/dev/null || true
    fi
    
    # Build everything
    build_backend
    build_frontend
    
    # Run tests
    run_tests
    
    # Create Dokploy config if enabled
    create_dokploy_config
    
    # Deploy based on platform
    if [ "$DOKPLOY_ENABLED" = "true" ]; then
        print_status "Deploying to Dokploy..."
        # Dokploy will handle the deployment
        print_success "Ready for Dokploy deployment"
    else
        # Deploy with Docker Compose
        deploy_docker_compose
    fi
    
    print_success "Production deployment completed"
}

# Function to deploy to staging
deploy_staging() {
    print_status "Deploying to staging..."
    
    # Use staging configuration
    export NODE_ENV=staging
    export RUST_ENV=staging
    
    deploy_production
    
    print_success "Staging deployment completed"
}

# Function to deploy to development
deploy_development() {
    print_status "Deploying to development..."
    
    # Use development configuration
    export NODE_ENV=development
    export RUST_ENV=development
    
    # Start development servers
    print_status "Starting development servers..."
    
    # Start backend in background
    cd backend 2>/dev/null || cd .
    cargo run &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend in background
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    print_success "Development servers started"
    print_status "Backend PID: $BACKEND_PID"
    print_status "Frontend PID: $FRONTEND_PID"
    print_status "Backend: http://localhost:${BACKEND_PORT}"
    print_status "Frontend: http://localhost:${FRONTEND_PORT}"
    
    # Wait for user to stop
    echo "Press Ctrl+C to stop development servers"
    trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    
    # Stop Docker containers
    docker-compose down 2>/dev/null || true
    
    # Remove old images
    docker image prune -f 2>/dev/null || true
    
    # Clean build artifacts
    cargo clean 2>/dev/null || true
    rm -rf frontend/.next 2>/dev/null || true
    rm -rf frontend/node_modules/.cache 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Function to show status
show_status() {
    print_status "Checking deployment status..."
    
    echo "=== Environment Variables ==="
    echo "NODE_ENV: $NODE_ENV"
    echo "RUST_ENV: $RUST_ENV"
    echo "BACKEND_PORT: $BACKEND_PORT"
    echo "FRONTEND_PORT: $FRONTEND_PORT"
    echo "DOKPLOY_ENABLED: $DOKPLOY_ENABLED"
    
    if [ "$DOKPLOY_ENABLED" != "true" ]; then
        echo -e "\n=== Docker Containers ==="
        docker-compose ps 2>/dev/null || echo "No Docker Compose services running"
    fi
    
    echo -e "\n=== Backend Health ==="
    curl -s http://localhost:${BACKEND_PORT}/health 2>/dev/null || echo "Backend not responding"
    
    echo -e "\n=== Frontend Status ==="
    curl -s -I http://localhost:${FRONTEND_PORT} 2>/dev/null | head -1 || echo "Frontend not responding"
    
    if [ "$DOKPLOY_ENABLED" != "true" ]; then
        echo -e "\n=== System Resources ==="
        docker stats --no-stream 2>/dev/null || echo "No containers running"
    fi
}

# Function to show help
show_help() {
    echo "Markdown Preview - Deployment Script (Dokploy Compatible)"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev          Deploy to development environment"
    echo "  staging      Deploy to staging environment"
    echo "  production   Deploy to production environment"
    echo "  build        Build backend and frontend"
    echo "  test         Run all tests"
    echo "  docker       Build Docker images"
    echo "  deploy       Deploy with Docker Compose"
    echo "  status       Show deployment status"
    echo "  cleanup      Clean up build artifacts and containers"
    echo "  help         Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BACKEND_PORT      Backend port (default: 3001)"
    echo "  FRONTEND_PORT     Frontend port (default: 3000)"
    echo "  NODE_ENV          Node environment (default: production)"
    echo "  RUST_ENV          Rust environment (default: production)"
    echo "  DOCKER_REGISTRY   Docker registry URL"
    echo "  DOCKER_IMAGE_TAG  Docker image tag (default: latest)"
    echo ""
    echo "Dokploy Variables:"
    echo "  DOKPLOY_ENABLED   Enable Dokploy mode (default: false)"
    echo "  DOKPLOY_APP_NAME  Dokploy app name (default: markdown-preview)"
    echo "  DOKPLOY_DOMAIN    Custom domain for Dokploy"
    echo ""
}

# Main script logic
main() {
    # Check prerequisites
    check_prerequisites
    
    # Parse command line arguments
    case "${1:-help}" in
        "dev")
            deploy_development
            ;;
        "staging")
            deploy_staging
            ;;
        "production")
            deploy_production
            ;;
        "build")
            build_backend
            build_frontend
            ;;
        "test")
            run_tests
            ;;
        "docker")
            build_docker_images
            ;;
        "deploy")
            deploy_docker_compose
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 