# Markdown Preview - Full Stack Application

A beautiful, real-time markdown preview editor built with Rust (Axum) backend and Next.js 15 frontend.

## Features

- ✨ **Real-time markdown preview**
- 🎨 **Beautiful syntax highlighting**
- 📱 **Responsive design**
- ⚡ **Fast rendering with Rust backend**
- 🔧 **Dark/Light mode toggle**
- 📤 **Export to PDF and Word**
- 🐳 **Docker support**
- 🚀 **Easy deployment**
- ☁️ **Dokploy compatible**

## Quick Start

### Using Deployment Script (Recommended)

The easiest way to deploy the entire application:

```bash
# Development environment
./deploy.sh dev

# Staging environment
./deploy.sh staging

# Production environment
./deploy.sh production

# Build only
./deploy.sh build

# Run tests
./deploy.sh test

# Check status
./deploy.sh status

# Cleanup
./deploy.sh cleanup
```

### Dokploy Deployment

For Dokploy deployment, set the environment variable and run:

```bash
# Enable Dokploy mode
export DOKPLOY_ENABLED=true
export DOKPLOY_APP_NAME=your-app-name
export DOKPLOY_DOMAIN=your-domain.com

# Deploy to production
./deploy.sh production
```

This will create a `dokploy.yaml` configuration file ready for deployment.

### Manual Setup

#### Prerequisites

- Rust (latest stable)
- Node.js 18+
- Docker & Docker Compose (optional for Dokploy)
- npm or yarn

#### Backend Setup

```bash
# Build and run backend
cargo build --release
cargo run
```

Backend will be available at `http://localhost:3001`

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

#### Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## Deployment Script Commands

| Command | Description |
|---------|-------------|
| `dev` | Start development servers (backend + frontend) |
| `staging` | Deploy to staging environment |
| `production` | Deploy to production environment |
| `build` | Build backend and frontend |
| `test` | Run all tests |
| `docker` | Build Docker images |
| `deploy` | Deploy with Docker Compose |
| `status` | Show deployment status |
| `cleanup` | Clean up build artifacts |

## Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Backend
RUST_LOG=info
RUST_ENV=production
BACKEND_PORT=3001

# Frontend
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3001
FRONTEND_PORT=3000

# Docker
DOCKER_REGISTRY=
DOCKER_IMAGE_TAG=latest

# Dokploy
DOKPLOY_ENABLED=false
DOKPLOY_APP_NAME=markdown-preview
DOKPLOY_DOMAIN=
```

## Dokploy Configuration

The project includes a `dokploy.yaml` file for easy deployment to Dokploy:

```yaml
app: markdown-preview
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
domains:
  - markdown-preview.dokploy.com
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/convert` - Convert markdown to HTML

## Project Structure

```
markdown-preview/
├── src/                    # Rust backend source
├── frontend/              # Next.js frontend
│   ├── app/              # App router pages
│   ├── components/       # React components
│   └── ...
├── docker-compose.yml    # Docker services
├── dokploy.yaml         # Dokploy configuration
├── deploy.sh            # Deployment script
├── nginx.conf           # Nginx configuration
└── ...
```

## Development

### Backend Development

```bash
# Run with hot reload
cargo watch -x run

# Run tests
cargo test

# Check formatting
cargo fmt

# Lint code
cargo clippy
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Docker Deployment

### Production Deployment

```bash
# Build and deploy
./deploy.sh production

# Or manually
docker-compose up --build -d
```

### Development with Docker

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up
```

## Monitoring

The application includes health checks and monitoring:

- Backend health: `http://localhost:3001/health`
- Frontend status: `http://localhost:3000`
- Docker status: `./deploy.sh status`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `./deploy.sh test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.