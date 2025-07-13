#!/bin/bash

# Markdown Preview Deployment Script
set -e

echo "🚀 Starting deployment..."

# Check if required tools are installed
command -v cargo >/dev/null 2>&1 || { echo "❌ Rust/Cargo is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

# Build backend
echo "🔨 Building Rust backend..."
cargo build --release

# Build frontend
echo "🔨 Building Next.js frontend..."
cd frontend
npm ci
npm run build
cd ..

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p deploy
cp target/release/markdown-preview-backend deploy/
cp -r frontend/.next deploy/frontend/
cp -r frontend/public deploy/frontend/
cp frontend/package.json deploy/frontend/
cp frontend/next.config.js deploy/frontend/

# Create startup script
cat > deploy/start.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

# Start backend
echo "Starting backend..."
./markdown-preview-backend &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend..."
sleep 3

# Start frontend
echo "Starting frontend..."
cd frontend
npm start &
FRONTEND_PID=$!

echo "✅ Markdown Preview is running!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
EOF

chmod +x deploy/start.sh

echo "✅ Deployment package created in 'deploy/' directory"
echo "To run the application:"
echo "  cd deploy && ./start.sh" 